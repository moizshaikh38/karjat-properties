import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { mockDb } from './mockDb';

class Database {
  private static instance: SupabaseClient | null = null;

  public static getClient(): SupabaseClient {
    if (!this.instance) {
      if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
        logger.info('Supabase credentials not set, utilizing in-memory database engine for development preview');
        return mockDb as unknown as SupabaseClient;
      }

      this.instance = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
      logger.info('Supabase client initialized with service role key');
    }

    return this.instance;
  }
}

export const db = Database;
