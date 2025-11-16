# 🚀 Guía de Uso - Backend Renova

## ✅ Cambios Implementados

### 📊 Nuevas Entidades

1. **Location** - Ubicaciones de productos
   - `id`: UUID único
   - `city`: Ciudad
   - `state`: Departamento/Estado
   - `country`: País

2. **Modality** - Modalidades de transacción
   - `id`: UUID único
   - `name`: Nombre (Venta, Donación, Intercambio)
   - `description`: Descripción

3. **Product** - Productos (Actualizado)
   - Ahora incluye relaciones con `Location` y `Modality`
   - Se eliminaron los campos `city` y enum de modalidad

## 🔌 Endpoints Disponibles

### Products

**Crear Producto**
```http
POST /api/products
Content-Type: application/json

{
  "name": "Nombre del producto",
  "description": "Descripción detallada",
  "price": 100000,
  "tags": ["tag1", "tag2"],
  "images": ["url1", "url2"],
  "locationId": "uuid-de-ubicacion",
  "modalityId": "uuid-de-modalidad"
}
```

**Listar Productos**
```http
GET /api/products?limit=10&offset=0
```

**Obtener Producto**
```http
GET /api/products/:id
```

**Actualizar Producto**
```http
PATCH /api/products/:id
Content-Type: application/json

{
  "name": "Nuevo nombre",
  "price": 150000,
  "locationId": "nuevo-uuid-ubicacion",
  "modalityId": "nuevo-uuid-modalidad"
}
```

**Eliminar Producto**
```http
DELETE /api/products/:id
```

### Locations

**Crear Ubicación**
```http
POST /api/products/locations
Content-Type: application/json

{
  "city": "Bogotá",
  "state": "Cundinamarca",
  "country": "Colombia"
}
```

**Listar Ubicaciones**
```http
GET /api/products/locations/all
```

**Obtener Ubicación**
```http
GET /api/products/locations/:id
```

### Modalities

**Crear Modalidad**
```http
POST /api/products/modalities
Content-Type: application/json

{
  "name": "Venta",
  "description": "Producto disponible para venta"
}
```

**Listar Modalidades**
```http
GET /api/products/modalities/all
```

**Obtener Modalidad**
```http
GET /api/products/modalities/:id
```

### Seed

**Ejecutar Seed (Poblar Base de Datos)**
```http
GET /api/seed
```

⚠️ **ADVERTENCIA**: Este endpoint eliminará todos los datos existentes y creará:
- 6 ubicaciones (ciudades colombianas)
- 3 modalidades (Venta, Donación, Intercambio)
- 10 productos de ejemplo con imágenes

## 🎯 Pasos para Usar

### 1. Asegúrate de que la base de datos esté corriendo
```bash
docker-compose up -d
```

### 2. Inicia el servidor
```bash
npm run start:dev
# o
yarn start:dev
```

### 3. Ejecuta el seed para poblar la base de datos
```bash
curl http://localhost:3000/api/seed
```

O desde tu navegador/Postman:
```
GET http://localhost:3000/api/seed
```

### 4. Verifica los datos

**Ver todas las ubicaciones:**
```
GET http://localhost:3000/api/products/locations/all
```

**Ver todas las modalidades:**
```
GET http://localhost:3000/api/products/modalities/all
```

**Ver todos los productos:**
```
GET http://localhost:3000/api/products
```

## 📱 Respuesta del Frontend

En el frontend, cuando consultes los productos, ahora recibirás:

```json
{
  "id": "uuid",
  "name": "Sofá Moderno Gris",
  "price": 450000,
  "description": "Sofá de 3 puestos...",
  "slug": "sofa_moderno_gris",
  "tags": ["muebles", "sala"],
  "images": ["url1", "url2"],
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
  }
}
```

## 🔧 Próximos Ajustes en el Frontend

Deberás actualizar tu app para:

1. Mostrar `product.location.city` en lugar de un campo directo
2. Mostrar `product.modality.name` para la modalidad
3. Al crear un producto, primero obtener los IDs de location y modality disponibles

## 📝 Ejemplo de Creación desde el Frontend

```javascript
// 1. Obtener ubicaciones disponibles
const locations = await fetch('/api/products/locations/all');

// 2. Obtener modalidades disponibles
const modalities = await fetch('/api/products/modalities/all');

// 3. Crear producto con los IDs seleccionados
const newProduct = await fetch('/api/products', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Mi Producto',
    description: 'Descripción',
    price: 50000,
    locationId: selectedLocation.id,  // ID de la ubicación seleccionada
    modalityId: selectedModality.id,  // ID de la modalidad seleccionada
    images: ['url1', 'url2'],
    tags: ['tag1']
  })
});
```
