/**
 * Workout Logs Routes - Log workout sessions
 * Implements /api/workout-logs/* endpoints
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth';

const workoutLogsRouter = new Hono();

/**
 * GET /api/workout-logs
 * Get user's workout logs with pagination
 */
workoutLogsRouter.get(
  '/',
  authMiddleware,
  zValidator(
    'query',
    z.object({
      page: z.string().transform(Number).default('1'),
      limit: z.string().transform(Number).default('20'),
      start_date: z.string().datetime().optional(),
      end_date: z.string().datetime().optional(),
    })
  ),
  async (c) => {
    const { page, limit, start_date, end_date } = c.req.valid('query');
    const user = c.get('user');
    const db = c.env.DB;
    const offset = (page - 1) * limit;

    try {
      let sql = `
        SELECT wl.*, wp.title as plan_name
        FROM workout_logs wl
        LEFT JOIN workout_plans wp ON wl.workout_plan_id = wp.id
        WHERE wl.user_id = ?
      `;
      const params: unknown[] = [user.userId];

      if (start_date) {
        sql += ' AND wl.created_at >= ?';
        params.push(start_date);
      }

      if (end_date) {
        sql += ' AND wl.created_at <= ?';
        params.push(end_date);
      }

      sql += ' ORDER BY wl.created_at DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const logs = await db.prepare(sql).bind(...params).all();

      // Get total count
      let countSql = 'SELECT COUNT(*) as total FROM workout_logs WHERE user_id = ?';
      const countParams: unknown[] = [user.userId];

      if (start_date) {
        countSql += ' AND created_at >= ?';
        countParams.push(start_date);
      }

      if (end_date) {
        countSql += ' AND created_at <= ?';
        countParams.push(end_date);
      }

      const totalResult = await db.prepare(countSql).bind(...countParams).first<{ total: number }>();

      return c.json({
        code: 0,
        data: {
          logs: logs.results,
          pagination: {
            page,
            limit,
            total: totalResult?.total || 0,
            totalPages: Math.ceil((totalResult?.total || 0) / limit),
          },
        },
        message: 'Workout logs retrieved successfully',
      });
    } catch (error) {
      console.error('[WorkoutLogs GET] Error:', error);
      return c.json(
        { code: 500, data: null, message: 'Internal server error' },
        500
      );
    }
  }
);

/**
 * GET /api/workout-logs/:id
 * Get single workout log with exercises
 */
workoutLogsRouter.get('/:id', authMiddleware, async (c) => {
  const logId = parseInt(c.req.param('id'));
  const user = c.get('user');
  const db = c.env.DB;

  try {
    // Get log
    const log = await db
      .prepare('SELECT * FROM workout_logs WHERE id = ? AND user_id = ?')
      .bind(logId, user.userId)
      .first();

    if (!log) {
      return c.json(
        { code: 404, data: null, message: 'Workout log not found' },
        404
      );
    }

    // Get exercises
    const exercises = await db
      .prepare(
        `SELECT wle.*, e.name, e.muscle_group
         FROM workout_log_exercises wle
         JOIN exercises e ON wle.exercise_id = e.id
         WHERE wle.workout_log_id = ?
         ORDER BY wle.id ASC`
      )
      .bind(logId)
      .all();

    return c.json({
      code: 0,
      data: {
        ...log,
        exercises: exercises.results,
      },
      message: 'Workout log retrieved successfully',
    });
  } catch (error) {
    console.error('[WorkoutLogs GET :id] Error:', error);
    return c.json(
      { code: 500, data: null, message: 'Internal server error' },
      500
    );
  }
});

/**
 * POST /api/workout-logs
 * Create new workout log
 */
workoutLogsRouter.post(
  '/',
  authMiddleware,
  zValidator(
    'json',
    z.object({
      workout_plan_id: z.number().int().positive().optional(),
      duration_minutes: z.number().int().min(0).optional(),
      notes: z.string().max(1000).optional(),
      exercises: z
        .array(
          z.object({
            exercise_id: z.number().int().positive(),
            sets_completed: z.number().int().min(0),
            reps_completed: z.number().int().min(0),
            weight_used: z.number().min(0).optional(),
          })
        )
        .min(1),
    })
  ),
  async (c) => {
    const { workout_plan_id, duration_minutes, notes, exercises } = c.req.valid('json');
    const user = c.get('user');
    const db = c.env.DB;

    try {
      // Create log
      const logResult = await db
        .prepare(
          'INSERT INTO workout_logs (user_id, workout_plan_id, duration_minutes, notes) VALUES (?, ?, ?, ?) RETURNING id'
        )
        .bind(user.userId, workout_plan_id || null, duration_minutes || null, notes || null)
        .first<{ id: number }>();

      if (!logResult) {
        throw new Error('Failed to create workout log');
      }

      const logId = logResult.id;

      // Add exercises
      for (const ex of exercises) {
        await db
          .prepare(
            'INSERT INTO workout_log_exercises (workout_log_id, exercise_id, sets_completed, reps_completed, weight_used) VALUES (?, ?, ?, ?, ?)'
          )
          .bind(logId, ex.exercise_id, ex.sets_completed, ex.reps_completed, ex.weight_used || null)
          .run();
      }

      return c.json({
        code: 0,
        data: { id: logId },
        message: 'Workout logged successfully',
      });
    } catch (error) {
      console.error('[WorkoutLogs POST] Error:', error);
      return c.json(
        {
          code: 500,
          data: null,
          message: error instanceof Error ? error.message : 'Internal server error',
        },
        500
      );
    }
  }
);

/**
 * PUT /api/workout-logs/:id
 * Update workout log
 */
workoutLogsRouter.put(
  '/:id',
  authMiddleware,
  zValidator(
    'json',
    z.object({
      duration_minutes: z.number().int().min(0).optional(),
      notes: z.string().max(1000).optional(),
    })
  ),
  async (c) => {
    const logId = parseInt(c.req.param('id'));
    const updates = c.req.valid('json');
    const user = c.get('user');
    const db = c.env.DB;

    try {
      // Verify ownership
      const existing = await db
        .prepare('SELECT id FROM workout_logs WHERE id = ? AND user_id = ?')
        .bind(logId, user.userId)
        .first();

      if (!existing) {
        return c.json(
          { code: 404, data: null, message: 'Workout log not found' },
          404
        );
      }

      // Build update query
      const updateFields: string[] = [];
      const params: unknown[] = [];

      if (updates.duration_minutes !== undefined) {
        updateFields.push('duration_minutes = ?');
        params.push(updates.duration_minutes);
      }

      if (updates.notes !== undefined) {
        updateFields.push('notes = ?');
        params.push(updates.notes);
      }

      if (updateFields.length === 0) {
        return c.json(
          { code: 400, data: null, message: 'No fields to update' },
          400
        );
      }

      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      params.push(logId);

      await db
        .prepare(`UPDATE workout_logs SET ${updateFields.join(', ')} WHERE id = ?`)
        .bind(...params)
        .run();

      return c.json({
        code: 0,
        data: null,
        message: 'Workout log updated successfully',
      });
    } catch (error) {
      console.error('[WorkoutLogs PUT] Error:', error);
      return c.json(
        { code: 500, data: null, message: 'Internal server error' },
        500
      );
    }
  }
);

/**
 * DELETE /api/workout-logs/:id
 * Delete workout log
 */
workoutLogsRouter.delete('/:id', authMiddleware, async (c) => {
  const logId = parseInt(c.req.param('id'));
  const user = c.get('user');
  const db = c.env.DB;

  try {
    // Verify ownership
    const existing = await db
      .prepare('SELECT id FROM workout_logs WHERE id = ? AND user_id = ?')
      .bind(logId, user.userId)
      .first();

    if (!existing) {
      return c.json(
        { code: 404, data: null, message: 'Workout log not found' },
        404
      );
    }

    // Delete exercises first (foreign key)
    await db
      .prepare('DELETE FROM workout_log_exercises WHERE workout_log_id = ?')
      .bind(logId)
      .run();

    // Delete log
    await db
      .prepare('DELETE FROM workout_logs WHERE id = ?')
      .bind(logId)
      .run();

    return c.json({
      code: 0,
      data: null,
      message: 'Workout log deleted successfully',
    });
  } catch (error) {
    console.error('[WorkoutLogs DELETE] Error:', error);
    return c.json(
      { code: 500, data: null, message: 'Internal server error' },
      500
    );
  }
});

export default workoutLogsRouter;
