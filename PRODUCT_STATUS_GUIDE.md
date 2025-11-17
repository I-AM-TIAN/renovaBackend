# 📦 Gestión de Estados de Productos

## 🎯 Estados Disponibles

Tu app maneja 3 estados para los productos:

### 1. **Disponible** 🟢
- El producto **es visible** en listados públicos
- Otros usuarios **pueden contactar** al vendedor
- Color: Verde
- Valor en API: `"disponible"`

### 2. **Reservado** 🟠
- El producto **es visible** en listados públicos
- Otros usuarios **NO pueden contactar** al vendedor
- Se usa cuando ya tienes un comprador interesado
- Color: Naranja
- Valor en API: `"reservado"`

### 3. **No Disponible** 🔴
- El producto **NO es visible** en listados públicos
- Solo el dueño lo ve en "Mis productos"
- Se usa cuando el producto ya se vendió
- Color: Rojo
- Valor en API: `"no_disponible"`

---

## 📡 Endpoints del Backend

### 1. Obtener Mis Productos (Todos los estados)

```http
GET /api/products/my-products?limit=10&offset=0
```

**Headers:**
```
Authorization: Bearer {token}
```

**Respuesta:**
```json
[
  {
    "id": "uuid",
    "name": "Sofá Moderno Gris",
    "description": "...",
    "price": 450000,
    "status": "disponible",
    "location": {
      "city": "Bogotá",
      "state": "Cundinamarca",
      "country": "Colombia"
    },
    "modality": {
      "name": "Venta"
    },
    "images": ["url1", "url2"],
    "user": { ... }
  }
]
```

---

### 2. Actualizar Estado del Producto

```http
PATCH /api/products/{productId}/status
```

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
  "status": "reservado"
}
```

**Valores válidos:**
- `"disponible"`
- `"reservado"`
- `"no_disponible"`

**Respuesta exitosa:**
```json
{
  "id": "uuid",
  "name": "Sofá Moderno Gris",
  "status": "reservado",
  "message": "Estado actualizado a: reservado"
}
```

**Errores posibles:**
- `400 Bad Request` - No eres el dueño del producto
- `404 Not Found` - Producto no encontrado
- `400 Bad Request` - Estado inválido

---

### 3. Obtener Productos Públicos (Solo disponibles y reservados)

```http
GET /api/products?limit=10&offset=0
```

**Sin autenticación requerida**

Este endpoint automáticamente filtra productos con estado `"no_disponible"`.

---

## 🚫 Validación en Chat

Cuando un usuario intenta contactar al vendedor de un producto:

### Producto Disponible ✅
```
Usuario puede crear conversación normalmente
```

### Producto Reservado ⚠️
```
Error 400: "Este producto está reservado. No se puede iniciar una conversación."

EXCEPCIÓN: Si ya existe una conversación previa, puede seguir chateando
```

### Producto No Disponible ❌
```
Error 400: "Este producto no está disponible."
```

---

## 💻 Implementación en React Native

### Componente: Lista de Mis Productos

```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image } from 'react-native';

const MyProductsScreen = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const token = 'tu-jwt-token'; // Desde contexto/redux

  useEffect(() => {
    loadMyProducts();
  }, []);

  const loadMyProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://tu-api/api/products/my-products', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error cargando productos:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProductStatus = async (productId: string, newStatus: string) => {
    try {
      const response = await fetch(`http://tu-api/api/products/${productId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        // Actualizar lista
        loadMyProducts();
        alert('Estado actualizado exitosamente');
      } else {
        const error = await response.json();
        alert(error.message);
      }
    } catch (error) {
      alert('Error al actualizar estado');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'disponible': return '#4CAF50'; // Verde
      case 'reservado': return '#FF9800';   // Naranja
      case 'no_disponible': return '#F44336'; // Rojo
      default: return '#999';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'disponible': return 'Disponible';
      case 'reservado': return 'Reservado';
      case 'no_disponible': return 'No disponible';
      default: return status;
    }
  };

  const renderProduct = ({ item }) => (
    <View style={{ padding: 15, backgroundColor: 'white', marginBottom: 10, borderRadius: 10 }}>
      <View style={{ flexDirection: 'row' }}>
        {/* Imagen */}
        <Image 
          source={{ uri: item.images[0] || 'placeholder' }} 
          style={{ width: 80, height: 80, borderRadius: 10 }}
        />

        {/* Información */}
        <View style={{ flex: 1, marginLeft: 15 }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold' }}>{item.name}</Text>
          <Text style={{ color: '#666' }}>
            {item.location.city}, {item.location.state}
          </Text>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginTop: 5 }}>
            ${item.price.toLocaleString()}
          </Text>

          {/* Dropdown de estados */}
          <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
              onPress={() => {
                // Mostrar menú de estados (puedes usar un modal o action sheet)
                showStatusMenu(item.id);
              }}
              style={{
                backgroundColor: getStatusColor(item.status),
                paddingHorizontal: 15,
                paddingVertical: 8,
                borderRadius: 20,
                flexDirection: 'row',
                alignItems: 'center'
              }}
            >
              <Text style={{ color: 'white', fontWeight: 'bold' }}>
                {getStatusText(item.status)}
              </Text>
              <Text style={{ color: 'white', marginLeft: 5 }}>▼</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Botón Eliminar */}
      <TouchableOpacity
        onPress={() => deleteProduct(item.id)}
        style={{ marginTop: 10, alignSelf: 'flex-end' }}
      >
        <Text style={{ color: '#F44336', fontWeight: 'bold' }}>Eliminar</Text>
      </TouchableOpacity>
    </View>
  );

  const showStatusMenu = (productId: string) => {
    // Puedes usar ActionSheetIOS, Alert con opciones, o un modal
    Alert.alert(
      'Cambiar estado',
      'Selecciona el nuevo estado del producto',
      [
        {
          text: '🟢 Disponible',
          onPress: () => updateProductStatus(productId, 'disponible'),
        },
        {
          text: '🟠 Reservado',
          onPress: () => updateProductStatus(productId, 'reservado'),
        },
        {
          text: '🔴 No disponible',
          onPress: () => updateProductStatus(productId, 'no_disponible'),
        },
        {
          text: 'Cancelar',
          style: 'cancel',
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', padding: 20 }}>
        Historial de publicaciones
      </Text>
      
      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        refreshing={loading}
        onRefresh={loadMyProducts}
        contentContainerStyle={{ padding: 10 }}
      />
    </View>
  );
};

export default MyProductsScreen;
```

---

## 🔒 Validación al Intentar Chatear

```typescript
const handleContactSeller = async (productId: string, sellerId: string) => {
  try {
    const response = await fetch('http://tu-api/api/chat/conversations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        otherUserId: sellerId,
        productId: productId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      
      // Mostrar mensaje específico según el error
      if (error.message.includes('reservado')) {
        Alert.alert(
          'Producto reservado',
          'Este producto ya está reservado. No puedes contactar al vendedor.',
          [{ text: 'OK' }]
        );
      } else if (error.message.includes('no está disponible')) {
        Alert.alert(
          'Producto no disponible',
          'Este producto ya no está disponible.',
          [{ text: 'OK' }]
        );
      }
      return;
    }

    const conversation = await response.json();
    // Navegar al chat
    navigation.navigate('Chat', { conversationId: conversation.id });
  } catch (error) {
    Alert.alert('Error', 'No se pudo iniciar la conversación');
  }
};
```

---

## 📊 Flujo de Estados Recomendado

```
Crear producto
    ↓
[Disponible] ← Estado inicial
    ↓
Usuario encuentra comprador
    ↓
[Reservado] ← Bloquea nuevos contactos
    ↓
Se concreta la venta
    ↓
[No disponible] ← Oculta el producto
```

---

## ✅ Checklist de Implementación

- [ ] Crear pantalla "Mis Productos"
- [ ] Implementar `GET /api/products/my-products`
- [ ] Mostrar dropdown de estados con colores
- [ ] Implementar `PATCH /api/products/:id/status`
- [ ] Agregar validación al intentar chatear
- [ ] Mostrar mensajes de error apropiados
- [ ] Agregar pull-to-refresh en la lista
- [ ] (Opcional) Agregar filtros por estado

---

## 🎨 Colores Recomendados

```typescript
const STATUS_COLORS = {
  disponible: '#4CAF50',      // Verde
  reservado: '#FF9800',        // Naranja
  no_disponible: '#F44336',   // Rojo
};

const STATUS_LABELS = {
  disponible: 'Disponible',
  reservado: 'Reservado',
  no_disponible: 'No disponible',
};
```

---

## 🚨 Casos Especiales

### Conversaciones Existentes con Productos Reservados
Si un usuario ya tiene una conversación abierta con el vendedor sobre un producto que luego se marca como "Reservado", **puede seguir chateando** en esa conversación existente.

### Dueño del Producto
El dueño del producto puede ver y chatear sobre su propio producto en cualquier estado.

### Productos en Listados Públicos
Solo se muestran productos con estado `"disponible"` o `"reservado"`. Los productos `"no_disponible"` están ocultos.

---

¡Todo listo para gestionar estados de productos! 🚀
