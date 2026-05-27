import { Router, Request, Response, NextFunction } from 'express';
import { optionalAuth } from '../middleware/auth';
import * as dietService from '../services/dietService';
import { sendSuccess, sendError } from '../utils/response';
import { ErrorCode } from '../types';

const router = Router();

// 可选认证：有 token 则注入 req.user，无 token 也能继续
// === /api/diet ===
const dietRouter = Router();
dietRouter.use(optionalAuth);

dietRouter.post('/tdee', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = dietService.calculateTDEE(req.body);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

// === /api/food-items ===
const foodItemsRouter = Router();
foodItemsRouter.use(optionalAuth);

foodItemsRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, page, pageSize } = req.query;
    if (!search) {
      sendSuccess(res, { items: [], total: 0, page: 1, pageSize: 20, totalPages: 0 });
      return;
    }
    const result = await dietService.searchFoodItems(
      search as string,
      page ? parseInt(page as string, 10) : 1,
      pageSize ? parseInt(pageSize as string, 10) : 20,
    );
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

foodItemsRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      sendError(res, ErrorCode.UNAUTHORIZED, '请先登录', 401);
      return;
    }
    const food = await dietService.createFoodItem({
      ...req.body,
      createdByUserId: req.user.userId,
    });
    sendSuccess(res, food, '食物已添加', 201);
  } catch (err) {
    next(err);
  }
});

// === /api/meal-records ===
const mealRecordsRouter = Router();
mealRecordsRouter.use(optionalAuth);

mealRecordsRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      sendSuccess(res, { items: [], total: 0 });
      return;
    }
    const { date } = req.query;
    const targetDate = (date as string) || new Date().toISOString().split('T')[0];
    const records = await dietService.getMealRecords(req.user.userId, targetDate);
    sendSuccess(res, records);
  } catch (err) {
    next(err);
  }
});

mealRecordsRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      sendError(res, ErrorCode.UNAUTHORIZED, '请先登录', 401);
      return;
    }
    const record = await dietService.createMealRecord(req.user.userId, req.body);
    sendSuccess(res, record, '饮食记录已添加', 201);
  } catch (err) {
    next(err);
  }
});

mealRecordsRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      sendError(res, ErrorCode.UNAUTHORIZED, '请先登录', 401);
      return;
    }
    await dietService.deleteMealRecord(req.params.id, req.user.userId);
    sendSuccess(res, null, '已删除');
  } catch (err) {
    next(err);
  }
});

// 挂载子路由
router.use('/diet', dietRouter);
router.use('/food-items', foodItemsRouter);
router.use('/meal-records', mealRecordsRouter);

export default router;
