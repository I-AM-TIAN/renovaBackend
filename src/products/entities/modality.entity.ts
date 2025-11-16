import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Product } from './product.entity';

@Entity('modalities')
export class Modality {
    
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('text', {
        unique: true,
    })
    name: string;

    @Column('text', {
        nullable: true,
    })
    description?: string;

    @OneToMany(
        () => Product,
        (product) => product.modality
    )
    products: Product[];
}
