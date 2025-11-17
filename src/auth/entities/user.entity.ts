import { BeforeInsert, BeforeUpdate, Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { UserImage } from './user-image.entity';

@Entity('users')
export class User {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('text')
    nombres: string;

    @Column('text')
    apellidos: string;

    @Column('text', {
        unique: true,
    })
    email: string;

    @Column('text', {
        select: false,
    })
    password: string;

    @Column('text', {
        nullable: true,
        select: false,
    })
    resetPasswordToken?: string;

    @Column('timestamp', {
        nullable: true,
        select: false,
    })
    resetPasswordExpires?: Date;

    @Column('text', {
        nullable: true,
    })
    telefono?: string;

    @OneToMany(
        () => UserImage,
        (userImage) => userImage.user,
        { cascade: true, eager: true }
    )
    images?: UserImage[];

    @Column('int', {
        default: 0,
    })
    ecopoints: number;

    @Column('text', {
        nullable: true,
    })
    ecoStatus?: string;

    @Column('bool', {
        default: true,
    })
    isActive: boolean;

    @Column('text', {
        array: true,
        default: ['user'],
    })
    roles: string[];

    @BeforeInsert()
    checkFieldsBeforeInsert() {
        this.email = this.email.toLowerCase().trim();
    }

    @BeforeUpdate()
    checkFieldsBeforeUpdate() {
        this.checkFieldsBeforeInsert();
    }
}
