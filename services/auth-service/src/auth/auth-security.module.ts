import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { PrismaModule } from "../prisma/prisma.module";
import { JwtAccessStrategy } from "./strategies/jwt-access.strategy";
import { JwtRefreshStrategy } from "./strategies/jwt-refresh.strategy";

@Module({
  imports: [PassportModule, JwtModule.register({}), PrismaModule],
  providers: [JwtAccessStrategy, JwtRefreshStrategy],
  exports: [PassportModule, JwtModule],
})
export class AuthSecurityModule {}
