import { BeforeInsert, BeforeUpdate, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

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
}
