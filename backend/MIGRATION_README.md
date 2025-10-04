# Migración a Base de Datos MySQL en Hostinger

Este documento explica cómo migrar el sistema de Transportes Araucaria de archivos JSON a una base de datos MySQL persistente en Hostinger.

## 🎯 Problema Actual

El sistema actual usa archivos JSON (`pricing.json`) que se resetean cada vez que Render redepiega la aplicación, causando pérdida de:

- Códigos de descuento
- Configuraciones de precios
- Promociones
- Descuentos globales

## ✅ Solución: Base de Datos MySQL

### 1. Configuración en Hostinger

1. **Crear Base de Datos:**

   - Ve a tu panel de Hostinger
   - Navega a "Bases de datos" → "Administración"
   - Crea una nueva base de datos MySQL
   - Nombre sugerido: `u419311572_transportes_araucaria`

2. **Crear Usuario:**

   - Crea un usuario para la base de datos
   - Nombre sugerido: `u419311572_admin`
   - Asigna una contraseña segura
   - Otorga todos los privilegios a la base de datos

3. **Configurar Acceso Remoto:**
   - Ve a "MySQL remoto"
   - Agrega tu IP actual para desarrollo
   - O marca "Cualquier host" para permitir conexiones desde cualquier IP

### 2. Configuración del Proyecto

1. **Instalar Dependencias:**

   ```bash
   cd backend
   npm install mysql2 sequelize
   ```

2. **Configurar Variables de Entorno:**

   - Copia `env.example` a `.env`
   - Completa las variables con tus datos de Hostinger:

   ```env
   DB_HOST=srv1551.hstgr.io
   DB_PORT=3306
   DB_NAME=u419311572_transportes_araucaria
   DB_USER=u419311572_admin
   DB_PASSWORD=tu_password_aqui
   ```

3. **Migrar Datos Existentes:**

   ```bash
   npm run migrate
   ```

4. **Iniciar Servidor con Base de Datos:**
   ```bash
   npm start
   ```

### 3. Estructura de la Base de Datos

El sistema creará automáticamente las siguientes tablas:

- **`destinos`**: Información de destinos y precios
- **`promociones`**: Promociones por día de la semana
- **`descuentos_globales`**: Descuentos globales del sistema
- **`codigos_descuento`**: Códigos de descuento personalizados

### 4. Ventajas de la Migración

✅ **Persistencia de Datos**: Los datos no se pierden al redeplegar
✅ **Escalabilidad**: Mejor rendimiento con grandes volúmenes de datos
✅ **Integridad**: Transacciones ACID y validaciones de datos
✅ **Backup**: Posibilidad de hacer respaldos automáticos
✅ **Consultas Avanzadas**: Reportes y análisis de datos

### 5. Despliegue en Producción

1. **Actualizar Variables de Entorno en Render:**

   - Agrega las variables de base de datos en el panel de Render
   - Asegúrate de que `DB_PASSWORD` esté configurada correctamente

2. **Cambiar Script de Inicio:**

   - En Render, cambia el comando de inicio a:

   ```bash
   npm start
   ```

   (El servidor-db.js se ejecutará automáticamente)

3. **Verificar Migración:**
   - La primera vez que se ejecute, creará las tablas automáticamente
   - Los datos se migrarán desde el JSON existente

### 6. Rollback (Si es necesario)

Si necesitas volver al sistema anterior:

1. Cambia el comando de inicio en Render a `node server.js`
2. Los datos JSON seguirán funcionando como antes

### 7. Monitoreo

- Revisa los logs del servidor para confirmar la conexión a la base de datos
- Verifica que los datos se estén guardando correctamente
- Monitorea el rendimiento de las consultas

## 🔧 Comandos Útiles

```bash
# Migrar datos existentes
npm run migrate

# Iniciar servidor con base de datos
npm start

# Verificar conexión a base de datos
node -e "import('./config/database.js').then(db => db.testConnection())"
```

## 📞 Soporte

Si encuentras problemas durante la migración:

1. Verifica las credenciales de la base de datos
2. Confirma que el acceso remoto esté habilitado
3. Revisa los logs del servidor para errores específicos
