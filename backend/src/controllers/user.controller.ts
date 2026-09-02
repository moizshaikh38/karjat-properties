import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/authService';
import { ApiSuccessResponse } from '../types/api';
import { CreateUserInput, UpdateUserInput } from '../types/user';

const param = (req: Request, name: string): string => req.params[name] as string;

export const createUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input: CreateUserInput = req.body;
    const actorId = req.user!.userId;
    
    const user = await authService.registerUser(input, actorId);

    const response: ApiSuccessResponse = {
      success: true,
      data: { user },
    };
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

export const listUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await authService.listUsers();

    const response: ApiSuccessResponse = {
      success: true,
      data: { users },
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const getUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await authService.getUserById(param(req, 'id'));

    const response: ApiSuccessResponse = {
      success: true,
      data: { user },
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input: UpdateUserInput = req.body;
    const actorId = req.user!.userId;
    const user = await authService.updateUser(param(req, 'id'), input, actorId);

    const response: ApiSuccessResponse = {
      success: true,
      data: { user },
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const deactivateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const actorId = req.user!.userId;
    await authService.deactivateUser(param(req, 'id'), actorId);

    const response: ApiSuccessResponse = {
      success: true,
      data: { message: 'User deactivated successfully' },
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};
