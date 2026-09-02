import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';
import { logger } from '../utils/logger';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const followupEnvSchema = z.object({
  FOLLOWUP_ENABLED: z.coerce.boolean().default(true),
  FOLLOWUP_POLL_INTERVAL_SECONDS: z.coerce.number().int().positive().default(60),
  FOLLOWUP_BATCH_SIZE: z.coerce.number().int().positive().default(50),
  FOLLOWUP_MAX_PER_LEAD: z.coerce.number().int().positive().default(5),
  FOLLOWUP_MIN_GAP_HOURS: z.coerce.number().int().positive().default(12),
  FOLLOWUP_BUSINESS_START_HOUR: z.coerce.number().int().min(0).max(23).default(9),
  FOLLOWUP_BUSINESS_END_HOUR: z.coerce.number().int().min(0).max(23).default(20),
  FOLLOWUP_TIMEZONE: z.string().default('Asia/Kolkata'),
});

let _config: z.infer<typeof followupEnvSchema>;

try {
  if (process.env.NODE_ENV === 'test') {
    _config = {
      FOLLOWUP_ENABLED: true,
      FOLLOWUP_POLL_INTERVAL_SECONDS: 60,
      FOLLOWUP_BATCH_SIZE: 50,
      FOLLOWUP_MAX_PER_LEAD: 5,
      FOLLOWUP_MIN_GAP_HOURS: 12,
      FOLLOWUP_BUSINESS_START_HOUR: 9,
      FOLLOWUP_BUSINESS_END_HOUR: 20,
      FOLLOWUP_TIMEZONE: 'Asia/Kolkata',
    };
  } else {
    _config = followupEnvSchema.parse(process.env);
  }
} catch (error: any) {
  if (error instanceof z.ZodError) {
    logger.fatal({ errors: error.issues }, 'Invalid Follow-up environment variables');
  }
  process.exit(1);
}

export const followupConfig = _config;
