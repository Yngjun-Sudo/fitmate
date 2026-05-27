import { Router, Request, Response, NextFunction } from 'express';
import { optionalAuth } from '../middleware/auth';
import * as workoutService from '../services/workoutService';
import { sendSuccess, sendError } from '../utils/response';
import { ErrorCode } from '../types';

const router = Router();

// 可选认证：有 token 则注入 req.user，无 token 也能继续
router.use(optionalAuth);

/**
 * GET /api/workout-plans — 当前用户的计划列表
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      sendSuccess(res, { items: [], total: 0, page: 1, pageSize: 20, totalPages: 0 });
      return;
    }
    const plans = await workoutService.getPlansByUserId(req.user.userId);
    sendSuccess(res, plans);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/workout-plans — 创建新计划
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      sendError(res, ErrorCode.UNAUTHORIZED, '请先登录', 401);
      return;
    }
    const plan = await workoutService.createPlan(req.user.userId, req.body);
    sendSuccess(res, plan, '计划创建成功', 201);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/workout-plans/:id — 计划详情
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const plan = await workoutService.getPlanById(req.params.id);
    if (!plan) {
      sendError(res, ErrorCode.NOT_FOUND, '计划不存在', 404);
      return;
    }
    sendSuccess(res, plan);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/workout-plans/:id — 更新计划
 */
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      sendError(res, ErrorCode.UNAUTHORIZED, '请先登录', 401);
      return;
    }
    const plan = await workoutService.updatePlan(req.params.id, req.user.userId, req.body);
    sendSuccess(res, plan, '计划已更新');
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/workout-plans/:id — 删除计划
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      sendError(res, ErrorCode.UNAUTHORIZED, '请先登录', 401);
      return;
    }
    await workoutService.deletePlan(req.params.id, req.user.userId);
    sendSuccess(res, null, '计划已删除');
  } catch (err) {
    next(err);
  }
});

export default router;
