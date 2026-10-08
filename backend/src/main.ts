import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { UPLOADS_DIR } from './uploads/uploads.controller';
import { UpstreamErrorFilter } from './common/upstream-error.filter';

async function bootstrap() {
  // rawBody keeps the unparsed request bytes available (req.rawBody), which
  // BTCPay requires to verify webhook signatures.
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { rawBody: true });

  // Served outside the /api prefix so uploaded image URLs are plain,
  // stable paths (e.g. APP_URL/uploads/xyz.jpg).
  app.useStaticAssets(UPLOADS_DIR, { prefix: '/uploads' });

  // Enable CORS
  app.enableCors({
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:3001',
      process.env.ADMIN_PANEL_URL || 'http://localhost:3002',
    ],
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Failed outgoing requests (payment provider, FX rates) that weren't
  // handled where they were made: one log line and a clean 502.
  app.useGlobalFilters(new UpstreamErrorFilter());

  // Global prefix
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Backend server running on http://localhost:${port}/api`);
}

bootstrap();
