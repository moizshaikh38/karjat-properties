import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '../utils/errors';

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  // TODO: Implement actual JWT authentication here in a future step.
  // For example, verify Bearer token from req.headers.authorization using jwt.verify()
  // and attach the user payload to req.user.

  next();
};
