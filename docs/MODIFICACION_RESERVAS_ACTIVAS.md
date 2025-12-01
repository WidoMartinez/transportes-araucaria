# Modificación de Reservas Activas Sin Pagar

## Descripción

Este sistema permite a los clientes modificar sus reservas existentes sin pagar en lugar de crear múltiples reservas duplicadas. El comportamiento es el siguiente:

### Reglas de Negocio

1. **Cliente con reserva sin pagar**: Si un cliente tiene una reserva activa (estado `pendiente` o `pendiente_detalles`) con `estadoPago = 'pendiente'`, al intentar crear una nueva reserva se modificará la existente.

2. **Cliente con reserva pagada**: Si un cliente tiene una reserva pagada, puede crear una nueva reserva sin problemas.

3. **Cliente nuevo**: Los clientes sin reservas previas crean nuevas reservas normalmente.

## Implementación

### Backend

#### Nuevo Endpoint: Verificar Reserva Activa

**URL**: `GET /api/reservas/verificar-activa/:email`

**Parámetros**:
- `email` (URL): Email del cliente a verificar

**Respuesta exitosa**:
```json
{
  "tieneReservaActiva": true,
  "reserva": {
    "id": 123,
    "codigoReserva": "AR-20251016-0001",
    "origen": "Aeropuerto La Araucanía",
    "destino": "Pucón",
    "fecha": "2025-10-20",
    "pasajeros": 2,
    "precio": 50000,
    "totalConDescuento": 45000,
    "createdAt": "2025-10-16T10:30:00.000Z"
  },
  "mensaje": "Se encontró una reserva activa sin pagar. Se modificará en lugar de crear una nueva."
}
```

**Respuesta sin reserva activa**:
```json
{
  "tieneReservaActiva": false,
  "mensaje": "No hay reservas activas sin pagar"
}
```

#### Endpoint Modificado: Enviar Reserva Express

**URL**: `POST /enviar-reserva-express`

**Comportamiento**:
1. Verifica si existe una reserva activa sin pagar para el email proporcionado
2. Si existe:
   - Actualiza todos los campos de la reserva existente
   - Mantiene el código de reserva original
   - Retorna `esModificacion: true`
3. Si no existe:
   - Crea una nueva reserva con un nuevo código
   - Retorna `esModificacion: false`

**Respuesta**:
```json
{
  "success": true,
  "message": "Reserva modificada correctamente",
  "reservaId": 123,
  "codigoReserva": "AR-20251016-0001",
  "tipo": "express",
  "esModificacion": true
}
```

### Frontend

#### Componente: HeroExpress

**Nuevas funcionalidades**:

1. **Verificación automática**: Cuando el usuario ingresa su email y pierde el foco del campo (evento `onBlur`), se verifica automáticamente si tiene una reserva activa.

2. **Indicador visual**: Si se encuentra una reserva activa sin pagar, se muestra un mensaje informativo:
   ```
   ⚠️ Tienes una reserva sin pagar
   Código: AR-20251016-0001
   Al continuar, se modificará tu reserva existente en lugar de crear una nueva.
   ```

3. **Estados**:
   - `reservaActiva`: Almacena los datos de la reserva activa encontrada
   - `verificandoReserva`: Indica si se está verificando actualmente

## Flujo de Usuario

### Caso 1: Cliente con reserva sin pagar

1. Cliente ingresa a la página de reservas
2. Completa paso 1 (destino, fecha, pasajeros)
3. En paso 2, ingresa su email
4. Al salir del campo de email, se muestra el mensaje de advertencia
5. Cliente continúa con el proceso
6. Al enviar, su reserva existente se actualiza con los nuevos datos
7. Mantiene el mismo código de reserva

### Caso 2: Cliente con reserva pagada o sin reservas

1. Cliente ingresa a la página de reservas
2. Completa paso 1 y paso 2 normalmente
3. No se muestra mensaje de advertencia
4. Al enviar, se crea una nueva reserva con nuevo código
5. Se envía confirmación por email

## Pruebas

### Escenario 1: Modificar reserva existente
```bash
# 1. Crear una reserva sin pagar
curl -X POST https://api.example.com/enviar-reserva-express \
  -H "Content-Type: application/json" \
  -d '{"email":"cliente@example.com", ...}'

# 2. Intentar crear otra reserva con el mismo email
curl -X POST https://api.example.com/enviar-reserva-express \
  -H "Content-Type: application/json" \
  -d '{"email":"cliente@example.com", "destino":"Otro destino", ...}'

# Resultado esperado: esModificacion = true, mismo codigoReserva
```

### Escenario 2: Crear nueva después de pagar
```bash
# 1. Crear y pagar una reserva
# 2. Marcar como pagada
curl -X PUT https://api.example.com/api/reservas/123/pago \
  -H "Content-Type: application/json" \
  -d '{"estadoPago":"pagado"}'

# 3. Crear nueva reserva con mismo email
curl -X POST https://api.example.com/enviar-reserva-express \
  -H "Content-Type: application/json" \
  -d '{"email":"cliente@example.com", ...}'

# Resultado esperado: esModificacion = false, nuevo codigoReserva
```

## Consideraciones Técnicas

### Base de Datos
- Las reservas mantienen su `codigoReserva` original cuando se modifican
- Los campos de auditoría (`ipAddress`, `userAgent`) se actualizan con los valores más recientes
- El campo `createdAt` permanece sin cambios (fecha de creación original)
- El campo `updatedAt` se actualiza automáticamente por Sequelize

### Seguridad
- La verificación solo usa el email, no requiere autenticación adicional
- Esto es apropiado para el flujo express donde los clientes no tienen cuentas
- Si se requiere mayor seguridad, se puede agregar verificación por código de reserva

### Notificaciones
- Se envía email de confirmación en ambos casos (creación y modificación)
- El mensaje del email usa el código de reserva correspondiente
- El backend de PHP recibe los mismos datos en ambos casos

## Archivos Modificados

### Backend
- `/backend/server-db.js`: 
  - Nuevo endpoint `GET /api/reservas/verificar-activa/:email`
  - Lógica de modificación vs creación en `POST /enviar-reserva-express`

### Frontend
- `/src/components/HeroExpress.jsx`:
  - Nueva función `verificarReservaActiva()`
  - Nuevos estados para tracking de reserva activa
  - UI para mostrar advertencia de modificación

## Mejoras Futuras

1. **Historial de cambios**: Registrar las modificaciones realizadas a cada reserva
2. **Límite de modificaciones**: Permitir solo X modificaciones por reserva
3. **Ventana de tiempo**: Solo permitir modificaciones hasta X horas antes del viaje
4. **Notificación de cambios**: Enviar email específico cuando se modifica una reserva
5. **Panel de usuario**: Permitir a los clientes ver y modificar sus reservas desde un panel dedicado

## Fecha de Implementación
16 de octubre de 2025
