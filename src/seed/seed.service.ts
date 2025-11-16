import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Location, Modality, Product } from '../products/entities';
import { ProductImage } from '../products/entities/product-image.entity';

@Injectable()
export class SeedService {
  constructor(
    @InjectRepository(Location)
    private readonly locationRepository: Repository<Location>,

    @InjectRepository(Modality)
    private readonly modalityRepository: Repository<Modality>,

    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    @InjectRepository(ProductImage)
    private readonly productImageRepository: Repository<ProductImage>,
  ) {}

  async runSeed() {
    await this.deleteTables();
    
    const modalities = await this.insertModalities();
    const locations = await this.insertLocations();
    await this.insertProducts(modalities, locations);

    return 'SEED EXECUTED';
  }

  private async deleteTables() {
    // Eliminar en orden inverso por las foreign keys
    await this.productImageRepository.createQueryBuilder().delete().execute();
    await this.productRepository.createQueryBuilder().delete().execute();
    await this.modalityRepository.createQueryBuilder().delete().execute();
    await this.locationRepository.createQueryBuilder().delete().execute();
  }

  private async insertModalities() {
    const seedModalities = [
      {
        name: 'Venta',
        description: 'Producto disponible para venta',
      },
      {
        name: 'Donación',
        description: 'Producto disponible para donación',
      },
      {
        name: 'Intercambio',
        description: 'Producto disponible para intercambio',
      },
    ];

    const modalities: Modality[] = [];

    for (const modalityData of seedModalities) {
      const modality = this.modalityRepository.create(modalityData);
      await this.modalityRepository.save(modality);
      modalities.push(modality);
    }

    return modalities;
  }

  private async insertLocations() {
    const seedLocations = [
      {
        city: 'Bogotá',
        state: 'Cundinamarca',
        country: 'Colombia',
      },
      {
        city: 'Medellín',
        state: 'Antioquia',
        country: 'Colombia',
      },
      {
        city: 'Cali',
        state: 'Valle del Cauca',
        country: 'Colombia',
      },
      {
        city: 'Barranquilla',
        state: 'Atlántico',
        country: 'Colombia',
      },
      {
        city: 'Cartagena',
        state: 'Bolívar',
        country: 'Colombia',
      },
      {
        city: 'Bucaramanga',
        state: 'Santander',
        country: 'Colombia',
      },
    ];

    const locations: Location[] = [];

    for (const locationData of seedLocations) {
      const location = this.locationRepository.create(locationData);
      await this.locationRepository.save(location);
      locations.push(location);
    }

    return locations;
  }

  private async insertProducts(modalities: Modality[], locations: Location[]) {
    const seedProducts = [
      {
        name: 'Sofá Moderno Gris',
        price: 450000,
        description: 'Sofá de 3 puestos en excelente estado, color gris, muy cómodo y moderno.',
        slug: 'sofa_moderno_gris',
        tags: ['muebles', 'sala', 'sofá'],
        images: [
          'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500',
          'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=500',
          'https://images.unsplash.com/photo-1540574163026-643ea20ade25?w=500',
          'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500',
        ],
        modalityIndex: 0, // Venta
        locationIndex: 0, // Bogotá
      },
      {
        name: 'Mesa de Comedor Madera',
        price: 350000,
        description: 'Mesa de comedor para 6 personas, madera maciza, incluye 6 sillas.',
        slug: 'mesa_comedor_madera',
        tags: ['muebles', 'comedor', 'mesa'],
        images: [
          'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=500',
          'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=500',
          'https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?w=500',
        ],
        modalityIndex: 0, // Venta
        locationIndex: 1, // Medellín
      },
      {
        name: 'Bicicleta de Montaña',
        price: 0,
        description: 'Bicicleta en buen estado, ideal para ciclovías. Regalo por mudanza.',
        slug: 'bicicleta_montana',
        tags: ['deportes', 'bicicleta', 'regalo'],
        images: [
          'https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?w=500',
          'https://images.unsplash.com/photo-1511994298241-608e28f14fde?w=500',
          'https://images.unsplash.com/photo-1571333250630-f0230c320b6d?w=500',
        ],
        modalityIndex: 1, // Donación
        locationIndex: 2, // Cali
      },
      {
        name: 'Laptop Gaming MSI',
        price: 2500000,
        description: 'Laptop gaming MSI, 16GB RAM, RTX 3060, 512GB SSD. Como nueva.',
        slug: 'laptop_gaming_msi',
        tags: ['tecnología', 'laptop', 'gaming'],
        images: [
          'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=500',
          'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=500',
          'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500',
          'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=500',
        ],
        modalityIndex: 0, // Venta
        locationIndex: 0, // Bogotá
      },
      {
        name: 'Juego de Ollas Acero',
        price: 0,
        description: 'Set de 5 ollas de acero inoxidable. Intercambio por artículos de cocina.',
        slug: 'juego_ollas_acero',
        tags: ['cocina', 'ollas', 'hogar'],
        images: [
          'https://images.unsplash.com/photo-1584990347449-39b4aa3a2b4f?w=500',
          'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=500',
          'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=500',
        ],
        modalityIndex: 2, // Intercambio
        locationIndex: 3, // Barranquilla
      },
      {
        name: 'Refrigerador Samsung',
        price: 1200000,
        description: 'Nevera Samsung No Frost, 420 litros, excelente estado, 2 años de uso.',
        slug: 'refrigerador_samsung',
        tags: ['electrodomésticos', 'nevera', 'cocina'],
        images: [
          'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=500',
          'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=500',
          'https://images.unsplash.com/photo-1588854337221-4cf9fa96059c?w=500',
        ],
        modalityIndex: 0, // Venta
        locationIndex: 4, // Cartagena
      },
      {
        name: 'Libros Universitarios',
        price: 0,
        description: 'Colección de libros de ingeniería. Donación para estudiantes.',
        slug: 'libros_universitarios',
        tags: ['libros', 'educación', 'universidad'],
        images: [
          'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=500',
          'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=500',
          'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=500',
          'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=500',
        ],
        modalityIndex: 1, // Donación
        locationIndex: 5, // Bucaramanga
      },
      {
        name: 'Consola PlayStation 5',
        price: 0,
        description: 'PS5 con 2 controles. Intercambio por Xbox Series X o Nintendo Switch.',
        slug: 'consola_playstation_5',
        tags: ['gaming', 'consola', 'videojuegos'],
        images: [
          'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=500',
          'https://images.unsplash.com/photo-1622297845775-5ff3fef71d13?w=500',
          'https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=500',
        ],
        modalityIndex: 2, // Intercambio
        locationIndex: 1, // Medellín
      },
      {
        name: 'Cama Queen Size',
        price: 550000,
        description: 'Cama queen size con colchón orthopedic, base en madera, impecable.',
        slug: 'cama_queen_size',
        tags: ['muebles', 'dormitorio', 'cama'],
        images: [
          'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=500',
          'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=500',
          'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=500',
        ],
        modalityIndex: 0, // Venta
        locationIndex: 2, // Cali
      },
      {
        name: 'Ropa de Bebé',
        price: 0,
        description: 'Lote de ropa de bebé de 0 a 12 meses, en muy buen estado.',
        slug: 'ropa_bebe',
        tags: ['bebé', 'ropa', 'infantil'],
        images: [
          'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=500',
          'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=500',
          'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=500',
          'https://images.unsplash.com/photo-1515488764276-beab7607c1e6?w=500',
        ],
        modalityIndex: 1, // Donación
        locationIndex: 0, // Bogotá
      },
    ];

    for (const productData of seedProducts) {
      const { images, modalityIndex, locationIndex, ...productDetails } = productData;

      const product = this.productRepository.create({
        ...productDetails,
        modality: modalities[modalityIndex],
        location: locations[locationIndex],
        images: images.map((url) =>
          this.productImageRepository.create({ url }),
        ),
      });

      await this.productRepository.save(product);
    }
  }
}
