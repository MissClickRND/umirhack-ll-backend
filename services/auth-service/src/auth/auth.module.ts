import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthSecurityModule } from "./auth-security.module";
import { AuthService } from "./auth.service";

@Module({
  imports: [AuthSecurityModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
