import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { config } from './config/index.js';
import { logger } from './lib/logger.js';
import { errorHandler } from './middleware/error-handler.js';
import { rateLimiter } from './middleware/rate-limiter.js';
import { router } from './routes/index.js';

const app = express();

// Trust proxy (required behind load balancers for correct IP detection)
app.set('trust proxy', 1);

// Security headers
app.use(helmet());

// CORS — restrict to known origins in production
app.use(
  cors({
    origin:
      config.NODE_ENV === 'production'
        ? [config.WEB_BASE_URL, config.API_BASE_URL]
        : true,
    credentials: true,
  }),
);

// Request logging
app.use(
  pinoHttp({
    logger,
    autoLogging: {
      ignore: (req) => req.url === '/api/v1/health',
    },
  }),
);

// Body parsing
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use(rateLimiter);

// API routes
app.use('/api/v1', router);

// Global error handler (must be last middleware)
app.use(errorHandler);

export { app };
