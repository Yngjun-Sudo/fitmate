import type { D1Database } from '@cloudflare/workers-types';

// ==================== 动作库 ====================

export async function getExercises(db: D1Database, params: {
  category?: string;
  muscleGroup?: string;
  difficulty?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<any[]> {
  let sql = 'SELECT * FROM exercises WHERE 1=1';
  const p: unknown[] = [];
  if (params.category) { sql += ' AND category = ?'; p.push(params.category); }
  if (params.muscleGroup) { sql += ' AND muscle_group = ?'; p.push(params.muscleGroup); }
  if (params.difficulty) { sql += ' AND difficulty = ?'; p.push(params.difficulty); }
  if (params.search) { sql += ' AND name LIKE ?'; p.push(`%${params.search}%`); }
  sql += ' ORDER BY name ASC LIMIT ? OFFSET ?';
  p.push(params.limit || 20, params.offset || 0);
  const r = await db.prepare(sql).bind(...p).all();
  return (r as any).results || [];
}

export async function getExerciseById(db: D1Database, id: string): Promise<any | null> {
  return await db.prepare('SELECT * FROM exercises WHERE id = ?').bind(id).first();
}

export async function createExercise(db: D1Database, data: any): Promise<any> {
  const id = data.id || crypto.randomUUID();
  await db.prepare(
    'INSERT INTO exercises (id, name, description, category, muscle_group, equipment, difficulty, instructions, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, data.name, data.description || '', data.category, data.muscleGroup || '', data.equipment || '', data.difficulty || 'beginner', data.instructions || '', data.imageUrl || '').run();
  return await getExerciseById(db, id);
}

export async function updateExercise(db: D1Database, id: string, data: any): Promise<any | null> {
  const existing = await getExerciseById(db, id);
  if (!existing) return null;
  await db.prepare(
    'UPDATE exercises SET name = ?, description = ?, category = ?, muscle_group = ?, equipment = ?, difficulty = ?, instructions = ?, image_url = ? WHERE id = ?'
  ).bind(
    data.name || existing.name,
    data.description !== undefined ? data.description : existing.description,
    data.category || existing.category,
    data.muscleGroup !== undefined ? data.muscleGroup : existing.muscle_group,
    data.equipment !== undefined ? data.equipment : existing.equipment,
    data.difficulty !== undefined ? data.difficulty : existing.difficulty,
    data.instructions !== undefined ? data.instructions : existing.instructions,
    data.imageUrl !== undefined ? data.imageUrl : existing.image_url,
    id
  ).run();
  return await getExerciseById(db, id);
}

export async function deleteExercise(db: D1Database, id: string): Promise<boolean> {
  await db.prepare('DELETE FROM exercises WHERE id = ?').bind(id).run();
  return true;
}

export async function getCategories(db: D1Database): Promise<string[]> {
  const r = await db.prepare('SELECT DISTINCT category FROM exercises ORDER BY category ASC').all();
  return ((r as any).results || []).map((r: any) => r.category);
}

export async function getMuscleGroups(db: D1Database): Promise<string[]> {
  const r = await db.prepare('SELECT DISTINCT muscle_group FROM exercises ORDER BY muscle_group ASC').all();
  return ((r as any).results || []).map((r: any) => r.muscle_group);
}
