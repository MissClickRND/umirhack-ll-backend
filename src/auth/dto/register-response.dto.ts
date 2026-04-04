import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class RegisterResponseUserDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ enum: Role, example: Role.STUDENT })
  role: Role;

  @ApiPropertyOptional({
    example: 10,
    nullable: true,
    description: 'ID университета (camelCase)',
  })
  universityId?: number | null;

  @ApiPropertyOptional({
    example: 10,
    nullable: true,
    description: 'ID университета (snake_case)',
  })
  university_id?: number | null;
}

export class RegisterResponseDto {
  @ApiProperty({ type: RegisterResponseUserDto })
  user: RegisterResponseUserDto;
}
