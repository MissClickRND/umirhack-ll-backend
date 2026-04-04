import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsUUID } from 'class-validator';
import { Role } from '@prisma/client';

export class UpdateRoleDto {
  @ApiProperty({ example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901' })
  @IsUUID()
  userId: string;

  @ApiProperty({ example: Role.HR, enum: Role })
  @IsEnum(Role)
  role: Role;
}

/** Снимок пользователя в ответе PATCH /users/role (без пароля и токенов). */
export class UserRoleSnapshotDto {
  @ApiProperty({
    example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    description: 'Идентификатор пользователя',
  })
  id: string;

  @ApiProperty({ example: 'user@example.com', description: 'Email' })
  email: string;

  @ApiProperty({
    enum: Role,
    example: Role.HR,
    description: 'Роль до или после обновления',
  })
  role: Role;
}

/** Тело ответа PATCH /users/role после смены роли администратором. */
export class UpdateRoleResponseDto {
  @ApiProperty({
    type: UserRoleSnapshotDto,
    description: 'Состояние пользователя до смены роли',
  })
  before: UserRoleSnapshotDto;

  @ApiProperty({
    type: UserRoleSnapshotDto,
    description:
      'Состояние после смены роли. Refresh-токен сбрасывается, сессии на всех устройствах прекращаются.',
  })
  after: UserRoleSnapshotDto;
}
