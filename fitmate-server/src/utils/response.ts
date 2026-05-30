import { Context } from 'hono';
import { ApiResponse } from '../types';

/**
 * 发送成功响应
 */
export function sendSuccess<T>(
  c: Context,
  data: T,
  message = 'ok',
  statusCode = 200
): Response {
  const body: ApiResponse<T> = {
    code: 0,
    data,
    message,
  };
  return c.json(body, statusCode);
}

/**
 * 发送失败响应
 */
export function sendError(
  c: Context,
  code: number,
  message: string,
  statusCode?: number
): Response {
  const body: ApiResponse<null> = {
    code,
    data: null,
    message,
  };
  // 根据业务错误码映射 HTTP 状态码
  const httpStatus = statusCode || mapErrorCodeToStatus(code);
  return c.json(body, httpStatus);
}

/**
 * 业务错误码 → HTTP 状态码映射
 */
function mapErrorCodeToStatus(code: number): number {
  if (code >= 400 && code < 500) return code;
  return 500;
}
