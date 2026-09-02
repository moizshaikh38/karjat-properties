import axios from 'axios';
import { logger } from '../utils/logger';

const PING_INTERVAL_MS = 10 * 60 * 1000; // Ping every 10 minutes (Render sleeps after 15 mins)

export const startKeepAliveService = () => {
  // Determine server public URL
  const publicUrl = (
    process.env.RENDER_EXTERNAL_URL ||
    process.env.BACKEND_URL ||
    'https://karjat-properties.onrender.com'
  ).replace(/\/+$/, '');

  const pingUrl = `${publicUrl}/api/health`;

  logger.info({ pingUrl, intervalMinutes: 10 }, '⚡ Render Keep-Alive Ping Service initialized');

  // Perform initial ping after 30 seconds
  setTimeout(async () => {
    try {
      const res = await axios.get(pingUrl, { timeout: 10000 });
      logger.info({ status: res.status, url: pingUrl }, '⚡ Initial Keep-Alive ping successful');
    } catch (err: any) {
      logger.warn({ error: err.message, url: pingUrl }, 'Initial Keep-Alive ping failed (server may still be starting)');
    }
  }, 30000);

  // Set recurring ping timer
  setInterval(async () => {
    try {
      const res = await axios.get(pingUrl, { timeout: 15000 });
      logger.info({ status: res.status, timestamp: new Date().toISOString() }, '⚡ Keep-Alive ping sent successfully');
    } catch (err: any) {
      logger.warn({ error: err.message }, '⚡ Keep-Alive ping failed');
    }
  }, PING_INTERVAL_MS);
};
