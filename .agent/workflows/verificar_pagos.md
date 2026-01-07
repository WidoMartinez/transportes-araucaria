---
description: Comprobar flujos de pagos (Reservas, Códigos, Pasarelas)
---
# Verificación de Flujos de Pago

Este workflow te guía para verificar todos los mecanismos de pago y reserva.

## 1. Verificación Backend (Automática)

Primero, verifiquemos que los endpoints de cálculo de precios y reservas básicas respondan correctamente.

### 1.1 Test de Tarifa Dinámica y Productos
```bash
node backend/test-tarifa-dinamica.js
// espera un momento...
node backend/test-productos.js
```

### 1.2 Test de Reserva Express
Verifica que el endpoint de reservas reciba datos correctamente.
```bash
node backend/test-reserva-express.js
```

## 2. Verificación de Códigos de Pago

Para probar el flujo de "Pagar con Código", sigue estos pasos manuales rápidos (basado en `TEST_CODIGOS_PAGO.md`).

1.  **Crear Código de Prueba**:
    (Necesitas estar logueado como admin o usar Postman con el token).
    *Si tienes cURL en Windows:*
    ```bash
    curl -X POST http://localhost:3000/api/codigos-pago -H "Content-Type: application/json" -d "{\"codigo\":\"TEST-AUTO-01\",\"origen\":\"Test Origin\",\"destino\":\"Test Dest\",\"monto\":1000}"
    ```

2.  **Validar Código en Frontend**:
    *   Ve a: [http://localhost:5173/#pagar-codigo](http://localhost:5173/#pagar-codigo)
    *   Ingresa el código `TEST-AUTO-01`.
    *   Verifica que cargue los datos.

## 3. Verificación de Pasarelas (Manual)

1.  **Simular Reserva**:
    *   Ve a la home: [http://localhost:5173/](http://localhost:5173/)
    *   Llena el formulario express.
    *   Continúa al pago.

2.  **Verificar Redirección**:
    *   **Flow**: Selecciona Flow y verifica que redirige a la pasarela de sandbox/producción.

## 4. Verificación PHP (Emails y Legado)

Si el sistema usa `enviar_correo_mejorado.php`, verifica su estado:

```bash
php test_sistema.php
```

> [!NOTE]
> Para pruebas reales de pago, asegúrate de estar en modo Sandbox en las pasarelas o usar tarjetas de prueba.
