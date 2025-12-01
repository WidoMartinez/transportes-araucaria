# Guía Rápida: Sistema de Autenticación Administrativo

## ✨ ¿Qué se ha implementado?

Se ha creado un **sistema de autenticación robusto y seguro** para el panel administrativo con:

- 🔐 **Pantalla de login profesional** con validación
- 🔑 **Contraseñas encriptadas** (bcrypt)
- ⏰ **Tokens JWT** que expiran en 8 horas
- 🛡️ **Protección contra ataques**: bloqueo tras 5 intentos fallidos
- 📝 **Logs de auditoría** completos
- 👥 **Sistema de roles**: superadmin, admin, operador

## 🚀 Pasos para Activar el Sistema

### Paso 1: Actualizar Backend en Render.com ⚠️ IMPORTANTE

1. **Ir a**: [Render.com Dashboard](https://dashboard.render.com)
2. **Seleccionar** tu servicio backend
3. **Ir a**: Environment → Environment Variables
4. **Agregar nueva variable**:
   - **Key**: `JWT_SECRET`
   - **Value**: Generar un secreto seguro (ver abajo cómo)
5. **Guardar** cambios
6. Render **redesplegarará automáticamente** el backend

#### Generar JWT_SECRET Seguro

Opción 1 - Desde terminal (si tienes Node.js):
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Opción 2 - Usar este ejemplo (cambiar en producción):
```
a8f5f167f44f4964e6c998dee827110c03f0fe8e8e6e3b52d1f8ad9c6e9c5e24
```

### Paso 2: Crear Tablas en la Base de Datos

Conectarse a la base de datos MySQL y ejecutar:

```sql
-- Tabla de usuarios administradores
CREATE TABLE IF NOT EXISTS admin_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  rol ENUM('superadmin', 'admin', 'operador') DEFAULT 'admin' NOT NULL,
  activo BOOLEAN DEFAULT TRUE NOT NULL,
  ultimo_acceso DATETIME,
  intentos_fallidos INT DEFAULT 0 NOT NULL,
  bloqueado_hasta DATETIME,
  token_refresh VARCHAR(500),
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  INDEX idx_username (username),
  INDEX idx_email (email),
  INDEX idx_activo (activo)
);

-- Tabla de logs de auditoría
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  admin_user_id INT,
  accion VARCHAR(100) NOT NULL,
  entidad VARCHAR(100),
  entidad_id INT,
  detalles TEXT,
  ip VARCHAR(50),
  user_agent VARCHAR(500),
  resultado ENUM('exitoso', 'fallido', 'bloqueado') DEFAULT 'exitoso' NOT NULL,
  createdAt DATETIME NOT NULL,
  INDEX idx_admin_user_id (admin_user_id),
  INDEX idx_accion (accion),
  INDEX idx_createdAt (createdAt),
  INDEX idx_resultado (resultado),
  FOREIGN KEY (admin_user_id) REFERENCES admin_users(id)
);

-- Crear usuario administrador inicial
INSERT INTO admin_users (
  username,
  email,
  password,
  nombre,
  rol,
  activo,
  createdAt,
  updatedAt
) VALUES (
  'admin',
  'admin@transportesaraucaria.cl',
  '$2a$10$YourHashedPasswordHere', -- Este hash es temporal, usar el que genera la migración
  'Administrador Principal',
  'superadmin',
  TRUE,
  NOW(),
  NOW()
);
```

**NOTA**: Es más fácil usar el script de migración automática:

```bash
cd backend
node migrations/create-admin-tables.js
```

Este script:
- Crea las tablas automáticamente
- Crea el usuario admin con contraseña `Admin123!`
- Verifica que todo esté correcto

### Paso 3: Probar el Sistema

1. **Ir a**: https://transportesaraucaria.cl/admin
2. **Verás la nueva pantalla de login** 🎉
3. **Credenciales iniciales**:
   - Usuario: `admin`
   - Contraseña: `Admin123!`

### Paso 4: Cambiar Contraseña Inicial ⚠️ IMPORTANTE

Por seguridad, **cambia la contraseña inmediatamente** después del primer login.

Por ahora, usar la API:

```bash
curl -X POST https://transportes-araucaria.onrender.com/api/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_ACCESS_TOKEN" \
  -d '{
    "currentPassword": "Admin123!",
    "newPassword": "TuNuevaContraseñaSegura123!"
  }'
```

El access token lo obtienes del login en el panel.

## 🔄 Compatibilidad con Sistema Anterior

**¡No te preocupes!** El sistema es **100% compatible** con el token antiguo.

- ✅ El token antiguo (`ADMIN_TOKEN`) **sigue funcionando**
- ✅ Puedes usar **ambos sistemas** simultáneamente
- ✅ **No hay interrupción** del servicio
- ✅ Transición **gradual y segura**

## 📊 Características de Seguridad Activas

Una vez activado, el sistema tiene:

### Protección contra Ataques
- ✅ Máximo 5 intentos de login por IP cada 15 minutos
- ✅ Cuenta bloqueada 30 minutos tras 5 intentos fallidos
- ✅ Protección contra fuerza bruta

### Contraseñas Seguras
- ✅ Mínimo 8 caracteres
- ✅ Mayúsculas + minúsculas + números + caracteres especiales
- ✅ Encriptación con bcrypt (irreversible)

### Sesiones
- ✅ Token expira en 8 horas
- ✅ Renovación automática con refresh token
- ✅ Cierre de sesión seguro

### Auditoría
- ✅ Registro de todos los logins (exitosos y fallidos)
- ✅ Registro de IPs y navegadores
- ✅ Historial de acciones administrativas

## 🔍 Verificar que Funciona

### 1. Verificar Variables de Entorno

En Render.com, verificar que existe:
- `JWT_SECRET` ✓
- `ADMIN_TOKEN` ✓ (para compatibilidad)

### 2. Verificar Tablas en Base de Datos

```sql
-- Verificar que existen las tablas
SHOW TABLES LIKE 'admin_%';

-- Verificar usuario admin
SELECT id, username, email, nombre, rol, activo 
FROM admin_users 
WHERE username = 'admin';
```

### 3. Verificar Endpoints API

```bash
# Verificar que el endpoint de login responde
curl https://transportes-araucaria.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin123!"}'
```

Debería retornar:
```json
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@transportesaraucaria.cl",
      "nombre": "Administrador Principal",
      "rol": "superadmin"
    }
  }
}
```

### 4. Verificar Pantalla de Login

1. Abrir https://transportesaraucaria.cl/admin
2. Debería mostrar pantalla de login (no el panel directamente)
3. Hacer login con credenciales
4. Debería mostrar el panel con header de usuario

## ❓ Preguntas Frecuentes

### ¿Puedo seguir usando el token antiguo?

**Sí**, ambos sistemas funcionan en paralelo. El token antiguo (`ADMIN_TOKEN`) sigue siendo válido.

### ¿Qué pasa si olvido la contraseña?

Por ahora, necesitas acceso a la base de datos para resetear:

```sql
-- Resetear intentos fallidos
UPDATE admin_users 
SET intentos_fallidos = 0, bloqueado_hasta = NULL 
WHERE username = 'tu_usuario';

-- Para cambiar contraseña, necesitas generar un hash bcrypt
-- (pendiente implementar recuperación por email)
```

### ¿Cómo creo más usuarios admin?

Usando la API (requiere ser superadmin):

```bash
curl -X POST https://transportes-araucaria.onrender.com/api/auth/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_ACCESS_TOKEN" \
  -d '{
    "username": "nuevo_admin",
    "email": "nuevo@ejemplo.cl",
    "password": "Password123!",
    "nombre": "Nuevo Admin",
    "rol": "admin"
  }'
```

### ¿Dónde veo los logs de seguridad?

En la base de datos, tabla `admin_audit_logs`:

```sql
SELECT * FROM admin_audit_logs 
ORDER BY createdAt DESC 
LIMIT 50;
```

## 🐛 Problemas Comunes

### No puedo hacer login

**Verificar**:
1. ¿Ejecutaste la migración de base de datos?
2. ¿El backend tiene la variable `JWT_SECRET`?
3. ¿Las credenciales son correctas? (`admin` / `Admin123!`)
4. ¿Está bloqueada la cuenta? (esperar 30 min o resetear en BD)

### El token expira muy rápido

**Es normal**: Los tokens expiran en 8 horas por seguridad. El sistema renueva automáticamente usando el refresh token.

### Error 401 en API

**Causa**: Token inválido o expirado.

**Solución**:
1. Cerrar sesión
2. Volver a iniciar sesión
3. El nuevo token funcionará

## 📞 Soporte

- **Documentación completa**: Ver `SISTEMA_AUTENTICACION_ADMIN.md`
- **Logs del backend**: https://dashboard.render.com (en tu servicio → Logs)
- **Base de datos**: Revisar tabla `admin_audit_logs` para debug

---

**¡Listo!** Tu panel administrativo ahora está protegido con un sistema de autenticación robusto y profesional. 🎉🔐
