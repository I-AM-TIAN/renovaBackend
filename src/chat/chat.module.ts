import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { ChatController } from './chat.controller';
import { Conversation, Message } from './entities';
import { AuthModule } from '../auth/auth.module';
import { Product } from '../products/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([Conversation, Message, Product]),
    AuthModule,
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway],
  exports: [ChatService],
})
export class ChatModule {}
