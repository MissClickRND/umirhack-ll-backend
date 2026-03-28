export type Role = 'ADMIN' | 'WAITER' | 'COOK' | 'CUSTOMER';

export type AuthUser = {
  userId: number;
  email: string;
  role: Role;
};

export type AuthUserWithRefresh = AuthUser & {
  refreshToken: string;
};
