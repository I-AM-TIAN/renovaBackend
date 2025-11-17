import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../auth/entities';
import { Product } from '../../products/entities';
import { Message } from './message.entity';

@Entity('conversations')
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { eager: true })
  user1: User;

  @Column('uuid')
  user1Id: string;

  @ManyToOne(() => User, { eager: true })
  user2: User;

  @Column('uuid')
  user2Id: string;

  @ManyToOne(() => Product, { eager: true, nullable: true })
  product?: Product;

  @Column('uuid', { nullable: true })
  productId?: string;

  @Column('text', { nullable: true })
  lastMessage?: string;

  @OneToMany(() => Message, (message) => message.conversation)
  messages: Message[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
