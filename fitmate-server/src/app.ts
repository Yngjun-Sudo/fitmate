import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { errorHandler } from './middleware/errorHandler';

// 路由导入
import authRoutes from './routes/auth';
// TODO: T04 剩余路由待完成 - 暂时注释避免编译错误
// import exerciseRoutes from './routes/exercises';
// import workoutPlanRoutes from './routes/workoutPlans';
// import workoutLogRoutes from './routes/workoutLogs';
// import dietRoutes from './routes/diet';
// TODO: chat 路由待完成（T05）
// import chatRoutes from './routes/chat';

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
      // 允许没有 origin 的请求（如服务端调用、Postman）
      if (!origin) return 'http://localhost:5173'; // 默认允许本地

      // 允许的前端域名列表
      const allowedOrigins = [
        'http://localhost:5173',
        'https://fitmate.pages.dev',
        'https://fitmate-ashen.vercel.app',
      ];

      if (allowedOrigins.includes(origin)) return origin;

      // 也允许 Pages 的预览部署域名
      if (origin.includes('pages.dev')) return origin;

      return 'http://localhost:5173'; // 默认允许本地（生产环境应改为拒绝）
    },
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  })
);

// 请求日志
app.use('*', logger());

// JSON Body 解析（Hono 内置，无需手动解析）
// Hono 会自动解析 JSON，通过 c.req.json() 读取

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
// TODO: T04 剩余路由待完成 - 暂时注释避免编译错误
// app.route('/api/exercises', exerciseRoutes);
// app.route('/api/workout-plans', workoutPlanRoutes);
// app.route('/api/workout-logs', workoutLogRoutes);
// app.route('/api/diet', dietRoutes);
// TODO: chat 路由待完成（T05）
// app.route('/api/chat', chatRoutes);

// === 全局错误处理（必须放在最后）===
app.onError(errorHandler);

export default app;
export type { Env, JwtPayload };
