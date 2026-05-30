/**
 * Authentication Routes - User registration, login, profile management
 * Implements /api/auth/* endpoints
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';
import { jwtSign, jwtVerify } from '../utils/jwt';
import bcrypt from 'bcryptjs';

const authRouter = new Hono();

/**
 * POST /api/auth/register
 * Register a new user
 */
authRouter.post(
  '/register',
  optionalAuthMiddleware,
  zValidator(
    'json',
    z.object({
      email: z.string().email('Invalid email format'),
      password: z.string().min(6, 'Password must be at least 6 characters'),
      username: z.string().min(2).max(50).optional(),
    })
  ),
  async (c) => {
    const { email, password, username } = c.req.valid('json');
    const db = c.env.DB;

    try {
      // Check if user already exists
      const existingUser = await db
        .prepare('SELECT id FROM users WHERE email = ?')
        .bind(email)
        .first<{ id: number }>();

      if (existingUser) {
        return c.json(
          { code: 409, data: null, message: 'Email already registered' },
          409
        );
      }

      // Hash password using bcryptjs (compatible with Workers)
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // Create user
      const result = await db
        .prepare(
          'INSERT INTO users (email, password_hash, username) VALUES (?, ?, ?) RETURNING id'
        )
        .bind(email, passwordHash, username || null)
        .first<{ id: number }>();

      if (!result) {
        return c.json(
          { code: 500, data: null, message: 'Failed to create user' },
          500
        );
      }

      // Generate JWT token
      const token = await jwtSign(
        {
          userId: result.id,
          email: email,
          username: username || email.split('@')[0],
        },
        c.env.JWT_SECRET,
        '7d'
      );

      return c.json({
        code: 0,
        data: {
          token,
          user: {
            id: result.id,
            email,
            username: username || email.split('@')[0],
          },
        },
        message: 'Registration successful',
      });
    } catch (error) {
      console.error('[Register] Error:', error);
      return c.json(
        {
          code: 500,
          data: null,
          message: error instanceof Error ? error.message : 'Registration failed',
        },
        500
      );
    }
  }
);

/**
 * POST /api/auth/login
 * Login with email and password
 */
authRouter.post(
  '/login',
  optionalAuthMiddleware,
  zValidator(
    'json',
    z.object({
      email: z.string().email('Invalid email format'),
      password: z.string().min(1, 'Password is required'),
    })
  ),
  async (c) => {
    const { email, password } = c.req.valid('json');
    const db = c.env.DB;

    try {
      // Get user by email
      const user = await db
        .prepare('SELECT id, email, password_hash, username FROM users WHERE email = ?')
        .bind(email)
        .first<{
          id: number;
          email: string;
          password_hash: string;
          username: string;
        }>();

      if (!user) {
        return c.json(
          { code: 401, data: null, message: 'Invalid email or password' },
          401
        );
      }

      // Verify password
      const passwordMatch = await bcrypt.compare(password, user.password_hash);

      if (!passwordMatch) {
        return c.json(
          { code: 401, data: null, message: 'Invalid email or password' },
          401
        );
      }

      // Generate JWT token
      const token = await jwtSign(
        {
          userId: user.id,
          email: user.email,
          username: user.username,
        },
        c.env.JWT_SECRET,
        '7d'
      );

      return c.json({
        code: 0,
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
          },
        },
        message: 'Login successful',
      });
    } catch (error) {
      console.error('[Login] Error:', error);
      return c.json(
        {
          code: 500,
          data: null,
          message: error instanceof Error ? error.message : 'Login failed',
        },
        500
      );
    }
  }
);

/**
 * GET /api/auth/profile
 * Get current user profile
 */
authRouter.get('/profile', authMiddleware, async (c) => {
  const user = c.get('user');
  const db = c.env.DB;

  try {
    const userProfile = await db
      .prepare(
        'SELECT id, email, username, avatar_url, created_at FROM users WHERE id = ?'
      )
      .bind(user.userId)
      .first<{
        id: number;
        email: string;
        username: string;
        avatar_url: string | null;
        created_at: string;
      }>();

    if (!userProfile) {
      return c.json(
        { code: 404, data: null, message: 'User not found' },
        404
      );
    }

    return c.json({
      code: 0,
      data: {
        id: userProfile.id,
        email: userProfile.email,
        username: userProfile.username,
        avatar_url: userProfile.avatar_url,
        created_at: userProfile.created_at,
      },
      message: 'Profile retrieved successfully',
    });
  } catch (error) {
    console.error('[Profile] Error:', error);
    return c.json(
      {
        code: 500,
        data: null,
        message: error instanceof Error ? error.message : 'Failed to get profile',
      },
      500
    );
  }
});

/**
 * PUT /api/auth/profile
 * Update user profile
 */
authRouter.put(
  '/profile',
  authMiddleware,
  zValidator(
    'json',
    z.object({
      username: z.string().min(2).max(50).optional(),
      avatar_url: z.string().url().optional(),
    })
  ),
  async (c) => {
    const { username, avatar_url } = c.req.valid('json');
    const user = c.get('user');
    const db = c.env.DB;

    try {
      // Build dynamic update query
      const updates: string[] = [];
      const params: unknown[] = [];

      if (username !== undefined) {
        updates.push('username = ?');
        params.push(username);
      }

      if (avatar_url !== undefined) {
        updates.push('avatar_url = ?');
        params.push(avatar_url);
      }

      if (updates.length === 0) {
        return c.json(
          { code: 400, data: null, message: 'No fields to update' },
          400
        );
      }

      updates.push('updated_at = CURRENT_TIMESTAMP');
      params.push(user.userId);

      const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
      await db.prepare(sql).bind(...params).run();

      return c.json({
        code: 0,
        data: null,
        message: 'Profile updated successfully',
      });
    } catch (error) {
      console.error('[Update Profile] Error:', error);
      return c.json(
        {
          code: 500,
          data: null,
          message: error instanceof Error ? error.message : 'Failed to update profile',
        },
        500
      );
    }
  }
);

/**
 * POST /api/auth/change-password
 * Change user password
 */
authRouter.post(
  '/change-password',
  authMiddleware,
  zValidator(
    'json',
    z.object({
      old_password: z.string().min(1, 'Old password is required'),
      new_password: z.string().min(6, 'New password must be at least 6 characters'),
    })
  ),
  async (c) => {
    const { old_password, new_password } = c.req.valid('json');
    const user = c.get('user');
    const db = c.env.DB;

    try {
      // Get current password hash
      const userData = await db
        .prepare('SELECT password_hash FROM users WHERE id = ?')
        .bind(user.userId)
        .first<{ password_hash: string }>();

      if (!userData) {
        return c.json(
          { code: 404, data: null, message: 'User not found' },
          404
        );
      }

      // Verify old password
      const passwordMatch = await bcrypt.compare(old_password, userData.password_hash);

      if (!passwordMatch) {
        return c.json(
          { code: 401, data: null, message: 'Invalid old password' },
          401
        );
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const newPasswordHash = await bcrypt.hash(new_password, salt);

      // Update password
      await db
        .prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .bind(newPasswordHash, user.userId)
        .run();

      return c.json({
        code: 0,
        data: null,
        message: 'Password changed successfully',
      });
    } catch (error) {
      console.error('[Change Password] Error:', error);
      return c.json(
        {
          code: 500,
          data: null,
          message: error instanceof Error ? error.message : 'Failed to change password',
        },
        500
      );
    }
  }
);

export default authRouter;
