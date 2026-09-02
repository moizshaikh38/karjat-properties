import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/authService';
import { ApiSuccessResponse } from '../types/api';
import { LoginInput, ChangePasswordInput } from '../types/user';

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input: LoginInput = req.body;
    const result = await authService.loginUser(input);

    const response: ApiSuccessResponse = {
      success: true,
      data: result,
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const getCurrentUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // req.user is guaranteed to be set by requireAuth middleware
    const userId = req.user!.userId;
    const user = await authService.getCurrentUser(userId);

    const response: ApiSuccessResponse = {
      success: true,
      data: { user },
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const input: ChangePasswordInput = req.body;
    
    await authService.changePassword(userId, input);

    const response: ApiSuccessResponse = {
      success: true,
      data: { message: 'Password changed successfully' },
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};
