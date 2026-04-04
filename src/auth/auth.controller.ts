import {
  Body,
  Controller,
  Get,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { clearAuthCookies, setAuthCookies } from './auth.cookies';
import { JwtAccessGuard } from './guards/jwt-access.guard';
import type { Response } from 'express';
import { parseDurationMs } from './utils/parse-duration-ms';
import { CurrentUser } from './decorators/current-user.decorator';
import type { AuthUser, AuthUserWithRefresh } from './types/auth-user.type';
import {
  ApiBadRequestResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  AuthStatusResponseDto,
  LoginResponseDto,
  LogoutResponseDto,
} from './dto/auth-responses.dto';
import { RegisterResponseDto } from './dto/register-response.dto';
import { HttpExceptionResponseDto } from '../common/dto/http-exception-response.dto';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { Public } from './decorators/public.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  private cookieSecure() {
    return (this.config.get<string>('COOKIE_SECURE') ?? 'false') === 'true';
  }

  private cookieSameSite(): 'lax' | 'strict' | 'none' {
    const v = (
      this.config.get<string>('COOKIE_SAMESITE') ??
      this.config.get<string>('COOKIE_SAME_SITE') ??
      'lax'
    ).toLowerCase();

    if (v === 'none' || v === 'strict' || v === 'lax') return v;
    return 'lax';
  }

  private cookieDomain() {
    const value = this.config.get<string>('COOKIE_DOMAIN')?.trim();
    return value ? value : undefined;
  }

  private accessCookieName() {
    return this.config.get<string>('ACCESS_COOKIE_NAME') ?? 'accessToken';
  }

  private refreshCookieName() {
    return this.config.get<string>('REFRESH_COOKIE_NAME') ?? 'refreshToken';
  }

  private accessMaxAgeMs() {
    const v = this.config.get<string>('JWT_ACCESS_EXPIRES') ?? '15m';
    return parseDurationMs(v);
  }

  private refreshMaxAgeMs() {
    const v = this.config.get<string>('JWT_REFRESH_EXPIRES') ?? '7d';
    return parseDurationMs(v);
  }

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Регистрация (студент или вуз)' })
  @ApiCreatedResponse({
    description:
      'Успешная регистрация. JWT access и refresh выставляются в HttpOnly cookies (имена из env: ACCESS_COOKIE_NAME, REFRESH_COOKIE_NAME; по умолчанию accessToken и refreshToken). В теле ответа только профиль пользователя.',
    type: RegisterResponseDto,
    examples: {
      student: {
        summary: 'Студент',
        value: {
          user: {
            id: 1,
            email: 'student@example.com',
            role: 'STUDENT',
          },
        },
      },
      university: {
        summary: 'Вуз (ожидает верификации)',
        value: {
          user: {
            id: 2,
            email: 'rector@university.edu',
            role: 'NEED_VERIFICATION',
          },
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description:
      'Некорректный запрос: ошибки валидации RegisterDto (class-validator), email уже существует, не заполнены name/short_name для вуза, для вуза передан только email или только пароль, неверный формат email при явной передаче учётных данных вуза.',
    type: HttpExceptionResponseDto,
    examples: {
      userAlreadyExists: {
        summary: 'Пользователь с таким email уже есть',
        value: {
          statusCode: 400,
          message: 'User already exists',
          code: 'HTTP_EXCEPTION',
          details: {
            message: 'User already exists',
            error: 'Bad Request',
            statusCode: 400,
          },
        },
      },
      validationErrors: {
        summary: 'Ошибки валидации полей тела запроса',
        value: {
          statusCode: 400,
          message: [
            'email must be an email',
            'password must be longer than or equal to 4 characters',
          ],
          code: 'HTTP_EXCEPTION',
          details: {
            message: [
              'email must be an email',
              'password must be longer than or equal to 4 characters',
            ],
            error: 'Bad Request',
            statusCode: 400,
          },
        },
      },
      universityNameRequired: {
        summary: 'Для вуза не указаны name и short_name',
        value: {
          statusCode: 400,
          message: 'University name and short_name are required',
          code: 'HTTP_EXCEPTION',
          details: {
            message: 'University name and short_name are required',
            error: 'Bad Request',
            statusCode: 400,
          },
        },
      },
      universityPartialCredentials: {
        summary:
          'Регистрация вуза: нужны оба поля email и password или ни одного',
        value: {
          statusCode: 400,
          message:
            'University registration: provide both email and password (min 4 characters), or omit both',
          code: 'HTTP_EXCEPTION',
          details: {
            message:
              'University registration: provide both email and password (min 4 characters), or omit both',
            error: 'Bad Request',
            statusCode: 400,
          },
        },
      },
      invalidEmailUniversity: {
        summary: 'Некорректный email при явной передаче для вуза',
        value: {
          statusCode: 400,
          message: 'Invalid email',
          code: 'HTTP_EXCEPTION',
          details: {
            message: 'Invalid email',
            error: 'Bad Request',
            statusCode: 400,
          },
        },
      },
      forbidUnknownProperty: {
        summary: 'Лишнее поле в JSON (forbidNonWhitelisted)',
        value: {
          statusCode: 400,
          message: 'property foo should not exist',
          code: 'HTTP_EXCEPTION',
          details: {
            message: 'property foo should not exist',
            error: 'Bad Request',
            statusCode: 400,
          },
        },
      },
    },
  })
  @ApiTooManyRequestsResponse({
    description: 'Превышен лимит запросов (глобальный ThrottlerGuard)',
    type: HttpExceptionResponseDto,
    examples: {
      throttled: {
        summary: 'Слишком много запросов',
        value: {
          statusCode: 429,
          message: 'ThrottlerException: Too Many Requests',
          code: 'HTTP_EXCEPTION',
          details: {
            statusCode: 429,
            message: 'ThrottlerException: Too Many Requests',
          },
        },
      },
    },
  })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth.register(dto);

    setAuthCookies({
      res,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      secure: this.cookieSecure(),
      sameSite: this.cookieSameSite(),
      domain: this.cookieDomain(),
      accessCookieName: this.accessCookieName(),
      refreshCookieName: this.refreshCookieName(),
      accessMaxAgeMs: this.accessMaxAgeMs(),
      refreshMaxAgeMs: this.refreshMaxAgeMs(),
    });

    return { user: result.user };
  }

  @Post('login')
  @Public()
  @ApiOperation({ summary: 'Вход по email и паролю' })
  @ApiOkResponse({
    description:
      'Успешный вход. Токены в HttpOnly cookies (как при регистрации). В теле — user без поля role.',
    type: LoginResponseDto,
    examples: {
      success: {
        summary: 'Успех',
        value: {
          user: { id: 1, email: 'user@example.com' },
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Пользователь не найден или неверный пароль',
    type: HttpExceptionResponseDto,
    examples: {
      userNotFound: {
        summary: 'Пользователь не найден',
        value: {
          statusCode: 400,
          message: 'Пользователь не найден',
          code: 'HTTP_EXCEPTION',
          details: {
            message: 'Пользователь не найден',
            error: 'Bad Request',
            statusCode: 400,
          },
        },
      },
      wrongPassword: {
        summary: 'Неверный пароль',
        value: {
          statusCode: 400,
          message: 'Неверный пароль',
          code: 'HTTP_EXCEPTION',
          details: {
            message: 'Неверный пароль',
            error: 'Bad Request',
            statusCode: 400,
          },
        },
      },
    },
  })
  @ApiTooManyRequestsResponse({
    description: 'Превышен лимит запросов (глобальный ThrottlerGuard)',
    type: HttpExceptionResponseDto,
    examples: {
      throttled: {
        summary: 'Слишком много запросов',
        value: {
          statusCode: 429,
          message: 'ThrottlerException: Too Many Requests',
          code: 'HTTP_EXCEPTION',
          details: {
            statusCode: 429,
            message: 'ThrottlerException: Too Many Requests',
          },
        },
      },
    },
  })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth.login(dto);

    setAuthCookies({
      res,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      secure: this.cookieSecure(),
      sameSite: this.cookieSameSite(),
      domain: this.cookieDomain(),
      accessCookieName: this.accessCookieName(),
      refreshCookieName: this.refreshCookieName(),
      accessMaxAgeMs: this.accessMaxAgeMs(),
      refreshMaxAgeMs: this.refreshMaxAgeMs(),
    });

    return { user: result.user };
  }

  @Public()
  @ApiCookieAuth('accessToken')
  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @ApiOperation({
    summary: 'Обновление пары токенов',
    description:
      'Нужен валидный refresh-токен в cookie (имя из REFRESH_COOKIE_NAME). Возвращает user с role, новые токены в cookies.',
  })
  @ApiOkResponse({
    description: 'Новые токены в cookies; в теле user с полем role',
    type: RegisterResponseDto,
    examples: {
      success: {
        summary: 'Успех',
        value: {
          user: {
            id: 1,
            email: 'user@example.com',
            role: 'STUDENT',
          },
        },
      },
    },
  })
  @ApiForbiddenResponse({
    description: 'Нет refresh в БД или токен не совпал',
    type: HttpExceptionResponseDto,
    examples: {
      denied: {
        summary: 'Доступ запрещён',
        value: {
          statusCode: 403,
          message: 'Access Denied',
          code: 'HTTP_EXCEPTION',
          details: {
            message: 'Access Denied',
            error: 'Forbidden',
            statusCode: 403,
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Невалидный или просроченный refresh JWT (Passport)',
    type: HttpExceptionResponseDto,
    examples: {
      unauthorized: {
        summary: 'Не авторизован',
        value: {
          statusCode: 401,
          message: 'Unauthorized',
          code: 'HTTP_EXCEPTION',
          details: {
            message: 'Unauthorized',
            statusCode: 401,
          },
        },
      },
    },
  })
  async refresh(
    @CurrentUser() user: AuthUserWithRefresh,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth.refreshTokens(user.id, user.refreshToken);

    setAuthCookies({
      res,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      secure: this.cookieSecure(),
      sameSite: this.cookieSameSite(),
      domain: this.cookieDomain(),
      accessCookieName: this.accessCookieName(),
      refreshCookieName: this.refreshCookieName(),
      accessMaxAgeMs: this.accessMaxAgeMs(),
      refreshMaxAgeMs: this.refreshMaxAgeMs(),
    });

    return { user: result.user };
  }

  @ApiCookieAuth('accessToken')
  @Post('logout')
  @ApiOperation({ summary: 'Выход: сброс cookies и инвалидация refresh на сервере' })
  @ApiOkResponse({
    description: 'Cookies очищены',
    type: LogoutResponseDto,
    examples: {
      success: {
        summary: 'Успех',
        value: { ok: true },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Нет или невалидный access JWT',
    type: HttpExceptionResponseDto,
    examples: {
      unauthorized: {
        summary: 'Не авторизован',
        value: {
          statusCode: 401,
          message: 'Unauthorized',
          code: 'HTTP_EXCEPTION',
          details: {
            message: 'Unauthorized',
            statusCode: 401,
          },
        },
      },
    },
  })
  async logout(
    @CurrentUser() user: AuthUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.auth.logout(user.id);

    clearAuthCookies(res, {
      secure: this.cookieSecure(),
      sameSite: this.cookieSameSite(),
      domain: this.cookieDomain(),
      accessCookieName: this.accessCookieName(),
      refreshCookieName: this.refreshCookieName(),
    });

    return { ok: true };
  }

  @ApiCookieAuth('accessToken')
  @UseGuards(JwtAccessGuard)
  @Get('status')
  @ApiOperation({ summary: 'Проверка сессии по access cookie' })
  @ApiOkResponse({
    description: 'Пользователь аутентифицирован',
    type: AuthStatusResponseDto,
    examples: {
      authenticated: {
        summary: 'Активная сессия',
        value: {
          authenticated: true,
          user: {
            id: 1,
            email: 'user@example.com',
            role: 'STUDENT',
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Нет или невалидный access JWT',
    type: HttpExceptionResponseDto,
    examples: {
      unauthorized: {
        summary: 'Не авторизован',
        value: {
          statusCode: 401,
          message: 'Unauthorized',
          code: 'HTTP_EXCEPTION',
          details: {
            message: 'Unauthorized',
            statusCode: 401,
          },
        },
      },
    },
  })
  status(@CurrentUser() user: AuthUser) {
    return { authenticated: true, user };
  }
}
