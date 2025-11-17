import { BeforeInsert, BeforeUpdate, Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ProductImage } from './product-image.entity';
import { Location } from './location.entity';
import { Modality } from './modality.entity';
import { User } from '../../auth/entities';

@Entity('products')
export class Product {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('text', {
        unique: true,
    })
    name: string;

    @Column('float', {
        default: 0,
    })
    price: number;

    @Column('text')
    description: string;

    @Column('text',{
        unique: true,
    })
    slug: string;

    @Column('text', {
        array: true,
        default: [],
    })
    tags: string[];

    @ManyToOne(
        () => Location,
        (location) => location.products,
        { eager: true }
    )
    location: Location;

    @ManyToOne(
        () => Modality,
        (modality) => modality.products,
        { eager: true }
    )
    modality: Modality;

    @ManyToOne(
        () => User,
        (user) => user.id,
        { eager: true }
    )
    user: User;

    @OneToMany(
        () => ProductImage,
        (productImage) => productImage.product,
        { cascade: true, eager: true } 
    )
    images?: ProductImage[];


    @BeforeInsert()
    checkSlugInsert(){
        if ( !this.slug ) {
            this.slug = this.name;
        }

        this.slug = this.slug
            .toLowerCase()
            .replaceAll(' ', '_')
            .replaceAll("'", '');
    }

    @BeforeUpdate()
    checkSlugUpdate(){
        this.slug = this.slug
            .toLowerCase()
            .replaceAll(' ', '_')
            .replaceAll("'", '');
    }
}
