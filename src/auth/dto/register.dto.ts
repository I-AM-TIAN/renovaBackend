import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {

    @IsString()
    @MinLength(1)
    nombres: string;

    @IsString()
    @MinLength(1)
    apellidos: string;

    @IsString()
    @MinLength(1)
    telefono: string;

    @IsString()
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(6)
    @MaxLength(50)
    @Matches(
        /(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
        message: 'La contraseña debe tener al menos una mayúscula, una minúscula y un número'
    })
    password: string;

    @IsString()
    @MinLength(6)
    @MaxLength(50)
    confirmPassword: string;
}
