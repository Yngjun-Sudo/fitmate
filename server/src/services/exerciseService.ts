import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface ExerciseQuery {
  category?: string;
  muscle?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

/**
 * 获取动作列表（支持分类/肌群/关键词过滤 + 分页）
 */
export async function getExercises(query: ExerciseQuery) {
  const { category, muscle, search, page = 1, pageSize = 20 } = query;

  const where: Record<string, unknown> = {};
  if (category) where.category = category;
  if (muscle) where.muscleGroup = { contains: muscle };
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { description: { contains: search } },
      { muscleGroup: { contains: search } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.exercise.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { category: 'asc' },
    }),
    prisma.exercise.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * 获取单个动作详情
 */
export async function getExerciseById(id: string) {
  return prisma.exercise.findUnique({ where: { id } });
}
