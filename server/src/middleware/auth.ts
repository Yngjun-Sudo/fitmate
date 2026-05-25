import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { sendError } from '../utils/response';
import { ErrorCode } from '../types';

/**
 * JWT 认证中间件
 * 从 Authorization Header 提取 Bearer token，验证后注入 req.user
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
