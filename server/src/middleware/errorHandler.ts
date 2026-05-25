import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { AppError, ErrorCode } from '../types';
import { sendError } from '../utils/response';

/**
 * 全局错误处理中间件
 * ZodError → 400, Prisma NotFound → 404, AppError → 自定义 code, 其他 → 500
 */
export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  console.error('[Error]', err.message);

  // Zod 校验错误
  if (err instanceof ZodError) {
    const message = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
    sendError(res, ErrorCode.VALIDATION_ERROR, message, 400);
    return;
  }

  // Prisma 未找到记录
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2025') {
      sendError(res, ErrorCode.NOT_FOUND, '请求的资源不存在', 404);
      return;
    }
    if (err.code === 'P2002') {
      sendError(res, ErrorCode.CONFLICT, '数据已存在，请勿重复创建', 409);
      return;
    }
    sendError(res, ErrorCode.INTERNAL_ERROR, '数据库操作失败', 500);
    return;
  }

  // 自定义业务错误
  if (err instanceof AppError) {
    sendError(res, err.code, err.message);
    return;
  }

  // 未知错误
  sendError(res, ErrorCode.INTERNAL_ERROR, process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message, 500);
}
