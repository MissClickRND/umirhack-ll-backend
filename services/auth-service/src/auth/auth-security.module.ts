import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtAccessStrategy } from './strategies/jwt-access.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PassportModule, JwtModule.register({}), PrismaModule],
  providers: [JwtAccessStrategy, JwtRefreshStrategy],
  exports: [PassportModule, JwtModule],
})
export class AuthSecurityModule {}
