# Flujo de Generación de Código de Reserva

## Diagrama de Flujo

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENTE COMPLETA FORMULARIO                   │
│                    (Flujo Normal o Express)                          │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
                  ┌──────────────────────────────┐
                  │  Frontend envía datos        │
                  │  POST /enviar-reserva        │
                  │  POST /enviar-reserva-express│
                  └──────────────┬───────────────┘
                                 │
                                 ▼
                  ┌──────────────────────────────┐
                  │  Backend: server-db.js       │
                  │                              │
                  │  1. Recibe datos             │
                  │  2. Formatea RUT             │
                  │  3. Genera código único ───► │
                  └──────────────┬───────────────┘
                                 │
                                 ▼
          ┌──────────────────────────────────────────────┐
          │  generarCodigoReserva()                      │
          │                                              │
          │  • Obtiene fecha actual                     │
          │  • Cuenta reservas del día                  │
          │  • Genera: RES-YYYYMMDD-XXXX               │
          │  • Verifica unicidad                        │
          │  • Retorna código                           │
          └──────────────────┬───────────────────────────┘
                             │
                             ▼
          ┌──────────────────────────────────────────────┐
          │  Reserva.create()                            │
          │                                              │
          │  {                                           │
          │    codigoReserva: "RES-20251015-0001",     │
          │    nombre: "Juan Pérez",                    │
          │    email: "juan@example.com",               │
          │    ... otros campos                          │
          │  }                                           │
          └──────────────────┬───────────────────────────┘
                             │
                             ▼
          ┌──────────────────────────────────────────────┐
          │  Base de Datos MySQL                         │
          │                                              │
          │  INSERT INTO reservas (                      │
          │    codigo_reserva,                           │
          │    nombre,                                   │
          │    email,                                    │
          │    ...                                       │
          │  )                                           │
          └──────────────────┬───────────────────────────┘
                             │
                             ▼
          ┌──────────────────────────────────────────────┐
          │  Respuesta JSON al Frontend                  │
          │                                              │
          │  {                                           │
          │    success: true,                            │
          │    reservaId: 123,                           │
          │    codigoReserva: "RES-20251015-0001"       │
          │  }                                           │
          └──────────────────┬───────────────────────────┘
                             │
                             ▼
          ┌──────────────────────────────────────────────┐
          │  Frontend: App.jsx                           │
          │                                              │
          │  • Recibe respuesta                          │
          │  • Guarda código en estado                   │
          │  • Muestra diálogo de confirmación           │
          └──────────────────┬───────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────────────┐
│                    CLIENTE VE CÓDIGO DE RESERVA                    │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │  ✅ Reserva Enviada                                        │   │
│  │                                                            │   │
│  │  Tu solicitud de reserva ha sido recibida correctamente.  │   │
│  │                                                            │   │
│  │  ┌───────────────────────────────────────────────────┐    │   │
│  │  │ Código de reserva:                                │    │   │
│  │  │                                                   │    │   │
│  │  │         RES-20251015-0001                         │    │   │
│  │  │                                                   │    │   │
│  │  │ Guarda este código para futuras consultas        │    │   │
│  │  └───────────────────────────────────────────────────┘    │   │
│  │                                                            │   │
│  │  📧 Te hemos enviado un correo de confirmación            │   │
│  │  📞 Nuestro equipo se pondrá en contacto contigo          │   │
│  │                                                            │   │
│  │                    [Entendido]                             │   │
│  └────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────┘
```

## Formato del Código

```
RES - 20251015 - 0001
 │      │         │
 │      │         └── Contador secuencial (4 dígitos)
 │      │             0001, 0002, 0003...
 │      │
 │      └── Fecha de creación
 │          YYYYMMDD (año, mes, día)
 │
 └── Prefijo que identifica una reserva
```

## Ejemplo de Secuencia Diaria

| Hora    | Reserva | Código Generado      |
|---------|---------|----------------------|
| 08:15   | Juan    | RES-20251015-0001   |
| 09:30   | María   | RES-20251015-0002   |
| 10:45   | Pedro   | RES-20251015-0003   |
| 14:20   | Ana     | RES-20251015-0004   |
| ...     | ...     | ...                  |
| 19:50   | Carlos  | RES-20251015-0042   |

Al día siguiente, el contador se reinicia:

| Hora    | Reserva | Código Generado      |
|---------|---------|----------------------|
| 07:30   | Luis    | RES-20251016-0001   |
| 08:45   | Sofia   | RES-20251016-0002   |

## Puntos Clave

1. **Generación Automática**: El código se genera automáticamente al crear la reserva
2. **Unicidad Garantizada**: Se verifica en la base de datos que no exista duplicado
3. **Legible**: Formato claro y fácil de comunicar
4. **Trazable**: La fecha está incluida en el código
5. **Visible**: Se muestra al cliente inmediatamente después de crear la reserva
6. **Almacenado**: Se guarda en la base de datos con índice único para búsquedas rápidas

## Integración con Sistemas Existentes

### Correos Electónicos
Los correos de notificación pueden incluir el código de reserva para que el cliente lo tenga como referencia.

### Panel de Administración
El panel puede implementar búsqueda por código de reserva para localizar reservas rápidamente.

### Pagos
Al procesar pagos, el código de reserva puede asociarse a la transacción para facilitar la conciliación.

### Soporte al Cliente
El equipo de soporte puede solicitar el código al cliente para identificar su reserva de manera eficiente.
