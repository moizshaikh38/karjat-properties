import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';
import { logger } from '../utils/logger';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const aiEnvSchema = z.object({
  AI_PROVIDER: z.string().default('openrouter'),
  AI_API_KEY: z.string().optional(),
  AI_BASE_URL: z.string().default('https://openrouter.ai/api/v1'),
  AI_MODEL: z.string().default('openai/gpt-4o'),
  AI_TEMPERATURE: z.coerce.number().min(0).max(1).default(0.2),
  AI_MAX_TOKENS: z.coerce.number().int().positive().default(500),
  AI_CONTEXT_MESSAGES: z.coerce.number().int().positive().default(10),
  AI_MAX_CONSECUTIVE_FAILURES: z.coerce.number().int().positive().default(3),
});

let aiConfig: z.infer<typeof aiEnvSchema>;

try {
  if (process.env.NODE_ENV === 'test') {
    aiConfig = {
      AI_PROVIDER: 'mock',
      AI_API_KEY: 'test-key',
      AI_BASE_URL: 'https://openrouter.ai/api/v1',
      AI_MODEL: 'test-model',
      AI_TEMPERATURE: 0.2,
      AI_MAX_TOKENS: 500,
      AI_CONTEXT_MESSAGES: 10,
      AI_MAX_CONSECUTIVE_FAILURES: 3,
    };
  } else {
    aiConfig = aiEnvSchema.parse(process.env);
  }
} catch (error: any) {
  if (error instanceof z.ZodError) {
    logger.fatal({ errors: error.issues }, 'Invalid AI environment variables');
  }
  process.exit(1);
}

export const config = aiConfig;
