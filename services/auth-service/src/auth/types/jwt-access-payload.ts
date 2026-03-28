export type JwtAccessPayload = {
  sub: string;
  email: string;
  role: string;
  tokenVersion: number;
  type: "access";
};
