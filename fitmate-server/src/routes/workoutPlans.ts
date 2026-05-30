import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import * as workoutService from '../services/workoutService';
import { sendSuccess, sendError } from '../utils/response';
import { z } from 'zod';

const app = new Hono<{ Bindings: any; Variables: { user?: any } }>();

app.get('/', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const isTemplate = c.req.query('is_template');
    const limit = parseInt(c.req.query('limit') || '20', 10);
    const offset = parseInt(c.req.query('offset') || '0', 10);
    const result = await workoutService.getWorkoutPlans(
      c.env.DB,
      user.userId,
      {
        isTemplate: isTemplate === 'true' ? true : isTemplate === 'false' ? false : undefined,
        limit, offset,
      }
    );
    return sendSuccess(c, result);
  } catch (err: any) {
    return sendError(c, 500, err?.message || 'Server error');
  }
});

app.get('/:id', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');
    const result = await workoutService.getWorkoutPlanById(c.env.DB, id, user.userId);
    if (!result) return sendError(c, 404, 'Plan not found');
    return sendSuccess(c, result);
  } catch (err: any) {
    return sendError(c, 500, err?.message || 'Server error');
  }
});

app.post('/', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const schema = z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      isTemplate: z.boolean().optional(),
      exercises: z.array(z.object({
        exerciseId: z.string(),
        dayOfWeek: z.number().optional(),
        sets: z.number().optional(),
        reps: z.number().optional(),
        durationSeconds: z.number().optional(),
        restSeconds: z.number().optional(),
        sortOrder: z.number().optional(),
        notes: z.string().optional(),
      })).optional(),
    });
    const data = schema.parse(body);
    const result = await workoutService.createWorkoutPlan(c.env.DB, { ...data, userId: user.userId });
    return sendSuccess(c, result, 'Workout plan created', 201);
  } catch (err: any) {
    return sendError(c, 400, err?.message || 'Bad request');
  }
});

app.put('/:id', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');
    const body = await c.req.json();
    const result = await workoutService.updateWorkoutPlan(c.env.DB, id, user.userId, body);
    if (!result) return sendError(c, 404, 'Plan not found');
    return sendSuccess(c, result, 'Workout plan updated');
  } catch (err: any) {
    return sendError(c, 400, err?.message || 'Bad request');
  }
});

app.delete('/:id', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');
    await workoutService.deleteWorkoutPlan(c.env.DB, id, user.userId);
    return sendSuccess(c, null, 'Workout plan deleted');
  } catch (err: any) {
    return sendError(c, 500, err?.message || 'Server error');
  }
});

export default app;
