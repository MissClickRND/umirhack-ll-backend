import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { AllExceptionFilter } from './common/filters/all-exeption.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

function normalizeOrigin(value: string): string {
  return value
    .replace(/[\u200B-\u200D\uFEFF\u2060]/g, '')
    .trim()
    .replace(/\/$/, '');
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  app.useGlobalInterceptors(
    new LoggingInterceptor()
  );
  app.useGlobalFilters(new AllExceptionFilter());

  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // выкидывает лишние поля
      forbidNonWhitelisted: true, // если пришли лишние поля — 400
      transform: true, // превращает строки в нужные типы (если возможно)
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Auth Service API')
    .setDescription('Authentication microservice API')
    .setVersion('1.0')
    .addCookieAuth('accessToken')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const originsRaw =
    configService.get<string>('CORS_ORIGIN') ??
    'http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000';
  const allowedOrigins = new Set(
    originsRaw
    .split(',')
      .map((origin) => normalizeOrigin(origin))
      .filter(Boolean),
  );

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      const normalizedOrigin = normalizeOrigin(origin);

      if (allowedOrigins.has(normalizedOrigin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked for origin: ${normalizedOrigin}`), false);
    },
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
