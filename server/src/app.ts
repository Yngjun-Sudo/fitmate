import express from 'express';
import cors from 'cors';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';

// 路由导入
import authRoutes from './routes/auth';
import exerciseRoutes from './routes/exercises';
import workoutPlanRoutes from './routes/workoutPlans';
import workoutLogRoutes from './routes/workoutLogs';
import dietRoutes from './routes/diet';
import chatRoutes from './routes/chat';

const app = express();

// === 中间件 ===
// CORS: 支持多域名（Vercel + Netlify + 本地开发）
const allowedOrigins = [
  'https://fitmate-ashen.vercel.app',
  'http://localhost:5173',
  // Netlify 部署后添加域名
].filter(Boolean);

// 如果 CORS_ORIGIN 环境变量包含逗号，拆分为多个
if (config.corsOrigin) {
  config.corsOrigin.split(',').forEach(origin => {
    const trimmed = origin.trim();
    if (trimmed && !allowedOrigins.includes(trimmed)) {
      allowedOrigins.push(trimmed);
    }
  });
}

app.use(cors({
  origin: (origin, callback) => {
    // 允许没有 origin 的请求（如服务端调用、Postman）
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // 也允许 Netlify 的预览部署域名
    if (origin.includes('netlify.app')) return callback(null, true);
    callback(null, true); // 暂时允许所有来源
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// === 健康检查 ===
app.get('/api/health', (_req, res) => {
  res.json({ code: 0, data: { status: 'ok', timestamp: new Date().toISOString() }, message: 'ok' });
});

// === 路由挂载 ===
// 注意：更具体的路由必须放在 /api 通用挂载之前，否则会被 dietRoutes 的 auth 中间件拦截
app.use('/api/auth', authRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/workout-plans', workoutPlanRoutes);
app.use('/api/workout-logs', workoutLogRoutes);
app.use('/api/chat', chatRoutes);
// dietRoutes 内部已包含 /diet, /food-items, /meal-records 子路由
app.use('/api', dietRoutes);

// === 全局错误处理（必须放在最后） ===
app.use(errorHandler);

export default app;
