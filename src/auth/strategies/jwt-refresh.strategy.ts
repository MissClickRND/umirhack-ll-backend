import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { AuthUserWithRefresh } from '../types/auth-user.type';
import { PrismaService } from '../../prisma/prisma.service';


function cookieExtractorRefresh(req: Request): string | null {
  return req?.cookies?.refreshToken ?? null;
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

    const refreshToken = req.cookies?.refreshToken;

    return {
      id: payload.sub,
      email: payload.email,
      refreshToken,
      role: user.role,
    };
  }
}
