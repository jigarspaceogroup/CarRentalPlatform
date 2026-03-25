import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { swaggerSpec } from './config/swagger';
import { globalErrorHandler } from './middleware/error-handler';
import { notFoundHandler } from './middleware/not-found';
import { apiRateLimiter } from './middleware/rate-limit';
import { apiRouter } from './routes';

export function createApp() {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(cors({
    origin: env.CORS_ORIGINS.split(',').map(o => o.trim()),
    credentials: true,
  }));

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Logging
  if (env.NODE_ENV !== 'test') {
    app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
  }

  // Rate limiting
  app.use('/api/', apiRateLimiter);

  // Swagger docs
  if (env.NODE_ENV !== 'production') {
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'Car Rental API Docs',
    }));
    app.get('/api/docs.json', (_req, res) => {
      res.json(swaggerSpec);
    });
  }

  // API routes
  app.use('/api/v1', apiRouter);

  // Error handling
  app.use(notFoundHandler);
  app.use(globalErrorHandler);

  return app;
}
