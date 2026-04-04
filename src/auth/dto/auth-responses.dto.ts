import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';

/** Тело user после login */
export class AuthUserBriefDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ enum: Role, example: Role.STUDENT })
  role: Role;

  @ApiPropertyOptional({
    example: 10,
    nullable: true,
    description: 'ID университета',
  })
  university_id?: number | null;
}

export class LoginResponseDto {
  @ApiProperty({ type: AuthUserBriefDto })
  user: AuthUserBriefDto;
}

export class LogoutResponseDto {
  @ApiProperty({ example: true })
  ok: boolean;
}

export class AuthStatusUserDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ enum: Role, example: Role.STUDENT })
  role: Role;

  @ApiPropertyOptional({
    example: 10,
    nullable: true,
    description: 'ID университета',
  })
  university_id?: number | null;
}

export class AuthStatusResponseDto {
  @ApiProperty({ example: true })
  authenticated: boolean;

  @ApiProperty({ type: AuthStatusUserDto })
  user: AuthStatusUserDto;
}
