import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { mediaOptimizationService } from '../services/mediaOptimizationService';
import { storageService } from '../services/storageService';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';

export const uploadImages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      throw new AppError('No images provided for upload', 400, 'NO_FILES_UPLOADED');
    }

    const uploadedMedia = [];

    for (const file of files) {
      // Validate MIME type
      const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/jpg'];
      if (!allowedMimes.includes(file.mimetype.toLowerCase())) {
        throw new AppError(`Unsupported image MIME type: ${file.mimetype}`, 400, 'INVALID_MIME_TYPE');
      }

      const timestamp = Date.now();
      const baseName = path.parse(file.originalname).name.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 40);

      // 1. Optimize image using Sharp
      const optimized = await mediaOptimizationService.optimizeImage(file.buffer, 'webp');

      // 2. Upload optimized version for public CRM/WhatsApp delivery
      const optimizedPath = `images/${timestamp}_${baseName}.${optimized.extension}`;
      const uploadRes = await storageService.upload(optimized.buffer, optimizedPath, optimized.contentType);

      // 3. Store original privately for future reprocessing
      const originalPath = `originals/${timestamp}_${baseName}${path.extname(file.originalname)}`;
      await storageService.upload(file.buffer, originalPath, file.mimetype).catch((err) => {
        logger.warn({ error: err.message }, 'Failed to backup original image; continuing');
      });

      uploadedMedia.push({
        url: uploadRes.url,
        path: uploadRes.path,
        width: optimized.width,
        height: optimized.height,
        original_size: optimized.originalSize,
        optimized_size: optimized.optimizedSize,
        compression_ratio: `${optimized.compressionRatio}%`,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        media: uploadedMedia,
        count: uploadedMedia.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const uploadVideo = async (req: Request, res: Response, next: NextFunction) => {
  const file = req.file;
  if (!file) {
    return next(new AppError('No video file provided for upload', 400, 'NO_FILE_UPLOADED'));
  }

  const tempFilePath = file.path;

  try {
    const allowedMimes = ['video/mp4', 'video/quicktime', 'video/x-m4v'];
    if (!allowedMimes.includes(file.mimetype.toLowerCase())) {
      throw new AppError(`Unsupported video format: ${file.mimetype}. Only MP4 and MOV are supported.`, 400, 'INVALID_VIDEO_FORMAT');
    }

    const timestamp = Date.now();
    const baseName = path.parse(file.originalname).name.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 40);

    // 1. Process video and generate thumbnail
    const processed = await mediaOptimizationService.processVideo(tempFilePath);

    // 2. Upload video file to storage
    const videoStoragePath = `videos/${timestamp}_${baseName}.mp4`;
    const videoUpload = await storageService.upload(tempFilePath, videoStoragePath, 'video/mp4');

    // 3. Upload video poster thumbnail to storage
    let thumbnailUrl = '';
    if (processed.thumbnailBuffer && processed.thumbnailBuffer.length > 0) {
      const thumbStoragePath = `thumbnails/${timestamp}_${baseName}_thumb.jpg`;
      const thumbUpload = await storageService.upload(processed.thumbnailBuffer, thumbStoragePath, 'image/jpeg');
      thumbnailUrl = thumbUpload.url;
    }

    // Clean up temp file from disk immediately
    await fs.promises.unlink(tempFilePath).catch(() => {});

    res.status(200).json({
      success: true,
      data: {
        video_url: videoUpload.url,
        video_thumbnail_url: thumbnailUrl,
        duration: processed.durationSeconds,
        size: videoUpload.size,
        mime_type: 'video/mp4',
        status: processed.status,
      },
    });
  } catch (error) {
    // Ensure temp file is cleaned up even on failure
    await fs.promises.unlink(tempFilePath).catch(() => {});
    next(error);
  }
};

export const deleteMedia = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { path: storagePath } = req.body;
    if (!storagePath) {
      throw new AppError('Storage path is required', 400, 'MISSING_PATH');
    }

    await storageService.delete(storagePath);

    res.status(200).json({
      success: true,
      data: { message: 'Media deleted successfully' },
    });
  } catch (error) {
    next(error);
  }
};
