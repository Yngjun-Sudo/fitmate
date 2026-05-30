/**
 * Chat Routes - AI chat with SSE streaming
 * Implements /api/chat/* endpoints
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { AIService, createAIService, ChatMessage } from '../services/aiService';
import { authMiddleware } from '../middleware/auth';

const chatRouter = new Hono();

/**
 * POST /api/chat/message
 * Send message to AI with SSE streaming response
 */
chatRouter.post(
  '/message',
  authMiddleware,
  zValidator(
    'json',
    z.object({
      message: z.string().min(1),
      conversation_id: z.number().optional(),
      stream: z.boolean().default(true),
    })
  ),
  async (c) => {
    const user = c.get('user');
    const { message, conversation_id, stream } = c.req.valid('json');

    try {
      const aiService = createAIService(c.env);
      const db = c.env.DB;

      // Get or create conversation
      let chatSessionId = conversation_id;
      if (!chatSessionId) {
        const session = await db
          .prepare(
            'INSERT INTO chat_sessions (user_id, title) VALUES (?, ?) RETURNING id'
          )
          .bind(user.userId, message.slice(0, 50))
          .first<{ id: number }>();
        chatSessionId = session?.id;
      }

      if (!chatSessionId) {
        return c.json(
          { code: 500, data: null, message: 'Failed to create conversation' },
          500
        );
      }

      // Save user message
      await db
        .prepare(
          'INSERT INTO chat_messages (session_id, role, content) VALUES (?, ?, ?)'
        )
        .bind(chatSessionId, 'user', message)
        .run();

      // Get conversation history
      const historyMessages = await db
        .prepare(
          'SELECT role, content FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC LIMIT 20'
        )
        .bind(chatSessionId)
        .all<{ role: string; content: string }>();

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
        ...historyMessages.results.map((m) => ({
          role: m.role as ChatMessage['role'],
          content: m.content,
        })),
        { role: 'user', content: message },
      ];

      // If streaming is requested, return SSE stream
      if (stream) {
        try {
          const aiStream = await aiService.createChatCompletion(
            messages,
            aiService.getAvailableTools(),
            (chunk) => {
              // Chunk received, will be forwarded by transform stream
            }
          );

          // Return the stream directly from aiService
          return new Response(aiStream, {
            headers: {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive',
              'X-Accel-Buffering': 'no',
            },
          });
        } catch (error) {
          console.error('Stream error:', error);
          return c.json(
            { code: 500, data: null, message: error instanceof Error ? error.message : 'Stream error' },
            500
          );
        }
      }

      // Non-streaming response
      const response = await fetch(
        `${c.env.DEEPSEEK_BASE_URL}/chat/completions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${c.env.DEEPSEEK_API_KEY}`,
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

      const aiResponse = await response.json<{
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
      }>();

      const assistantMessage = aiResponse.choices[0].message;
      let responseContent = assistantMessage.content || '';

      // Handle tool calls
      if (
        assistantMessage.tool_calls &&
        assistantMessage.tool_calls.length > 0
      ) {
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

        // Save tool results and get final response
        // (In practice, you'd make another API call with tool results)
        responseContent = 'Function executed. ' + JSON.stringify(toolResults);
      }

      // Save assistant response
      await db
        .prepare(
          'INSERT INTO chat_messages (session_id, role, content) VALUES (?, ?, ?)'
        )
        .bind(chatSessionId, 'assistant', responseContent)
        .run();

      return c.json({
        code: 0,
        data: {
          message: responseContent,
          conversation_id: chatSessionId,
        },
        message: 'Message sent successfully',
      });
    } catch (error) {
      console.error('Chat error:', error);
      return c.json(
        {
          code: 500,
          data: null,
          message:
            error instanceof Error ? error.message : 'Internal server error',
        },
        500
      );
    }
  }
);

/**
 * GET /api/chat/conversations
 * Get user's chat conversations
 */
chatRouter.get('/conversations', authMiddleware, async (c) => {
  const user = c.get('user');
  const db = c.env.DB;

  try {
    const sessions = await db
      .prepare(
        `SELECT s.id, s.title, s.created_at, s.updated_at,
                COUNT(m.id) as message_count
         FROM chat_sessions s
         LEFT JOIN chat_messages m ON s.id = m.session_id
         WHERE s.user_id = ?
         GROUP BY s.id
         ORDER BY s.updated_at DESC
         LIMIT 50`
      )
      .bind(user.userId)
      .all();

    return c.json({
      code: 0,
      data: sessions.results,
      message: 'Conversations retrieved successfully',
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    return c.json(
      { code: 500, data: null, message: 'Internal server error' },
      500
    );
  }
});

/**
 * GET /api/chat/conversations
 * Get messages in a conversation
 */
chatRouter.get('/conversations/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  const sessionId = parseInt(c.req.param('id'));
  const db = c.env.DB;

  try {
    // Verify session belongs to user
    const session = await db
      .prepare('SELECT id FROM chat_sessions WHERE id = ? AND user_id = ?')
      .bind(sessionId, user.userId)
      .first();

    if (!session) {
      return c.json(
        { code: 404, data: null, message: 'Conversation not found' },
        404
      );
    }

    const messages = await db
      .prepare(
        'SELECT id, role, content, created_at FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC'
      )
      .bind(sessionId)
      .all();

    return c.json({
      code: 0,
      data: messages.results,
      message: 'Messages retrieved successfully',
    });
  } catch (error) {
    console.error('Get messages error:', error);
    return c.json(
      { code: 500, data: null, message: 'Internal server error' },
      500
    );
  }
});

/**
 * DELETE /api/chat/conversations
 * Delete a conversation
 */
chatRouter.delete('/conversations/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  const sessionId = parseInt(c.req.param('id'));
  const db = c.env.DB;

  try {
    // Verify session belongs to user
    const session = await db
      .prepare('SELECT id FROM chat_sessions WHERE id = ? AND user_id = ?')
      .bind(sessionId, user.userId)
      .first();

    if (!session) {
      return c.json(
        { code: 404, data: null, message: 'Conversation not found' },
        404
      );
    }

    // Delete messages first (foreign key constraint)
    await db
      .prepare('DELETE FROM chat_messages WHERE session_id = ?')
      .bind(sessionId)
      .run();

    // Delete session
    await db
      .prepare('DELETE FROM chat_sessions WHERE id = ?')
      .bind(sessionId)
      .run();

    return c.json({
      code: 0,
      data: null,
      message: 'Conversation deleted successfully',
    });
  } catch (error) {
    console.error('Delete conversation error:', error);
    return c.json(
      { code: 500, data: null, message: 'Internal server error' },
      500
    );
  }
});

export default chatRouter;
