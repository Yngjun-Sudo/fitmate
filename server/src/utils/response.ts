import { Response } from 'express';
import { ApiResponse } from '../types';

/**
 * 发送成功响应
 */
export function sendSuccess<T>(res: Response, data: T, message = 'ok', statusCode = 200): void {
  const body: ApiResponse<T> = {
    code: 0,
    data,
    message,
  };
  res.status(statusCode).json(body);
}

/**
 * 发送失败响应
 */
export function sendError(res: Response, code: number, message: string, statusCode?: number): void {
  const body: ApiResponse<null> = {
    code,
    data: null,
    message,
  };
  // 根据业务错误码映射 HTTP 状态码
  const httpStatus = statusCode || mapErrorCodeToStatus(code);
  res.status(httpStatus).json(body);
}

/**
 * 业务错误码 → HTTP 状态码映射
 */
function mapErrorCodeToStatus(code: number): number {
  if (code >= 400 && code < 500) return code;
  return 500;
}
