import { Module } from "@nestjs/common";
import { AuthGateController } from "./auth-gate.controller";
import { AuthGateService } from "./auth-gate.service";

@Module({
  controllers: [AuthGateController],
  providers: [AuthGateService],
})
export class AppModule {}
