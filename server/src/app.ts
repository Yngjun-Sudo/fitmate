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
app.use(cors({ origin: config.corsOrigin, credentials: true }));
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
