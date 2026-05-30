import type { Context } from 'hono';
import { SignJWT, jwtVerify } from 'jose';

export async function signToken(c: Context, payload: Record<string, unknown>) {
  const secret = new TextEncoder().encode(c.env.JWT_SECRET);
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(secret);
}

export async function verifyToken(c: Context, token: string) {
  const secret = new TextEncoder().encode(c.env.JWT_SECRET);
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch {
    return null;
  }
}
