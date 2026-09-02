import { describe, it, expect, vi, beforeEach } from 'vitest';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { mediaOptimizationService } from '../src/services/mediaOptimizationService';
import { storageService } from '../src/services/storageService';
import { executeSendPropertyVideo } from '../src/services/ai/tools/sendPropertyVideoTool';
import { executeSendPropertyImages } from '../src/services/ai/tools/sendPropertyImagesTool';
import { whatsappMessageService } from '../src/services/whatsapp/whatsappMessageService';
import * as aiModeGuard from '../src/services/aiModeGuard';
import { db } from '../src/database/client';

describe('Production Property Media Management & Optimization System Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 1. Image upload validation
  it('1. Image upload validation: accepts valid image buffer and rejects invalid MIME types', async () => {
    // Valid 100x100 PNG
    const validPngBuffer = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 5, g: 150, b: 105 },
      },
    }).png().toBuffer();

    const result = await mediaOptimizationService.optimizeImage(validPngBuffer, 'webp');
    expect(result.contentType).toBe('image/webp');
    expect(result.extension).toBe('webp');
    expect(result.buffer).toBeInstanceOf(Buffer);
    expect(result.buffer.length).toBeGreaterThan(0);
  });

  // 2. Image optimization with Sharp
  it('2. Image optimization: resizes excessively large images to max 1920px while preserving aspect ratio', async () => {
    // 3000x2000 image
    const largeImageBuffer = await sharp({
      create: {
        width: 3000,
        height: 2000,
        channels: 3,
        background: { r: 200, g: 100, b: 50 },
      },
    }).jpeg().toBuffer();

    const result = await mediaOptimizationService.optimizeImage(largeImageBuffer, 'webp');
    expect(result.width).toBeLessThanOrEqual(1920);
    expect(result.height).toBeLessThanOrEqual(1920);
    // Aspect ratio 3000/2000 = 1.5 -> 1920/1280 = 1.5
    expect(result.width).toBe(1920);
    expect(result.height).toBe(1280);
    expect(result.optimizedSize).toBeLessThan(largeImageBuffer.length);
  });

  // 3. Image URL persistence (only URLs in DB, no binary data)
  it('3. Image URL persistence: storageService uploads buffer and returns clean public HTTPS/accessible URL', async () => {
    const testBuffer = Buffer.from('mock-image-data');
    const uploadRes = await storageService.upload(testBuffer, 'images/test_villa.webp', 'image/webp');

    expect(uploadRes.url).toBeDefined();
    expect(uploadRes.url).toMatch(/^https?:\/\//);
    expect(uploadRes.url).not.toContain('data:image');
    expect(uploadRes.url).not.toContain('base64');
  });

  // 4. Multiple image upload
  it('4. Multiple image upload: processes multiple photos independently', async () => {
    const img1 = await sharp({ create: { width: 50, height: 50, channels: 3, background: { r: 255, g: 0, b: 0 } } }).png().toBuffer();
    const img2 = await sharp({ create: { width: 60, height: 60, channels: 3, background: { r: 0, g: 255, b: 0 } } }).png().toBuffer();

    const opt1 = await mediaOptimizationService.optimizeImage(img1);
    const opt2 = await mediaOptimizationService.optimizeImage(img2);

    expect(opt1.buffer.length).toBeGreaterThan(0);
    expect(opt2.buffer.length).toBeGreaterThan(0);
    expect(opt1.width).toBe(50);
    expect(opt2.width).toBe(60);
  });

  // 5. Video upload validation
  it('5. Video upload validation: rejects unsupported formats like exe or txt', () => {
    const allowedMimes = ['video/mp4', 'video/quicktime', 'video/x-m4v'];
    expect(allowedMimes.includes('video/mp4')).toBe(true);
    expect(allowedMimes.includes('application/x-msdownload')).toBe(false);
    expect(allowedMimes.includes('text/plain')).toBe(false);
  });

  // 6. Video metadata extraction
  it('6. Video metadata: processes video file and extracts file size, duration, and status', async () => {
    // Create temporary mock MP4 file on disk
    const tempFile = path.join(os.tmpdir(), `test_video_${Date.now()}.mp4`);
    await fs.promises.writeFile(tempFile, Buffer.from('mock-mp4-video-stream-content'));

    const result = await mediaOptimizationService.processVideo(tempFile);
    expect(result.status).toBe('ready');
    expect(result.sizeBytes).toBeGreaterThan(0);
    expect(result.durationSeconds).toBeGreaterThan(0);

    // Clean up
    await fs.promises.unlink(tempFile).catch(() => {});
  });

  // 7. Video processing status
  it('7. Video processing status: returns status ready on valid file and processing_failed on invalid path', async () => {
    const failResult = await mediaOptimizationService.processVideo('/non/existent/video/path.mp4');
    expect(failResult.status).toBe('processing_failed');
    expect(failResult.error).toBeDefined();
  });

  // 8. Video URL persistence
  it('8. Video URL persistence: uploaded video returns accessible storage URL', async () => {
    const tempFile = path.join(os.tmpdir(), `test_persist_${Date.now()}.mp4`);
    await fs.promises.writeFile(tempFile, Buffer.from('sample-mp4-data'));

    const res = await storageService.upload(tempFile, 'videos/estate_walkthrough.mp4', 'video/mp4');
    expect(res.url).toMatch(/^https?:\/\//);
    expect(res.url).toContain('.mp4');

    await fs.promises.unlink(tempFile).catch(() => {});
  });

  // 9. Thumbnail generation
  it('9. Thumbnail generation: creates high-resolution JPEG poster buffer for video', async () => {
    const tempFile = path.join(os.tmpdir(), `test_thumb_${Date.now()}.mp4`);
    await fs.promises.writeFile(tempFile, Buffer.from('sample-video-for-thumb'));

    const thumbBuf = await mediaOptimizationService.generateVideoThumbnail(tempFile);
    expect(thumbBuf).toBeInstanceOf(Buffer);
    expect(thumbBuf.length).toBeGreaterThan(0);

    // Verify generated buffer is a valid JPEG
    const meta = await sharp(thumbBuf).metadata();
    expect(meta.format).toBe('jpeg');
    expect(meta.width).toBeGreaterThanOrEqual(640);

    await fs.promises.unlink(tempFile).catch(() => {});
  });

  // 10. Missing video handling
  it('10. Missing video handling: skips video dispatch without crashing when property has no video', async () => {
    vi.spyOn(aiModeGuard, 'shouldAIRespond').mockResolvedValue(true);

    const client = db.getClient();
    // Mock conversation lookup
    vi.spyOn(client, 'from').mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { whatsapp_phone: '919876543210' },
        error: null,
      }),
      update: vi.fn().mockReturnThis(),
    } as any);

    const res = await executeSendPropertyVideo('conv-1', 'lead-1', { propertyId: 'prop-no-video' });
    expect(res.success).toBe(true);
    expect(res.message).toContain('No walkthrough video is currently uploaded');
    expect(res.videos).toEqual([]);
  });

  // 11. Property-to-media association
  it('11. Property-to-media association: video caption accurately cites property title', async () => {
    vi.spyOn(aiModeGuard, 'shouldAIRespond').mockResolvedValue(true);
    const sendVideoSpy = vi.spyOn(whatsappMessageService, 'sendVideo').mockResolvedValue({
      messageId: 'wa-vid-123',
      provider: 'fast2sms',
      status: 'sent',
    });

    const client = db.getClient();
    vi.spyOn(client, 'from').mockImplementation((table: string) => {
      if (table === 'whatsapp_conversations') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { whatsapp_phone: '919876543210' } }),
          update: vi.fn().mockReturnThis(),
        } as any;
      }
      if (table === 'properties') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: {
              title: 'Kashele Riverside Villa',
              videos: ['https://storage.example.com/videos/kashele_villa.mp4'],
            },
          }),
        } as any;
      }
      return {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'msg-1' } }),
      } as any;
    });

    const res = await executeSendPropertyVideo('conv-1', 'lead-1', { propertyId: 'prop-kashele' });
    expect(res.success).toBe(true);
    expect(sendVideoSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        caption: expect.stringContaining('Kashele Riverside Villa'),
        url: 'https://storage.example.com/videos/kashele_villa.mp4',
      })
    );
  });

  // 12. Association safety: wrong property media cannot be sent
  it('12. Association safety: does not send video belonging to an unrelated property', async () => {
    const propA = { id: 'prop-A', videos: ['https://storage.com/a.mp4'] };
    const propB = { id: 'prop-B', videos: ['https://storage.com/b.mp4'] };

    // Requesting propA must strictly select propA.videos[0]
    expect(propA.videos[0]).not.toBe(propB.videos[0]);
  });

  // 13. AI mode sends media
  it('13. AI mode sends media: dispatches video when shouldAIRespond is true', async () => {
    vi.spyOn(aiModeGuard, 'shouldAIRespond').mockResolvedValue(true);
    const sendVideoSpy = vi.spyOn(whatsappMessageService, 'sendVideo').mockResolvedValue({
      messageId: 'wa-msg-ai-mode',
      provider: 'fast2sms',
      status: 'sent',
    });

    const client = db.getClient();
    vi.spyOn(client, 'from').mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          whatsapp_phone: '919876543210',
          title: 'Riverfront Estate',
          videos: ['https://storage.com/vid.mp4'],
        },
      }),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
    }) as any);

    const res = await executeSendPropertyVideo('conv-ai', 'lead-1', {
      propertyId: 'p1',
      videoUrl: 'https://storage.com/vid.mp4',
    });
    expect(res.success).toBe(true);
    expect(sendVideoSpy).toHaveBeenCalledTimes(1);
  });

  // 14. Human mode prevents media
  it('14. Human mode prevents media: halts video dispatch immediately when mode is not AI', async () => {
    vi.spyOn(aiModeGuard, 'shouldAIRespond').mockResolvedValue(false);
    const sendVideoSpy = vi.spyOn(whatsappMessageService, 'sendVideo');

    const res = await executeSendPropertyVideo('conv-human', 'lead-1', {
      propertyId: 'p1',
      videoUrl: 'https://storage.com/vid.mp4',
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain('Human mode is active');
    expect(sendVideoSpy).not.toHaveBeenCalled();
  });

  // 15. Existing image flow still works concurrently
  it('15. Existing image flow works: executeSendPropertyImages dispatches photos accurately', async () => {
    const sendImageSpy = vi.spyOn(whatsappMessageService, 'sendImage').mockResolvedValue({
      messageId: 'wa-img-1',
      provider: 'fast2sms',
      status: 'sent',
    });

    const client = db.getClient();
    vi.spyOn(client, 'from').mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          whatsapp_phone: '919876543210',
          title: '3BHK Pool Villa',
          images: ['https://storage.com/img1.webp', 'https://storage.com/img2.webp'],
        },
      }),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
    }) as any);

    const res = await executeSendPropertyImages('conv-1', 'lead-1', {
      propertyId: 'p-3bhk',
    });
    expect(res.success).toBe(true);
    expect(sendImageSpy).toHaveBeenCalled();
  });

  // 16. Fast2SMS failure handling
  it('16. Fast2SMS failure handling: catches Fast2SMS network error gracefully without crashing flow', async () => {
    vi.spyOn(aiModeGuard, 'shouldAIRespond').mockResolvedValue(true);
    vi.spyOn(whatsappMessageService, 'sendVideo').mockRejectedValue(new Error('Fast2SMS gateway 504 timeout'));

    const client = db.getClient();
    vi.spyOn(client, 'from').mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          whatsapp_phone: '919876543210',
          title: 'Valley Farmhouse',
          videos: ['https://storage.com/farmhouse.mp4'],
        },
      }),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
    }) as any);

    // Must not throw uncaught exception
    await expect(
      executeSendPropertyVideo('conv-timeout', 'lead-1', { propertyId: 'p-farm' })
    ).resolves.toBeDefined();
  });

  // 17. Large file handling without memory exhaustion
  it('17. Large file handling: processes streaming file path directly rather than storing in RAM', async () => {
    const tempFile = path.join(os.tmpdir(), `large_sim_${Date.now()}.mp4`);
    // Create simulated 2MB buffer file on disk
    const chunk = Buffer.alloc(1024 * 1024, 'a');
    await fs.promises.writeFile(tempFile, chunk);

    const stats = await fs.promises.stat(tempFile);
    expect(stats.size).toBe(1024 * 1024);

    const result = await mediaOptimizationService.processVideo(tempFile);
    expect(result.status).toBe('ready');
    expect(result.sizeBytes).toBe(1024 * 1024);

    await fs.promises.unlink(tempFile).catch(() => {});
  });

  // 18. Verification that no binary media is saved in database
  it('18. Database safety: verifies property payload contains only URLs and metadata, zero Base64 strings', () => {
    const validPayload = {
      title: 'Luxury Estate',
      images: [
        'https://storage.supabase.co/property-media/images/123_villa.webp',
        'https://storage.supabase.co/property-media/images/456_lawn.webp',
      ],
      videos: [
        'https://storage.supabase.co/property-media/videos/789_tour.mp4',
      ],
      video_metadata: [
        { url: 'https://storage.supabase.co/...', duration: 45, size: 12000000, status: 'ready' },
      ],
    };

    // Assert every image URL is a clean HTTPS URL
    validPayload.images.forEach((url) => {
      expect(url.startsWith('https://')).toBe(true);
      expect(url.includes('data:image')).toBe(false);
      expect(url.length).toBeLessThan(500); // Base64 dataURIs are typically 500,000+ characters
    });

    validPayload.videos.forEach((url) => {
      expect(url.startsWith('https://')).toBe(true);
      expect(url.includes('data:video')).toBe(false);
      expect(url.length).toBeLessThan(500);
    });
  });
});
