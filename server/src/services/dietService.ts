import { PrismaClient } from '@prisma/client';
import { AppError, ErrorCode } from '../types';

const prisma = new PrismaClient();

// === TDEE 计算 ===

export interface TDEECalcInput {
  gender: 'male' | 'female' | 'other';
  weightKg: number;
  heightCm: number;
  age: number;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  goal: 'lose_fat' | 'build_muscle' | 'maintain' | 'general_fitness';
}

export interface TDEEResult {
  bmr: number;
  tdee: number;
  targetCalories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
}

/** 活动系数映射 */
const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

/**
 * TDEE 计算服务
 * 使用 Mifflin-St Jeor 公式
 *   男：BMR = 10×w + 6.25×h - 5×a + 5
 *   女：BMR = 10×w + 6.25×h - 5×a - 161
 *   TDEE = BMR × 活动系数
 *   减脂：TDEE - 400kcal，增肌：TDEE + 400kcal
 */
export function calculateTDEE(input: TDEECalcInput): TDEEResult {
  const { gender, weightKg, heightCm, age, activityLevel, goal } = input;

  // Mifflin-St Jeor BMR
  let bmr: number;
  if (gender === 'male') {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  } else {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  }

  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] || 1.2;
  const tdee = Math.round(bmr * multiplier);

  // 热量调整
  let targetCalories: number;
  switch (goal) {
    case 'lose_fat':
      targetCalories = tdee - 400;
      break;
    case 'build_muscle':
      targetCalories = tdee + 400;
      break;
    default:
      targetCalories = tdee;
  }

  // 宏量营养素分配
  // 蛋白质：2g/kg (增肌) / 1.6g/kg (减脂/保持)
  const proteinPerKg = goal === 'build_muscle' ? 2.0 : 1.6;
  const proteinGrams = Math.round(weightKg * proteinPerKg);
  const proteinCals = proteinGrams * 4;

  // 脂肪：占总热量 25%
  const fatCals = Math.round(targetCalories * 0.25);
  const fatGrams = Math.round(fatCals / 9);

  // 碳水：剩余热量
  const carbsCals = targetCalories - proteinCals - fatCals;
  const carbsGrams = Math.round(carbsCals / 4);

  return {
    bmr: Math.round(bmr),
    tdee,
    targetCalories,
    proteinGrams,
    carbsGrams,
    fatGrams,
  };
}

// === 食物搜索 ===

/**
 * 搜索食物（先查本地DB，无结果返回空）
 */
export async function searchFoodItems(search: string, page = 1, pageSize = 20) {
  const [items, total] = await Promise.all([
    prisma.foodItem.findMany({
      where: {
        name: { contains: search },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { name: 'asc' },
    }),
    prisma.foodItem.count({
      where: { name: { contains: search } },
    }),
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
 * 创建自定义食物
 */
export async function createFoodItem(data: {
  name: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  servingSize?: number;
  servingUnit?: string;
  createdByUserId?: string;
}) {
  return prisma.foodItem.create({
    data: {
      name: data.name,
      caloriesPer100g: data.caloriesPer100g,
      proteinPer100g: data.proteinPer100g,
      carbsPer100g: data.carbsPer100g,
      fatPer100g: data.fatPer100g,
      servingSize: data.servingSize || 100,
      servingUnit: data.servingUnit || 'g',
      isCustom: true,
      createdByUserId: data.createdByUserId || null,
    },
  });
}

/**
 * 缓存从 DeepSeek 获取的食物数据
 */
export async function cacheFoodItem(data: {
  name: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
}) {
  return prisma.foodItem.create({
    data: {
      name: data.name,
      caloriesPer100g: data.caloriesPer100g,
      proteinPer100g: data.proteinPer100g,
      carbsPer100g: data.carbsPer100g,
      fatPer100g: data.fatPer100g,
      servingSize: 100,
      servingUnit: 'g',
      isCustom: false,
    },
  });
}

// === 饮食记录 ===

export interface CreateMealRecordInput {
  foodItemId: string;
  quantityGrams: number;
  mealType: string;
  date: string;
}

/**
 * 获取用户某一天的饮食记录
 */
export async function getMealRecords(userId: string, date: string) {
  const d = new Date(date);
  const next = new Date(d);
  next.setDate(next.getDate() + 1);

  return prisma.mealRecord.findMany({
    where: {
      userId,
      date: { gte: d, lt: next },
    },
    include: {
      foodItem: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * 创建饮食记录
 */
export async function createMealRecord(userId: string, input: CreateMealRecordInput) {
  // 验证食物存在
  const foodItem = await prisma.foodItem.findUnique({ where: { id: input.foodItemId } });
  if (!foodItem) {
    throw new AppError(ErrorCode.NOT_FOUND, '食物不存在');
  }

  return prisma.mealRecord.create({
    data: {
      userId,
      foodItemId: input.foodItemId,
      quantityGrams: input.quantityGrams,
      mealType: input.mealType,
      date: new Date(input.date),
    },
    include: {
      foodItem: true,
    },
  });
}

/**
 * 删除饮食记录
 */
export async function deleteMealRecord(recordId: string, userId: string) {
  const record = await prisma.mealRecord.findUnique({ where: { id: recordId } });
  if (!record) throw new AppError(ErrorCode.NOT_FOUND, '饮食记录不存在');
  if (record.userId !== userId) throw new AppError(ErrorCode.FORBIDDEN, '无权删除此记录');

  await prisma.mealRecord.delete({ where: { id: recordId } });
}

/**
 * 获取用户近7天饮食摘要（用于AI上下文）
 */
export async function getRecentDietSummary(userId: string, days = 7) {
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);
  fromDate.setHours(0, 0, 0, 0);

  const records = await prisma.mealRecord.findMany({
    where: {
      userId,
      date: { gte: fromDate },
    },
    include: { foodItem: true },
  });

  // 按日期汇总热量
  const dailyTotals: Record<string, number> = {};
  for (const r of records) {
    const d = r.date.toISOString().split('T')[0];
    const cals = (r.foodItem.caloriesPer100g / 100) * r.quantityGrams;
    dailyTotals[d] = (dailyTotals[d] || 0) + cals;
  }

  const avgCalories = Object.keys(dailyTotals).length > 0
    ? Math.round(Object.values(dailyTotals).reduce((a, b) => a + b, 0) / Object.keys(dailyTotals).length)
    : 0;

  return { dailyTotals, avgCalories, recordCount: records.length };
}
