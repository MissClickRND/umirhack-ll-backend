import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { DiplomaStatus } from '@prisma/client';

export class UpdateDiplomaStatusDto {
    @ApiPropertyOptional({ enum: DiplomaStatus })
    @IsOptional()
    @IsEnum(DiplomaStatus)
    status?: DiplomaStatus;

}