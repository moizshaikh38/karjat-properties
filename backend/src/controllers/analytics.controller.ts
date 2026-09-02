import { Request, Response, NextFunction } from 'express';
import * as analyticsService from '../services/analytics/analyticsService';
import { db } from '../database/client';

const getRange = (req: Request): analyticsService.AnalyticsDateRange => {
  const { startDate, endDate } = req.query;
  // Default to last 30 days if not provided
  const end = endDate ? new Date(endDate as string) : new Date();
  const start = startDate ? new Date(startDate as string) : new Date();
  if (!startDate) start.setDate(start.getDate() - 30);

  return {
    startDate: start.toISOString(),
    endDate: end.toISOString()
  };
};

export const getOverview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const range = getRange(req);
    // Role-based filtering
    const agentId = req.user!.role === 'agent' ? req.user!.userId : undefined;

    const [leadStats, aiStats, propStats] = await Promise.all([
      analyticsService.getLeadAnalytics(range, agentId),
      analyticsService.getAIWhatsAppAnalytics(range, agentId),
      analyticsService.getPropertyAnalytics(range)
    ]);

    res.json({
      success: true,
      data: {
        leads: leadStats,
        ai: aiStats,
        properties: propStats
      }
    });
  } catch (err) {
    next(err);
  }
};

export const getSystemHealth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const client = db.getClient();
    let dbStatus = 'HEALTHY';
    try {
      await client.from('leads').select('id').limit(1);
    } catch {
      dbStatus = 'DOWN';
    }

    res.json({
      success: true,
      data: {
        database: dbStatus,
        aiProvider: 'HEALTHY', // Mock, ideally ping provider
        whatsapp: 'HEALTHY',
        scheduler: 'RUNNING'
      }
    });
  } catch (err) {
    next(err);
  }
};
