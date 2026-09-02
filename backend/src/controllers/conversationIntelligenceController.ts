import { Request, Response, NextFunction } from 'express';
import { db } from '../database/client';

export const getIntelligence = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const client = db.getClient();
    
    const { data, error } = await client
      .from('conversation_intelligence')
      .select('*')
      .eq('conversation_id', id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is not found
      throw error;
    }

    res.json({ success: true, data: data || null });
  } catch (err) {
    next(err);
  }
};
