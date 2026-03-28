export const ROLES = ["ADMIN", "WAITER", "COOK", "CUSTOMER"] as const;

export type Role = (typeof ROLES)[number];

export type UsersListQuery = {
  search?: string;
  sort?: string;
  page?: number;
  limit?: number;
};

export type UpdateProfilePayload = {
  userId: number;
  email?: string;
  name?: string;
  phone?: string;
  userAllergenIds?: number[];
};

export type UpdateRolePayload = {
  userId: number;
  role: Role;
};
