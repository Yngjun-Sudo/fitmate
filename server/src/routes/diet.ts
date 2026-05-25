import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middleware/auth';
import * as dietService from '../services/dietService';
import { sendSuccess } from '../utils/response';

const router = Router();

// 注意：authMiddleware 由各子路由独立应用，避免在此处重复拦截
// === /api/diet ===
const dietRouter = Router();
dietRouter.use(authMiddleware);

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
foodItemsRouter.use(authMiddleware);

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
    const food = await dietService.createFoodItem({
      ...req.body,
      createdByUserId: req.user!.userId,
    });
    sendSuccess(res, food, '食物已添加', 201);
  } catch (err) {
    next(err);
  }
});

// === /api/meal-records ===
const mealRecordsRouter = Router();
mealRecordsRouter.use(authMiddleware);

mealRecordsRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { date } = req.query;
    const targetDate = (date as string) || new Date().toISOString().split('T')[0];
    const records = await dietService.getMealRecords(req.user!.userId, targetDate);
    sendSuccess(res, records);
  } catch (err) {
    next(err);
  }
});

mealRecordsRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const record = await dietService.createMealRecord(req.user!.userId, req.body);
    sendSuccess(res, record, '饮食记录已添加', 201);
  } catch (err) {
    next(err);
  }
});

mealRecordsRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await dietService.deleteMealRecord(req.params.id, req.user!.userId);
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
