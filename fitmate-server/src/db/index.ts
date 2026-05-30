import { drizzle, DrizzleD1Database } from 'drizzle-orm/d1';
import * as schema from '../../d1/schema';

// 数据库类型导出
export type Database = DrizzleD1Database<typeof schema>;

// Drizzle 实例缓存（Workers 环境中复用）
let dbInstance: Database | null = null;

/**
 * 获取 Drizzle 数据库实例
 * @param d1Binding - D1 数据库绑定（从 env.DB 传入）
 */
export function getDatabase(d1Binding: D1Database): Database {
  // 如果已有实例且 binding 相同，复用
  if (dbInstance && (dbInstance as any).binding === d1Binding) {
    return dbInstance;
  }

  // 创建新实例
  const db = drizzle(d1Binding, { schema });
  (db as any).binding = d1Binding; // 缓存 binding 引用
  dbInstance = db;

  return db;
}

// 导出 schema（供 service 层使用）
export * from '../../d1/schema';
export { eq, and, or, like, between, count, asc, desc, sql } from 'drizzle-orm';
