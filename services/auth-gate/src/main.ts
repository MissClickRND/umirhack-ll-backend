import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";

function parseCorsOrigins(raw: string | undefined): string[] {
  if (!raw) {
    return ["http://localhost:5173", "http://localhost:3000"];
  }

  return raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function parseCorsCredentials(raw: string | undefined): boolean {
  return (raw ?? "true").toLowerCase() === "true";
}

function toRussianHttpError(statusCode: number): string {
  switch (statusCode) {
    case HttpStatus.BAD_REQUEST:
      return "Неверный запрос";
    case HttpStatus.UNAUTHORIZED:
      return "Не авторизован";
    case HttpStatus.FORBIDDEN:
      return "Доступ запрещен";
    case HttpStatus.NOT_FOUND:
      return "Не найдено";
    case HttpStatus.CONFLICT:
      return "Конфликт";
    case HttpStatus.UNPROCESSABLE_ENTITY:
      return "Ошибка валидации";
    default:
      return "Внутренняя ошибка сервера";
  }
}

@Catch()
class RussianHttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();

      if (statusCode === HttpStatus.UNAUTHORIZED) {
        response.status(HttpStatus.UNAUTHORIZED).json({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: "Unauthorized",
          error: "Unauthorized",
        });
        return;
      }

      const payload = exception.getResponse();

      let message: string | string[] = exception.message;
      if (typeof payload === "string") {
        message = payload;
      } else if (payload && typeof payload === "object") {
        const candidate = (payload as { message?: string | string[] }).message;
        if (candidate) {
          message = candidate;
        }
      }

      response.status(statusCode).json({
        statusCode,
        message,
        error: toRussianHttpError(statusCode),
      });
      return;
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: "Внутренняя ошибка сервера",
      error: toRussianHttpError(HttpStatus.INTERNAL_SERVER_ERROR),
    });
  }
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new RussianHttpExceptionFilter());

  const corsOrigins = parseCorsOrigins(process.env.CORS_ORIGINS);
  app.enableCors({
    origin: corsOrigins.includes("*") ? true : corsOrigins,
    credentials: parseCorsCredentials(process.env.CORS_CREDENTIALS),
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle("Auth Gate API")
    .setDescription("JWT access token validation service")
    .setVersion("1.0.0")
    .addBearerAuth(undefined, "access-token")
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("docs", app, swaggerDocument, {
    customSiteTitle: "Auth Gate Swagger",
    jsonDocumentUrl: "openapi.json",
    yamlDocumentUrl: "openapi.yaml",
  });

  const port = Number(process.env.PORT ?? 3002);
  await app.listen(port, "0.0.0.0");
}

void bootstrap();
