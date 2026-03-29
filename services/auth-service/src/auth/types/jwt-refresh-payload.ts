import type { Role } from "./auth-user.type";

export type JwtRefreshPayload = {
  sub: number;
  email: string;
  role: Role;
  tokenVersion: number;
  type: "refresh";
};
