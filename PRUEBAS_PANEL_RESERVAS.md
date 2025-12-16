# Checklist de Pruebas - Panel de Reservas

**Fecha**: 2025-12-16
**Versión**: 1.0

## ✅ Correcciones Aplicadas

### 1. Endpoints Backend
- [x] ✅ Eliminado endpoint duplicado `/api/reservas/:id/estado`
- [x] ✅ Eliminado endpoint duplicado `/api/reservas/:id/asignar`
- [x] ✅ Conservadas versiones más robustas con transacciones
- [x] ✅ Backend compila sin errores
- [x] ✅ Frontend compila sin errores

### 2. Integración Frontend-Backend
- [x] ✅ Variables `enviarNotificacion` y `enviarNotificacionConductor` definidas
- [x] ✅ Flags `sendEmail` y `sendEmailDriver` se envían correctamente al backend
- [x] ✅ Endpoint `/api/reservas/:id/asignar` maneja ambos flags

## 📋 Pruebas Funcionales Requeridas

### A. Flujo de Estados de Reservas

#### A1. Crear Reserva Nueva
- [ ] Crear reserva con estado inicial `pendiente`
- [ ] Verificar que se muestre en la tabla con badge correcto
- [ ] Verificar que campos obligatorios estén validados
- [ ] Verificar cálculo de precio base

#### A2. Transiciones de Estado
- [ ] `pendiente` → `confirmada` (al pagar abono)
- [ ] `confirmada` → `completada` (servicio finalizado)
- [ ] `pendiente` → `cancelada` (cancelación antes de pago)
- [ ] `confirmada` → `cancelada` (cancelación con reembolso)
- [ ] Verificar que NO se pueda cambiar a `pendiente` si hay pagos

#### A3. Estado `pendiente_detalles`
- [ ] Verificar cuándo se aplica este estado
- [ ] Probar transición a `confirmada`

### B. Sistema de Pagos

#### B1. Pago de Abono (40%)
- [ ] Registrar pago de abono (40% del total)
- [ ] Verificar que estado pago cambie a `parcial`
- [ ] Verificar que campo `abonoPagado` sea `true`
- [ ] Verificar cálculo de saldo pendiente correcto
- [ ] Badge debe mostrar "Pago parcial" con monto

#### B2. Pago de Saldo
- [ ] Registrar pago del saldo restante
- [ ] Verificar que estado pago cambie a `pagado`
- [ ] Verificar que `saldoPendiente` sea 0
- [ ] Verificar que `saldoPagado` sea `true`
- [ ] Badge debe mostrar "Pagado"

#### B3. Pago Total Directo
- [ ] Registrar pago del 100% directamente
- [ ] Verificar estado pago `pagado`
- [ ] Verificar ambos flags `abonoPagado` y `saldoPagado` en `true`
- [ ] Verificar saldo pendiente en 0

#### B4. Estados Especiales
- [ ] Probar estado `reembolsado`
  - Verificar cambio automático a estado `cancelada`
  - Verificar que monto pagado vuelva a 0
- [ ] Probar estado `fallido`
  - Verificar badge destructivo
  - Verificar que no afecte montos previos

### C. Sistema de Gastos

#### C1. Crear Gastos Básicos
- [ ] Crear gasto tipo `combustible`
  - Verificar que se asocie a la reserva
  - Verificar que se muestre en AdminGastos
- [ ] Crear gasto tipo `peaje`
- [ ] Crear gasto tipo `mantenimiento`

#### C2. Comisión Flow (Automática)
- [ ] Crear gasto tipo `comision_flow`
- [ ] Verificar cálculo automático del 3.19%
- [ ] Verificar que el porcentaje se guarde correctamente
- [ ] Verificar que se base en `totalConDescuento`

#### C3. Pago a Conductor
- [ ] Crear gasto tipo `pago_conductor`
- [ ] Verificar que se asocie con `conductorId` si existe
- [ ] Verificar que se muestre nombre del conductor

#### C4. Asociación con Vehículo/Conductor
- [ ] Asignar vehículo y conductor a reserva
- [ ] Crear gasto después de asignación
- [ ] Verificar que gasto muestre correctamente:
  - Nombre del conductor
  - Patente del vehículo

#### C5. Cálculo de Utilidad
- [ ] Crear varios gastos para una reserva
- [ ] Verificar cálculo: `utilidad = totalConDescuento - sumaGastos`
- [ ] Verificar que se muestre correctamente en AdminGastos

#### C6. Cierre de Gastos
- [ ] Usar endpoint `/api/reservas/:id/toggle-gastos`
- [ ] Verificar que campo `gastosCerrados` cambie a `true`
- [ ] Verificar que se bloquee creación de nuevos gastos (si implementado)
- [ ] Reabrir gastos (toggle a `false`)
- [ ] Verificar que se pueda crear gastos nuevamente

### D. Asignación de Conductor y Vehículo

#### D1. Asignación Solo de Vehículo
- [ ] Asignar solo vehículo (sin conductor)
- [ ] Verificar que se actualice campo `vehiculoId`
- [ ] Verificar que `conductorId` quede en `null`
- [ ] Verificar formato del campo `vehiculo`: "TIPO (patente PATENTE)"
- [ ] Verificar registro en tabla `reserva_asignaciones`

#### D2. Asignación de Vehículo + Conductor
- [ ] Asignar vehículo y conductor
- [ ] Verificar que se actualicen ambos IDs
- [ ] Verificar que observaciones incluyan conductor
- [ ] Verificar registro en historial de asignaciones

#### D3. Reasignación
- [ ] Cambiar vehículo asignado
- [ ] Verificar que se cree nuevo registro en historial
- [ ] Cambiar conductor asignado
- [ ] Verificar nuevo registro en historial

#### D4. Notificaciones Email - Cliente
- [ ] Asignar con `sendEmail = true`
- [ ] Verificar llamada a `enviar_asignacion_reserva.php`
- [ ] Verificar payload enviado:
  - email, nombre, codigoReserva
  - origen, destino, fecha, hora
  - vehiculoTipo, vehiculoPatenteLast4
  - conductorNombre (si existe)
- [ ] Asignar con `sendEmail = false`
- [ ] Verificar que NO se envíe email

#### D5. Notificaciones Email - Conductor
- [ ] Asignar con `sendEmailDriver = true` y conductor presente
- [ ] Verificar llamada a `enviar_notificacion_conductor.php`
- [ ] Verificar payload al conductor:
  - email del conductor
  - datos de la reserva
- [ ] Asignar sin conductor
- [ ] Verificar que NO se envíe email al conductor

#### D6. Integración con AdminGastos
- [ ] Asignar vehículo/conductor a reserva
- [ ] Abrir AdminGastos para esa reserva
- [ ] Verificar que muestre:
  - Conductor asignado (nombre)
  - Vehículo asignado (patente)
- [ ] Crear gasto con valores por defecto
- [ ] Verificar que use `conductorId` y `vehiculoId` de la reserva

### E. Acciones en Tabla de Reservas

#### E1. Botón Ver Detalles (👁️)
- [ ] Click en botón "Ver detalles"
- [ ] Verificar que se abra modal con:
  - Información del cliente (nombre, email, teléfono, RUT)
  - Detalles del viaje (origen, destino, fecha, hora, pasajeros)
  - Información adicional (vuelo, hotel, equipaje, silla infantil)
  - Información financiera (precio, descuentos, total, abono, saldo)
  - Estado de reserva y pago (badges)
  - Vehículo y conductor asignado (si existen)
  - Observaciones

#### E2. Botón Editar (✏️)
- [ ] Click en botón "Editar"
- [ ] Verificar que se abra formulario de edición
- [ ] Modificar datos del cliente
- [ ] Modificar fecha/hora
- [ ] Modificar estado de reserva
- [ ] Registrar pago
- [ ] Guardar cambios
- [ ] Verificar que se actualice en tabla

#### E3. Filtros
- [ ] Filtrar por estado: `pendiente`
- [ ] Filtrar por estado: `confirmada`
- [ ] Filtrar por estado: `completada`
- [ ] Filtrar por estado: `cancelada`
- [ ] Filtrar por estado pago: `pendiente`
- [ ] Filtrar por estado pago: `pagado`
- [ ] Combinar filtros

#### E4. Búsqueda
- [ ] Buscar por nombre de cliente
- [ ] Buscar por email
- [ ] Buscar por código de reserva
- [ ] Buscar por RUT
- [ ] Verificar que resultados sean correctos

### F. Columnas Configurables

#### F1. Activar/Desactivar Columnas
- [ ] Click en botón "⚙️ Columnas"
- [ ] Desactivar columna "Pasajeros"
- [ ] Verificar que columna desaparezca
- [ ] Activar columna "Pasajeros"
- [ ] Verificar que columna reaparezca

#### F2. Columnas Disponibles
- [ ] Verificar que todas las columnas funcionen:
  - ID, Código, Cliente, RUT, Contacto
  - Ruta, Fecha/Hora, Pasajeros
  - Total, Estado, Pago, Saldo
  - Acciones

### G. Validaciones y Casos Límite

#### G1. Validaciones de Formulario
- [ ] Intentar crear reserva sin nombre → Error
- [ ] Intentar crear reserva sin email → Error
- [ ] Intentar crear reserva sin teléfono → Error
- [ ] Intentar crear reserva sin origen/destino → Error
- [ ] Intentar crear reserva sin fecha → Error

#### G2. Casos Límite - Pagos
- [ ] Intentar pagar monto negativo → Error
- [ ] Intentar pagar monto mayor al saldo → ¿Permitido o error?
- [ ] Pagar exactamente el monto total → OK
- [ ] Pagar en múltiples abonos pequeños → Verificar suma correcta

#### G3. Casos Límite - Gastos
- [ ] Crear gasto con monto 0 → ¿Permitido?
- [ ] Crear gasto con monto negativo → Error esperado
- [ ] Crear múltiples gastos mismo tipo → OK
- [ ] Gastos mayores al ingreso → Utilidad negativa OK

### H. Flujo Completo Integrado

#### H1. Flujo Ideal Completo
1. [ ] Crear nueva reserva (estado `pendiente`)
2. [ ] Pagar abono 40% (estado `confirmada`, pago `parcial`)
3. [ ] Asignar vehículo y conductor (con emails)
4. [ ] Verificar emails enviados
5. [ ] Crear gastos:
   - [ ] Comisión Flow (automático 3.19%)
   - [ ] Combustible
   - [ ] Pago conductor
   - [ ] Peaje
6. [ ] Verificar cálculo de utilidad
7. [ ] Pagar saldo restante (pago `pagado`)
8. [ ] Cerrar gastos (`gastosCerrados = true`)
9. [ ] Cambiar estado a `completada`
10. [ ] Verificar que todo se muestre correctamente

#### H2. Flujo con Cancelación
1. [ ] Crear reserva y pagar
2. [ ] Asignar vehículo/conductor
3. [ ] Crear algunos gastos
4. [ ] Cambiar estado pago a `reembolsado`
5. [ ] Verificar que estado reserva cambie a `cancelada`
6. [ ] Verificar que gastos permanezcan (para contabilidad)

#### H3. Flujo Sin Conductor
1. [ ] Crear reserva y pagar
2. [ ] Asignar solo vehículo (sin conductor)
3. [ ] Crear gastos (sin conductorId)
4. [ ] Verificar que todo funcione sin errores

## 🎯 Criterios de Éxito

### Debe Funcionar
✅ Todos los endpoints responden correctamente  
✅ No hay duplicados de endpoints  
✅ Badges de estado se muestran correctamente  
✅ Cálculos de montos son precisos  
✅ Transiciones de estado son consistentes  
✅ Emails se envían cuando corresponde  
✅ Gastos se asocian correctamente  
✅ Historial de asignaciones funciona  
✅ Integración AdminReservas-AdminGastos funciona  

### Sin Errores en Consola
✅ No hay errores de compilación  
✅ No hay errores de runtime en navegador  
✅ No hay warnings críticos  
✅ Logs informativos en backend funcionan  

### Performance
✅ Tiempos de respuesta aceptables (< 2s)  
✅ UI responsive y fluida  
✅ Transacciones garantizan consistencia  

## 📝 Notas para Pruebas Manuales

### Configuración Necesaria
- Base de datos MySQL con tablas actualizadas
- Backend corriendo en Render.com o local
- Frontend corriendo en localhost o Hostinger
- Scripts PHP de emails en Hostinger configurados
- Variables de entorno correctamente definidas

### Datos de Prueba Sugeridos
**Reserva de Prueba:**
- Nombre: "Juan Pérez Test"
- Email: "test@example.com"
- Teléfono: "+56912345678"
- RUT: "12345678-9"
- Origen: "Temuco"
- Destino: "Aeropuerto La Araucanía"
- Fecha: [hoy + 7 días]
- Hora: "10:00"
- Pasajeros: 2
- Precio: $50,000

**Gastos de Prueba:**
- Comisión Flow: $1,595 (3.19% de $50,000) - automático
- Combustible: $15,000
- Pago Conductor: $20,000
- Peaje: $2,000
- **Total Gastos**: $38,595
- **Utilidad**: $11,405

### Verificación Post-Pruebas
- [ ] Revisar logs del backend para errores
- [ ] Verificar integridad de datos en BD
- [ ] Confirmar que no hay memory leaks
- [ ] Validar que emails lleguen correctamente
