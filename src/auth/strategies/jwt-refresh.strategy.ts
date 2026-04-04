import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { AuthUserWithRefresh } from '../types/auth-user.type';
import { PrismaService } from '../../prisma/prisma.service';


function cookieExtractorRefresh(
  req: Request,
  cookieName: string,
): string | null {
  return (
    req?.cookies?.[cookieName] ??
    req?.cookies?.refreshToken ??
    req?.cookies?.refresh_token ??
    null
  );
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const refreshCookieName =
      config.get<string>('REFRESH_COOKIE_NAME') ?? 'refreshToken';

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => cookieExtractorRefresh(req, refreshCookieName),
      ]),
      secretOrKey: config.get<string>('JWT_REFRESH_SECRET')!,
      passReqToCallback: true, // чтобы в validate пришёл req
    });
  }

  async validate(
    req: Request,
    payload: { sub: number; email: string },
  ): Promise<AuthUserWithRefresh> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { role: true },
    });

    if (!user) throw new UnauthorizedException('User not found');

    const refreshCookieName =
      this.config.get<string>('REFRESH_COOKIE_NAME') ?? 'refreshToken';
    const refreshToken =
      req.cookies?.[refreshCookieName] ??
      req.cookies?.refreshToken ??
      req.cookies?.refresh_token;

    return {
      id: payload.sub,
      email: payload.email,
      refreshToken,
      role: user.role,
    };
  }
}
