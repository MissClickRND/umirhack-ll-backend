import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthSecurityModule } from './auth-security.module';
import { UserClientModule } from 'src/user-client/user-client.module';

@Module({
  imports: [AuthSecurityModule, UserClientModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
