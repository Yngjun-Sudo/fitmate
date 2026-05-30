import { Hono } from 'hono';
import authRouter from './routes/auth';
import exercisesRouter from './routes/exercises';
import workoutPlansRouter from './routes/workoutPlans';
import workoutLogsRouter from './routes/workoutLogs';
import dietRouter from './routes/diet';
import chatRouter from './routes/chat';

const app = new Hono();

// 挂载所有路由
app.route('/auth', authRouter);
app.route('/exercises', exercisesRouter);
app.route('/workout-plans', workoutPlansRouter);
app.route('/workout-logs', workoutLogsRouter);
app.route('/diet', dietRouter);
app.route('/chat', chatRouter);

export default app;
