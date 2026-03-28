import { IsOptional, IsString, MinLength } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class UpdatePostDto {
  @ApiPropertyOptional({
    description: "Post title",
    example: "Updated title",
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @ApiPropertyOptional({
    description: "Post content",
    example: "Updated content",
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  content?: string;
}
