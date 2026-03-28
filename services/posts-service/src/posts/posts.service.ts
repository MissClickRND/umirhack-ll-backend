import { Injectable, NotFoundException } from "@nestjs/common";
import type { Post } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import type { CreatePostDto } from "./dto/create-post.dto";
import type { UpdatePostDto } from "./dto/update-post.dto";

export type PostEntity = Post;

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreatePostDto): Promise<PostEntity> {
    return this.prisma.post.create({
      data: {
        userId,
        title: dto.title,
        content: dto.content,
      },
    });
  }

  async findAll(userId: string): Promise<PostEntity[]> {
    return this.prisma.post.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(userId: string, id: number): Promise<PostEntity> {
    const entity = await this.prisma.post.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!entity) {
      throw new NotFoundException("Пост не найден");
    }

    return entity;
  }

  async update(
    userId: string,
    id: number,
    dto: UpdatePostDto,
  ): Promise<PostEntity> {
    await this.findOne(userId, id);

    return this.prisma.post.update({
      where: { id },
      data: {
        title: dto.title,
        content: dto.content,
      },
    });
  }

  async remove(userId: string, id: number): Promise<PostEntity> {
    await this.findOne(userId, id);
    return this.prisma.post.delete({ where: { id } });
  }
}
