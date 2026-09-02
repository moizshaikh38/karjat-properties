import { Request, Response, NextFunction } from 'express';
import { db } from '../database/client';

export const listFollowups = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const client = db.getClient();
    const user = (req as any).user;
    
    let query = client
      .from('followups')
      .select('*, leads(name, phone, status), followup_sequences(name)')
      .order('scheduled_at', { ascending: true })
      .limit(100);

    // Filter by agent if not admin/manager
    if (user.role === 'agent') {
      const { data: agentLeads } = await client.from('leads').select('id').eq('assigned_agent_id', user.userId);
      const leadIds = agentLeads?.map(l => l.id) || [];
      query = query.in('lead_id', leadIds);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const getFollowup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const client = db.getClient();
    
    const { data, error } = await client.from('followups').select('*, leads(name, phone)').eq('id', id).single();
    if (error) throw error;

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const cancelFollowup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const client = db.getClient();
    
    await client.from('followups')
      .update({ status: 'cancelled', reason: 'manual_cancellation', cancelled_at: new Date().toISOString() })
      .eq('id', id);

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

export const rescheduleFollowup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { scheduled_at } = req.body;
    const client = db.getClient();
    
    await client.from('followups')
      .update({ scheduled_at })
      .eq('id', id);

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
