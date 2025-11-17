import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { JoinChatDto } from './dto/join-chat.dto';

@WebSocketGateway({
  cors: {
    origin: '*', // En producción, especifica tu dominio
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(private readonly chatService: ChatService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Cliente conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Cliente desconectado: ${client.id}`);
  }

  // Usuario se une a una conversación
  @SubscribeMessage('joinChat')
  async handleJoinChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: JoinChatDto,
  ) {
    try {
      const { conversationId, userId } = data;
      
      // Verificar que la conversación existe y el usuario es parte de ella
      const conversation = await this.chatService.getConversationById(conversationId);
      
      if (conversation.user1Id !== userId && conversation.user2Id !== userId) {
        return { 
          event: 'error', 
          data: { message: 'No tienes permiso para unirte a esta conversación' } 
        };
      }

      client.join(conversationId);
      this.logger.log(`Usuario ${userId} se unió a la conversación ${conversationId}`);
      
      return { 
        event: 'joinedChat', 
        data: { conversationId, message: 'Conectado al chat' } 
      };
    } catch (error) {
      this.logger.error(`Error al unirse al chat: ${error.message}`);
      return { 
        event: 'error', 
        data: { message: error.message } 
      };
    }
  }

  // Enviar mensaje
  @SubscribeMessage('sendMessage')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: SendMessageDto,
  ) {
    try {
      // Guardar mensaje en BD
      const savedMessage = await this.chatService.saveMessage(data);

      if (!savedMessage) {
        throw new Error('Error al guardar el mensaje');
      }

      // Emitir a todos los usuarios en la conversación
      this.server.to(data.conversationId).emit('newMessage', {
        id: savedMessage.id,
        content: savedMessage.content,
        conversationId: savedMessage.conversationId,
        sender: {
          id: savedMessage.sender.id,
          nombres: savedMessage.sender.nombres,
          apellidos: savedMessage.sender.apellidos,
        },
        senderId: savedMessage.senderId,
        isRead: savedMessage.isRead,
        createdAt: savedMessage.createdAt,
      });

      return { 
        event: 'messageSent', 
        data: savedMessage 
      };
    } catch (error) {
      this.logger.error(`Error al enviar mensaje: ${error.message}`);
      return { 
        event: 'error', 
        data: { message: error.message } 
      };
    }
  }

  // Usuario está escribiendo
  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; userId: string; userName: string },
  ) {
    // Emitir a todos excepto al remitente
    client.to(data.conversationId).emit('userTyping', {
      userId: data.userId,
      userName: data.userName,
      conversationId: data.conversationId,
    });
  }

  // Usuario dejó de escribir
  @SubscribeMessage('stopTyping')
  handleStopTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; userId: string },
  ) {
    client.to(data.conversationId).emit('userStoppedTyping', {
      userId: data.userId,
      conversationId: data.conversationId,
    });
  }

  // Marcar mensajes como leídos
  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; userId: string },
  ) {
    try {
      await this.chatService.markAsRead(data.conversationId, data.userId);
      
      // Notificar al otro usuario que los mensajes fueron leídos
      this.server.to(data.conversationId).emit('messagesRead', {
        conversationId: data.conversationId,
        userId: data.userId,
      });

      return { 
        event: 'markedAsRead', 
        data: { success: true } 
      };
    } catch (error) {
      this.logger.error(`Error al marcar como leído: ${error.message}`);
      return { 
        event: 'error', 
        data: { message: error.message } 
      };
    }
  }
}
