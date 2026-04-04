import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthUser, Role } from '../types/auth-user.type';

type JwtAccessPayload = {
  sub: string;
  email: string;
  role: Role;
  tokenVersion: number;
};

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(
  Strategy,
  'jwt-access',
) {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const secret = config.get<string>('JWT_ACCESS_SECRET')!;
    const accessCookieName =
      config.get<string>('ACCESS_COOKIE_NAME')?.trim() || 'accessToken';

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          const c = req?.cookies;
          return (c?.[accessCookieName] as string | undefined) ?? null;
        },
      ]),
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtAccessPayload): Promise<AuthUser> {
    const user = await this.prisma.user.findUnique({
      where: {
        id: payload.sub,
      },
      select: {
        tokenVersion: true,
      },
    });

    if (!user || user.tokenVersion !== payload.tokenVersion) {
      throw new UnauthorizedException('Token expired');
    }

    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}
