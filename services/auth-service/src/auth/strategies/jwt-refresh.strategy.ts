import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import type { Request } from "express";
import type { AuthUserWithRefresh } from "../types/auth-user.type";
import type { JwtRefreshPayload } from "../types/jwt-refresh-payload";

function cookieExtractorRefresh(req: Request): string | null {
  const cookieName = process.env.REFRESH_COOKIE_NAME?.trim() || "refresh_token";
  return req?.cookies?.[cookieName] ?? null;
}

function parseTokenSub(sub: unknown): number {
  if (typeof sub === "number" && Number.isInteger(sub) && sub > 0) {
    return sub;
  }

  if (typeof sub === "string") {
    const parsed = Number(sub);
    if (Number.isInteger(parsed) && parsed > 0) {
      return parsed;
    }
  }

  throw new UnauthorizedException("Недействительный токен обновления");
}

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

    const userId = parseTokenSub(payload.sub);

    return {
      userId,
      email: payload.email,
      role: payload.role,
      refreshToken,
    };
  }
}
