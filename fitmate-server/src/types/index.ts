import { z } from 'zod';

// === 环境变量类型 ===
export type Env = {
  DB: D1Database;
  JWT_SECRET: string;
  DEEPSEEK_API_KEY: string;
  DEEPSEEK_BASE_URL: string;
  CORS_ORIGIN: string;
};

// === JWT Payload ===
export interface JwtPayload {
  userId: string;
  email: string;
}

// === 用户类型 ===
export const GenderEnum = z.enum(['male', 'female', 'other']);
export const GoalEnum = z.enum(['lose_fat', 'build_muscle', 'maintain', 'general_fitness']);
export const ActivityLevelEnum = z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']);

// === Auth DTOs ===
export const RegisterSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(6, '密码至少6个字符'),
  name: z.string().min(1, '请输入姓名').max(50),
});

export const LoginSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(1, '请输入密码'),
});

export const UpdateProfileSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  heightCm: z.number().min(100).max(250).optional(),
  weightKg: z.number().min(30).max(300).optional(),
  birthDate: z.string().optional(),
  gender: GenderEnum.optional(),
  goal: GoalEnum.optional(),
  activityLevel: ActivityLevelEnum.optional(),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

// === 统一响应 ===
export interface ApiResponse<T = unknown> {
  code: number;
  data: T | null;
  message: string;
}

// === 错误码 ===
export enum ErrorCode {
  SUCCESS = 0,
  VALIDATION_ERROR = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  INTERNAL_ERROR = 500,
}

// === 自定义错误 ===
export class AppError extends Error {
  public code: number;
  constructor(code: number, message: string) {
    super(message);
    this.code = code;
    this.name = 'AppError';
  }
}
