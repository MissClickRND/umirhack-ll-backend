import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class RegisterResponseUserDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ enum: Role, example: Role.STUDENT })
  role: Role;
}

export class RegisterResponseDto {
  @ApiProperty({ type: RegisterResponseUserDto })
  user: RegisterResponseUserDto;
}
