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
import * as crypto from 'crypto';

import { User, UserImage } from './entities';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

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

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    try {
      const { email } = forgotPasswordDto;

      // Buscar usuario por email
      const user = await this.userRepository.findOne({
        where: { email },
        select: {
          id: true,
          email: true,
          nombres: true,
          apellidos: true,
          resetPasswordToken: true,
          resetPasswordExpires: true,
        },
      });

      // Por seguridad, siempre devolvemos el mismo mensaje aunque el usuario no exista
      if (!user) {
        return {
          message: 'Si el correo electrónico está registrado, recibirás un enlace para restablecer tu contraseña',
        };
      }

      // Generar token único
      const resetToken = crypto.randomBytes(32).toString('hex');
      
      // Hash del token para almacenarlo de forma segura
      const hashedToken = await bcrypt.hash(resetToken, 10);
      
      // El token expira en 1 hora
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);

      // Guardar token y fecha de expiración
      user.resetPasswordToken = hashedToken;
      user.resetPasswordExpires = expiresAt;
      
      await this.userRepository.save(user);

      // TODO: Aquí deberías enviar un email con el token
      // Por ahora, devolvemos el token en la respuesta (SOLO PARA DESARROLLO)
      this.logger.warn(`Token de recuperación para ${email}: ${resetToken}`);
      this.logger.warn(`Token expira en: ${expiresAt}`);

      return {
        message: 'Si el correo electrónico está registrado, recibirás un enlace para restablecer tu contraseña',
        // IMPORTANTE: En producción, NO devolver el token en la respuesta
        // Solo enviarlo por email. Esto es solo para desarrollo/pruebas
        token: resetToken, // Eliminar en producción
      };
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    try {
      const { token, newPassword, confirmPassword } = resetPasswordDto;

      // Validar que las contraseñas coincidan
      if (newPassword !== confirmPassword) {
        throw new BadRequestException('Las contraseñas no coinciden');
      }

      // Buscar usuario con token válido
      const users = await this.userRepository.find({
        select: {
          id: true,
          email: true,
          nombres: true,
          apellidos: true,
          resetPasswordToken: true,
          resetPasswordExpires: true,
        },
      });

      let userToReset: User | null = null;

      // Verificar el token contra todos los usuarios
      for (const user of users) {
        if (user.resetPasswordToken && user.resetPasswordExpires) {
          const isTokenValid = await bcrypt.compare(token, user.resetPasswordToken);
          
          if (isTokenValid) {
            // Verificar si el token no ha expirado
            if (new Date() > user.resetPasswordExpires) {
              throw new BadRequestException('El token de recuperación ha expirado. Solicita uno nuevo');
            }
            userToReset = user;
            break;
          }
        }
      }

      if (!userToReset) {
        throw new BadRequestException('Token de recuperación inválido o expirado');
      }

      // Encriptar nueva contraseña
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Actualizar contraseña y limpiar tokens
      userToReset.password = hashedPassword;
      userToReset.resetPasswordToken = undefined;
      userToReset.resetPasswordExpires = undefined;

      await this.userRepository.save(userToReset);

      return {
        message: 'Contraseña actualizada exitosamente. Ya puedes iniciar sesión con tu nueva contraseña',
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
