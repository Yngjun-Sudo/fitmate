import { format, parseISO, isValid } from 'date-fns';
import { zhCN } from 'date-fns/locale';

/**
 * 格式化日期为 YYYY-MM-DD
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return '--';
  return format(d, 'yyyy-MM-dd');
}

/**
 * 格式化日期为中文显示
 */
export function formatDateCN(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return '--';
  return format(d, 'yyyy年M月d日', { locale: zhCN });
}

/**
 * 格式化日期时间为相对友好的显示
 */
export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return '--';
  return format(d, 'yyyy-MM-dd HH:mm');
}

/**
 * 格式化体重（kg）
 */
export function formatWeight(kg: number | null): string {
  if (kg == null) return '--';
  return `${kg.toFixed(1)} kg`;
}

/**
 * 格式化身高（cm）
 */
export function formatHeight(cm: number | null): string {
  if (cm == null) return '--';
  return `${cm.toFixed(0)} cm`;
}

/**
 * 格式化热量（kcal）
 */
export function formatCalories(kcal: number): string {
  return `${Math.round(kcal)} kcal`;
}

/**
 * 格式化营养素克数
 */
export function formatGrams(g: number): string {
  return `${g.toFixed(1)} g`;
}

/**
 * 获取星期几的中文名
 */
export function getDayOfWeekName(day: number): string {
  const names = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return names[day] || '未知';
}

/**
 * 获取餐次中文名
 */
export function getMealTypeName(type: string): string {
  const map: Record<string, string> = {
    breakfast: '早餐',
    lunch: '午餐',
    dinner: '晚餐',
    snack: '加餐',
  };
  return map[type] || type;
}

/**
 * 获取目标中文名
 */
export function getGoalName(goal: string): string {
  const map: Record<string, string> = {
    lose_fat: '减脂',
    build_muscle: '增肌',
    maintain: '保持',
    general_fitness: '综合健康',
  };
  return map[goal] || goal;
}

/**
 * 获取活动水平中文名
 */
export function getActivityLevelName(level: string): string {
  const map: Record<string, string> = {
    sedentary: '久坐不动',
    light: '轻度活动',
    moderate: '中度活动',
    active: '积极活动',
    very_active: '高强度活动',
  };
  return map[level] || level;
}

/**
 * 获取动作分类中文名
 */
export function getCategoryName(category: string): string {
  const map: Record<string, string> = {
    chest: '胸部',
    back: '背部',
    shoulders: '肩部',
    legs: '腿部',
    arms: '手臂',
    core: '核心',
    full_body: '全身',
  };
  return map[category] || category;
}

/**
 * 获取难度中文名
 */
export function getDifficultyName(difficulty: string): string {
  const map: Record<string, string> = {
    beginner: '入门',
    intermediate: '中级',
    advanced: '高级',
  };
  return map[difficulty] || difficulty;
}
