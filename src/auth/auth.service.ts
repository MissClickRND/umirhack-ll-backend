import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import { randomBytes, randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterAccountType, RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import type { StringValue } from 'ms';

const SIMPLE_EMAIL_RE = /^\S+@\S+\.\S+$/;

@Injectable()
export class AuthService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  private getAccessSecret() {
    return this.config.get<string>('JWT_ACCESS_SECRET', { infer: true })!;
  }

  private getRefreshSecret() {
    return this.config.get<string>('JWT_REFRESH_SECRET', { infer: true })!;
  }

  private getAccessExpires() {
    return (this.config.get('JWT_ACCESS_EXPIRES') ?? '15m') as StringValue;
  }

  private getRefreshExpires() {
    return (this.config.get('JWT_REFRESH_EXPIRES') ?? '7d') as StringValue;
  }

  async register(dto: RegisterDto) {
    const isStudent = dto.accountType === RegisterAccountType.STUDENT;

    let email: string;
    let passwordPlain: string;

    if (isStudent) {
      email = dto.email!.toLowerCase().trim();
      passwordPlain = dto.password!;
    } else {
      const emailTrim = dto.email?.trim() ?? '';
      const pass = dto.password ?? '';
      const hasBoth = emailTrim.length > 0 && pass.length >= 4;
      const hasNeither = emailTrim.length === 0 && pass.length === 0;

      if (hasBoth) {
        if (!SIMPLE_EMAIL_RE.test(emailTrim)) {
          throw new BadRequestException('Invalid email');
        }
        email = emailTrim.toLowerCase();
        passwordPlain = pass;
      } else if (hasNeither) {
        email = `university-${randomUUID()}@internal.local`;
        passwordPlain = randomBytes(32).toString('hex');
      } else {
        throw new BadRequestException(
          'University registration: provide both email and password (min 4 characters), or omit both',
        );
      }
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    const passwordHash = await bcrypt.hash(passwordPlain, 10);

    const user =
      dto.accountType === RegisterAccountType.STUDENT
        ? await this.prisma.user.create({
            data: {
              email,
              passwordHash,
              role: Role.STUDENT,
            },
            select: {
              email: true,
              id: true,
              role: true,
              tokenVersion: true,
            },
          })
        : await this.prisma.$transaction(async (tx) => {
            if (!dto.name?.trim() || !dto.short_name?.trim()) {
              throw new BadRequestException(
                'University name and short_name are required',
              );
            }

            const university = await tx.university.create({
              data: {
                name: dto.name.trim(),
                shortName: dto.short_name.trim(),
              },
              select: {
                id: true,
              },
            });

            return tx.user.create({
              data: {
                email,
                passwordHash,
                role: Role.NEED_VERIFICATION,
                universityId: university.id,
              },
              select: {
                email: true,
                id: true,
                role: true,
                tokenVersion: true,
              },
            });
          });

    const tokens = await this.issueTokens(
      user.id,
      user.email,
      user.role,
      user.tokenVersion,
    );
    await this.setRefreshTokenHash(user.id, tokens.refreshToken);

    return {
      user: { id: user.id, email: user.email, role: user.role },
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const email = dto.email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        role: true,
        tokenVersion: true,
      },
    });

    if (!user) throw new BadRequestException('Пользователь не найден');

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new BadRequestException('Неверный пароль');

    const safeUser = { id: user.id, email: user.email };
    const tokens = await this.issueTokens(
      user.id,
      user.email,
      user.role,
      user.tokenVersion,
    );
    await this.setRefreshTokenHash(user.id, tokens.refreshToken);

    return { user: safeUser, ...tokens };
  }

  async logout(userId: number) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { hashedRefreshToken: null, tokenVersion: { increment: 1 } },
    });

    return { ok: true };
  }

  async refreshTokens(userId: number, refreshTokenFromCookie: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        hashedRefreshToken: true,
        role: true,
        tokenVersion: true,
      },
    });

    if (!user || !user.hashedRefreshToken)
      throw new ForbiddenException('Access Denied');

    const matches = await bcrypt.compare(
      refreshTokenFromCookie,
      user.hashedRefreshToken,
    );
    if (!matches) throw new ForbiddenException('Access Denied');

    const tokens = await this.issueTokens(
      user.id,
      user.email,
      user.role,
      user.tokenVersion,
    );

    await this.setRefreshTokenHash(user.id, tokens.refreshToken);

    return {
      user: { id: user.id, email: user.email, role: user.role },
      ...tokens,
    };
  }

  private async setRefreshTokenHash(userId: number, refreshToken: string) {
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
    const payload = { sub: userId, email, role, tokenVersion };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: this.getAccessSecret(),
        expiresIn: this.getAccessExpires(),
      }),
      this.jwt.signAsync(
        { sub: userId, email },
        {
          secret: this.getRefreshSecret(),
          expiresIn: this.getRefreshExpires(),
        },
      ),
    ]);
    return { accessToken, refreshToken };
  }
}
