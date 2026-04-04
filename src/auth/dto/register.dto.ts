import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';

export enum RegisterAccountType {
  STUDENT = 'student',
  UNIVERSITY = 'university',
}

export class RegisterDto {
  @ApiProperty({ enum: RegisterAccountType, example: RegisterAccountType.STUDENT })
  @IsEnum(RegisterAccountType)
  accountType: RegisterAccountType;

  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SupePassword123' })
  @IsString()
  @MinLength(4)
  password: string;

  @ApiProperty({ example: 'University of Example' })
  @ValidateIf((o: RegisterDto) => o.accountType === RegisterAccountType.UNIVERSITY)
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiProperty({ example: 'UEX' })
  @ValidateIf((o: RegisterDto) => o.accountType === RegisterAccountType.UNIVERSITY)
  @IsString()
  @MinLength(2)
  short_name?: string;
}
