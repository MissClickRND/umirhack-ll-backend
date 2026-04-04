import { Module } from '@nestjs/common';
import { DiplomasService } from './diplomas.service';
import { DiplomasController } from './diplomas.controller';
import { CryptoModule } from '../crypto/crypto.module';
import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from '../crypto/crypto.service';

@Module({
    imports: [CryptoModule],
    providers: [DiplomasService, CryptoService, PrismaService],
    controllers: [DiplomasController]
})
export class DiplomasModule {}
