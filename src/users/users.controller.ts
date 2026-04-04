import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
} from '@nestjs/common';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import type { AuthUser } from 'src/auth/types/auth-user.type';
import { UsersService } from './users.service';
import {
  UpdateRoleDto,
  UpdateRoleResponseDto,
} from './dto/update-role.dto';
import {
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
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
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        email: 'admin@example.com',
        role: 'ADMIN',
        createdAt: '2025-01-10T08:00:00.000Z',
      },
      {
        id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
        email: 'student@example.com',
        role: 'STUDENT',
        createdAt: '2025-01-12T14:20:00.000Z',
      },
    ],
  })
  @Roles('ADMIN')
  @Get('users')
  getAll() {
    return this.users.getAll();
  }

  @ApiOperation({ summary: 'Получение заявок на верификацию (Админ)' })
  @ApiOkResponse({
    description:
      'Массив пользователей со ролью NEED_VERIFICATION, отсортированный по дате регистрации (сначала старые). Для каждой записи: учётные данные и привязанный вуз (если есть). Пароли и токены не возвращаются.',
    type: VerificationRequestItemDto,
    isArray: true,
    example: [
      {
        id: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
        email: 'rep@university.ru',
        role: 'NEED_VERIFICATION',
        createdAt: '2025-01-10T08:00:00.000Z',
        university: {
          id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          name: 'Московский государственный университет',
          shortName: 'МГУ',
        },
      },
      {
        id: 'd4e5f6a7-b8c9-0123-def0-234567890123',
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
        id: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
        email: 'rep@university.ru',
        role: 'NEED_VERIFICATION',
      },
      after: {
        id: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
        email: 'rep@university.ru',
        role: 'UNIVERSITY',
      },
    },
  })
  @Roles('ADMIN')
  @Patch('verify/:id')
  reviewVerificationRequest(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewVerificationDto,
  ) {
    return this.users.reviewVerificationRequest({
      userId: id,
      action:
        dto.action === VerificationAction.APPROVE ? 'approve' : 'reject',
    });
  }

  @ApiOperation({ summary: 'Обновление роли пользователя (Админ)' })
  @ApiOkResponse({
    description:
      'До и после смены роли: объекты before и after с полями id, email, role. Пароль и токены не возвращаются. После успешного ответа у пользователя инвалидируется refresh-токен.',
    type: UpdateRoleResponseDto,
    example: {
      before: {
        id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
        email: 'user@example.com',
        role: 'STUDENT',
      },
      after: {
        id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
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
      id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      userId: 'e5f6a7b8-c9d0-1234-ef01-345678901234',
      universityId: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
      status: 'ISSUED',
    },
  })
  @Roles('STUDENT')
  @Patch('users/me/diplomas/:id/attach')
  attachDiplomaToMe(@Param('id') diplomaId: string, @CurrentUser() user: AuthUser) {
    return this.users.attachDiplomaToStudent(diplomaId, user.id);
  }
}
