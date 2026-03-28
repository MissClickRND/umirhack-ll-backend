export type Role = 'ADMIN' | 'WAITER' | 'COOK' | 'CUSTOMER';

export type UserAuthRecord = {
  id: number;
  email: string;
  passwordHash: string;
  hashedRefreshToken: string | null;
  role: Role;
  tokenVersion: number;
};

export type UserPublicRecord = {
  id: number;
  email: string;
  role: Role;
  name: string | null;
  phone: string | null;
  createdAt: Date;
  updatedAt: Date;
  userAllergens: Array<{ id: number; name: string }>;
};

export type UsersListQuery = {
  search?: string;
  sort?: string;
  page?: number;
  limit?: number;
};

export type UsersListResponse = {
  data: UserPublicRecord[];
  meta: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

export const USER_PATTERNS = {
  FIND_BY_EMAIL: 'users.findByEmail',
  CREATE: 'users.create',
  SET_REFRESH_TOKEN_HASH: 'users.setRefreshTokenHash',
  LOGOUT: 'users.logout',
  FIND_AUTH_BY_ID: 'users.findAuthById',
  FIND_TOKEN_VERSION_BY_ID: 'users.findTokenVersionById',
  FIND_PROFILE_BY_ID: 'users.findProfileById',
  FIND_LIST: 'users.findList',
  UPDATE_ROLE: 'users.updateRole',
  UPDATE_PROFILE: 'users.updateProfile',
} as const;
