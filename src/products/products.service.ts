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
import { User } from '../auth/entities';

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

  async create(createProductDto: CreateProductDto, user: User) {
    try {

      const { images = [], location: locationString, modality: modalityString, ...productDetails} = createProductDto;

      // Parsear y crear/buscar ubicación
      const location = await this.parseAndCreateLocation(locationString);

      // Buscar modalidad por nombre
      const modality = await this.modalityRepository.findOne({
        where: { name: modalityString }
      });

      if (!modality) {
        throw new NotFoundException(`Modalidad "${modalityString}" no encontrada. Use: Venta, Intercambio o Donación`);
      }

      const product = this.productRepository.create({
        ...productDetails,
        location,
        modality,
        user,
        images: images.map( image => this.productImageRepository.create({ url: image }) ),
      });
      await this.productRepository.save(product);

      // Recargar el producto con todas las relaciones
      const savedProduct = await this.productRepository.findOne({
        where: { id: product.id },
        relations: {
          images: true,
          location: true,
          modality: true,
          user: true,
        }
      });

      if (!savedProduct) {
        throw new InternalServerErrorException('Error al guardar el producto');
      }

      // Mapear imágenes correctamente para la respuesta
      return {
        ...savedProduct,
        images: savedProduct.images?.map(img => img.url) || []
      };
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  private async parseAndCreateLocation(locationString: string): Promise<Location> {
    // Parsear string: "Bogotá, Cundinamarca, Colombia" o solo "Bogotá"
    const parts = locationString.split(',').map(part => part.trim());
    
    const city = parts[0];
    const state = parts[1] || undefined;
    const country = parts[2] || undefined;

    // Buscar si ya existe
    const whereCondition: any = { city };
    if (state) whereCondition.state = state;
    if (country) whereCondition.country = country;

    let location = await this.locationRepository.findOne({
      where: whereCondition
    });

    // Si no existe, crear nueva
    if (!location) {
      location = this.locationRepository.create({
        city,
        state,
        country
      });
      await this.locationRepository.save(location);
    }

    return location;
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto;

    // Solo mostrar productos disponibles y reservados (no los "no_disponible")
    const products = await this.productRepository.find({
      where: [
        { status: 'disponible' },
        { status: 'reservado' }
      ],
      take: limit,
      skip: offset,
      relations: {
        images: true,
        location: true,
        modality: true,
        user: true,
      }
    })

    return products.map( (product) => ({
      ...product,
      images: product.images?.map( img => img.url ) ?? []
    }))
  }

  // Obtener productos del usuario autenticado (todos los estados)
  async findUserProducts(userId: string, paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto;

    const products = await this.productRepository.find({
      where: { user: { id: userId } },
      take: limit,
      skip: offset,
      order: { slug: 'DESC' }, // Ordenar por fecha de creación
      relations: {
        images: true,
        location: true,
        modality: true,
        user: true,
      }
    });

    return products.map( (product) => ({
      ...product,
      images: product.images?.map( img => img.url ) ?? []
    }));
  }

  // Actualizar estado del producto
  async updateStatus(productId: string, userId: string, status: 'disponible' | 'reservado' | 'no_disponible') {
    const product = await this.productRepository.findOne({
      where: { id: productId },
      relations: { user: true }
    });

    if (!product) {
      throw new NotFoundException(`Producto con id "${productId}" no encontrado`);
    }

    // Verificar que el usuario sea el dueño del producto
    if (product.user.id !== userId) {
      throw new BadRequestException('No tienes permiso para modificar este producto');
    }

    product.status = status;
    await this.productRepository.save(product);

    return {
      id: product.id,
      name: product.name,
      status: product.status,
      message: `Estado actualizado a: ${status}`
    };
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

    const { images, location: locationString, modality: modalityString, ...toUpdate } = updateProductDto;

    const product = await this.productRepository.preload({ id: id, ...toUpdate });

    if (!product)
      throw new NotFoundException(`Product with id "${id}" not found`);

    //create query runner
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Actualizar ubicación si se proporciona
      if (locationString) {
        const location = await this.parseAndCreateLocation(locationString);
        product.location = location;
      }

      // Actualizar modalidad si se proporciona
      if (modalityString) {
        const modality = await this.modalityRepository.findOne({
          where: { name: modalityString }
        });
        if (!modality) {
          throw new NotFoundException(`Modalidad "${modalityString}" no encontrada. Use: Venta, Intercambio o Donación`);
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
