import type { D1Database } from '@cloudflare/workers-types';

// ==================== 训练计划 ====================

export async function getWorkoutPlans(db: D1Database, userId: string, params?: {
  isTemplate?: boolean;
  limit?: number;
  offset?: number;
}): Promise<any[]> {
  let sql = 'SELECT * FROM workout_plans WHERE user_id = ?';
  const p: unknown[] = [userId];
  if (params?.isTemplate !== undefined) { sql += ' AND is_template = ?'; p.push(params.isTemplate ? 1 : 0); }
  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  p.push(params?.limit || 20, params?.offset || 0);
  const r = await db.prepare(sql).bind(...p).all();
  const plans = (r as any).results || [];
  for (const p of plans) { (p as any).exercises = await getPlanExercises(db, (p as any).id); }
  return plans;
}

async function getPlanExercises(db: D1Database, planId: string): Promise<any[]> {
  const r = await db.prepare('SELECT * FROM workout_plan_exercises WHERE plan_id = ? ORDER BY sort_order ASC').bind(planId).all();
  return (r as any).results || [];
}

export async function getWorkoutPlanById(db: D1Database, id: string, userId: string): Promise<any | null> {
  const plan = await db.prepare('SELECT * FROM workout_plans WHERE id = ? AND user_id = ?').bind(id, userId).first();
  if (!plan) return null;
  (plan as any).exercises = await getPlanExercises(db, id);
  return plan;
}

export async function createWorkoutPlan(db: D1Database, data: any): Promise<any> {
  const id = crypto.randomUUID();
  await db.prepare('INSERT INTO workout_plans (id, user_id, name, description, is_template) VALUES (?, ?, ?, ?, ?)')
    .bind(id, data.userId, data.name, data.description || '', data.isTemplate ? 1 : 0).run();
  if (data.exercises && data.exercises.length > 0) {
    for (const ex of data.exercises) {
      await db.prepare('INSERT INTO workout_plan_exercises (id, plan_id, exercise_id, day_of_week, sets, reps, duration_seconds, rest_seconds, sort_order, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .bind(crypto.randomUUID(), id, ex.exerciseId, ex.dayOfWeek || 0, ex.sets || 3, ex.reps || 10, ex.durationSeconds || 0, ex.restSeconds || 60, ex.sortOrder || 0, ex.notes || '').run();
    }
  }
  return await getWorkoutPlanById(db, id, data.userId);
}

export async function updateWorkoutPlan(db: D1Database, id: string, userId: string, data: any): Promise<any | null> {
  const existing = await db.prepare('SELECT id FROM workout_plans WHERE id = ? AND user_id = ?').bind(id, userId).first();
  if (!existing) return null;
  await db.prepare('UPDATE workout_plans SET name = ?, description = ?, is_template = ? WHERE id = ? AND user_id = ?')
    .bind(data.name, data.description || '', data.isTemplate ? 1 : 0, id, userId).run();
  await db.prepare('DELETE FROM workout_plan_exercises WHERE plan_id = ?').bind(id).run();
  if (data.exercises && data.exercises.length > 0) {
    for (const ex of data.exercises) {
      await db.prepare('INSERT INTO workout_plan_exercises (id, plan_id, exercise_id, day_of_week, sets, reps, duration_seconds, rest_seconds, sort_order, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .bind(crypto.randomUUID(), id, ex.exerciseId, ex.dayOfWeek || 0, ex.sets || 3, ex.reps || 10, ex.durationSeconds || 0, ex.restSeconds || 60, ex.sortOrder || 0, ex.notes || '').run();
    }
  }
  return await getWorkoutPlanById(db, id, userId);
}

export async function deleteWorkoutPlan(db: D1Database, id: string, userId: string): Promise<boolean> {
  await db.prepare('DELETE FROM workout_plans WHERE id = ? AND user_id = ?').bind(id, userId).run();
  return true;
}

// ==================== 训练日志 ====================

export async function getWorkoutLogs(db: D1Database, userId: string, params?: {
  startDate?: number;
  endDate?: number;
  limit?: number;
  offset?: number;
}): Promise<any[]> {
  let sql = 'SELECT * FROM workout_logs WHERE user_id = ?';
  const p: unknown[] = [userId];
  if (params?.startDate) { sql += ' AND date >= ?'; p.push(params.startDate); }
  if (params?.endDate) { sql += ' AND date <= ?'; p.push(params.endDate); }
  sql += ' ORDER BY date DESC LIMIT ? OFFSET ?';
  p.push(params?.limit || 20, params?.offset || 0);
  const r = await db.prepare(sql).bind(...p).all();
  const logs = (r as any).results || [];
  for (const log of logs) { (log as any).exercises = await getLogExercises(db, (log as any).id); }
  return logs;
}

async function getLogExercises(db: D1Database, logId: string): Promise<any[]> {
  const r = await db.prepare('SELECT * FROM workout_log_exercises WHERE log_id = ?').bind(logId).all();
  const exercises = (r as any).results || [];
  for (const le of exercises) { (le as any).sets = await getLogSets(db, (le as any).id); }
  return exercises;
}

async function getLogSets(db: D1Database, logExerciseId: string): Promise<any[]> {
  const r = await db.prepare('SELECT * FROM workout_log_sets WHERE log_exercise_id = ? ORDER BY set_number ASC').bind(logExerciseId).all();
  return (r as any).results || [];
}

export async function getWorkoutLogById(db: D1Database, id: string, userId: string): Promise<any | null> {
  const log = await db.prepare('SELECT * FROM workout_logs WHERE id = ? AND user_id = ?').bind(id, userId).first();
  if (!log) return null;
  (log as any).exercises = await getLogExercises(db, id);
  return log;
}

export async function createWorkoutLog(db: D1Database, data: any): Promise<any> {
  const id = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);
  await db.prepare('INSERT INTO workout_logs (id, user_id, plan_id, date, duration_minutes, notes) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(id, data.userId, data.planId || null, data.date || now, data.durationMinutes || 0, data.notes || '').run();
  if (data.exercises && data.exercises.length > 0) {
    for (const ex of data.exercises) {
      const leId = crypto.randomUUID();
      await db.prepare('INSERT INTO workout_log_exercises (id, log_id, exercise_id, notes) VALUES (?, ?, ?, ?)')
        .bind(leId, id, ex.exerciseId, ex.notes || '').run();
      if (ex.sets && ex.sets.length > 0) {
        for (const s of ex.sets) {
          await db.prepare('INSERT INTO workout_log_sets (id, log_exercise_id, set_number, reps, weight_kg) VALUES (?, ?, ?, ?, ?)')
            .bind(crypto.randomUUID(), leId, s.setNumber || 1, s.reps || 0, s.weightKg || 0).run();
        }
      }
    }
  }
  return await getWorkoutLogById(db, id, data.userId);
}

export async function deleteWorkoutLog(db: D1Database, id: string, userId: string): Promise<boolean> {
  await db.prepare('DELETE FROM workout_logs WHERE id = ? AND user_id = ?').bind(id, userId).run();
  return true;
}
