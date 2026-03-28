import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { AuthUser, Role } from 'src/auth/types/auth-user.type';
import { UserClientService } from 'src/user-client/user-client.service';

function cookieExtractorAccess(req: Request): string | null {
  return req?.cookies?.accessToken ?? null;
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
    private readonly userClient: UserClientService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractorAccess]),
      secretOrKey: config.get<string>('JWT_ACCESS_SECRET')!,
    });
  }

  async validate(payload: JwtAccessPayload): Promise<AuthUser> {
    const tokenVersion = await this.userClient.findTokenVersionById(
      payload.sub,
    );

    if (tokenVersion === null || tokenVersion !== payload.tokenVersion) {
      throw new UnauthorizedException('Token expired');
    }

    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}
