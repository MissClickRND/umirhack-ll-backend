import { ApiProperty } from '@nestjs/swagger';
import { DiplomaStatus } from '@prisma/client';

/** Тело ответа PATCH /users/me/diplomas/:id/attach (без персональных данных диплома). */
export class AttachDiplomaResponseDto {
  @ApiProperty({
    example: 100,
    description: 'Идентификатор диплома',
  })
  id: number;

  @ApiProperty({
    example: 2,
    description: 'Идентификатор студента, к которому привязан диплом',
  })
  userId: number | null;

  @ApiProperty({
    example: 10,
    description: 'Идентификатор вуза, выпустившего диплом',
  })
  universityId: number;

  @ApiProperty({
    enum: DiplomaStatus,
    example: DiplomaStatus.ISSUED,
    description: 'Статус диплома в системе',
  })
  status: DiplomaStatus;
}
