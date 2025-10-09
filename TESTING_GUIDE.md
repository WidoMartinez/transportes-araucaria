# Guía de Testing - Mejoras de UX

## 🧪 Cómo Probar las Nuevas Funcionalidades

### Requisitos Previos

1. **Base de Datos:** Actualizar schema con nuevos campos
2. **Backend:** Reiniciar servidor para cargar nuevos endpoints
3. **Frontend:** Rebuild para aplicar cambios UI

```bash
# Backend
cd backend
npm install
npm run start:db

# Frontend
cd ..
npm install --legacy-peer-deps
npm run dev
```

---

## 📊 1. Dashboard Administrativo Simplificado

### Acceso
```
URL: /?admin=true
O: /admin
O: #admin
```

### Pruebas a Realizar

#### A. Estadísticas Colapsables
1. ✅ Al cargar, las estadísticas deben estar **ocultas**
2. ✅ Ver solo badge con "X activos" en el header
3. ✅ Click en "Ver Stats" → Mostrar 4 tarjetas de estadísticas
4. ✅ Click en "Ocultar Stats" → Esconder tarjetas

**Resultado esperado:** Dashboard más limpio, menos información visual inicial

#### B. Filtros Colapsables
1. ✅ Al cargar, solo ver **búsqueda rápida** (barra de búsqueda)
2. ✅ Botones: "Buscar" y "Más Filtros"
3. ✅ Click en "Más Filtros" → Expandir panel con 4 filtros avanzados
4. ✅ Usar búsqueda rápida → Debe funcionar sin expandir filtros
5. ✅ Presionar Enter en búsqueda → Debe buscar inmediatamente

**Resultado esperado:** Menos scroll, interfaz más limpia

#### C. Navegación Simplificada
1. ✅ Ver solo 3 botones: "Precios", "Códigos", "Reservas"
2. ✅ No debe haber botón "Códigos (Mejorado)" redundante
3. ✅ Click en cada botón debe cambiar vista correctamente

**Resultado esperado:** Navegación más clara y directa

---

## 🎯 2. Flujo de Reservas Optimizado

### Acceso
```
URL: /
(Página principal, módulo de reservas)
```

### Pruebas a Realizar

#### A. Paso 1 - Tu Viaje (Hora Opcional)

**Test 1: Sin especificar hora**
1. ✅ Completar: Origen, Destino, Fecha, Pasajeros
2. ✅ **NO** seleccionar hora (dejar vacío)
3. ✅ Click "Siguiente"
4. ✅ Debe avanzar a Paso 2 sin error

**Test 2: Con hora especificada**
1. ✅ Completar todos los campos + Hora
2. ✅ Click "Siguiente"
3. ✅ Debe avanzar a Paso 2 (como antes)

**Test 3: Verificar placeholder**
1. ✅ Campo "Hora" debe mostrar: "Especifica después (recomendado 08:00)"
2. ✅ Label debe incluir: `(opcional)`

**Resultado esperado:** Usuario puede avanzar sin hora

#### B. Paso 2 - Tus Datos (Detalles Opcionales)

**Test 1: Solo campos obligatorios**
1. ✅ Completar: Nombre, Email, Teléfono
2. ✅ **NO** completar: Número de vuelo, Hotel, Equipaje
3. ✅ Click "Siguiente"
4. ✅ Debe avanzar a Paso 3 sin error

**Test 2: Verificar agrupación visual**
1. ✅ Ver sección con borde punteado
2. ✅ Texto: "💡 Opcional: Puedes completar estos detalles después del pago"
3. ✅ Campos agrupados: Hotel, Alzador, Equipaje

**Resultado esperado:** Menos campos requeridos, UI más clara

#### C. Paso 3 - Pago

**Sin cambios** - Debe funcionar exactamente igual que antes

---

## 🔄 3. CompletarDetalles Post-Pago

### Acceso
```
URL: /completar-detalles?reservaId=123
O: /#completar-detalles?reservaId=123
```

### Setup Previo

Necesitas una reserva creada. Opciones:

**Opción A: Crear vía Frontend**
1. Hacer una reserva completa
2. Obtener reservaId de la base de datos
3. Usar URL: `/completar-detalles?reservaId=[ID]`

**Opción B: Crear vía API directamente**
```bash
curl -X POST http://localhost:3001/enviar-reserva-express \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Juan Pérez",
    "email": "juan@example.com",
    "telefono": "+56912345678",
    "origen": "Aeropuerto La Araucanía",
    "destino": "Pucón",
    "fecha": "2025-02-01",
    "pasajeros": 2,
    "totalConDescuento": 50000
  }'

# Response contendrá: { "reservaId": 123 }
```

### Pruebas a Realizar

#### A. Carga de Reserva

**Test 1: URL válida**
1. ✅ Navegar a: `/completar-detalles?reservaId=123`
2. ✅ Debe mostrar spinner "Cargando..."
3. ✅ Debe cargar datos de la reserva
4. ✅ Debe mostrar resumen verde con: origen, destino, fecha, pasajeros

**Test 2: URL inválida**
1. ✅ Navegar a: `/completar-detalles?reservaId=999999`
2. ✅ Debe mostrar error
3. ✅ Botón "Volver al inicio" debe funcionar

**Test 3: Sin reservaId en URL**
1. ✅ Navegar a: `/completar-detalles`
2. ✅ Debe mostrar error: "No se encontró el ID de la reserva"

#### B. Formulario de Detalles

**Test 1: Validación de hora (obligatoria)**
1. ✅ NO seleccionar hora
2. ✅ Click "Confirmar detalles"
3. ✅ Debe mostrar error: "Por favor, selecciona la hora de recogida"

**Test 2: Solo hora (campos opcionales vacíos)**
1. ✅ Seleccionar hora: "10:00"
2. ✅ Dejar vacío: vuelo, hotel, equipaje, mensaje
3. ✅ Click "Confirmar detalles"
4. ✅ Debe guardar correctamente

**Test 3: Todos los campos**
1. ✅ Completar: hora, número de vuelo, hotel, alzador, equipaje, mensaje
2. ✅ Click "Confirmar detalles"
3. ✅ Debe guardar correctamente

#### C. Pantalla de Éxito

**Después de guardar:**
1. ✅ Debe mostrar pantalla verde de éxito
2. ✅ Título: "¡Detalles actualizados correctamente!"
3. ✅ Resumen completo con todos los datos
4. ✅ Botón "Volver al inicio" funcional

#### D. Estados de UI

**Loading:**
1. ✅ Spinner durante carga inicial
2. ✅ Botón "Guardando..." con spinner durante submit

**Error:**
1. ✅ Alert rojo con mensaje descriptivo
2. ✅ Botón para volver al inicio

**Success:**
1. ✅ Card verde con checkmark
2. ✅ Resumen detallado
3. ✅ Mensaje de confirmación por email

---

## 🔌 4. Endpoints Backend

### Setup
```bash
cd backend
npm run start:db
```

### Test con cURL

#### A. POST /enviar-reserva-express

**Test 1: Campos mínimos**
```bash
curl -X POST http://localhost:3001/enviar-reserva-express \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Test User",
    "email": "test@test.com",
    "telefono": "+56912345678",
    "origen": "Temuco",
    "destino": "Pucón",
    "fecha": "2025-02-15",
    "pasajeros": 1
  }'
```

**Resultado esperado:**
```json
{
  "success": true,
  "reservaId": 123,
  "message": "Reserva express creada correctamente"
}
```

**Verificar en BD:**
```sql
SELECT id, nombre, hora, estado, detallesCompletos 
FROM reservas 
WHERE id = 123;

-- Resultado esperado:
-- hora: "08:00:00" (default)
-- estado: "pendiente_detalles"
-- detallesCompletos: false
```

**Test 2: Con hora especificada**
```bash
curl -X POST http://localhost:3001/enviar-reserva-express \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Test User 2",
    "email": "test2@test.com",
    "telefono": "+56912345678",
    "origen": "Temuco",
    "destino": "Pucón",
    "fecha": "2025-02-15",
    "pasajeros": 1,
    "hora": "14:30"
  }'
```

**Verificar:** hora debe ser "14:30:00"

**Test 3: Campos faltantes (error)**
```bash
curl -X POST http://localhost:3001/enviar-reserva-express \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Test User",
    "email": "test@test.com"
  }'
```

**Resultado esperado:** Error 400

#### B. PUT /completar-reserva-detalles/:id

**Test 1: Actualizar detalles**
```bash
curl -X PUT http://localhost:3001/completar-reserva-detalles/123 \
  -H "Content-Type: application/json" \
  -d '{
    "hora": "10:00",
    "numeroVuelo": "LA456",
    "hotel": "Hotel Test",
    "equipajeEspecial": "1 tabla de ski",
    "sillaInfantil": "si",
    "mensaje": "Llegada desde Santiago"
  }'
```

**Resultado esperado:**
```json
{
  "success": true,
  "message": "Detalles actualizados correctamente",
  "reserva": {...}
}
```

**Verificar en BD:**
```sql
SELECT id, hora, estado, detallesCompletos, numeroVuelo, hotel
FROM reservas 
WHERE id = 123;

-- Resultado esperado:
-- hora: "10:00:00"
-- estado: "confirmada"
-- detallesCompletos: true
-- numeroVuelo: "LA456"
-- hotel: "Hotel Test"
```

**Test 2: ID inexistente**
```bash
curl -X PUT http://localhost:3001/completar-reserva-detalles/999999 \
  -H "Content-Type: application/json" \
  -d '{"hora": "10:00"}'
```

**Resultado esperado:** Error 404

---

## 🗄️ 5. Migración de Base de Datos

### Verificar Schema Actual

```sql
-- Ver estructura de tabla reservas
DESCRIBE reservas;

-- Verificar si campos nuevos existen
SELECT COLUMN_NAME, IS_NULLABLE, COLUMN_DEFAULT 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'reservas' 
  AND COLUMN_NAME IN ('hora', 'detallesCompletos');
```

### Aplicar Migración (si es necesario)

```sql
-- Backup primero!
CREATE TABLE reservas_backup AS SELECT * FROM reservas;

-- 1. Agregar campo detallesCompletos
ALTER TABLE reservas 
ADD COLUMN detallesCompletos BOOLEAN DEFAULT FALSE NOT NULL;

-- 2. Modificar campo hora para permitir NULL
ALTER TABLE reservas 
MODIFY COLUMN hora TIME NULL DEFAULT '08:00:00';

-- 3. Agregar nuevo estado
ALTER TABLE reservas 
MODIFY COLUMN estado ENUM(
  'pendiente',
  'pendiente_detalles',
  'confirmada',
  'cancelada',
  'completada'
) DEFAULT 'pendiente';

-- 4. Marcar reservas antiguas como completas
UPDATE reservas 
SET detallesCompletos = TRUE 
WHERE hora IS NOT NULL 
  AND estado != 'pendiente';
```

### Verificar Migración

```sql
-- Contar registros actualizados
SELECT 
  estado,
  detallesCompletos,
  COUNT(*) as total
FROM reservas
GROUP BY estado, detallesCompletos;

-- Verificar reservas sin hora
SELECT COUNT(*) FROM reservas WHERE hora IS NULL;
```

---

## ✅ Checklist de Testing Completo

### Dashboard
- [ ] Estadísticas ocultas por defecto
- [ ] Toggle "Ver Stats" / "Ocultar Stats" funciona
- [ ] Búsqueda rápida siempre visible
- [ ] Filtros avanzados colapsables
- [ ] Enter en búsqueda ejecuta búsqueda
- [ ] Navegación simplificada (3 paneles)

### Reserva Express
- [ ] Hora es opcional en Paso 1
- [ ] Puede avanzar sin hora
- [ ] Placeholder muestra sugerencia
- [ ] Label muestra "(opcional)"
- [ ] Validación de hora solo si se proporciona
- [ ] Detalles opcionales agrupados visualmente
- [ ] Emoji 💡 visible
- [ ] Puede completar solo campos obligatorios

### CompletarDetalles
- [ ] Carga reserva desde URL
- [ ] Muestra resumen verde
- [ ] Valida hora como obligatoria
- [ ] Guarda detalles correctamente
- [ ] Muestra pantalla de éxito
- [ ] Botones funcionan correctamente
- [ ] Estados de loading/error/success

### Backend
- [ ] `/enviar-reserva-express` acepta campos mínimos
- [ ] Crea reserva con estado "pendiente_detalles"
- [ ] Usa hora por defecto "08:00:00" si no se proporciona
- [ ] `/completar-reserva-detalles/:id` actualiza correctamente
- [ ] Cambia estado a "confirmada"
- [ ] Marca detallesCompletos = true
- [ ] Validación de errores funciona

### Base de Datos
- [ ] Campo `detallesCompletos` existe
- [ ] Campo `hora` permite NULL
- [ ] Estado "pendiente_detalles" existe
- [ ] Migración aplicada correctamente
- [ ] Reservas antiguas marcadas como completas

---

## 🐛 Problemas Comunes y Soluciones

### Frontend no compila
```bash
# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### Backend no inicia
```bash
# Verificar puerto
lsof -i :3001

# Verificar conexión DB
mysql -u usuario -p base_de_datos
```

### CompletarDetalles no carga reserva
- Verificar que reservaId esté en URL
- Verificar que backend esté corriendo
- Verificar VITE_API_URL en .env

### Hora se muestra incorrecta
- Verificar formato en BD: "HH:MM:SS"
- Verificar timezone del servidor
- Verificar conversión en frontend

---

## 📊 Métricas a Monitorear

Después del deploy, trackear:

```sql
-- 1. Reservas con flujo express vs tradicional
SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN hora = '08:00:00' THEN 1 ELSE 0 END) as con_hora_default,
  SUM(CASE WHEN detallesCompletos = false THEN 1 ELSE 0 END) as pendientes
FROM reservas
WHERE created_at > '2025-01-01';

-- 2. Tiempo promedio hasta completar detalles
SELECT 
  AVG(TIMESTAMPDIFF(MINUTE, created_at, updated_at)) as minutos_promedio
FROM reservas
WHERE detallesCompletos = true
  AND estado = 'confirmada'
  AND created_at > '2025-01-01';

-- 3. Tasa de abandono (reservas sin completar)
SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN detallesCompletos = false THEN 1 ELSE 0 END) as sin_completar,
  ROUND(SUM(CASE WHEN detallesCompletos = false THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as tasa_abandono
FROM reservas
WHERE estado = 'pendiente_detalles'
  AND created_at > '2025-01-01';
```

---

## 📞 Soporte

Si encuentras problemas:
1. Revisar logs del servidor
2. Verificar consola del navegador
3. Confirmar que migración de BD fue exitosa
4. Probar endpoints con cURL
5. Verificar variables de entorno

---

*Última actualización: 2025-01-09*
*Versión: 1.0*
