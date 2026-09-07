import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger, ValidationPipe } from '@nestjs/common';
import {
  TransformInterceptor,
  LoggingInterceptor,
  HttpExceptionFilter,
  isAllowedOrigin,
} from './common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const corsOriginsEnv = process.env.CORS_ORIGINS;
  const defaultAllowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
  ];
  const allowedOrigins = corsOriginsEnv
    ? corsOriginsEnv.split(',').map((o) => o.trim())
    : defaultAllowedOrigins;
  const isDev = process.env.NODE_ENV !== 'production';

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (isAllowedOrigin(origin, allowedOrigins, isDev)) {
        callback(null, true);
      } else {
        Logger.warn(
          `[CORS] Rejected cross-origin request from: ${origin}`,
          'CorsPolicy',
        );
        callback(null, false);
      }
    },
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'X-Requested-With',
    ],
    exposedHeaders: ['Content-Range', 'X-Total-Count'],
    maxAge: 86400,
  });

  // Global Cross-Cutting Middleware
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor(),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('RekaKarbon Core API')
    .setDescription(
      'REST API backend for RekaKarbon — Indonesia National Carbon Registry, DEX Marketplace, and dMRV Verification Platform.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT Bearer token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');
  const logger = new Logger('Bootstrap');
  logger.log(`Server listening on http://localhost:${port} (0.0.0.0:${port})`);
}
void bootstrap();
