import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({ example: 'user@example.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: 'Иван', required: false })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @ApiProperty({ example: '+79991234567', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @ApiProperty({ example: [1, 2], type: [Number], required: false })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  userAllergenIds?: number[];
}
