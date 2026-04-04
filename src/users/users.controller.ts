import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import type { AuthUser } from 'src/auth/types/auth-user.type';
import { UsersService } from './users.service';
import { UpdateRoleDto, UpdateRoleResponseDto } from './dto/update-role.dto';
import {
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { UserListItemDto } from './dto/user-list-item.dto';
import { VerificationRequestItemDto } from './dto/verification-request-item.dto';
import { ACCESS_COOKIE_NAME } from 'src/auth/access-cookie-name';
import {
  ReviewVerificationDto,
  ReviewVerificationResponseDto,
  VerificationAction,
} from './dto/review-verification.dto';
import { AttachDiplomaResponseDto } from './dto/attach-diploma-response.dto';
import { UniversityListItemDto } from './dto/university-list-item.dto';

@ApiTags('users')
@ApiCookieAuth(ACCESS_COOKIE_NAME)
@Controller()
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @ApiOperation({ summary: 'Получение всех пользователей (Админ)' })
  
  @ApiOkResponse({
    description:
      'Массив пользователей: id, email, role, createdAt. Пароль и токены не возвращаются.',
    type: UserListItemDto,
    isArray: true,
    example: [
      {
        id: 1,
        email: 'admin@example.com',
        role: 'ADMIN',
        createdAt: '2025-01-10T08:00:00.000Z',
      },
      {
        id: 2,
        email: 'student@example.com',
        role: 'STUDENT',
        createdAt: '2025-01-12T14:20:00.000Z',
      },
    ],
  })
  @Roles('ADMIN')
  @Get('users')
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  getAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.users.getAll(
      page ? Number(page) : undefined,
      limit ? Number(limit) : undefined,
    );
  }

  @ApiOperation({ summary: 'Получение всех вузов (Админ)' })
  @ApiOkResponse({
    description:
      'Массив вузов: id, name, shortName, createdAt. Ключи шифрования не возвращаются.',
    type: UniversityListItemDto,
    isArray: true,
    example: [
      {
        id: 1,
        name: 'Московский государственный университет',
        shortName: 'МГУ',
        createdAt: '2025-01-10T08:00:00.000Z',
      },
      {
        id: 2,
        name: 'Санкт-Петербургский политехнический университет',
        shortName: 'СПбПУ',
        createdAt: '2025-01-12T14:20:00.000Z',
      },
    ],
  })
  @Roles('ADMIN')
  @Get('users/universities')
  getAllUniversities() {
    return this.users.getAllUniversities();
  }

  @ApiOperation({ summary: 'Получение заявок на верификацию (Админ)' })
  @ApiOkResponse({
    description:
      'Массив пользователей со ролью NEED_VERIFICATION, отсортированный по дате регистрации (сначала старые). Для каждой записи: учётные данные и привязанный вуз (если есть). Пароли и токены не возвращаются.',
    type: VerificationRequestItemDto,
    isArray: true,
    example: [
      {
        id: 3,
        email: 'rep@university.ru',
        role: 'NEED_VERIFICATION',
        createdAt: '2025-01-10T08:00:00.000Z',
        university: {
          id: 10,
          name: 'Московский государственный университет',
          shortName: 'МГУ',
        },
      },
      {
        id: 4,
        email: 'newuser@example.com',
        role: 'NEED_VERIFICATION',
        createdAt: '2025-01-12T14:20:00.000Z',
        university: {
          id: null,
          name: 'Санкт-Петербургский политехнический университет',
          shortName: 'СПбПУ',
        },
      },
    ],
  })
  @Roles('ADMIN')
  @Get('verify')
  getVerificationRequests() {
    return this.users.getVerificationRequests();
  }

  @ApiOperation({ summary: 'Одобрение/отклонение заявки (Админ)' })
  @ApiOkResponse({
    description:
      'Результат проверки заявки: объекты before и after с полями id, email, role. Пароли и токены не возвращаются. При успешном approve создаётся запись вуза (если её ещё не было), генерируются ключи, роль меняется на UNIVERSITY, сбрасывается refresh-токен. При дубликате полного названия вуза — 409 Conflict. При reject очищаются временные поля названия заявки.',
    type: ReviewVerificationResponseDto,
    example: {
      before: {
        id: 3,
        email: 'rep@university.ru',
        role: 'NEED_VERIFICATION',
      },
      after: {
        id: 3,
        email: 'rep@university.ru',
        role: 'UNIVERSITY',
      },
    },
  })
  @Roles('ADMIN')
  @Patch('verify/:id')
  reviewVerificationRequest(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReviewVerificationDto,
  ) {
    return this.users.reviewVerificationRequest({
      userId: id,
      action: dto.action === VerificationAction.APPROVE ? 'approve' : 'reject',
    });
  }

  @ApiOperation({ summary: 'Обновление роли пользователя (Админ)' })
  @ApiOkResponse({
    description:
      'До и после смены роли: объекты before и after с полями id, email, role. Пароль и токены не возвращаются. После успешного ответа у пользователя инвалидируется refresh-токен.',
    type: UpdateRoleResponseDto,
    example: {
      before: {
        id: 2,
        email: 'user@example.com',
        role: 'STUDENT',
      },
      after: {
        id: 2,
        email: 'user@example.com',
        role: 'HR',
      },
    },
  })
  @Roles('ADMIN')
  @Patch('users/role')
  updateRole(@Body() dto: UpdateRoleDto) {
    return this.users.updateRole({ userId: dto.userId, role: dto.role });
  }

  @ApiOperation({ summary: 'Студент прикрепляет диплом к себе' })
  @ApiOkResponse({
    description:
      'Обновлённая запись диплома после привязки: id, userId (текущий студент), universityId, status. Персональные поля (ФИО, регистрационный номер и т.д.) не возвращаются.',
    type: AttachDiplomaResponseDto,
    example: {
      id: 100,
      userId: 2,
      universityId: 10,
      status: 'VALID',
    },
  })
  @Roles('STUDENT')
  @Patch('users/me/diplomas/:id/attach')
  attachDiplomaToMe(
    @Param('id', ParseIntPipe) diplomaId: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.users.attachDiplomaToStudent(diplomaId, user.id);
  }
}
