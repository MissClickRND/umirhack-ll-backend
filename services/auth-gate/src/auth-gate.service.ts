import { Injectable, UnauthorizedException } from "@nestjs/common";
import * as jwt from "jsonwebtoken";

interface AccessPayload extends jwt.JwtPayload {
  sub: string;
  email: string;
  role: string;
  type: "access";
}

@Injectable()
export class AuthGateService {
  verifyAccessToken(token: string) {
    let payload: AccessPayload;

    try {
      payload = jwt.verify(token, this.getAccessSecret(), {
        issuer: process.env.JWT_ISSUER ?? "backnew-auth",
      }) as AccessPayload;
    } catch {
      throw new UnauthorizedException("Недействительный access-токен");
    }

    if (payload.type !== "access") {
      throw new UnauthorizedException("Тип токена не access");
    }

    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      exp: payload.exp ?? null,
    };
  }

  private getAccessSecret(): string {
    const value = process.env.JWT_ACCESS_SECRET ?? process.env.JWT_SECRET;

    if (!value) {
      throw new Error("Требуется JWT_ACCESS_SECRET или JWT_SECRET");
    }

    return value;
  }
}
