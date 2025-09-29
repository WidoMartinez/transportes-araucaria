# Sistema de Gestión de Reservas con Excel

Este sistema te permite recopilar todas las reservas del módulo de reservas en un archivo Excel que puedes consultar o descargar manualmente desde el hosting de Hostinger.

## 📁 Archivos Incluidos

1. **`reservas_manager.php`** - Sistema principal de gestión de reservas
2. **`enviar_correo_mejorado.php`** - Versión mejorada del archivo original que guarda reservas
3. **`INSTRUCCIONES_RESERVAS_EXCEL.md`** - Este archivo de instrucciones

## 🚀 Instalación

### Paso 1: Subir archivos al hosting

1. Sube los archivos PHP a tu hosting de Hostinger en la misma carpeta donde está tu `enviar_correo.php` actual
2. Asegúrate de que la carpeta `PHPMailer` esté en el mismo directorio

### Paso 2: Configurar permisos

Los archivos necesitan permisos de escritura para crear y modificar archivos JSON:

```bash
chmod 755 reservas_manager.php
chmod 755 enviar_correo_mejorado.php
chmod 777 .  # Para crear archivos JSON en el directorio
```

### Paso 3: Actualizar tu aplicación web

En tu aplicación React (archivo `App.jsx` línea 586), cambia:

```javascript
// ANTES:
const emailApiUrl = "https://www.transportesaraucaria.cl/enviar_correo.php";

// DESPUÉS:
const emailApiUrl =
	"https://www.transportesaraucaria.cl/enviar_correo_mejorado.php";
```

## 📊 Uso del Sistema

### Acceder al Panel de Administración

1. Ve a: `https://www.transportesaraucaria.cl/reservas_manager.php`
2. Verás un panel con:
   - **Estadísticas en tiempo real**: Total de reservas, reservas hoy, del mes, ingresos estimados
   - **Descarga de Excel**: Con filtros por fecha
   - **Reservas recientes**: Tabla con las últimas 10 reservas

### Descargar Excel

1. **Todas las reservas**: Haz clic en "Descargar Todas las Reservas"
2. **Con filtros**:
   - Selecciona fecha inicio (opcional)
   - Selecciona fecha fin (opcional)
   - Haz clic en "📊 Descargar Excel"

### El archivo Excel incluye:

- ID único de reserva
- Fecha de registro
- Datos del cliente (nombre, email, teléfono)
- Detalles del viaje (origen, destino, fecha, hora, pasajeros)
- Información financiera (precio, abono, saldo)
- Datos adicionales (vuelo, hotel, equipaje especial, etc.)

## 🔧 Funcionalidades

### Automático

- ✅ Cada reserva se guarda automáticamente en `reservas_data.json`
- ✅ Se mantienen backups automáticos cada 10 reservas
- ✅ Se limita a 1000 reservas máximo para optimizar rendimiento
- ✅ Se incluye información técnica (IP, navegador, timestamp)

### Manual

- 📊 Panel de administración web
- 📈 Estadísticas en tiempo real
- 📥 Descarga de Excel con filtros
- 🔍 Visualización de reservas recientes
- 📋 API REST para consultas programáticas

## 🌐 API REST

El sistema también expone endpoints para uso programático:

### Obtener estadísticas

```
GET https://www.transportesaraucaria.cl/reservas_manager.php?action=stats
```

### Listar reservas

```
GET https://www.transportesaraucaria.cl/reservas_manager.php?action=list&limit=50
```

### Descargar Excel programáticamente

```
GET https://www.transportesaraucaria.cl/reservas_manager.php?action=download&fecha_inicio=2024-01-01&fecha_fin=2024-12-31
```

## 🛠️ Mantenimiento

### Archivos generados

- `reservas_data.json` - Archivo principal con todas las reservas
- `backups/` - Carpeta con backups automáticos
- Archivos Excel descargados tienen formato: `reservas_transportes_araucaria_YYYY-MM-DD_HH-mm-ss.csv`

### Limpieza

Si el archivo `reservas_data.json` crece mucho, el sistema automáticamente mantiene solo las últimas 1000 reservas.

## 🔒 Seguridad

- CORS configurado para tu dominio
- Sanitización de datos de entrada
- Validación de parámetros
- Logs de errores automáticos

## 📱 Responsive

El panel de administración es completamente responsive y funciona en:

- 💻 Desktop
- 📱 Móvil
- 📟 Tablet

## 🆘 Resolución de Problemas

### Si no se guardan las reservas:

1. Verifica permisos de escritura en el directorio
2. Revisa el log de errores de PHP en Hostinger
3. Asegúrate de que `enviar_correo_mejorado.php` esté siendo usado

### Si no se puede descargar Excel:

1. Verifica que el archivo `reservas_data.json` exista
2. Comprueba permisos de lectura
3. Revisa la consola del navegador por errores JavaScript

### Si el panel no carga:

1. Verifica que PHP esté habilitado en tu hosting
2. Comprueba versión de PHP (recomendado 7.4+)
3. Revisa logs de error del servidor

## 📞 Soporte

Si tienes problemas:

1. Revisa los logs de error de PHP en tu panel de Hostinger
2. Verifica que todos los archivos estén subidos correctamente
3. Comprueba que los permisos sean correctos

---

¡El sistema está listo para usar! Ahora todas tus reservas se guardarán automáticamente y podrás descargarlas en Excel cuando lo necesites. 🎉
