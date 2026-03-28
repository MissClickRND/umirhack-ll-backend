import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';
import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import type { NextFunction, Request, Response } from 'express';
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

function withTrailingSlash(url: string): string {
  return url.endsWith('/') ? url : `${url}/`;
}

function createServiceProxy(targetBaseUrl: string) {
  const targetBase = withTrailingSlash(targetBaseUrl);

  return (req: Request, res: Response, next: NextFunction) => {
    let targetUrl: URL;
    try {
      targetUrl = new URL(req.originalUrl, targetBase);
    } catch {
      next(new Error(`Invalid proxy target URL: ${targetBaseUrl}`));
      return;
    }

    const transport = targetUrl.protocol === 'https:' ? httpsRequest : httpRequest;

    const headers = { ...req.headers };
    delete headers.host;
    delete headers['content-length'];

    const proxyReq = transport(
      targetUrl,
      {
        method: req.method,
        headers: {
          ...headers,
          host: targetUrl.host,
          'x-forwarded-host': req.headers.host,
          'x-forwarded-proto': req.protocol,
          'x-forwarded-for': req.ip,
        },
      },
      (proxyRes) => {
        res.status(proxyRes.statusCode ?? 502);

        for (const [header, value] of Object.entries(proxyRes.headers)) {
          if (value === undefined) continue;
          res.setHeader(header, value);
        }

        proxyRes.pipe(res);
      },
    );

    proxyReq.on('error', (error) => {
      if (res.headersSent) return;
      res.status(502).json({
        message: `Upstream service is unavailable: ${error.message}`,
      });
    });

    if (req.method === 'GET' || req.method === 'HEAD') {
      proxyReq.end();
      return;
    }

    // If body is already parsed by Nest/Express body parser, reconstruct it.
    if (req.readableEnded) {
      if (req.body !== undefined && req.body !== null) {
        if (Buffer.isBuffer(req.body)) {
          proxyReq.write(req.body);
        } else if (typeof req.body === 'string') {
          proxyReq.write(req.body);
        } else {
          proxyReq.write(JSON.stringify(req.body));
        }
      }

      proxyReq.end();
      return;
    }

    req.pipe(proxyReq);
  };
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const userServiceUrl =
    configService.get<string>('USER_SERVICE_URL') ?? 'http://localhost:3002';
  const postServiceUrl =
    configService.get<string>('POST_SERVICE_URL') ?? 'http://localhost:8002';

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

  app.use('/users', createServiceProxy(userServiceUrl));
  app.use('/posts', createServiceProxy(postServiceUrl));

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
