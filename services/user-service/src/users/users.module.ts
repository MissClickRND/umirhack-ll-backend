import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import { UsersHttpController } from "./users-http.controller";
import { JwtAccessGuard } from "./guards/jwt-access.guard";
import { RolesGuard } from "./guards/roles.guard";

@Module({
  imports: [JwtModule.register({})],
  controllers: [UsersController, UsersHttpController],
  providers: [UsersService, JwtAccessGuard, RolesGuard],
})
export class UsersModule {}
