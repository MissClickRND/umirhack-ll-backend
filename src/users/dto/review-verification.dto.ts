import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { IsEnum } from 'class-validator';

export enum VerificationAction {
  APPROVE = 'approve',
  REJECT = 'reject',
}

export class ReviewVerificationDto {
  @ApiProperty({ enum: VerificationAction, example: VerificationAction.APPROVE })
  @IsEnum(VerificationAction)
  action: VerificationAction;
}

/** Снимок пользователя в ответе PATCH /verify/:id (без пароля и токенов). */
export class VerificationUserSnapshotDto {
  @ApiProperty({
    example: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
    description: 'Идентификатор пользователя',
  })
  id: string;

  @ApiProperty({ example: 'rep@university.ru', description: 'Email' })
  email: string;

  @ApiProperty({
    enum: Role,
    example: Role.NEED_VERIFICATION,
    description: 'Роль до/после обработки заявки',
  })
  role: Role;
}

/** Тело ответа PATCH /verify/:id после одобрения или отклонения заявки. */
export class ReviewVerificationResponseDto {
  @ApiProperty({
    type: VerificationUserSnapshotDto,
    description:
      'Состояние пользователя до операции (ожидалась роль NEED_VERIFICATION).',
  })
  before: VerificationUserSnapshotDto;

  @ApiProperty({
    type: VerificationUserSnapshotDto,
    description:
      'Состояние после операции: при approve — UNIVERSITY; при reject — NEED_VERIFICATION. Если роль не менялась, совпадает с before.',
  })
  after: VerificationUserSnapshotDto;
}
