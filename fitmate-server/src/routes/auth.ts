import { Hono } from 'hono';
import { register, login, getUserById } from '../services/authService';
import { sendSuccess, sendError } from '../utils/response';
import type { Context } from 'hono';
import type { RegisterRequest, LoginRequest } from '../types/auth';

const authRouter = new Hono();

// POST /api/auth/register
authRouter.post('/register', async (c: Context) => {
  try {
    const body = await c.req.json() as RegisterRequest;
    
    // Validate required fields
    if (!body.email || !body.password || !body.name) {
      return sendError(c, 400, 'Email, password and name are required');
    }
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return sendError(c, 400, 'Invalid email format');
    }
    
    // Password strength validation (at least 6 characters)
    if (body.password.length < 6) {
      return sendError(c, 400, 'Password must be at least 6 characters');
    }
    
    const result = await register(c, body);
    
    if (!result) {
      return sendError(c, 409, 'Email already exists');
    }
    
    return sendSuccess(c, result, 'Registration successful');
  } catch (err) {
    console.error('Register error:', err);
    return sendError(c, 500, 'Registration failed');
  }
});

// POST /api/auth/login
authRouter.post('/login', async (c: Context) => {
  try {
    const body = await c.req.json() as LoginRequest;
    
    // Validate required fields
    if (!body.email || !body.password) {
      return sendError(c, 400, 'Email and password are required');
    }
    
    const result = await login(c, body);
    
    if (!result) {
      return sendError(c, 401, 'Invalid email or password');
    }
    
    return sendSuccess(c, result, 'Login successful');
  } catch (err) {
    console.error('Login error:', err);
    return sendError(c, 500, 'Login failed');
  }
});

// GET /api/auth/me
authRouter.get('/me', async (c: Context) => {
  try {
    // Get user info from JWT payload (set by auth middleware)
    const payload = c.get('jwtPayload');
    
    if (!payload || !payload.userId) {
      return sendError(c, 401, 'Unauthorized');
    }
    
    const user = await getUserById(c, payload.userId);
    
    if (!user) {
      return sendError(c, 404, 'User not found');
    }
    
    return sendSuccess(c, user, 'success');
  } catch (err) {
    console.error('Get me error:', err);
    return sendError(c, 500, 'Failed to get user info');
  }
});

export default authRouter;
