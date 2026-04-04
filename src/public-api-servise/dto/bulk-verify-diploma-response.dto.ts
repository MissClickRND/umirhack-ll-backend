import { ApiProperty } from '@nestjs/swagger';
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

  @ApiProperty({ enum: DiplomaStatus, example: DiplomaStatus.VALID })
  status!: DiplomaStatus;
}
