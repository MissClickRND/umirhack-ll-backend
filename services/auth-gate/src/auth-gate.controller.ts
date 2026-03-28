import { BadRequestException, Controller, Get, Headers } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AuthGateService } from "./auth-gate.service";

@ApiTags("auth-gate")
@Controller()
export class AuthGateController {
  constructor(private readonly authGateService: AuthGateService) {}

  @ApiBearerAuth("access-token")
  @Get("verify")
  verify(@Headers("authorization") authorization?: string) {
    if (!authorization || !authorization.startsWith("Bearer ")) {
      throw new BadRequestException(
        "Заголовок Authorization должен содержать Bearer токен",
      );
    }

    const token = authorization.slice(7);
    const user = this.authGateService.verifyAccessToken(token);

    return {
      valid: true,
      user,
    };
  }

  @Get("health")
  health() {
    return {
      service: "auth-gate",
      status: "ok",
    };
  }
}
