import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { sendError } from '../utils/response';
import { ErrorCode } from '../types';

/**
 * Zod 校验中间件工厂函数
 * 校验 req.body，失败返回 400
 */
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const message = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
        sendError(res, ErrorCode.VALIDATION_ERROR, message, 400);
        return;
      }
      next(err);
    }
  };
}
