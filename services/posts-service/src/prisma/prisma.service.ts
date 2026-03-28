import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const connectionString =
      process.env.DATABASE_URL ?? process.env.POSTS_DATABASE_URL;

    if (!connectionString) {
      throw new Error(
        "DATABASE_URL or POSTS_DATABASE_URL must be provided for posts-service",
      );
    }

    const pool = new PrismaPg({ connectionString });
    super({ adapter: pool });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
