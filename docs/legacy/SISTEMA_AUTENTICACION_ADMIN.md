# Sistema de Autenticación Robusto para Panel Administrativo

## Resumen

Se ha implementado un sistema de autenticación completo y robusto para el panel administrativo de Transportes Araucaria, reemplazando el sistema simple de token por uno basado en JWT con múltiples capas de seguridad.

## Características Implementadas

### 🔐 Seguridad

1. **Encriptación de Contraseñas**
   - Uso de bcryptjs con salt rounds de 10
   - Las contraseñas nunca se almacenan en texto plano

2. **Tokens JWT**
   - Access token con expiración de 8 horas
   - Refresh token con expiración de 7 días
   - Renovación automática de tokens

3. **Protección contra Fuerza Bruta**
   - Rate limiting en endpoint de login (5 intentos por 15 minutos)
   - Bloqueo de cuenta tras 5 intentos fallidos (30 minutos)
   - Rate limiting general en APIs administrativas

4. **Validación de Contraseñas**
   - Mínimo 8 caracteres
   - Al menos una mayúscula, minúscula, número y carácter especial
   - Validación en frontend y backend

5. **Auditoría Completa**
   - Registro de todos los intentos de login (exitosos y fallidos)
   - Logs de acciones administrativas (crear, editar, eliminar)
   - Registro de IPs y User Agents
   - Registro de cuentas bloqueadas

6. **Roles de Usuario**
   - `superadmin`: Acceso completo, puede crear/editar usuarios
   - `admin`: Gestión completa del sistema
   - `operador`: Solo lectura (preparado para futura implementación)

### 🎨 Interfaz de Usuario

1. **Pantalla de Login Profesional**
   - Diseño moderno y responsivo
   - Indicador de fortaleza de contraseña
   - Mensajes de error claros
   - Mostrar/ocultar contraseña
   - Indicadores de características de seguridad

2. **Header de Usuario en Panel Admin**
   - Muestra nombre y rol del usuario actual
   - Botón de cerrar sesión
   - Avatar visual

3. **Protección de Rutas**
   - Redirección automática a login si no está autenticado
   - Verificación periódica de token
   - Renovación automática cuando expira

## Arquitectura

### Backend

#### Modelos de Base de Datos

**AdminUser** (`admin_users`)
```javascript
{
  id: INTEGER (PK),
  username: STRING (unique),
  email: STRING (unique),
  password: STRING (hashed),
  nombre: STRING,
  rol: ENUM('superadmin', 'admin', 'operador'),
  activo: BOOLEAN,
  ultimoAcceso: DATE,
  intentosFallidos: INTEGER,
  bloqueadoHasta: DATE,
  tokenRefresh: STRING,
  createdAt: DATE,
  updatedAt: DATE
}
```

**AdminAuditLog** (`admin_audit_logs`)
```javascript
{
  id: INTEGER (PK),
  adminUserId: INTEGER (FK),
  accion: STRING,
  entidad: STRING,
  entidadId: INTEGER,
  detalles: TEXT (JSON),
  ip: STRING,
  userAgent: STRING,
  resultado: ENUM('exitoso', 'fallido', 'bloqueado'),
  createdAt: DATE
}
```

#### Endpoints de Autenticación

| Método | Endpoint | Descripción | Protección |
|--------|----------|-------------|------------|
| POST | `/api/auth/login` | Iniciar sesión | Rate limiter |
| POST | `/api/auth/logout` | Cerrar sesión | JWT |
| POST | `/api/auth/refresh` | Renovar access token | - |
| GET | `/api/auth/verify` | Verificar token actual | JWT |
| POST | `/api/auth/change-password` | Cambiar contraseña | JWT + Strict limiter |
| POST | `/api/auth/users` | Crear usuario admin | JWT + Superadmin |
| GET | `/api/auth/users` | Listar usuarios admin | JWT + Superadmin |

#### Middlewares

1. **authJWT**: Verifica token JWT válido
2. **authAdminCompatible**: Compatibilidad con token antiguo + JWT
3. **requireRole**: Verifica rol específico del usuario
4. **loginLimiter**: Rate limiting para login (5 intentos / 15 min)
5. **apiLimiter**: Rate limiting general (100 requests / 15 min)
6. **strictLimiter**: Rate limiting estricto (10 operaciones / hora)

#### Utilidades

- **utils/auth.js**: Funciones de hash, JWT, validaciones
- **utils/auditLog.js**: Funciones para registrar acciones

### Frontend

#### Contexto de Autenticación

**AuthContext** proporciona:
- `user`: Datos del usuario actual
- `isAuthenticated`: Estado de autenticación
- `loading`: Estado de carga
- `login(username, password)`: Función de login
- `logout()`: Función de logout
- `getValidToken()`: Obtener token válido (renueva si es necesario)
- `changePassword(current, new)`: Cambiar contraseña
- `hasRole(role)`: Verificar rol del usuario

#### Componentes

1. **LoginAdmin**: Pantalla de login
2. **ProtectedRoute**: Wrapper para rutas protegidas
3. **AdminDashboard**: Panel admin mejorado con header de usuario

#### Hooks Personalizados

- **useAuth**: Hook para acceder al contexto de autenticación
- **useAuthenticatedFetch**: Hook para peticiones API autenticadas

## Instalación y Configuración

### 1. Instalar Dependencias Backend

```bash
cd backend
npm install
```

Las dependencias instaladas:
- `bcryptjs`: Encriptación de contraseñas
- `jsonwebtoken`: Generación y verificación de JWT
- `express-rate-limit`: Protección contra fuerza bruta

### 2. Configurar Variables de Entorno

Crear/actualizar `backend/.env`:

```env
# Base de datos (ya existente)
DB_HOST=srv1551.hstgr.io
DB_PORT=3306
DB_NAME=u419311572_araucaria
DB_USER=u419311572_admin
DB_PASSWORD=tu_password

# JWT Secret (NUEVO - cambiar por valor seguro)
JWT_SECRET=tu-secreto-jwt-super-seguro-cambiar-en-produccion

# Token antiguo para compatibilidad (MANTENER)
ADMIN_TOKEN=araucaria-admin-2024-secure-token-xyz789

# Puerto
PORT=3001
```

### 3. Ejecutar Migración de Base de Datos

```bash
cd backend
node migrations/create-admin-tables.js
```

Esto creará:
- Tabla `admin_users`
- Tabla `admin_audit_logs`
- Usuario superadmin por defecto:
  - Usuario: `admin`
  - Contraseña: `Admin123!`
  - **⚠️ CAMBIAR INMEDIATAMENTE EN PRODUCCIÓN**

### 4. Actualizar Backend en Render.com

1. Ir al dashboard de Render.com
2. Seleccionar el servicio backend
3. Agregar variable de entorno:
   - **Key**: `JWT_SECRET`
   - **Value**: (generar con `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
4. Guardar y redesplegar

### 5. Verificar Frontend

El frontend se actualiza automáticamente al hacer deploy. No requiere variables de entorno adicionales.

## Uso del Sistema

### Primera Vez - Configuración Inicial

1. **Acceder al panel**: Ir a https://transportesaraucaria.cl/admin
2. **Login inicial**:
   - Usuario: `admin`
   - Contraseña: `Admin123!`
3. **Cambiar contraseña inmediatamente**:
   - (Funcionalidad pendiente de agregar en UI)

### Crear Nuevos Usuarios Admin

Solo usuarios con rol `superadmin` pueden crear otros usuarios.

**Mediante API**:

```bash
curl -X POST https://transportes-araucaria.onrender.com/api/auth/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "username": "nuevo_admin",
    "email": "admin@ejemplo.cl",
    "password": "Password123!",
    "nombre": "Nuevo Administrador",
    "rol": "admin"
  }'
```

### Cambiar Contraseña

**Mediante API**:

```bash
curl -X POST https://transportes-araucaria.onrender.com/api/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "currentPassword": "Admin123!",
    "newPassword": "NuevaPassword123!"
  }'
```

### Consultar Logs de Auditoría

Los logs se almacenan en la tabla `admin_audit_logs` y pueden consultarse directamente en la base de datos:

```sql
SELECT 
  al.*,
  au.username,
  au.nombre
FROM admin_audit_logs al
LEFT JOIN admin_users au ON al.admin_user_id = au.id
ORDER BY al.createdAt DESC
LIMIT 100;
```

## Compatibilidad con Sistema Anterior

El sistema es **100% compatible** con el token antiguo (`ADMIN_TOKEN`). El middleware `authAdminCompatible` acepta:

1. **Tokens JWT nuevos**: `Bearer eyJhbGciOiJIUzI1...`
2. **Token antiguo**: `Bearer araucaria-admin-2024-secure-token-xyz789`

Esto permite una transición gradual sin interrumpir el servicio.

## Seguridad - Mejores Prácticas

### ✅ Implementado

- [x] Contraseñas hasheadas con bcrypt
- [x] Tokens JWT con expiración
- [x] Rate limiting en endpoints sensibles
- [x] Bloqueo de cuenta tras intentos fallidos
- [x] Validación de fortaleza de contraseñas
- [x] Sanitización de inputs
- [x] Logs de auditoría completos
- [x] Roles y permisos
- [x] HTTPS en producción (Render.com)
- [x] Variables de entorno para secretos

### 📋 Recomendaciones Adicionales

- [ ] Implementar autenticación de dos factores (2FA)
- [ ] Notificaciones por email en eventos de seguridad
- [ ] Política de expiración de contraseñas
- [ ] Historial de contraseñas para evitar reutilización
- [ ] Whitelist de IPs para acceso admin (opcional)
- [ ] Monitoreo activo de logs de auditoría

## Troubleshooting

### Problema: No puedo hacer login

**Solución**:
1. Verificar que la migración se ejecutó correctamente
2. Verificar credenciales: usuario `admin`, contraseña `Admin123!`
3. Revisar logs del backend en Render.com
4. Verificar que `JWT_SECRET` está configurado en variables de entorno

### Problema: Token expirado constantemente

**Solución**:
1. El token expira en 8 horas por diseño
2. El sistema renueva automáticamente usando refresh token
3. Si persiste, cerrar sesión y volver a iniciar

### Problema: Cuenta bloqueada

**Solución**:
1. Esperar 30 minutos para desbloqueo automático
2. O ejecutar en base de datos:
   ```sql
   UPDATE admin_users 
   SET intentos_fallidos = 0, bloqueado_hasta = NULL 
   WHERE username = 'usuario';
   ```

### Problema: Error 401 en llamadas API desde componentes admin

**Solución**:
1. Los componentes admin existentes usan el token antiguo
2. Actualizar gradualmente para usar `useAuthenticatedFetch` hook
3. O mantener compatibilidad con token antiguo en `.env`

## Próximas Mejoras

1. **UI de Gestión de Usuarios**
   - Panel para crear/editar/desactivar usuarios admin
   - Desde el panel administrativo

2. **UI de Cambio de Contraseña**
   - Formulario en el perfil del usuario
   - Validación visual de requisitos

3. **Panel de Auditoría**
   - Visualizar logs de auditoría desde el panel
   - Filtros por fecha, usuario, acción

4. **Notificaciones de Seguridad**
   - Email al detectar login sospechoso
   - Email cuando cuenta es bloqueada

5. **Autenticación de Dos Factores**
   - Implementar TOTP (Google Authenticator)
   - SMS (opcional)

## Soporte

Para problemas o consultas:
- Revisar este documento
- Consultar logs en Render.com
- Revisar tabla `admin_audit_logs` en base de datos
- Contactar al equipo de desarrollo

---

**Última actualización**: 2025-11-06
**Versión del sistema**: 1.0.0
