import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { AllExceptionFilter } from './common/filters/all-exeption.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';

function parseCorsOrigins(raw?: string): string[] | true {
  const value = (raw ?? 'http://localhost:5173,http://localhost:3000').trim();
  if (value === '*') return true;

  const origins = value
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);

  return origins.length > 0 ? origins : ['http://localhost:5173'];
}

function parseCorsCredentials(raw?: string): boolean {
  return (raw ?? 'true').toLowerCase() === 'true';
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const accessCookieName =
    configService.get<string>('ACCESS_COOKIE_NAME')?.trim() || 'accessToken';

  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalFilters(new AllExceptionFilter());

  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('API')
    .setDescription('CRM API')
    .setVersion('1.0')
    .addCookieAuth(accessCookieName)
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      requestInterceptor: (req: { credentials?: RequestCredentials }) => {
        req.credentials = 'include';
        return req;
      },
    },
  });

  const corsOrigins = parseCorsOrigins(
    process.env.CORS_ORIGINS ?? process.env.CORS_ORIGIN,
  );
  const corsCredentials = parseCorsCredentials(process.env.CORS_CREDENTIALS);

  app.enableCors({
    credentials: corsCredentials,
    origin: corsOrigins,
  });

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
