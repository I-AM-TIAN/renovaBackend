import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { User } from './entities';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger('AuthService');

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    try {
      const { password, confirmPassword, ...userData } = registerDto;

      // Validar que las contraseñas coincidan
      if (password !== confirmPassword) {
        throw new BadRequestException('Las contraseñas no coinciden');
      }

      // Verificar si el usuario ya existe
      const existingUser = await this.userRepository.findOne({
        where: { email: userData.email },
      });

      if (existingUser) {
        throw new BadRequestException('El correo electrónico ya está registrado');
      }

      // Encriptar contraseña
      const hashedPassword = await bcrypt.hash(password, 10);

      // Crear usuario
      const user = this.userRepository.create({
        ...userData,
        password: hashedPassword,
      });

      await this.userRepository.save(user);

      // Generar token
      const token = this.getJwtToken({ id: user.id });

      return {
        user: {
          id: user.id,
          nombres: user.nombres,
          apellidos: user.apellidos,
          email: user.email,
          telefono: user.telefono,
          roles: user.roles,
        },
        token,
      };
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async login(loginDto: LoginDto) {
    try {
      const { email, password } = loginDto;

      // Buscar usuario con password
      const user = await this.userRepository.findOne({
        where: { email },
        select: { id: true, email: true, password: true, nombres: true, apellidos: true, telefono: true, roles: true, isActive: true },
      });

      if (!user) {
        throw new UnauthorizedException('Credenciales inválidas (email)');
      }

      if (!user.isActive) {
        throw new UnauthorizedException('Usuario inactivo, contacte al administrador');
      }

      // Validar contraseña
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        throw new UnauthorizedException('Credenciales inválidas (password)');
      }

      // Generar token
      const token = this.getJwtToken({ id: user.id });

      return {
        user: {
          id: user.id,
          nombres: user.nombres,
          apellidos: user.apellidos,
          email: user.email,
          telefono: user.telefono,
          roles: user.roles,
        },
        token,
      };
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  private getJwtToken(payload: { id: string }) {
    const token = this.jwtService.sign(payload);
    return token;
  }

  async checkAuthStatus(user: User) {
    return {
      user: {
        id: user.id,
        nombres: user.nombres,
        apellidos: user.apellidos,
        email: user.email,
        telefono: user.telefono,
        roles: user.roles,
      },
      token: this.getJwtToken({ id: user.id }),
    };
  }

  private handleDBExceptions(error: any): never {
    if (error.code === '23505') {
      throw new BadRequestException(error.detail);
    }

    if (error instanceof BadRequestException || error instanceof UnauthorizedException) {
      throw error;
    }

    this.logger.error(error);
    throw new InternalServerErrorException('Error inesperado, revise los logs del servidor');
  }
}
