import 'dotenv/config'; // Load .env before everything else
import { NestFactory } from '@nestjs/core';
// Restart trigger: 9
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import * as path from 'path';
import * as expressStatic from 'express';

import { json, urlencoded } from 'express';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Increase body size limits for featured images
  app.use(json({ limit: '5mb' }));
  app.use(urlencoded({ limit: '5mb', extended: true }));

  // Security
  app.use(helmet());

  // Enable graceful shutdown
  app.enableShutdownHooks();

  // Request logging (production-safe)
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      logger.log(`${req.method} ${req.url} ${res.statusCode} ${Date.now() - start}ms`);
    });
    next();
  });

  // CORS Setup
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000,http://localhost:3010';
  const origins = frontendUrl.includes(',')
    ? frontendUrl.split(',').map((url) => url.trim())
    : [frontendUrl];

  logger.log(`Setting up CORS with origins: ${JSON.stringify(origins)}`);

  app.enableCors({
    origin: (origin, callback) => {
      // If no origin (like direct curl or same-origin), allow it
      if (!origin || origin === 'null') {
        return callback(null, true);
      }

      const isAllowed = origins.some((allowedOrigin) => {
        if (allowedOrigin === '*') return true;
        // Exact match or matches the start (for subdomains/paths)
        return origin === allowedOrigin || origin.startsWith(allowedOrigin);
      });

      if (isAllowed) {
        // Return the origin string itself instead of true to be safe
        callback(null, origin);
      } else {
        logger.warn(`CORS blocked for origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders:
      'Content-Type, Accept, Authorization, x-forwarded-proto, cookie, ngrok-skip-browser-warning, Cache-Control',
    exposedHeaders: 'set-cookie',
  });

  // Global prefix with API versioning
  app.setGlobalPrefix('api/v1', {
    exclude: ['health', 'uploads'], // Exclude health check and uploads from versioning
  });

  // Serve tmp files (for Remotion audio during compose) — require session cookie
  app.use('/tmp', (req, res, next) => {
    const cookies = req.headers.cookie || '';
    if (!cookies.includes('better-auth.session_token')) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    next();
  }, expressStatic.static(path.resolve(process.cwd(), 'tmp')));

  // Serve uploads files (for Instagram Studio images) — public access
  app.use('/uploads', expressStatic.static(path.resolve(process.cwd(), 'uploads')));

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('Contently API')
    .setDescription('Content Automation Platform API Documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management')
    .addTag('scraper', 'Web scraping')
    .addTag('ai', 'AI content generation')
    .addTag('articles', 'Article management')
    .addTag('feeds', 'RSS feed management')
    .addTag('wordpress', 'WordPress integration')
    .addTag('billing', 'Billing and tokens')
    .addTag('notifications', 'Notification system')
    .addTag('analytics', 'Analytics and reporting')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/v1/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(`🚀 Contently Backend running on: http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/v1/docs`);
}

bootstrap();
