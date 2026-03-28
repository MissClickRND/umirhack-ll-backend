import type { Role } from "../users.types";

export type AuthUser = {
  userId: number;
  email: string;
  role: Role;
};
