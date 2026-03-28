import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt, Min } from 'class-validator';
import type { Role } from 'src/auth/types/auth-user.type';

export class UpdateRoleDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  userId: number;

  @ApiProperty({ enum: ['ADMIN', 'WAITER', 'COOK', 'CUSTOMER'] })
  @IsIn(['ADMIN', 'WAITER', 'COOK', 'CUSTOMER'])
  role: Role;
}
