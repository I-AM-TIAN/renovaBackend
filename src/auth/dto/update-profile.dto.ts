import { IsArray, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateProfileDto {

    @IsString()
    @IsOptional()
    @MinLength(2)
    nombres?: string;

    @IsString()
    @IsOptional()
    @MinLength(2)
    apellidos?: string;

    @IsString()
    @IsOptional()
    telefono?: string;

    @IsString({ each: true })
    @IsOptional()
    @IsArray()
    images?: string[];

    @IsString()
    @IsOptional()
    ecoStatus?: string;
}
