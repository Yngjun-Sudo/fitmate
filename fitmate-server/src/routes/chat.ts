/**
 * Chat Routes - AI chat with SSE streaming
 * Adapted for Cloudflare Workers + D1
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { createAIService } from '../services/aiService';
import { authMiddleware } from '../middleware/auth';
import { sendSuccess, sendError } from '../utils/response';
import type { ChatMessage, Tool } from '../services/aiService';

const app = new Hono<{ Bindings: any; Variables: { user?: any } }>();

/**
 * POST /api/chat/message
 * Send message to AI with SSE streaming response
 */
app.post(
  '/message',
  authMiddleware,
  zValidator('json', z.object({
    message: z.string().min(1),
    conversation_id: z.string().optional(),
    stream: z.boolean().default(true),
  })),
  async (c) => {
    const user = c.get('user');
    const { message, conversation_id, stream } = c.req.valid('json');

    try {
      const aiService = createAIService(c.env as { DEEPSEEK_API_KEY: string; DEEPSEEK_BASE_URL: string });
      const db = (c.env as any).DB;

      // Get or create conversation
      let chatSessionId = conversation_id;

      if (!chatSessionId) {
        const sessionResult = await db.prepare(
          'INSERT INTO chat_sessions (user_id, title) VALUES (?, ?) RETURNING id'
        ).bind(user.userId, message.slice(0, 50)).first();
        chatSessionId = (sessionResult as any)?.id;
      }

      if (!chatSessionId) {
        return sendError(c, 500, 'Failed to create conversation');
      }

      // Save user message
      await db.prepare(
        'INSERT INTO chat_messages (session_id, role, content) VALUES (?, ?, ?)'
      ).bind(chatSessionId, 'user', message).run();

      // Get conversation history (last 20 messages)
      const historyResult = await db.prepare(
        'SELECT role, content FROM chat_messages WHERE session_id = ? ORDER BY created_at DESC LIMIT 20'
      ).bind(chatSessionId).all();

      const historyMessages = (historyResult as any).results || [];
      historyMessages.reverse();

      // Build messages for AI
      const messages: ChatMessage[] = [
        {
          role: 'system',
          content: `You are FitMate, an AI fitness assistant. You help users with:
- Creating workout plans
- Logging workouts
- Searching exercises
- Providing fitness advice

Use the available tools to help users achieve their fitness goals. Be encouraging and motivational.`,
        },
        ...historyMessages.map((m: any) => ({
          role: m.role as ChatMessage['role'],
          content: m.content,
        })),
        { role: 'user', content: message },
      ];

      // If streaming is requested, return SSE stream
      if (stream) {
        try {
          const requestBody = {
            model: 'deepseek-chat',
            messages,
            temperature: 0.7,
            max_tokens: 2000,
            stream: true,
            tools: aiService.getAvailableTools(),
            tool_choice: 'auto',
          };

          const aiResponse = await fetch(`${c.env.DEEPSEEK_BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${c.env.DEEPSEEK_API_KEY}`,
            },
            body: JSON.stringify(requestBody),
          });

          if (!aiResponse.ok) {
            const errorText = await aiResponse.text();
            throw new Error(`DeepSeek API error: ${aiResponse.status} ${errorText}`);
          }

          if (!aiResponse.body) {
            throw new Error('Response body is null');
          }

          // Process SSE stream and save to database
          let buffer = '';
          const decoder = new TextDecoder();
          let fullResponse = '';

          const transformStream = new TransformStream<Uint8Array, Uint8Array>({
            transform(chunk, controller) {
              buffer += decoder.decode(chunk, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6);

                  if (data === '[DONE]') {
                    controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
                    controller.terminate();
                    return;
                  }

                  try {
                    const parsed = JSON.parse(data);
                    const content = parsed.choices?.[0]?.delta?.content || '';

                    if (content) {
                      fullResponse += content;
                    }

                    // Forward chunk to client
                    controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`));
                  } catch (e) {
                    console.error('SSE parse error:', e);
                    // Skip malformed chunks
                  }
                }
              }
            },

            async flush(controller) {
              // Save assistant response to database
              if (fullResponse) {
                try {
                  await db.prepare(
                    'INSERT INTO chat_messages (session_id, role, content) VALUES (?, ?, ?)'
                  ).bind(chatSessionId, 'assistant', fullResponse).run();
                } catch (e) {
                  console.error('Failed to save assistant message:', e);
                }
              }

              if (buffer) {
                controller.enqueue(new TextEncoder().encode(buffer));
              }
              controller.terminate();
            },
          });

          return new Response(aiResponse.body.pipeThrough(transformStream), {
            headers: {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive',
              'X-Accel-Buffering': 'no',
            },
          });
        } catch (error) {
          console.error('Streaming error:', error);
          return sendError(c, 500, error instanceof Error ? error.message : 'Streaming error');
        }
      }

      // Non-streaming response
      const response = await fetch(
        `${c.env.DEEPSEEK_BASE_URL}/chat/completions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${c.env.DEEPSEEK_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages,
            temperature: 0.7,
            max_tokens: 2000,
            tools: aiService.getAvailableTools(),
            tool_choice: 'auto',
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`DeepSeek API error: ${response.status} ${errorText}`);
      }

      const aiResponse = await response.json() as {
        choices: Array<{
          message: {
            content: string;
            tool_calls?: Array<{
              id: string;
              function: { name: string; arguments: string };
            }>;
          };
          finish_reason: string;
        }>;
      };

      const assistantMessage = aiResponse.choices[0].message;
      let responseContent = assistantMessage.content || '';

      // Handle tool calls
      if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
        const toolResults = [];
        for (const toolCall of assistantMessage.tool_calls) {
          try {
            const args = JSON.parse(toolCall.function.arguments);
            const result = await aiService.executeFunction(
              toolCall.function.name,
              args,
              db,
              user.userId
            );
            toolResults.push({
              tool_call_id: toolCall.id,
              role: 'tool',
              name: toolCall.function.name,
              content: result,
            });
          } catch (error) {
            console.error('Tool execution error:', error);
            toolResults.push({
              tool_call_id: toolCall.id,
              role: 'tool',
              name: toolCall.function.name,
              content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            });
          }
        }

        // Make another API call with tool results for final response
        const finalResponse = await fetch(
          `${c.env.DEEPSEEK_BASE_URL}/chat/completions`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${c.env.DEEPSEEK_API_KEY}`,
            },
            body: JSON.stringify({
              model: 'deepseek-chat',
              messages: [
                ...messages,
                { role: 'assistant', content: responseContent, tool_calls: assistantMessage.tool_calls },
                ...toolResults,
              ],
              temperature: 0.7,
              max_tokens: 2000,
            }),
          }
        );

        if (finalResponse.ok) {
          const finalData = await finalResponse.json() as any;
          responseContent = finalData.choices?.[0]?.message?.content || 'Function executed successfully.';
        } else {
          responseContent = `Function executed. Results: ${JSON.stringify(toolResults)}`;
        }
      }

      // Save assistant response
      await db.prepare(
        'INSERT INTO chat_messages (session_id, role, content) VALUES (?, ?, ?)'
      ).bind(chatSessionId, 'assistant', responseContent).run();

      return sendSuccess(c, {
        message: responseContent,
        conversation_id: chatSessionId,
      }, 'Message sent successfully');

    } catch (error) {
      console.error('Chat error:', error);
      return sendError(c, 500, error instanceof Error ? error.message : 'Internal server error');
    }
  }
);

/**
 * GET /api/chat/conversations
 * Get user's chat conversations
 */
app.get('/conversations', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const db = (c.env as any).DB;

    const sessions = await db.prepare(
      `SELECT s.id, s.title, s.created_at, s.updated_at,
              COUNT(m.id) as message_count
       FROM chat_sessions s
       LEFT JOIN chat_messages m ON s.id = m.session_id
       WHERE s.user_id = ?
       GROUP BY s.id
       ORDER BY s.updated_at DESC
       LIMIT 50`
    ).bind(user.userId).all();

    return sendSuccess(c, (sessions as any).results || [], 'Conversations retrieved successfully');
  } catch (error) {
    console.error('Get conversations error:', error);
    return sendError(c, 500, 'Internal server error');
  }
});

/**
 * GET /api/chat/conversations/:id
 * Get messages in a conversation
 */
app.get('/conversations/:id', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const sessionId = c.req.param('id');
    const db = (c.env as any).DB;

    // Verify session belongs to user
    const session = await db.prepare('SELECT id FROM chat_sessions WHERE id = ? AND user_id = ?')
      .bind(sessionId, user.userId).first();

    if (!session) {
      return sendError(c, 404, 'Conversation not found');
    }

    const messages = await db.prepare(
      'SELECT id, role, content, created_at FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC'
    ).bind(sessionId).all();

    return sendSuccess(c, (messages as any).results || [], 'Messages retrieved successfully');
  } catch (error) {
    console.error('Get messages error:', error);
    return sendError(c, 500, 'Internal server error');
  }
});

/**
 * DELETE /api/chat/conversations/:id
 * Delete a conversation
 */
app.delete('/conversations/:id', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const sessionId = c.req.param('id');
    const db = (c.env as any).DB;

    // Verify session belongs to user
    const session = await db.prepare('SELECT id FROM chat_sessions WHERE id = ? AND user_id = ?')
      .bind(sessionId, user.userId).first();

    if (!session) {
      return sendError(c, 404, 'Conversation not found');
    }

    // Delete messages first (foreign key constraint)
    await db.prepare('DELETE FROM chat_messages WHERE session_id = ?').bind(sessionId).run();

    // Delete session
    await db.prepare('DELETE FROM chat_sessions WHERE id = ?').bind(sessionId).run();

    return sendSuccess(c, null, 'Conversation deleted successfully');
  } catch (error) {
    console.error('Delete conversation error:', error);
    return sendError(c, 500, 'Internal server error');
  }
});

export default app;
