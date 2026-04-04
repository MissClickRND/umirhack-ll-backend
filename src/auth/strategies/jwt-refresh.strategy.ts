import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { AuthUserWithRefresh } from '../types/auth-user.type';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  private readonly refreshCookieName: string;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const refreshCookieName =
      config.get<string>('REFRESH_COOKIE_NAME')?.trim() || 'refreshToken';

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) =>
          (req?.cookies?.[refreshCookieName] as string | undefined) ?? null,
      ]),
      secretOrKey: config.get<string>('JWT_REFRESH_SECRET')!,
      passReqToCallback: true,
    });

    this.refreshCookieName = refreshCookieName;
  }

  async validate(
    req: Request,
    payload: { sub: string; email: string },
  ): Promise<AuthUserWithRefresh> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { role: true },
    });

    if (!user) throw new UnauthorizedException('User not found');

    const refreshToken = req.cookies?.[this.refreshCookieName];
    if (typeof refreshToken !== 'string') {
      throw new UnauthorizedException('No refresh cookie');
    }

    return {
      id: payload.sub,
      email: payload.email,
      refreshToken,
      role: user.role,
    };
  }
}
