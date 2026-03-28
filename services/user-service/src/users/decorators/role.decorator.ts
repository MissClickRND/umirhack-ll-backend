import { SetMetadata } from "@nestjs/common";
import type { Role as UserRole } from "../users.types";

export const ROLES_KEY = "roles";

export const Role = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);