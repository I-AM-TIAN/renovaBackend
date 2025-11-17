import { Controller, Get, Post, Body, Param, UseGuards, Query, ParseUUIDPipe } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators';
import { User } from '../auth/entities';
import { CreateConversationDto } from './dto/create-conversation.dto';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // Crear o obtener conversación con otro usuario
  @Post('conversations')
  createConversation(
    @GetUser() user: User,
    @Body() createConversationDto: CreateConversationDto,
  ) {
    return this.chatService.getOrCreateConversation(
      user.id,
      createConversationDto.otherUserId,
      createConversationDto.productId,
    );
  }

  // Listar todas las conversaciones del usuario autenticado
  @Get('conversations')
  getConversations(@GetUser() user: User) {
    return this.chatService.getUserConversations(user.id);
  }

  // Obtener una conversación específica
  @Get('conversations/:id')
  getConversation(@Param('id', ParseUUIDPipe) id: string) {
    return this.chatService.getConversationById(id);
  }

  // Obtener mensajes de una conversación con paginación
  @Get('conversations/:id/messages')
  getMessages(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 50;
    const parsedOffset = offset ? parseInt(offset, 10) : 0;
    
    return this.chatService.getMessages(id, parsedLimit, parsedOffset);
  }

  // Marcar mensajes de una conversación como leídos
  @Post('conversations/:id/read')
  markAsRead(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: User,
  ) {
    return this.chatService.markAsRead(id, user.id);
  }
}
