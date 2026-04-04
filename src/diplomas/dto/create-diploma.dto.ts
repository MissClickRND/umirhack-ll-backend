import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export enum DegreeLevel {
  BACHELOR = 'BACHELOR',
  MAGISTRACY = 'MAGISTRACY',
  SPECIALIST = 'SPECIALIST',
  DOCTORATE = 'DOCTORATE',
}

export class CreateDiplomaDto {
  @ApiProperty({ example: 'Ivan Ivanov' })
  @IsString()
  fullNameAuthor!: string;

  @ApiProperty({ example: '1234567890123' })
  @IsString()
  registrationNumber!: string;

  @ApiProperty({ example: 10 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  universityId!: number;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId?: number;

  @ApiProperty({ example: '2025-06-01' })
  @Type(() => Date)
  @IsDate()
  issuedAt!: Date;

  @ApiProperty({ example: 'Computer Science' })
  @IsString()
  specialty!: string;

  @ApiProperty({ enum: DegreeLevel })
  @IsEnum(DegreeLevel)
  degreeLevel!: DegreeLevel;
}
