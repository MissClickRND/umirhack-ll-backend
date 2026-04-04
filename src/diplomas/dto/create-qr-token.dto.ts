import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDate, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateQrTokenDto {
    @ApiPropertyOptional({ example: true })
    @IsOptional()
    @IsBoolean()
    isOneTime?: boolean;
    
    @ApiPropertyOptional({ example: '2026-01-01' })
    @IsOptional()
    @Type(() => Date)
    @IsDate()
    expiresAt?: Date;
}