# 📸 Guía Frontend - Subida de Imágenes a ImageKit

## 🎯 Flujo Completo de Subida de Imágenes

### Paso 1: Instalar Dependencias (React Native)

```bash
npm install expo-image-picker expo-file-system
# o con yarn
yarn add expo-image-picker expo-file-system
```

---

## 📱 Implementación en React Native

### 1️⃣ Crear Servicio de Imágenes

Crea un archivo `services/imageService.ts`:

```typescript
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

const API_URL = 'http://tu-api-url'; // Reemplaza con tu URL

/**
 * Seleccionar imagen de la galería
 */
export const pickImageFromGallery = async (): Promise<string | null> => {
  try {
    // Pedir permisos
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      alert('Se necesita permiso para acceder a la galería');
      return null;
    }

    // Abrir galería
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5, // Comprimir al 50% (balance entre calidad y tamaño)
    });

    if (result.canceled) {
      return null;
    }

    // Convertir a base64
    const uri = result.assets[0].uri;
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Detectar tipo de imagen
    const imageType = uri.split('.').pop()?.toLowerCase() || 'jpeg';
    const mimeType = imageType === 'png' ? 'png' : 'jpeg';
    
    return `data:image/${mimeType};base64,${base64}`;
  } catch (error) {
    console.error('Error seleccionando imagen:', error);
    return null;
  }
};

/**
 * Tomar foto con la cámara
 */
export const takePhoto = async (): Promise<string | null> => {
  try {
    // Pedir permisos
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      alert('Se necesita permiso para usar la cámara');
      return null;
    }

    // Abrir cámara
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5, // Comprimir al 50%
    });

    if (result.canceled) {
      return null;
    }

    // Convertir a base64
    const uri = result.assets[0].uri;
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    return `data:image/jpeg;base64,${base64}`;
  } catch (error) {
    console.error('Error tomando foto:', error);
    return null;
  }
};

/**
 * Subir UNA imagen al servidor
 */
export const uploadImage = async (
  base64Image: string,
  token: string,
  folder: 'products' | 'profiles' | 'chat' | 'general' = 'general'
): Promise<string> => {
  try {
    const response = await fetch(`${API_URL}/files/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        image: base64Image,
        folder: folder,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al subir imagen');
    }

    const data = await response.json();
    return data.url; // URL de ImageKit
  } catch (error) {
    console.error('Error subiendo imagen:', error);
    throw error;
  }
};

/**
 * Subir MÚLTIPLES imágenes al servidor
 */
export const uploadMultipleImages = async (
  base64Images: string[],
  token: string,
  folder: 'products' | 'profiles' | 'chat' | 'general' = 'general'
): Promise<string[]> => {
  try {
    const response = await fetch(`${API_URL}/files/upload-multiple`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        images: base64Images,
        folder: folder,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al subir imágenes');
    }

    const data = await response.json();
    return data.map((img: any) => img.url); // Array de URLs
  } catch (error) {
    console.error('Error subiendo imágenes:', error);
    throw error;
  }
};
```

---

## 🎨 Ejemplo 1: Actualizar Foto de Perfil

```typescript
import React, { useState } from 'react';
import { View, TouchableOpacity, Image, Text, Alert } from 'react-native';
import { pickImageFromGallery, takePhoto, uploadImage } from './services/imageService';

const ProfileScreen = () => {
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const userToken = 'tu-jwt-token'; // Obtener del contexto/redux

  const handleSelectImage = () => {
    Alert.alert(
      'Seleccionar imagen',
      'Elige una opción',
      [
        {
          text: 'Galería',
          onPress: handleGallery,
        },
        {
          text: 'Cámara',
          onPress: handleCamera,
        },
        {
          text: 'Cancelar',
          style: 'cancel',
        },
      ]
    );
  };

  const handleGallery = async () => {
    try {
      setLoading(true);
      
      // 1. Seleccionar imagen
      const base64Image = await pickImageFromGallery();
      if (!base64Image) return;

      // 2. Subir a ImageKit
      const imageUrl = await uploadImage(base64Image, userToken, 'profiles');

      // 3. Actualizar perfil en el backend
      const response = await fetch('http://tu-api/auth/profile/image', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
        },
        body: JSON.stringify({ imageUrl }),
      });

      if (response.ok) {
        setProfileImage(imageUrl);
        Alert.alert('Éxito', 'Foto de perfil actualizada');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar la foto');
    } finally {
      setLoading(false);
    }
  };

  const handleCamera = async () => {
    try {
      setLoading(true);
      
      const base64Image = await takePhoto();
      if (!base64Image) return;

      const imageUrl = await uploadImage(base64Image, userToken, 'profiles');

      const response = await fetch('http://tu-api/auth/profile/image', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
        },
        body: JSON.stringify({ imageUrl }),
      });

      if (response.ok) {
        setProfileImage(imageUrl);
        Alert.alert('Éxito', 'Foto de perfil actualizada');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar la foto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <TouchableOpacity onPress={handleSelectImage}>
        {profileImage ? (
          <Image 
            source={{ uri: profileImage }} 
            style={{ width: 150, height: 150, borderRadius: 75 }}
          />
        ) : (
          <View style={{ 
            width: 150, 
            height: 150, 
            borderRadius: 75, 
            backgroundColor: '#ddd',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <Text>Subir foto</Text>
          </View>
        )}
      </TouchableOpacity>
      {loading && <Text>Subiendo imagen...</Text>}
    </View>
  );
};
```

---

## 🛍️ Ejemplo 2: Crear Producto con Múltiples Imágenes

```typescript
import React, { useState } from 'react';
import { View, TouchableOpacity, Image, Text, Alert, ScrollView } from 'react-native';
import { pickImageFromGallery, uploadMultipleImages } from './services/imageService';

const CreateProductScreen = () => {
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const userToken = 'tu-jwt-token';

  const handleAddImage = async () => {
    if (selectedImages.length >= 5) {
      Alert.alert('Límite alcanzado', 'Máximo 5 imágenes por producto');
      return;
    }

    const base64Image = await pickImageFromGallery();
    if (base64Image) {
      setSelectedImages([...selectedImages, base64Image]);
    }
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
  };

  const handleCreateProduct = async () => {
    try {
      setLoading(true);

      // 1. Subir imágenes a ImageKit
      let imageUrls: string[] = [];
      if (selectedImages.length > 0) {
        imageUrls = await uploadMultipleImages(selectedImages, userToken, 'products');
      }

      // 2. Crear producto con las URLs de las imágenes
      const response = await fetch('http://tu-api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          name: 'Sofá moderno gris',
          description: 'Sofá en excelente estado',
          price: 150000,
          location: 'Bogotá, Cundinamarca, Colombia',
          modality: 'Venta',
          images: imageUrls, // URLs de ImageKit
        }),
      });

      if (response.ok) {
        Alert.alert('Éxito', 'Producto creado exitosamente');
        // Navegar a otra pantalla
      } else {
        const error = await response.json();
        Alert.alert('Error', error.message);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo crear el producto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={{ padding: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
        Imágenes del producto ({selectedImages.length}/5)
      </Text>

      {/* Mostrar imágenes seleccionadas */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {selectedImages.map((image, index) => (
          <View key={index} style={{ marginRight: 10 }}>
            <Image 
              source={{ uri: image }} 
              style={{ width: 100, height: 100, borderRadius: 10 }}
            />
            <TouchableOpacity 
              onPress={() => handleRemoveImage(index)}
              style={{ 
                position: 'absolute', 
                top: 5, 
                right: 5, 
                backgroundColor: 'red',
                borderRadius: 15,
                width: 30,
                height: 30,
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <Text style={{ color: 'white' }}>X</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* Botón para agregar más imágenes */}
        {selectedImages.length < 5 && (
          <TouchableOpacity 
            onPress={handleAddImage}
            style={{ 
              width: 100, 
              height: 100, 
              borderRadius: 10,
              borderWidth: 2,
              borderStyle: 'dashed',
              borderColor: '#ccc',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <Text style={{ fontSize: 40 }}>+</Text>
            <Text>Agregar</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Botón crear producto */}
      <TouchableOpacity 
        onPress={handleCreateProduct}
        disabled={loading || selectedImages.length === 0}
        style={{ 
          backgroundColor: loading ? '#ccc' : '#4CAF50',
          padding: 15,
          borderRadius: 10,
          marginTop: 20,
          alignItems: 'center'
        }}
      >
        <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
          {loading ? 'Creando producto...' : 'Crear Producto'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};
```

---

## 💬 Ejemplo 3: Enviar Imagen en Chat

```typescript
import React, { useState } from 'react';
import { View, TouchableOpacity, Text, Alert } from 'react-native';
import { pickImageFromGallery, uploadImage } from './services/imageService';

const ChatScreen = () => {
  const [loading, setLoading] = useState(false);
  const userToken = 'tu-jwt-token';
  const conversationId = 'uuid-conversation';

  const handleSendImage = async () => {
    try {
      setLoading(true);

      // 1. Seleccionar imagen
      const base64Image = await pickImageFromGallery();
      if (!base64Image) return;

      // 2. Subir a ImageKit
      const imageUrl = await uploadImage(base64Image, userToken, 'chat');

      // 3. Enviar mensaje con la imagen
      // Usar WebSocket para enviar en tiempo real
      socket.emit('sendMessage', {
        conversationId: conversationId,
        message: imageUrl, // URL de la imagen
        senderId: 'user-id',
      });

      Alert.alert('Éxito', 'Imagen enviada');
    } catch (error) {
      Alert.alert('Error', 'No se pudo enviar la imagen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <TouchableOpacity onPress={handleSendImage} disabled={loading}>
        <Text>{loading ? 'Enviando...' : '📷 Enviar Imagen'}</Text>
      </TouchableOpacity>
    </View>
  );
};
```

---

## 🔧 Configuración Recomendada

### app.json (Expo)

```json
{
  "expo": {
    "plugins": [
      [
        "expo-image-picker",
        {
          "photosPermission": "La aplicación necesita acceso a tus fotos para subir imágenes.",
          "cameraPermission": "La aplicación necesita acceso a la cámara para tomar fotos."
        }
      ]
    ]
  }
}
```

---

## ⚡ Optimizaciones

### 1. Comprimir imagen antes de subir

```typescript
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

const compressImage = async (uri: string) => {
  const manipResult = await manipulateAsync(
    uri,
    [{ resize: { width: 1024 } }], // Redimensionar a máximo 1024px de ancho
    { compress: 0.5, format: SaveFormat.JPEG } // Comprimir al 50%
  );
  
  return manipResult.uri;
};
```

### 2. Límites importantes

**⚠️ El backend acepta hasta 50MB por petición**
- Una imagen comprimida al 50% de calidad pesa ~500KB-1MB en base64
- Puedes subir hasta **5-6 imágenes** en una sola petición
- Si subes más imágenes, hazlo en lotes de 5

**Recomendaciones:**
- Para productos: máximo 5 imágenes por petición
- Para perfiles: 1 imagen a la vez
- Usa `quality: 0.5` como balance entre calidad y tamaño
- Si necesitas mejor calidad, usa `quality: 0.7` pero sube menos imágenes

### 3. Mostrar progreso de subida

```typescript
const [uploadProgress, setUploadProgress] = useState(0);

// Simular progreso (o usar XMLHttpRequest para progreso real)
const uploadWithProgress = async (base64Image: string) => {
  setUploadProgress(0);
  
  // Simular progreso
  const interval = setInterval(() => {
    setUploadProgress(prev => Math.min(prev + 10, 90));
  }, 100);

  try {
    const url = await uploadImage(base64Image, token, 'products');
    setUploadProgress(100);
    clearInterval(interval);
    return url;
  } catch (error) {
    clearInterval(interval);
    throw error;
  }
};
```

---

## ✅ Checklist de Implementación

- [ ] Instalar `expo-image-picker` y `expo-file-system`
- [ ] Configurar permisos en `app.json`
- [ ] Crear servicio de imágenes (`imageService.ts`)
- [ ] Reemplazar `API_URL` con tu URL real
- [ ] Obtener token JWT del usuario autenticado
- [ ] Implementar selección de imágenes en tus pantallas
- [ ] Manejar estados de carga (loading)
- [ ] Manejar errores con alertas
- [ ] Probar en dispositivo real (no solo simulador)

---

## 🚨 Errores Comunes

### Error: "request entity too large" o "Payload too large"
- **Causa:** La imagen en base64 supera el límite de 50MB del servidor
- **Solución:** 
  - Reduce la calidad a `0.3` o `0.4` en el image picker
  - Sube menos imágenes por petición (máximo 5)
  - Redimensiona las imágenes antes de convertirlas a base64

### Error: "Unauthorized"
- **Causa:** Token JWT inválido o no enviado
- **Solución:** Verifica que estás enviando el token en el header Authorization

### Error: "Formato de imagen inválido"
- **Causa:** Base64 no tiene el prefijo correcto
- **Solución:** Asegúrate de que la imagen tenga `data:image/jpeg;base64,` al inicio

### Imagen no se muestra
- **Causa:** URL de ImageKit incorrecta
- **Solución:** Verifica que configuraste correctamente las credenciales en el backend

### Error de permisos
- **Causa:** No se solicitaron permisos de cámara/galería
- **Solución:** Usa `requestMediaLibraryPermissionsAsync()` y `requestCameraPermissionsAsync()`

### Imágenes suben muy lento
- **Causa:** Calidad muy alta o muchas imágenes
- **Solución:**
  - Usa `quality: 0.4` o `0.5` máximo
  - Redimensiona con `expo-image-manipulator` antes de subir
  - Sube en lotes de 3-4 imágenes en lugar de 5-6

---

## 📞 Endpoints del Backend

- `POST /files/upload` - Subir una imagen
- `POST /files/upload-multiple` - Subir múltiples imágenes
- `GET /files/auth` - Obtener parámetros de autenticación

**Todas requieren autenticación JWT en el header:**
```
Authorization: Bearer {token}
```

---

## 🎯 Resultado Final

Después de implementar esto, tu aplicación podrá:
- ✅ Seleccionar imágenes de la galería
- ✅ Tomar fotos con la cámara
- ✅ Subir imágenes a ImageKit (CDN)
- ✅ Recibir URLs optimizadas
- ✅ Usar las URLs en productos, perfiles y chat
- ✅ Las imágenes se cargan rápido desde cualquier lugar del mundo

¡Todo listo para subir imágenes! 🚀
