import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import * as dietService from '../services/dietService';
import { sendSuccess, sendError } from '../utils/response';
import { z } from 'zod';

const app = new Hono<{ Bindings: any; Variables: { user?: any } }>();

app.get('/foods', authMiddleware, async (c) => {
  try {
    const search = c.req.query('search') || '';
    const limit = parseInt(c.req.query('limit') || '50', 10);
    const offset = parseInt(c.req.query('offset') || '0', 10);
    const result = await dietService.getFoodItems(c.env.DB, { search, limit, offset });
    return sendSuccess(c, result);
  } catch (err: any) {
    return sendError(c, 500, err?.message || 'Server error');
  }
});

app.post('/foods', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const schema = z.object({
      name: z.string().min(1),
      caloriesPer100g: z.number().min(0).default(0),
      proteinPer100g: z.number().min(0).default(0),
      carbsPer100g: z.number().min(0).default(0),
      fatPer100g: z.number().min(0).default(0),
      servingSize: z.number().min(0).default(100),
      servingUnit: z.string().default('g'),
    });
    const data = schema.parse(body);
    const result = await dietService.createFoodItem(c.env.DB, { ...data, userId: user.userId });
    return sendSuccess(c, result, 'Food item created', 201);
  } catch (err: any) {
    return sendError(c, 400, err?.message || 'Bad request');
  }
});

app.get('/records', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const dateStr = c.req.query('date');
    const date = dateStr ? parseInt(dateStr, 10) : Math.floor(Date.now() / 1000);
    const result = await dietService.getMealRecords(c.env.DB, user.userId, date);
    return sendSuccess(c, result);
  } catch (err: any) {
    return sendError(c, 500, err?.message || 'Server error');
  }
});

app.get('/records/range', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const startDate = c.req.query('start_date') ? parseInt(c.req.query('start_date')!, 10) : 0;
    const endDate = c.req.query('end_date') ? parseInt(c.req.query('end_date')!, 10) : Math.floor(Date.now() / 1000);
    const result = await dietService.getMealRecordsInRange(c.env.DB, user.userId, startDate, endDate);
    return sendSuccess(c, result);
  } catch (err: any) {
    return sendError(c, 500, err?.message || 'Server error');
  }
});

app.post('/records', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const schema = z.object({
      date: z.number().optional(),
      mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
      foodItemId: z.string().min(1),
      quantityGrams: z.number().min(0).default(100),
    });
    const data = schema.parse(body);
    const result = await dietService.createMealRecord(c.env.DB, { ...data, userId: user.userId, date: data.date || Math.floor(Date.now() / 1000) });
    return sendSuccess(c, result, 'Meal record created', 201);
  } catch (err: any) {
    return sendError(c, 400, err?.message || 'Bad request');
  }
});

app.delete('/records/:id', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');
    await dietService.deleteMealRecord(c.env.DB, id, user.userId);
    return sendSuccess(c, null, 'Meal record deleted');
  } catch (err: any) {
    return sendError(c, 500, err?.message || 'Server error');
  }
});

export default app;
