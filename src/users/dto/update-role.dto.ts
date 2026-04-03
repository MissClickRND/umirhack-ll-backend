import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt } from 'class-validator';
import { Role } from '@prisma/client';

export class UpdateRoleDto {
  @ApiProperty({ example: 2 })
  @IsInt()
  userId: number;

  @ApiProperty({ example: Role.HR, enum: Role })
  @IsEnum(Role)
  role: Role;
}
