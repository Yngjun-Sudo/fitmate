import { Context } from 'hono';
import { ApiResponse } from '../types';

/**
 * 发送成功响应
 */
export function sendSuccess<T>(
  c: any,
  data: T,
  message = 'ok',
  statusCode = 200
): Response {
  const body: ApiResponse<T> = {
    code: 0,
    data,
    message,
  };
  return (c.json as any)(body, statusCode as any);
}

/**
 * 发送失败响应
 */
export function sendError(
  c: any,
  code: number,
  message: string,
  statusCode?: number
): Response {
  const body: ApiResponse<null> = {
    code,
    data: null,
    message,
  };
  const httpStatus = statusCode || mapErrorCodeToStatus(code);
  return (c.json as any)(body, httpStatus as any);
}

/**
 * 业务错误码 → HTTP 状态码映射
 */
function mapErrorCodeToStatus(code: number): number {
  if (code >= 400 && code < 500) return code;
  return 500;
}
