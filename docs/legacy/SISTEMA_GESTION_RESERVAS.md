# Sistema de Gestión de Reservas - Guía de Uso

## 📍 Acceso al Sistema

El nuevo sistema centralizado de gestión de reservas se encuentra integrado en el panel administrativo:

**URL:** `/admin?panel=reservas`

O simplemente hacer clic en el botón **"Reservas"** en el panel administrativo.

## 🎯 Características Principales

### 1. Dashboard de Estadísticas

Al ingresar al panel, verás 5 tarjetas con estadísticas en tiempo real:

- **Total Reservas:** Número total de reservas en el sistema
- **Pendientes:** Reservas que están esperando confirmación
- **Confirmadas:** Reservas confirmadas y listas
- **Pagadas:** Reservas con pago completado
- **Ingresos Totales:** Suma total de ingresos de reservas pagadas (en CLP)

### 2. Filtros de Búsqueda

#### Búsqueda Rápida
Escribe en el campo de búsqueda para encontrar reservas por:
- Nombre del cliente
- Email
- Teléfono
- ID de reserva

#### Filtros Avanzados
- **Estado:** Pendiente, Pendiente Detalles, Confirmada, Cancelada, Completada
- **Estado de Pago:** Pendiente, Pagado, Fallido, Reembolsado
- **Fecha Desde / Fecha Hasta:** Rango de fechas para filtrar reservas

#### Limpiar Filtros
Usa el botón "Limpiar Filtros" para resetear todos los filtros y búsquedas.

### 3. Tabla de Reservas

La tabla muestra toda la información importante de cada reserva:

| Columna | Descripción |
|---------|-------------|
| **ID** | Número único de la reserva |
| **Cliente** | Nombre del cliente |
| **Contacto** | Email y teléfono |
| **Ruta** | Origen y destino del viaje |
| **Fecha/Hora** | Fecha y hora del servicio |
| **Pasajeros** | Número de pasajeros |
| **Total** | Monto total con descuentos |
| **Estado** | Estado actual de la reserva con badge de color |
| **Pago** | Estado del pago con badge de color |
| **Saldo** | Saldo pendiente (rojo) o pagado (verde) |
| **Acciones** | Botones para ver detalles o editar |

#### Badges de Estado

**Estados de Reserva:**
- 🕐 **Pendiente** (gris) - Esperando confirmación
- ⚠️ **Pendiente Detalles** (outline) - Faltan datos por completar
- ✓ **Confirmada** (azul) - Reserva confirmada
- ✗ **Cancelada** (rojo) - Reserva cancelada
- ✓ **Completada** (verde) - Servicio completado

**Estados de Pago:**
- 🕐 **Pendiente** (gris) - Pago pendiente
- ✓ **Pagado** (verde) - Pago completado
- ✗ **Fallido** (rojo) - Pago falló
- ↩️ **Reembolsado** (outline) - Pago reembolsado

### 4. Ver Detalles de Reserva

Haz clic en el botón del ojo 👁️ para ver todos los detalles de una reserva:

#### Información del Cliente
- Nombre completo
- Email
- Teléfono

#### Detalles del Viaje
El modal ahora presenta una visualización mejorada para distinguir claramente entre viajes de solo ida y viajes de ida y vuelta:

**Badge indicador de tipo de viaje:**
- 🔄 **Ida y Vuelta** (azul) - Cuando la reserva incluye viaje de regreso
- ➡️ **Solo Ida** (verde) - Cuando la reserva es solo de ida

**Tarjetas visuales separadas:**

Todos los viajes muestran una **Tarjeta de VIAJE DE IDA** (fondo azul) con:
- Origen y destino
- Fecha del viaje
- Hora de recogida
- Número de pasajeros
- Vehículo asignado
- Direcciones específicas (si están disponibles)

Cuando es un viaje de ida y vuelta, se muestra además una **Tarjeta de VIAJE DE VUELTA** (fondo verde) con:
- Origen y destino (invertidos)
- Fecha de regreso
- Hora de regreso
- Número de pasajeros
- Vehículo asignado

**Alerta de información incompleta:**
Si la reserva está marcada como "Ida y Vuelta" pero falta información del viaje de regreso (fecha u hora), se muestra una alerta amarilla indicando qué datos faltan.

#### Información Adicional
- Número de vuelo
- Hotel
- Equipaje especial
- Silla infantil (Sí/No)

#### Información Financiera
- Precio base
- Descuentos aplicados:
  - Descuento base
  - Descuento por promoción
  - Descuento round trip
  - Descuento online
- Total con descuento
- Abono sugerido
- **Saldo pendiente** (destacado en rojo si existe)
- Código de descuento utilizado

#### Estado y Pago
- Estado actual de la reserva
- Estado del pago
- Método de pago utilizado
- Referencia del pago

#### Notas y Comentarios
- Mensaje del cliente
- Observaciones internas

#### Información Técnica
- Origen de la reserva (web, manual, etc.)
- Dirección IP
- Fecha de creación
- Última actualización

### 5. Editar Reserva

Haz clic en el botón de edición ✏️ para modificar una reserva:

#### Campos Editables

1. **Estado de la Reserva**
   - Pendiente
   - Pendiente Detalles
   - Confirmada
   - Cancelada
   - Completada

2. **Estado de Pago**
   - Pendiente
   - Pagado
   - Fallido
   - Reembolsado

3. **Método de Pago**
   - MercadoPago
   - Flow
   - Transferencia
   - Efectivo
   - Otro

4. **Referencia de Pago**
   - Campo libre para ID de transacción, número de transferencia, etc.

5. **Observaciones Internas**
   - Notas privadas sobre la reserva (no visibles para el cliente)

#### Resumen Financiero
Durante la edición, siempre verás un resumen con:
- Total a pagar
- Abono sugerido
- Saldo pendiente (en rojo si hay deuda)

### 6. Paginación

El sistema muestra **20 reservas por página**. Usa los botones de navegación:
- **Anterior:** Ir a la página anterior
- **Siguiente:** Ir a la página siguiente

La información de paginación muestra: "Página X de Y"

## 🔄 Flujo de Trabajo Recomendado

### Para Nuevas Reservas

1. Ingresa al panel de Reservas
2. Revisa las estadísticas para tener una visión general
3. Usa el filtro "Estado: Pendiente" para ver solo reservas nuevas
4. Haz clic en el ojo 👁️ para ver los detalles completos
5. Si todo está correcto, haz clic en editar ✏️
6. Cambia el estado a "Confirmada"
7. Guarda los cambios

### Para Gestionar Pagos

1. Usa el filtro "Estado de Pago: Pendiente"
2. Revisa la columna "Saldo" para ver quién debe dinero
3. Al recibir un pago:
   - Edita la reserva
   - Cambia "Estado de Pago" a "Pagado"
   - Selecciona el "Método de Pago"
   - Ingresa la "Referencia de Pago"
   - Guarda los cambios

### Para Completar el Servicio

1. Usa el filtro "Estado: Confirmada"
2. Después de completar el servicio:
   - Edita la reserva
   - Cambia el estado a "Completada"
   - Agrega observaciones si es necesario
   - Guarda los cambios

### Para Cancelar una Reserva

1. Busca la reserva por nombre, email o teléfono
2. Edita la reserva
3. Cambia el estado a "Cancelada"
4. Agrega observaciones explicando el motivo
5. Si hubo pago, cambia "Estado de Pago" a "Reembolsado"
6. Guarda los cambios

## 💡 Consejos y Mejores Prácticas

### Búsqueda Eficiente
- Usa el filtro de fechas para ver reservas de un período específico
- Combina múltiples filtros para encontrar exactamente lo que buscas
- La búsqueda funciona en tiempo real, no necesitas presionar Enter

### Gestión de Saldos
- Las reservas con saldo pendiente aparecen en **rojo**
- Las reservas pagadas completamente aparecen en **verde**
- Siempre verifica el saldo antes de cambiar el estado a "Completada"

### Observaciones Internas
- Usa las observaciones para:
  - Registrar llamadas telefónicas
  - Anotar cambios solicitados
  - Documentar problemas o incidencias
  - Dejar notas para otros administradores

### Referencias de Pago
- Siempre registra la referencia del pago para trazabilidad
- Ejemplos de referencias:
  - MercadoPago: `MP-123456789`
  - Transferencia: `N° Operación: 987654321`
  - Flow: `Flow-ORD-12345`

### Monitoreo Regular
- Revisa las estadísticas diariamente
- Atiende primero las reservas "Pendientes"
- Verifica los saldos pendientes semanalmente
- Mantén las observaciones actualizadas

## 🔧 Solución de Problemas

### No se cargan las reservas

1. Verifica tu conexión a internet
2. Recarga la página (F5)
3. Verifica que el backend esté funcionando
4. Revisa la consola del navegador para errores

### Los filtros no funcionan

1. Haz clic en "Limpiar Filtros"
2. Aplica los filtros nuevamente uno por uno
3. Recarga la página si persiste el problema

### No puedo editar una reserva

1. Verifica que tengas permisos de administrador
2. Asegúrate de que la reserva exista (no esté eliminada)
3. Intenta cerrar el modal y abrirlo nuevamente

### Error al guardar cambios

1. Verifica tu conexión a internet
2. Asegúrate de que todos los campos requeridos estén completos
3. Intenta nuevamente en unos segundos
4. Si persiste, contacta soporte técnico

## 📱 Acceso Móvil

El sistema es completamente responsive y funciona en:
- 💻 Desktop
- 📱 Móviles
- 📟 Tablets

La tabla se adapta automáticamente al tamaño de la pantalla.

## 🆘 Soporte

Si tienes problemas o preguntas sobre el sistema:

1. Revisa esta guía primero
2. Verifica la sección de Solución de Problemas
3. Contacta al equipo técnico

---

**Última actualización:** Octubre 2025
**Versión del sistema:** 1.0.0
