import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

/** Тело user после login (без role) */
export class AuthUserBriefDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;
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
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ enum: Role, example: Role.STUDENT })
  role: Role;
}

export class AuthStatusResponseDto {
  @ApiProperty({ example: true })
  authenticated: boolean;

  @ApiProperty({ type: AuthStatusUserDto })
  user: AuthStatusUserDto;
}
