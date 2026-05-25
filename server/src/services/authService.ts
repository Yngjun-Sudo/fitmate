import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { signToken } from '../utils/jwt';
import { AppError, ErrorCode, RegisterInput, LoginInput, UpdateProfileInput, JwtPayload } from '../types';

const prisma = new PrismaClient();

/** 密码哈希轮次 */
const SALT_ROUNDS = 10;

/**
 * 用户注册
 * 检查邮箱唯一性，哈希密码，创建用户，返回 JWT
 */
export async function register(input: RegisterInput) {
  // 邮箱去重
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new AppError(ErrorCode.CONFLICT, '该邮箱已被注册');
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      name: input.name,
    },
    select: {
      id: true,
      email: true,
      name: true,
      heightCm: true,
      weightKg: true,
      birthDate: true,
      gender: true,
      goal: true,
      activityLevel: true,
      createdAt: true,
    },
  });

  const token = signToken({ userId: user.id, email: user.email });

  return { user, token };
}

/**
 * 用户登录
 * 验证邮箱密码，返回 JWT
 */
export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) {
    throw new AppError(ErrorCode.UNAUTHORIZED, '邮箱或密码错误');
  }

  const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);
  if (!isPasswordValid) {
    throw new AppError(ErrorCode.UNAUTHORIZED, '邮箱或密码错误');
  }

  const token = signToken({ userId: user.id, email: user.email });

  const { passwordHash: _, ...safeUser } = user;
  return { user: safeUser, token };
}

/**
 * 获取当前用户信息
 */
export async function getProfile(userPayload: JwtPayload) {
  const user = await prisma.user.findUnique({
    where: { id: userPayload.userId },
    select: {
      id: true,
      email: true,
      name: true,
      heightCm: true,
      weightKg: true,
      birthDate: true,
      gender: true,
      goal: true,
      activityLevel: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new AppError(ErrorCode.NOT_FOUND, '用户不存在');
  }

  return user;
}

/**
 * 更新用户个人信息
 */
export async function updateProfile(userId: string, input: UpdateProfileInput) {
  // 处理日期字段
  const data: Record<string, unknown> = { ...input };
  if (input.birthDate) {
    data.birthDate = new Date(input.birthDate);
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      email: true,
      name: true,
      heightCm: true,
      weightKg: true,
      birthDate: true,
      gender: true,
      goal: true,
      activityLevel: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return user;
}
