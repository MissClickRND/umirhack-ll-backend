import { Module } from '@nestjs/common';
import { DiplomasService } from './diplomas.service';
import { DiplomasController } from './diplomas.controller';
import { CryptoModule } from '../crypto/crypto.module';

@Module({
    imports: [CryptoModule],
    providers: [DiplomasService],
    controllers: [DiplomasController]
})
export class DiplomasModule {}
