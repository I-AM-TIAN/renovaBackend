import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { validate as isUUID } from 'uuid';
import { Product, ProductImage, Location, Modality } from './entities';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger('ProductsService');

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    @InjectRepository(ProductImage)
    private readonly productImageRepository: Repository<ProductImage>,

    @InjectRepository(Location)
    private readonly locationRepository: Repository<Location>,

    @InjectRepository(Modality)
    private readonly modalityRepository: Repository<Modality>,

    private readonly dataSource: DataSource,
  ) {}

  async create(createProductDto: CreateProductDto) {
    try {

      const { images = [], locationId, modalityId, ...productDetails} = createProductDto;

      // Verificar que existan la ubicación y modalidad
      const location = await this.locationRepository.findOneBy({ id: locationId });
      if (!location) {
        throw new NotFoundException(`Location with id "${locationId}" not found`);
      }

      const modality = await this.modalityRepository.findOneBy({ id: modalityId });
      if (!modality) {
        throw new NotFoundException(`Modality with id "${modalityId}" not found`);
      }

      const product = this.productRepository.create({
        ...productDetails,
        location,
        modality,
        images: images.map( image => this.productImageRepository.create({ url: image }) ),
      });
      await this.productRepository.save(product);

      return {...product, images};
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto;

    const products = await this.productRepository.find({
      take: limit,
      skip: offset,
      relations: {
        images: true,
        location: true,
        modality: true,
      }
    })

    return products.map( (product) => ({
      ...product,
      images: product.images?.map( img => img.url ) ?? []
    }))
  }

  async findOne(term: string) {
    let product: Product | null;

    if (isUUID(term)) {
      product = await this.productRepository.findOneBy({ id: term });
    } else {
      const queryBuilder = this.productRepository.createQueryBuilder('prod');
      product = await queryBuilder
        .where('UPPER(name)=:name or slug=:slug', {
          name: term.toUpperCase(),
          slug: term.toLowerCase(),
        })
        .leftJoinAndSelect('prod.images', 'prodImages')
        .getOne();
    }

    if (!product)
      throw new NotFoundException(`Product with "${term}" not found`);

    return product;
  }


  async findOnePlain( term: string ) {
    const {images = [], ...rest} = await this.findOne(term);

    return{
      ...rest,
      images: images.map( img => img.url )
    }
  }

  async update(id: string, updateProductDto: UpdateProductDto) {

    const { images, locationId, modalityId, ...toUpdate } = updateProductDto;

    const product = await this.productRepository.preload({ id: id, ...toUpdate });

    if (!product)
      throw new NotFoundException(`Product with id "${id}" not found`);

    //create query runner
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Actualizar ubicación si se proporciona
      if (locationId) {
        const location = await this.locationRepository.findOneBy({ id: locationId });
        if (!location) {
          throw new NotFoundException(`Location with id "${locationId}" not found`);
        }
        product.location = location;
      }

      // Actualizar modalidad si se proporciona
      if (modalityId) {
        const modality = await this.modalityRepository.findOneBy({ id: modalityId });
        if (!modality) {
          throw new NotFoundException(`Modality with id "${modalityId}" not found`);
        }
        product.modality = modality;
      }

      if (images) {
        await queryRunner.manager.delete(ProductImage, { product: { id } });
        product.images = images.map( image => 
          this.productImageRepository.create({ url: image })
        );
      }

      await queryRunner.manager.save(product);
      await queryRunner.commitTransaction();
      await queryRunner.release();

      return this.findOnePlain(id);
    } catch (error) {

      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      this.handleDBExceptions(error);
    }
  }

  async remove(id: string) {
    const product = await this.findOne(id);

    await this.productRepository.remove(product);
  }

  private handleDBExceptions(error: any) {
    if (error.code === '23505') throw new BadRequestException(error.detail);
    this.logger.error(error);
    throw new InternalServerErrorException(
      'Unexpected error, check server logs',
    );
  }

  async deleteAllProducts() {
    const query = this.productRepository.createQueryBuilder('product');

    try {
      return await query
        .delete()
        .where({})
        .execute();
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  // Métodos para Location
  async createLocation(createLocationDto: any) {
    try {
      const location = this.locationRepository.create(createLocationDto);
      await this.locationRepository.save(location);
      return location;
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async findAllLocations() {
    return await this.locationRepository.find();
  }

  async findLocationById(id: string) {
    const location = await this.locationRepository.findOneBy({ id });
    if (!location) {
      throw new NotFoundException(`Location with id "${id}" not found`);
    }
    return location;
  }

  // Métodos para Modality
  async createModality(createModalityDto: any) {
    try {
      const modality = this.modalityRepository.create(createModalityDto);
      await this.modalityRepository.save(modality);
      return modality;
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async findAllModalities() {
    return await this.modalityRepository.find();
  }

  async findModalityById(id: string) {
    const modality = await this.modalityRepository.findOneBy({ id });
    if (!modality) {
      throw new NotFoundException(`Modality with id "${id}" not found`);
    }
    return modality;
  }
}
