# Integración de Correos Transaccionales (Backend Node.js + PHP Legacy)

## Contexto
El sistema utiliza una arquitectura híbrida para el envío de correos electrónicos. Aunque el backend principal está construido en Node.js (Express), el envío final de los correos transaccionales se delega a scripts PHP heredados.

**Razón:** Mantener el diseño, plantillas HTML y lógica de presentación compleja que ya estaba implementada y probada en los archivos PHP originales, alojados típicamente en el mismo servidor (Hostinger).

## Flujo de Envío
1. **Frontend**: Solicita una acción (ej: crear reserva, asignar conductor).
2. **Backend Node.js**: Procesa la lógica de negocio, guarda en base de datos MySQL.
3. **Backend Node.js**: Realiza una petición HTTP POST interna a los scripts PHP locales (o remotos vía URL).
4. **Script PHP**: Recibe el payload JSON, renderiza la plantilla HTML y envía el correo usando `PHPMailer`.

## Scripts PHP Clave

### 1. `enviar_asignacion_reserva.php`
Encargado de notificar al cliente cuando se le asigna un vehículo y conductor.
- **Uso desde Node**: Endpoint `PUT /api/reservas/:id/asignar`
- **Payload Esperado**:
  ```json
  {
    "email": "cliente@email.com",
    "nombre": "Nombre Cliente",
    "codigoReserva": "AR-2025...",
    "vehiculo": "SEDAN (patente XXXX)",
    "vehiculoTipo": "SEDAN",
    "vehiculoPatenteLast4": "XXXX",
    "origen": "...",
    "destino": "...",
    "fecha": "YYYY-MM-DD",
    "hora": "HH:MM",
    "pasajeros": 1,
    "conductorNombre": "Nombre Conductor",
    "estadoPago": "aprobado|pagado|parcial" 
  }
  ```
- **Importante**: El script PHP valida que `estadoPago` sea aprobado/pagado/parcial. Si está pendiente, silencia el envío.

### 2. `enviar_correo_mejorado.php` (Legacy / General)
Maneja confirmaciones de reserva iniciales, correos de administrador y ofertas de descuento.
- **Uso desde Node**: Creación de reservas (`POST /api/reservas`).
- **Lógica Especial**: Si el estado es "pendiente", puede enviar una oferta de descuento en lugar de la confirmación estándar.

### 3. `enviar_notificacion_conductor.php` (Nuevo)
Notifica al conductor cuando se le asigna un servicio.
- **Uso desde Node**: Endpoint `PUT /api/reservas/:id/asignar`
- **Payload Esperado**:
  ```json
  {
    "conductorEmail": "conductor@email.com",
    "conductorNombre": "Nombre Conductor",
    "codigoReserva": "AR-...",
    "pasajeroNombre": "...",
    "pasajeroTelefono": "...",
    "origen": "...",
    "destino": "...",
    "direccionRecogida": "...",
    "fecha": "YYYY-MM-DD",
    "hora": "HH:MM",
    "pasajeros": 1,
    "vehiculo": "SEDAN (patente XXXX)",
    "observaciones": "...",
    "numeroVuelo": "...",
    "hotel": "..."
  }
  ```
- **Características**:
  - Plantilla HTML profesional con todos los detalles del servicio
  - Genera y adjunta archivo `.ics` para agregar al calendario
  - Compatible con Google Calendar, Outlook, Apple Calendar, etc.
  - Solo se envía si el conductor tiene email registrado

## Configuración en Backend (`server-db.js`)
El backend utiliza variables de entorno para localizar los scripts, con fallbacks a URLs de producción:

```javascript
// Ejemplo para asignación
const phpUrl = process.env.PHP_ASSIGNMENT_EMAIL_URL || "https://www.transportesaraucaria.cl/enviar_asignacion_reserva.php";
```

## Mantenimiento
Para modificar el diseño de los correos:
- **NO** editar `server-db.js` (solo maneja datos).
- **EDITAR** el archivo `.php` correspondiente (`enviar_asignacion_reserva.php`).

Esta separación permite cambiar el diseño visual sin tocar la lógica del servidor, y viceversa.
