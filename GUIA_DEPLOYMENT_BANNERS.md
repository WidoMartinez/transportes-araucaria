# Guía de Deployment - Sistema de Banners Promocionales

## 📋 Resumen

Este documento proporciona instrucciones paso a paso para desplegar y probar el nuevo sistema de banners promocionales en los servidores de producción (Hostinger + Render.com).

## �� Pasos de Deployment

### 1. Backend (Render.com)

#### Verificación Pre-Deployment
```bash
# En la rama copilot/add-promotional-banners-system
git log --oneline -5
# Deberías ver los commits de banners promocionales
```

#### Deployment Automático
1. **Merge del PR** a la rama principal activará el deployment automático en Render.com
2. **Monitorear logs** en Render.com Dashboard:
   ```
   🔄 Iniciando migración: crear tabla promociones_banner...
   ✅ Tabla 'promociones_banner' creada correctamente
   ```

#### Verificación Post-Deployment
```bash
# Verificar que la tabla se creó
# En la base de datos MySQL, ejecutar:
SHOW TABLES LIKE 'promociones_banner';
DESCRIBE promociones_banner;
```

#### Verificar Endpoints
```bash
# Endpoint público (sin autenticación)
curl https://tu-backend.onrender.com/api/promociones-banner/activas

# Debería retornar: []  (array vacío si no hay promociones)
```

### 2. Frontend (Hostinger)

#### Build y Upload
```bash
# Generar build de producción
npm run build

# El build genera:
# - dist/index.html
# - dist/assets/*
# - dist/assets incluirá PromocionBanners y ReservaRapidaModal
```

#### Crear Carpeta de Banners
```bash
# En el servidor Hostinger, crear:
mkdir -p public_html/banners
chmod 755 public_html/banners  # o según requerimientos del servidor

# Crear archivo .gitkeep
touch public_html/banners/.gitkeep
```

#### Upload del Build
1. Subir contenido de `dist/` a `public_html/` vía FTP/SFTP
2. Asegurar que `.htaccess` está configurado para SPA routing

## 🧪 Plan de Pruebas

### Fase 1: Pruebas de Admin Panel

#### 1.1 Acceso al Panel
1. Ir a: `https://tudominio.com/admin`
2. Iniciar sesión con credenciales de administrador
3. En el menú lateral, buscar sección **Marketing**
4. Click en **Promociones** (icono Sparkles ✨)

#### 1.2 Crear Primera Promoción
1. Click en botón **"Nueva Promoción"**
2. Completar formulario:
   - **Nombre**: "Pucón Express - 20% OFF"
   - **Imagen**: Subir una imagen de prueba (JPG/PNG, máx 5MB)
   - **Precio**: 25000
   - **Tipo de viaje**: Ida y Vuelta
   - **Origen**: Temuco
   - **Destino**: Pucón
   - **Máx. Pasajeros**: 3
   - **Orden**: 0
   - **Activo**: ON (activado)
3. Click en **"Crear"**

**Resultado esperado**:
- ✅ Mensaje de éxito
- ✅ Card con preview de la promoción aparece en el grid
- ✅ Badge "Activo" con ícono de ojo visible
- ✅ Imagen se muestra correctamente

#### 1.3 Probar Edición
1. Click en botón **"Editar"** de la promoción creada
2. Cambiar el nombre a "Pucón Express - 25% OFF"
3. Cambiar el precio a 22000
4. Click en **"Actualizar"**

**Resultado esperado**:
- ✅ Cambios se reflejan en el card
- ✅ Imagen se mantiene

#### 1.4 Probar Toggle de Estado
1. En el card, usar el **Switch** "Mostrar en sitio"
2. Desactivar → Badge debe cambiar a "Inactivo" con ícono de ojo cerrado
3. Activar nuevamente → Badge debe volver a "Activo"

#### 1.5 Probar Eliminación
1. Crear una segunda promoción de prueba
2. Click en botón de **Eliminar** (ícono basura)
3. Confirmar en el diálogo

**Resultado esperado**:
- ✅ Confirmación solicitada
- ✅ Promoción eliminada del grid
- ✅ Imagen eliminada del servidor

### Fase 2: Pruebas de Carrusel Público

#### 2.1 Visualización en Home
1. Abrir `https://tudominio.com/` en navegador
2. Justo después del Header, debe aparecer el **carrusel de banners**

**Resultado esperado**:
- ✅ Carrusel visible con la promoción activa
- ✅ Imagen se muestra a resolución completa
- ✅ Overlay con información (nombre, precio, ruta)
- ✅ Botón "Reservar Ahora" visible

#### 2.2 Navegación del Carrusel
Si hay múltiples promociones:
1. Click en flecha **derecha** → Siguiente banner
2. Click en flecha **izquierda** → Banner anterior
3. Esperar 5 segundos → Auto-avance al siguiente

#### 2.3 Responsive Design
1. Redimensionar navegador a móvil (375px)
2. Redimensionar a tablet (768px)
3. Redimensionar a desktop (1920px)

**Resultado esperado**:
- ✅ Carrusel se adapta correctamente
- ✅ Texto legible en todas las resoluciones
- ✅ Botones de navegación visibles y funcionales

### Fase 3: Pruebas de Reserva Rápida

#### 3.1 Abrir Modal
1. En el home, **click en una imagen del banner**
2. O **click en botón "Reservar Ahora"**

**Resultado esperado**:
- ✅ Modal se abre con animación suave
- ✅ Datos de la promoción pre-cargados:
  - Ruta (Temuco → Pucón)
  - Precio ($25.000)
  - Tipo de viaje (Ida y Vuelta)
  - Capacidad (Hasta 3 pasajeros)

#### 3.2 Completar Formulario - Caso Exitoso
1. Completar campos:
   - **Nombre**: Juan Pérez
   - **Email**: juan@example.com
   - **Teléfono**: +56 9 1234 5678
   - **Fecha Ida**: Mañana (seleccionar del calendario)
   - **Hora Ida**: 09:00
   - **Fecha Vuelta**: En 3 días (si es ida y vuelta)
   - **Hora Vuelta**: 18:00
2. Click en **"Pagar $25.000"**

**Resultado esperado**:
- ✅ Mensaje "Procesando..."
- ✅ Reserva creada en base de datos
- ✅ Alert con código de reserva (ej: `PR-1707933680-XYZ123`)
- ✅ Modal se cierra

#### 3.3 Validación de Campos
Probar con campos vacíos:
1. No completar **Nombre** → Error de validación HTML5
2. Email inválido (`test@`) → Error de validación
3. No seleccionar **Fecha Ida** → Error de validación

**Para viaje Ida y Vuelta**:
1. No completar **Fecha Vuelta** → Error de validación

#### 3.4 Verificar Reserva en Base de Datos
```sql
SELECT * FROM reservas 
WHERE tipo_reserva = 'promocion' 
ORDER BY created_at DESC 
LIMIT 5;
```

**Resultado esperado**:
- ✅ Registro con `tipo_reserva = 'promocion'`
- ✅ `estado = 'pendiente_pago'`
- ✅ Código de reserva único (`PR-*`)
- ✅ Datos del cliente guardados
- ✅ Precio correcto de la promoción

### Fase 4: Pruebas de Seguridad y Performance

#### 4.1 Rate Limiting
```bash
# Probar límite de requests (desde terminal)
for i in {1..20}; do
  curl https://tu-backend.onrender.com/api/promociones-banner -H "Authorization: Bearer TOKEN"
done
```

**Resultado esperado**:
- ✅ Primeros requests: Status 200
- ✅ Después del límite: Status 429 (Too Many Requests)

#### 4.2 Autenticación
```bash
# Intentar acceder sin token
curl https://tu-backend.onrender.com/api/promociones-banner

# Debería retornar: 401 Unauthorized
```

#### 4.3 Validación de Upload
1. Intentar subir archivo NO imagen (PDF, TXT) → Rechazado
2. Intentar subir imagen > 5MB → Rechazado
3. Subir JPG válido < 5MB → Aceptado

### Fase 5: Pruebas de Casos Edge

#### 5.1 Sin Promociones Activas
1. Desactivar todas las promociones en admin
2. Ir al home

**Resultado esperado**:
- ✅ Carrusel NO se muestra
- ✅ Página continúa normal sin errores

#### 5.2 Promoción con Fechas de Vigencia
1. Crear promoción con:
   - Fecha inicio: Ayer
   - Fecha fin: Mañana
2. Verificar que aparece en el carrusel

3. Cambiar **Fecha fin** a ayer
4. Recargar home

**Resultado esperado**:
- ✅ Promoción NO aparece (está vencida)

#### 5.3 Solo Viaje de Ida
1. Crear promoción con **Tipo: Ida**
2. Abrir modal de reserva

**Resultado esperado**:
- ✅ Campos de "Fecha Vuelta" y "Hora Vuelta" NO están presentes
- ✅ Solo fecha/hora de ida requeridas

## 🐛 Troubleshooting

### Problema: No aparece el carrusel en home
**Posibles causas**:
1. No hay promociones activas → Crear una en admin
2. Error de fetch del backend → Revisar console del navegador
3. Backend no responde → Verificar que Render.com está online

### Problema: Error al subir imagen
**Posibles causas**:
1. Imagen muy grande → Reducir a < 5MB
2. Formato no soportado → Usar JPG, PNG, GIF o WebP
3. Permisos de carpeta → Verificar `chmod 755 public/banners`

### Problema: Modal no abre
**Posibles causas**:
1. JavaScript deshabilitado → Habilitar en navegador
2. Error en console → Revisar DevTools
3. Conflicto de dependencias → Limpiar cache y recargar

### Problema: No se crea la reserva
**Posibles causas**:
1. Backend caído → Verificar Render.com status
2. Validación fallida → Revisar logs del backend
3. Base de datos llena → Revisar espacio en MySQL

## 📊 Monitoreo Post-Deployment

### Métricas a Vigilar
1. **Tasa de conversión**: % de clicks en banner → reservas creadas
2. **Tasa de éxito de upload**: % de imágenes subidas exitosamente
3. **Errores 500**: Logs de errores del servidor
4. **Performance**: Tiempo de carga del carrusel

### Logs Importantes
```bash
# En Render.com, buscar en logs:
"Tabla 'promociones_banner' creada"
"Error al crear promoción"
"Error al crear reserva desde promoción"
```

## 📝 Checklist Final de Deployment

Antes de considerar el deployment completo, verificar:

### Backend
- [ ] Migración ejecutada exitosamente
- [ ] Tabla `promociones_banner` existe
- [ ] Endpoint `/api/promociones-banner/activas` responde
- [ ] Rate limiting funciona
- [ ] Autenticación JWT funciona
- [ ] Upload de imágenes funciona

### Frontend
- [ ] Build de producción generado
- [ ] Archivos subidos a Hostinger
- [ ] Carpeta `public/banners/` existe con permisos correctos
- [ ] Carrusel visible en home (si hay promociones)
- [ ] Modal de reserva abre correctamente
- [ ] Formulario valida campos correctamente
- [ ] Responsive en móvil/tablet/desktop

### Admin Panel
- [ ] Menú "Promociones" visible en sidebar
- [ ] Puede crear promoción con imagen
- [ ] Puede editar promoción
- [ ] Puede cambiar estado activo/inactivo
- [ ] Puede eliminar promoción
- [ ] Preview de imagen funciona

### Integración
- [ ] Reservas se crean correctamente
- [ ] Datos se guardan en MySQL
- [ ] Cliente se crea o actualiza
- [ ] Código de reserva único generado
- [ ] `tipo_reserva = 'promocion'`
- [ ] `estado = 'pendiente_pago'`

## 🎉 Integración con Flow (Completada)

El sistema ahora redirige automáticamente a la pasarela de pago Flow después de crear la reserva.

**Flujo de Usuario**:
1. Usuario completa formulario en modal.
2. Click en "Pagar".
3. Reserva se crea en backend (`estado: pendiente`).
4. Backend retorna datos de reserva.
5. Frontend solicita `/create-payment` automáticamente.
6. Usuario es redirigido a Flow para pagar.
7. Al completar pago, Flow notifica al backend (`/api/flow-confirmation`) y redirige al usuario.

**Requerimientos**:
- Variables de entorno `FLOW_API_KEY` y `FLOW_SECRET_KEY` configuradas en Render.
- `FRONTEND_URL` y `BACKEND_URL` correctamente definidos.

---

**Documentación creada**: 2024-02-12  
**Autor**: GitHub Copilot  
**Versión**: 1.1

---

## 🏗️ Arquitectura Técnica y Datos para IA

Esta sección detalla la implementación interna del sistema de banners para facilitar futuras intervenciones por desarrolladores o agentes de IA.

### 1. Modelo de Datos (`MySQL`)

**Tabla**: `promociones_banner`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | INT (PK) | Identificador único |
| `nombre` | VARCHAR(255) | Nombre interno/público de la promoción |
| `imagen_url` | VARCHAR(500) | Ruta relativa a la imagen (`/banners/imagen.jpg`) |
| `precio` | DECIMAL(10,2) | Precio ofertado (sobrescribe tarifa dinámica) |
| `tipo_viaje` | ENUM | `'ida'` o `'ida_vuelta'` |
| `origen` | VARCHAR(100) | Default: 'Temuco' |
| `destino` | VARCHAR(100) | Destino específico |
| `max_pasajeros` | INT | Default: 3 |
| `activo` | BOOLEAN | Control de visibilidad |
| `orden` | INT | Para ordenar el carrusel (ASC) |
| `fecha_inicio` | DATE | Opcional: inicio de vigencia |
| `fecha_fin` | DATE | Opcional: fin de vigencia |

**Relación con Reservas**:
Las reservas creadas desde este sistema tienen:
- `tipo_reserva = 'promocion'`
- `origen/destino` copiados de la promoción
- `precio_total` fijo según la promoción (sin cálculos de distancia)

### 2. API Endpoints (`Backend`)

**Base**: `/api/promociones-banner`

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/activas` | Público | Retorna JSON con promociones vigentes (`activo=1` y fechas válidas) |
| `POST` | `/` | JWT Admin | Crea nueva promoción. Usa `multer` para upload de imagen ("imagen") |
| `POST` | `/desde-promocion/:id` | Público | Crea reserva pendiente. **Body**: `{nombre, email, telefono, fecha_ida, ...}` |
| `PUT` | `/:id` | JWT Admin | Actualiza datos. Si se envía nueva imagen, reemplaza la anterior |
| `PUT` | `/:id/toggle` | JWT Admin | Cambia estado `activo` (true/false) |
| `DELETE` | `/:id` | JWT Admin | Elimina registro y borra archivo de imagen asociado |

### 3. Flujo Crítico: Pago y Confirmación

El sistema usa un flujo de "Pago Diferido Frontend" para banners:

1.  **Frontend (`ReservaRapidaModal`)**: Envía datos a API → Crea Reserva (`pendiente`).
2.  **Frontend**: Recibe ID de reserva → Llama a `/create-payment` (Generic Flow Endpoint).
3.  **Flow**: Procesa pago.
4.  **Webhook (`/api/flow-confirmation`)**: 
    - Recibe notificación de Flow.
    - Busca reserva por `reservaId` o `codigoReserva` (enviados en metadata).
    - Actualiza estado a `pagado` y `confirmada: true`.
    - **Nota**: No activa lógica compleja de asignación de conductores inmediatamente (simplificado para promos).

### 4. Componentes Clave (`Frontend`)

- **`PromocionBanners.jsx`**: Carrusel público. Usa `embla-carousel-react`.
    - *Lógica*: Fetch `/activas`, renderiza slides, maneja click para abrir modal.
- **`ReservaRapidaModal.jsx`**: Formulario de captura rápida.
    - *Lógica*: Pre-llena datos de la promo. Al enviar, encadena `createReserva` + `createPayment` + `window.location.href`.
- **`GestionPromociones.jsx`**: CRUD Admin.
    - *Ubicación*: `src/components/admin/dashboard/`.
    - *Detalle*: Maneja `FormData` para envío de archivos.

### 5. Notas para Agentes IA (Mantenimiento)

- **Integración de Imágenes**: Las imágenes se sirven estáticamente desde `public/banners`. Si se migra el hosting, asegurar que esa carpeta sea persistente y accesible públicamente.
- **Validación de Fechas**: El backend filtra automáticamente por `fecha_inicio` y `fecha_fin`. Para debugging, verificar la zona horaria del servidor.
- **Modificación de Campos**: Si agregas campos a `PromocionBanner`, recuerda actualizar:
    1. Migración (`backend/migrations`)
    2. Modelo (`backend/models/PromocionBanner.js`)
    3. Validación en Router (`promociones-banner.routes.js`)
    4. Formulario Admin (`GestionPromociones.jsx`)
    5. Modal Público (`ReservaRapidaModal.jsx`)
