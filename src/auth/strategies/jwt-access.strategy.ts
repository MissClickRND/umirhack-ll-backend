import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthUser, Role } from '../types/auth-user.type';


function cookieExtractorAccess(
  req: Request,
  cookieName: string,
): string | null {
  return (
    req?.cookies?.[cookieName] ??
    req?.cookies?.accessToken ??
    req?.cookies?.access_token ??
    null
  );
}

type JwtAccessPayload = {
  sub: number;
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
    const accessCookieName =
      config.get<string>('ACCESS_COOKIE_NAME') ?? 'accessToken';

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => cookieExtractorAccess(req, accessCookieName),
      ]),
      secretOrKey: config.get<string>('JWT_ACCESS_SECRET')!,
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
