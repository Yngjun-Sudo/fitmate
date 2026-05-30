import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { errorHandler } from './middleware/errorHandler';

// 路由导入
import authRoutes from './routes/auth';
import exerciseRoutes from './routes/exercises';
import workoutPlanRoutes from './routes/workoutPlans';
import workoutLogRoutes from './routes/workoutLogs';
import dietRoutes from './routes/diet';
import chatRoutes from './routes/chat';

// 环境变量类型定义
type Env = {
  DB: D1Database;
  JWT_SECRET: string;
  DEEPSEEK_API_KEY: string;
  DEEPSEEK_BASE_URL: string;
  CORS_ORIGIN: string;
};

// JWT Payload 类型
interface JwtPayload {
  userId: string;
  email: string;
}

// 创建 Hono 应用
const app = new Hono<{ Bindings: Env; Variables: { user?: JwtPayload } }>();

// === 中间件 ===
// CORS: 支持多域名
app.use(
  '*',
  cors({
    origin: (origin) => {
      if (!origin) return 'http://localhost:5173';
      const allowedOrigins = [
        'http://localhost:5173',
        'https://fitmate.pages.dev',
        'https://fitmate-ashen.vercel.app',
      ];
      if (allowedOrigins.includes(origin)) return origin;
      if (origin.includes('pages.dev')) return origin;
      return 'http://localhost:5173';
    },
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  })
);

// 请求日志
app.use('*', logger());

// === 健康检查 ===
app.get('/api/health', (c) => {
  return c.json({
    code: 0,
    data: { status: 'ok', timestamp: new Date().toISOString() },
    message: 'ok',
  });
});

// === 路由挂载 ===
app.route('/api/auth', authRoutes);
app.route('/api/exercises', exerciseRoutes);
app.route('/api/workout-plans', workoutPlanRoutes);
app.route('/api/workout-logs', workoutLogRoutes);
app.route('/api/diet', dietRoutes);
app.route('/api/chat', chatRoutes);

// === 全局错误处理（必须放在最后）===
app.onError((err: any, c: any) => {
  return errorHandler(err, c);
});

export default app;
export type { Env, JwtPayload };
