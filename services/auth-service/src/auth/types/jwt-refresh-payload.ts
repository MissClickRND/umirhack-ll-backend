export type JwtRefreshPayload = {
  sub: string;
  email: string;
  role: string;
  tokenVersion: number;
  type: "refresh";
};
