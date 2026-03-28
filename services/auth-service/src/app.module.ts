import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import Joi from 'joi';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { JwtAccessGuard } from './auth/guards/jwt-access.guard';
import { UsersModule } from './users/users.module';
import { RolesGuard } from './auth/guards/roles.guards';
import { resolve } from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [resolve(process.cwd(), '../../.env'), '.env'],
      validationSchema: Joi.object({
        PORT: Joi.number().port().default(3000),
        USER_SERVICE_HOST: Joi.string().default('localhost'),
        USER_SERVICE_PORT: Joi.number().port().default(4001),
        CORS_ORIGIN: Joi.string().default('http://localhost:5173'),
      }),
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 10,
      },
    ]),
    AuthModule,
    UsersModule,
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
