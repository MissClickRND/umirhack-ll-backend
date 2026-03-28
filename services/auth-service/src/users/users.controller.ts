import { Body, Controller, Get, Patch, Query } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import type { AuthUser } from 'src/auth/types/auth-user.type';
import { UserClientService } from 'src/user-client/user-client.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { UsersListQueryDto } from './dto/users-list-query.dto';

@ApiTags('users')
@ApiCookieAuth('accessToken')
@Controller('users')
export class UsersController {
  constructor(private readonly userClient: UserClientService) {}

  @Get('profile')
  async getProfile(@CurrentUser() user: AuthUser) {
    return this.userClient.findProfileById(user.userId);
  }

  @Patch('profile')
  async updateProfile(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.userClient.updateProfile({
      userId: user.userId,
      ...dto,
    });
  }

  @Roles('ADMIN')
  @Get()
  async getUsers(@Query() query: UsersListQueryDto) {
    return this.userClient.findList(query);
  }

  @Patch('role')
  async updateRole(@Body() dto: UpdateRoleDto) {
    return this.userClient.updateRole(dto.userId, dto.role);
  }
}
