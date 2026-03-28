import { Controller } from "@nestjs/common";
import { MessagePattern, Payload } from "@nestjs/microservices";
import { UsersService } from "./users.service";
import type {
  UpdateProfilePayload,
  UpdateRolePayload,
  UsersListQuery,
} from "./users.types";

const USER_PATTERNS = {
  FIND_BY_EMAIL: "users.findByEmail",
  CREATE: "users.create",
  SET_REFRESH_TOKEN_HASH: "users.setRefreshTokenHash",
  LOGOUT: "users.logout",
  FIND_AUTH_BY_ID: "users.findAuthById",
  FIND_TOKEN_VERSION_BY_ID: "users.findTokenVersionById",
  FIND_PROFILE_BY_ID: "users.findProfileById",
  FIND_LIST: "users.findList",
  UPDATE_ROLE: "users.updateRole",
  UPDATE_PROFILE: "users.updateProfile",
} as const;

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @MessagePattern(USER_PATTERNS.FIND_BY_EMAIL)
  findByEmail(@Payload() payload: { email: string }) {
    return this.usersService.findByEmail(payload.email);
  }

  @MessagePattern(USER_PATTERNS.CREATE)
  create(@Payload() payload: { email: string; passwordHash: string }) {
    return this.usersService.create(payload);
  }

  @MessagePattern(USER_PATTERNS.SET_REFRESH_TOKEN_HASH)
  setRefreshTokenHash(@Payload() payload: { userId: number; hash: string }) {
    return this.usersService.setRefreshTokenHash(payload.userId, payload.hash);
  }

  @MessagePattern(USER_PATTERNS.LOGOUT)
  logout(@Payload() payload: { userId: number }) {
    return this.usersService.logout(payload.userId);
  }

  @MessagePattern(USER_PATTERNS.FIND_AUTH_BY_ID)
  findAuthById(@Payload() payload: { userId: number }) {
    return this.usersService.findAuthById(payload.userId);
  }

  @MessagePattern(USER_PATTERNS.FIND_TOKEN_VERSION_BY_ID)
  findTokenVersionById(@Payload() payload: { userId: number }) {
    return this.usersService.findTokenVersionById(payload.userId);
  }

  @MessagePattern(USER_PATTERNS.FIND_PROFILE_BY_ID)
  findProfileById(@Payload() payload: { userId: number }) {
    return this.usersService.findProfileById(payload.userId);
  }

  @MessagePattern(USER_PATTERNS.FIND_LIST)
  findList(@Payload() payload: UsersListQuery) {
    return this.usersService.findList(payload);
  }

  @MessagePattern(USER_PATTERNS.UPDATE_ROLE)
  updateRole(@Payload() payload: UpdateRolePayload) {
    return this.usersService.updateRole(payload);
  }

  @MessagePattern(USER_PATTERNS.UPDATE_PROFILE)
  updateProfile(@Payload() payload: UpdateProfilePayload) {
    return this.usersService.updateProfile(payload);
  }
}
