# 🔍 Sistema de Verificación de Base de Datos

## 📖 Resumen

Este directorio contiene un sistema completo de verificación para la base de datos MySQL del proyecto Transportes Araucaria. El sistema permite confirmar que la base de datos en Hostinger está operativa y que la eliminación del sistema alternativo no ha causado daños.

## 🎯 ¿Qué Se Verificó?

La verificación confirma que después de eliminar el sistema alternativo basado en JSON:

✅ La base de datos MySQL en Hostinger está operativa  
✅ Todas las tablas están creadas correctamente  
✅ Los modelos de Sequelize están bien configurados  
✅ El sistema de migración funciona  
✅ Los datos persisten después de redespliegues  

## 📁 Archivos de Verificación

### 1. Scripts de Verificación

#### `verificar-sistema.js`
**Propósito:** Verificación sin conexión a base de datos  
**Uso:** `npm run verificar:sistema`

Verifica:
- ✅ Presencia de archivos críticos
- ✅ Configuración de variables de entorno
- ✅ Configuración de package.json
- ✅ Validez de modelos Sequelize
- ✅ Sistema de migración

**Cuándo usar:** 
- Primera instalación
- Después de clonar el repositorio
- Para verificar configuración local

#### `verificar-bd.js`
**Propósito:** Verificación completa con conexión a BD  
**Uso:** `npm run verificar`

Verifica:
- ✅ Conexión a MySQL
- ✅ Existencia de tablas
- ✅ Estructura de columnas
- ✅ Datos existentes
- ✅ Operaciones CRUD
- ✅ Integridad referencial

**Cuándo usar:**
- Después de configurar .env
- Para verificar conexión a Hostinger
- Para diagnosticar problemas de BD

### 2. Documentación

#### `VERIFICACION_BD.md`
**Guía completa de verificación** con instrucciones paso a paso para:
- Verificar desde el servidor (Render)
- Verificar desde entorno local
- Verificar desde phpMyAdmin (Hostinger)
- Solucionar problemas comunes

#### `ESTADO_SISTEMA.md`
**Informe de estado** detallado que muestra:
- Resultados de verificación
- Comparación sistema anterior vs actual
- Checklist completo
- Conclusiones

#### `MIGRATION_README.md`
**Guía de migración** del sistema JSON a MySQL con:
- Configuración en Hostinger
- Configuración del proyecto
- Despliegue en producción
- Rollback si es necesario

## 🚀 Inicio Rápido

### Opción 1: Verificación Rápida (Sin BD)

```bash
cd backend
npm install
npm run verificar:sistema
```

Esto verifica tu configuración local sin necesidad de conectar a la base de datos.

### Opción 2: Verificación Completa (Con BD)

```bash
cd backend

# 1. Crear archivo .env
cp env.example .env

# 2. Editar .env con tus credenciales
nano .env

# 3. Instalar dependencias
npm install

# 4. Ejecutar verificación
npm run verificar
```

Esto verifica la conexión real a MySQL y el estado de las tablas.

### Opción 3: Verificación en Producción

Desde tu navegador o terminal:

```bash
# Health check
curl https://tu-backend.onrender.com/health

# Test de conexión a BD
curl https://tu-backend.onrender.com/api/test-connection

# Verificar tablas
curl https://tu-backend.onrender.com/api/test-tables
```

## 📊 Interpretación de Resultados

### ✅ Todo OK
Si ves mensajes como:
```
✅ Conexión a la base de datos establecida correctamente
✅ Tabla encontrada: destinos
✅ CREATE: OK
🎉 ¡Sistema correctamente configurado!
```

**Acción:** Ninguna. El sistema está operativo.

### ⚠️ Advertencias
Si ves mensajes como:
```
⚠️ Tabla no encontrada: destinos
⚠️ DB_PASSWORD está presente pero sin valor válido
```

**Acción:** 
1. Revisa las variables de entorno
2. Ejecuta `npm run migrate` para crear tablas
3. Vuelve a verificar

### ❌ Errores
Si ves mensajes como:
```
❌ Error al conectar con la base de datos
❌ getaddrinfo ENOTFOUND srv1551.hstgr.io
```

**Acción:**
1. Verifica credenciales en .env
2. Confirma acceso remoto en Hostinger
3. Revisa la guía de solución de problemas

## 🔧 Comandos Disponibles

```bash
# Verificación del sistema (sin BD)
npm run verificar:sistema

# Verificación completa (con BD)
npm run verificar

# Migrar datos desde JSON a MySQL
npm run migrate

# Probar solo la conexión
node test-connection.js

# Ejecutar pruebas de BD
npm run test:db

# Iniciar servidor
npm start
```

## 📋 Checklist Post-Verificación

Después de ejecutar las verificaciones, confirma:

- [ ] Script de verificación ejecutado sin errores
- [ ] Conexión a MySQL exitosa
- [ ] Las 5 tablas están creadas
- [ ] Los modelos cargan correctamente
- [ ] Las operaciones CRUD funcionan
- [ ] El servidor inicia sin errores
- [ ] Los endpoints responden correctamente

## 🆘 Solución de Problemas

### Problema: No se puede conectar a la base de datos

**Causas posibles:**
- Variables de entorno incorrectas
- Acceso remoto no habilitado en Hostinger
- Credenciales incorrectas

**Solución:**
1. Verifica `.env`:
   ```env
   DB_HOST=srv1551.hstgr.io
   DB_PORT=3306
   DB_NAME=u419311572_araucaria
   DB_USER=u419311572_admin
   DB_PASSWORD=tu_password_real
   ```

2. En Hostinger:
   - Ve a "MySQL remoto"
   - Habilita "Cualquier host"

3. Prueba conexión:
   ```bash
   node test-connection.js
   ```

### Problema: Tablas no existen

**Solución:**
```bash
npm run migrate
```

Esto creará todas las tablas automáticamente.

### Problema: Server.js vs Server-db.js

**Verificar que estés usando el servidor correcto:**

En `package.json`:
```json
{
  "scripts": {
    "start": "node server-db.js"  // ← Debe ser server-db.js
  }
}
```

En Render.com:
- Comando de inicio: `npm start`

## 📚 Documentación Relacionada

- **[VERIFICACION_BD.md](./VERIFICACION_BD.md)** - Guía completa de verificación
- **[ESTADO_SISTEMA.md](./ESTADO_SISTEMA.md)** - Informe de estado del sistema
- **[MIGRATION_README.md](./MIGRATION_README.md)** - Guía de migración a MySQL

## 🎯 Resultado Esperado

Después de seguir esta guía, deberías tener:

✅ Confirmación de que el sistema está operativo  
✅ Certeza de que los datos persisten  
✅ Conocimiento de cómo verificar el estado  
✅ Herramientas para diagnosticar problemas  

## 💡 Consejos

1. **Primera vez:** Ejecuta `npm run verificar:sistema` antes que nada
2. **Después de configurar .env:** Ejecuta `npm run verificar`
3. **En producción:** Monitorea los endpoints de salud
4. **Periódicamente:** Revisa los logs en Render

## 📞 Soporte

Si encuentras problemas:

1. Consulta **[VERIFICACION_BD.md](./VERIFICACION_BD.md)** - Sección "Problemas Comunes"
2. Revisa los logs del servidor en Render
3. Verifica la configuración en Hostinger
4. Ejecuta los scripts de verificación para obtener más detalles

---

**¿Listo para verificar?**

```bash
npm run verificar:sistema
```

¡Comienza ahora! 🚀
