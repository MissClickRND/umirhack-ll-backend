import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
  USER_PATTERNS,
  UserAuthRecord,
  UserPublicRecord,
  UsersListQuery,
  UsersListResponse,
} from './contracts';
import { USER_SERVICE_CLIENT } from './user-client.constants';

@Injectable()
export class UserClientService {
  constructor(
    @Inject(USER_SERVICE_CLIENT)
    private readonly client: ClientProxy,
  ) {}

  async create(data: {
    email: string;
    passwordHash: string;
  }): Promise<UserAuthRecord> {
    return firstValueFrom(this.client.send(USER_PATTERNS.CREATE, data));
  }

  async findByEmail(email: string): Promise<UserAuthRecord | null> {
    return firstValueFrom(
      this.client.send(USER_PATTERNS.FIND_BY_EMAIL, { email }),
    );
  }

  async findAuthById(userId: number): Promise<UserAuthRecord | null> {
    return firstValueFrom(
      this.client.send(USER_PATTERNS.FIND_AUTH_BY_ID, { userId }),
    );
  }

  async setRefreshTokenHash(userId: number, hash: string): Promise<void> {
    await firstValueFrom(
      this.client.send(USER_PATTERNS.SET_REFRESH_TOKEN_HASH, {
        userId,
        hash,
      }),
    );
  }

  async logout(userId: number): Promise<void> {
    await firstValueFrom(this.client.send(USER_PATTERNS.LOGOUT, { userId }));
  }

  async findTokenVersionById(userId: number): Promise<number | null> {
    return firstValueFrom(
      this.client.send(USER_PATTERNS.FIND_TOKEN_VERSION_BY_ID, { userId }),
    );
  }

  async findProfileById(userId: number): Promise<UserPublicRecord | null> {
    return firstValueFrom(
      this.client.send(USER_PATTERNS.FIND_PROFILE_BY_ID, { userId }),
    );
  }

  async findList(query: UsersListQuery): Promise<UsersListResponse> {
    return firstValueFrom(this.client.send(USER_PATTERNS.FIND_LIST, query));
  }

  async updateRole(userId: number, role: string): Promise<UserPublicRecord> {
    return firstValueFrom(
      this.client.send(USER_PATTERNS.UPDATE_ROLE, { userId, role }),
    );
  }

  async updateProfile(data: {
    userId: number;
    email?: string;
    name?: string;
    phone?: string;
    userAllergenIds?: number[];
  }): Promise<UserPublicRecord> {
    return firstValueFrom(this.client.send(USER_PATTERNS.UPDATE_PROFILE, data));
  }
}
