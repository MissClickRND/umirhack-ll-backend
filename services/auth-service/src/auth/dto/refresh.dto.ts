import { IsOptional, IsString, MinLength } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class RefreshDto {
  @ApiPropertyOptional({
    description: "Токен обновления, необязателен при авторизации через cookie",
    minLength: 16,
  })
  @IsOptional()
  @IsString()
  @MinLength(16)
  refreshToken?: string;
}
