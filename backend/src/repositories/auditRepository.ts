import { db } from '../database/client';
import { logger } from '../utils/logger';

export const logAuditEvent = async (
  userId: string | null,
  action: string,
  entityType: string,
  entityId: string | null = null,
  metadata: Record<string, any> = {}
): Promise<void> => {
  try {
    const client = db.getClient();
    const { error } = await client.from('audit_logs').insert({
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      metadata,
    });

    if (error) {
      logger.error({ error, action, userId }, 'Failed to write audit log to database');
    }
  } catch (err) {
    logger.error({ err, action, userId }, 'Exception while writing audit log');
  }
};
