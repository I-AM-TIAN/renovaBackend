import { BeforeInsert, BeforeUpdate, Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ProductImage } from './';

@Entity()
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
