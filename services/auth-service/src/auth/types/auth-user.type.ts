export const ROLE_VALUES = ["ADMIN", "WAITER", "COOK", "CUSTOMER"] as const;

export type Role = (typeof ROLE_VALUES)[number];

export type AuthUser = {
  userId: number;
  email: string;
  role: Role;
};

export type AuthUserWithRefresh = AuthUser & {
  refreshToken: string;
};
