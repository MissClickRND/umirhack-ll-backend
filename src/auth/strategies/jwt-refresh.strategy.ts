import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import type { AuthUserWithRefresh } from 'src/auth/types/auth-user.type';
import { PrismaService } from 'src/prisma/prisma.service';

function cookieExtractorRefresh(req: Request): string | null {
  const refreshCookieName = process.env.REFRESH_COOKIE_NAME ?? 'refreshToken';
  return req?.cookies?.[refreshCookieName] ?? null;
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
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractorRefresh]),
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

    const refreshCookieName = process.env.REFRESH_COOKIE_NAME ?? 'refreshToken';
    const refreshToken = req.cookies?.[refreshCookieName];

    return {
      id: payload.sub,
      email: payload.email,
      refreshToken,
      role: user.role,
    };
  }
}
