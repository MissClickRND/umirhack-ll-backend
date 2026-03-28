import { IsEmail, IsString, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class LoginDto {
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
}
