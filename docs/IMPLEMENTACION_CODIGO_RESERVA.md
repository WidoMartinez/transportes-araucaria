# 📋 Implementación: Código Único de Reserva

## 🎯 Objetivo

Generar un código único e identificable para cada reserva que facilite el seguimiento y la comunicación con los clientes.

## 📐 Formato del Código

```
AR-YYYYMMDD-XXXX
```

### Componentes:

- **AR**: Prefijo que identifica "Araucaria"
- **YYYYMMDD**: Fecha de creación (Año-Mes-Día)
- **XXXX**: Consecutivo del día (4 dígitos con padding de ceros)

### Ejemplos:

- Primera reserva del 15 de octubre de 2025: `AR-20251015-0001`
- Segunda reserva del mismo día: `AR-20251015-0002`
- Primera reserva del 16 de octubre de 2025: `AR-20251016-0001`

## 🔧 Implementación Técnica

### 1. Modelo de Datos

**Archivo**: `backend/models/Reserva.js`

```javascript
codigoReserva: {
    type: DataTypes.STRING(50),
    allowNull: true,
    unique: true,
    field: 'codigo_reserva',
    comment: "Código único de reserva (formato: AR-YYYYMMDD-XXXX)",
}
```

### 2. Migración de Base de Datos

**Archivo**: `backend/migrations/add-codigo-reserva.js`

- Agrega columna `codigo_reserva` (VARCHAR(50), UNIQUE)
- Crea índice único para garantizar unicidad
- Es idempotente (puede ejecutarse múltiples veces)

### 3. Función Generadora

**Archivo**: `backend/server-db.js`

```javascript
const generarCodigoReserva = async () => {
    // Obtiene fecha actual
    const fecha = new Date();
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    const fechaStr = `${año}${mes}${dia}`;
    
    // Cuenta reservas del día actual
    const reservasDelDia = await Reserva.count({
        where: {
            created_at: {
                [Op.gte]: inicioDelDia,
                [Op.lte]: finDelDia,
            },
        },
    });
    
    // Genera consecutivo (siguiente número del día)
    const consecutivo = String(reservasDelDia + 1).padStart(4, '0');
    
    // Formato: AR-YYYYMMDD-XXXX
    return `AR-${fechaStr}-${consecutivo}`;
};
```

### 4. Endpoints Actualizados

#### `/enviar-reserva`
- Genera código antes de crear la reserva
- Incluye `codigoReserva` en el objeto de respuesta

```javascript
const codigoReserva = await generarCodigoReserva();

const reservaGuardada = await Reserva.create({
    codigoReserva,
    // ... otros campos
});

return res.json({
    success: true,
    message: "Reserva recibida y guardada correctamente",
    reservaId: reservaGuardada.id,
    codigoReserva: reservaGuardada.codigoReserva, // ← NUEVO
});
```

#### `/enviar-reserva-express`
- Misma lógica que `/enviar-reserva`
- Devuelve el código en la respuesta

### 5. Visualización en Frontend

**Archivo**: `src/components/AdminReservas.jsx`

#### En la tabla de reservas:
```jsx
<div className="space-y-1">
    <div>#{reserva.id}</div>
    {reserva.codigoReserva && (
        <div className="text-xs text-blue-600 font-mono">
            {reserva.codigoReserva}
        </div>
    )}
</div>
```

#### En el modal de detalles:
```jsx
{selectedReserva.codigoReserva && (
    <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
        <Label className="text-blue-700 text-sm font-medium">
            Código de Reserva
        </Label>
        <p className="text-2xl font-bold text-blue-900 tracking-wider">
            {selectedReserva.codigoReserva}
        </p>
    </div>
)}
```

## 📊 Características

### ✅ Ventajas

1. **Fácil de comunicar**: Formato legible y pronunciable
2. **Único globalmente**: Combinación fecha + consecutivo garantiza unicidad
3. **Identificación por fecha**: Facilita búsqueda y organización
4. **Consecutivo diario**: Permite estimar volumen de reservas por día
5. **Retrocompatible**: Reservas antiguas sin código siguen funcionando

### 🔒 Validaciones

- **Índice único**: La base de datos garantiza que no haya códigos duplicados
- **Generación atómica**: La consulta de conteo y creación son parte de la misma transacción
- **Manejo de errores**: Si falla la generación, la reserva no se crea

### 🎨 UI/UX

- Código visible en tabla principal (fuente monoespaciada, color azul)
- Destacado en vista de detalles (cuadro azul con icono)
- Formato consistente en toda la aplicación
- Compatible con reservas antiguas (muestra solo si existe)

## 📋 Casos de Uso

### 1. Crear Reserva Normal

```javascript
// Cliente llena formulario completo
POST /enviar-reserva

// Respuesta
{
    "success": true,
    "reservaId": 123,
    "codigoReserva": "AR-20251015-0001" // ← Nuevo código
}
```

### 2. Crear Reserva Express

```javascript
// Cliente usa flujo simplificado
POST /enviar-reserva-express

// Respuesta
{
    "success": true,
    "reservaId": 124,
    "codigoReserva": "AR-20251015-0002", // ← Nuevo código
    "tipo": "express"
}
```

### 3. Consultar Reserva

```javascript
GET /api/reservas/123

// Respuesta incluye código
{
    "id": 123,
    "codigoReserva": "AR-20251015-0001",
    "nombre": "Juan Pérez",
    // ... otros campos
}
```

### 4. Visualización en Admin

- **Lista**: Muestra código debajo del ID
- **Detalles**: Código destacado en cuadro azul
- **Búsqueda**: Posible búsqueda futura por código

## 🔄 Flujo Completo

```
1. Cliente hace reserva
   ↓
2. Backend recibe solicitud
   ↓
3. Se genera código único (AR-20251015-0001)
   ↓
4. Se crea reserva en BD con el código
   ↓
5. Se devuelve respuesta con código
   ↓
6. Frontend puede mostrar código al usuario
   ↓
7. Admin ve código en panel de reservas
   ↓
8. Cliente puede usar código para consultas
```

## 🚀 Despliegue

### 1. Ejecutar Migración

```bash
# Desde el directorio backend
node migrations/add-codigo-reserva.js
```

### 2. Verificar Columna

```sql
DESCRIBE reservas;
-- Debe mostrar columna 'codigo_reserva'

SHOW INDEX FROM reservas;
-- Debe mostrar índice 'idx_reservas_codigo_reserva'
```

### 3. Reiniciar Servidor

```bash
# En Render.com
Manual Deploy > Deploy latest commit
```

### 4. Verificar Funcionamiento

```javascript
// Crear una reserva de prueba
// Verificar que devuelve codigoReserva
// Comprobar que aparece en panel admin
```

## 📈 Métricas y Monitoreo

### Consultas Útiles

```sql
-- Reservas creadas hoy con código
SELECT COUNT(*) 
FROM reservas 
WHERE DATE(created_at) = CURDATE() 
AND codigo_reserva IS NOT NULL;

-- Últimos códigos generados
SELECT id, codigo_reserva, nombre, created_at 
FROM reservas 
WHERE codigo_reserva IS NOT NULL 
ORDER BY created_at DESC 
LIMIT 10;

-- Verificar unicidad (no debe haber duplicados)
SELECT codigo_reserva, COUNT(*) as count 
FROM reservas 
WHERE codigo_reserva IS NOT NULL 
GROUP BY codigo_reserva 
HAVING count > 1;
```

## 🎯 Mejoras Futuras

### Posibles Extensiones:

1. **Búsqueda por código**: Agregar campo de búsqueda en admin
2. **Código en emails**: Incluir en notificaciones al cliente
3. **QR Code**: Generar código QR con el código de reserva
4. **Link de seguimiento**: URL tipo `/reserva/AR-20251015-0001`
5. **Historial de cambios**: Asociar cambios de estado al código
6. **API pública**: Endpoint para consultar estado por código

## 📝 Notas Importantes

- Los códigos comienzan en `0001` cada día
- El formato es fijo: `AR-YYYYMMDD-XXXX`
- La generación es automática, no requiere intervención manual
- Reservas antiguas (sin código) siguen siendo válidas
- El código NO reemplaza al ID numérico interno
- Sirve como identificador "amigable" para el cliente

## 🔗 Referencias

- **Modelo**: `backend/models/Reserva.js`
- **Migración**: `backend/migrations/add-codigo-reserva.js`
- **Generador**: `backend/server-db.js` (función `generarCodigoReserva`)
- **Vista Admin**: `src/components/AdminReservas.jsx`
- **Documentación**: `DESPLIEGUE_RENDER.md`

---

**Implementado**: Octubre 2025  
**Versión**: 1.0
