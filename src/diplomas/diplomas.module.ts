import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { DiplomasService } from './diplomas.service';
import { DiplomasController } from './diplomas.controller';
import { CryptoModule } from '../crypto/crypto.module';
import { DiplomaCacheBusterService } from './diploma-cache-buster.service';

@Module({
  imports: [
    CryptoModule,
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        ttl: config.get<number>('DIPLOMA_CACHE_TTL_MS', 120_000),
      }),
    }),
  ],
  providers: [DiplomaCacheBusterService, DiplomasService],
  controllers: [DiplomasController],
})
export class DiplomasModule {}
