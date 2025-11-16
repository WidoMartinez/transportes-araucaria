# Despliegue en Hostinger - Backend Node.js

## 📋 Resumen

Esta rama (`hostinger-backend`) está configurada específicamente para el despliegue del backend en el servicio de **App Web Frontend de Node.js** de Hostinger.

---

## 🎯 Configuración en Hostinger

### Parámetros de compilación y salida:

- **Marco (Framework)**: Vite (seleccionar en dropdown)
- **Rama**: `hostinger-backend` (esta rama)
- **Versión de Node**: 22.x (recomendado) o 18.x mínimo
- **Directorio raíz**: `/` (raíz del proyecto)

### Comandos de build y start:

**Directorio raíz del backend**: `/backend`

```bash
# Build Command (instalación)
cd backend && npm install

# Start Command (inicio del servidor)
cd backend && npm run start:migrate
```

---

## 🔧 Variables de entorno requeridas

Debes configurar estas variables en el panel de Hostinger:

```env
# Base de datos MySQL (proporcionada por Hostinger o externa)
DB_HOST=tu_host_mysql
DB_USER=tu_usuario_mysql
DB_PASSWORD=tu_password_mysql
DB_NAME=transportes_araucaria
DB_PORT=3306

# JWT para autenticación admin
JWT_SECRET=tu_clave_secreta_jwt

# Puerto (si Hostinger lo requiere, sino usar el que asignen)
PORT=10000

# Entorno
NODE_ENV=production

# CORS - Dominios permitidos (tu dominio de Hostinger)
ALLOWED_ORIGINS=https://tu-dominio-hostinger.com,https://transportes-araucaria.com
```

---

## 📊 Base de datos MySQL

### Opción 1: Base de datos de Hostinger

Si Hostinger proporciona MySQL en el mismo plan:

- Crear base de datos desde el panel de Hostinger
- Obtener credenciales (host, usuario, contraseña)
- Configurar en variables de entorno

### Opción 2: Mantener base de datos externa

Si prefieres mantener la BD actual:

- Asegurar que el host de BD permita conexiones desde IPs de Hostinger
- Configurar firewall/whitelist si es necesario
- Verificar latencia (puede afectar rendimiento)

---

## 🚀 Pasos de despliegue

1. **Subir código a GitHub**:

   ```bash
   git push origin hostinger-backend
   ```

2. **Configurar en Hostinger**:

   - Seleccionar repositorio: `transportes-araucaria`
   - Seleccionar rama: `hostinger-backend`
   - Marco: Vite
   - Versión Node: 22.x
   - Directorio raíz: `/`

3. **Configurar variables de entorno** en panel de Hostinger

4. **Desplegar** y esperar compilación

5. **Verificar**:
   - Acceder a la URL proporcionada por Hostinger
   - Probar endpoint de salud: `GET /api/health`
   - Verificar logs en panel de Hostinger

---

## 🔄 Diferencias con Render.com

| Aspecto        | Render.com                     | Hostinger                  |
| -------------- | ------------------------------ | -------------------------- |
| Archivo config | `render.yaml`                  | Configuración en panel web |
| Variables env  | Panel Render                   | Panel Hostinger            |
| Logs           | Dashboard Render               | Panel Hostinger            |
| Dominio        | Subdominio .onrender.com       | Subdominio Hostinger       |
| Base de datos  | Separada (configurar conexión) | Posiblemente integrada     |

---

## ⚠️ Notas importantes

1. **Archivos PHP no afectados**: Los archivos PHP seguirán en el hosting tradicional de Hostinger. Este despliegue es SOLO para el backend Node.js.

2. **CORS**: Actualizar `ALLOWED_ORIGINS` para incluir el nuevo dominio de Hostinger.

3. **Migraciones**: El comando `start:migrate` ejecuta migraciones automáticamente al iniciar.

4. **Monitoreo**: Verificar logs regularmente después del despliegue inicial.

5. **Rollback**: Si algo falla, puedes volver a Render.com (mantener configuración).

---

## 🧪 Testing post-despliegue

```bash
# Verificar salud del servidor
curl https://tu-dominio-hostinger.com/api/health

# Verificar autenticación (requiere token)
curl -X POST https://tu-dominio-hostinger.com/api/auth/validate \
  -H "Authorization: Bearer TU_TOKEN"

# Verificar disponibilidad
curl https://tu-dominio-hostinger.com/api/disponibilidad?fecha=2025-11-20
```

---

## 📞 Soporte

Si encuentras problemas:

1. Revisar logs en panel de Hostinger
2. Verificar variables de entorno
3. Comprobar conexión a base de datos
4. Validar versión de Node.js

---

**Última actualización**: 16 de noviembre de 2025  
**Rama**: `hostinger-backend`  
**Estado**: Lista para despliegue
