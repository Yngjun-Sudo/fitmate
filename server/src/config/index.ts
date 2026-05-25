import dotenv from 'dotenv';
import path from 'path';

// 加载 .env 文件（优先从项目根目录加载）
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  jwtSecret: process.env.JWT_SECRET || 'fitness-app-jwt-secret-dev',
  jwtExpiresIn: '7d',
  deepseekApiKey: process.env.DEEPSEEK_API_KEY || '',
  deepseekBaseUrl: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
} as const;
