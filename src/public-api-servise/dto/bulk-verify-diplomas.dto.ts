import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsString,
  MaxLength,
} from 'class-validator';

const MAX_BATCH = 200;
const MAX_NUMBER_LEN = 256;

export class BulkVerifyDiplomasDto {
  @ApiProperty({
    type: [String],
    example: ['ABC-123', 'XYZ-456'],
    description: 'Регистрационные номера дипломов для проверки',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_BATCH)
  @IsString({ each: true })
  @MaxLength(MAX_NUMBER_LEN, { each: true })
  diplomaNumbers!: string[];
}
