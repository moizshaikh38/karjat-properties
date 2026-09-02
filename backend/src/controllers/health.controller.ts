import { Request, Response } from 'express';
import { ApiSuccessResponse } from '../types/api';

export const checkHealth = (req: Request, res: Response) => {
  const response: ApiSuccessResponse = {
    success: true,
    data: {
      status: 'ok',
      service: 'karjat-properties-api',
      timestamp: new Date().toISOString()
    }
  };
  
  res.status(200).json(response);
};
