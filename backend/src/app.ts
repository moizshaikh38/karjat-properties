import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { NotFoundError } from './utils/errors';
import healthRoutes from './routes/health.routes';
import propertyRoutes from './routes/property.routes';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import conversationRoutes from './routes/conversationRoutes';
import leadRoutes from './routes/lead.routes';
import followupRoutes from './routes/followupRoutes';
import siteVisitRoutes from './routes/siteVisitRoutes';
import analyticsRoutes from './routes/analytics.routes';
import campaignRoutes from './routes/campaign.routes';
import {
  fast2smsWebhookRouter,
  webhookRouter as whatsappWebhookRouter,
  adminRouter as whatsappAdminRouter,
} from './routes/whatsappRoutes';
import { apiRateLimiter } from './middleware/rateLimiter';

const app: Application = express();

// Permissive CORS for Vercel, Localhost & Custom Domains
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || origin === env.FRONTEND_URL || origin.includes('vercel.app') || origin.includes('localhost')) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
}));

app.use(
  express.json({
    limit: '10mb',
    verify: (req: any, res, buf) => {
      // Capture raw body for signature verification if required
      if (req.originalUrl.startsWith('/api/webhooks')) {
        req.rawBody = buf;
      }
    },
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Root Probe Route (For Render health checks & browser verification)
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    service: 'Karjat Properties AI CRM Backend',
    status: 'operational',
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

app.head('/', (req: Request, res: Response) => {
  res.status(200).end();
});

// Webhooks
app.use('/api/webhooks/fast2sms', fast2smsWebhookRouter);
app.use('/api/webhooks/whatsapp', whatsappWebhookRouter);

// Apply general API rate limit to all /api routes
app.use('/api', apiRateLimiter);

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/site-visits', siteVisitRoutes);
app.use('/api/followups', followupRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/whatsapp', whatsappAdminRouter);

// Catch 404 and forward to error handler
app.use((req: Request, res: Response, next: NextFunction) => {
  next(new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`));
});

// Centralized error handling middleware
app.use(errorHandler);

export default app;
