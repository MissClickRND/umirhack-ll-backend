import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsDate,
    IsEnum,
    IsNumber,
    IsString,
    IsUUID,
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

    @ApiProperty({ example: 'REG-12345' })
    @IsString()
    registrationNumber!: string;

    @ApiProperty({ example: 'uuid-university' })
    @IsUUID()
    universityId!: string;

    @ApiProperty({ example: 1 })
    @IsNumber()
    userId!: number;

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