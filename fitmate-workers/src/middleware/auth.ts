/**
 * Authentication Middleware - Hono version
 * Verifies JWT token and attaches user to context
 */

import { createFactory } from 'hono/factory';
import { jwtVerify } from '../utils/jwt';
import type { D1Database } from '@cloudflare/workers-types';

// Context type definition
type Bindings = {
  DB: D1Database;
  JWT_SECRET: string;
  DEEPSEEK_API_KEY: string;
  DEEPSEEK_BASE_URL: string;
  CORS_ORIGIN: string;
};

type Variables = {
  user: {
    userId: number;
    email: string;
    username: string;
  };
};

const factory = createFactory<{ Bindings: Bindings; Variables: Variables }>();

/**
 * Authentication middleware
 * Verifies Bearer token in Authorization header
 */
export const authMiddleware = factory.createMiddleware(async (c, next) => {
  // Extract token from Authorization header
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json(
      { code: 401, data: null, message: 'Missing or invalid Authorization header' },
      401
    );
  }

  const token = authHeader.slice(7); // Remove 'Bearer ' prefix

  try {
    // Verify JWT token
    const payload = await jwtVerify(token, c.env.JWT_SECRET);

    if (!payload || !payload.userId) {
      return c.json(
        { code: 401, data: null, message: 'Invalid token payload' },
        401
      );
    }

    // Attach user info to context
    c.set('user', {
      userId: payload.userId as number,
      email: payload.email as string,
      username: payload.username as string,
    });

    await next();
  } catch (error) {
    console.error('[Auth Middleware] JWT verification failed:', error);
    
    return c.json(
      { code: 401, data: null, message: 'Invalid or expired token' },
      401
    );
  }
});

/**
 * Optional authentication middleware
 * Attaches user if token is present, but doesn't fail if missing
 */
export const optionalAuthMiddleware = factory.createMiddleware(async (c, next) => {
  const authHeader = c.req.header('Authorization');
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    
    try {
      const payload = await jwtVerify(token, c.env.JWT_SECRET);
      
      if (payload && payload.userId) {
        c.set('user', {
          userId: payload.userId as number,
          email: payload.email as string,
          username: payload.username as string,
        });
      }
    } catch (error) {
      // Ignore invalid tokens for optional auth
      console.warn('[Optional Auth] Invalid token ignored:', error);
    }
  }

  await next();
});
