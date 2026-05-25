import { Router, Request, Response, NextFunction } from 'express';
import * as exerciseService from '../services/exerciseService';
import { sendSuccess, sendError } from '../utils/response';
import { ErrorCode } from '../types';

const router = Router();

/**
 * GET /api/exercises — 动作列表
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, muscle, search, page, pageSize } = req.query;
    const result = await exerciseService.getExercises({
      category: category as string | undefined,
      muscle: muscle as string | undefined,
      search: search as string | undefined,
      page: page ? parseInt(page as string, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize as string, 10) : undefined,
    });
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/exercises/:id — 动作详情
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const exercise = await exerciseService.getExerciseById(req.params.id);
    if (!exercise) {
      sendError(res, ErrorCode.NOT_FOUND, '动作不存在', 404);
      return;
    }
    sendSuccess(res, exercise);
  } catch (err) {
    next(err);
  }
});

export default router;
