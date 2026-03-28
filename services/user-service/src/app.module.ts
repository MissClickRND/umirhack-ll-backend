import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import Joi from "joi";
import { PrismaModule } from "./prisma/prisma.module";
import { UsersModule } from "./users/users.module";
import { resolve } from "path";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [resolve(process.cwd(), "../../.env"), ".env"],
      validationSchema: Joi.object({
        DATABASE_URL: Joi.string().required(),
        TCP_PORT: Joi.number().port().default(4001),
      }),
    }),
    PrismaModule,
    UsersModule,
  ],
})
export class AppModule {}
