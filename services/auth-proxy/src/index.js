const express = require("express");
const axios = require("axios");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const morgan = require("morgan");
const swaggerUi = require("swagger-ui-express");
const { createProxyMiddleware } = require("http-proxy-middleware");

const port = Number(process.env.PORT || 3000);
const authServiceUrl = "http://auth-service:3001";
const authGateUrl = "http://auth-gate:3002";
const postsServiceUrl = "http://posts-service:3003";
const notesServiceUrl = "http://notes-service:3004";
const accessCookieName = process.env.ACCESS_COOKIE_NAME || "access_token";
const refreshCookieName = process.env.REFRESH_COOKIE_NAME || "refresh_token";

function parseCorsOrigins(raw) {
  if (!raw) {
    return ["http://localhost:5173", "http://localhost:3000"];
  }

  return raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function parseCorsCredentials(raw) {
  return (raw || "true").toLowerCase() === "true";
}

const corsOrigins = parseCorsOrigins(process.env.CORS_ORIGINS);

const gatewayOpenApi = {
  openapi: "3.0.3",
  info: {
    title: "API шлюза auth-proxy",
    version: "1.0.0",
    description:
      "Единая точка входа API. Auth и защищенные CRUD-маршруты проксируются через порт 3000.",
  },
  servers: [{ url: "/" }],
  tags: [
    {
      name: "gateway",
      description: "Служебные эндпоинты шлюза",
    },
    {
      name: "auth-service",
      description: "Эндпоинты авторизации (проксируются в auth-service)",
    },
    {
      name: "posts-service",
      description: "Операции с постами (проксируются в сервис posts-service)",
    },
    {
      name: "notes-service",
      description: "Операции с заметками (проксируются в сервис notes-service)",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      RegisterRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "user@test.dev" },
          password: { type: "string", minLength: 8, example: "password123" },
          name: { type: "string", example: "User" },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "user@test.dev" },
          password: { type: "string", minLength: 8, example: "password123" },
        },
      },
      RefreshRequest: {
        type: "object",
        properties: {
          refreshToken: {
            type: "string",
            minLength: 16,
            description: "Необязателен при авторизации через cookie",
          },
        },
      },
      CreatePostRequest: {
        type: "object",
        required: ["title", "content"],
        properties: {
          title: { type: "string", example: "My first post" },
          content: { type: "string", example: "Post text" },
        },
      },
      UpdatePostRequest: {
        type: "object",
        properties: {
          title: { type: "string", example: "Updated title" },
          content: { type: "string", example: "Updated content" },
        },
      },
      CreateNoteRequest: {
        type: "object",
        required: ["title", "body"],
        properties: {
          title: { type: "string", example: "My note" },
          body: { type: "string", example: "Note text" },
        },
      },
      UpdateNoteRequest: {
        type: "object",
        properties: {
          title: { type: "string", example: "Updated note title" },
          body: { type: "string", example: "Updated note text" },
        },
      },
      UserPublic: {
        type: "object",
        properties: {
          id: { type: "string", example: "clx0000000000abc123" },
          email: { type: "string", format: "email", example: "user@test.dev" },
          name: { type: "string", example: "User" },
          role: { type: "string", example: "user" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      AuthUserResponse: {
        type: "object",
        properties: {
          user: { $ref: "#/components/schemas/UserPublic" },
        },
      },
      AuthStatusResponse: {
        type: "object",
        properties: {
          authenticated: { type: "boolean", example: true },
          user: { $ref: "#/components/schemas/UserPublic" },
        },
      },
      OkResponse: {
        type: "object",
        properties: {
          ok: { type: "boolean", example: true },
        },
      },
      HealthResponse: {
        type: "object",
        properties: {
          service: { type: "string", example: "auth-proxy" },
          status: { type: "string", example: "ok" },
        },
      },
      PostItem: {
        type: "object",
        additionalProperties: true,
      },
      NoteItem: {
        type: "object",
        additionalProperties: true,
      },
      PostListResponse: {
        type: "array",
        items: { $ref: "#/components/schemas/PostItem" },
      },
      NoteListResponse: {
        type: "array",
        items: { $ref: "#/components/schemas/NoteItem" },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          message: {
            oneOf: [
              { type: "string" },
              { type: "array", items: { type: "string" } },
            ],
          },
          error: { type: "string", example: "Неверный запрос" },
          statusCode: { type: "integer", example: 400 },
        },
      },
    },
  },
  paths: {
    "/health": {
      get: {
        tags: ["gateway"],
        summary: "Проверка состояния шлюза",
        responses: {
          200: {
            description: "Шлюз работает",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/HealthResponse" },
              },
            },
          },
        },
      },
    },
    "/auth/register": {
      post: {
        tags: ["auth-service"],
        summary: "Регистрация пользователя",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RegisterRequest" },
            },
          },
        },
        responses: {
          201: {
            description: "Пользователь зарегистрирован",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthUserResponse" },
              },
            },
          },
          400: {
            description: "Ошибка валидации или бизнес-логики",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["auth-service"],
        summary: "Вход пользователя",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" },
            },
          },
        },
        responses: {
          201: {
            description: "Пользователь вошел в систему",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthUserResponse" },
              },
            },
          },
          400: {
            description: "Неверные учетные данные или ошибка валидации",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/auth/refresh": {
      post: {
        tags: ["auth-service"],
        summary: "Обновление пары токенов",
        responses: {
          201: {
            description: "Токены обновлены",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthUserResponse" },
              },
            },
          },
          401: {
            description: "Недействительный токен обновления",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          403: {
            description: "Доступ запрещен",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/auth/status": {
      get: {
        tags: ["auth-service"],
        summary: "Проверка текущего статуса авторизации",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Текущий статус авторизации",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthStatusResponse" },
              },
            },
          },
          401: {
            description: "Не авторизован",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/auth/logout": {
      post: {
        tags: ["auth-service"],
        summary: "Выход по токену обновления",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: false,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RefreshRequest" },
            },
          },
        },
        responses: {
          201: {
            description: "Выход выполнен",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/OkResponse" },
              },
            },
          },
          401: {
            description: "Не авторизован",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/posts": {
      get: {
        tags: ["posts-service"],
        summary: "Список постов текущего пользователя",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Список постов",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PostListResponse" },
              },
            },
          },
          401: {
            description: "Не авторизован",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
      post: {
        tags: ["posts-service"],
        summary: "Создать пост",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreatePostRequest" },
            },
          },
        },
        responses: {
          201: {
            description: "Пост создан",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PostItem" },
              },
            },
          },
          400: {
            description: "Ошибка валидации",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          401: {
            description: "Не авторизован",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/posts/{id}": {
      get: {
        tags: ["posts-service"],
        summary: "Получить пост по идентификатору",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer", format: "int32" },
          },
        ],
        responses: {
          200: {
            description: "Пост найден",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PostItem" },
              },
            },
          },
          401: {
            description: "Не авторизован",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          404: {
            description: "Пост не найден",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
      patch: {
        tags: ["posts-service"],
        summary: "Обновить пост по идентификатору",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer", format: "int32" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdatePostRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Пост обновлен",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PostItem" },
              },
            },
          },
          400: {
            description: "Ошибка валидации",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          401: {
            description: "Не авторизован",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          404: {
            description: "Пост не найден",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
      delete: {
        tags: ["posts-service"],
        summary: "Удалить пост по идентификатору",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer", format: "int32" },
          },
        ],
        responses: {
          200: {
            description: "Пост удален",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/OkResponse" },
              },
            },
          },
          401: {
            description: "Не авторизован",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          404: {
            description: "Пост не найден",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/notes": {
      get: {
        tags: ["notes-service"],
        summary: "Список заметок текущего пользователя",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Список заметок",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/NoteListResponse" },
              },
            },
          },
          401: {
            description: "Не авторизован",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
      post: {
        tags: ["notes-service"],
        summary: "Создать заметку",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateNoteRequest" },
            },
          },
        },
        responses: {
          201: {
            description: "Заметка создана",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/NoteItem" },
              },
            },
          },
          400: {
            description: "Ошибка валидации",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          401: {
            description: "Не авторизован",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/notes/{id}": {
      get: {
        tags: ["notes-service"],
        summary: "Получить заметку по идентификатору",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer", format: "int32" },
          },
        ],
        responses: {
          200: {
            description: "Заметка найдена",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/NoteItem" },
              },
            },
          },
          401: {
            description: "Не авторизован",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          404: {
            description: "Заметка не найдена",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
      patch: {
        tags: ["notes-service"],
        summary: "Обновить заметку по идентификатору",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer", format: "int32" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateNoteRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Заметка обновлена",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/NoteItem" },
              },
            },
          },
          400: {
            description: "Ошибка валидации",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          401: {
            description: "Не авторизован",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          404: {
            description: "Заметка не найдена",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
      delete: {
        tags: ["notes-service"],
        summary: "Удалить заметку по идентификатору",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer", format: "int32" },
          },
        ],
        responses: {
          200: {
            description: "Заметка удалена",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/OkResponse" },
              },
            },
          },
          401: {
            description: "Не авторизован",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          404: {
            description: "Заметка не найдена",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
  },
};

const app = express();
app.disable("x-powered-by");
app.use(cookieParser());
app.use(
  cors({
    origin: corsOrigins.includes("*") ? true : corsOrigins,
    credentials: parseCorsCredentials(process.env.CORS_CREDENTIALS),
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  }),
);
app.use(morgan("dev"));

const publicAuthPaths = new Set([
  "/register",
  "/login",
  "/refresh",
  "/logout",
  "/health",
]);

function joinPath(basePath, remainderPath) {
  if (!remainderPath || remainderPath === "/") {
    return basePath;
  }

  return `${basePath}${remainderPath}`;
}
function buildProxyErrorHandler(serviceName) {
  return (error, req, res) => {
    const message = `Не удалось подключиться к ${serviceName}`;
    if (!res.headersSent) {
      res.status(502).json({ message, details: error.message });
    }
  };
}

function unauthorizedPayload() {
  return {
    statusCode: 401,
    message: "Unauthorized",
    error: "Unauthorized",
  };
}

async function verifyAccess(req, res, next) {
  const headerAuthorization = req.headers.authorization;
  const tokenFromHeader =
    typeof headerAuthorization === "string" &&
    headerAuthorization.startsWith("Bearer ")
      ? headerAuthorization.slice(7)
      : null;
  const tokenFromCookie = req.cookies?.[accessCookieName] || null;
  const accessToken = tokenFromHeader || tokenFromCookie;

  if (!accessToken) {
    res.status(401).json(unauthorizedPayload());
    return;
  }

  const authorization = `Bearer ${accessToken}`;
  req.headers.authorization = authorization;

  try {
    const response = await axios.get(`${authGateUrl}/verify`, {
      headers: { authorization },
      timeout: 3000,
    });

    const user = response.data?.user;
    if (!user?.id) {
      res.status(401).json(unauthorizedPayload());
      return;
    }

    req.headers["x-user-id"] = String(user.id);
    req.headers["x-user-email"] = String(user.email || "");
    req.headers["x-user-role"] = String(user.role || "CUSTOMER");
    next();
  } catch (error) {
    const statusCode = error.response?.status || 401;
    if (statusCode === 401) {
      res.status(401).json(unauthorizedPayload());
      return;
    }

    const message = error.response?.data?.message || "Request failed";
    const responseError = error.response?.data?.error || "Request failed";
    res.status(statusCode).json({
      statusCode,
      message,
      error: responseError,
    });
  }
}

function protectAuthRoutes(req, res, next) {
  if (publicAuthPaths.has(req.path)) {
    next();
    return;
  }

  void verifyAccess(req, res, next);
}

app.get("/health", (req, res) => {
  res.json({
    service: "auth-proxy",
    status: "ok",
  });
});

function buildGatewayOpenApi() {
  return {
    ...gatewayOpenApi,
    servers: [{ url: "/" }],
  };
}

app.get("/openapi.json", (req, res) => {
  res.json(buildGatewayOpenApi());
});

app.get("/docs/openapi.json", (req, res) => {
  res.json(buildGatewayOpenApi());
});

app.get("/docs/services", (req, res) => {
  res.json({
    gateway: {
      swagger: "/docs",
      openapi: "/docs/openapi.json",
    },
    authService: {
      openapi: "/docs/auth-service/openapi.json",
    },
    authGate: {
      openapi: "/docs/auth-gate/openapi.json",
    },
    postsService: {
      openapi: "/docs/posts-service/openapi.json",
    },
    notesService: {
      openapi: "/docs/notes-service/openapi.json",
    },
  });
});

app.use(
  "/docs/auth-service/openapi.json",
  createProxyMiddleware({
    target: authServiceUrl,
    changeOrigin: true,
    pathRewrite: () => "/openapi.json",
    onError: buildProxyErrorHandler("auth-service"),
  }),
);

app.use(
  "/docs/auth-gate/openapi.json",
  createProxyMiddleware({
    target: authGateUrl,
    changeOrigin: true,
    pathRewrite: () => "/openapi.json",
    onError: buildProxyErrorHandler("auth-gate"),
  }),
);

app.use(
  "/docs/posts-service/openapi.json",
  createProxyMiddleware({
    target: postsServiceUrl,
    changeOrigin: true,
    pathRewrite: () => "/openapi.json",
    onError: buildProxyErrorHandler("posts-service"),
  }),
);

app.use(
  "/docs/notes-service/openapi.json",
  createProxyMiddleware({
    target: notesServiceUrl,
    changeOrigin: true,
    pathRewrite: () => "/openapi.json",
    onError: buildProxyErrorHandler("notes-service"),
  }),
);

app.use(
  "/docs",
  swaggerUi.serve,
  swaggerUi.setup(null, {
    customSiteTitle: "API шлюза auth-proxy",
    swaggerOptions: {
      url: "/docs/openapi.json",
    },
  }),
);

app.use(
  "/auth",
  protectAuthRoutes,
  createProxyMiddleware({
    target: authServiceUrl,
    changeOrigin: true,
    pathRewrite: (path) => `/auth${path}`,
    onError: buildProxyErrorHandler("auth-service"),
  }),
);

app.use(
  "/register",
  createProxyMiddleware({
    target: authServiceUrl,
    changeOrigin: true,
    pathRewrite: () => "/auth/register",
    onError: buildProxyErrorHandler("auth-service"),
  }),
);

app.use(
  "/login",
  createProxyMiddleware({
    target: authServiceUrl,
    changeOrigin: true,
    pathRewrite: () => "/auth/login",
    onError: buildProxyErrorHandler("auth-service"),
  }),
);

app.use(
  "/refresh",
  createProxyMiddleware({
    target: authServiceUrl,
    changeOrigin: true,
    pathRewrite: () => "/auth/refresh",
    onError: buildProxyErrorHandler("auth-service"),
  }),
);

app.use(
  "/status",
  verifyAccess,
  createProxyMiddleware({
    target: authServiceUrl,
    changeOrigin: true,
    pathRewrite: () => "/auth/status",
    onError: buildProxyErrorHandler("auth-service"),
  }),
);

app.use(
  "/logout",
  createProxyMiddleware({
    target: authServiceUrl,
    changeOrigin: true,
    pathRewrite: () => "/auth/logout",
    onError: buildProxyErrorHandler("auth-service"),
  }),
);

app.use(
  "/api/posts",
  verifyAccess,
  createProxyMiddleware({
    target: postsServiceUrl,
    changeOrigin: true,
    pathRewrite: (path) => joinPath("/posts", path),
    onError: buildProxyErrorHandler("posts-service"),
  }),
);

app.use(
  "/api/notes",
  verifyAccess,
  createProxyMiddleware({
    target: notesServiceUrl,
    changeOrigin: true,
    pathRewrite: (path) => joinPath("/notes", path),
    onError: buildProxyErrorHandler("notes-service"),
  }),
);

app.get("/auth/cookies", (req, res) => {
  res.json({
    hasAccessCookie: Boolean(req.cookies?.[accessCookieName]),
    hasRefreshCookie: Boolean(req.cookies?.[refreshCookieName]),
  });
});

app.use((req, res) => {
  res.status(404).json({
    message: "Маршрут не найден",
    path: req.path,
  });
});

app.listen(port, "0.0.0.0", () => {
  // eslint-disable-next-line no-console
  console.log(`auth-proxy запущен на порту ${port}`);
});
