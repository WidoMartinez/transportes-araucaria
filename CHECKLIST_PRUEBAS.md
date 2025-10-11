# Checklist de Pruebas - Formulario Express de Reservas

Este documento proporciona una lista de verificación para probar manualmente las mejoras implementadas en el formulario de reservas express.

## ✅ Prerrequisitos

- [ ] El proyecto está corriendo localmente (`npm run dev`)
- [ ] Navegador abierto en la página principal
- [ ] Acceso a las herramientas de desarrollo del navegador (F12)

## 📝 Pruebas del Paso 1 (Información del viaje)

### Validación básica del Paso 1
- [ ] Seleccionar origen (ej: Aeropuerto La Araucanía)
- [ ] Seleccionar destino (ej: Pucón)
- [ ] Seleccionar fecha futura
- [ ] Verificar que aparece el precio estimado
- [ ] Hacer clic en "Continuar al pago →"
- [ ] Verificar que avanza al Paso 2

### Validación de fecha
- [ ] Intentar seleccionar una fecha pasada
- [ ] Verificar que no se puede seleccionar
- [ ] Seleccionar fecha de hoy
- [ ] Verificar que funciona correctamente

### Opción de ida y vuelta
- [ ] Marcar la opción "¿También necesitas el regreso?"
- [ ] Verificar que aparece el campo de fecha de regreso
- [ ] Seleccionar fecha de regreso anterior a la de ida
- [ ] Verificar que muestra error
- [ ] Corregir fecha de regreso
- [ ] Verificar que se calcula el precio con descuento de ida y vuelta

## 📝 Pruebas del Paso 2 (Datos personales y pago)

### Caso 1: Todos los campos vacíos

- [ ] Avanzar al Paso 2 desde el Paso 1
- [ ] Verificar que los campos Nombre, Email y Teléfono están vacíos
- [ ] Verificar que cada campo tiene un asterisco rojo (*)
- [ ] Verificar que el checkbox de consentimiento NO está marcado
- [ ] **Verificar que NO se muestran las opciones de pago**
- [ ] **Verificar que se muestra el mensaje de advertencia en amarillo**
- [ ] Verificar que el mensaje lista todos los campos faltantes:
  - Nombre completo
  - Correo electrónico válido
  - Teléfono
  - Aceptar términos y condiciones

### Caso 2: Completar campos uno por uno

#### Completar solo el nombre
- [ ] Ingresar nombre (ej: "Juan Pérez")
- [ ] Dejar email y teléfono vacíos
- [ ] Verificar que el mensaje de advertencia sigue mostrándose
- [ ] Verificar que "Nombre completo" ya NO aparece en la lista de campos faltantes
- [ ] **Verificar que aún NO se muestran las opciones de pago**

#### Completar nombre y email (inválido)
- [ ] Ingresar email inválido (ej: "test@")
- [ ] Verificar que el mensaje sigue mostrándose
- [ ] Verificar que "Correo electrónico válido" sigue en la lista
- [ ] **Verificar que aún NO se muestran las opciones de pago**

#### Completar nombre y email (válido)
- [ ] Corregir email (ej: "juan@email.cl")
- [ ] Verificar que "Correo electrónico válido" desaparece de la lista
- [ ] **Verificar que aún NO se muestran las opciones de pago** (falta teléfono y checkbox)

#### Completar nombre, email y teléfono
- [ ] Ingresar teléfono (ej: "+56 9 1234 5678")
- [ ] Verificar que "Teléfono" desaparece de la lista
- [ ] Verificar que solo queda "Aceptar términos y condiciones" en la lista
- [ ] **Verificar que aún NO se muestran las opciones de pago** (falta checkbox)

#### Completar todos los campos y marcar checkbox
- [ ] Marcar el checkbox de consentimiento
- [ ] **Verificar que el mensaje de advertencia desaparece completamente**
- [ ] **Verificar que ahora SÍ aparecen las opciones de pago**
- [ ] Verificar que aparece el texto "Paso 1: Elige cuánto deseas pagar ahora"

### Caso 3: Flujo de pago - Paso 1 (Selección de monto)

#### Visualización inicial
- [ ] Verificar que se muestran 2 opciones de monto:
  - Reservar con 40% (con badge "Recomendado")
  - Pagar el 100%
- [ ] Verificar que cada opción muestra el monto correcto
- [ ] Verificar que NO se muestran los métodos de pago (Flow, Mercado Pago) todavía

#### Seleccionar 40%
- [ ] Hacer clic en "Reservar con 40%"
- [ ] Verificar que las opciones de monto desaparecen
- [ ] Verificar que aparece "Paso 2: Elige tu método de pago"
- [ ] Verificar que se muestra "Pagarás: $X" con el monto del 40%
- [ ] Verificar que aparece el botón "← Cambiar monto"
- [ ] Verificar que ahora SÍ aparecen 2 métodos de pago:
  - Flow (con descripción)
  - Mercado Pago (con descripción)

#### Cambiar de opinión - Regresar
- [ ] Hacer clic en "← Cambiar monto"
- [ ] Verificar que vuelven a aparecer las 2 opciones de monto
- [ ] Verificar que los métodos de pago desaparecen

#### Seleccionar 100%
- [ ] Hacer clic en "Pagar el 100%"
- [ ] Verificar que aparece "Pagarás: $Y" con el monto del 100%
- [ ] Verificar que aparecen los métodos de pago

### Caso 4: Flujo de pago - Paso 2 (Selección de método)

#### Visualización de métodos
- [ ] Con 40% seleccionado, verificar que se muestran:
  - Botón de Flow con logo y descripción
  - Botón de Mercado Pago con logo y descripción
- [ ] Verificar que los botones tienen efecto hover (cambia borde a primario)

#### Intentar pagar con Flow
- [ ] Hacer clic en el botón de Flow
- [ ] Verificar que el botón muestra spinner de carga
- [ ] Verificar que los demás botones se deshabilitan
- [ ] (Nota: El pago real se procesará según la configuración del backend)

#### Intentar pagar con Mercado Pago
- [ ] Regresar y seleccionar 100%
- [ ] Hacer clic en el botón de Mercado Pago
- [ ] Verificar que el botón muestra spinner de carga
- [ ] Verificar que los demás botones se deshabilitan

### Caso 5: Validación de email en tiempo real

- [ ] Ingresar "test" en el campo de email
- [ ] Verificar que aparece en la lista de campos faltantes "Correo electrónico válido"
- [ ] Ingresar "test@"
- [ ] Verificar que sigue en la lista
- [ ] Ingresar "test@email"
- [ ] Verificar que sigue en la lista
- [ ] Ingresar "test@email.com"
- [ ] Verificar que desaparece de la lista

### Caso 6: Validación de checkbox

- [ ] Completar nombre, email y teléfono correctamente
- [ ] Desmarcar el checkbox (si estaba marcado)
- [ ] Verificar que aparece "Aceptar términos y condiciones" en la lista
- [ ] Verificar que NO se muestran opciones de pago
- [ ] Marcar el checkbox
- [ ] Verificar que "Aceptar términos y condiciones" desaparece de la lista
- [ ] Verificar que aparecen las opciones de pago

### Caso 7: Probar con código de descuento

- [ ] Completar todos los campos obligatorios
- [ ] Ingresar un código de descuento válido (si existe)
- [ ] Verificar que el precio se actualiza
- [ ] Verificar que las opciones de pago muestran el nuevo precio
- [ ] Seleccionar 40% y verificar que el monto es correcto
- [ ] Remover el código de descuento
- [ ] Verificar que el precio vuelve al original

### Caso 8: Navegación entre pasos

- [ ] Estar en Paso 2 con campos completos
- [ ] Hacer clic en "← Volver"
- [ ] Verificar que regresa al Paso 1
- [ ] Verificar que los datos del Paso 1 se mantienen
- [ ] Hacer clic en "Continuar al pago →"
- [ ] Verificar que regresa al Paso 2
- [ ] Verificar que los datos del Paso 2 se mantienen

## 🐛 Pruebas de casos extremos

### Email con caracteres especiales
- [ ] Probar email con espacios: "test @email.com"
- [ ] Probar email con múltiples @: "test@@email.com"
- [ ] Probar email con caracteres especiales válidos: "test+123@email.com"
- [ ] Verificar que la validación funciona correctamente en todos los casos

### Nombre con caracteres especiales
- [ ] Probar nombre con tildes: "José García"
- [ ] Probar nombre con ñ: "Peña"
- [ ] Probar nombre con espacios múltiples: "Juan  Pérez"
- [ ] Verificar que se acepta correctamente

### Teléfono con diferentes formatos
- [ ] Probar "+56912345678"
- [ ] Probar "+56 9 1234 5678"
- [ ] Probar "912345678"
- [ ] Verificar que todos los formatos son aceptados

### Responsive (diferentes tamaños de pantalla)
- [ ] Probar en pantalla de escritorio (1920x1080)
- [ ] Probar en tablet (768x1024)
- [ ] Probar en móvil (375x667)
- [ ] Verificar que:
  - Los campos se muestran correctamente
  - Los botones son accesibles
  - El mensaje de advertencia es legible
  - Las opciones de pago se ven bien en grid

## ✅ Verificación final

### Consola del navegador
- [ ] Abrir consola (F12)
- [ ] Completar todo el flujo de reserva
- [ ] Verificar que NO hay errores en la consola
- [ ] Verificar que NO hay warnings relacionados con el formulario

### Performance
- [ ] Completar y enviar una reserva completa
- [ ] Verificar que la respuesta es rápida (< 2 segundos)
- [ ] Verificar que no hay lag al escribir en los campos

### Accesibilidad básica
- [ ] Usar solo el teclado (Tab) para navegar entre campos
- [ ] Verificar que el orden de navegación es lógico
- [ ] Verificar que se puede marcar el checkbox con Space
- [ ] Verificar que todos los campos tienen labels asociados

## 📊 Resultado esperado

Al completar todas estas pruebas:

✅ **Debe ser imposible** acceder a los botones de pago sin completar todos los campos obligatorios

✅ El usuario **siempre sabe** qué campos le faltan por completar

✅ El flujo de pago es **claro y guiado** (primero monto, luego método)

✅ El usuario puede **cambiar de opinión** y regresar a seleccionar otro monto

✅ La validación funciona en **tiempo real** y es **precisa**

## 📝 Notas para el tester

Si encuentras algún problema durante las pruebas:
1. Anota el paso exacto donde ocurrió
2. Captura una pantalla si es posible
3. Revisa la consola del navegador para ver errores
4. Intenta reproducir el problema
5. Documenta los pasos para reproducirlo
