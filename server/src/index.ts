import app from './app';
import { config } from './config';

const PORT = config.port;

// 本地开发：启动 Express 监听
if (process.env.NODE_ENV !== 'production' || process.env.LOCAL_DEV === 'true') {
  app.listen(PORT, () => {
    console.log(`🏋️ FitMate Server running on http://localhost:${PORT}`);
    console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
  });

  process.on('SIGINT', () => {
    console.log('\n👋 Shutting down server gracefully...');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n👋 Shutting down server gracefully...');
    process.exit(0);
  });
}

// Vercel Serverless：导出 app
export default app;
