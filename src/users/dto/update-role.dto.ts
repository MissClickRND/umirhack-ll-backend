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

/** Снимок пользователя в ответе PATCH /users/role (без пароля и токенов). */
export class UserRoleSnapshotDto {
  @ApiProperty({ example: 2, description: 'Идентификатор пользователя' })
  id: number;

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
