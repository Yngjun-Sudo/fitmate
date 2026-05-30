import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import app from './app';
import { errorHandler } from './middleware/errorHandler';

// 环境变量类型定义
type Env = {
  DB: D1Database;
  JWT_SECRET: string;
  DEEPSEEK_API_KEY: string;
  DEEPSEEK_BASE_URL: string;
  CORS_ORIGIN: string;
};

// Workers 入口
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    // 将 env 注入到 Hono 上下文（通过 c.env 访问）
    return app.fetch(request, env, ctx);
  },
};

// 本地开发（可选，使用 wrangler dev 时不需要）
if (import.meta.url.startsWith('file:')) {
  const port = 8787;
  console.log(`🏋️ FitMate Server running on http://localhost:${port}`);
  console.log(`📋 Health check: http://localhost:${port}/api/health`);
}
