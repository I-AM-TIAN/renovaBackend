import { IsArray, IsNumber, IsOptional, IsPositive, IsString, IsUUID, MinLength } from "class-validator";

export class CreateProductDto {

    @IsString()
    @MinLength(1)
    name?: string;

    @IsNumber()
    @IsPositive()
    @IsOptional()
    price?: number;

    @IsString()
    @MinLength(1)
    description?: string;

    @IsString()
    @IsOptional()
    slug?: string;

    @IsString({ each: true })
    @IsOptional()
    @IsArray()
    tags?: string[];

    @IsString({ each: true })
    @IsOptional()
    @IsArray()
    images?: string[];

    @IsUUID()
    locationId: string;

    @IsUUID()
    modalityId: string;
}