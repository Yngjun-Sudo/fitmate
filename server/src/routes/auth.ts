import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { RegisterSchema, LoginSchema, UpdateProfileSchema } from '../types';
import * as authService from '../services/authService';
import { sendSuccess, sendError } from '../utils/response';
import { ErrorCode } from '../types';

const router = Router();

/**
 * POST /api/auth/register — 用户注册
 */
router.post('/register', validate(RegisterSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await authService.register(req.body);
    sendSuccess(res, result, '注册成功', 201);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/login — 用户登录
 */
router.post('/login', validate(LoginSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await authService.login(req.body);
    sendSuccess(res, result, '登录成功');
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/auth/me — 获取当前用户信息
 */
router.get('/me', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      sendError(res, ErrorCode.UNAUTHORIZED, '未认证');
      return;
    }
    const user = await authService.getProfile(req.user);
    sendSuccess(res, user);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/auth/profile — 更新个人信息
 */
router.put('/profile', authMiddleware, validate(UpdateProfileSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      sendError(res, ErrorCode.UNAUTHORIZED, '未认证');
      return;
    }
    const user = await authService.updateProfile(req.user.userId, req.body);
    sendSuccess(res, user, '个人信息已更新');
  } catch (err) {
    next(err);
  }
});

export default router;
