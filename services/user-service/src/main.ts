import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";

function normalizeOrigin(value: string): string {
  return value
    .replace(/[\u200B-\u200D\uFEFF\u2060]/g, "")
    .trim()
    .replace(/\/$/, "");
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const tcpPort = Number(configService.get<string>("TCP_PORT") ?? "4001");
  const httpPort = Number(
    configService.get<string>("USER_SERVICE_PORT") ??
      configService.get<string>("PORT") ??
      "3002",
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle("User Service API")
    .setDescription("Users domain service API")
    .setVersion("1.0")
    .addBearerAuth()
    .addCookieAuth("accessToken")
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("docs", app, swaggerDocument);

  const originsRaw =
    configService.get<string>("CORS_ORIGIN") ??
    "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000";
  const allowedOrigins = new Set(
    originsRaw
      .split(",")
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

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: "0.0.0.0",
      port: tcpPort,
    },
  });

  await app.startAllMicroservices();
  await app.listen(httpPort, "0.0.0.0");
}

bootstrap();
