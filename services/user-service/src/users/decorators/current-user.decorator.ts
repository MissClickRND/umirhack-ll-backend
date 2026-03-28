import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import type { AuthUser } from "../types/auth-user.type";

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const request = ctx.switchToHttp().getRequest<{ user?: AuthUser }>();

    if (!request.user) {
      throw new UnauthorizedException("No user in request");
    }

    return request.user;
  },
);
