import { ApiProperty } from '@nestjs/swagger';

/** Элемент списка вузов для GET /users/universities (без ключей и секретов). */
export class UniversityListItemDto {
  @ApiProperty({
    example: 10,
    description: 'Идентификатор вуза',
  })
  id: number;

  @ApiProperty({
    example: 'Московский государственный университет',
    description: 'Полное название вуза',
  })
  name: string;

  @ApiProperty({
    example: 'МГУ',
    nullable: true,
    description: 'Краткое название',
  })
  shortName: string | null;

  @ApiProperty({
    example: '2025-01-15T10:30:00.000Z',
    description: 'Дата и время создания записи (ISO 8601)',
  })
  createdAt: Date;
}
