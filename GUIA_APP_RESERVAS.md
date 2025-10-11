# Guía de la APP de Gestión de Reservas

## 📋 Descripción General

Se ha implementado una aplicación completa de gestión de reservas integrada en el panel administrativo. Esta aplicación permite gestionar todas las reservas desde una interfaz web moderna y funcional.

## ✨ Funcionalidades Implementadas

### 1. Crear Reservas Manualmente
- Formulario modal con todos los campos necesarios
- Validación de campos requeridos
- Campos incluidos:
  - Nombre del cliente *
  - Email *
  - Teléfono *
  - Origen *
  - Destino *
  - Fecha de viaje *
  - Hora de viaje
  - Número de pasajeros *
  - Precio base *
  - Total con descuento *
  - Tipo de vehículo
  - Estado (Pendiente, Pendiente Detalles, Confirmada, Cancelada, Completada)
  - Observaciones

### 2. Gestión de Estados
- **Estado de Reserva**: Dropdown inline en la tabla para cambiar entre:
  - Pendiente
  - Pendiente Detalles
  - Confirmada
  - Cancelada
  - Completada
  
- **Estado de Pago**: Dropdown inline en la tabla para cambiar entre:
  - Pendiente
  - Pagado
  - Fallido
  - Reembolsado

Los cambios se guardan automáticamente al seleccionar una opción.

### 3. Búsqueda y Filtros
- **Búsqueda en tiempo real**: Por nombre, email o teléfono
- **Filtros disponibles**:
  - Fecha desde
  - Fecha hasta
  - Estado de reserva
  - Estado de pago
- Botones para aplicar y limpiar filtros

### 4. Exportación a CSV/Excel
- Exporta todas las reservas visibles (respetando filtros)
- Incluye todos los campos:
  - ID, Nombre, Email, Teléfono
  - Origen, Destino
  - Fecha, Hora, Pasajeros
  - Precio, Total con Descuento
  - Estado, Estado Pago, Método Pago
  - Observaciones, Fecha Creación
- Archivo generado con formato UTF-8 con BOM para correcta visualización en Excel
- Nombre del archivo: `reservas_YYYY-MM-DD.csv`

### 5. Estadísticas en Tiempo Real
Muestra tarjetas con métricas importantes:
- Total de reservas
- Reservas pendientes
- Reservas confirmadas
- Ingresos totales (suma de reservas pagadas)

### 6. Vista de Tabla Completa
- Listado paginado de reservas (20 por página)
- Información organizada en columnas:
  - ID
  - Nombre
  - Contacto (Email + Teléfono)
  - Ruta (Origen → Destino)
  - Fecha/Hora
  - Pasajeros
  - Monto (con precio original tachado si hay descuento)
  - Estado (con badge de color)
  - Estado Pago (con badge de color)
  - Acciones
- Navegación entre páginas
- Contador de resultados

## 🎨 Características de la Interfaz

### Colores de Estado
- **Pendiente**: Amarillo
- **Pendiente Detalles**: Naranja
- **Confirmada**: Verde
- **Cancelada**: Rojo
- **Completada**: Azul

### Colores de Estado de Pago
- **Pendiente**: Amarillo
- **Pagado**: Verde
- **Fallido**: Rojo
- **Reembolsado**: Púrpura

### Diseño Responsive
- Totalmente adaptable a dispositivos móviles y tablets
- Tabla con scroll horizontal en pantallas pequeñas
- Filtros que se adaptan en grid responsive

## 🔧 Acceso a la Aplicación

### URL de Acceso
Hay múltiples formas de acceder al panel administrativo:

1. **Por parámetro URL**:
   - `https://tu-dominio.com/?admin=true`
   - `https://tu-dominio.com/?panel=admin`
   - `https://tu-dominio.com/?view=admin`

2. **Por hash**:
   - `https://tu-dominio.com/#admin`

3. **Por ruta**:
   - `https://tu-dominio.com/admin`
   - `https://tu-dominio.com/admin/precios`

### Navegación en el Panel
Una vez dentro del panel administrativo:
1. Verás varias pestañas en la parte superior
2. Haz clic en la pestaña **"Reservas"**
3. Se cargará la aplicación de gestión de reservas

## 🚀 Uso de la Aplicación

### Crear una Nueva Reserva
1. Clic en el botón **"Nueva Reserva"** (esquina superior derecha)
2. Completar el formulario con los datos del cliente
3. Los campos marcados con * son obligatorios
4. Clic en **"Crear Reserva"**
5. La reserva aparecerá en la tabla automáticamente

### Cambiar Estado de una Reserva
1. Localiza la reserva en la tabla
2. En la columna "Estado", haz clic en el badge actual
3. Selecciona el nuevo estado del dropdown
4. El cambio se guarda automáticamente

### Cambiar Estado de Pago
1. Localiza la reserva en la tabla
2. En la columna "Pago", haz clic en el badge actual
3. Selecciona el nuevo estado de pago
4. El cambio se guarda automáticamente

### Buscar Reservas
1. Usa el campo de búsqueda en la sección de filtros
2. Escribe nombre, email o teléfono
3. Haz clic en "Aplicar Filtros"

### Filtrar por Fecha
1. Selecciona "Fecha Desde" y/o "Fecha Hasta"
2. Haz clic en "Aplicar Filtros"
3. Para limpiar filtros, usa el botón "Limpiar"

### Exportar a Excel
1. Aplica los filtros deseados (opcional)
2. Haz clic en **"Exportar CSV"** (esquina superior derecha)
3. El archivo se descargará automáticamente
4. Abre el archivo con Excel, LibreOffice u otra aplicación de hojas de cálculo

### Actualizar Datos
- Haz clic en el botón **"Actualizar"** para recargar las reservas y estadísticas

## 📡 Endpoints de API Utilizados

La aplicación se conecta al backend mediante los siguientes endpoints:

### GET `/api/reservas`
Obtiene la lista de reservas con paginación y filtros
- Parámetros: `page`, `limit`, `estado`, `fecha_desde`, `fecha_hasta`
- Respuesta: Lista de reservas + información de paginación

### POST `/api/reservas`
Crea una nueva reserva manualmente
- Body: Datos de la reserva
- Respuesta: Reserva creada

### PUT `/api/reservas/:id/estado`
Actualiza el estado de una reserva
- Body: `{ estado, observaciones }`
- Respuesta: Reserva actualizada

### PUT `/api/reservas/:id/pago`
Actualiza el estado de pago de una reserva
- Body: `{ estadoPago, metodoPago, referenciaPago }`
- Respuesta: Reserva actualizada

### GET `/api/reservas/estadisticas`
Obtiene estadísticas generales de reservas
- Respuesta: Total reservas, pendientes, confirmadas, pagadas, ingresos totales

## 🔒 Consideraciones de Seguridad

- El panel administrativo debe estar protegido con autenticación (implementar según necesidades)
- Validar que solo usuarios autorizados puedan acceder a estas funcionalidades
- Los cambios de estado se registran automáticamente con timestamp
- Se mantiene un historial completo de todas las reservas

## 📱 Compatibilidad

- ✅ Chrome, Firefox, Safari, Edge (últimas versiones)
- ✅ Dispositivos móviles iOS y Android
- ✅ Tablets
- ✅ Desktop

## 🎯 Mejoras Futuras Sugeridas

1. **Autenticación**: Implementar login para acceso seguro al panel
2. **Edición de reservas**: Modal para editar reservas existentes
3. **Vista de detalles**: Modal con información completa de una reserva
4. **Filtros avanzados**: Por origen, destino, tipo de vehículo, etc.
5. **Gráficos**: Visualización de estadísticas con gráficos (usando recharts)
6. **Notificaciones**: Alertas cuando cambia el estado de una reserva
7. **Historial de cambios**: Log de todos los cambios realizados
8. **Impresión**: Generar PDF con detalles de reserva
9. **Importación masiva**: Subir archivo CSV con múltiples reservas
10. **Dashboard mejorado**: Vista general con métricas del mes/año

## 🐛 Solución de Problemas

### No se cargan las reservas
- Verificar que el backend esté corriendo
- Revisar la consola del navegador para errores
- Verificar la variable de entorno `VITE_API_URL`

### Error al crear reserva
- Verificar que todos los campos obligatorios estén completos
- Revisar que los formatos de fecha y números sean correctos
- Verificar conexión con la base de datos

### No se actualiza el estado
- Verificar conexión con el servidor
- Revisar los logs del backend
- Comprobar que el ID de la reserva sea válido

### El CSV no se abre correctamente en Excel
- El archivo ya incluye BOM para UTF-8
- Si hay problemas, abrir con "Importar datos" en Excel
- Seleccionar UTF-8 como codificación

## 📞 Soporte

Para problemas técnicos o dudas sobre el funcionamiento:
1. Revisar la consola del navegador (F12)
2. Revisar los logs del servidor backend
3. Verificar la documentación del API
4. Contactar al equipo de desarrollo

---

**Última actualización**: Octubre 2025
**Versión**: 1.0.0
