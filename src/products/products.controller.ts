import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe, Query, UseGuards } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PaginationDto } from './../common/dtos/pagination.dto';
import { CreateLocationDto } from './dto/create-location.dto';
import { CreateModalityDto } from './dto/create-modality.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators';
import { User } from '../auth/entities';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Body() createProductDto: CreateProductDto,
    @GetUser() user: User,
  ) {
    return this.productsService.create(createProductDto, user);
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.productsService.findAll( paginationDto );
  }

  @Get(':term')
  findOne(@Param( 'term' ) term: string) {
    return this.productsService.findOnePlain(term);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update( id, updateProductDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.remove( id );
  }

  // Endpoints para Locations
  @Post('locations')
  createLocation(@Body() createLocationDto: CreateLocationDto) {
    return this.productsService.createLocation(createLocationDto);
  }

  @Get('locations/all')
  findAllLocations() {
    return this.productsService.findAllLocations();
  }

  @Get('locations/:id')
  findLocationById(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.findLocationById(id);
  }

  // Endpoints para Modalities
  @Post('modalities')
  createModality(@Body() createModalityDto: CreateModalityDto) {
    return this.productsService.createModality(createModalityDto);
  }

  @Get('modalities/all')
  findAllModalities() {
    return this.productsService.findAllModalities();
  }

  @Get('modalities/:id')
  findModalityById(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.findModalityById(id);
  }
}
