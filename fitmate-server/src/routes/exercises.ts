import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import * as exerciseService from '../services/exerciseService';
import { sendSuccess, sendError } from '../utils/response';
import { z } from 'zod';

const app = new Hono<{ Bindings: any; Variables: { user?: any } }>();

app.get('/', async (c) => {
  try {
    const category = c.req.query('category');
    const muscleGroup = c.req.query('muscle_group');
    const difficulty = c.req.query('difficulty');
    const search = c.req.query('search');
    const limit = parseInt(c.req.query('limit') || '20', 10);
    const offset = parseInt(c.req.query('offset') || '0', 10);
    const result = await exerciseService.getExercises(c.env.DB, { category, muscleGroup, difficulty, search, limit, offset });
    return sendSuccess(c, result);
  } catch (err: any) {
    return sendError(c, 500, err?.message || 'Server error');
  }
});

app.get('/filters', async (c) => {
  try {
    const [categories, muscleGroups] = await Promise.all([
      exerciseService.getCategories(c.env.DB),
      exerciseService.getMuscleGroups(c.env.DB),
    ]);
    return sendSuccess(c, { categories, muscleGroups });
  } catch (err: any) {
    return sendError(c, 500, err?.message || 'Server error');
  }
});

app.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const result = await exerciseService.getExerciseById(c.env.DB, id);
    if (!result) return sendError(c, 404, 'Exercise not found');
    return sendSuccess(c, result);
  } catch (err: any) {
    return sendError(c, 500, err?.message || 'Server error');
  }
});

app.post('/', authMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const schema = z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      category: z.string().min(1),
      muscleGroup: z.string().min(1),
      equipment: z.string().optional(),
      difficulty: z.string().optional(),
      instructions: z.string().optional(),
      imageUrl: z.string().url().optional(),
    });
    const data = schema.parse(body);
    const result = await exerciseService.createExercise(c.env.DB, data as any);
    return sendSuccess(c, result, 'Exercise created', 201);
  } catch (err: any) {
    return sendError(c, 400, err?.message || 'Bad request');
  }
});

app.put('/:id', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const result = await exerciseService.updateExercise(c.env.DB, id, body);
    if (!result) return sendError(c, 404, 'Exercise not found');
    return sendSuccess(c, result, 'Exercise updated');
  } catch (err: any) {
    return sendError(c, 400, err?.message || 'Bad request');
  }
});

app.delete('/:id', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    await exerciseService.deleteExercise(c.env.DB, id);
    return sendSuccess(c, null, 'Exercise deleted');
  } catch (err: any) {
    return sendError(c, 500, err?.message || 'Server error');
  }
});

export default app;
