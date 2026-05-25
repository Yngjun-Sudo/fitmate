import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middleware/auth';
import * as workoutService from '../services/workoutService';
import { sendSuccess } from '../utils/response';

const router = Router();

// 所有训练记录路由都需要认证
router.use(authMiddleware);

/**
 * GET /api/workout-logs — 训练记录列表
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { date, from, to, page, pageSize } = req.query;
    const result = await workoutService.getLogsByUserId(req.user!.userId, {
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
    const log = await workoutService.createLog(req.user!.userId, req.body);
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
    const log = await workoutService.updateLog(req.params.id, req.user!.userId, req.body);
    sendSuccess(res, log, '训练记录已更新');
  } catch (err) {
    next(err);
  }
});

export default router;
