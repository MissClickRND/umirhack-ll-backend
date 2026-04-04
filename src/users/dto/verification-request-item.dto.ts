import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

/** Краткие данные вуза в заявке на верификацию. */
export class VerificationUniversitySnippetDto {
  @ApiProperty({
    example: 10,
    nullable: true,
    description:
      'Идентификатор вуза после создания записи; null, пока заявка только в черновике (pending)',
  })
  id: number | null;

  @ApiProperty({
    example: 'Московский государственный университет',
    description: 'Полное название вуза',
  })
  name: string;

  @ApiProperty({
    example: 'МГУ',
    nullable: true,
    description: 'Краткое название; может отсутствовать',
  })
  shortName: string | null;
}

/** Элемент списка заявок GET /verify (пользователи со статусом NEED_VERIFICATION). */
export class VerificationRequestItemDto {
  @ApiProperty({
    example: 3,
    description: 'Идентификатор пользователя',
  })
  id: number;

  @ApiProperty({ example: 'applicant@example.com', description: 'Email' })
  email: string;

  @ApiProperty({
    enum: Role,
    example: Role.NEED_VERIFICATION,
    description: 'Роль на момент запроса — ожидает решения администратора',
  })
  role: Role;

  @ApiProperty({
    example: '2025-01-15T10:30:00.000Z',
    description: 'Дата и время регистрации (ISO 8601)',
  })
  createdAt: Date;

  @ApiProperty({
    type: VerificationUniversitySnippetDto,
    nullable: true,
    description:
      'Вуз, выбранный при регистрации; null, если пользователь ещё не привязан к вузу',
  })
  university: VerificationUniversitySnippetDto | null;
}
