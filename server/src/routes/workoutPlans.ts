import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middleware/auth';
import * as workoutService from '../services/workoutService';
import { sendSuccess } from '../utils/response';
import { ErrorCode } from '../types';

const router = Router();

// 所有训练计划路由都需要认证
router.use(authMiddleware);

/**
 * GET /api/workout-plans — 当前用户的计划列表
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const plans = await workoutService.getPlansByUserId(req.user!.userId);
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
    const plan = await workoutService.createPlan(req.user!.userId, req.body);
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
    const plan = await workoutService.updatePlan(req.params.id, req.user!.userId, req.body);
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
    await workoutService.deletePlan(req.params.id, req.user!.userId);
    sendSuccess(res, null, '计划已删除');
  } catch (err) {
    next(err);
  }
});

export default router;
