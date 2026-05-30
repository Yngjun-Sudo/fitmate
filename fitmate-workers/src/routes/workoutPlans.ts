/**
 * Workout Plans Routes - Create and manage workout plans
 * Implements /api/workout-plans/* endpoints
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth';

const workoutPlansRouter = new Hono();

/**
 * GET /api/workout-plans
 * Get user's workout plans
 */
workoutPlansRouter.get('/', authMiddleware, async (c) => {
  const user = c.get('user');
  const db = c.env.DB;

  try {
    const plans = await db
      .prepare(
        `SELECT wp.id, wp.title, wp.description, wp.created_at, wp.updated_at,
                COUNT(wpe.id) as exercise_count
         FROM workout_plans wp
         LEFT JOIN workout_plan_exercises wpe ON wp.id = wpe.workout_plan_id
         WHERE wp.user_id = ?
         GROUP BY wp.id
         ORDER BY wp.updated_at DESC`
      )
      .bind(user.userId)
      .all();

    return c.json({
      code: 0,
      data: plans.results,
      message: 'Workout plans retrieved successfully',
    });
  } catch (error) {
    console.error('[WorkoutPlans GET] Error:', error);
    return c.json(
      { code: 500, data: null, message: 'Internal server error' },
      500
    );
  }
});

/**
 * GET /api/workout-plans/:id
 * Get single workout plan with exercises
 */
workoutPlansRouter.get('/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  const planId = parseInt(c.req.param('id'));
  const db = c.env.DB;

  try {
    // Get plan
    const plan = await db
      .prepare('SELECT * FROM workout_plans WHERE id = ? AND user_id = ?')
      .bind(planId, user.userId)
      .first();

    if (!plan) {
      return c.json(
        { code: 404, data: null, message: 'Workout plan not found' },
        404
      );
    }

    // Get exercises
    const exercises = await db
      .prepare(
        `SELECT wpe.*, e.name, e.muscle_group, e.equipment
         FROM workout_plan_exercises wpe
         JOIN exercises e ON wpe.exercise_id = e.id
         WHERE wpe.workout_plan_id = ?
         ORDER BY wpe.id ASC`
      )
      .bind(planId)
      .all();

    return c.json({
      code: 0,
      data: {
        ...plan,
        exercises: exercises.results,
      },
      message: 'Workout plan retrieved successfully',
    });
  } catch (error) {
    console.error('[WorkoutPlans GET :id] Error:', error);
    return c.json(
      { code: 500, data: null, message: 'Internal server error' },
      500
    );
  }
});

/**
 * POST /api/workout-plans
 * Create new workout plan
 */
workoutPlansRouter.post(
  '/',
  authMiddleware,
  zValidator(
    'json',
    z.object({
      title: z.string().min(1).max(200),
      description: z.string().optional(),
      exercises: z
        .array(
          z.object({
            exercise_id: z.number().int().positive(),
            sets: z.number().int().positive(),
            reps: z.number().int().positive(),
            weight: z.number().min(0).optional(),
          })
        )
        .min(1),
    })
  ),
  async (c) => {
    const user = c.get('user');
    const { title, description, exercises } = c.req.valid('json');
    const db = c.env.DB;

    try {
      // Create plan
      const planResult = await db
        .prepare(
          'INSERT INTO workout_plans (user_id, title, description) VALUES (?, ?, ?) RETURNING id'
        )
        .bind(user.userId, title, description || null)
        .first<{ id: number }>();

      if (!planResult) {
        throw new Error('Failed to create workout plan');
      }

      const planId = planResult.id;

      // Add exercises
      for (const ex of exercises) {
        await db
          .prepare(
            'INSERT INTO workout_plan_exercises (workout_plan_id, exercise_id, sets, reps, weight) VALUES (?, ?, ?, ?, ?)'
          )
          .bind(planId, ex.exercise_id, ex.sets, ex.reps, ex.weight || null)
          .run();
      }

      return c.json({
        code: 0,
        data: { id: planId },
        message: 'Workout plan created successfully',
      });
    } catch (error) {
      console.error('[WorkoutPlans POST] Error:', error);
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
 * PUT /api/workout-plans/:id
 * Update workout plan
 */
workoutPlansRouter.put(
  '/:id',
  authMiddleware,
  zValidator(
    'json',
    z.object({
      title: z.string().min(1).max(200).optional(),
      description: z.string().optional(),
      exercises: z
        .array(
          z.object({
            exercise_id: z.number().int().positive(),
            sets: z.number().int().positive(),
            reps: z.number().int().positive(),
            weight: z.number().min(0).optional(),
          })
        )
        .optional(),
    })
  ),
  async (c) => {
    const user = c.get('user');
    const planId = parseInt(c.req.param('id'));
    const updates = c.req.valid('json');
    const db = c.env.DB;

    try {
      // Verify ownership
      const existing = await db
        .prepare('SELECT id FROM workout_plans WHERE id = ? AND user_id = ?')
        .bind(planId, user.userId)
        .first();

      if (!existing) {
        return c.json(
          { code: 404, data: null, message: 'Workout plan not found' },
          404
        );
      }

      // Update plan fields
      const updateFields: string[] = [];
      const params: unknown[] = [];

      if (updates.title !== undefined) {
        updateFields.push('title = ?');
        params.push(updates.title);
      }

      if (updates.description !== undefined) {
        updateFields.push('description = ?');
        params.push(updates.description);
      }

      if (updateFields.length > 0) {
        updateFields.push('updated_at = CURRENT_TIMESTAMP');
        params.push(planId);

        await db
          .prepare(`UPDATE workout_plans SET ${updateFields.join(', ')} WHERE id = ?`)
          .bind(...params)
          .run();
      }

      // Update exercises if provided
      if (updates.exercises) {
        // Delete existing
        await db
          .prepare('DELETE FROM workout_plan_exercises WHERE workout_plan_id = ?')
          .bind(planId)
          .run();

        // Add new
        for (const ex of updates.exercises) {
          await db
            .prepare(
              'INSERT INTO workout_plan_exercises (workout_plan_id, exercise_id, sets, reps, weight) VALUES (?, ?, ?, ?, ?)'
            )
            .bind(planId, ex.exercise_id, ex.sets, ex.reps, ex.weight || null)
            .run();
        }
      }

      return c.json({
        code: 0,
        data: null,
        message: 'Workout plan updated successfully',
      });
    } catch (error) {
      console.error('[WorkoutPlans PUT] Error:', error);
      return c.json(
        { code: 500, data: null, message: 'Internal server error' },
        500
      );
    }
  }
);

/**
 * DELETE /api/workout-plans/:id
 * Delete workout plan
 */
workoutPlansRouter.delete('/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  const planId = parseInt(c.req.param('id'));
  const db = c.env.DB;

  try {
    // Verify ownership
    const existing = await db
      .prepare('SELECT id FROM workout_plans WHERE id = ? AND user_id = ?')
      .bind(planId, user.userId)
      .first();

    if (!existing) {
      return c.json(
        { code: 404, data: null, message: 'Workout plan not found' },
        404
      );
    }

    // Delete exercises first (foreign key)
    await db
      .prepare('DELETE FROM workout_plan_exercises WHERE workout_plan_id = ?')
      .bind(planId)
      .run();

    // Delete plan
    await db
      .prepare('DELETE FROM workout_plans WHERE id = ?')
      .bind(planId)
      .run();

    return c.json({
      code: 0,
      data: null,
      message: 'Workout plan deleted successfully',
    });
  } catch (error) {
    console.error('[WorkoutPlans DELETE] Error:', error);
    return c.json(
      { code: 500, data: null, message: 'Internal server error' },
      500
    );
  }
});

export default workoutPlansRouter;
