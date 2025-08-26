import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ChatGateway } from './chat.gateway';
import { MessagesModule } from '../messages/messages.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MessagesModule,
    UsersModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
    }),
  ],
  providers: [ChatGateway],
})
export class ChatModule {}