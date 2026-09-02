import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { JWTPayload } from '../types/user';

const getSecret = (): string => {
  const secret = env.JWT_SECRET;
  if (!secret) {
    if (env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET is required in production');
    }
    // In development/test, use a temporary secret and warn
    return 'dev-insecure-jwt-secret-do-not-use-in-production';
  }
  return secret;
};

export const generateAccessToken = (payload: JWTPayload): string => {
  const secret = getSecret();
  const expiresIn = env.JWT_EXPIRES_IN || '1d';
  return jwt.sign(payload, secret, { expiresIn: expiresIn as any });
};

export const verifyAccessToken = (token: string): JWTPayload => {
  const secret = getSecret();
  const decoded = jwt.verify(token, secret) as jwt.JwtPayload & JWTPayload;
  return {
    userId: decoded.userId,
    role: decoded.role,
  };
};
