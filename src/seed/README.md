# Seed Module

Este módulo permite poblar la base de datos con datos iniciales de prueba.

## Contenido del Seed

### 📍 Ubicaciones (6)
- Bogotá, Cundinamarca
- Medellín, Antioquia
- Cali, Valle del Cauca
- Barranquilla, Atlántico
- Cartagena, Bolívar
- Bucaramanga, Santander

### 🏷️ Modalidades (3)
- **Venta**: Producto disponible para venta
- **Donación**: Producto disponible para donación
- **Intercambio**: Producto disponible para intercambio

### 📦 Productos (10)
Variedad de productos distribuidos en diferentes ciudades y modalidades:
- Muebles (sofá, mesa, cama)
- Tecnología (laptop, consola)
- Electrodomésticos (refrigerador, ollas)
- Deportes (bicicleta)
- Otros (libros, ropa de bebé)

## Uso

### Opción 1: Endpoint HTTP
Realiza una petición GET al endpoint:
```
GET http://localhost:3000/api/seed
```

### Opción 2: Desde el código
```typescript
// Inyecta el servicio
constructor(private readonly seedService: SeedService) {}

// Ejecuta el seed
await this.seedService.runSeed();
```

## ⚠️ Advertencia

Este seed **eliminará todos los datos existentes** en las tablas:
- Products
- ProductImages
- Locations
- Modalities

**No ejecutar en producción.**
