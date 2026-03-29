import { Body, Controller, Get, Post, Res, UseGuards } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import type { Response } from "express";
import { clearAuthCookies, setAuthCookies } from "./auth.cookies";
import { CurrentUser } from "./decorators/current-user.decorator";
import { Public } from "./decorators/public.decorator";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { JwtRefreshGuard } from "./guards/jwt-refresh.guard";
import type { AuthUser, AuthUserWithRefresh } from "./types/auth-user.type";
import { parseDurationMs } from "./utils/parse-duration-ms";
import { AuthService } from "./auth.service";

const swaggerUserSchema = {
  type: "object",
  properties: {
    id: { type: "integer", example: 1 },
    email: { type: "string", format: "email", example: "user@test.dev" },
    name: { type: "string", nullable: true, example: "User" },
    phone: { type: "string", nullable: true, example: "+79991234567" },
    role: {
      type: "string",
      enum: ["ADMIN", "WAITER", "COOK", "CUSTOMER"],
      example: "CUSTOMER",
    },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
};

const swaggerAuthUserResponseSchema = swaggerUserSchema;

const swaggerStatusResponseSchema = {
  type: "object",
  properties: {
    authenticated: { type: "boolean", example: true },
    user: swaggerUserSchema,
  },
};

const swaggerOkResponseSchema = {
  type: "object",
  properties: {
    ok: { type: "boolean", example: true },
  },
};

const swaggerHealthResponseSchema = {
  type: "object",
  properties: {
    service: { type: "string", example: "auth-service" },
    status: { type: "string", example: "ok" },
  },
};

const swaggerErrorResponseSchema: Record<string, unknown> = {
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
    statusCode: { type: "number", example: 400 },
  },
};

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("register")
  @ApiCreatedResponse({
    description: "Пользователь зарегистрирован",
    schema: swaggerAuthUserResponseSchema,
  })
  @ApiBadRequestResponse({
    description: "Ошибка валидации или бизнес-логики",
    schema: swaggerErrorResponseSchema,
  })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(dto);
    setAuthCookies({
      res,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      secure: this.cookieSecure(),
      sameSite: this.cookieSameSite(),
      cookieDomain: this.cookieDomain(),
      accessMaxAgeMs: this.accessMaxAgeMs(),
      refreshMaxAgeMs: this.refreshMaxAgeMs(),
      accessCookieName: this.getAccessCookieName(),
      refreshCookieName: this.getRefreshCookieName(),
    });

    return result.user;
  }

  @Public()
  @Post("login")
  @ApiCreatedResponse({
    description: "Пользователь вошел в систему",
    schema: swaggerAuthUserResponseSchema,
  })
  @ApiBadRequestResponse({
    description: "Неверные учетные данные или ошибка валидации",
    schema: swaggerErrorResponseSchema,
  })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto);
    setAuthCookies({
      res,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      secure: this.cookieSecure(),
      sameSite: this.cookieSameSite(),
      cookieDomain: this.cookieDomain(),
      accessMaxAgeMs: this.accessMaxAgeMs(),
      refreshMaxAgeMs: this.refreshMaxAgeMs(),
      accessCookieName: this.getAccessCookieName(),
      refreshCookieName: this.getRefreshCookieName(),
    });

    return result.user;
  }

  @Public()
  @ApiCookieAuth("refresh-cookie")
  @UseGuards(JwtRefreshGuard)
  @Post("refresh")
  @ApiCreatedResponse({
    description: "Токены обновлены",
    schema: swaggerAuthUserResponseSchema,
  })
  @ApiUnauthorizedResponse({
    description: "Недействительный токен обновления",
    schema: swaggerErrorResponseSchema,
  })
  @ApiForbiddenResponse({
    description: "Доступ запрещен",
    schema: swaggerErrorResponseSchema,
  })
  async refresh(
    @CurrentUser() user: AuthUserWithRefresh,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.refreshTokens(
      user.userId,
      user.refreshToken,
    );
    setAuthCookies({
      res,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      secure: this.cookieSecure(),
      sameSite: this.cookieSameSite(),
      cookieDomain: this.cookieDomain(),
      accessMaxAgeMs: this.accessMaxAgeMs(),
      refreshMaxAgeMs: this.refreshMaxAgeMs(),
      accessCookieName: this.getAccessCookieName(),
      refreshCookieName: this.getRefreshCookieName(),
    });

    return result.user;
  }

  @ApiCookieAuth("access-cookie")
  @ApiBearerAuth("access-token")
  @Get("status")
  @ApiOkResponse({
    description: "Текущий статус авторизации",
    schema: swaggerStatusResponseSchema,
  })
  @ApiUnauthorizedResponse({
    description: "Не авторизован",
    schema: swaggerErrorResponseSchema,
  })
  async status(@CurrentUser() user: AuthUser) {
    return this.authService.status(user.userId);
  }

  @ApiCookieAuth("access-cookie")
  @ApiBearerAuth("access-token")
  @Post("logout")
  @ApiCreatedResponse({
    description: "Выход выполнен",
    schema: swaggerOkResponseSchema,
  })
  @ApiUnauthorizedResponse({
    description: "Не авторизован",
    schema: swaggerErrorResponseSchema,
  })
  async logout(
    @CurrentUser() user: AuthUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(user.userId);

    clearAuthCookies({
      res,
      secure: this.cookieSecure(),
      sameSite: this.cookieSameSite(),
      cookieDomain: this.cookieDomain(),
      accessCookieName: this.getAccessCookieName(),
      refreshCookieName: this.getRefreshCookieName(),
    });

    return {
      ok: true,
    };
  }

  @Public()
  @Get("health")
  @ApiOkResponse({
    description: "Состояние сервиса",
    schema: swaggerHealthResponseSchema,
  })
  health() {
    return {
      service: "auth-service",
      status: "ok",
    };
  }

  private parseSameSite(
    rawValue: string | undefined,
  ): "lax" | "strict" | "none" {
    const normalized = (rawValue ?? "lax").toLowerCase();
    if (normalized === "strict" || normalized === "none") {
      return normalized;
    }

    return "lax";
  }

  private cookieSecure(): boolean {
    const rawValue = process.env.COOKIE_SECURE;
    if (rawValue !== undefined) {
      return rawValue.toLowerCase() === "true";
    }

    return (process.env.NODE_ENV ?? "").toLowerCase() === "production";
  }

  private cookieSameSite(): "lax" | "strict" | "none" {
    const rawValue =
      process.env.COOKIE_SAME_SITE ?? process.env.COOKIE_SAMESITE;
    if (rawValue) {
      return this.parseSameSite(rawValue);
    }

    return this.cookieSecure() ? "none" : "lax";
  }

  private cookieDomain(): string | undefined {
    const value = process.env.COOKIE_DOMAIN?.trim();
    return value ? value : undefined;
  }

  private accessMaxAgeMs(): number {
    const raw = process.env.JWT_ACCESS_EXPIRES ?? process.env.ACCESS_TOKEN_TTL;
    return parseDurationMs(raw ?? "15m");
  }

  private refreshMaxAgeMs(): number {
    const raw =
      process.env.JWT_REFRESH_EXPIRES ?? process.env.REFRESH_TOKEN_TTL;
    return parseDurationMs(raw ?? "7d");
  }

  private getAccessCookieName(): string {
    return process.env.ACCESS_COOKIE_NAME?.trim() || "access_token";
  }

  private getRefreshCookieName(): string {
    return process.env.REFRESH_COOKIE_NAME?.trim() || "refresh_token";
  }
}
