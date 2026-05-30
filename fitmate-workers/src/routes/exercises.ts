/**
 * Exercises Routes - Exercise library management
 * Implements /api/exercises/* endpoints
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth';

const exercisesRouter = new Hono();

/**
 * GET /api/exercises
 * Search exercises with filters
 */
exercisesRouter.get(
  '/',
  authMiddleware,
  zValidator(
    'query',
    z.object({
      query: z.string().optional(),
      muscle_group: z.string().optional(),
      equipment: z.string().optional(),
      difficulty: z.string().optional(),
      page: z.string().transform(Number).default('1'),
      limit: z.string().transform(Number).default('20'),
    })
  ),
  async (c) => {
    const { query, muscle_group, equipment, difficulty, page, limit } = c.req.valid('query');
    const db = c.env.DB;
    const offset = (page - 1) * limit;

    try {
      let sql = 'SELECT * FROM exercises WHERE 1=1';
      const params: unknown[] = [];

      if (query) {
        sql += ' AND (name LIKE ? OR description LIKE ?)';
        params.push(`%${query}%`, `%${query}%`);
      }

      if (muscle_group) {
        sql += ' AND muscle_group = ?';
        params.push(muscle_group);
      }

      if (equipment) {
        sql += ' AND equipment LIKE ?';
        params.push(`%${equipment}%`);
      }

      if (difficulty) {
        sql += ' AND difficulty = ?';
        params.push(difficulty);
      }

      sql += ' ORDER BY name ASC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const exercises = await db.prepare(sql).bind(...params).all();

      // Get total count
      let countSql = 'SELECT COUNT(*) as total FROM exercises WHERE 1=1';
      const countParams: unknown[] = [];

      if (query) {
        countSql += ' AND (name LIKE ? OR description LIKE ?)';
        countParams.push(`%${query}%`, `%${query}%`);
      }

      if (muscle_group) {
        countSql += ' AND muscle_group = ?';
        countParams.push(muscle_group);
      }

      const totalResult = await db.prepare(countSql).bind(...countParams).first<{ total: number }>();

      return c.json({
        code: 0,
        data: {
          exercises: exercises.results,
          pagination: {
            page,
            limit,
            total: totalResult?.total || 0,
            totalPages: Math.ceil((totalResult?.total || 0) / limit),
          },
        },
        message: 'Exercises retrieved successfully',
      });
    } catch (error) {
      console.error('[Exercises GET] Error:', error);
      return c.json(
        { code: 500, data: null, message: 'Internal server error' },
        500
      );
    }
  }
);

/**
 * GET /api/exercises/:id
 * Get single exercise by ID
 */
exercisesRouter.get('/:id', authMiddleware, async (c) => {
  const exerciseId = parseInt(c.req.param('id'));
  const db = c.env.DB;

  try {
    const exercise = await db
      .prepare('SELECT * FROM exercises WHERE id = ?')
      .bind(exerciseId)
      .first();

    if (!exercise) {
      return c.json(
        { code: 404, data: null, message: 'Exercise not found' },
        404
      );
    }

    return c.json({
      code: 0,
      data: exercise,
      message: 'Exercise retrieved successfully',
    });
  } catch (error) {
    console.error('[Exercises GET :id] Error:', error);
    return c.json(
      { code: 500, data: null, message: 'Internal server error' },
      500
    );
  }
});

/**
 * POST /api/exercises
 * Create new exercise (admin only)
 */
exercisesRouter.post(
  '/',
  authMiddleware,
  zValidator(
    'json',
    z.object({
      name: z.string().min(2).max(100),
      description: z.string().optional(),
      muscle_group: z.string().min(1),
      equipment: z.string().optional(),
      difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
      instructions: z.string().optional(),
      video_url: z.string().url().optional(),
      image_url: z.string().url().optional(),
    })
  ),
  async (c) => {
    const user = c.get('user');
    const db = c.env.DB;

    try {
      const exerciseData = c.req.valid('json');

      const result = await db
        .prepare(
          `INSERT INTO exercises 
           (name, description, muscle_group, equipment, difficulty, instructions, video_url, image_url, created_by) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) 
           RETURNING id`
        )
        .bind(
          exerciseData.name,
          exerciseData.description || null,
          exerciseData.muscle_group,
          exerciseData.equipment || null,
          exerciseData.difficulty,
          exerciseData.instructions || null,
          exerciseData.video_url || null,
          exerciseData.image_url || null,
          user.userId
        )
        .first<{ id: number }>();

      if (!result) {
        return c.json(
          { code: 500, data: null, message: 'Failed to create exercise' },
          500
        );
      }

      return c.json({
        code: 0,
        data: { id: result.id },
        message: 'Exercise created successfully',
      });
    } catch (error) {
      console.error('[Exercises POST] Error:', error);
      return c.json(
        { code: 500, data: null, message: 'Internal server error' },
        500
      );
    }
  }
);

export default exercisesRouter;
