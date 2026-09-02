import { Request, Response, NextFunction } from 'express';
import { db } from '../database/client';
import * as siteVisitService from '../services/siteVisitService';
import { JWTPayload } from '../types/user';

export const listSiteVisits = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = '1', limit = '50', status, agent_id } = req.query;
    
    let query = db.getClient()
      .from('site_visits')
      .select('*, lead:leads(name, phone, status), property:properties(name, location_city)', { count: 'exact' });

    if (status) query = query.eq('status', status);
    if (agent_id) query = query.eq('assigned_agent_id', agent_id);

    const user = (req as any).user as JWTPayload;
    if (user.role === 'agent') {
      query = query.eq('assigned_agent_id', user.userId);
    }

    const p = parseInt(page as string);
    const l = parseInt(limit as string);
    const from = (p - 1) * l;
    const to = from + l - 1;

    query = query.range(from, to).order('scheduled_start', { ascending: true, nullsFirst: false });

    const { data, count, error } = await query;
    if (error) throw error;

    res.json({ success: true, data, meta: { total: count, page: p, limit: l } });
  } catch (err) {
    next(err);
  }
};

export const scheduleVisit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { assigned_agent_id, scheduled_start, scheduled_end } = req.body;
    const user = (req as any).user as JWTPayload;

    const start = new Date(scheduled_start);
    const end = new Date(scheduled_end);

    const visit = await siteVisitService.scheduleSiteVisit(
      id as string,
      assigned_agent_id || user.userId, // Default to self if not specified
      start,
      end,
      user.userId
    );

    res.json({ success: true, data: visit });
  } catch (err) {
    next(err);
  }
};

export const cancelVisit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const user = (req as any).user as JWTPayload;
    
    const visit = await siteVisitService.cancelSiteVisit(id as string, user.userId);
    res.json({ success: true, data: visit });
  } catch (err) {
    next(err);
  }
};

export const completeVisit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { feedback_notes } = req.body;
    const user = (req as any).user as JWTPayload;
    
    const client = db.getClient();
    const { data: visit, error } = await client.from('site_visits').update({
      status: 'COMPLETED',
      agent_notes: feedback_notes,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }).eq('id', id as string).select().single();

    if (error || !visit) throw error;

    // Transition lead
    const { transitionLeadStage } = await import('../services/leadPipelineService');
    await transitionLeadStage(visit.lead_id, 'site_visit_completed', user.userId, 'Agent marked visit completed');

    res.json({ success: true, data: visit });
  } catch (err) {
    next(err);
  }
};
