import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type { Role, User } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import { JwtService } from "@nestjs/jwt";
import type { JwtPayload } from "jsonwebtoken";
import { PrismaService } from "../prisma/prisma.service";
import type { LoginDto } from "./dto/login.dto";
import type { RegisterDto } from "./dto/register.dto";

type JwtPayloadWithoutSub = Omit<JwtPayload, "sub">;

interface AccessPayload extends JwtPayloadWithoutSub {
  sub: number;
  email: string;
  role: Role;
  tokenVersion: number;
  type: "access";
}

interface RefreshPayload extends JwtPayloadWithoutSub {
  sub: number;
  email: string;
  role: Role;
  tokenVersion: number;
  type: "refresh";
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  private readonly authSelect = {
    id: true,
    email: true,
    name: true,
    phone: true,
    role: true,
    passwordHash: true,
    hashedRefreshToken: true,
    tokenVersion: true,
    createdAt: true,
    updatedAt: true,
  } as const;

  async register(dto: RegisterDto) {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (existingUser) {
      throw new BadRequestException("Пользователь уже существует");
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: normalizedEmail,
        name: dto.name?.trim() || undefined,
        role: "CUSTOMER",
        passwordHash,
      },
      select: this.authSelect,
    });

    const tokens = await this.issueTokens(
      user.id,
      user.email,
      user.role,
      user.tokenVersion,
    );
    await this.setRefreshTokenHash(user.id, tokens.refreshToken);

    return {
      user: this.toPublicUser(user),
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: this.authSelect,
    });

    if (!user) {
      throw new BadRequestException("Пользователь не найден");
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new BadRequestException("Неверный пароль");
    }

    const tokens = await this.issueTokens(
      user.id,
      user.email,
      user.role,
      user.tokenVersion,
    );
    await this.setRefreshTokenHash(user.id, tokens.refreshToken);

    return {
      user: this.toPublicUser(user),
      ...tokens,
    };
  }

  async logout(userId: number) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        hashedRefreshToken: null,
        tokenVersion: { increment: 1 },
      },
    });

    return {
      ok: true,
    };
  }

  async refreshTokens(userId: number, refreshTokenFromCookie: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: this.authSelect,
    });

    if (!user || !user.hashedRefreshToken) {
      throw new ForbiddenException("Доступ запрещен");
    }

    const payload = this.verifyRefresh(refreshTokenFromCookie);

    if (payload.sub !== user.id || payload.tokenVersion !== user.tokenVersion) {
      throw new ForbiddenException("Доступ запрещен");
    }

    const matches = await bcrypt.compare(
      refreshTokenFromCookie,
      user.hashedRefreshToken,
    );

    if (!matches) {
      throw new ForbiddenException("Доступ запрещен");
    }

    const tokens = await this.issueTokens(
      user.id,
      user.email,
      user.role,
      user.tokenVersion,
    );
    await this.setRefreshTokenHash(user.id, tokens.refreshToken);

    return {
      user: this.toPublicUser(user),
      ...tokens,
    };
  }

  async status(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: this.authSelect,
    });

    if (!user) {
      throw new UnauthorizedException("Пользователь не найден");
    }

    return {
      authenticated: true,
      user: this.toPublicUser(user),
    };
  }

  private async setRefreshTokenHash(
    userId: number,
    refreshToken: string,
  ): Promise<void> {
    const hash = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { hashedRefreshToken: hash },
    });
  }

  private async issueTokens(
    userId: number,
    email: string,
    role: Role,
    tokenVersion: number,
  ) {
    const accessToken = await this.jwtService.signAsync(
      {
        sub: userId,
        email,
        role,
        tokenVersion,
        type: "access",
      },
      {
        secret: this.getAccessSecret(),
        expiresIn: this.getAccessExpires(),
        issuer: this.getIssuer(),
      },
    );

    const refreshToken = await this.jwtService.signAsync(
      {
        sub: userId,
        email,
        role,
        tokenVersion,
        type: "refresh",
      },
      {
        secret: this.getRefreshSecret(),
        expiresIn: this.getRefreshExpires(),
        issuer: this.getIssuer(),
      },
    );

    return {
      accessToken,
      refreshToken,
      tokenType: "Bearer",
      accessTokenTtl: this.getAccessExpires(),
      refreshTokenTtl: this.getRefreshExpires(),
    };
  }

  private getIssuer(): string {
    return process.env.JWT_ISSUER ?? "backnew-auth";
  }

  private getAccessSecret(): string {
    const value = process.env.JWT_ACCESS_SECRET ?? process.env.JWT_SECRET;
    if (!value) {
      throw new Error("Требуется JWT_ACCESS_SECRET или JWT_SECRET");
    }

    return value;
  }

  private getRefreshSecret(): string {
    const value = process.env.JWT_REFRESH_SECRET ?? process.env.JWT_SECRET;
    if (!value) {
      throw new Error("Требуется JWT_REFRESH_SECRET или JWT_SECRET");
    }

    return value;
  }

  private getAccessExpires(): jwt.SignOptions["expiresIn"] {
    return (process.env.JWT_ACCESS_EXPIRES ??
      process.env.ACCESS_TOKEN_TTL ??
      "15m") as jwt.SignOptions["expiresIn"];
  }

  private getRefreshExpires(): jwt.SignOptions["expiresIn"] {
    return (process.env.JWT_REFRESH_EXPIRES ??
      process.env.REFRESH_TOKEN_TTL ??
      "7d") as jwt.SignOptions["expiresIn"];
  }

  private verifyRefresh(token: string): RefreshPayload {
    try {
      const rawPayload = jwt.verify(token, this.getRefreshSecret(), {
        issuer: this.getIssuer(),
      });

      if (typeof rawPayload === "string") {
        throw new UnauthorizedException("Недействительный токен обновления");
      }

      const sub = this.parseTokenSub(rawPayload.sub);
      const tokenVersion = Number(rawPayload.tokenVersion);
      if (!Number.isInteger(tokenVersion) || tokenVersion < 0) {
        throw new UnauthorizedException("Недействительный токен обновления");
      }

      if (rawPayload.type !== "refresh") {
        throw new UnauthorizedException("Недопустимый тип токена");
      }

      const email =
        typeof rawPayload.email === "string" ? rawPayload.email : undefined;
      if (!email) {
        throw new UnauthorizedException("Недействительный токен обновления");
      }

      const role = this.parseRole(rawPayload.role);

      const payload: RefreshPayload = {
        ...rawPayload,
        sub,
        email,
        role,
        tokenVersion,
        type: "refresh",
      };

      return payload;
    } catch {
      throw new UnauthorizedException("Недействительный токен обновления");
    }
  }

  private parseRole(role: unknown): Role {
    if (
      role === "ADMIN" ||
      role === "WAITER" ||
      role === "COOK" ||
      role === "CUSTOMER"
    ) {
      return role;
    }

    throw new UnauthorizedException("Недействительный токен обновления");
  }

  private parseTokenSub(sub: unknown): number {
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

  private toPublicUser(
    user: Pick<
      User,
      "id" | "email" | "name" | "phone" | "role" | "createdAt" | "updatedAt"
    >,
  ) {
    return {
      id: user.id,
      email: user.email,
      name: user.name ?? undefined,
      phone: user.phone ?? undefined,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
