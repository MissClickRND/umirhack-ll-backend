import {
  Body,
  Controller,
  Get,
  Patch,
  Query,
  UseGuards,
} from "@nestjs/common";
import { UsersService } from "./users.service";
import { CurrentUser } from "./decorators/current-user.decorator";
import type { AuthUser } from "./types/auth-user.type";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { UpdateRoleDto } from "./dto/update-role.dto";
import { UsersListQueryDto } from "./dto/users-list-query.dto";
import { JwtAccessGuard } from "./guards/jwt-access.guard";
import { RolesGuard } from "./guards/roles.guard";
import { Role } from "./decorators/role.decorator";

@Controller("users")
@UseGuards(JwtAccessGuard, RolesGuard)
export class UsersHttpController {
  constructor(private readonly usersService: UsersService) {}

  @Get("profile")
  async getProfile(@CurrentUser() user: AuthUser) {
    return this.usersService.findProfileById(user.userId);
  }

  @Patch("profile")
  async updateProfile(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile({
      userId: user.userId,
      ...dto,
    });
  }

  @Get()
  @Role("ADMIN")
  async getUsers(@Query() query: UsersListQueryDto) {
    return this.usersService.findList(query);
  }

  @Patch("role")
  @Role("ADMIN")
  async updateRole(@Body() dto: UpdateRoleDto) {
    return this.usersService.updateRole(dto);
  }
}
