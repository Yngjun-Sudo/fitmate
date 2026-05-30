import { Hono } from 'hono';
import { register, login, getUserById } from '../services/authService';
import { success, error } from '../utils/response';
import type { Context, HonoRequest } from 'hono';
import type { RegisterRequest, LoginRequest } from '../types/auth';

const authRouter = new Hono();

// POST /api/auth/register
authRouter.post('/register', async (c: Context) => {
  try {
    const body = await c.req.json() as RegisterRequest;
    
    // Validate required fields
    if (!body.email || !body.password || !body.name) {
      return error(c, 'Email, password and name are required', 400);
    }
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return error(c, 'Invalid email format', 400);
    }
    
    // Password strength validation (at least 6 characters)
    if (body.password.length < 6) {
      return error(c, 'Password must be at least 6 characters', 400);
    }
    
    const result = await register(c, body);
    
    if (!result) {
      return error(c, 'Email already exists', 409);
    }
    
    return success(c, result, 'Registration successful');
  } catch (err) {
    console.error('Register error:', err);
    return error(c, 'Registration failed', 500);
  }
});

// POST /api/auth/login
authRouter.post('/login', async (c: Context) => {
  try {
    const body = await c.req.json() as LoginRequest;
    
    // Validate required fields
    if (!body.email || !body.password) {
      return error(c, 'Email and password are required', 400);
    }
    
    const result = await login(c, body);
    
    if (!result) {
      return error(c, 'Invalid email or password', 401);
    }
    
    return success(c, result, 'Login successful');
  } catch (err) {
    console.error('Login error:', err);
    return error(c, 'Login failed', 500);
  }
});

// GET /api/auth/me
authRouter.get('/me', async (c: Context) => {
  try {
    // Get user info from JWT payload (set by auth middleware)
    const payload = c.get('jwtPayload');
    
    if (!payload || !payload.userId) {
      return error(c, 'Unauthorized', 401);
    }
    
    const user = await getUserById(c, payload.userId);
    
    if (!user) {
      return error(c, 'User not found', 404);
    }
    
    return success(c, user, 'success');
  } catch (err) {
    console.error('Get me error:', err);
    return error(c, 'Failed to get user info', 500);
  }
});

export default authRouter;
