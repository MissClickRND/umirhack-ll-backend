import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { UserClientService } from './user-client.service';
import { USER_SERVICE_CLIENT } from './user-client.constants';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: USER_SERVICE_CLIENT,
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: config.get<string>('USER_SERVICE_HOST', 'localhost'),
            port: Number(config.get<number>('USER_SERVICE_PORT', 4001)),
          },
        }),
      },
    ]),
  ],
  providers: [UserClientService],
  exports: [UserClientService],
})
export class UserClientModule {}
