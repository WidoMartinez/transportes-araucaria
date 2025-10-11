# Sistema de Base de Datos MySQL en Hostinger

Este documento describe el sistema de base de datos MySQL implementado para Transportes Araucaria.

## ✅ Estado Actual

El sistema ahora utiliza **exclusivamente** una base de datos MySQL persistente en Hostinger. El sistema anterior basado en archivos JSON ha sido eliminado completamente.

## 🎯 Ventajas del Sistema Actual

- ✅ **Persistencia de Datos**: Los datos no se pierden al redeplegar
- ✅ **Escalabilidad**: Mejor rendimiento con grandes volúmenes de datos
- ✅ **Integridad**: Transacciones ACID y validaciones de datos
- ✅ **Backup**: Posibilidad de hacer respaldos automáticos
- ✅ **Consultas Avanzadas**: Reportes y análisis de datos

## 📊 Estructura de la Base de Datos

El sistema utiliza las siguientes tablas en MySQL:

- **`destinos`**: Información de destinos y precios
- **`promociones`**: Promociones por día de la semana
- **`descuentos_globales`**: Descuentos globales del sistema
- **`codigos_descuento`**: Códigos de descuento personalizados
- **`reservas`**: Reservas realizadas por los clientes

## 🔧 Configuración

### Variables de Entorno Requeridas

El servidor requiere las siguientes variables de entorno en Render:

```env
DB_HOST=srv1551.hstgr.io
DB_PORT=3306
DB_NAME=u419311572_transportes_araucaria
DB_USER=u419311572_admin
DB_PASSWORD=tu_password_aqui
MERCADOPAGO_ACCESS_TOKEN=tu_token_aqui
FLOW_API_KEY=tu_api_key_aqui
FLOW_SECRET_KEY=tu_secret_key_aqui
```

### Despliegue

El sistema se despliega automáticamente en Render cuando se hace push a la rama principal:

1. Render ejecuta `npm install` en el directorio backend
2. El servidor se inicia con `npm start` (ejecuta server-db.js)
3. La base de datos se inicializa automáticamente si es necesario

## 📈 Monitoreo

- Revisa los logs del servidor en Render para confirmar la conexión a la base de datos
- Verifica que los datos se estén guardando correctamente
- Monitorea el rendimiento de las consultas en el panel de Hostinger

## 🔧 Comandos Útiles

```bash
# Iniciar servidor
npm start

# Verificar conexión a base de datos
npm run test:db

# Ver logs en desarrollo
npm start
```

## 📞 Soporte

Si encuentras problemas:

1. Verifica las credenciales de la base de datos en las variables de entorno
2. Confirma que el acceso remoto esté habilitado en Hostinger
3. Revisa los logs del servidor en Render para errores específicos
4. Verifica la conectividad entre Render y Hostinger
