import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    try {
      const client: Socket = context.switchToWs().getClient<Socket>();
      
      // Intentar obtener token del handshake
      const token = 
        client.handshake?.auth?.token || 
        client.handshake?.headers?.authorization?.split(' ')[1];

      if (!token) {
        throw new WsException('Token no proporcionado');
      }

      // Verificar token
      const payload = this.jwtService.verify(token);
      
      // Agregar userId al cliente para uso posterior
      client.data.userId = payload.id;
      
      return true;
    } catch (err) {
      throw new WsException('Token inválido o expirado');
    }
  }
}
