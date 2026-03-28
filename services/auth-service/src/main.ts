import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  ValidationPipe,
} from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import cookieParser from "cookie-parser";
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

function enrichAuthSwaggerDocument(document: Record<string, any>): void {
  document.components ??= {};
  document.components.schemas ??= {};

  document.components.schemas.UserPublic = {
    type: "object",
    properties: {
      id: { type: "string", example: "clx0000000000abc123" },
      email: { type: "string", format: "email", example: "user@test.dev" },
      name: { type: "string", example: "User" },
      role: { type: "string", example: "user" },
      createdAt: { type: "string", format: "date-time" },
    },
  };

  document.components.schemas.AuthUserResponse = {
    type: "object",
    properties: {
      user: { $ref: "#/components/schemas/UserPublic" },
    },
  };

  document.components.schemas.AuthStatusResponse = {
    type: "object",
    properties: {
      authenticated: { type: "boolean", example: true },
      user: { $ref: "#/components/schemas/UserPublic" },
    },
  };

  document.components.schemas.OkResponse = {
    type: "object",
    properties: {
      ok: { type: "boolean", example: true },
    },
  };

  document.components.schemas.HealthResponse = {
    type: "object",
    properties: {
      service: { type: "string", example: "auth-service" },
      status: { type: "string", example: "ok" },
    },
  };

  document.components.schemas.ErrorResponse = {
    type: "object",
    properties: {
      message: {
        oneOf: [
          { type: "string" },
          {
            type: "array",
            items: { type: "string" },
          },
        ],
        example: "Пользователь не найден",
      },
      error: { type: "string", example: "Неверный запрос" },
      statusCode: { type: "integer", example: 400 },
    },
  };

  const withJson = (schemaRef: string, description: string) => ({
    description,
    content: {
      "application/json": {
        schema: { $ref: schemaRef },
      },
    },
  });

  const setResponses = (
    path: string,
    method: string,
    responses: Record<string, any>,
  ) => {
    const operation = document.paths?.[path]?.[method];
    if (!operation) {
      return;
    }

    operation.responses = {
      ...(operation.responses ?? {}),
      ...responses,
    };
  };

  setResponses("/auth/register", "post", {
    "201": withJson(
      "#/components/schemas/AuthUserResponse",
      "Пользователь зарегистрирован",
    ),
    "400": withJson(
      "#/components/schemas/ErrorResponse",
      "Ошибка валидации или бизнес-логики",
    ),
  });

  setResponses("/auth/login", "post", {
    "201": withJson(
      "#/components/schemas/AuthUserResponse",
      "Пользователь вошел в систему",
    ),
    "400": withJson(
      "#/components/schemas/ErrorResponse",
      "Неверные учетные данные или ошибка валидации",
    ),
  });

  setResponses("/auth/refresh", "post", {
    "201": withJson(
      "#/components/schemas/AuthUserResponse",
      "Токены обновлены",
    ),
    "401": withJson(
      "#/components/schemas/ErrorResponse",
      "Недействительный токен обновления",
    ),
    "403": withJson("#/components/schemas/ErrorResponse", "Доступ запрещен"),
  });

  setResponses("/auth/status", "get", {
    "200": withJson(
      "#/components/schemas/AuthStatusResponse",
      "Текущий статус авторизации",
    ),
    "401": withJson("#/components/schemas/ErrorResponse", "Не авторизован"),
  });

  setResponses("/auth/logout", "post", {
    "201": withJson("#/components/schemas/OkResponse", "Выход выполнен"),
    "401": withJson("#/components/schemas/ErrorResponse", "Не авторизован"),
  });

  setResponses("/auth/health", "get", {
    "200": withJson("#/components/schemas/HealthResponse", "Состояние сервиса"),
  });
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new RussianHttpExceptionFilter());
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const corsOrigins = parseCorsOrigins(process.env.CORS_ORIGINS);
  app.enableCors({
    origin: corsOrigins.includes("*") ? true : corsOrigins,
    credentials: parseCorsCredentials(process.env.CORS_CREDENTIALS),
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle("API сервиса авторизации")
    .setDescription(
      "Сервис авторизации (регистрация, вход, обновление токенов, статус, выход)",
    )
    .setVersion("1.0.0")
    .addCookieAuth("access_token", undefined, "access-cookie")
    .addCookieAuth("refresh_token", undefined, "refresh-cookie")
    .addBearerAuth(undefined, "access-token")
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  enrichAuthSwaggerDocument(swaggerDocument as Record<string, any>);
  SwaggerModule.setup("docs", app, swaggerDocument, {
    customSiteTitle: "Swagger сервиса авторизации",
    jsonDocumentUrl: "openapi.json",
    yamlDocumentUrl: "openapi.yaml",
  });

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port, "0.0.0.0");
}

void bootstrap();
