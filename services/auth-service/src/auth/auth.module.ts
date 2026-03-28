import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthSecurityModule } from './auth-security.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [AuthSecurityModule, PrismaModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
