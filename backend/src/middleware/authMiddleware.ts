import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { UnauthorizedError } from '../utils/errors';
import { logger } from '../utils/logger';

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Authentication required');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedError('Authentication required');
    }

    try {
      const payload = verifyAccessToken(token);
      req.user = payload;
      next();
    } catch (err) {
      logger.debug({ err }, 'JWT Verification failed');
      throw new UnauthorizedError('Authentication required'); // Do not expose internals
    }
  } catch (error) {
    next(error);
  }
};
