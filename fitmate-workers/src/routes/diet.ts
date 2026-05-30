/**
 * Diet Routes - Food and meal tracking
 * Implements /api/diet/* endpoints
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth';

const dietRouter = new Hono();

/**
 * GET /api/diet/foods
 * Search food items with pagination
 */
dietRouter.get(
  '/foods',
  authMiddleware,
  zValidator(
    'query',
    z.object({
      query: z.string().optional(),
      category: z.string().optional(),
      page: z.string().transform(Number).default('1'),
      limit: z.string().transform(Number).default('20'),
    })
  ),
  async (c) => {
    const { query, category, page, limit } = c.req.valid('query');
    const db = c.env.DB;
    const offset = (page - 1) * limit;

    try {
      let sql = 'SELECT * FROM food_items WHERE 1=1';
      const params: unknown[] = [];

      if (query) {
        sql += ' AND (name LIKE ? OR description LIKE ?)';
        params.push(`%${query}%`, `%${query}%`);
      }

      if (category) {
        sql += ' AND category = ?';
        params.push(category);
      }

      sql += ' ORDER BY name ASC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const foods = await db.prepare(sql).bind(...params).all();

      // Get total count
      let countSql = 'SELECT COUNT(*) as total FROM food_items WHERE 1=1';
      const countParams: unknown[] = [];

      if (query) {
        countSql += ' AND (name LIKE ? OR description LIKE ?)';
        countParams.push(`%${query}%`, `%${query}%`);
      }

      if (category) {
        countSql += ' AND category = ?';
        countParams.push(category);
      }

      const totalResult = await db.prepare(countSql).bind(...countParams).first<{ total: number }>();

      return c.json({
        code: 0,
        data: {
          foods: foods.results,
          pagination: {
            page,
            limit,
            total: totalResult?.total || 0,
            totalPages: Math.ceil((totalResult?.total || 0) / limit),
          },
        },
        message: 'Food items retrieved successfully',
      });
    } catch (error) {
      console.error('[Diet Foods GET] Error:', error);
      return c.json(
        { code: 500, data: null, message: 'Internal server error' },
        500
      );
    }
  }
);

/**
 * GET /api/diet/foods/:id
 * Get single food item
 */
dietRouter.get('/foods/:id', authMiddleware, async (c) => {
  const foodId = parseInt(c.req.param('id'));
  const db = c.env.DB;

  try {
    const food = await db
      .prepare('SELECT * FROM food_items WHERE id = ?')
      .bind(foodId)
      .first();

    if (!food) {
      return c.json(
        { code: 404, data: null, message: 'Food item not found' },
        404
      );
    }

    return c.json({
      code: 0,
      data: food,
      message: 'Food item retrieved successfully',
    });
  } catch (error) {
    console.error('[Diet Foods GET :id] Error:', error);
    return c.json(
      { code: 500, data: null, message: 'Internal server error' },
      500
    );
  }
});

/**
 * POST /api/diet/foods
 * Create new food item (admin only)
 */
dietRouter.post(
  '/foods',
  authMiddleware,
  zValidator(
    'json',
    z.object({
      name: z.string().min(1).max(200),
      description: z.string().optional(),
      calories_per_100g: z.number().min(0),
      protein_per_100g: z.number().min(0).optional(),
      carbs_per_100g: z.number().min(0).optional(),
      fat_per_100g: z.number().min(0).optional(),
      category: z.string().optional(),
    })
  ),
  async (c) => {
    const user = c.get('user');
    const foodData = c.req.valid('json');
    const db = c.env.DB;

    try {
      const result = await db
        .prepare(
          `INSERT INTO food_items 
           (name, description, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, category, created_by) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?) 
           RETURNING id`
        )
        .bind(
          foodData.name,
          foodData.description || null,
          foodData.calories_per_100g,
          foodData.protein_per_100g || null,
          foodData.carbs_per_100g || null,
          foodData.fat_per_100g || null,
          foodData.category || null,
          user.userId
        )
        .first<{ id: number }>();

      if (!result) {
        return c.json(
          { code: 500, data: null, message: 'Failed to create food item' },
          500
        );
      }

      return c.json({
        code: 0,
        data: { id: result.id },
        message: 'Food item created successfully',
      });
    } catch (error) {
      console.error('[Diet Foods POST] Error:', error);
      return c.json(
        { code: 500, data: null, message: 'Internal server error' },
        500
      );
    }
  }
);

/**
 * GET /api/diet/meals
 * Get user's meal records with pagination
 */
dietRouter.get(
  '/meals',
  authMiddleware,
  zValidator(
    'query',
    z.object({
      start_date: z.string().datetime().optional(),
      end_date: z.string().datetime().optional(),
      page: z.string().transform(Number).default('1'),
      limit: z.string().transform(Number).default('20'),
    })
  ),
  async (c) => {
    const { start_date, end_date, page, limit } = c.req.valid('query');
    const user = c.get('user');
    const db = c.env.DB;
    const offset = (page - 1) * limit;

    try {
      let sql = `
        SELECT mr.*, 
               GROUP_CONCAT(fi.name) as food_names
        FROM meal_records mr
        LEFT JOIN food_items fi ON mr.food_id = fi.id
        WHERE mr.user_id = ?
      `;
      const params: unknown[] = [user.userId];

      if (start_date) {
        sql += ' AND mr.meal_date >= ?';
        params.push(start_date);
      }

      if (end_date) {
        sql += ' AND mr.meal_date <= ?';
        params.push(end_date);
      }

      sql += ' GROUP BY mr.id ORDER BY mr.meal_date DESC, mr.meal_time DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const meals = await db.prepare(sql).bind(...params).all();

      // Get total count
      let countSql = 'SELECT COUNT(*) as total FROM meal_records WHERE user_id = ?';
      const countParams: unknown[] = [user.userId];

      if (start_date) {
        countSql += ' AND meal_date >= ?';
        countParams.push(start_date);
      }

      if (end_date) {
        countSql += ' AND meal_date <= ?';
        countParams.push(end_date);
      }

      const totalResult = await db.prepare(countSql).bind(...countParams).first<{ total: number }>();

      return c.json({
        code: 0,
        data: {
          meals: meals.results,
          pagination: {
            page,
            limit,
            total: totalResult?.total || 0,
            totalPages: Math.ceil((totalResult?.total || 0) / limit),
          },
        },
        message: 'Meal records retrieved successfully',
      });
    } catch (error) {
      console.error('[Diet Meals GET] Error:', error);
      return c.json(
        { code: 500, data: null, message: 'Internal server error' },
        500
      );
    }
  }
);

/**
 * POST /api/diet/meals
 * Create new meal record
 */
dietRouter.post(
  '/meals',
  authMiddleware,
  zValidator(
    'json',
    z.object({
      food_id: z.number().int().positive(),
      meal_date: z.string().datetime(),
      meal_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      quantity: z.number().positive(),
      unit: z.string().min(1).max(50),
      calories: z.number().min(0).optional(),
      notes: z.string().max(500).optional(),
    })
  ),
  async (c) => {
    const user = c.get('user');
    const mealData = c.req.valid('json');
    const db = c.env.DB;

    try {
      const result = await db
        .prepare(
          `INSERT INTO meal_records 
           (user_id, food_id, meal_date, meal_time, quantity, unit, calories, notes) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?) 
           RETURNING id`
        )
        .bind(
          user.userId,
          mealData.food_id,
          mealData.meal_date,
          mealData.meal_time,
          mealData.quantity,
          mealData.unit,
          mealData.calories || null,
          mealData.notes || null
        )
        .first<{ id: number }>();

      if (!result) {
        return c.json(
          { code: 500, data: null, message: 'Failed to create meal record' },
          500
        );
      }

      return c.json({
        code: 0,
        data: { id: result.id },
        message: 'Meal record created successfully',
      });
    } catch (error) {
      console.error('[Diet Meals POST] Error:', error);
      return c.json(
        { code: 500, data: null, message: 'Internal server error' },
        500
      );
    }
  }
);

/**
 * DELETE /api/diet/meals/:id
 * Delete meal record
 */
dietRouter.delete('/meals/:id', authMiddleware, async (c) => {
  const mealId = parseInt(c.req.param('id'));
  const user = c.get('user');
  const db = c.env.DB;

  try {
    // Verify ownership
    const existing = await db
      .prepare('SELECT id FROM meal_records WHERE id = ? AND user_id = ?')
      .bind(mealId, user.userId)
      .first();

    if (!existing) {
      return c.json(
        { code: 404, data: null, message: 'Meal record not found' },
        404
      );
    }

    await db
      .prepare('DELETE FROM meal_records WHERE id = ?')
      .bind(mealId)
      .run();

    return c.json({
      code: 0,
      data: null,
      message: 'Meal record deleted successfully',
    });
  } catch (error) {
    console.error('[Diet Meals DELETE] Error:', error);
    return c.json(
      { code: 500, data: null, message: 'Internal server error' },
      500
    );
  }
});

/**
 * GET /api/diet/nutrition-summary
 * Get daily nutrition summary
 */
dietRouter.get(
  '/nutrition-summary',
  authMiddleware,
  zValidator(
    'query',
    z.object({
      date: z.string().datetime(),
    })
  ),
  async (c) => {
    const { date } = c.req.valid('query');
    const user = c.get('user');
    const db = c.env.DB;

    try {
      const summary = await db
        .prepare(
          `SELECT 
            SUM(calories) as total_calories,
            SUM(CASE WHEN fi.category = 'protein' THEN calories ELSE 0 END) as protein_calories,
            SUM(CASE WHEN fi.category = 'carbs' THEN calories ELSE 0 END) as carbs_calories,
            SUM(CASE WHEN fi.category = 'fat' THEN calories ELSE 0 END) as fat_calories
           FROM meal_records mr
           JOIN food_items fi ON mr.food_id = fi.id
           WHERE mr.user_id = ? AND mr.meal_date = ?`
        )
        .bind(user.userId, date)
        .first();

      return c.json({
        code: 0,
        data: summary || { total_calories: 0, protein_calories: 0, carbs_calories: 0, fat_calories: 0 },
        message: 'Nutrition summary retrieved successfully',
      });
    } catch (error) {
      console.error('[Diet Nutrition Summary] Error:', error);
      return c.json(
        { code: 500, data: null, message: 'Internal server error' },
        500
      );
    }
  }
);

export default dietRouter;
