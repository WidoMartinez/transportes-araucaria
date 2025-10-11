# Flujo de Reserva Express Corregido

## Problema Original

El módulo Express tenía un botón "Confirmar reserva" que creaba reservas en la base de datos sin requerir pago. Esto causaba confusión porque:

1. Los usuarios pensaban que estaban confirmando una reserva cuando en realidad no estaban pagando
2. Se creaban registros de reservas "pendientes" sin pago asociado
3. El flujo no era claro sobre la necesidad de pagar para confirmar

## Solución Implementada

### Cambios en `src/components/HeroExpress.jsx`

#### 1. Función `validateStepTwo()` (anteriormente `handleStepTwoNext`)
- **Propósito**: Solo valida los datos del formulario
- **Retorna**: `true` si todos los datos son válidos, `false` si hay errores
- **NO crea** la reserva en la base de datos

#### 2. Nueva función `handlePaymentWithReservation(gateway, type)`
- **Propósito**: Maneja el flujo completo de creación de reserva + pago
- **Flujo**:
  1. Valida datos del formulario con `validateStepTwo()`
  2. Si la validación es exitosa, crea la reserva llamando a `onSubmitWizard()`
  3. Si la reserva se crea exitosamente, redirige al gateway de pago
  4. Si hay error en cualquier paso, muestra mensaje de error

#### 3. Eliminación del botón "Confirmar reserva"
- Se removió el botón que permitía "confirmar" sin pagar
- Este botón era confuso y permitía crear reservas sin pago

#### 4. Actualización de botones de pago
- Los botones de **Flow** y **Mercado Pago** ahora llaman a `handlePaymentWithReservation()`
- Esto asegura que la reserva se cree ANTES de redirigir al pago

#### 5. Mensaje informativo agregado
```jsx
<div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
  <p className="text-sm text-blue-800">
    💳 <strong>Para confirmar tu reserva, selecciona un método de pago arriba</strong>
    <br />
    <span className="text-xs">
      La reserva se creará automáticamente al procesar el pago
    </span>
  </p>
</div>
```

## Flujo Correcto (Después de la Corrección)

### Paso 1: Datos del Viaje
1. Usuario selecciona origen
2. Usuario selecciona destino
3. Usuario selecciona fecha (y fecha de regreso si es ida y vuelta)
4. Usuario selecciona número de pasajeros
5. Usuario hace clic en "Continuar al pago →"

### Paso 2: Datos Personales y Pago
1. Usuario ingresa nombre completo
2. Usuario ingresa email
3. Usuario ingresa teléfono
4. Sistema muestra:
   - Resumen del viaje
   - Opciones de pago (40% o 100%)
   - Botones de métodos de pago (Flow y Mercado Pago)
5. Usuario acepta términos y condiciones (checkbox)
6. Usuario hace clic en uno de los botones de pago (Flow o Mercado Pago)
7. **Sistema valida datos**
8. **Sistema crea reserva en base de datos**
9. **Sistema redirige a pasarela de pago**

### Después del Pago
1. Usuario completa el pago en la pasarela
2. Sistema recibe confirmación de pago (webhook)
3. Sistema actualiza estado de la reserva
4. Usuario es redirigido a página de completar detalles
5. Usuario especifica hora exacta y detalles adicionales

## Validaciones Implementadas

La función `validateStepTwo()` valida:

✅ Nombre completo (no vacío)
✅ Email (no vacío y formato válido)
✅ Teléfono (no vacío, validación suave de formato)
✅ Consentimiento de pago (checkbox aceptado)

## Pruebas Manuales Sugeridas

### Caso 1: Flujo exitoso con Flow (40%)
1. Completar paso 1 correctamente
2. Completar paso 2 con datos válidos
3. Aceptar términos
4. Hacer clic en botón de Flow (40%)
5. **Verificar**: Se crea reserva en BD
6. **Verificar**: Se redirige a Flow

### Caso 2: Flujo exitoso con Mercado Pago (100%)
1. Completar paso 1 correctamente
2. Completar paso 2 con datos válidos
3. Aceptar términos
4. Hacer clic en botón de Mercado Pago (100%)
5. **Verificar**: Se crea reserva en BD
6. **Verificar**: Se redirige a Mercado Pago

### Caso 3: Validación de datos incorrectos
1. Completar paso 1 correctamente
2. En paso 2, dejar nombre vacío
3. Hacer clic en botón de pago
4. **Verificar**: Muestra error "Ingresa tu nombre completo"
5. **Verificar**: NO se crea reserva
6. **Verificar**: NO se redirige a pago

### Caso 4: Sin aceptar términos
1. Completar paso 1 correctamente
2. Completar paso 2 con datos válidos
3. NO aceptar términos
4. Hacer clic en botón de pago
5. **Verificar**: Botones de pago están deshabilitados

### Caso 5: Email inválido
1. Completar paso 1 correctamente
2. En paso 2, ingresar email sin formato válido (ej: "test")
3. Hacer clic en botón de pago
4. **Verificar**: Muestra error "El correo electrónico no es válido"
5. **Verificar**: NO se crea reserva

## Base de Datos

### Estado de Reservas Express

Las reservas creadas por el flujo express tienen:

- `estado`: "pendiente_detalles"
- `estadoPago`: "pendiente" (hasta que webhook confirme el pago)
- `detallesCompletos`: false
- Todos los datos del formulario guardados
- Pricing calculado guardado

### Actualización después del Pago

Cuando el webhook confirma el pago:
- `estadoPago`: "pendiente" → "confirmado"
- Se envía email de confirmación
- Usuario puede completar detalles (hora exacta, etc.)

## Beneficios de la Corrección

✅ **Claridad**: El usuario entiende que debe pagar para confirmar
✅ **Integridad**: No se crean reservas sin intención de pago
✅ **Flujo correcto**: Validación → Reserva → Pago (en ese orden)
✅ **Mejor UX**: Mensaje claro indicando qué hacer
✅ **Prevención de errores**: No hay botón confuso de "Confirmar reserva"

## Notas Técnicas

- La función `onSubmitWizard()` (definida en `App.jsx`) llama a `enviarReservaExpress()`
- `enviarReservaExpress()` hace POST a `/enviar-reserva-express` en el backend
- El backend guarda la reserva con `estado: "pendiente_detalles"` y `estadoPago: "pendiente"`
- `handlePayment()` (definida en `App.jsx`) usa el `reservationId` para asociar el pago
- El webhook actualiza el `estadoPago` cuando el pago es confirmado

## Archivos Modificados

- `src/components/HeroExpress.jsx`: Lógica de validación y flujo de pago

## Archivos NO Modificados (por instrucciones del usuario)

- Backend (`backend/server-db.js`): No se modificó (según instrucciones)
- `src/App.jsx`: No se modificó la lógica existente
- PHP files: No se modificaron (están en Hostinger)
