import { Router, Request, Response, NextFunction } from 'express';
import { optionalAuth } from '../middleware/auth';
import * as aiService from '../services/aiService';
import { sendSuccess, sendError } from '../utils/response';
import { ErrorCode } from '../types';

const router = Router();

// 可选认证：有 token 则注入 req.user，无 token 也能继续
router.use(optionalAuth);

/**
 * GET /api/chat/sessions — 对话历史列表
 */
router.get('/sessions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      sendSuccess(res, []);
      return;
    }
    const sessions = await aiService.getSessions(req.user.userId);
    sendSuccess(res, sessions);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/chat/sessions — 创建新对话
 */
router.post('/sessions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      sendError(res, ErrorCode.UNAUTHORIZED, '请先登录', 401);
      return;
    }
    const title = req.body.title || '新对话';
    const session = await aiService.createSession(req.user.userId, title);
    sendSuccess(res, session, '对话已创建', 201);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/chat/sessions/:id — 获取对话消息列表
 */
router.get('/sessions/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const messages = await aiService.getSessionMessages(req.params.id);
    sendSuccess(res, messages);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/chat — 发送消息（SSE 流式返回 AI 回复）
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      sendError(res, ErrorCode.UNAUTHORIZED, '请先登录', 401);
      return;
    }

    const { message, sessionId } = req.body;

    if (!message) {
      sendError(res, ErrorCode.VALIDATION_ERROR, '消息不能为空', 400);
      return;
    }

    let session = sessionId;

    // 如果没有 sessionId，创建新会话
    if (!session) {
      const newSession = await aiService.createSession(
        req.user.userId,
        aiService.generateSessionTitle(message),
      );
      session = newSession.id;
    }

    // 保存用户消息
    await aiService.saveMessage(session, 'user', message);

    // 设置 SSE 响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    // 返回 sessionId 给前端
    res.write(`data: ${JSON.stringify({ type: 'session', sessionId: session })}\n\n`);

    // 构造消息
    const messages = await aiService.buildMessages(req.user.userId, session);

    // 调用 DeepSeek stream API
    const deepseekRes = await aiService.streamChat(messages);

    if (!deepseekRes.body) {
      throw new Error('No response body from DeepSeek');
    }

    let fullContent = '';
    const reader = deepseekRes.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter((line) => line.startsWith('data: '));

        for (const line of lines) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') {
            res.write('data: [DONE]\n\n');
            break;
          }

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content || '';

            if (content) {
              fullContent += content;
              res.write(`data: ${JSON.stringify({ type: 'token', content })}\n\n`);
            }
          } catch {
            // skip unparseable lines
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    // 保存 AI 回复
    if (fullContent) {
      await aiService.saveMessage(session, 'assistant', fullContent);
      // 更新会话标题
      await aiService.updateSessionTitle(session, message);
    }

    res.end();
  } catch (err) {
    // SSE 模式下，错误也通过 SSE 发送
    if (!res.headersSent) {
      next(err);
    } else {
      const errorMsg = err instanceof Error ? err.message : '未知错误';
      res.write(`data: ${JSON.stringify({ type: 'error', message: errorMsg })}\n\n`);
      res.end();
    }
  }
});

export default router;
