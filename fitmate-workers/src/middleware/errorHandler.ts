/**
 * Error Handler Middleware - Global error handling for Hono
 * Provides consistent error responses across all routes
 */

import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { Context } from 'hono';

/**
 * Custom error class for API errors
 */
export class APIError extends Error {
  constructor(
    public status: number,
    public code: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'APIError';
  }
}

/**
 * Global error handler middleware
 * Catches all errors and returns consistent JSON response
 */
export function errorHandler() {
  return async (c: Context, next: () => Promise<void>) => {
    try {
      await next();
    } catch (error) {
      console.error('[Global Error Handler]', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        path: c.req.path,
        method: c.req.method,
        timestamp: new Date().toISOString(),
      });

      // Handle Hono HTTP exceptions
      if (error instanceof HTTPException) {
        return c.json(
          {
            code: error.status,
            data: null,
            message: error.message,
            ...(error.res ? { details: error.res } : {}),
          },
          error.status
        );
      }

      // Handle custom API errors
      if (error instanceof APIError) {
        return c.json(
          {
            code: error.code,
            data: error.details || null,
            message: error.message,
          },
          error.status
        );
      }

      // Handle validation errors (Zod)
      if (error.name === 'ZodError' || error.constructor?.name === 'ZodError') {
        return c.json(
          {
            code: 400,
            data: error.errors || null,
            message: 'Validation error',
          },
          400
        );
      }

      // Handle database errors
      if (error.message?.includes('D1_ERROR')) {
        return c.json(
          {
            code: 500,
            data: null,
            message: 'Database error occurred',
          },
          500
        );
      }

      // Handle fetch/network errors
      if (error.name === 'FetchError' || error.message?.includes('fetch')) {
        return c.json(
          {
            code: 503,
            data: null,
            message: 'External service unavailable',
          },
          503
        );
      }

      // Default: Internal server error
      return c.json(
        {
          code: 500,
          data: null,
          message:
            c.env.NODE_ENV === 'production'
              ? 'Internal server error'
              : error instanceof Error
              ? error.message
              : 'Unknown error',
        },
        500
      );
    }
  };
}

/**
 * Not found handler
 */
export function notFoundHandler() {
  return (c: Context) => {
    return c.json(
      {
        code: 404,
        data: null,
        message: `Route ${c.req.method} ${c.req.path} not found`,
      },
      404
    );
  };
}

/**
 * Timeout handler - Handles request timeout
 * Note: Cloudflare Workers has a 10ms CPU limit on free plan
 */
export function timeoutHandler(maxMs: number = 10000) {
  return async (c: Context, next: () => Promise<void>) => {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new APIError(408, 408, 'Request timeout'));
      }, maxMs);
    });

    try {
      await Promise.race([next(), timeoutPromise]);
    } catch (error) {
      if (error instanceof APIError && error.code === 408) {
        return c.json(
          {
            code: 408,
            data: null,
            message: 'Request timeout. Please try again.',
          },
          408
        );
      }
      throw error;
    }
  };
}

/**
 * Rate limit handler - Simple in-memory rate limiting
 * Note: For production, use Cloudflare Rate Limiting or KV storage
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function rateLimitHandler(maxRequests: number = 100, windowMs: number = 60000) {
  return async (c: Context, next: () => Promise<void>) => {
    const clientIP = c.req.header('CF-Connecting-IP') || 'unknown';
    const now = Date.now();
    const windowStart = Math.floor(now / windowMs) * windowMs;

    const key = `${clientIP}:${windowStart}`;
    const requestData = requestCounts.get(key) || { count: 0, resetTime: windowStart + windowMs };

    if (requestData.count >= maxRequests) {
      return c.json(
        {
          code: 429,
          data: null,
          message: 'Rate limit exceeded. Please try again later.',
        },
        429,
        {
          'Retry-After': Math.ceil((requestData.resetTime - now) / 1000).toString(),
        }
      );
    }

    requestData.count++;
    requestCounts.set(key, requestData);

    // Clean up old entries
    if (requestCounts.size > 10000) {
      for (const [k, v] of requestCounts.entries()) {
        if (v.resetTime < now) {
          requestCounts.delete(k);
        }
      }
    }

    await next();
  };
}
