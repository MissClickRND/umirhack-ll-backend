import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

const MAX_BATCH = 200;
const DIPLOMA_NUMBER_RE = /^\d{13}$/;

export class BulkVerifyDiplomasDto {
  @ApiPropertyOptional({
    type: String,
    example: '1234567890123',
    description:
      'Один регистрационный номер диплома. Должен содержать ровно 13 цифр.',
  })
  @IsOptional()
  @IsString()
  @Matches(DIPLOMA_NUMBER_RE, {
    message: 'diplomaNumber must contain exactly 13 digits',
  })
  diplomaNumber?: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['1234567890123', '1234567890124'],
    description:
      'Массив регистрационных номеров дипломов. Каждый номер должен содержать ровно 13 цифр.',
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_BATCH)
  @IsString({ each: true })
  @Matches(DIPLOMA_NUMBER_RE, {
    each: true,
    message: 'each value in diplomaNumbers must contain exactly 13 digits',
  })
  diplomaNumbers?: string[];
}
