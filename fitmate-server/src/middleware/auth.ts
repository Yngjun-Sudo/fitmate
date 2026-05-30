import { verifyToken } from '../utils/jwt';
import type { Context, Next } from 'hono';
import type { JwtPayload } from '../types/auth';

export async function authMiddleware(c: Context, next: Next) {
  // Extract token from Authorization header
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ code: 401, data: null, message: 'Unauthorized: Missing or invalid token' }, 401);
  }
  
  const token = authHeader.split(' ')[1];
  
  // Verify token
  const payload = await verifyToken(c, token);
  
  if (!payload) {
    return c.json({ code: 401, data: null, message: 'Unauthorized: Invalid or expired token' }, 401);
  }
  
  // Attach user info to context
  c.set('jwtPayload', payload as JwtPayload);
  
  await next();
}
