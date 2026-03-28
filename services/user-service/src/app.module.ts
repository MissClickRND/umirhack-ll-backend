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
      envFilePath: resolve(__dirname, "../../../.env"),
      validationSchema: Joi.object({
        DATABASE_URL: Joi.string().required(),
        USER_SERVICE_PORT: Joi.number().port().default(3002),
        PORT: Joi.number().port().optional(),
        TCP_PORT: Joi.number().port().default(4001),
        JWT_ACCESS_SECRET: Joi.string().required(),
        CORS_ORIGIN: Joi.string().default("http://localhost:5173"),
      }),
    }),
    PrismaModule,
    UsersModule,
  ],
})
export class AppModule {}
