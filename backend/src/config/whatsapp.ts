import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';
import { logger } from '../utils/logger';

// Ensure .env is loaded
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const whatsappEnvSchema = z.object({
  WHATSAPP_PROVIDER: z.enum(['fast2sms', 'mock', 'cloud_api']).default('fast2sms'),
  
  // Fast2SMS Configuration
  FAST2SMS_API_KEY: z.string().optional(),
  FAST2SMS_PHONE_NUMBER_ID: z.string().optional(),
  FAST2SMS_API_VERSION: z.string().default('v26.0'),
  FAST2SMS_BASE_URL: z.string().url().default('https://www.fast2sms.com'),
  FAST2SMS_WEBHOOK_SECRET: z.string().optional(),

  // Legacy Meta / Cloud API Configuration (Optional)
  WHATSAPP_API_VERSION: z.string().default('v19.0'),
  WHATSAPP_ACCESS_TOKEN: z.string().optional(),
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
  WHATSAPP_BUSINESS_ACCOUNT_ID: z.string().optional(),
  WHATSAPP_WEBHOOK_VERIFY_TOKEN: z.string().default('default-verify-token'),
  WHATSAPP_APP_SECRET: z.string().default('default-app-secret'),
});

let whatsappConfig: z.infer<typeof whatsappEnvSchema>;

try {
  if (process.env.NODE_ENV === 'test') {
    whatsappConfig = {
      WHATSAPP_PROVIDER: 'mock',
      FAST2SMS_API_KEY: 'test-fast2sms-api-key',
      FAST2SMS_PHONE_NUMBER_ID: 'test-phone-number-id',
      FAST2SMS_API_VERSION: 'v26.0',
      FAST2SMS_BASE_URL: 'https://www.fast2sms.com',
      FAST2SMS_WEBHOOK_SECRET: 'test-webhook-secret',
      WHATSAPP_API_VERSION: 'v19.0',
      WHATSAPP_ACCESS_TOKEN: 'test-token',
      WHATSAPP_PHONE_NUMBER_ID: 'test-phone-id',
      WHATSAPP_BUSINESS_ACCOUNT_ID: 'test-business-id',
      WHATSAPP_WEBHOOK_VERIFY_TOKEN: 'test-verify-token',
      WHATSAPP_APP_SECRET: 'test-app-secret',
    };
  } else {
    whatsappConfig = whatsappEnvSchema.parse(process.env);
  }
} catch (error: any) {
  if (error instanceof z.ZodError) {
    logger.fatal({ errors: error.issues }, 'Missing or invalid WhatsApp environment variables');
  }
  process.exit(1);
}

export const waConfig = whatsappConfig;
