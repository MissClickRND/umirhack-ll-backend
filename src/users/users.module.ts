import { Module } from '@nestjs/common';
import { CryptoModule } from '../crypto/crypto.module';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  imports: [CryptoModule],
  providers: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
