import type { D1Database } from '@cloudflare/workers-types';

// ==================== 食物管理 ====================

export async function getFoodItems(db: D1Database, params?: {
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<any[]> {
  let sql = 'SELECT * FROM food_items WHERE 1=1';
  const p: unknown[] = [];
  if (params?.search) { sql += ' AND name LIKE ?'; p.push(`%${params.search}%`); }
  sql += ' ORDER BY name ASC LIMIT ? OFFSET ?';
  p.push(params?.limit || 50, params?.offset || 0);
  const r = await db.prepare(sql).bind(...p).all();
  return (r as any).results || [];
}

export async function getFoodById(db: D1Database, id: string): Promise<any | null> {
  return await db.prepare('SELECT * FROM food_items WHERE id = ?').bind(id).first();
}

export async function createFoodItem(db: D1Database, data: any): Promise<any> {
  const id = data.id || crypto.randomUUID();
  await db.prepare(
    'INSERT INTO food_items (id, name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, serving_size, serving_unit, is_custom, created_by_user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(
    id,
    data.name,
    data.caloriesPer100g || 0,
    data.proteinPer100g || 0,
    data.carbsPer100g || 0,
    data.fatPer100g || 0,
    data.servingSize || 100,
    data.servingUnit || 'g',
    data.isCustom ? 1 : 0,
    data.createdByUserId || null,
  ).run();
  return await getFoodById(db, id);
}

export async function deleteFoodItem(db: D1Database, id: string): Promise<boolean> {
  await db.prepare('DELETE FROM food_items WHERE id = ?').bind(id).run();
  return true;
}

// ==================== 餐食记录 ====================

export async function getMealRecords(db: D1Database, userId: string, date: number): Promise<any[]> {
  const startOfDay = date;
  const endOfDay = date + 86400;
  const r = await db.prepare(
    `SELECT mr.*, fi.name as food_name, fi.calories_per_100g, fi.protein_per_100g, fi.carbs_per_100g, fi.fat_per_100g
     FROM meal_records mr
     LEFT JOIN food_items fi ON mr.food_item_id = fi.id
     WHERE mr.user_id = ? AND mr.date >= ? AND mr.date < ?
     ORDER BY mr.created_at ASC`
  ).bind(userId, startOfDay, endOfDay).all();
  return (r as any).results || [];
}

export async function getMealRecordsInRange(db: D1Database, userId: string, startDate: number, endDate: number): Promise<any[]> {
  const r = await db.prepare(
    `SELECT mr.*, fi.name as food_name, fi.calories_per_100g, fi.protein_per_100g, fi.carbs_per_100g, fi.fat_per_100g
     FROM meal_records mr
     LEFT JOIN food_items fi ON mr.food_item_id = fi.id
     WHERE mr.user_id = ? AND mr.date >= ? AND mr.date <= ?
     ORDER BY mr.date ASC, mr.created_at ASC`
  ).bind(userId, startDate, endDate).all();
  return (r as any).results || [];
}

export async function createMealRecord(db: D1Database, data: any): Promise<any> {
  const id = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);
  await db.prepare(
    'INSERT INTO meal_records (id, user_id, date, meal_type, food_item_id, quantity_grams, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, data.userId, data.date || now, data.mealType, data.foodItemId, data.quantityGrams || 100, now).run();
  const r = await db.prepare('SELECT * FROM meal_records WHERE id = ?').bind(id).first();
  return r;
}

export async function deleteMealRecord(db: D1Database, id: string, userId: string): Promise<boolean> {
  await db.prepare('DELETE FROM meal_records WHERE id = ? AND user_id = ?').bind(id, userId).run();
  return true;
}
