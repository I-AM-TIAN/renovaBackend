import { IsEnum } from 'class-validator';

export class UpdateProductStatusDto {
  @IsEnum(['disponible', 'reservado', 'no_disponible'], {
    message: 'El estado debe ser: disponible, reservado o no_disponible',
  })
  status: 'disponible' | 'reservado' | 'no_disponible';
}
