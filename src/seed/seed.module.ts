import { Module } from '@nestjs/common';
import { SeedService } from './seed.service';
import { SeedController } from './seed.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Location, Modality, Product, ProductImage } from '../products/entities';

@Module({
  controllers: [SeedController],
  providers: [SeedService],
  imports: [
    TypeOrmModule.forFeature([
      Product,
      ProductImage,
      Location,
      Modality,
    ]),
  ],
})
export class SeedModule {}
