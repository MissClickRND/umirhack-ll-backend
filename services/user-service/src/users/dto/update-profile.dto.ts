import { IsArray, IsEmail, IsInt, IsOptional, IsString } from "class-validator";

export class UpdateProfileDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  userAllergenIds?: number[];
}
