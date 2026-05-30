/**
 * JWT Utility - JSON Web Token verification and signing
 * Uses jose library for Cloudflare Workers compatibility
 */

import { SignJWT, jwtVerify as joseJwtVerify, type JWTPayload } from 'jose';

export interface TokenPayload extends JWTPayload {
  userId: number;
  email: string;
  username: string;
}

/**
 * Sign a JWT token
 */
export async function jwtSign(
  payload: TokenPayload,
  secret: string,
  expiresIn: string = '7d'
): Promise<string> {
  const jwt = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(new TextEncoder().encode(secret));

  return jwt;
}

/**
 * Verify a JWT token
 */
export async function jwtVerify(
  token: string,
  secret: string
): Promise<TokenPayload> {
  try {
    const { payload } = await joseJwtVerify(
      token,
      new TextEncoder().encode(secret)
    );

    return payload as TokenPayload;
  } catch (error) {
    console.error('[JWT Verify] Failed:', error);
    throw new Error('Invalid or expired token');
  }
}

/**
 * Decode token without verification (for debugging)
 */
export function jwtDecode(token: string): TokenPayload | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    
    // Fix padding
    const paddedBase64 = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    
    const jsonPayload = decodeURIComponent(
      atob(paddedBase64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('[JWT Decode] Failed:', error);
    return null;
  }
}
