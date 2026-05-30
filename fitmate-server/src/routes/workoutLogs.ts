import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import * as workoutService from '../services/workoutService';
import { sendSuccess, sendError } from '../utils/response';
import { z } from 'zod';

const app = new Hono<{ Bindings: any; Variables: { user?: any } }>();

app.get('/', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const startDate = c.req.query('start_date') ? parseInt(c.req.query('start_date')!) : undefined;
    const endDate = c.req.query('end_date') ? parseInt(c.req.query('end_date')!) : undefined;
    const limit = parseInt(c.req.query('limit') || '20', 10);
    const offset = parseInt(c.req.query('offset') || '0', 10);
    const result = await workoutService.getWorkoutLogs(c.env.DB, user.userId, { startDate, endDate, limit, offset });
    return sendSuccess(c, result);
  } catch (err: any) {
    return sendError(c, 500, err?.message || 'Server error');
  }
});

app.get('/:id', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');
    const result = await workoutService.getWorkoutLogById(c.env.DB, id, user.userId);
    if (!result) return sendError(c, 404, 'Workout log not found');
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
      planId: z.string().optional(),
      date: z.number().optional(),
      durationMinutes: z.number().optional(),
      notes: z.string().optional(),
      exercises: z.array(z.object({
        exerciseId: z.string(),
        notes: z.string().optional(),
        sets: z.array(z.object({
          setNumber: z.number().optional(),
          reps: z.number().default(0),
          weightKg: z.number().default(0),
        })).optional(),
      })),
    });
    const data = schema.parse(body);
    const result = await workoutService.createWorkoutLog(c.env.DB, { ...data, userId: user.userId });
    return sendSuccess(c, result, 'Workout log created', 201);
  } catch (err: any) {
    return sendError(c, 400, err?.message || 'Bad request');
  }
});

app.delete('/:id', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');
    await workoutService.deleteWorkoutLog(c.env.DB, id, user.userId);
    return sendSuccess(c, null, 'Workout log deleted');
  } catch (err: any) {
    return sendError(c, 500, err?.message || 'Server error');
  }
});

export default app;
