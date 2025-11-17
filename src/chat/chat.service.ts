import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation, Message } from './entities';
import { SendMessageDto } from './dto/send-message.dto';
import { Product } from '../products/entities';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,

    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,

    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  // Obtener o crear conversación entre dos usuarios
  async getOrCreateConversation(user1Id: string, user2Id: string, productId?: string) {
    if (user1Id === user2Id) {
      throw new BadRequestException('No puedes crear una conversación contigo mismo');
    }

    // Si hay un producto, validar su estado
    if (productId) {
      const product = await this.productRepository.findOne({
        where: { id: productId },
        relations: { user: true }
      });

      if (!product) {
        throw new NotFoundException(`Producto con id "${productId}" no encontrado`);
      }

      // Validar que el producto no esté reservado (a menos que sea el dueño)
      if (product.status === 'reservado' && product.user.id !== user1Id && product.user.id !== user2Id) {
        throw new BadRequestException('Este producto está reservado. No se puede iniciar una conversación.');
      }

      // Validar que el producto esté disponible o reservado (no "no_disponible")
      if (product.status === 'no_disponible') {
        throw new BadRequestException('Este producto no está disponible.');
      }
    }

    // Buscar conversación existente (sin importar el orden de usuarios)
    let conversation = await this.conversationRepository
      .createQueryBuilder('conversation')
      .where(
        '(conversation.user1Id = :user1Id AND conversation.user2Id = :user2Id) OR (conversation.user1Id = :user2Id AND conversation.user2Id = :user1Id)',
        { user1Id, user2Id }
      )
      .andWhere(productId ? 'conversation.productId = :productId' : 'conversation.productId IS NULL', { productId })
      .getOne();

    // Si no existe, crear nueva
    if (!conversation) {
      conversation = this.conversationRepository.create({
        user1Id,
        user2Id,
        productId,
      });
      await this.conversationRepository.save(conversation);

      // Recargar con relaciones
      conversation = await this.conversationRepository.findOne({
        where: { id: conversation.id },
        relations: ['user1', 'user2', 'product'],
      });
    }

    return conversation;
  }

  // Obtener conversaciones de un usuario
  async getUserConversations(userId: string) {
    const conversations = await this.conversationRepository
      .createQueryBuilder('conversation')
      .leftJoinAndSelect('conversation.user1', 'user1')
      .leftJoinAndSelect('user1.images', 'user1Images')
      .leftJoinAndSelect('conversation.user2', 'user2')
      .leftJoinAndSelect('user2.images', 'user2Images')
      .leftJoinAndSelect('conversation.product', 'product')
      .leftJoinAndSelect('product.images', 'productImages')
      .where('conversation.user1Id = :userId OR conversation.user2Id = :userId', { userId })
      .orderBy('conversation.updatedAt', 'DESC')
      .getMany();

    // Mapear para incluir el otro usuario y el conteo de mensajes no leídos
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const otherUser = conv.user1Id === userId ? conv.user2 : conv.user1;
        
        // Obtener foto de perfil del otro usuario
        const profileImage = otherUser.images?.find(img => img.isProfileImage)?.url || null;
        
        const unreadCount = await this.messageRepository.count({
          where: {
            conversationId: conv.id,
            senderId: otherUser.id,
            isRead: false,
          },
        });

        return {
          ...conv,
          otherUser: {
            id: otherUser.id,
            fullName: otherUser.nombres + ' ' + otherUser.apellidos,
            email: otherUser.email,
            profileImage,
          },
          unreadCount,
          product: conv.product ? {
            ...conv.product,
            images: conv.product.images?.map(img => img.url) || []
          } : null,
        };
      })
    );

    return conversationsWithUnread;
  }

  // Guardar mensaje
  async saveMessage(data: SendMessageDto) {
    const { conversationId, message, senderId } = data;

    // Verificar que la conversación existe
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException(`Conversación con id "${conversationId}" no encontrada`);
    }

    // Crear mensaje
    const newMessage = this.messageRepository.create({
      content: message,
      conversationId,
      senderId,
    });

    await this.messageRepository.save(newMessage);

    // Actualizar último mensaje de la conversación
    conversation.lastMessage = message;
    conversation.updatedAt = new Date();
    await this.conversationRepository.save(conversation);

    // Recargar mensaje con relaciones
    const savedMessage = await this.messageRepository.findOne({
      where: { id: newMessage.id },
      relations: ['sender'],
    });

    return savedMessage;
  }

  // Obtener mensajes de una conversación
  async getMessages(conversationId: string, limit: number = 50, offset: number = 0) {
    const messages = await this.messageRepository.find({
      where: { conversationId },
      relations: ['sender'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return messages.reverse(); // Invertir para mostrar del más antiguo al más reciente
  }

  // Marcar mensajes como leídos
  async markAsRead(conversationId: string, userId: string) {
    await this.messageRepository
      .createQueryBuilder()
      .update(Message)
      .set({ isRead: true })
      .where('conversationId = :conversationId', { conversationId })
      .andWhere('senderId != :userId', { userId })
      .andWhere('isRead = :isRead', { isRead: false })
      .execute();

    return { success: true };
  }

  // Obtener conversación por ID
  async getConversationById(conversationId: string) {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
      relations: ['user1', 'user2', 'product'],
    });

    if (!conversation) {
      throw new NotFoundException(`Conversación con id "${conversationId}" no encontrada`);
    }

    return conversation;
  }
}
