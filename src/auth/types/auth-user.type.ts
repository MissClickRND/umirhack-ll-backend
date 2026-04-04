import type { Role as PrismaRole } from '@prisma/client';

export type Role = PrismaRole;

export type AuthUser = {
  id: string;
  email: string;
  role: Role;
};

export type AuthUserWithRefresh = AuthUser & {
  refreshToken: string;
};
