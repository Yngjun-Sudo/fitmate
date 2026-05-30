import { users } from '../d1/schema';
import { db } from '../db';
import { eq } from 'drizzle-orm';
import { signToken } from '../utils/jwt';
import type { Context } from 'hono';
import type { RegisterRequest, LoginRequest, UserInfo } from '../types/auth';

// Password hashing utility using Web Crypto API
async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const passwordData = encoder.encode(password + salt);
  
  const hashBuffer = await crypto.subtle.digest('SHA-256', passwordData);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return `${salt}:${hashHex}`;
}

async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [salt, hash] = storedHash.split(':');
  const computedHash = await hashPassword(password, salt);
  return computedHash === storedHash;
}

function generateSalt(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

export async function register(c: Context, data: RegisterRequest): Promise<{ token: string; user: UserInfo } | null> {
  const dbClient = db(c.env.DB);
  
  // Check if user already exists
  const existingUser = await dbClient
    .select()
    .from(users)
    .where(eq(users.email, data.email))
    .get();
  
  if (existingUser) {
    return null; // User already exists
  }
  
  // Hash password
  const salt = generateSalt();
  const passwordHash = await hashPassword(data.password, salt);
  
  // Create user
  const now = Math.floor(Date.now() / 1000);
  const newUser = await dbClient
    .insert(users)
    .values({
      email: data.email,
      passwordHash,
      name: data.name,
      heightCm: data.heightCm,
      weightKg: data.weightKg,
      birthDate: data.birthDate,
      gender: data.gender,
      goal: data.goal,
      activityLevel: data.activityLevel,
      createdAt: now,
      updatedAt: now,
    })
    .returning()
    .get();
  
  if (!newUser) {
    return null;
  }
  
  // Generate JWT token
  const token = await signToken(c, {
    userId: newUser.id,
    email: newUser.email,
  });
  
  // Return user info (without password hash)
  const userInfo: UserInfo = {
    id: newUser.id,
    email: newUser.email,
    name: newUser.name,
    heightCm: newUser.heightCm,
    weightKg: newUser.weightKg,
    birthDate: newUser.birthDate,
    gender: newUser.gender,
    goal: newUser.goal,
    activityLevel: newUser.activityLevel,
    createdAt: newUser.createdAt,
    updatedAt: newUser.updatedAt,
  };
  
  return { token, user: userInfo };
}

export async function login(c: Context, data: LoginRequest): Promise<{ token: string; user: UserInfo } | null> {
  const dbClient = db(c.env.DB);
  
  // Find user by email
  const user = await dbClient
    .select()
    .from(users)
    .where(eq(users.email, data.email))
    .get();
  
  if (!user) {
    return null; // User not found
  }
  
  // Verify password
  const isValid = await verifyPassword(data.password, user.passwordHash);
  if (!isValid) {
    return null; // Invalid password
  }
  
  // Generate JWT token
  const token = await signToken(c, {
    userId: user.id,
    email: user.email,
  });
  
  // Return user info (without password hash)
  const userInfo: UserInfo = {
    id: user.id,
    email: user.email,
    name: user.name,
    heightCm: user.heightCm,
    weightKg: user.weightKg,
    birthDate: user.birthDate,
    gender: user.gender,
    goal: user.goal,
    activityLevel: user.activityLevel,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
  
  return { token, user: userInfo };
}

export async function getUserById(c: Context, userId: string): Promise<UserInfo | null> {
  const dbClient = db(c.env.DB);
  
  const user = await dbClient
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .get();
  
  if (!user) {
    return null;
  }
  
  const userInfo: UserInfo = {
    id: user.id,
    email: user.email,
    name: user.name,
    heightCm: user.heightCm,
    weightKg: user.weightKg,
    birthDate: user.birthDate,
    gender: user.gender,
    goal: user.goal,
    activityLevel: user.activityLevel,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
  
  return userInfo;
}
