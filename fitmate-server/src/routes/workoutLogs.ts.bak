import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import * as workoutService from '../services/workoutService';
import { jsonValidate, paramValidate } from '../utils/validator';
import { WorkoutLogSchema } from '../types';
import { authMiddleware } from '../middleware/auth';
import type { Env, JwtPayload } from '../types';

const workoutLogRouter = new Hono<{ Bindings: Env; Variables: { user?: JwtPayload } }>();

/**
 * GET /api/workout-logs - 获取训练日志列表
 */
workoutLogRouter.get('/', authMiddleware, async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ code: 401, data: null, message: '未认证' }, 401);
  }

  const startDate = c.req.query('start_date') || undefined;
  const endDate = c.req.query('end_date') || undefined;
  const planId = c.req.query('plan_id') || undefined;
  const limit = parseInt(c.req.query('limit') || '20', 10);
  const offset = parseInt(c.req.query('offset') || '0', 10);

  const logs = await workoutService.getWorkoutLogs(c.env, user.userId, {
    startDate,
    endDate,
    planId,
    limit,
    offset,
  });

  return c.json({ code: 0, data: logs });
});

/**
 * GET /api/workout-logs/:id - 获取训练日志详情
 */
workoutLogRouter.get('/:id', authMiddleware, paramValidate(z.object({ id: z.string() })), async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ code: 401, data: null, message: '未认证' }, 401);
  }

  const { id } = c.req.valid('param');
  const log = await workoutService.getWorkoutLogById(c.env, id, user.userId);

  if (!log) {
    return c.json({ code: 404, data: null, message: '日志不存在' }, 404);
  }

  return c.json({ code: 0, data: log });
});

/**
 * POST /api/workout-logs - 创建训练日志
 */
workoutLogRouter.post('/', authMiddleware, jsonValidate(WorkoutLogSchema), async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ code: 401, data: null, message: '未认证' }, 401);
  }

  const data = c.req.valid('json');
  const log = await workoutService.createWorkoutLog(c.env, user.userId, data);

  return c.json({ code: 0, data: log, message: '创建成功' }, 201);
});

/**
 * PUT /api/workout-logs/:id - 更新训练日志
 */
workoutLogRouter.put('/:id', authMiddleware, jsonValidate(WorkoutLogSchema.partial()), async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ code: 401, data: null, message: '未认证' }, 401);
  }

  const { id } = c.req.param();
  const data = c.req.valid('json');
  
  try {
    const log = await workoutService.updateWorkoutLog(c.env, id, user.userId, data);
    return c.json({ code: 0, data: log, message: '更新成功' });
  } catch (err: any) {
    if (err.message.includes('不存在') || err.message.includes('无权')) {
      return c.json({ code: 404, data: null, message: err.message }, 404);
    }
    throw err;
  }
});

/**
 * DELETE /api/workout-logs/:id - 删除训练日志
 */
workoutLogRouter.delete('/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ code: 401, data: null, message: '未认证' }, 401);
  }

  const { id } = c.req.param();
  
  try {
    const result = await workoutService.deleteWorkoutLog(c.env, id, user.userId);
    return c.json({ code: 0, data: result, message: '删除成功' });
  } catch (err: any) {
    if (err.message.includes('不存在') || err.message.includes('无权')) {
      return c.json({ code: 404, data: null, message: err.message }, 404);
    }
    throw err;
  }
});

export default workoutLogRouter;
