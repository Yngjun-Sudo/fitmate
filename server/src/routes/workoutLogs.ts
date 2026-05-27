import { Router, Request, Response, NextFunction } from 'express';
import { optionalAuth } from '../middleware/auth';
import * as workoutService from '../services/workoutService';
import { sendSuccess, sendError } from '../utils/response';
import { ErrorCode } from '../types';

const router = Router();

// 可选认证：有 token 则注入 req.user，无 token 也能继续
router.use(optionalAuth);

/**
 * GET /api/workout-logs — 训练记录列表
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      sendSuccess(res, { items: [], total: 0, page: 1, pageSize: 20, totalPages: 0 });
      return;
    }
    const { date, from, to, page, pageSize } = req.query;
    const result = await workoutService.getLogsByUserId(req.user.userId, {
      date: date as string | undefined,
      from: from as string | undefined,
      to: to as string | undefined,
      page: page ? parseInt(page as string, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize as string, 10) : undefined,
    });
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/workout-logs — 创建训练记录
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      sendError(res, ErrorCode.UNAUTHORIZED, '请先登录', 401);
      return;
    }
    const log = await workoutService.createLog(req.user.userId, req.body);
    sendSuccess(res, log, '训练记录已保存', 201);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/workout-logs/:id — 训练记录详情
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const log = await workoutService.getLogById(req.params.id);
    if (!log) {
      sendError(res, ErrorCode.NOT_FOUND, '训练记录不存在', 404);
      return;
    }
    sendSuccess(res, log);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/workout-logs/:id — 更新训练记录
 */
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      sendError(res, ErrorCode.UNAUTHORIZED, '请先登录', 401);
      return;
    }
    const log = await workoutService.updateLog(req.params.id, req.user.userId, req.body);
    sendSuccess(res, log, '训练记录已更新');
  } catch (err) {
    next(err);
  }
});

export default router;
