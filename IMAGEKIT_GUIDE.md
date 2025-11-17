# 📸 Guía de API - Subida de Imágenes con ImageKit

## Configuración Inicial

### 1. Variables de Entorno (.env)

```env
IMAGEKIT_PUBLIC_KEY=your_public_key_here
IMAGEKIT_PRIVATE_KEY=your_private_key_here
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_imagekit_id
```

**Obtener credenciales:**
1. Regístrate en [ImageKit.io](https://imagekit.io)
2. Ve a Developer Options en el dashboard
3. Copia tu Public Key, Private Key y URL Endpoint

---

## 📡 Endpoints Disponibles

### 1. Subir una Imagen (POST /files/upload)
**Autenticación:** ✅ Requerida (JWT Token)

**Request Body:**
```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "folder": "products"
}
```

**Campos:**
- `image` (requerido): Imagen en formato base64
- `folder` (opcional): Carpeta en ImageKit. Valores: `products`, `profiles`, `chat`, `general` (default: `general`)

**Respuesta exitosa:**
```json
{
  "url": "https://ik.imagekit.io/your_id/renova/products/1234567890_image.jpg",
  "fileId": "abc123def456",
  "name": "1234567890_image.jpg"
}
```

---

### 2. Subir Múltiples Imágenes (POST /files/upload-multiple)
**Autenticación:** ✅ Requerida (JWT Token)

**Request Body:**
```json
{
  "images": [
    "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
    "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
    "data:image/png;base64,iVBORw0KGgo..."
  ],
  "folder": "products"
}
```

**Respuesta exitosa:**
```json
[
  {
    "url": "https://ik.imagekit.io/your_id/renova/products/1234567890_image_0.jpg",
    "fileId": "abc123",
    "name": "1234567890_image_0.jpg"
  },
  {
    "url": "https://ik.imagekit.io/your_id/renova/products/1234567891_image_1.jpg",
    "fileId": "def456",
    "name": "1234567891_image_1.jpg"
  }
]
```

---

### 3. Obtener Parámetros de Autenticación (GET /files/auth)
**Autenticación:** ✅ Requerida (JWT Token)

Este endpoint devuelve los parámetros necesarios para subir imágenes directamente desde el frontend.

**Respuesta:**
```json
{
  "token": "unique-token",
  "expire": 1234567890,
  "signature": "signature-hash"
}
```

---

## 💻 Implementación Frontend

### Convertir imagen a Base64 (React Native)

```typescript
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

// 1. Seleccionar imagen
const pickImage = async () => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.8,
  });

  if (!result.canceled) {
    const base64 = await FileSystem.readAsStringAsync(result.assets[0].uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    // Agregar prefijo para el tipo de imagen
    const imageType = result.assets[0].uri.split('.').pop();
    const base64Image = `data:image/${imageType};base64,${base64}`;
    
    return base64Image;
  }
};

// 2. Subir imagen al backend
const uploadImage = async (base64Image: string, folder: string = 'general') => {
  try {
    const response = await fetch('http://tu-api/files/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        image: base64Image,
        folder: folder,
      }),
    });

    if (!response.ok) {
      throw new Error('Error al subir imagen');
    }

    const data = await response.json();
    return data.url; // URL de ImageKit
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

// 3. Subir múltiples imágenes
const uploadMultipleImages = async (images: string[], folder: string = 'general') => {
  try {
    const response = await fetch('http://tu-api/files/upload-multiple', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        images: images,
        folder: folder,
      }),
    });

    if (!response.ok) {
      throw new Error('Error al subir imágenes');
    }

    const data = await response.json();
    return data.map(img => img.url); // Array de URLs
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};
```

---

## 🎯 Uso Completo - Crear Producto con Imágenes

```typescript
const handleCreateProduct = async () => {
  try {
    // 1. Seleccionar imágenes
    const image1 = await pickImage();
    const image2 = await pickImage();
    const images = [image1, image2].filter(Boolean);

    // 2. Subir imágenes a ImageKit
    const uploadedUrls = await uploadMultipleImages(images, 'products');

    // 3. Crear producto con las URLs de ImageKit
    const productResponse = await fetch('http://tu-api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        name: 'Sofá moderno',
        description: 'Sofá en buen estado',
        price: 150000,
        location: 'Bogotá, Cundinamarca, Colombia',
        modality: 'Venta',
        images: uploadedUrls, // URLs de ImageKit
      }),
    });

    const product = await productResponse.json();
    console.log('Producto creado:', product);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

---

## 🎯 Uso - Actualizar Foto de Perfil

```typescript
const handleUpdateProfileImage = async () => {
  try {
    // 1. Seleccionar imagen
    const base64Image = await pickImage();

    // 2. Subir a ImageKit
    const imageUrl = await uploadImage(base64Image, 'profiles');

    // 3. Actualizar perfil con la URL
    const response = await fetch('http://tu-api/auth/profile/image', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        imageUrl: imageUrl,
      }),
    });

    const data = await response.json();
    console.log('Perfil actualizado:', data);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

---

## 📁 Estructura de Carpetas en ImageKit

Las imágenes se organizan automáticamente:

```
renova/
├── products/      # Imágenes de productos
├── profiles/      # Fotos de perfil
├── chat/          # Imágenes del chat
└── general/       # Otras imágenes
```

---

## 🔧 Transformaciones de ImageKit

ImageKit permite transformar imágenes en la URL:

```typescript
// Imagen original
const originalUrl = "https://ik.imagekit.io/your_id/renova/products/image.jpg";

// Redimensionar
const resizedUrl = "https://ik.imagekit.io/your_id/renova/products/image.jpg?tr=w-400,h-300";

// Recortar y comprimir
const optimizedUrl = "https://ik.imagekit.io/your_id/renova/products/image.jpg?tr=w-400,h-300,fo-auto,q-80";

// Thumbnail cuadrado
const thumbnailUrl = "https://ik.imagekit.io/your_id/renova/products/image.jpg?tr=w-200,h-200,c-at_max";
```

**Parámetros comunes:**
- `w-400` = ancho 400px
- `h-300` = alto 300px
- `q-80` = calidad 80%
- `fo-auto` = formato automático (WebP si es compatible)
- `c-at_max` = crop al máximo

---

## ✅ Ventajas de ImageKit

1. **CDN Global** - Imágenes rápidas en todo el mundo
2. **Optimización automática** - Reduce tamaño sin perder calidad
3. **Transformaciones en tiempo real** - Redimensiona sobre la marcha
4. **Backup automático** - No pierdes imágenes
5. **Sin límite de almacenamiento** en plan gratuito (hasta 20GB transferencia/mes)

---

## 📝 Notas Importantes

1. **Formato Base64**: Las imágenes deben incluir el prefijo `data:image/jpeg;base64,`
2. **Tamaño máximo**: ImageKit acepta hasta 25MB por imagen
3. **Formatos soportados**: JPG, PNG, GIF, WebP, SVG
4. **Rate Limit**: Plan gratuito permite 20 uploads/minuto
5. **Seguridad**: Los endpoints requieren autenticación JWT

---

## 🔐 Plan Recomendado

**Plan Gratuito:**
- ✅ 20GB transferencia/mes
- ✅ Almacenamiento ilimitado
- ✅ Transformaciones ilimitadas
- ✅ CDN global

**Para producción:** Considera el plan de pago si excedes 20GB/mes
