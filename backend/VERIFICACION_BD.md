# Guía de Verificación de la Base de Datos MySQL en Hostinger

Este documento proporciona instrucciones detalladas para verificar que la base de datos en Hostinger está operativa después de la eliminación del sistema alternativo basado en JSON.

## 📋 Contexto

El sistema de Transportes Araucaria migró de un sistema basado en archivos JSON (`server.js`) a una base de datos MySQL persistente en Hostinger (`server-db.js`). Esta guía te ayudará a verificar que todo está funcionando correctamente.

## 🔍 Verificaciones Necesarias

### 1. Verificación Desde el Servidor (Render.com)

El backend está desplegado en Render.com y debe poder conectarse a la base de datos MySQL en Hostinger.

#### A. Verificar Logs del Servidor

1. Accede al panel de Render.com
2. Selecciona el servicio del backend
3. Ve a la sección "Logs"
4. Busca el mensaje: `✅ Conexión a la base de datos establecida correctamente`

Si ves este mensaje, la conexión está funcionando.

#### B. Verificar Endpoints de Salud

Abre en tu navegador o usa `curl`:

```bash
# Health check básico
curl https://tu-backend.onrender.com/health

# Verificar conexión a BD
curl https://tu-backend.onrender.com/api/test-connection

# Verificar tablas
curl https://tu-backend.onrender.com/api/test-tables
```

### 2. Verificación Desde Entorno Local

Si tienes acceso al código fuente localmente:

#### A. Configurar Variables de Entorno

Crea un archivo `.env` en la carpeta `backend/`:

```env
DB_HOST=srv1551.hstgr.io
DB_PORT=3306
DB_NAME=u419311572_araucaria
DB_USER=u419311572_admin
DB_PASSWORD=tu_password_real_aqui
```

#### B. Ejecutar Script de Verificación

```bash
cd backend
npm install
npm run verificar
```

Este script realizará:
- ✅ Prueba de conexión a la base de datos
- ✅ Verificación de existencia de tablas
- ✅ Validación de estructura de columnas
- ✅ Conteo de registros en cada tabla
- ✅ Pruebas CRUD (Crear, Leer, Actualizar, Eliminar)
- ✅ Verificación de integridad referencial

### 3. Verificación Desde phpMyAdmin (Hostinger)

#### A. Acceder a phpMyAdmin

1. Inicia sesión en tu panel de Hostinger
2. Ve a "Bases de datos" → "Administración"
3. Haz clic en "phpMyAdmin" junto a tu base de datos

#### B. Verificar Tablas

Deberías ver las siguientes tablas:

- ✅ `destinos` - Almacena los destinos y sus precios
- ✅ `promociones` - Almacena promociones por día de la semana
- ✅ `descuentos_globales` - Almacena descuentos globales del sistema
- ✅ `codigos_descuento` - Almacena códigos de descuento personalizados
- ✅ `reservas` - Almacena todas las reservas realizadas

#### C. Verificar Datos

Ejecuta estas consultas SQL para verificar que hay datos:

```sql
-- Contar destinos
SELECT COUNT(*) as total FROM destinos;

-- Contar promociones
SELECT COUNT(*) as total FROM promociones;

-- Contar códigos de descuento
SELECT COUNT(*) as total FROM codigos_descuento;

-- Contar reservas
SELECT COUNT(*) as total FROM reservas;

-- Ver últimas reservas
SELECT id, nombre, email, destino, fecha, estado, created_at 
FROM reservas 
ORDER BY created_at DESC 
LIMIT 10;
```

#### D. Verificar Estructura de Tabla `destinos`

```sql
DESCRIBE destinos;
```

Deberías ver estas columnas:
- `id` (PRIMARY KEY)
- `nombre`
- `precio_ida`
- `precio_vuelta`
- `precio_ida_vuelta`
- `activo`
- `orden`
- `descripcion`
- `tiempo`
- `imagen`
- `max_pasajeros`
- `min_horas_anticipacion`
- `created_at`
- `updated_at`

### 4. Verificación de Persistencia de Datos

Para verificar que los datos persisten correctamente después de un redespliegue:

#### A. Crear un Registro de Prueba

Antes de redesplegar, crea un destino de prueba:

```bash
curl -X POST https://tu-backend.onrender.com/api/destinos \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "DESTINO_PRUEBA_PERSISTENCIA",
    "precioIda": 15000,
    "precioVuelta": 15000,
    "precioIdaVuelta": 27000,
    "activo": true
  }'
```

#### B. Redesplegar la Aplicación

Desde el panel de Render:
1. Ve a tu servicio de backend
2. Haz clic en "Manual Deploy" → "Deploy latest commit"

#### C. Verificar que el Registro Persiste

```bash
curl https://tu-backend.onrender.com/api/destinos | grep "DESTINO_PRUEBA_PERSISTENCIA"
```

Si encuentras el registro, ¡los datos persisten correctamente! 🎉

#### D. Limpiar Registro de Prueba

```bash
# Primero obtén el ID del destino
curl https://tu-backend.onrender.com/api/destinos | jq '.[] | select(.nombre=="DESTINO_PRUEBA_PERSISTENCIA") | .id'

# Luego elimínalo (reemplaza {ID} con el ID obtenido)
curl -X DELETE https://tu-backend.onrender.com/api/destinos/{ID}
```

## ⚠️ Problemas Comunes y Soluciones

### Problema 1: "Error de conexión a la base de datos"

**Posibles causas:**
- Variables de entorno mal configuradas en Render
- Contraseña incorrecta
- Acceso remoto no habilitado en Hostinger

**Solución:**
1. Verifica las variables de entorno en el panel de Render
2. Confirma la contraseña en phpMyAdmin
3. En Hostinger, ve a "MySQL remoto" y asegúrate de que "Cualquier host" esté habilitado

### Problema 2: "Tabla no existe"

**Posible causa:**
- Las tablas no se crearon automáticamente

**Solución:**
```bash
# Desde tu entorno local
cd backend
npm run migrate
```

O accede al endpoint:
```bash
curl https://tu-backend.onrender.com/api/sync-all
```

### Problema 3: "Los datos se pierden al redesplegar"

**Posible causa:**
- El servidor está usando `server.js` en lugar de `server-db.js`

**Solución:**
1. En Render, verifica que el comando de inicio sea: `npm start`
2. Verifica que `package.json` tenga: `"start": "node server-db.js"`
3. Si no es así, actualiza y redesplega

### Problema 4: "Error: ER_NOT_SUPPORTED_AUTH_MODE"

**Posible causa:**
- Problema de autenticación con MySQL 8.0+

**Solución:**
Ejecuta en phpMyAdmin:
```sql
ALTER USER 'u419311572_admin'@'%' IDENTIFIED WITH mysql_native_password BY 'tu_password';
FLUSH PRIVILEGES;
```

## 📊 Checklist de Verificación Completa

Usa este checklist para verificar que todo está funcionando:

- [ ] La conexión a la base de datos es exitosa
- [ ] Todas las 5 tablas están creadas
- [ ] La tabla `destinos` tiene datos
- [ ] La tabla `promociones` está disponible
- [ ] La tabla `codigos_descuento` funciona correctamente
- [ ] La tabla `reservas` puede almacenar reservas
- [ ] Los datos persisten después de redesplegar
- [ ] Las operaciones CRUD funcionan correctamente
- [ ] No hay errores en los logs de Render
- [ ] Los endpoints de la API responden correctamente

## 🔧 Scripts de Verificación Disponibles

En la carpeta `backend/`, puedes ejecutar:

```bash
# Verificación completa de la base de datos
npm run verificar

# Probar solo la conexión
node test-connection.js

# Ejecutar pruebas de la base de datos
npm run test:db

# Migrar datos desde JSON
npm run migrate
```

## 📞 Información de Contacto

**Base de Datos:**
- Host: `srv1551.hstgr.io`
- Puerto: `3306`
- Nombre: `u419311572_araucaria`
- Usuario: `u419311572_admin`

**Backend:**
- Plataforma: Render.com
- Script principal: `server-db.js`

**Frontend:**
- Hosting: Hostinger
- Sistema de reservas PHP: Separado del backend Node.js

## 📝 Notas Importantes

1. **No modificar archivos PHP**: El sistema de notificaciones por email (PHPMailer) está en Hostinger y no debe modificarse.

2. **Dos sistemas separados**:
   - Backend Node.js (Render) → Maneja pagos y API de precios
   - Frontend PHP (Hostinger) → Maneja reservas y emails

3. **Sistema alternativo eliminado**: El sistema basado en JSON (`server.js`) ya no se usa, pero el código permanece como backup.

4. **Persistencia garantizada**: Con la base de datos MySQL en Hostinger, los datos persisten incluso cuando Render redesplega el backend.

## ✅ Resultado Esperado

Después de completar todas las verificaciones, deberías confirmar que:

1. ✅ La base de datos está operativa y accesible desde Render
2. ✅ Todas las tablas están creadas y con la estructura correcta
3. ✅ Los datos persisten después de redespliegues
4. ✅ Las operaciones CRUD funcionan correctamente
5. ✅ No hay pérdida de información

Si todas estas condiciones se cumplen, **el sistema de base de datos en Hostinger está completamente operativo** y la eliminación del sistema alternativo no causó ningún daño.
