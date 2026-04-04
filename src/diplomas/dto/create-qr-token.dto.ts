import { ApiProperty } from "@nestjs/swagger";
import { IsEnum } from "class-validator";

export enum QrTokenType {
    ONETIME = 'ONETIME',
    DAYS_7 = 'DAYS_7',
    DAYS_30 = 'DAYS_30',
    INFINITE = 'INFINITE',
}

export class CreateQrTokenDto {
    @ApiProperty({ enum: QrTokenType })
    @IsEnum(QrTokenType)
    type!: QrTokenType;
}