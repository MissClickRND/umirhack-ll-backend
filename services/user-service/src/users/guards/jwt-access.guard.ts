import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import type { Request } from "express";
import { PrismaService } from "src/prisma/prisma.service";
import type { AuthUser } from "../types/auth-user.type";
import { ROLES } from "../users.types";

type JwtAccessPayload = {
  sub: number;
  email: string;
  role: (typeof ROLES)[number];
  tokenVersion: number;
};

@Injectable()
export class JwtAccessGuard implements CanActivate {
  constructor(
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  private extractToken(req: Request): string | null {
    const cookieHeader = req.headers.cookie;
    if (cookieHeader) {
      const cookies = cookieHeader.split(";");

      for (const cookie of cookies) {
        const [name, ...valueParts] = cookie.trim().split("=");
        if (name === "accessToken") {
          return decodeURIComponent(valueParts.join("="));
        }
      }
    }

    const authHeader = req.headers.authorization;
    if (!authHeader) return null;

    const [scheme, token] = authHeader.split(" ");
    if (scheme?.toLowerCase() !== "bearer" || !token) return null;

    return token;
  }

  private isPayload(payload: unknown): payload is JwtAccessPayload {
    if (!payload || typeof payload !== "object") {
      return false;
    }

    const value = payload as Record<string, unknown>;
    return (
      typeof value.sub === "number" &&
      typeof value.email === "string" &&
      typeof value.role === "string" &&
      ROLES.includes(value.role as (typeof ROLES)[number]) &&
      typeof value.tokenVersion === "number"
    );
  }

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { user?: AuthUser }>();

    const token = this.extractToken(request);
    if (!token) {
      throw new UnauthorizedException("No access token");
    }

    const secret = this.config.get<string>("JWT_ACCESS_SECRET");
    if (!secret) {
      throw new UnauthorizedException("JWT secret is not configured");
    }

    let payloadRaw: unknown;
    try {
      payloadRaw = this.jwt.verify(token, { secret });
    } catch {
      throw new UnauthorizedException("Invalid access token");
    }

    if (!this.isPayload(payloadRaw)) {
      throw new UnauthorizedException("Invalid access token payload");
    }

    const payload = payloadRaw;
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { tokenVersion: true },
    });

    if (!user || user.tokenVersion !== payload.tokenVersion) {
      throw new UnauthorizedException("Token expired");
    }

    request.user = {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    };

    return true;
  }
}
