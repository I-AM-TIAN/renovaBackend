import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from './user.entity';

@Entity('user_images')
export class UserImage {
    
    @PrimaryGeneratedColumn()
    id: number;

    @Column('text')
    url: string;

    @Column('bool', {
        default: true,
    })
    isProfileImage: boolean;

    @ManyToOne(
        () => User,
        (user) => user.images,
        { onDelete: 'CASCADE' }
    )
    user: User;
}
