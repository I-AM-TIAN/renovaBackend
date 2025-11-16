import { IsOptional, IsString, MinLength } from "class-validator";

export class CreateLocationDto {

    @IsString()
    @MinLength(1)
    city: string;

    @IsString()
    @IsOptional()
    state?: string;

    @IsString()
    @IsOptional()
    country?: string;
}
