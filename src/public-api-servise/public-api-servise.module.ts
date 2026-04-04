import { Module } from '@nestjs/common';
import { CryptoModule } from '../crypto/crypto.module';
import { PublicApiServiseController } from './public-api-servise.controller';
import { PublicApiServiseService } from './public-api-servise.service';

@Module({
  imports: [CryptoModule],
  controllers: [PublicApiServiseController],
  providers: [PublicApiServiseService],
})
export class PublicApiServiseModule {}
