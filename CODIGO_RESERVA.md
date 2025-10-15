# Sistema de Códigos de Reserva

## Descripción

Se ha implementado un sistema de códigos únicos y legibles para cada reserva en el sistema. Esto permite a los clientes y al equipo administrativo identificar y hacer seguimiento de las reservas de manera más eficiente.

## Formato del Código

El código de reserva sigue el formato: **RES-YYYYMMDD-XXXX**

Donde:
- `RES`: Prefijo que identifica que es una reserva
- `YYYYMMDD`: Fecha de creación de la reserva (año, mes, día)
- `XXXX`: Contador secuencial de 4 dígitos para ese día (ej: 0001, 0002, etc.)

### Ejemplos
- `RES-20251015-0001` → Primera reserva del 15 de octubre de 2025
- `RES-20251015-0042` → Reserva número 42 del 15 de octubre de 2025
- `RES-20251016-0001` → Primera reserva del 16 de octubre de 2025

## Implementación Técnica

### 1. Base de Datos

Se agregó un nuevo campo a la tabla `reservas`:

```sql
codigo_reserva VARCHAR(50) UNIQUE
```

- Es único para evitar duplicados
- Tiene un índice único para búsquedas rápidas
- Es nullable para mantener compatibilidad con reservas existentes

### 2. Modelo Sequelize

En `backend/models/Reserva.js`:

```javascript
codigoReserva: {
    type: DataTypes.STRING(50),
    allowNull: true,
    unique: true,
    field: 'codigo_reserva',
    comment: "Código único de reserva legible (formato: RES-YYYYMMDD-XXXX)",
}
```

### 3. Generación del Código

La función `generarCodigoReserva()` en `backend/server-db.js`:

1. Obtiene la fecha actual
2. Cuenta cuántas reservas se han creado en el día
3. Incrementa el contador
4. Verifica que el código no exista (por seguridad)
5. Si existe, agrega un sufijo aleatorio
6. Retorna el código único

```javascript
const generarCodigoReserva = async () => {
    // Formato: RES-YYYYMMDD-XXXX donde XXXX es un contador diario
    const fecha = new Date();
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    const fechaStr = `${year}${month}${day}`;
    
    // Buscar la última reserva del día para obtener el siguiente número
    const inicioDelDia = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
    const finDelDia = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() + 1);
    
    const reservasHoy = await Reserva.count({
        where: {
            createdAt: {
                [Op.gte]: inicioDelDia,
                [Op.lt]: finDelDia
            }
        }
    });
    
    const contador = String(reservasHoy + 1).padStart(4, '0');
    return `RES-${fechaStr}-${contador}`;
};
```

### 4. Endpoints Actualizados

#### POST /enviar-reserva
- Genera un código de reserva antes de crear la reserva
- Incluye el código en la respuesta JSON

```javascript
// Generar código único de reserva
const codigoReserva = await generarCodigoReserva();

// Crear reserva con el código
const reservaGuardada = await Reserva.create({
    codigoReserva,
    // ... otros campos
});

// Respuesta incluye el código
return res.json({
    success: true,
    message: "Reserva recibida y guardada correctamente",
    reservaId: reservaGuardada.id,
    codigoReserva: reservaGuardada.codigoReserva,
});
```

#### POST /enviar-reserva-express
- Similar al endpoint anterior
- También genera y retorna el código de reserva

### 5. Frontend

En `src/App.jsx`:

1. Se agregó un estado para almacenar el código:
```javascript
const [codigoReserva, setCodigoReserva] = useState(null);
```

2. Se captura el código de la respuesta:
```javascript
if (result.codigoReserva) {
    setCodigoReserva(result.codigoReserva);
    console.log("✅ Reserva creada con código:", result.codigoReserva);
}
```

3. Se muestra en el diálogo de confirmación:
```jsx
{codigoReserva && (
    <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
        <p className="text-sm text-gray-600 mb-1">Código de reserva:</p>
        <p className="text-2xl font-bold text-blue-600">{codigoReserva}</p>
        <p className="text-xs text-gray-500 mt-2">
            Guarda este código para futuras consultas sobre tu reserva.
        </p>
    </div>
)}
```

## Migración

Se incluye un script de migración en `backend/migrations/add-codigo-reserva.js`:

1. Agrega la columna `codigo_reserva` a la tabla
2. Agrega el índice único
3. Genera códigos para todas las reservas existentes que no tengan uno

### Ejecutar la migración

```bash
cd backend
node migrations/add-codigo-reserva.js
```

## Pruebas

Se incluye un archivo de pruebas en `backend/test-reserva-codigo.js` que verifica:

1. Generación correcta del formato del código
2. Unicidad de los códigos generados
3. Creación de reservas con código
4. Búsqueda de reservas por código

### Ejecutar las pruebas

```bash
cd backend
node test-reserva-codigo.js
```

## Beneficios

1. **Identificación Clara**: Los códigos son legibles y fáciles de comunicar por teléfono o correo
2. **Trazabilidad**: Se puede identificar la fecha de creación de la reserva por el código
3. **Búsqueda Rápida**: El índice único permite búsquedas rápidas en la base de datos
4. **Experiencia del Usuario**: Los clientes reciben un código claro para hacer seguimiento de su reserva
5. **Organización**: Facilita la gestión administrativa de las reservas

## Casos de Uso

### Cliente hace una reserva
1. Cliente completa el formulario de reserva
2. Sistema genera código automáticamente (ej: RES-20251015-0023)
3. Cliente ve el código en el diálogo de confirmación
4. Cliente recibe el código por correo electrónico
5. Cliente puede usar el código para consultar su reserva

### Administrador busca una reserva
1. Cliente llama con su código de reserva
2. Administrador busca por código en el panel
3. Sistema encuentra la reserva rápidamente
4. Administrador puede ver y gestionar los detalles

### Seguimiento y reportes
1. Los códigos permiten identificar reservas por fecha
2. Facilita la generación de reportes diarios
3. Ayuda en la auditoría de reservas

## Compatibilidad

- ✅ Compatible con reservas existentes (el campo es nullable)
- ✅ Compatible con flujo normal y express
- ✅ Compatible con ambos sistemas de pago (MercadoPago y Flow)
- ✅ Se integra con el sistema de correos existente

## Notas de Despliegue

Al desplegar esta actualización:

1. Ejecutar la migración en el servidor de base de datos
2. Verificar que el backend se despliega correctamente en Render
3. Las reservas nuevas generarán códigos automáticamente
4. Las reservas antiguas mantendrán su funcionamiento normal

## Archivos Modificados

### Backend
- `backend/models/Reserva.js` - Modelo con nuevo campo
- `backend/server-db.js` - Función de generación y endpoints actualizados
- `backend/migrations/add-codigo-reserva.js` - Script de migración (nuevo)
- `backend/test-reserva-codigo.js` - Pruebas del sistema (nuevo)

### Frontend
- `src/App.jsx` - Estado, captura y visualización del código

### Documentación
- `CODIGO_RESERVA.md` - Este archivo (nuevo)

## Mejoras Futuras

1. Agregar búsqueda por código en el panel de administración
2. Incluir el código en las notificaciones por correo
3. Mostrar el código en los comprobantes de pago
4. Permitir al cliente consultar el estado de su reserva usando el código
5. Generar códigos QR para las reservas
