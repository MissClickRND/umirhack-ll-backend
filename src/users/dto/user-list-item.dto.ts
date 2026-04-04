import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

/** Элемент списка пользователей для GET /users (без чувствительных полей). */
export class UserListItemDto {
  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description: 'Идентификатор пользователя',
  })
  id: string;

  @ApiProperty({ example: 'user@example.com', description: 'Email' })
  email: string;

  @ApiProperty({
    enum: Role,
    example: Role.STUDENT,
    description: 'Роль в системе',
  })
  role: Role;

  @ApiProperty({
    example: '2025-01-15T10:30:00.000Z',
    description: 'Дата и время регистрации (ISO 8601)',
  })
  createdAt: Date;
}
