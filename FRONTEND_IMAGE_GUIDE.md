# 📸 Guía para Frontend - Sistema de Imágenes de Usuario

## 🎯 Importante: Cambio en el Manejo de Imágenes

Hola equipo de frontend! Les explico cómo funciona ahora el sistema de imágenes de usuario en el backend.

---

## 🗄️ Cómo se Guardan las Imágenes

Las imágenes de usuario funcionan **exactamente igual que las imágenes de productos**:

❌ **NO se guarda la URL directamente en el usuario**

✅ **Se usa una tabla separada** `user_images` (igual que `product_images`)

✅ **Un usuario puede tener múltiples imágenes**

✅ **Una imagen se marca como principal** con `isProfileImage: true`

---

## 📊 Respuesta de la API

Cuando hagan cualquier petición de perfil (login, register, get profile), recibirán esto:

```json
{
  "user": {
    "id": "uuid-123",
    "nombres": "Natalia",
    "apellidos": "García",
    "email": "natalia@ejemplo.com",
    "telefono": "3001234567",
    "roles": ["user"],
    
    // ⭐ FOTO PRINCIPAL (la más reciente marcada como principal)
    "profileImage": "https://ejemplo.com/foto-principal.jpg",
    
    // 📷 TODAS LAS FOTOS del usuario (historial)
    "images": [
      "https://ejemplo.com/foto1.jpg",
      "https://ejemplo.com/foto2.jpg",
      "https://ejemplo.com/foto-principal.jpg"
    ],
    
    "ecopoints": 1450,
    "ecoStatus": "Embajador circular"
  }
}
```

---

## 🔄 Cómo Actualizar la Foto de Perfil

### Paso 1: Usuario selecciona la imagen

```javascript
// React Native - ImagePicker
import * as ImagePicker from 'expo-image-picker';

const pickImage = async () => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (!result.canceled) {
    return result.assets[0].uri;
  }
};
```

### Paso 2: Subir a Cloudinary (o el servicio que usen)

```javascript
const uploadImageToCloudinary = async (imageUri) => {
  const formData = new FormData();
  formData.append('file', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'profile.jpg',
  });
  formData.append('upload_preset', 'tu_preset_name');

  const response = await fetch(
    'https://api.cloudinary.com/v1_1/tu_cloud_name/image/upload',
    {
      method: 'POST',
      body: formData,
    }
  );

  const data = await response.json();
  return data.secure_url; // URL de la imagen subida
};
```

### Paso 3: Enviar URL al backend

```javascript
const updateProfileImage = async (imageUrl) => {
  const token = await AsyncStorage.getItem('token');
  
  const response = await fetch('http://tu-api.com/api/auth/profile/image', {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ imageUrl })
  });

  const data = await response.json();
  return data.user; // Usuario actualizado con nueva foto
};
```

### Flujo Completo:

```javascript
const handleUpdatePhoto = async () => {
  try {
    // 1. Seleccionar imagen
    const imageUri = await pickImage();
    if (!imageUri) return;

    // 2. Subir a Cloudinary
    setUploading(true);
    const imageUrl = await uploadImageToCloudinary(imageUri);

    // 3. Actualizar en backend
    const updatedUser = await updateProfileImage(imageUrl);

    // 4. Actualizar estado local
    setUser(updatedUser);
    
    Alert.alert('¡Éxito!', 'Foto actualizada correctamente');
  } catch (error) {
    Alert.alert('Error', 'No se pudo actualizar la foto');
  } finally {
    setUploading(false);
  }
};
```

---

## ✨ Qué Hace el Backend Automáticamente

Cuando envían la URL de la nueva foto:

1. ✅ Marca todas las fotos anteriores como `isProfileImage: false`
2. ✅ Crea una nueva entrada en `user_images` con la URL
3. ✅ Marca la nueva foto como `isProfileImage: true`
4. ✅ **Mantiene las fotos anteriores** (se crea un historial)

---

## 💡 Cómo Mostrar en la UI

### Avatar del Usuario:

```javascript
import { Avatar } from 'react-native-paper';

<Avatar.Image 
  size={80}
  source={{ 
    uri: user.profileImage || 'https://via.placeholder.com/150' 
  }}
/>
```

### Con Placeholder por Defecto:

```javascript
const getAvatarSource = (user) => {
  if (user.profileImage) {
    return { uri: user.profileImage };
  }
  // Imagen por defecto
  return require('./assets/default-avatar.png');
};

<Avatar.Image size={80} source={getAvatarSource(user)} />
```

### Galería de Fotos (Opcional):

Si quieren mostrar todas las fotos del usuario:

```javascript
<FlatList
  data={user.images}
  horizontal
  keyExtractor={(item, index) => index.toString()}
  renderItem={({ item }) => (
    <Image 
      source={{ uri: item }} 
      style={{ width: 80, height: 80, marginRight: 8 }}
    />
  )}
/>
```

---

## ⚠️ Casos Especiales

### Usuario sin foto de perfil:

```javascript
// profileImage será null
// images será un array vacío []

if (!user.profileImage) {
  // Mostrar avatar por defecto
  return <Avatar.Icon size={80} icon="account" />;
}
```

### Usuario con múltiples fotos:

```javascript
// profileImage: foto principal (la más reciente)
// images: array con todas las fotos

console.log(user.profileImage); // "https://...foto-principal.jpg"
console.log(user.images.length); // 3
```

---

## 📱 Ejemplo Completo - Componente ProfileScreen

```javascript
import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Avatar, Button } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ProfileScreen = () => {
  const [user, setUser] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const token = await AsyncStorage.getItem('token');
    const response = await fetch('http://tu-api.com/api/auth/profile', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    setUser(data.user);
  };

  const handleUpdatePhoto = async () => {
    try {
      // 1. Seleccionar imagen
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled) return;

      setUploading(true);

      // 2. Subir a Cloudinary
      const formData = new FormData();
      formData.append('file', {
        uri: result.assets[0].uri,
        type: 'image/jpeg',
        name: 'profile.jpg',
      });
      formData.append('upload_preset', 'tu_preset');

      const uploadResponse = await fetch(
        'https://api.cloudinary.com/v1_1/tu_cloud/image/upload',
        { method: 'POST', body: formData }
      );
      const { secure_url } = await uploadResponse.json();

      // 3. Actualizar en backend
      const token = await AsyncStorage.getItem('token');
      const updateResponse = await fetch('http://tu-api.com/api/auth/profile/image', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ imageUrl: secure_url })
      });

      const data = await updateResponse.json();
      setUser(data.user);
      
      Alert.alert('¡Éxito!', 'Foto actualizada correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar la foto');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  if (!user) return <ActivityIndicator />;

  return (
    <View style={{ padding: 20, alignItems: 'center' }}>
      <TouchableOpacity onPress={handleUpdatePhoto} disabled={uploading}>
        <Avatar.Image 
          size={120}
          source={{ 
            uri: user.profileImage || 'https://via.placeholder.com/150' 
          }}
        />
        {uploading && (
          <ActivityIndicator 
            style={{ position: 'absolute', alignSelf: 'center', top: 45 }}
          />
        )}
      </TouchableOpacity>

      <Text style={{ fontSize: 24, marginTop: 16 }}>
        {user.nombres} {user.apellidos}
      </Text>
      
      <Text style={{ color: 'gray' }}>
        ⭐ {user.ecopoints} Ecopuntos
      </Text>
      
      <Text style={{ color: 'green' }}>
        🌿 {user.ecoStatus || 'Usuario'}
      </Text>

      <Button 
        mode="contained" 
        onPress={handleUpdatePhoto}
        disabled={uploading}
        style={{ marginTop: 20 }}
      >
        {uploading ? 'Subiendo...' : 'Cambiar Foto'}
      </Button>
    </View>
  );
};

export default ProfileScreen;
```

---

## 🎨 Recomendaciones

### 1. Siempre usa `profileImage` para el avatar:
```javascript
// ✅ Correcto
<Avatar source={{ uri: user.profileImage }} />

// ❌ Incorrecto (images es un array)
<Avatar source={{ uri: user.images }} />
```

### 2. Valida si hay foto:
```javascript
const avatarUri = user.profileImage || 'https://placeholder.com/default.jpg';
```

### 3. Optimiza las imágenes antes de subir:
```javascript
// En ImagePicker
quality: 0.8, // Reduce calidad al 80%
allowsEditing: true, // Permite recortar
aspect: [1, 1], // Aspecto cuadrado
```

### 4. Muestra feedback durante la carga:
```javascript
{uploading && <ActivityIndicator />}
<Button disabled={uploading}>
  {uploading ? 'Subiendo...' : 'Cambiar Foto'}
</Button>
```

---

## 🔗 Endpoints Relacionados

```javascript
// Obtener perfil
GET /api/auth/profile
Headers: { Authorization: Bearer {token} }

// Actualizar perfil (nombre, teléfono, etc)
PATCH /api/auth/profile
Body: { nombres, apellidos, telefono, ecoStatus }

// Actualizar foto
PATCH /api/auth/profile/image
Body: { imageUrl: "https://..." }

// Login (también devuelve profileImage e images)
POST /api/auth/login
Body: { email, password }

// Register (también devuelve profileImage e images)
POST /api/auth/register
Body: { nombres, apellidos, email, password, ... }
```

---

## ❓ Preguntas Frecuentes

**Q: ¿Qué pasa si el usuario nunca ha subido foto?**
- `profileImage` será `null`
- `images` será un array vacío `[]`

**Q: ¿Se pueden tener múltiples fotos?**
- Sí! Cada vez que suban una foto nueva, se agrega al array `images`
- La más reciente se marca como `profileImage`

**Q: ¿Se eliminan las fotos antiguas?**
- No! Se mantienen en el array `images` como historial
- Solo cambia cuál es la principal

**Q: ¿Dónde subo las imágenes?**
- **Recomendado**: Cloudinary, Firebase Storage, AWS S3
- El backend solo guarda las URLs, no los archivos

**Q: ¿Qué formato de imagen usar?**
- JPEG, PNG, WebP
- Recomendado: JPEG con quality 0.7-0.8

---

## 🚀 ¡Listo para Implementar!

Si tienen dudas o necesitan ayuda con la integración, no duden en preguntar.

**Documentación completa**: Ver `USER_PROFILE_GUIDE.md`
