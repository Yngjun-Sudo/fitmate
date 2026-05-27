import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { sendError } from '../utils/response';
import { ErrorCode } from '../types';

/**
 * JWT 认证中间件（强制）
 * 从 Authorization Header 提取 Bearer token，验证后注入 req.user
 * 未提供 token 或 token 无效时返回 401，阻止请求继续
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendError(res, ErrorCode.UNAUTHORIZED, '未提供认证令牌');
    return;
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);

  if (!payload) {
    sendError(res, ErrorCode.UNAUTHORIZED, '认证令牌无效或已过期');
    return;
  }

  req.user = payload;
  next();
}

/**
 * JWT 可选认证中间件
 * 尝试从 Authorization Header 提取 Bearer token 并验证
 * 如果 token 存在且有效，注入 req.user；否则继续但不设置 req.user
 * 用于公开可访问但登录用户有更好体验的路由
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);
    if (payload) {
      req.user = payload;
    }
  }

  next();
}
