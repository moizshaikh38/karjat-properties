import { db } from '../database/client';
import { hashPassword } from '../utils/password';
import { env } from '../config/env';
import { z } from 'zod';
import { logger } from '../utils/logger';

const adminSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required').transform((e) => e.toLowerCase().trim()),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const bootstrapAdmin = async () => {
  try {
    const input = {
      name: process.env.ADMIN_NAME,
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
    };

    const parsed = adminSchema.safeParse(input);
    if (!parsed.success) {
      logger.error('❌ Invalid admin configuration in environment variables.');
      logger.error(parsed.error.format());
      process.exit(1);
    }

    const { name, email, password } = parsed.data;
    const client = db.getClient();

    // Check if any admin exists
    const { data: existingAdmins, error: countError } = await client
      .from('users')
      .select('id')
      .eq('role', 'admin')
      .limit(1);

    if (countError) {
      throw countError;
    }

    if (existingAdmins && existingAdmins.length > 0) {
      logger.info('✅ An admin account already exists. Skipping bootstrap.');
      process.exit(0);
    }

    const passwordHash = await hashPassword(password);

    const { error: insertError } = await client
      .from('users')
      .insert({
        name,
        email,
        password_hash: passwordHash,
        role: 'admin',
        is_active: true,
      });

    if (insertError) {
      // If it's a unique violation on email, it means the email exists but not as admin
      if (insertError.code === '23505') {
        logger.error('❌ A user with this email already exists.');
        process.exit(1);
      }
      throw insertError;
    }

    logger.info(`✅ Successfully created initial admin account for ${email}.`);
    process.exit(0);
  } catch (error) {
    logger.error({ error }, '❌ Failed to create initial admin');
    process.exit(1);
  }
};

bootstrapAdmin();
