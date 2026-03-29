import { Injectable, UnauthorizedException } from "@nestjs/common";
import * as jwt from "jsonwebtoken";

const ROLE_VALUES = ["ADMIN", "WAITER", "COOK", "CUSTOMER"] as const;
type Role = (typeof ROLE_VALUES)[number];

interface AccessPayload extends Omit<jwt.JwtPayload, "sub"> {
  sub: unknown;
  email: string;
  role: Role;
  type: "access";
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

  throw new UnauthorizedException("Unauthorized");
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

    if (!ROLE_VALUES.includes(payload.role)) {
      throw new UnauthorizedException("Unauthorized");
    }

    const userId = parseTokenSub(payload.sub);

    return {
      id: userId,
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
