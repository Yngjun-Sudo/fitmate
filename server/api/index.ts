import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorHandler } from '../src/middleware/errorHandler';
import { optionalAuth } from '../src/middleware/auth';

dotenv.config();

const app = express();

// CORS
const corsOrigin = process.env.CORS_ORIGIN || '*';
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json({ limit: '10mb' }));

// 健康检查
app.get('/api/health', (_req, res) => {
  res.json({ code: 0, data: { status: 'ok', timestamp: new Date().toISOString() }, message: 'ok' });
});

// === 路由挂载（动态导入，兼容 Vercel serverless） ===
// 注意：路由文件中已改用 optionalAuth，未登录可浏览 GET 数据

app.use('/api/auth', async (req, res, next) => {
  const router = (await import('../src/routes/auth')).default;
  router(req, res, next);
});

app.use('/api/exercises', async (req, res, next) => {
  const router = (await import('../src/routes/exercises')).default;
  router(req, res, next);
});

app.use('/api/workout-plans', async (req, res, next) => {
  const router = (await import('../src/routes/workoutPlans')).default;
  router(req, res, next);
});

app.use('/api/workout-logs', async (req, res, next) => {
  const router = (await import('../src/routes/workoutLogs')).default;
  router(req, res, next);
});

app.use('/api/diet', async (req, res, next) => {
  const router = (await import('../src/routes/diet')).default;
  router(req, res, next);
});

app.use('/api/chat', async (req, res, next) => {
  const router = (await import('../src/routes/chat')).default;
  router(req, res, next);
});

// 错误处理
app.use(errorHandler);

export default app;
