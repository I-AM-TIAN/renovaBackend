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

import { User, UserImage } from './entities';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger('AuthService');

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(UserImage)
    private readonly userImageRepository: Repository<UserImage>,

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
        user: this.getUserResponse(user),
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
        select: { 
          id: true, 
          email: true, 
          password: true, 
          nombres: true, 
          apellidos: true, 
          telefono: true, 
          roles: true, 
          isActive: true,
          ecopoints: true,
          ecoStatus: true,
        },
        relations: { images: true },
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
        user: this.getUserResponse(user),
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

  private getUserResponse(user: User) {
    const profileImage = user.images?.find(img => img.isProfileImage)?.url || null;
    const images = user.images?.map(img => img.url) || [];

    return {
      id: user.id,
      nombres: user.nombres,
      apellidos: user.apellidos,
      email: user.email,
      telefono: user.telefono,
      roles: user.roles,
      profileImage,
      images,
      ecopoints: user.ecopoints,
      ecoStatus: user.ecoStatus,
    };
  }

  async checkAuthStatus(user: User) {
    return {
      user: this.getUserResponse(user),
      token: this.getJwtToken({ id: user.id }),
    };
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    try {
      const user = await this.userRepository.findOneBy({ id: userId });

      if (!user) {
        throw new BadRequestException('Usuario no encontrado');
      }

      // Actualizar campos
      Object.assign(user, updateProfileDto);

      await this.userRepository.save(user);

      return {
        user: this.getUserResponse(user),
      };
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async updateProfileImage(userId: string, imageUrl: string) {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
        relations: { images: true },
      });

      if (!user) {
        throw new BadRequestException('Usuario no encontrado');
      }

      // Marcar todas las imágenes actuales como no-perfil
      if (user.images) {
        user.images.forEach(img => img.isProfileImage = false);
      }

      // Crear nueva imagen de perfil
      const newImage = this.userImageRepository.create({
        url: imageUrl,
        isProfileImage: true,
      });

      if (!user.images) {
        user.images = [];
      }

      user.images.push(newImage);
      await this.userRepository.save(user);

      return {
        user: this.getUserResponse(user),
      };
    } catch (error) {
      this.handleDBExceptions(error);
    }
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
