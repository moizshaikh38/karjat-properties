import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import { ApiErrorResponse } from '../types/api';
import { env } from '../config/env';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error({ err }, err.message);

  let statusCode = 500;
  let code = 'INTERNAL_SERVER_ERROR';
  let message = 'An unexpected error occurred';

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
  }

  const response: ApiErrorResponse = {
    success: false,
    error: {
      code,
      message,
      // Include stack trace only in development
      ...(env.NODE_ENV === 'development' && { details: err.stack }),
    },
  };

  res.status(statusCode).json(response);
};
