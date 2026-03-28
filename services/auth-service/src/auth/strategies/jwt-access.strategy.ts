import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import type { Request } from "express";
import { PrismaService } from "../../prisma/prisma.service";
import type { AuthUser } from "../types/auth-user.type";

function cookieExtractorAccess(req: Request): string | null {
  const cookieName = process.env.ACCESS_COOKIE_NAME?.trim() || "access_token";
  return req?.cookies?.[cookieName] ?? null;
}

function bearerExtractorAccess(req: Request): string | null {
  const authHeader = req?.headers?.authorization;
  if (!authHeader) {
    return null;
  }

  const [scheme, token] = authHeader.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token;
}

type JwtAccessPayload = {
  sub: string;
  email: string;
  role: string;
  tokenVersion: number;
  type: "access";
};

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(
  Strategy,
  "jwt-access",
) {
  constructor(private readonly prisma: PrismaService) {
    const accessSecret =
      process.env.JWT_ACCESS_SECRET ?? process.env.JWT_SECRET;
    if (!accessSecret) {
      throw new Error("Требуется JWT_ACCESS_SECRET или JWT_SECRET");
    }

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        cookieExtractorAccess,
        bearerExtractorAccess,
      ]),
      secretOrKey: accessSecret,
      ignoreExpiration: false,
    });
  }

  async validate(payload: JwtAccessPayload): Promise<AuthUser> {
    if (payload.type !== "access") {
      throw new UnauthorizedException("Тип токена не access");
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { tokenVersion: true },
    });

    if (!user || user.tokenVersion !== payload.tokenVersion) {
      throw new UnauthorizedException("Токен недействителен или истек");
    }

    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
