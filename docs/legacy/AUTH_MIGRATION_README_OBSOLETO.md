# Migración de Tablas de Autenticación

## Archivos Disponibles

### 1. `create-admin-tables.js` (RECOMENDADO)

Script Node.js que:
- ✅ Crea las tablas `admin_users` y `admin_audit_logs`
- ✅ Genera el hash bcrypt correcto de la contraseña inicial
- ✅ Crea usuario admin con credenciales válidas
- ✅ Verifica que todo esté correcto

**Uso**:
```bash
cd backend
node migrations/create-admin-tables.js
```

**Salida esperada**:
```
🔄 Iniciando migración: Crear tablas de administración...
✅ Conexión a base de datos establecida
✅ Tabla admin_users creada/verificada
✅ Tabla admin_audit_logs creada/verificada
⚠️  No se encontró ningún superadmin. Creando usuario por defecto...
✅ Usuario superadmin creado:
   Usuario: admin
   Contraseña: Admin123!
   ⚠️  IMPORTANTE: Cambie esta contraseña inmediatamente después del primer login
✅ Migración completada exitosamente
```

### 2. `create-admin-tables.sql`

Script SQL puro para crear las tablas manualmente.

**Uso**:
```bash
mysql -u usuario -p -h host database < backend/migrations/create-admin-tables.sql
```

**NOTA**: Este script NO genera el hash correcto de la contraseña. Después de ejecutarlo, debes ejecutar el script JS o insertar manualmente un usuario con contraseña hasheada.

## Credenciales Iniciales

Una vez ejecutada la migración:

- **Usuario**: `admin`
- **Contraseña**: `Admin123!`
- **Rol**: `superadmin`
- **Email**: `admin@transportesaraucaria.cl`

## ⚠️ Seguridad

**IMPORTANTE**: Cambiar la contraseña inmediatamente después del primer login.

### Opción 1: Mediante API

```bash
curl -X POST https://transportes-araucaria.onrender.com/api/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_ACCESS_TOKEN" \
  -d '{
    "currentPassword": "Admin123!",
    "newPassword": "TuNuevaContraseñaSegura123!"
  }'
```

### Opción 2: Directamente en Base de Datos

```javascript
// Generar hash de nueva contraseña
const bcrypt = require('bcryptjs');
const newPassword = 'TuNuevaContraseña123!';
const hash = bcrypt.hashSync(newPassword, 10);
console.log(hash);
```

Luego en MySQL:
```sql
UPDATE admin_users 
SET password = 'HASH_GENERADO' 
WHERE username = 'admin';
```

## Troubleshooting

### Error: No se puede conectar a la base de datos

**Causa**: Variables de entorno no configuradas.

**Solución**: Verificar archivo `backend/.env`:
```env
DB_HOST=srv1551.hstgr.io
DB_PORT=3306
DB_NAME=u419311572_araucaria
DB_USER=u419311572_admin
DB_PASSWORD=tu_password
```

### Error: Tabla ya existe

**No es un problema**: El script verifica si las tablas existen y no las recrea. Es seguro ejecutarlo múltiples veces.

### Usuario admin ya existe

**No es un problema**: El script verifica si existe un superadmin antes de crear uno nuevo.

## Verificación Post-Migración

```sql
-- Verificar tablas creadas
SHOW TABLES LIKE 'admin_%';

-- Verificar usuario admin
SELECT id, username, email, nombre, rol, activo 
FROM admin_users 
WHERE username = 'admin';

-- Debería mostrar:
-- id: 1
-- username: admin
-- email: admin@transportesaraucaria.cl
-- nombre: Administrador Principal
-- rol: superadmin
-- activo: 1

-- Verificar estructura de logs
DESCRIBE admin_audit_logs;
```

## Rollback (Revertir Migración)

Si necesitas eliminar las tablas:

```sql
-- ⚠️ PRECAUCIÓN: Esto eliminará todos los datos
DROP TABLE IF EXISTS admin_audit_logs;
DROP TABLE IF EXISTS admin_users;
```

## Soporte

Si tienes problemas con la migración:
1. Verificar logs del script
2. Verificar conexión a base de datos
3. Verificar permisos del usuario MySQL
4. Consultar `GUIA_RAPIDA_AUTENTICACION.md` en la raíz del proyecto
