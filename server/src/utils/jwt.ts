import jwt from 'jsonwebtoken';
import { config } from '../config';
import { JwtPayload } from '../types';

/**
 * 签发 JWT Token
 */
export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}

/**
 * 验证 JWT Token
 * 返回解析后的 payload，失败返回 null
 */
export function verifyToken(token: string): JwtPayload | null {
  try {
    const payload = jwt.verify(token, config.jwtSecret) as JwtPayload;
    return payload;
  } catch {
    return null;
  }
}
