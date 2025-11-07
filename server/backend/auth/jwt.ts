import jwt from 'jsonwebtoken';
import type { User, Role } from '@shared/schema';

const isDevelopment = process.env.NODE_ENV === 'development';

if (!process.env.SESSION_SECRET) {
  throw new Error(
    'FATAL: SESSION_SECRET environment variable is required for JWT token generation. ' +
    'Please set SESSION_SECRET in your environment.'
  );
}

const JWT_SECRET = process.env.SESSION_SECRET;

let JWT_REFRESH_SECRET: string;
if (!process.env.JWT_REFRESH_SECRET) {
  if (isDevelopment) {
    console.warn(
      '⚠️  WARNING: JWT_REFRESH_SECRET not set. Using SESSION_SECRET for refresh tokens in development.\n' +
      '   For production, please set JWT_REFRESH_SECRET to a different secure value.'
    );
    JWT_REFRESH_SECRET = process.env.SESSION_SECRET;
  } else {
    throw new Error(
      'FATAL: JWT_REFRESH_SECRET environment variable is required for production. ' +
      'Please set JWT_REFRESH_SECRET in your deployment environment.'
    );
  }
} else {
  JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
}

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

export interface TokenPayload {
  userId: string;
  email: string;
  roleId: string;
  roleName: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export function generateAccessToken(user: User, role: Role): string {
  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    roleId: user.roleId,
    roleName: role.name,
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
}

export function generateRefreshToken(user: User, role: Role): string {
  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    roleId: user.roleId,
    roleName: role.name,
  };

  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });
}

export function generateTokens(user: User, role: Role): AuthTokens {
  return {
    accessToken: generateAccessToken(user, role),
    refreshToken: generateRefreshToken(user, role),
  };
}

export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return payload;
  } catch (error) {
    return null;
  }
}

export function verifyRefreshToken(token: string): TokenPayload | null {
  try {
    const payload = jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;
    return payload;
  } catch (error) {
    return null;
  }
}

export function decodeToken(token: string): TokenPayload | null {
  try {
    const payload = jwt.decode(token) as TokenPayload;
    return payload;
  } catch (error) {
    return null;
  }
}