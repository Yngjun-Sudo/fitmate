import { PrismaClient } from '@prisma/client';
import { AppError, ErrorCode } from '../types';

const prisma = new PrismaClient();

// === 训练计划 ===

export interface CreatePlanInput {
  name: string;
  description?: string;
  exercises: {
    exerciseId: string;
    dayOfWeek: number;
    sets: number;
    reps: number;
    durationSeconds?: number;
    restSeconds?: number;
    sortOrder?: number;
    notes?: string;
  }[];
}

export interface UpdatePlanInput extends Partial<CreatePlanInput> {}

/**
 * 获取用户的训练计划列表
 */
export async function getPlansByUserId(userId: string) {
  return prisma.workoutPlan.findMany({
    where: { userId },
    include: {
      exercises: {
        include: { exercise: true },
        orderBy: [{ dayOfWeek: 'asc' }, { sortOrder: 'asc' }],
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * 获取单个计划详情（含关联动作）
 */
export async function getPlanById(planId: string) {
  const plan = await prisma.workoutPlan.findUnique({
    where: { id: planId },
    include: {
      exercises: {
        include: { exercise: true },
        orderBy: [{ dayOfWeek: 'asc' }, { sortOrder: 'asc' }],
      },
    },
  });
  if (!plan) throw new AppError(ErrorCode.NOT_FOUND, '训练计划不存在');
  return plan;
}

/**
 * 创建训练计划（含嵌套 WorkoutPlanExercise）
 */
export async function createPlan(userId: string, input: CreatePlanInput) {
  return prisma.workoutPlan.create({
    data: {
      userId,
      name: input.name,
      description: input.description || '',
      exercises: {
        create: input.exercises.map((ex, idx) => ({
          exerciseId: ex.exerciseId,
          dayOfWeek: ex.dayOfWeek,
          sets: ex.sets,
          reps: ex.reps,
          durationSeconds: ex.durationSeconds || 0,
          restSeconds: ex.restSeconds || 60,
          sortOrder: ex.sortOrder ?? idx,
          notes: ex.notes || '',
        })),
      },
    },
    include: {
      exercises: {
        include: { exercise: true },
        orderBy: [{ dayOfWeek: 'asc' }, { sortOrder: 'asc' }],
      },
    },
  });
}

/**
 * 更新训练计划（先删除旧关联，再创建新关联）
 */
export async function updatePlan(planId: string, userId: string, input: UpdatePlanInput) {
  const existing = await prisma.workoutPlan.findUnique({ where: { id: planId } });
  if (!existing) throw new AppError(ErrorCode.NOT_FOUND, '训练计划不存在');
  if (existing.userId !== userId) throw new AppError(ErrorCode.FORBIDDEN, '无权修改此计划');

  // 更新基本信息
  const updateData: Record<string, unknown> = {};
  if (input.name !== undefined) updateData.name = input.name;
  if (input.description !== undefined) updateData.description = input.description;

  // 如果提供了新的 exercises，先删除旧的再创建新的
  if (input.exercises) {
    await prisma.workoutPlanExercise.deleteMany({ where: { planId } });
  }

  return prisma.workoutPlan.update({
    where: { id: planId },
    data: {
      ...updateData,
      ...(input.exercises
        ? {
            exercises: {
              create: input.exercises.map((ex, idx) => ({
                exerciseId: ex.exerciseId,
                dayOfWeek: ex.dayOfWeek,
                sets: ex.sets,
                reps: ex.reps,
                durationSeconds: ex.durationSeconds || 0,
                restSeconds: ex.restSeconds || 60,
                sortOrder: ex.sortOrder ?? idx,
                notes: ex.notes || '',
              })),
            },
          }
        : {}),
    },
    include: {
      exercises: {
        include: { exercise: true },
        orderBy: [{ dayOfWeek: 'asc' }, { sortOrder: 'asc' }],
      },
    },
  });
}

/**
 * 删除训练计划
 */
export async function deletePlan(planId: string, userId: string) {
  const existing = await prisma.workoutPlan.findUnique({ where: { id: planId } });
  if (!existing) throw new AppError(ErrorCode.NOT_FOUND, '训练计划不存在');
  if (existing.userId !== userId) throw new AppError(ErrorCode.FORBIDDEN, '无权删除此计划');

  await prisma.workoutPlan.delete({ where: { id: planId } });
}

// === 训练记录 ===

export interface CreateLogInput {
  planId?: string;
  date: string;
  durationMinutes?: number;
  notes?: string;
  exercises: {
    exerciseId: string;
    notes?: string;
    sets: { setNumber: number; reps: number; weightKg: number }[];
  }[];
}

export interface LogQuery {
  date?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

/**
 * 获取训练记录列表（支持日期范围过滤）
 */
export async function getLogsByUserId(userId: string, query: LogQuery) {
  const { date, from, to, page = 1, pageSize = 20 } = query;

  const where: Record<string, unknown> = { userId };
  if (date) {
    const d = new Date(date);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    where.date = { gte: d, lt: next };
  } else if (from || to) {
    where.date = {};
    if (from) (where.date as Record<string, Date>).gte = new Date(from);
    if (to) {
      const toDate = new Date(to);
      toDate.setDate(toDate.getDate() + 1);
      (where.date as Record<string, Date>).lt = toDate;
    }
  }

  const [items, total] = await Promise.all([
    prisma.workoutLog.findMany({
      where,
      include: {
        plan: { select: { id: true, name: true } },
        exercises: {
          include: {
            exercise: { select: { id: true, name: true, category: true, muscleGroup: true } },
            sets: { orderBy: { setNumber: 'asc' } },
          },
        },
      },
      orderBy: { date: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.workoutLog.count({ where }),
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
 * 获取单个训练记录详情
 */
export async function getLogById(logId: string) {
  const log = await prisma.workoutLog.findUnique({
    where: { id: logId },
    include: {
      plan: { select: { id: true, name: true } },
      exercises: {
        include: {
          exercise: { select: { id: true, name: true, category: true, muscleGroup: true } },
          sets: { orderBy: { setNumber: 'asc' } },
        },
      },
    },
  });
  if (!log) throw new AppError(ErrorCode.NOT_FOUND, '训练记录不存在');
  return log;
}

/**
 * 创建训练记录（含嵌套 LogExercise + LogSet）
 */
export async function createLog(userId: string, input: CreateLogInput) {
  return prisma.workoutLog.create({
    data: {
      userId,
      planId: input.planId || null,
      date: new Date(input.date),
      durationMinutes: input.durationMinutes || 0,
      notes: input.notes || '',
      exercises: {
        create: input.exercises.map((ex) => ({
          exerciseId: ex.exerciseId,
          notes: ex.notes || '',
          sets: {
            create: ex.sets.map((s) => ({
              setNumber: s.setNumber,
              reps: s.reps,
              weightKg: s.weightKg,
            })),
          },
        })),
      },
    },
    include: {
      plan: { select: { id: true, name: true } },
      exercises: {
        include: {
          exercise: { select: { id: true, name: true, category: true, muscleGroup: true } },
          sets: { orderBy: { setNumber: 'asc' } },
        },
      },
    },
  });
}

/**
 * 更新训练记录
 */
export async function updateLog(logId: string, userId: string, input: Partial<CreateLogInput>) {
  const existing = await prisma.workoutLog.findUnique({ where: { id: logId } });
  if (!existing) throw new AppError(ErrorCode.NOT_FOUND, '训练记录不存在');
  if (existing.userId !== userId) throw new AppError(ErrorCode.FORBIDDEN, '无权修改此记录');

  // 简化：只更新顶层字段 + notes
  const data: Record<string, unknown> = {};
  if (input.date !== undefined) data.date = new Date(input.date);
  if (input.durationMinutes !== undefined) data.durationMinutes = input.durationMinutes;
  if (input.notes !== undefined) data.notes = input.notes;

  return prisma.workoutLog.update({
    where: { id: logId },
    data,
    include: {
      plan: { select: { id: true, name: true } },
      exercises: {
        include: {
          exercise: { select: { id: true, name: true, category: true, muscleGroup: true } },
          sets: { orderBy: { setNumber: 'asc' } },
        },
      },
    },
  });
}
