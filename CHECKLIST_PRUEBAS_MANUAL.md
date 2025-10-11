# ✅ Checklist de Pruebas Manuales

## Instrucciones para Validación

Después de hacer deploy de estos cambios, realizar las siguientes pruebas para verificar que el flujo funciona correctamente.

---

## 🧪 Prueba 1: Flujo Completo Exitoso (Flow 40%)

### Pasos:
1. ✅ Ir a la página principal
2. ✅ Seleccionar origen: "Aeropuerto La Araucanía"
3. ✅ Seleccionar destino: "Temuco" (o cualquier otro)
4. ✅ Seleccionar fecha de hoy o futura
5. ✅ Seleccionar 2 pasajeros
6. ✅ Click en "Continuar al pago →"
7. ✅ Ingresar nombre: "Juan Pérez"
8. ✅ Ingresar email: "test@test.cl"
9. ✅ Ingresar teléfono: "+56912345678"
10. ✅ Marcar checkbox "Acepto recibir confirmación..."
11. ✅ Verificar que se muestre el mensaje azul: "Para confirmar tu reserva, selecciona un método de pago arriba"
12. ✅ Verificar que NO existe botón "Confirmar reserva"
13. ✅ Click en botón "Flow" bajo la opción "Reservar con 40%"

### Resultados Esperados:
- ✅ Se muestra spinner "Procesando reserva..."
- ✅ Se crea reserva en base de datos con estado "pendiente_detalles"
- ✅ Se redirige a Flow en nueva pestaña
- ✅ NO se muestra error

### Verificar en Base de Datos:
```sql
SELECT * FROM reservas WHERE email = 'test@test.cl' ORDER BY created_at DESC LIMIT 1;
```
- ✅ `estado` = "pendiente_detalles"
- ✅ `estadoPago` = "pendiente"
- ✅ `nombre`, `email`, `telefono` correctos
- ✅ `origen`, `destino`, `fecha` correctos

---

## 🧪 Prueba 2: Flujo Completo Exitoso (Mercado Pago 100%)

### Pasos:
1. ✅ Repetir pasos 1-10 de Prueba 1
2. ✅ Click en botón "Mercado Pago" bajo la opción "Pagar el 100%"

### Resultados Esperados:
- ✅ Se muestra spinner
- ✅ Se crea reserva en BD
- ✅ Se redirige a Mercado Pago en nueva pestaña
- ✅ NO se muestra error

---

## 🧪 Prueba 3: Validación de Nombre Vacío

### Pasos:
1. ✅ Completar paso 1 correctamente
2. ✅ En paso 2, **dejar campo nombre VACÍO**
3. ✅ Ingresar email y teléfono válidos
4. ✅ Marcar checkbox de términos
5. ✅ Click en cualquier botón de pago

### Resultados Esperados:
- ✅ Se muestra error rojo: "⚠️ Ingresa tu nombre completo."
- ✅ NO se crea reserva en BD
- ✅ NO se redirige a pasarela de pago
- ✅ Usuario permanece en la página

---

## 🧪 Prueba 4: Validación de Email Inválido

### Pasos:
1. ✅ Completar paso 1 correctamente
2. ✅ Ingresar nombre válido
3. ✅ Ingresar email INVÁLIDO: "test" (sin @)
4. ✅ Ingresar teléfono válido
5. ✅ Marcar checkbox
6. ✅ Click en botón de pago

### Resultados Esperados:
- ✅ Se muestra error: "⚠️ El correo electrónico no es válido."
- ✅ NO se crea reserva
- ✅ NO se redirige a pago

---

## 🧪 Prueba 5: Validación de Teléfono Vacío

### Pasos:
1. ✅ Completar paso 1 correctamente
2. ✅ Ingresar nombre y email válidos
3. ✅ **Dejar teléfono VACÍO**
4. ✅ Marcar checkbox
5. ✅ Click en botón de pago

### Resultados Esperados:
- ✅ Se muestra error: "⚠️ Ingresa tu teléfono móvil."
- ✅ NO se crea reserva
- ✅ NO se redirige a pago

---

## 🧪 Prueba 6: Sin Aceptar Términos

### Pasos:
1. ✅ Completar paso 1 correctamente
2. ✅ Ingresar todos los datos válidos
3. ✅ **NO marcar checkbox de términos**
4. ✅ Intentar click en botón de pago

### Resultados Esperados:
- ✅ Los botones de pago están **DESHABILITADOS** (grises, no clickeables)
- ✅ NO se puede hacer click
- ✅ NO se crea reserva

---

## 🧪 Prueba 7: Ida y Vuelta

### Pasos:
1. ✅ Completar paso 1 con checkbox "Ida y Vuelta" marcado
2. ✅ Seleccionar fecha de ida
3. ✅ Seleccionar fecha de regreso (posterior a ida)
4. ✅ Completar paso 2 con datos válidos
5. ✅ Click en botón de pago

### Resultados Esperados:
- ✅ Se acepta ida y vuelta
- ✅ Se crea reserva con ambas fechas
- ✅ Se calcula precio con descuento de ida y vuelta
- ✅ Se redirige a pago

### Verificar en BD:
- ✅ `idaVuelta` = true
- ✅ `fecha` = fecha de ida
- ✅ `fechaRegreso` = fecha de regreso
- ✅ `descuentoRoundTrip` > 0

---

## 🧪 Prueba 8: Fecha de Regreso Anterior a Ida (Error)

### Pasos:
1. ✅ Marcar "Ida y Vuelta"
2. ✅ Seleccionar fecha de ida: 2025-10-15
3. ✅ Seleccionar fecha de regreso: 2025-10-10 (anterior)
4. ✅ Intentar continuar al paso 2

### Resultados Esperados:
- ✅ Se muestra error: "⚠️ La fecha de regreso no puede ser anterior a la fecha de ida."
- ✅ NO permite avanzar al paso 2
- ✅ Usuario permanece en paso 1

---

## 🧪 Prueba 9: Cotización Manual (Destino "Otro")

### Pasos:
1. ✅ Seleccionar origen normal
2. ✅ Seleccionar destino: "Otro"
3. ✅ Completar paso 1 y avanzar a paso 2
4. ✅ Completar datos personales

### Resultados Esperados:
- ✅ NO se muestran botones de pago (Flow/MP)
- ✅ Se muestra botón "Solicitar cotización personalizada"
- ✅ Click redirige a sección de contacto (#contacto)
- ✅ Se muestra mensaje "📋 Cotización personalizada"

---

## 🧪 Prueba 10: Botón "Volver" en Paso 2

### Pasos:
1. ✅ Completar paso 1 y avanzar a paso 2
2. ✅ Click en botón "← Volver"

### Resultados Esperados:
- ✅ Regresa al paso 1
- ✅ Datos del paso 1 se mantienen (no se pierden)
- ✅ NO se crea reserva
- ✅ Puede editar datos y continuar de nuevo

---

## 🧪 Prueba 11: Código de Descuento

### Pasos:
1. ✅ Completar paso 1
2. ✅ En paso 2, aplicar código de descuento válido
3. ✅ Verificar que se aplica descuento en precio
4. ✅ Completar datos y hacer pago

### Resultados Esperados:
- ✅ Precio se actualiza con descuento del código
- ✅ Se crea reserva con campo `codigoDescuento` lleno
- ✅ En backend se registra uso del código

### Verificar en BD:
```sql
SELECT * FROM reservas WHERE codigoDescuento IS NOT NULL ORDER BY created_at DESC LIMIT 1;
```
- ✅ Campo `codigoDescuento` contiene el código usado

---

## 🧪 Prueba 12: Verificar que NO Existe Botón "Confirmar Reserva"

### Pasos:
1. ✅ Ir al paso 2 del flujo express
2. ✅ Inspeccionar visualmente la página

### Resultados Esperados:
- ✅ **NO existe** botón con texto "Confirmar reserva →"
- ✅ Solo existen botones de pago (Flow y Mercado Pago)
- ✅ Existe mensaje azul indicando seleccionar método de pago
- ✅ Existe botón "← Volver"

---

## 🧪 Prueba 13: Mensaje Informativo Visible

### Pasos:
1. ✅ Ir al paso 2 con cotización automática (no "Otro")
2. ✅ Verificar mensaje informativo

### Resultados Esperados:
- ✅ Se muestra mensaje con fondo azul claro
- ✅ Texto: "💳 Para confirmar tu reserva, selecciona un método de pago arriba"
- ✅ Subtexto: "La reserva se creará automáticamente al procesar el pago"
- ✅ Mensaje está centrado
- ✅ Mensaje está visible y legible

---

## 🧪 Prueba 14: Doble Click en Botón de Pago

### Pasos:
1. ✅ Completar formulario correctamente
2. ✅ Hacer **doble click rápido** en botón de pago

### Resultados Esperados:
- ✅ Solo se procesa UNA vez
- ✅ Botón se deshabilita después del primer click
- ✅ Se muestra spinner
- ✅ NO se crean reservas duplicadas en BD

---

## 🧪 Prueba 15: Error al Crear Reserva

### Pasos:
1. ✅ Completar formulario correctamente
2. ✅ Simular error de backend (si es posible, o desconectar internet momentáneamente)
3. ✅ Click en botón de pago

### Resultados Esperados:
- ✅ Se muestra error: "Ocurrió un error al crear la reserva. Inténtalo de nuevo."
- ✅ NO se redirige a pasarela de pago
- ✅ Usuario puede reintentar
- ✅ Botón se vuelve a habilitar

---

## 📊 Resumen de Validaciones

Después de completar todas las pruebas, verificar:

- ✅ **NO existe botón "Confirmar reserva"** en ninguna parte
- ✅ **Solo se crean reservas** cuando se hace click en botón de pago
- ✅ **Validaciones funcionan** antes de crear reserva
- ✅ **Mensaje informativo** es claro y visible
- ✅ **Flujo completo** funciona de principio a fin
- ✅ **Base de datos** solo tiene reservas con intención de pago
- ✅ **No hay reservas huérfanas** sin método de pago asociado

---

## 🐛 Reportar Problemas

Si alguna prueba **FALLA**, reportar:

1. Número de prueba que falló
2. Pasos exactos realizados
3. Resultado obtenido vs esperado
4. Captura de pantalla del error
5. Logs de consola del navegador (F12)

---

## ✅ Confirmación Final

Una vez completadas todas las pruebas exitosamente:

- [ ] Todas las validaciones pasaron
- [ ] No existen errores de consola
- [ ] Flujo es claro e intuitivo
- [ ] NO existe botón "Confirmar reserva"
- [ ] Solo se crean reservas al pagar
- [ ] Cambios en producción verificados

**Fecha de validación:** _________________

**Validado por:** _________________

**Resultado:** ✅ APROBADO / ❌ REQUIERE CORRECCIONES
