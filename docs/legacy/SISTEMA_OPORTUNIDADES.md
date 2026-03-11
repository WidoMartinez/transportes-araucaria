# Sistema de Oportunidades de Traslado

## 📋 Descripción General

El Sistema de Oportunidades permite aprovechar los traslados vacíos (retornos e idas) convirtiéndolos en oportunidades de venta con descuentos de hasta 60%, manteniendo el concepto de traslado 100% privado.

## 🎯 Objetivos

- **Maximizar ingresos**: Aprovechar traslados que de otro modo serían vacíos
- **Ofrecer valor al cliente**: Traslados privados premium con descuentos significativos
- **Optimizar operaciones**: Reducir kilómetros vacíos y mejorar eficiencia
- **Capturar demanda flexible**: Clientes que pueden ajustar horarios por mejor precio

## 🏗️ Arquitectura del Sistema

### Base de Datos

#### Tabla `oportunidades`
```sql
- id: INT (PK, AUTO_INCREMENT)
- codigo: VARCHAR(50) UNIQUE (OP-YYYYMMDD-XXX)
- tipo: ENUM('retorno_vacio', 'ida_vacia')
- origen: VARCHAR(255)
- destino: VARCHAR(255)
- fecha: DATE
- hora_aproximada: TIME
- descuento: INT (porcentaje 0-100)
- precio_original: DECIMAL(10,2)
- precio_final: DECIMAL(10,2)
- vehiculo: VARCHAR(255)
- capacidad: VARCHAR(100)
- reserva_relacionada_id: INT (FK → reservas.id)
- estado: ENUM('disponible', 'reservada', 'expirada')
- valido_hasta: DATETIME
- reserva_aprovechada_id: INT (FK → reservas.id)
- motivo_descuento: TEXT
```

#### Tabla `suscripciones_oportunidades`
```sql
- id: INT (PK, AUTO_INCREMENT)
- email: VARCHAR(255)
- nombre: VARCHAR(255)
- rutas: JSON [{origen, destino}]
- descuento_minimo: INT (default 40)
- activa: BOOLEAN (default TRUE)
```

### Backend (Node.js + Express)

**Archivo**: `backend/routes/oportunidades.js`

#### Endpoints Principales

1. **GET `/api/oportunidades`**
   - Lista oportunidades disponibles
   - Filtros: origen, destino, fecha
   - Marca automáticamente oportunidades expiradas
   - Retorna: Array de oportunidades con estado 'disponible'

2. **POST `/api/oportunidades/suscribir`**
   - Crea/actualiza suscripción a alertas
   - Requiere: email, rutas[], descuentoMinimo
   - Retorna: Confirmación de suscripción

3. **GET `/api/oportunidades/generar`** (Admin)
   - Genera oportunidades desde reservas confirmadas
   - Ejecuta lógica de detección automática
   - Retorna: Total generadas + detalles

4. **GET `/api/oportunidades/admin`** (Admin)
   - Lista completa con historial
   - Incluye relaciones con reservas

5. **PUT `/api/oportunidades/:codigo/estado`** (Admin)
   - Actualiza estado manualmente
   - Estados: disponible, reservada, expirada

6. **DELETE `/api/oportunidades/:codigo`** (Admin)
   - Elimina oportunidad

7. **GET `/api/oportunidades/estadisticas`** (Admin)
   - Métricas del mes actual
   - % aprovechamiento, ingresos recuperados

### Lógica de Detección

#### 1. Retornos Vacíos
```javascript
Condiciones:
- Reserva con estado 'confirmada' o 'completada'
- Crear oportunidad: destino → origen
- Hora: hora_llegada + 30 minutos
- Descuento: 50-60% según urgencia
- Válido hasta: 2 horas antes del viaje
```

#### 2. Idas Vacías
```javascript
Condiciones:
- Reserva donde origen ≠ BASE (Temuco)
- Crear oportunidad: BASE → origen_reserva
- Hora: hora_recogida - 2 horas
- Descuento: 50% fijo
- Válido hasta: 3 horas antes del viaje
```

### Frontend (React + Vite)

#### Componentes

1. **`OportunidadesTraslado.jsx`** (Página principal)
   - Hero section con propuesta de valor
   - Sección "Cómo Funciona"
   - Lista de oportunidades con filtros
   - Sistema de actualización automática (2 min)
   - Formulario de suscripción
   - Garantías y beneficios

2. **`OportunidadCard.jsx`** (Tarjeta individual)
   - Badge de tipo (retorno/ida)
   - Ruta visual
   - Precio original tachado y final destacado
   - Badge de descuento
   - Detalles del vehículo
   - Motivo del descuento
   - Garantías del servicio
   - Botón de reserva

3. **`SuscripcionOportunidades.jsx`** (Suscripción)
   - Input de email con validación
   - Select múltiple de rutas comunes
   - Slider para descuento mínimo
   - Submit con confirmación visual

#### Navegación

Acceso mediante:
- URL: `/#oportunidades`
- Header: Link destacado "🔥 Oportunidades"
- Hash-based routing integrado con App.jsx

## 🔄 Flujo de Usuario

### Reservar una Oportunidad

1. Usuario ve oportunidad en `/oportunidades`
2. Click en "Reservar Ahora"
3. Datos se guardan en localStorage
4. Redirección a página principal
5. Formulario se pre-llena automáticamente
6. Usuario completa datos faltantes
7. Confirma reserva
8. Backend actualiza oportunidad a 'reservada'

### Suscribirse a Alertas

1. Usuario completa formulario de suscripción
2. Selecciona rutas de interés
3. Configura descuento mínimo
4. Backend guarda suscripción
5. Sistema notificará por email (Fase 6 - Pendiente)

## 🔧 Integración con Sistema Existente

### App.jsx
- Nueva función `resolveIsOportunidadesView()`
- Estado `isOportunidadesView`
- Renderizado condicional
- Campo `codigoOportunidad` en formData

### HeroExpress.jsx
- useEffect para cargar datos desde localStorage
- Pre-llenado automático de formulario
- Tracking de código de oportunidad

### Header.jsx
- Nuevo item de menú destacado
- Estilo especial con icono Sparkles
- Visible en desktop y móvil

### Backend (server-db.js)
- POST `/enviar-reserva-express` actualiza oportunidad
- Marca como 'reservada' cuando viene de oportunidad
- Asocia reserva_aprovechada_id

## 📊 Panel Admin (Pendiente - Fase 5)

Funcionalidades planificadas:
- Tabla con todas las oportunidades
- Filtros por estado, tipo, fecha
- Estadísticas de aprovechamiento
- Ingresos recuperados
- Acciones: editar, eliminar, ajustar descuento
- Ver reserva relacionada
- Historial completo

## 📧 Sistema de Notificaciones (Pendiente - Fase 6)

Funcionalidades planificadas:
- Template de email para oportunidades
- Notificación automática a suscritos
- Matching de rutas con suscripciones
- Link directo para reservar
- Código de descuento único (tracking)
- Desuscripción automática

## 🚀 Optimizaciones Futuras (Fase 7)

### SEO
- Meta tags optimizados
- Título: "Traslados Privados con 50% Descuento"
- Descripción con keywords
- Open Graph tags

### Google Ads
- Tracking de conversión
- Parámetros UTM
- Eventos personalizados
- ROI por campaña

### Performance
- Cacheo de oportunidades (1-2 min)
- Lazy loading de imágenes
- Code splitting
- Índices optimizados en BD

## 📝 Mantenimiento

### Limpieza Automática
La función `marcarOportunidadesExpiradas()` se ejecuta:
- Antes de cada listado público
- Marca como 'expirada' si `validoHasta < ahora`

### Generación Manual (Admin)
Endpoint: `GET /api/oportunidades/generar`
- Revisar todas las reservas confirmadas futuras
- Generar oportunidades que falten
- No duplicar existentes

### Monitoreo
Métricas clave a vigilar:
- % de aprovechamiento semanal/mensual
- Ingresos por oportunidades
- Rutas más populares
- Tiempo promedio de reserva
- Tasa de conversión de suscriptores

## 🛠️ Comandos Útiles

### Desarrollo
```bash
# Frontend
npm run dev

# Backend
cd backend && node server-db.js
```

### Base de Datos
Las migraciones se ejecutan automáticamente al iniciar el servidor.

### Testing
```bash
# Generar oportunidades de prueba (requiere auth admin)
curl -X GET http://localhost:3001/api/oportunidades/generar \
  -H "Authorization: Bearer <token>"

# Listar oportunidades
curl http://localhost:3001/api/oportunidades
```

## �� Troubleshooting

### Oportunidades no aparecen
1. Verificar que existan reservas confirmadas
2. Ejecutar `/api/oportunidades/generar` (admin)
3. Revisar logs del servidor
4. Verificar que `validoHasta` sea futuro

### Formulario no se pre-llena
1. Verificar que localStorage tenga datos
2. Console del navegador: `localStorage.getItem("datosOportunidad")`
3. Verificar que HeroExpress esté ejecutando useEffect
4. Revisar que el formato JSON sea correcto

### Estado no se actualiza
1. Verificar que `codigoOportunidad` se envíe al backend
2. Revisar logs: "Actualizando oportunidad..."
3. Verificar que la oportunidad exista en BD
4. Comprobar asociación con reserva

## 📚 Referencias

- **Backend**: `backend/routes/oportunidades.js`
- **Modelos**: `backend/models/Oportunidad.js`, `SuscripcionOportunidad.js`
- **Migraciones**: `backend/migrations/add-oportunidades-table.js`
- **Frontend**: `src/pages/OportunidadesTraslado.jsx`
- **Componentes**: `src/components/OportunidadCard.jsx`, `SuscripcionOportunidades.jsx`

## 🤝 Contribuir

Al implementar nuevas funcionalidades:
1. Seguir la estructura existente
2. Documentar cambios en este archivo
3. Mantener consistencia de estilos (shadcn/ui)
4. Probar integración completa
5. Actualizar tests si aplica

---

**Versión**: 1.0.0  
**Última actualización**: Febrero 2026  
**Autor**: Sistema Copilot + WidoMartinez
