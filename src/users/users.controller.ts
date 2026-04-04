import { Body, Controller, Get, Param, ParseIntPipe, Patch } from '@nestjs/common';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import type { AuthUser } from 'src/auth/types/auth-user.type';
import { UsersService } from './users.service';
import { UpdateRoleDto } from './dto/update-role.dto';
import { ApiOperation } from '@nestjs/swagger';
import {
  ReviewVerificationDto,
  VerificationAction,
} from './dto/review-verification.dto';

@Controller()
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @ApiOperation({ summary: ' Получение всех пользователей (Админ)' })
  @Roles('ADMIN')
  @Get('users')
  getAll() {
    return this.users.getAll();
  }

  @ApiOperation({ summary: 'Получение заявок на верификацию (Админ)' })
  @Roles('ADMIN')
  @Get('verify')
  getVerificationRequests() {
    return this.users.getVerificationRequests();
  }

  @ApiOperation({ summary: 'Одобрение/отклонение заявки (Админ)' })
  @Roles('ADMIN')
  @Patch('verify/:id')
  reviewVerificationRequest(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReviewVerificationDto,
  ) {
    return this.users.reviewVerificationRequest({
      userId: id,
      action:
        dto.action === VerificationAction.APPROVE ? 'approve' : 'reject',
    });
  }

  @ApiOperation({ summary: 'Обновление роли пользователя (Админ)' })
  @Roles('ADMIN')
  @Patch('users/role')
  updateRole(@Body() dto: UpdateRoleDto) {
    return this.users.updateRole({ userId: dto.userId, role: dto.role });
  }

  @ApiOperation({ summary: 'Студент прикрепляет диплом к себе' })
  @Roles('STUDENT')
  @Patch('users/me/diplomas/:id/attach')
  attachDiplomaToMe(@Param('id') diplomaId: string, @CurrentUser() user: AuthUser) {
    return this.users.attachDiplomaToStudent(diplomaId, user.id);
  }
}
