import { Body, Controller, Get, Patch } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UsersService } from './users.service';
import type { AuthUser } from '../auth/types/auth-user.type';
import { UpdateRoleDto } from './dto/update-role.dto';
import { ApiOperation } from '@nestjs/swagger';

@Controller('users')
export class UsersController {
    constructor(private readonly users: UsersService) {}

    @ApiOperation({ summary: ' Получение всех пользователей (Админ)' })
    @Roles('ADMIN')
    @Get()
    getAll() {
        return this.users.getAll();
    }

    @ApiOperation({ summary: 'Обновление роли пользователя (Админ)' })
    @Roles('ADMIN')
    @Patch('role')
    updateRole(@Body() dto: UpdateRoleDto) {
        return this.users.updateRole({ userId: dto.userId, role: dto.role });
    }
}
