import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested, ArrayMinSize } from 'class-validator';
import { CreateDiplomaDto } from './create-diploma.dto';

export class CreateDiplomaBatchDto {
    @ApiProperty({ type: [CreateDiplomaDto] })
    @ValidateNested({ each: true })
    @Type(() => CreateDiplomaDto)
    @ArrayMinSize(1)
    diplomas!: CreateDiplomaDto[];
}