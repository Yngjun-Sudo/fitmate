import { getDatabase } from '../db';
import { generateToken, verifyToken } from '../utils/jwt';
import type { Context } from 'hono';
import type { RegisterRequest, LoginRequest, UserInfo } from '../types/auth';
import { randomUUID } from 'crypto';

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

function nowUnix(): number {
  return Math.floor(Date.now() / 1000);
}

function mapDbUser(row: any): UserInfo {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    heightCm: row.height_cm,
    weightKg: row.weight_kg,
    birthDate: row.birth_date,
    gender: row.gender,
    goal: row.goal,
    activityLevel: row.activity_level,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ===== Register =====
export async function register(c: Context, data: RegisterRequest): Promise<{ token: string; user: UserInfo } | null> {
  const db = c.env.DB;

  // Check if user already exists
  const existing = await db.prepare('SELECT id FROM users WHERE email = ?').bind(data.email).first();
  if (existing) return null;

  // Hash password
  const salt = generateSalt();
  const passwordHash = await hashPassword(data.password, salt);
  const userId = randomUUID();
  const now = nowUnix();
  const birthDate = data.birthDate ? data.birthDate : null;

  await db.prepare(
    `INSERT INTO users (id, email, password_hash, name, height_cm, weight_kg, birth_date, gender, goal, activity_level, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    userId,
    data.email,
    passwordHash,
    data.name,
    data.heightCm ?? null,
    data.weightKg ?? null,
    birthDate,
    data.gender ?? null,
    data.goal ?? null,
    data.activityLevel ?? null,
    now,
    now
  ).run();

  // Generate JWT token
  const token = await generateToken({ userId, email: data.email }, c.env.JWT_SECRET);

  // Fetch created user
  const userRow = await db.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first();

  return { token, user: mapDbUser(userRow) };
}

// ===== Login =====
export async function login(c: Context, data: LoginRequest): Promise<{ token: string; user: UserInfo } | null> {
  const db = c.env.DB;

  const userRow = await db.prepare('SELECT * FROM users WHERE email = ?').bind(data.email).first();
  if (!userRow) return null;

  const isValid = await verifyPassword(data.password, userRow.password_hash);
  if (!isValid) return null;

  const token = await generateToken({ userId: userRow.id, email: userRow.email }, c.env.JWT_SECRET);

  return { token, user: mapDbUser(userRow) };
}

// ===== Get User By Id =====
export async function getUserById(c: Context, userId: string): Promise<UserInfo | null> {
  const db = c.env.DB;

  const userRow = await db.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first();
  if (!userRow) return null;

  return mapDbUser(userRow);
}
