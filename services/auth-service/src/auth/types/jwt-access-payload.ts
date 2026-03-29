import type { Role } from "./auth-user.type";

export type JwtAccessPayload = {
  sub: number;
  email: string;
  role: Role;
  tokenVersion: number;
  type: "access";
};
