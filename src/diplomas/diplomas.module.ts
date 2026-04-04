import { Module } from '@nestjs/common';
import { DiplomasService } from './diplomas.service';
import { DiplomasController } from './diplomas.controller';
import { CryptoModule } from '../crypto/crypto.module';
import { DiplomaCryptoResolverService } from './diploma-crypto-resolver.service';
import { DiplomaHumanMapper } from './diploma-human.mapper';

@Module({
  imports: [CryptoModule],
  providers: [
    DiplomasService,
    DiplomaCryptoResolverService,
    DiplomaHumanMapper,
  ],
  controllers: [DiplomasController],
})
export class DiplomasModule {}
