import { IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CreateConversationDto {
  @IsUUID()
  @IsNotEmpty()
  otherUserId: string;

  @IsUUID()
  @IsOptional()
  productId?: string;
}
