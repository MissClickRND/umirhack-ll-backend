import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested, ArrayMinSize } from 'class-validator';
import { CreateDiplomaDto } from './create-diploma.dto';

export class CreateDiplomaBatchDto {
    @ApiProperty({
        type: [CreateDiplomaDto],
        example: [
            {
                fullNameAuthor: 'Ivan Ivanov',
                registrationNumber: '1234567890123',
                universityId: 12,
                userId: 1,
                issuedAt: '2025-06-01',
                specialty: 'Computer Science',
                degreeLevel: 'BACHELOR',
            },
        ],
    })
    
    @ValidateNested({ each: true })
    @Type(() => CreateDiplomaDto)
    @ArrayMinSize(1)
    diplomas!: CreateDiplomaDto[];
}
