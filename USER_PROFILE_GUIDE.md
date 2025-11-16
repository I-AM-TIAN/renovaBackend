# 👤 Guía de Endpoints - Perfil de Usuario

## 📋 Estructura de Imágenes de Usuario

Las imágenes de usuario funcionan **exactamente igual que las imágenes de productos**:

- **Tabla separada**: `user_images` (similar a `product_images`)
- **Relación**: `OneToMany` desde User a UserImage
- **Campos en UserImage**:
  - `id`: ID único
  - `url`: URL de la imagen
  - `isProfileImage`: Boolean que indica si es la imagen de perfil principal
  - `userId`: Foreign key al usuario

### Ventajas de este diseño:
✅ Un usuario puede tener múltiples imágenes
✅ Una imagen marcada como principal (`isProfileImage: true`)
✅ Las imágenes se eliminan en cascada al eliminar el usuario
✅ Consistencia con el modelo de productos

---

## 🔌 Endpoints Disponibles

### 1. Obtener Perfil del Usuario

**Endpoint:**
```http
GET /api/auth/profile
Authorization: Bearer {token}
```

**Respuesta:**
```json
{
  "user": {
    "id": "uuid",
    "nombres": "Natalia",
    "apellidos": "García",
    "email": "natalia@example.com",
    "telefono": "3001234567",
    "roles": ["user"],
    "profileImage": "https://example.com/image.jpg",
    "ecopoints": 1450,
    "ecoStatus": "Embajador circular"
  }
}
```

---

### 2. Actualizar Perfil del Usuario

**Endpoint:**
```http
PATCH /api/auth/profile
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
  "nombres": "Natalia",
  "apellidos": "García Pérez",
  "telefono": "3001234567",
  "ecoStatus": "Embajador circular"
}
```

**Respuesta:**
```json
{
  "user": {
    "id": "uuid",
    "nombres": "Natalia",
    "apellidos": "García Pérez",
    "email": "natalia@example.com",
    "telefono": "3001234567",
    "roles": ["user"],
    "profileImage": "https://example.com/image.jpg",
    "ecopoints": 1450,
    "ecoStatus": "Embajador circular"
  }
}
```

**Notas:**
- Todos los campos son opcionales
- Solo se actualizan los campos enviados en el body
- No se puede cambiar el email desde este endpoint

---

### 3. Actualizar Foto de Perfil

**Endpoint:**
```http
PATCH /api/auth/profile/image
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
  "imageUrl": "https://example.com/nueva-imagen.jpg"
}
```

**Respuesta:**
```json
{
  "user": {
    "id": "uuid",
    "nombres": "Natalia",
    "apellidos": "García",
    "email": "natalia@example.com",
    "telefono": "3001234567",
    "roles": ["user"],
    "profileImage": "https://example.com/nueva-imagen.jpg",
    "ecopoints": 1450,
    "ecoStatus": "Embajador circular"
  }
}
```

---

## 📸 Flujo de Carga de Imagen

Para subir una imagen de perfil, hay dos opciones:

### Opción 1: Usar un servicio de almacenamiento externo (Recomendado)

1. **Frontend sube la imagen a un servicio** (Cloudinary, AWS S3, Firebase Storage, etc.)
2. **Obtiene la URL pública** de la imagen
3. **Envía la URL al backend** usando el endpoint `PATCH /api/auth/profile/image`

**Ejemplo con Cloudinary (desde el frontend):**
```javascript
// 1. Subir imagen a Cloudinary
const formData = new FormData();
formData.append('file', imageFile);
formData.append('upload_preset', 'tu_preset');

const response = await fetch('https://api.cloudinary.com/v1_1/tu_cloud_name/image/upload', {
  method: 'POST',
  body: formData
});

const data = await response.json();
const imageUrl = data.secure_url;

// 2. Actualizar en el backend
await fetch('/api/auth/profile/image', {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ imageUrl })
});
```

### Opción 2: Subir directamente al backend (Requiere configuración adicional)

Si prefieres que el backend maneje la carga de archivos, necesitarás:
- Instalar `multer` o similar
- Configurar almacenamiento (local o en la nube)
- Crear endpoint de upload

---

## 🔐 Autenticación Requerida

Todos los endpoints de perfil requieren autenticación mediante JWT. Debes incluir el token en el header:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 💡 Ejemplo Completo - React Native

```javascript
// Obtener perfil
const getProfile = async () => {
  const token = await AsyncStorage.getItem('token');
  const response = await fetch('http://localhost:3000/api/auth/profile', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await response.json();
  return data.user;
};

// Actualizar perfil
const updateProfile = async (profileData) => {
  const token = await AsyncStorage.getItem('token');
  const response = await fetch('http://localhost:3000/api/auth/profile', {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(profileData)
  });
  const data = await response.json();
  return data.user;
};

// Actualizar foto de perfil
const updateProfileImage = async (imageUrl) => {
  const token = await AsyncStorage.getItem('token');
  const response = await fetch('http://localhost:3000/api/auth/profile/image', {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ imageUrl })
  });
  const data = await response.json();
  return data.user;
};
```

---

## 🌐 Servicios de Almacenamiento de Imágenes Recomendados

1. **Cloudinary** (Gratuito hasta 25GB)
   - Fácil integración
   - Transformaciones de imagen automáticas
   - CDN global

2. **Firebase Storage** (Gratuito hasta 5GB)
   - Integración con Firebase Auth
   - SDK para React Native

3. **AWS S3** (Pago por uso)
   - Altamente escalable
   - Económico para grandes volúmenes

4. **ImgBB** (Gratuito)
   - API simple
   - Sin necesidad de cuenta en plan gratuito

---

## ⚠️ Notas Importantes

1. **Validación de URL**: El backend no valida si la URL es una imagen válida. Esto debe hacerse en el frontend.

2. **Seguridad**: Asegúrate de que las URLs de imágenes sean de fuentes confiables.

3. **Tamaño**: Considera implementar límites de tamaño de imagen en el servicio de almacenamiento.

4. **Formato**: Recomendado: JPEG, PNG, WebP.

5. **Caché**: Las URLs de imágenes deben incluir versionado o timestamps para evitar problemas de caché.
