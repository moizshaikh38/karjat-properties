import { Request, Response, NextFunction } from 'express';
import * as leadService from '../services/leadService';
import { ApiSuccessResponse } from '../types/api';
import { db } from '../database/client';

const param = (req: Request, name: string): string => req.params[name] as string;

export const createLead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const actorId = req.user?.userId;
    const { lead, requirements, isDuplicate } = await leadService.createLead(req.body, actorId);

    const response: ApiSuccessResponse = {
      success: true,
      data: { lead, requirements, message: isDuplicate ? 'Lead updated' : 'Lead created' },
    };
    res.status(isDuplicate ? 200 : 201).json(response);
  } catch (error) {
    next(error);
  }
};

export const getLead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await leadService.getLeadProfile(param(req, 'id'), req.user!);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const updateLead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await leadService.updateLead(param(req, 'id'), req.body, req.user!);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const listLeads = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = req.query as any;
    const data = await leadService.listLeads(query, req.user!);
    res.status(200).json({
      success: true,
      data: {
        leads: data.leads,
        pagination: {
          page: query.page,
          limit: query.limit,
          total: data.total,
          totalPages: Math.ceil(data.total / query.limit),
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const searchLeads = listLeads; // Search uses the same list/filtering endpoint under the hood.

export const assignLead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await leadService.assignLead(param(req, 'id'), req.body.agent_id, req.user!);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const updateStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await leadService.updateStatus(param(req, 'id'), req.body.status, req.user!);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const addInteraction = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { property_id, interaction_type } = req.body;
    const data = await leadService.addPropertyInteraction(param(req, 'id'), property_id, interaction_type, req.user!);
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getInteractions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await leadService.listInteractions(param(req, 'id'), req.user!);
    res.status(200).json({ success: true, data: { interactions: data } });
  } catch (error) {
    next(error);
  }
};

import { transitionLeadStage } from '../services/leadPipelineService';

export const updateStage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { stage, reason } = req.body;
    const user = (req as any).user;

    await transitionLeadStage(id as string, stage, user.userId, reason);
    
    // Fetch updated lead
    const profile = await leadService.getLeadProfile(id as string, user);
    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
};

export const getMatches = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { findMatchingProperties } = await import('../services/propertyMatchingService');
    
    const matches = await findMatchingProperties(id as string, { limit: 5 });
    res.json({ success: true, data: matches });
  } catch (err) {
    next(err);
  }
};

export const getRequirements = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const client = db.getClient();
    const { data } = await client.from('lead_requirements').select('*').eq('lead_id', id as string).single();
    res.json({ success: true, data: data || null });
  } catch (err) {
    next(err);
  }
};

export const getScoreHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const client = db.getClient();
    const { data } = await client.from('lead_score_history').select('*').eq('lead_id', id as string).order('created_at', { ascending: false });
    res.json({ success: true, data: data || [] });
  } catch (err) {
    next(err);
  }
};

export const getNextAction = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    const profile = await leadService.getLeadProfile(id as string, user);
    
    const client = db.getClient();
    const { data: requirements } = await client.from('lead_requirements').select('*').eq('lead_id', id as string).single();
    const { data: interactions } = await client.from('lead_property_interactions').select('*').eq('lead_id', id as string);

    const { getNextBestAction } = await import('../services/nextActionService');
    const action = getNextBestAction(profile as any, requirements, interactions || []);

    res.json({ success: true, data: { action } });
  } catch (err) {
    next(err);
  }
};
