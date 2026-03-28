import { IsString, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreatePostDto {
  @ApiProperty({
    description: "Post title",
    example: "My first post",
  })
  @IsString()
  @MinLength(1)
  title!: string;

  @ApiProperty({
    description: "Post content",
    example: "Post text",
  })
  @IsString()
  @MinLength(1)
  content!: string;
}
