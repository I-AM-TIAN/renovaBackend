# Módulo de Autenticación

## Endpoints

### 1. Registro de Usuario
**POST** `/auth/register`

**Body:**
```json
{
  "nombres": "Juan",
  "apellidos": "Pérez",
  "telefono": "1234567890",
  "email": "juan@example.com",
  "password": "Password123",
  "confirmPassword": "Password123"
}
```

**Respuesta exitosa:**
```json
{
  "user": {
    "id": "uuid",
    "nombres": "Juan",
    "apellidos": "Pérez",
    "email": "juan@example.com",
    "telefono": "1234567890",
    "roles": ["user"]
  },
  "token": "jwt-token"
}
```

### 2. Inicio de Sesión
**POST** `/auth/login`

**Body:**
```json
{
  "email": "juan@example.com",
  "password": "Password123"
}
```

**Respuesta exitosa:**
```json
{
  "user": {
    "id": "uuid",
    "nombres": "Juan",
    "apellidos": "Pérez",
    "email": "juan@example.com",
    "telefono": "1234567890",
    "roles": ["user"]
  },
  "token": "jwt-token"
}
```

### 3. Obtener Perfil (Requiere autenticación)
**GET** `/auth/profile`

**Headers:**
```
Authorization: Bearer {token}
```

**Respuesta exitosa:**
```json
{
  "user": {
    "id": "uuid",
    "nombres": "Juan",
    "apellidos": "Pérez",
    "email": "juan@example.com",
    "telefono": "1234567890",
    "roles": ["user"]
  }
}
```

### 4. Verificar Estado de Autenticación (Requiere autenticación)
**GET** `/auth/check-status`

**Headers:**
```
Authorization: Bearer {token}
```

**Respuesta exitosa:**
```json
{
  "user": {
    "id": "uuid",
    "nombres": "Juan",
    "apellidos": "Pérez",
    "email": "juan@example.com",
    "telefono": "1234567890",
    "roles": ["user"]
  },
  "token": "nuevo-jwt-token"
}
```

## Validaciones

### Password
- Mínimo 6 caracteres
- Máximo 50 caracteres
- Debe contener al menos:
  - Una letra mayúscula
  - Una letra minúscula
  - Un número

### Email
- Debe ser un email válido
- Se convierte automáticamente a minúsculas

## Uso del Guard de Autenticación

Para proteger rutas en otros controladores:

```typescript
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators';
import { User } from '../auth/entities';

@Controller('example')
export class ExampleController {
  
  @Get('protected')
  @UseGuards(JwtAuthGuard)
  protectedRoute(@GetUser() user: User) {
    return { message: 'Ruta protegida', userId: user.id };
  }
}
```

## Variables de Entorno

Agregar en el archivo `.env`:

```env
JWT_SECRET=tu_secreto_super_seguro_aqui
```
