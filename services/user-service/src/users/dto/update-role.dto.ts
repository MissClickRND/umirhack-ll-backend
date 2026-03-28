import { Type } from "class-transformer";
import { IsIn, IsInt, Min } from "class-validator";
import { ROLES } from "../users.types";

export class UpdateRoleDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId: number;

  @IsIn(ROLES)
  role: (typeof ROLES)[number];
}
