import { Module } from '@nestjs/common';
import { UserClientModule } from 'src/user-client/user-client.module';
import { UsersController } from './users.controller';

@Module({
  imports: [UserClientModule],
  controllers: [UsersController],
})
export class UsersModule {}
