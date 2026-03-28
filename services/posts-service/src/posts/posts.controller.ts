import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UnauthorizedException,
} from "@nestjs/common";
import { ApiBearerAuth, ApiParam, ApiTags } from "@nestjs/swagger";
import { CreatePostDto } from "./dto/create-post.dto";
import { UpdatePostDto } from "./dto/update-post.dto";
import { PostsService } from "./posts.service";

@ApiTags("posts-service")
@ApiBearerAuth("access-token")
@Controller()
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get("health")
  health() {
    return {
      service: "posts-service",
      status: "ok",
    };
  }

  @Post("posts")
  async create(
    @Headers("x-user-id") userIdHeader: string | undefined,
    @Body() dto: CreatePostDto,
  ) {
    const userId = this.requireUserId(userIdHeader);
    return await this.postsService.create(userId, dto);
  }

  @Get("posts")
  async findAll(@Headers("x-user-id") userIdHeader: string | undefined) {
    const userId = this.requireUserId(userIdHeader);
    return await this.postsService.findAll(userId);
  }

  @Get("posts/:id")
  @ApiParam({ name: "id", type: Number, description: "Post ID" })
  async findOne(
    @Headers("x-user-id") userIdHeader: string | undefined,
    @Param("id", ParseIntPipe) id: number,
  ) {
    const userId = this.requireUserId(userIdHeader);
    return await this.postsService.findOne(userId, id);
  }

  @Patch("posts/:id")
  @ApiParam({ name: "id", type: Number, description: "Post ID" })
  async update(
    @Headers("x-user-id") userIdHeader: string | undefined,
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdatePostDto,
  ) {
    const userId = this.requireUserId(userIdHeader);
    return await this.postsService.update(userId, id, dto);
  }

  @Delete("posts/:id")
  @ApiParam({ name: "id", type: Number, description: "Post ID" })
  async remove(
    @Headers("x-user-id") userIdHeader: string | undefined,
    @Param("id", ParseIntPipe) id: number,
  ) {
    const userId = this.requireUserId(userIdHeader);
    return await this.postsService.remove(userId, id);
  }

  private requireUserId(value?: string): string {
    if (!value) {
      throw new UnauthorizedException(
        "Отсутствует заголовок контекста пользователя",
      );
    }

    return value;
  }
}
