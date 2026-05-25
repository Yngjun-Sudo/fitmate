/**
 * 表单校验工具
 */

/** 邮箱格式校验 */
export function isValidEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/** 密码校验：至少6个字符 */
export function isValidPassword(password: string): boolean {
  return password.length >= 6;
}

/** 身高范围校验 (cm): 100-250 */
export function isValidHeight(cm: number): boolean {
  return cm >= 100 && cm <= 250;
}

/** 体重范围校验 (kg): 30-300 */
export function isValidWeight(kg: number): boolean {
  return kg >= 30 && kg <= 300;
}

/** 年龄范围校验: 10-120 */
export function isValidAge(age: number): boolean {
  return age >= 10 && age <= 120;
}

/** 姓名校验：非空且不超过50字符 */
export function isValidName(name: string): boolean {
  return name.trim().length > 0 && name.trim().length <= 50;
}

/** 获取邮箱错误提示 */
export function getEmailError(email: string): string {
  if (!email) return '请输入邮箱';
  if (!isValidEmail(email)) return '请输入有效的邮箱地址';
  return '';
}

/** 获取密码错误提示 */
export function getPasswordError(password: string): string {
  if (!password) return '请输入密码';
  if (!isValidPassword(password)) return '密码至少6个字符';
  return '';
}

/** 获取姓名的错误提示 */
export function getNameError(name: string): string {
  if (!name.trim()) return '请输入姓名';
  if (name.trim().length > 50) return '姓名不能超过50个字符';
  return '';
}

/** 获取身高错误提示 */
export function getHeightError(cm: number | string): string {
  const val = typeof cm === 'string' ? parseFloat(cm) : cm;
  if (isNaN(val)) return '请输入有效身高';
  if (!isValidHeight(val)) return '身高范围：100-250 cm';
  return '';
}

/** 获取体重错误提示 */
export function getWeightError(kg: number | string): string {
  const val = typeof kg === 'string' ? parseFloat(kg) : kg;
  if (isNaN(val)) return '请输入有效体重';
  if (!isValidWeight(val)) return '体重范围：30-300 kg';
  return '';
}

/** 获取年龄错误提示 */
export function getAgeError(age: number | string): string {
  const val = typeof age === 'string' ? parseInt(age, 10) : age;
  if (isNaN(val)) return '请输入有效年龄';
  if (!isValidAge(val)) return '年龄范围：10-120 岁';
  return '';
}
