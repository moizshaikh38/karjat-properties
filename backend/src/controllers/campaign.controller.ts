import { Request, Response, NextFunction } from 'express';
import * as campaignService from '../services/campaigns/campaignService';
import * as templateService from '../services/campaigns/templateService';
import { db } from '../database/client';

export const listCampaigns = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await campaignService.listCampaigns();
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

export const getCampaign = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const client = db.getClient();
    const { data, error } = await client.from('campaigns').select('*, campaign_recipients(*)').eq('id', id).single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const createCampaign = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await campaignService.createCampaign(req.body, req.user!.userId);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

export const updateCampaignStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;
    const client = db.getClient();
    
    await client.from('campaigns').update({ status }).eq('id', id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

// Templates
export const listTemplates = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await templateService.listTemplates();
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

export const syncTemplates = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await templateService.syncTemplatesFromProvider();
    res.json({ success: true, message: 'Templates synchronized' });
  } catch (err) { next(err); }
};

// Segments
export const listSegments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await campaignService.listSegments();
    res.json({ success: true, data });
  } catch (err) { next(err); }
};
