import pino from 'pino';
import { env } from '../config/env';

const isProduction = (env?.NODE_ENV || process.env.NODE_ENV) === 'production';

export const logger = pino({
  level: isProduction ? 'info' : 'debug',
  transport: !isProduction ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  } : undefined,
});
