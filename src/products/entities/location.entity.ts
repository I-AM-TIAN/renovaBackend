import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Product } from './product.entity';

@Entity('locations')
export class Location {
    
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('text', {
        unique: true,
    })
    city: string;

    @Column('text', {
        nullable: true,
    })
    state?: string;

    @Column('text', {
        nullable: true,
    })
    country?: string;

    @OneToMany(
        () => Product,
        (product) => product.location
    )
    products: Product[];
}
