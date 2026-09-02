import { Request, Response, NextFunction } from 'express';
import * as modeService from '../services/conversationModeService';
import { ApiSuccessResponse } from '../types/api';

const param = (req: Request, name: string): string => req.params[name] as string;

export const getMode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await modeService.getConversationMode(param(req, 'id'));
    const response: ApiSuccessResponse = { success: true, data };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const changeMode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const actorId = req.user!.userId;
    const { mode } = req.body;
    
    const data = await modeService.setConversationMode(param(req, 'id'), mode, actorId);
    
    const response: ApiSuccessResponse = { success: true, data };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const takeover = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const actorId = req.user!.userId;
    const data = await modeService.takeoverConversation(param(req, 'id'), actorId);
    
    const response: ApiSuccessResponse = { success: true, data };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const releaseToAI = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const actorId = req.user!.userId;
    const data = await modeService.releaseConversationToAI(param(req, 'id'), actorId);
    
    const response: ApiSuccessResponse = { success: true, data };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const pause = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const actorId = req.user!.userId;
    const data = await modeService.pauseConversation(param(req, 'id'), actorId);
    
    const response: ApiSuccessResponse = { success: true, data };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};
