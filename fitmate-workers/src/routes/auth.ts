/**
 * Auth Routes - Placeholder
 * T03 should implement this
 */

import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';

const authRouter = new Hono();

// POST /api/auth/register
authRouter.post('/register', async (c) => {
  return c.json({
    code: 501,
    data: null,
    message: 'Not implemented yet - waiting for T03',
  });
});

// POST /api/auth/login
authRouter.post('/login', async (c) => {
  return c.json({
    code: 501,
    data: null,
    message: 'Not implemented yet - waiting for T03',
  });
});

// GET /api/auth/me
authRouter.get('/me', authMiddleware, async (c) => {
  return c.json({
    code: 501,
    data: null,
    message: 'Not implemented yet - waiting for T03',
  });
});

// POST /api/auth/logout
authRouter.post('/logout', authMiddleware, async (c) => {
  return c.json({
    code: 501,
    data: null,
    message: 'Not implemented yet - waiting for T03',
  });
});

export default authRouter;
