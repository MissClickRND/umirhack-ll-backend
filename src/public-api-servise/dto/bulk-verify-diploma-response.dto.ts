import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DiplomaStatus } from '@prisma/client';

export class BulkVerifyDiplomaSuccessDto {
  @ApiProperty({ example: true })
  valid!: true;

  @ApiProperty({ example: 'VALID' })
  status!: 'VALID';

  @ApiProperty({ example: 'Иванов Иван Иванович' })
  fullName!: string;

  @ApiProperty({ example: 'МГУ' })
  university!: string;

  @ApiProperty({ example: 'Бакалавр' })
  qualification!: string;

  @ApiProperty({ example: '2025-06-30' })
  issuedAt!: string;
}

export class BulkVerifyDiplomaShortDto {
  @ApiProperty({ example: 'ABC-123' })
  diplomaNumber!: string;

  @ApiProperty({ example: false })
  valid!: false;

  @ApiPropertyOptional({ enum: DiplomaStatus, example: DiplomaStatus.REVOKED })
  status?: DiplomaStatus;

  @ApiPropertyOptional({
    enum: ['NOT_FOUND', 'INVALID_OR_REVOKED'],
    example: 'NOT_FOUND',
  })
  reason?: 'NOT_FOUND' | 'INVALID_OR_REVOKED';
}
