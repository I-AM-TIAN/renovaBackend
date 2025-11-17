# 📱 Guía de API - Productos (Frontend)

## Endpoints Disponibles

### 1. Listar Productos (GET /products)
**Autenticación:** No requerida

**Query Parameters:**
```typescript
{
  limit?: number,   // Cantidad de productos (default: 10)
  offset?: number   // Desde qué producto empezar (default: 0)
}
```

**Ejemplo:**
```
GET http://tu-api/products?limit=20&offset=0
```

**Respuesta:**
```json
[
  {
    "id": "uuid",
    "name": "Producto de prueba",
    "description": "Producto para probar el registro",
    "price": 0,
    "slug": "producto_de_prueba",
    "tags": [],
    "location": {
      "id": "uuid",
      "city": "Cartagena",
      "state": "Bolívar",
      "country": "Colombia"
    },
    "modality": {
      "id": "uuid",
      "name": "Intercambio",
      "description": "Producto disponible para intercambio"
    },
    "user": {
      "id": "uuid",
      "nombres": "Juan",
      "apellidos": "Pérez",
      "email": "juan@email.com",
      "telefono": "+57123456789",
      "roles": ["user"],
      "isActive": true,
      "ecopoints": 100,
      "ecoStatus": "Bronce"
    },
    "images": [
      "https://url-imagen-1.jpg",
      "https://url-imagen-2.jpg"
    ]
  }
]
```

---

### 2. Crear Producto (POST /products)
**Autenticación:** ✅ Requerida (JWT Token)

**Headers:**
```typescript
{
  "Authorization": "Bearer {jwt-token}",
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "name": "Sofá moderno gris",
  "description": "Sofá de 3 puestos en excelente estado",
  "price": 150000,
  "location": "Bogotá, Cundinamarca, Colombia",
  "modality": "Venta",
  "images": [
    "https://url-imagen-1.jpg",
    "https://url-imagen-2.jpg"
  ],
  "tags": ["muebles", "sala"]
}
```

**Validaciones:**
- `name` (requerido): Mínimo 1 carácter
- `description` (requerido): Mínimo 1 carácter
- `price` (opcional): Número positivo, default: 0
- `location` (requerido): Formato "Ciudad" o "Ciudad, Estado, País"
- `modality` (requerido): Solo "Venta", "Intercambio" o "Donación"
- `images` (opcional): Array de URLs
- `tags` (opcional): Array de strings

**Respuesta exitosa:**
```json
{
  "id": "uuid-del-producto",
  "name": "Sofá moderno gris",
  "description": "Sofá de 3 puestos en excelente estado",
  "price": 150000,
  "slug": "sofa_moderno_gris",
  "tags": ["muebles", "sala"],
  "location": {
    "id": "uuid",
    "city": "Bogotá",
    "state": "Cundinamarca",
    "country": "Colombia"
  },
  "modality": {
    "id": "uuid",
    "name": "Venta",
    "description": "Producto disponible para venta"
  },
  "user": {
    "id": "uuid-usuario",
    "nombres": "Juan",
    "apellidos": "Pérez",
    "email": "juan@email.com"
  },
  "images": [
    "https://url-imagen-1.jpg",
    "https://url-imagen-2.jpg"
  ]
}
```

**Errores posibles:**
| Código | Mensaje | Causa |
|--------|---------|-------|
| 400 | "name must be longer than..." | Campo name vacío |
| 400 | "description must be longer than..." | Campo description vacío |
| 404 | "Modalidad 'X' no encontrada..." | Modalidad incorrecta |
| 401 | "Unauthorized" | Token JWT inválido o ausente |

---

### 3. Ver Detalle de Producto (GET /products/:id)
**Autenticación:** No requerida

```
GET http://tu-api/products/{id}
```

**Respuesta:** Mismo formato que al crear producto

---

## 💻 Implementación Frontend

### TypeScript/JavaScript

```typescript
// ========================================
// 1. LISTAR PRODUCTOS (Feed principal)
// ========================================
const fetchProducts = async (page: number = 0, limit: number = 10) => {
  try {
    const offset = page * limit;
    const response = await fetch(
      `http://tu-api/products?limit=${limit}&offset=${offset}`
    );
    
    if (!response.ok) {
      throw new Error('Error al cargar productos');
    }
    
    const products = await response.json();
    return products;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

// ========================================
// 2. CREAR PRODUCTO (requiere autenticación)
// ========================================
const createProduct = async (productData: ProductData, token: string) => {
  try {
    const response = await fetch('http://tu-api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: productData.name,
        description: productData.description,
        price: productData.price || 0,
        location: productData.location,
        modality: productData.modality,
        images: productData.images || [],
        tags: productData.tags || []
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const product = await response.json();
    return product;
  } catch (error) {
    console.error('Error creando producto:', error);
    throw error;
  }
};

// ========================================
// 3. VER DETALLE DE UN PRODUCTO
// ========================================
const getProductDetails = async (productId: string) => {
  try {
    const response = await fetch(`http://tu-api/products/${productId}`);
    
    if (!response.ok) {
      throw new Error('Producto no encontrado');
    }
    
    const product = await response.json();
    return product;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

// ========================================
// 4. VALIDACIÓN DE PRODUCTO (Frontend)
// ========================================
const validateProduct = (data: ProductData): string | null => {
  if (!data.name || data.name.trim().length === 0) {
    return "El nombre del producto es requerido";
  }
  
  if (!data.description || data.description.trim().length === 0) {
    return "La descripción es requerida";
  }
  
  if (!data.location || data.location.trim().length === 0) {
    return "La ubicación es requerida";
  }
  
  if (!["Venta", "Intercambio", "Donación"].includes(data.modality)) {
    return "Selecciona una modalidad válida";
  }
  
  if (data.price && data.price < 0) {
    return "El precio no puede ser negativo";
  }
  
  return null; // Válido
};
```

---

## 📦 Interfaces TypeScript

```typescript
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  slug: string;
  tags: string[];
  location: Location;
  modality: Modality;
  user: User;
  images: string[];
}

interface Location {
  id: string;
  city: string;
  state?: string;
  country?: string;
}

interface Modality {
  id: string;
  name: "Venta" | "Intercambio" | "Donación";
  description: string;
}

interface User {
  id: string;
  nombres: string;
  apellidos: string;
  email: string;
  telefono?: string;
  roles: string[];
  isActive: boolean;
  ecopoints: number;
  ecoStatus?: string;
}

interface ProductData {
  name: string;
  description: string;
  price?: number;
  location: string;
  modality: "Venta" | "Intercambio" | "Donación";
  images?: string[];
  tags?: string[];
}
```

---

## 🎨 Ejemplo de Componente React Native

```typescript
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity } from 'react-native';

const HomeScreen = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  useEffect(() => {
    loadProducts();
  }, [page]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await fetchProducts(page, 10);
      setProducts(prev => [...prev, ...data]);
    } catch (error) {
      alert('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <FlatList
      data={products}
      renderItem={({ item }) => <ProductCard product={item} />}
      onEndReached={() => setPage(page + 1)}
      refreshing={loading}
      onRefresh={() => {
        setPage(0);
        setProducts([]);
        loadProducts();
      }}
    />
  );
};

const ProductCard = ({ product }: { product: Product }) => (
  <TouchableOpacity style={styles.card}>
    {/* Imagen principal */}
    {product.images.length > 0 ? (
      <Image 
        source={{ uri: product.images[0] }}
        style={styles.image}
      />
    ) : (
      <View style={styles.placeholder}>
        <Text>Sin imagen</Text>
      </View>
    )}
    
    {/* Badge de modalidad */}
    <View style={styles.badge}>
      <Text>{product.modality.name}</Text>
    </View>
    
    {/* Información */}
    <Text style={styles.title}>{product.name}</Text>
    <Text style={styles.location}>
      📍 {product.location.city}, {product.location.state}
    </Text>
    <Text style={styles.description} numberOfLines={2}>
      {product.description}
    </Text>
    
    {/* Precio (solo si no es 0) */}
    {product.price > 0 && (
      <Text style={styles.price}>${product.price.toLocaleString()}</Text>
    )}
    
    {/* Botón contactar */}
    <TouchableOpacity style={styles.button}>
      <Text style={styles.buttonText}>Contactar</Text>
    </TouchableOpacity>
  </TouchableOpacity>
);
```

---

## 📋 Mapeo desde tu Formulario

```typescript
// Desde tu pantalla de "Agregar producto"
const handleSubmit = async () => {
  // Validar primero
  const error = validateProduct(formData);
  if (error) {
    alert(error);
    return;
  }

  // Mapear datos del formulario
  const productData: ProductData = {
    name: formData.productName,           // "Sofá moderno gris"
    description: formData.description,     // Campo "Descripción"
    price: parseFloat(formData.price),     // "$0" -> 0
    location: formData.location,           // "Bogotá, Cundinamarca, Colombia"
    modality: selectedModality,            // "Venta", "Intercambio" o "Donación"
    images: uploadedImages,                // Array de URLs subidas
    tags: []                               // Opcional
  };

  try {
    const newProduct = await createProduct(productData, userToken);
    alert('Producto creado exitosamente');
    navigation.navigate('Home');
  } catch (error) {
    alert('Error al crear producto: ' + error.message);
  }
};
```

---

## 🔑 Puntos Clave

### Para Listar Productos (Feed)
- ✅ **No requiere autenticación**
- ✅ Usa paginación: `limit` y `offset`
- ✅ `images` es un array de strings (URLs)
- ✅ Muestra `product.user` para ver quién publicó
- ✅ Concatena `city`, `state`, `country` para la ubicación

### Para Crear Productos
- ✅ **Requiere autenticación** (JWT Token)
- ✅ `location`: envía string "Ciudad, Estado, País"
- ✅ `modality`: envía string "Venta", "Intercambio" o "Donación"
- ✅ `images`: array de URLs (debes subir las imágenes primero)
- ✅ `price`: opcional, default 0
- ✅ El `user` se asigna automáticamente desde el token

### Modalidades Válidas
- `"Venta"` - Para productos en venta
- `"Intercambio"` - Para productos de intercambio
- `"Donación"` - Para productos donados

### Formato de Ubicación
Acepta ambos formatos:
- Formato completo: `"Bogotá, Cundinamarca, Colombia"`
- Solo ciudad: `"Bogotá"`

---

## ⚠️ Manejo de Errores

```typescript
try {
  const product = await createProduct(data, token);
} catch (error) {
  if (error.message.includes('Unauthorized')) {
    // Token inválido, redirigir a login
    navigation.navigate('Login');
  } else if (error.message.includes('Modalidad')) {
    // Error en modalidad
    alert('Selecciona una modalidad válida: Venta, Intercambio o Donación');
  } else {
    // Error genérico
    alert('Error al crear producto: ' + error.message);
  }
}
```

---

## 📞 Contacto y Soporte

Si tienes dudas sobre la implementación, revisa este archivo o contacta al equipo de backend.

**Endpoints base:** `http://tu-api`
**Versión API:** v1
**Última actualización:** Noviembre 2025
