# 📖 Guía de Usuario - Transportes Araucaria

> **Última Actualización**: 7 Enero 2026
> **Versión**: 1.0

Esta guía centraliza todas las instrucciones de uso para administradores y usuarios del sistema Transportes Araucaria.

---

## 📑 Índice

1. [Panel Administrativo](#1-panel-administrativo)
2. [Gestión de Reservas](#2-gestión-de-reservas)
3. [Configuración del Sistema](#3-configuración-del-sistema)
4. [Configuración de WhatsApp](#4-configuración-de-whatsapp)
5. [Códigos de Pago](#5-códigos-de-pago)
6. [Estadísticas y Reportes](#6-estadísticas-y-reportes)

---

## 1. Panel Administrativo

### Acceso
- **URL**: `https://www.transportesaraucaria.cl/#admin`
- **Credenciales**: Proporcionadas por el SuperAdmin

### Navegación Principal

El panel está organizado en las siguientes secciones:

- **📊 Dashboard**: Vista general con KPIs
- **📅 Reservas**: Gestión completa de reservas
- **🚗 Vehículos**: Administración de flota
- **👤 Conductores**: Gestión de personal
- **💰 Finanzas**: Gastos y estadísticas
- **🎟️ Códigos de Pago**: Generación de links de pago
- **💸 Descuentos**: Gestión de promociones
- **⚙️ Configuración**: Ajustes del sistema

---

## 2. Gestión de Reservas

### Crear Nueva Reserva

1. Click en **"Nueva Reserva"** en el panel de Reservas
2. Completar formulario:
   - Datos del cliente (nombre, email, teléfono)
   - Origen y destino
   - Fecha y hora
   - Número de pasajeros
   - Detalles adicionales (vuelo, equipaje, etc.)
3. El sistema calcula automáticamente la tarifa
4. Click en **"Crear Reserva"**

### Estados de Reserva

- **Pendiente**: Reserva creada, esperando confirmación de pago
- **Confirmada**: Pago recibido (abono o total)
- **Completada**: Servicio ejecutado y cerrado

### Asignar Conductor y Vehículo

1. Localizar la reserva en la tabla
2. Click en el botón de edición
3. Seleccionar conductor del dropdown
4. Seleccionar vehículo del dropdown
   - El sistema filtra automáticamente vehículos con capacidad suficiente
5. Guardar cambios

### Vista de Planificación

Acceder a la vista de calendario para ver:
- Ocupación de vehículos por día
- Reservas confirmadas (con pago)
- Detalles de conductor y vehículo asignados

**Imprimir**: Click en "Imprimir Planificación" para generar reporte.

### Notificaciones de Ida y Vuelta

**Actualización: Febrero 2026**

Cuando gestionas una reserva que tiene tramos vinculados (Ida y Vuelta), el sistema actúa de la siguiente manera:

1.  **Asignación del Tramo IDA**: Al asignar conductor/vehículo a la ida, se envía el correo normal al pasajero y conductor.
2.  **Asignación del Tramo VUELTA**: 
    *   Al asignar el regreso, el sistema detecta que es una vuelta.
    *   **Pasajero**: Recibe un correo unificado que muestra primero el "Viaje de Ida" (para contexto) y luego el "Viaje de Vuelta".
    *   **Conductor**: Si es el mismo de la ida, recibe un único correo descriptivo con ambos tramos y un evento de calendario dual.
3.  **Flexibilidad**: Puedes asignar la ida hoy y la vuelta mañana; el sistema enviará las notificaciones correspondientes en cada momento sin perder el contexto.

---

## 3. Configuración del Sistema

### Acceso a Configuración

Panel Administrativo → **Configuración** → **Configuración General**

### Opciones Disponibles

#### Tarifas Base
- Configurar precios por ruta
- Ajustar porcentaje adicional por pasajero extra
- Configuración separada para Autos (1-4 pax) y Vans (5-7 pax)

#### Descuentos Globales
- Descuento online
- Descuento ida y vuelta
- Descuentos personalizados por tramo

#### Festivos y Bloqueos
- Marcar días festivos con recargo
- Bloquear fechas no disponibles

---

## 4. Configuración de WhatsApp

### ¿Qué es el Modal de Intercepción de WhatsApp?

Cuando está **activo**, los usuarios que hacen clic en el botón de WhatsApp ven primero un modal promocional con:
- Descuentos por reservar online
- Beneficios de la reserva web
- Opción de reservar ahora o continuar a WhatsApp

Cuando está **inactivo**, el botón de WhatsApp abre directamente la aplicación.

### Cómo Activar/Desactivar

1. **Acceder al Panel de Configuración**
   - Iniciar sesión como administrador
   - Ir a: Panel Administrativo → **Configuración** → **Configuración General**

2. **Cambiar Estado**
   - Localizar la sección "Modal de Intercepción de WhatsApp"
   - Usar el switch para activar (🟢) o desactivar (⚪)
   - El cambio se guarda automáticamente
   - Verás una alerta de confirmación

3. **Verificar el Cambio**
   - Abrir la página principal en una ventana privada
   - Hacer clic en el botón de WhatsApp
   - Verificar el comportamiento:
     - **Activo**: Aparece modal con descuentos
     - **Inactivo**: Abre WhatsApp directamente

### Estado Visible

- **🟢 Activo** (predeterminado): Modal aparece antes de abrir WhatsApp
- **⚪ Inactivo**: WhatsApp se abre directamente

### Casos de Uso

**Activar el modal cuando:**
- Quieres incentivar reservas online
- Hay promociones activas
- Quieres reducir consultas por WhatsApp

**Desactivar el modal cuando:**
- Prefieres atención directa por WhatsApp
- Hay alta demanda y necesitas respuesta rápida
- Estás probando diferentes estrategias de conversión

### Notas Importantes

> ⚠️ **Caché del Navegador**: Los usuarios que ya visitaron el sitio pueden ver el estado anterior hasta que limpien su caché o visiten en modo incógnito.

> ✅ **Tracking**: El tracking de Google Ads funciona correctamente en ambos casos (modal activo o inactivo).

> 📊 **Monitoreo**: Todos los cambios de configuración se registran en el audit log del sistema.

### Solución de Problemas

**El modal no respeta la configuración:**
1. Limpiar caché del navegador (Ctrl+Shift+Delete)
2. Abrir en ventana privada/incógnita
3. Verificar que el backend esté funcionando

**No puedo cambiar la configuración:**
1. Verificar que estés autenticado como administrador
2. Cerrar sesión y volver a iniciar
3. Revisar consola del navegador (F12) por errores

---

## 5. Códigos de Pago

### Crear Código de Pago

1. Ir a **Códigos de Pago** en el menú
2. Click en **"Generar Nuevo Código"**
3. Completar información:
   - Origen y destino
   - Fecha y hora
   - Número de pasajeros
   - Precio (calculado automáticamente)
   - Fecha de vencimiento
4. Click en **"Generar Código"**
   
### Generar Código para Pago de Saldo (Vinculado)

Permite cobrar saldos pendientes o diferencias de tarifa (ej: cambio de vehículo, paradas extra) asociándolos a una reserva existente.

1. Ir a **Códigos de Pago** > **Nuevo Código**
2. Activar switch **"Vincular a Reserva Existente"**
3. Ingresar Código de Reserva (ej: `AR-20260101-1234`)
   - El sistema cargará los datos del cliente automáticamente
4. Ingresar **Monto a Cobrar** y **Descripción** (ej: "Pago saldo pendiente")
5. Generar y compartir igual que un código normal
   - **Nota**: Al pagar, el cliente verá un resumen simplificado y el pago se abonará directamente a la reserva original.

### Compartir Código

El sistema genera automáticamente:
- **Código único** (ej: `PAGO-2026-001`)
- **Link de pago** directo
- **Mensaje para WhatsApp** (listo para copiar y enviar)

**Copiar mensaje**:
1. Click en el botón "Copiar"
2. El mensaje se copia al portapapeles
3. Pegar en WhatsApp y enviar al cliente

### Estados de Códigos

- **Activo**: Código válido, esperando pago
- **Usado**: Cliente ya pagó con este código
- **Vencido**: Pasó la fecha de vencimiento

---

## 6. Estadísticas y Reportes

### Acceso a Estadísticas

Panel Administrativo → **Finanzas** → **Estadísticas**

### Métricas Disponibles

**Por Conductor:**
- Total de reservas completadas
- Ingresos generados
- Gastos asociados
- Pagos al conductor
- Utilidad neta

**Por Vehículo:**
- Reservas completadas
- Ingresos generados
- Gastos de combustible
- Gastos de mantenimiento
- Utilidad neta

**Por Tipo de Gasto:**
- Total por período
- Desglose por categoría
- Registros detallados

### Filtros Temporales

- Últimos 15 días
- Últimos 30 días (predeterminado)
- Mes actual
- Mes pasado
- Todo el historial
- Rango personalizado

### Exportar Reportes

1. Seleccionar filtro temporal
2. Seleccionar vista (Conductores/Vehículos/Gastos)
3. Click en **"Exportar"** (si disponible)

> 📊 **Nota**: Las estadísticas solo consideran **reservas completadas** para reflejar la realidad financiera.

---

## 💡 Consejos y Mejores Prácticas

### Para Gestión de Reservas

- ✅ Asignar conductor y vehículo lo antes posible
- ✅ Verificar capacidad del vehículo antes de asignar
- ✅ Confirmar detalles con el cliente antes de completar
- ✅ Marcar como completada solo después de ejecutar el servicio

### Para Códigos de Pago

- ✅ Establecer fecha de vencimiento razonable (24-48 horas)
- ✅ Verificar que el precio sea correcto antes de generar
- ✅ Copiar el mensaje completo para WhatsApp
- ✅ Hacer seguimiento de códigos vencidos

### Para Configuración

- ✅ Probar cambios en ventana privada antes de confirmar
- ✅ Documentar por qué se hizo un cambio importante
- ✅ Revisar estadísticas después de cambios de precios
- ✅ Mantener respaldo de configuraciones anteriores

---

## 🆘 Soporte

Para problemas técnicos o dudas:

1. **Consultar documentación técnica**: `DOCUMENTACION_MAESTRA.md`
2. **Problemas conocidos**: `GUIA_SOLUCION_PROBLEMAS.md`
3. **Contactar soporte técnico**: [información de contacto]

---

**Transportes Araucaria - Guía de Usuario Oficial**
