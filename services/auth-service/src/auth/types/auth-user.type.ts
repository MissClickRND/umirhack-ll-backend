export type Role = string;

export type AuthUser = {
  userId: string;
  email: string;
  role: Role;
};

export type AuthUserWithRefresh = AuthUser & {
  refreshToken: string;
};
