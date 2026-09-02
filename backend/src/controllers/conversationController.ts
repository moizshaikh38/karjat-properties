import { Request, Response, NextFunction } from 'express';
import { db } from '../database/client';
import { NotFoundError } from '../utils/errors';
import { whatsappMessageService } from '../services/whatsapp/whatsappMessageService';
import * as messageRepo from '../repositories/messageRepository';

export const listConversations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = '1', limit = '50', mode, status = 'active', search } = req.query;
    
    let query = db.getClient().from('whatsapp_conversations').select(`
      *,
      lead:leads ( id, name, classification, assigned_to )
    `, { count: 'exact' });

    if (mode) query = query.eq('mode', mode);
    if (status) query = query.eq('status', status);
    
    // Simplistic search against phone
    if (search) {
      query = query.ilike('whatsapp_phone', `%${search}%`);
    }

    const p = parseInt(page as string);
    const l = parseInt(limit as string);
    const from = (p - 1) * l;
    const to = from + l - 1;

    query = query.range(from, to).order('last_message_at', { ascending: false, nullsFirst: false });

    const { data, count, error } = await query;
    if (error) throw error;

    res.json({
      success: true,
      data,
      meta: { total: count, page: p, limit: l }
    });
  } catch (error) {
    next(error);
  }
};

export const getConversationMessages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { page = '1', limit = '50' } = req.query;

    const p = parseInt(page as string);
    const l = parseInt(limit as string);
    const from = (p - 1) * l;
    const to = from + l - 1;

    const { data, count, error } = await db.getClient()
      .from('whatsapp_messages')
      .select('*', { count: 'exact' })
      .eq('conversation_id', id)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    res.json({
      success: true,
      data,
      meta: { total: count, page: p, limit: l }
    });
  } catch (error) {
    next(error);
  }
};

export const sendManualMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { type, text } = req.body;
    
    if (type !== 'text' || !text) {
      res.status(400).json({ success: false, error: { message: 'Only text messages are currently supported.' } });
      return;
    }

    const { data: conv } = await db.getClient().from('whatsapp_conversations').select('*').eq('id', id).single();
    if (!conv) throw new NotFoundError('Conversation not found');

    const waResponse = await whatsappMessageService.sendText({ to: conv.whatsapp_phone, text });

    if (waResponse?.messages?.[0]?.id) {
      const dbRecord = await messageRepo.createMessage({
        conversation_id: id as string,
        whatsapp_message_id: waResponse.messages[0].id,
        direction: 'outgoing',
        message_type: 'text',
        recipient_phone: conv.whatsapp_phone,
        text_content: text as string,
        status: 'sent',
        sent_at: new Date().toISOString()
      });

      // Update last message time
      await db.getClient().from('whatsapp_conversations').update({ last_message_at: new Date().toISOString() }).eq('id', id);

      res.status(200).json({ success: true, data: dbRecord });
    } else {
      res.status(500).json({ success: false, error: { message: 'Failed to send message via WhatsApp' } });
    }
  } catch (error) {
    next(error);
  }
};
