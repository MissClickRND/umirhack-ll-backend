import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import type { Request } from "express";
import type { AuthUserWithRefresh } from "../types/auth-user.type";

function cookieExtractorRefresh(req: Request): string | null {
  const cookieName = process.env.REFRESH_COOKIE_NAME?.trim() || "refresh_token";
  return req?.cookies?.[cookieName] ?? null;
}

type JwtRefreshPayload = {
  sub: string;
  email: string;
  role: string;
  tokenVersion: number;
  type: "refresh";
};

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  "jwt-refresh",
) {
  constructor() {
    const refreshSecret =
      process.env.JWT_REFRESH_SECRET ?? process.env.JWT_SECRET;
    if (!refreshSecret) {
      throw new Error("Требуется JWT_REFRESH_SECRET или JWT_SECRET");
    }

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractorRefresh]),
      secretOrKey: refreshSecret,
      passReqToCallback: true,
      ignoreExpiration: false,
    });
  }

  async validate(
    req: Request,
    payload: JwtRefreshPayload,
  ): Promise<AuthUserWithRefresh> {
    if (payload.type !== "refresh") {
      throw new UnauthorizedException("Тип токена не refresh");
    }

    const refreshCookieName =
      process.env.REFRESH_COOKIE_NAME?.trim() || "refresh_token";
    const refreshToken = req.cookies?.[refreshCookieName];

    if (!refreshToken) {
      throw new UnauthorizedException("Токен обновления отсутствует");
    }

    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      refreshToken,
    };
  }
}
