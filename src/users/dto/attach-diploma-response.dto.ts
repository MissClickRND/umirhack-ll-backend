import { ApiProperty } from '@nestjs/swagger';
import { DiplomaStatus } from '@prisma/client';

/** Тело ответа PATCH /users/me/diplomas/:id/attach (без персональных данных диплома). */
export class AttachDiplomaResponseDto {
  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description: 'Идентификатор диплома (UUID)',
  })
  id: string;

  @ApiProperty({
    example: 'e5f6a7b8-c9d0-1234-ef01-345678901234',
    description: 'Идентификатор студента, к которому привязан диплом',
  })
  userId: string | null;

  @ApiProperty({
    example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    description: 'Идентификатор вуза, выпустившего диплом',
  })
  universityId: string;

  @ApiProperty({
    enum: DiplomaStatus,
    example: DiplomaStatus.ISSUED,
    description: 'Статус диплома в системе',
  })
  status: DiplomaStatus;
}
