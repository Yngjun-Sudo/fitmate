import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import appRouter from './app';

// 环境变量类型定义
type Bindings = {
  DB: D1Database;
  JWT_SECRET: string;
  DEEPSEEK_API_KEY: string;
  DEEPSEEK_BASE_URL: string;
  CORS_ORIGIN: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// 全局中间件
app.use('*', logger());
app.use('*', cors({
  origin: (origin, c) => {
    const allowedOrigins = c.env.CORS_ORIGIN?.split(',') || [];
    if (allowedOrigins.includes(origin) || !origin) {
      return origin;
    }
    return null;
  },
  credentials: true,
}));

// 健康检查
app.get('/api/health', (c) => {
  return c.json({ code: 0, data: { status: 'ok', timestamp: Date.now() }, message: 'FitMate API is running' });
});

// 挂载主路由
app.route('/api', appRouter);

// 404 处理
app.notFound((c) => {
  return c.json({ code: 404, data: null, message: 'Route not found' }, 404);
});

// 错误处理
app.onError((err, c) => {
  console.error('[ERROR]', err.message);
  return c.json({ code: 500, data: null, message: 'Internal server error' }, 500);
});

export default app;
