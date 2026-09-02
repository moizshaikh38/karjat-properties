import app from './src/app';
import { env } from './src/config/env';
import { logger } from './src/utils/logger';

import { processDueFollowups } from './src/services/followups/followupScheduler';
import { followupConfig } from './src/config/followup';
import { startCampaignWorker } from './src/services/campaigns/campaignWorker';

const startServer = () => {
  try {
    const port = env.PORT;

    const server = app.listen(port, () => {
      logger.info(`🚀 Server running in ${env.NODE_ENV} mode on port ${port}`);
      
      // Start Follow-up Scheduler
      if (followupConfig.FOLLOWUP_ENABLED) {
        setInterval(() => {
          processDueFollowups().catch(err => logger.error({ err }, 'Followup Scheduler Error'));
        }, followupConfig.FOLLOWUP_POLL_INTERVAL_SECONDS * 1000);
        logger.info('🕒 Follow-up Scheduler started');
      }

      startCampaignWorker();
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err: Error) => {
      logger.fatal({ err }, 'Unhandled Rejection! Shutting down...');
      server.close(() => {
        process.exit(1);
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (err: Error) => {
      logger.fatal({ err }, 'Uncaught Exception! Shutting down...');
      process.exit(1);
    });

  } catch (error) {
    logger.fatal({ err: error }, 'Failed to start server');
    process.exit(1);
  }
};

startServer();
