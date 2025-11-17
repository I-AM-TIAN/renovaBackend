import { IsNotEmpty, IsUUID } from 'class-validator';

export class JoinChatDto {
  @IsUUID()
  @IsNotEmpty()
  conversationId: string;

  @IsUUID()
  @IsNotEmpty()
  userId: string;
}
