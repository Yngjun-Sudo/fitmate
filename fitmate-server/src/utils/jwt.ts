import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

// JWT 密钥（从环境变量读取）
let jwtSecret: Uint8Array | null = null;

/**
 * 初始化 JWT 密钥（从环境变量）
 */
function getJwtSecret(secret: string): Uint8Array {
  if (jwtSecret) return jwtSecret;
  jwtSecret = new TextEncoder().encode(secret);
  return jwtSecret;
}

/**
 * 生成 JWT Token
 * @param payload - 载荷（userId, email 等）
 * @param secret - JWT 密钥（从 env.JWT_SECRET 传入）
 * @param expiresIn - 过期时间（默认 7d）
 */
export async function generateToken(
  payload: { userId: string; email: string },
  secret: string,
  expiresIn = '7d'
): Promise<string> {
  const secretKey = getJwtSecret(secret);
  
  // 解析过期时间
  const maxAge = parseExpiration(expiresIn);
  
  const jwt = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(maxAge)
    .sign(secretKey);

  return jwt;
}

/**
 * 验证 JWT Token
 * @param token - JWT Token
 * @param secret - JWT 密钥（从 env.JWT_SECRET 传入）
 * @returns 载荷或 null
 */
export async function verifyToken(
  token: string,
  secret: string
): Promise<{ userId: string; email: string } | null> {
  try {
    const secretKey = getJwtSecret(secret);
    const { payload } = await jwtVerify(token, secretKey);
    
    if (
      typeof payload.userId === 'string' &&
      typeof payload.email === 'string'
    ) {
      return { userId: payload.userId, email: payload.email };
    }
    return null;
  } catch (err) {
    console.error('[JWT Verify Error]', err);
    return null;
  }
}

/**
 * 解析过期时间字符串（如 "7d", "24h", "60m"）
 */
function parseExpiration(expiresIn: string): number {
  const match = expiresIn.match(/^(\d+)([dhm])$/);
  if (!match) return 60 * 60 * 24 * 7; // 默认 7 天

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 'd': return value * 24 * 60 * 60;
    case 'h': return value * 60 * 60;
    case 'm': return value * 60;
    default: return 60 * 60 * 24 * 7;
  }
}
