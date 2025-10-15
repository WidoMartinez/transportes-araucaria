# Ejemplo de Uso del Código de Reserva

## Escenario: Cliente hace una reserva

### 1. Cliente completa el formulario

**Datos ingresados:**
```
Nombre: Juan Pérez
Email: juan.perez@email.com
Teléfono: +56 9 8765 4321
Origen: Santiago
Destino: Temuco
Fecha: 2025-10-20
Pasajeros: 2
```

### 2. Cliente hace clic en "Reservar" o "Pagar"

El sistema procesa la solicitud...

### 3. Backend genera el código automáticamente

```javascript
// Fecha actual: 2025-10-15
// Reservas creadas hoy: 41

// Generación del código:
const fechaStr = "20251015"      // Año + Mes + Día
const contador = "0042"          // Siguiente número (42)
const codigo = "RES-20251015-0042"
```

### 4. Reserva guardada en base de datos

```sql
INSERT INTO reservas (
    id,
    codigo_reserva,
    nombre,
    email,
    telefono,
    origen,
    destino,
    fecha,
    pasajeros,
    estado,
    ...
) VALUES (
    789,
    'RES-20251015-0042',
    'Juan Pérez',
    'juan.perez@email.com',
    '+56987654321',
    'Santiago',
    'Temuco',
    '2025-10-20',
    2,
    'pendiente',
    ...
);
```

### 5. Cliente ve el código en pantalla

```
┌──────────────────────────────────────────────────────────────┐
│  ✅ Reserva Enviada                                          │
│                                                              │
│  Tu solicitud de reserva ha sido recibida correctamente.    │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Código de reserva:                                     │ │
│  │                                                        │ │
│  │           RES-20251015-0042                           │ │
│  │                                                        │ │
│  │ Guarda este código para futuras consultas sobre       │ │
│  │ tu reserva.                                            │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  📧 Te hemos enviado un correo de confirmación con los      │
│     detalles de tu reserva.                                 │
│                                                              │
│  📞 Nuestro equipo se pondrá en contacto contigo pronto     │
│     para confirmar todos los detalles.                      │
│                                                              │
│                      [ Entendido ]                          │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 6. Cliente recibe correo electrónico

```
De: Transportes Araucaria <info@transportesaraucaria.cl>
Para: juan.perez@email.com
Asunto: Confirmación de Reserva - RES-20251015-0042

Hola Juan Pérez,

¡Gracias por tu reserva!

CÓDIGO DE RESERVA: RES-20251015-0042

Detalles de tu viaje:
- Origen: Santiago
- Destino: Temuco
- Fecha: 20 de octubre de 2025
- Pasajeros: 2

Guarda este código para futuras consultas.

Saludos,
Equipo Transportes Araucaria
```

## Casos de Uso Posteriores

### Caso 1: Cliente llama para consultar su reserva

**Cliente:** "Hola, quiero consultar sobre mi reserva"

**Operador:** "¡Por supuesto! ¿Me puede proporcionar su código de reserva?"

**Cliente:** "Sí, es RES-20251015-0042"

**Operador:** _[Busca en el sistema]_ "Perfecto, aquí está Juan. Veo que su viaje es el 20 de octubre de Santiago a Temuco para 2 pasajeros. ¿En qué puedo ayudarle?"

### Caso 2: Cliente quiere modificar su reserva

**Cliente envía WhatsApp:** "Necesito cambiar la fecha de mi reserva RES-20251015-0042"

**Operador:** _[Busca en el sistema]_ "Encontré su reserva Juan. ¿A qué fecha desea cambiarla?"

### Caso 3: Seguimiento de pago

El sistema asocia el código de reserva con el pago:

```javascript
{
    reservaId: 789,
    codigoReserva: "RES-20251015-0042",
    pagoId: "MP-1234567890",
    monto: 60000,
    estado: "pagado"
}
```

## Ventajas para el Cliente

1. ✅ **Fácil de recordar**: Formato claro y estructurado
2. ✅ **Fácil de comunicar**: Puede dictarlo por teléfono sin confusiones
3. ✅ **Único**: No hay dos reservas con el mismo código
4. ✅ **Informativo**: Incluye la fecha de creación
5. ✅ **Profesional**: Da confianza y seriedad al servicio

## Ventajas para el Equipo

1. ✅ **Búsqueda rápida**: Índice único en la base de datos
2. ✅ **Identificación clara**: No hay confusión entre reservas
3. ✅ **Trazabilidad**: La fecha está en el código
4. ✅ **Organización**: Conteo diario automático
5. ✅ **Reportes**: Fácil filtrar por fecha usando el código

## Estructura de los Datos

### En la Base de Datos

```
reservas
├── id: 789 (interno)
├── codigo_reserva: "RES-20251015-0042" (visible al cliente)
├── nombre: "Juan Pérez"
├── email: "juan.perez@email.com"
├── ... (otros campos)
└── created_at: "2025-10-15 14:30:00"
```

### En el Frontend

```javascript
// Estado de la aplicación
{
    reservationId: 789,
    codigoReserva: "RES-20251015-0042",
    formData: {
        nombre: "Juan Pérez",
        email: "juan.perez@email.com",
        // ... otros datos
    }
}
```

## Comparación: Antes vs Después

### Antes (Solo ID numérico)

❌ **Cliente:** "Quiero consultar mi reserva"
❌ **Operador:** "¿Puede darme su ID?"
❌ **Cliente:** "No sé... ¿789?"
❌ **Operador:** "¿Y su nombre completo?"
❌ _[Proceso lento y poco profesional]_

### Después (Con código de reserva)

✅ **Cliente:** "Quiero consultar mi reserva RES-20251015-0042"
✅ **Operador:** "Perfecto Juan, aquí está su reserva"
✅ _[Búsqueda instantánea y profesional]_

## Formato de Ejemplo para Diferentes Días

```
15 octubre 2025:
RES-20251015-0001  → Primera reserva del día
RES-20251015-0002  → Segunda reserva
...
RES-20251015-0042  → Reserva número 42

16 octubre 2025:
RES-20251016-0001  → Primera reserva del nuevo día
RES-20251016-0002  → Segunda reserva
...

1 noviembre 2025:
RES-20251101-0001  → Primera reserva del mes
```

## Integración con Otros Sistemas

### Sistema de Pagos
```javascript
// Al generar pago
{
    description: "Reserva RES-20251015-0042 - Santiago a Temuco",
    amount: 60000,
    email: "juan.perez@email.com"
}
```

### Sistema de Notificaciones
```javascript
// Notificación SMS
"Su reserva RES-20251015-0042 ha sido confirmada para el 20/10/2025"
```

### Panel Administrativo
```javascript
// Búsqueda en el panel
GET /api/reservas?codigo=RES-20251015-0042
```

## Conclusión

El sistema de códigos de reserva mejora significativamente la experiencia tanto para clientes como para el equipo administrativo, proporcionando una forma clara, profesional y eficiente de identificar y gestionar las reservas.
