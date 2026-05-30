import { Context } from 'hono';
import { AppError, ErrorCode } from '../types';

/**
 * 全局错误处理中间件（Hono version）
 */
export function errorHandler(err: Error, c: Context): Response {
  console.error('[Global Error]', err.message, err.stack);

  // AppError：业务错误
  if (err instanceof AppError) {
    return c.json(
      {
        code: err.code,
        data: null,
        message: err.message,
      },
      err.code
    );
  }

  // Zod 验证错误
  if (err.name === 'ZodError') {
    return c.json(
      {
        code: ErrorCode.VALIDATION_ERROR,
        data: null,
        message: '请求参数错误',
        details: (err as any).errors,
      },
      400
    );
  }

  // 默认：服务器内部错误
  return c.json(
    {
      code: ErrorCode.INTERNAL_ERROR,
      data: null,
      message: '服务器内部错误',
    },
    500
  );
}
