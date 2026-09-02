import path from 'path';
import fs from 'fs';
import { db } from '../database/client';
import { env } from '../config/env';
import { logger } from '../utils/logger';

const BUCKET_NAME = process.env.SUPABASE_MEDIA_BUCKET || 'property-media';
const LOCAL_STORAGE_DIR = path.join(process.cwd(), 'public', 'uploads');

class StorageService {
  private bucketChecked = false;

  constructor() {
    // Ensure local fallback directory exists
    if (!fs.existsSync(LOCAL_STORAGE_DIR)) {
      try {
        fs.mkdirSync(LOCAL_STORAGE_DIR, { recursive: true });
      } catch (err) {
        // ignore
      }
    }
  }

  private isSupabaseConfigured(): boolean {
    return Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);
  }

  /**
   * Ensures the Supabase Storage bucket exists and is public
   */
  public async ensureBucket(): Promise<void> {
    if (this.bucketChecked || !this.isSupabaseConfigured()) return;

    try {
      const client = db.getClient();
      const { data: buckets, error } = await client.storage.listBuckets();
      if (error) {
        logger.warn({ error: error.message }, 'Could not list storage buckets; continuing');
        return;
      }

      const exists = (buckets || []).some((b: any) => b.name === BUCKET_NAME);
      if (!exists) {
        const { error: createError } = await client.storage.createBucket(BUCKET_NAME, {
          public: true,
          fileSizeLimit: 104857600, // 100MB
          allowedMimeTypes: [
            'image/jpeg',
            'image/png',
            'image/webp',
            'image/heic',
            'video/mp4',
            'video/quicktime',
          ],
        });
        if (createError) {
          logger.warn({ error: createError.message }, 'Failed to auto-create storage bucket');
        } else {
          logger.info({ bucket: BUCKET_NAME }, 'Created public Supabase storage bucket');
        }
      }
      this.bucketChecked = true;
    } catch (err: any) {
      logger.warn({ error: err.message }, 'Storage bucket check skipped');
    }
  }

  /**
   * Upload buffer or file stream to object storage
   */
  public async upload(
    fileBufferOrPath: Buffer | string,
    storagePath: string,
    contentType: string
  ): Promise<{ url: string; path: string; size: number }> {
    await this.ensureBucket();

    // Read buffer if file path was given
    let buffer: Buffer;
    let fileSize = 0;
    if (typeof fileBufferOrPath === 'string') {
      buffer = await fs.promises.readFile(fileBufferOrPath);
      fileSize = buffer.length;
    } else {
      buffer = fileBufferOrPath;
      fileSize = buffer.length;
    }

    if (this.isSupabaseConfigured()) {
      try {
        const client = db.getClient();
        const { data, error } = await client.storage
          .from(BUCKET_NAME)
          .upload(storagePath, buffer, {
            contentType,
            upsert: true,
          });

        if (error) {
          logger.error({ error: error.message, storagePath }, 'Supabase storage upload error, falling back to local storage');
        } else if (data) {
          const { data: publicUrlData } = client.storage
            .from(BUCKET_NAME)
            .getPublicUrl(storagePath);

          logger.info({ storagePath, size: fileSize }, 'Uploaded media to Supabase storage successfully');
          return {
            url: publicUrlData.publicUrl,
            path: storagePath,
            size: fileSize,
          };
        }
      } catch (err: any) {
        logger.error({ error: err.message }, 'Error during Supabase upload, falling back to local');
      }
    }

    // Local Filesystem Fallback (e.g. mock DB or dev environment)
    const localTarget = path.join(LOCAL_STORAGE_DIR, storagePath);
    const targetDir = path.dirname(localTarget);
    if (!fs.existsSync(targetDir)) {
      await fs.promises.mkdir(targetDir, { recursive: true });
    }

    await fs.promises.writeFile(localTarget, buffer);

    let baseUrl = process.env.PUBLIC_BASE_URL || process.env.BACKEND_URL || process.env.BASE_URL;
    if (!baseUrl || baseUrl === '/' || !baseUrl.startsWith('http')) {
      baseUrl = `http://localhost:${env.PORT || 5000}`;
    }
    baseUrl = baseUrl.replace(/\/+$/, '');
    const publicUrl = `${baseUrl}/uploads/${storagePath.replace(/\\/g, '/')}`;

    logger.info({ localTarget, publicUrl }, 'Saved media to local storage fallback');
    return {
      url: publicUrl,
      path: storagePath,
      size: fileSize,
    };
  }

  /**
   * Delete file from storage
   */
  public async delete(storagePath: string): Promise<boolean> {
    if (this.isSupabaseConfigured()) {
      try {
        const client = db.getClient();
        const { error } = await client.storage.from(BUCKET_NAME).remove([storagePath]);
        if (error) {
          logger.warn({ error: error.message, storagePath }, 'Failed to delete from Supabase storage');
        }
      } catch (err: any) {
        logger.warn({ error: err.message }, 'Supabase delete error');
      }
    }

    // Also remove local file if present
    const localTarget = path.join(LOCAL_STORAGE_DIR, storagePath);
    if (fs.existsSync(localTarget)) {
      try {
        await fs.promises.unlink(localTarget);
      } catch {
        // ignore
      }
    }

    return true;
  }
}

export const storageService = new StorageService();
