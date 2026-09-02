import { Router } from 'express';
import multer from 'multer';
import os from 'os';
import path from 'path';
import { requireAuth } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';
import * as mediaController from '../controllers/mediaController';

const router = Router();

// Memory storage for fast image processing via Sharp
const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB per image
    files: 10,
  },
});

// Disk storage for streaming video processing without overloading RAM
const videoUpload = multer({
  dest: path.join(os.tmpdir(), 'karjat-video-uploads'),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB per video
    files: 1,
  },
});

// POST /api/media/upload/images
router.post(
  '/upload/images',
  requireAuth,
  requireRole('admin', 'manager'),
  imageUpload.array('files', 10),
  mediaController.uploadImages
);

// POST /api/media/upload/video
router.post(
  '/upload/video',
  requireAuth,
  requireRole('admin', 'manager'),
  videoUpload.single('file'),
  mediaController.uploadVideo
);

// DELETE /api/media
router.delete(
  '/',
  requireAuth,
  requireRole('admin', 'manager'),
  mediaController.deleteMedia
);

export default router;
