import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import Joi from 'joi';
import { JwtAccessGuard } from './auth/guards/jwt-access.guard';
import { RolesGuard } from './auth/guards/roles.guards';
import { UsersModule } from './users/users.module';
import { DiplomasModule } from './diplomas/diplomas.module';
import { PublicApiServiseModule } from './public-api-servise/public-api-servise.module';

import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'test', 'production')
          .default('development'),
        PORT: Joi.number().port().default(3000),
        DATABASE_URL: Joi.string().required(),
        DIPLOMA_SYMMETRIC_KEY: Joi.when('NODE_ENV', {
          is: 'production',
          then: Joi.string().hex().length(64).required(),
          otherwise: Joi.string()
            .hex()
            .length(64)
            .default(
              'a1b2c3d4e5f6789012345678abcdef0123456789abcdef0123456789abcdef00',
            ),
        }).description('256-bit AES key as 64 hex chars; encrypts diploma PII'),
        DIPLOMA_CACHE_TTL_MS: Joi.number()
          .integer()
          .min(1_000)
          .max(3_600_000)
          .default(120_000)
          .description('In-memory diploma cache TTL (ms)'),
      }),
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 10,
      },
    ]),
    PrismaModule,
    AuthModule,
    UsersModule,
    DiplomasModule,
    PublicApiServiseModule,
  ],
  providers: [
    {
      provide: 'APP_GUARD',
      useClass: JwtAccessGuard,
    },
    {
      provide: 'APP_GUARD',
      useClass: RolesGuard,
    },
    {
      provide: 'APP_GUARD',
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
