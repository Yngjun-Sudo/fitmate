import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import * as dietService from '../services/dietService';
import { jsonValidate, paramValidate } from '../utils/validator';
import { FoodItemSchema, MealRecordSchema } from '../types';
import { optionalAuth } from '../middleware/auth';
import type { Env, JwtPayload } from '../types';

const dietRouter = new Hono<{ Bindings: Env; Variables: { user?: JwtPayload } }>();

// ==================== 食物管理 ====================

/**
 * GET /api/diet/food-items - 获取食物列表
 */
dietRouter.get('/food-items', optionalAuth, async (c) => {
  const search = c.req.query('search') || undefined;
  const isCustom = c.req.query('is_custom') === 'true' ? true : 
                     c.req.query('is_custom') === 'false' ? false : undefined;
  const userId = c.get('user')?.userId;
  const limit = parseInt(c.req.query('limit') || '20', 10);
  const offset = parseInt(c.req.query('offset') || '0', 10);

  const foods = await dietService.getFoodItems(c.env, {
    search,
    isCustom,
    userId,
    limit,
    offset,
  });

  return c.json({ code: 0, data: foods });
});

/**
 * GET /api/diet/food-items/:id - 获取食物详情
 */
dietRouter.get('/food-items/:id', paramValidate(z.object({ id: z.string() })), async (c) => {
  const { id } = c.req.valid('param');
  const food = await dietService.getFoodItemById(c.env, id);

  if (!food) {
    return c.json({ code: 404, data: null, message: '食物不存在' }, 404);
  }

  return c.json({ code: 0, data: food });
});

/**
 * POST /api/diet/food-items - 创建自定义食物
 */
dietRouter.post('/food-items', authMiddleware, jsonValidate(FoodItemSchema), async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ code: 401, data: null, message: '未认证' }, 401);
  }

  const data = c.req.valid('json');
  try {
    const food = await dietService.createFoodItem(c.env, {
      ...data,
      userId: user.userId,
    });
    return c.json({ code: 0, data: food, message: '创建成功' }, 201);
  } catch (err: any) {
    if (err.message.includes('已存在')) {
      return c.json({ code: 409, data: null, message: '食物已存在' }, 409);
    }
    throw err;
  }
});

/**
 * PUT /api/diet/food-items/:id - 更新食物
 */
dietRouter.put('/food-items/:id', authMiddleware, jsonValidate(FoodItemSchema.partial()), async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ code: 401, data: null, message: '未认证' }, 401);
  }

  const { id } = c.req.param();
  const data = c.req.valid('json');
  
  try {
    const food = await dietService.updateFoodItem(c.env, id, user.userId, data);
    return c.json({ code: 0, data: food, message: '更新成功' });
  } catch (err: any) {
    if (err.message.includes('不存在') || err.message.includes('无权')) {
      return c.json({ code: 404, data: null, message: err.message }, 404);
    }
    throw err;
  }
});

/**
 * DELETE /api/diet/food-items/:id - 删除食物
 */
dietRouter.delete('/food-items/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ code: 401, data: null, message: '未认证' }, 401);
  }

  const { id } = c.req.param();
  
  try {
    const result = await dietService.deleteFoodItem(c.env, id, user.userId);
    return c.json({ code: 0, data: result, message: '删除成功' });
  } catch (err: any) {
    if (err.message.includes('不存在') || err.message.includes('无权')) {
      return c.json({ code: 404, data: null, message: err.message }, 404);
    }
    throw err;
  }
});

// ==================== 饮食记录 ====================

/**
 * GET /api/diet/meal-records - 获取饮食记录列表
 */
dietRouter.get('/meal-records', authMiddleware, async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ code: 401, data: null, message: '未认证' }, 401);
  }

  const startDate = c.req.query('start_date') || undefined;
  const endDate = c.req.query('end_date') || undefined;
  const mealType = c.req.query('meal_type') || undefined;
  const limit = parseInt(c.req.query('limit') || '20', 10);
  const offset = parseInt(c.req.query('offset') || '0', 10);

  const records = await dietService.getMealRecords(c.env, user.userId, {
    startDate,
    endDate,
    mealType,
    limit,
    offset,
  });

  return c.json({ code: 0, data: records });
});

/**
 * POST /api/diet/meal-records - 创建饮食记录
 */
dietRouter.post('/meal-records', authMiddleware, jsonValidate(MealRecordSchema), async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ code: 401, data: null, message: '未认证' }, 401);
  }

  const data = c.req.valid('json');
  const record = await dietService.createMealRecord(c.env, user.userId, data);

  return c.json({ code: 0, data: record, message: '创建成功' }, 201);
});

/**
 * DELETE /api/diet/meal-records/:id - 删除饮食记录
 */
dietRouter.delete('/meal-records/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ code: 401, data: null, message: '未认证' }, 401);
  }

  const { id } = c.req.param();
  
  try {
    const result = await dietService.deleteMealRecord(c.env, id, user.userId);
    return c.json({ code: 0, data: result, message: '删除成功' });
  } catch (err: any) {
    if (err.message.includes('不存在') || err.message.includes('无权')) {
      return c.json({ code: 404, data: null, message: err.message }, 404);
    }
    throw err;
  }
});

/**
 * GET /api/diet/summary - 获取近期饮食摘要（用于 AI 上下文）
 */
dietRouter.get('/summary', authMiddleware, async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ code: 401, data: null, message: '未认证' }, 401);
  }

  const days = parseInt(c.req.query('days') || '7', 10);
  const summary = await dietService.getRecentDietSummary(c.env, user.userId, days);

  return c.json({ code: 0, data: summary });
});

export default dietRouter;
