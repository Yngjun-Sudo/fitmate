import { Context } from 'hono';
import { AppError, ErrorCode } from '../types';

/**
 * 全局错误处理（Hono onError 回调）
 * 签名：(err: Error | unknown, c: Context) => Response
 */
export function errorHandler(err: Error | unknown, c: Context): Response {
  console.error('[Global Error]', err);

  // AppError：业务错误
  if (err instanceof AppError) {
    const httpStatus = err.code === ErrorCode.UNAUTHORIZED ? 401
      : err.code === ErrorCode.CONFLICT ? 409
      : err.code === ErrorCode.NOT_FOUND ? 404
      : err.code === ErrorCode.VALIDATION_ERROR ? 400
      : 500;
    return c.json(
      {
        code: err.code,
        data: null,
        message: err.message,
      },
      httpStatus as any
    );
  }

  // Zod 验证错误
  if (err && typeof err === 'object' && 'name' in err && (err as any).name === 'ZodError') {
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
      message: err instanceof Error ? err.message : '服务器内部错误',
    },
    500
  );
}
