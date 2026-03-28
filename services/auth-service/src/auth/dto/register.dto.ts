import { IsEmail, IsOptional, IsString, MinLength } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class RegisterDto {
  @ApiProperty({
    description: "Электронная почта пользователя",
    example: "user@test.dev",
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: "Пароль пользователя",
    minLength: 8,
    example: "password123",
  })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiPropertyOptional({
    description: "Публичное имя",
    example: "User",
  })
  @IsOptional()
  @IsString()
  name?: string;
}
