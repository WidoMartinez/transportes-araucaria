# Sistema de Tarifa Dinámica - Transportes Araucanía

## 📋 Descripción General

El sistema de tarifa dinámica permite ajustar automáticamente los precios de los viajes según múltiples factores:

- **Anticipación de reserva**: Desde +25% el mismo día hasta -15% con 1 mes o más de anticipación
- **Días de alta demanda**: Viernes, sábado y domingo con recargo del 10%
- **Horarios premium**: Antes de las 9:00 AM con recargo adicional del 15%
- **Exclusiones por destino**: Posibilidad de excluir destinos específicos de ciertas reglas
- **Descuento de retorno**: Sistema preparado para aplicar 50% de descuento cuando hay vehículo disponible

## 🗄️ Modelos de Base de Datos

### 1. Vehiculo
Gestiona la flota de vehículos disponibles.

**Campos principales:**
- `placa`: Patente del vehículo (único)
- `tipo`: auto, van, minibus
- `capacidad`: Número de pasajeros
- `activo`: Si está disponible para asignación
- `enMantenimiento`: Estado de mantenimiento

### 2. Conductor
Gestiona los conductores/choferes.

**Campos principales:**
- `rut`: RUT del conductor (único)
- `nombre`: Nombre completo
- `licenciaConducir`: Número de licencia
- `tipoLicencia`: Clase de licencia (B, A1-A5)
- `fechaVencimientoLicencia`: Fecha de vencimiento
- `activo`: Si está disponible para asignación

### 3. ConfiguracionTarifaDinamica
Define las reglas de ajuste de precios.

**Tipos de configuración:**
- `anticipacion`: Ajustes basados en días de anticipación
- `dia_semana`: Ajustes por día de la semana
- `horario`: Ajustes por horario del día
- `descuento_retorno`: Descuento por viaje de retorno

**Campos principales:**
- `nombre`: Nombre descriptivo
- `tipo`: Tipo de regla
- `porcentajeAjuste`: Porcentaje a aplicar (positivo=recargo, negativo=descuento)
- `activo`: Si la regla está activa
- `prioridad`: Orden de aplicación (mayor = se aplica primero)
- `destinosExcluidos`: Array de destinos que no aplican a esta regla

## 🔧 Configuraciones Predeterminadas

El sistema inicializa automáticamente con las siguientes configuraciones:

### Por Anticipación
1. **Mismo día**: +25% (prioridad 10)
2. **1-3 días**: +10% (prioridad 9)
3. **4-13 días**: 0% - precio estándar (prioridad 8)
4. **14-20 días**: -5% (prioridad 7)
5. **21-29 días**: -10% (prioridad 6)
6. **30+ días**: -15% (prioridad 5)

### Por Día de Semana
- **Viernes, Sábado, Domingo**: +10% (prioridad 4)

### Por Horario
- **Antes de 9:00 AM**: +15% adicional (prioridad 3)

### Descuento Retorno
- **50% de descuento** cuando hay vehículo disponible en destino (prioridad 2)
- Tiempo máximo de espera: 4 horas (240 minutos)

## 🔌 API Endpoints

### Vehículos
- `GET /api/vehiculos` - Listar todos los vehículos
- `POST /api/vehiculos` - Crear nuevo vehículo
- `PUT /api/vehiculos/:id` - Actualizar vehículo
- `DELETE /api/vehiculos/:id` - Eliminar vehículo
- `POST /api/vehiculos/disponibilidad` - Verificar disponibilidad por fecha/hora

### Conductores
- `GET /api/conductores` - Listar todos los conductores
- `POST /api/conductores` - Crear nuevo conductor
- `PUT /api/conductores/:id` - Actualizar conductor
- `DELETE /api/conductores/:id` - Eliminar conductor

### Tarifa Dinámica
- `GET /api/tarifa-dinamica` - Listar todas las configuraciones
- `POST /api/tarifa-dinamica` - Crear nueva configuración
- `PUT /api/tarifa-dinamica/:id` - Actualizar configuración
- `DELETE /api/tarifa-dinamica/:id` - Eliminar configuración
- `POST /api/tarifa-dinamica/calcular` - Calcular tarifa para un viaje específico

## 💻 Componentes Frontend

### Hooks Personalizados

#### `useTarifaDinamica(precioBase, destino, fecha, hora)`
Calcula automáticamente la tarifa dinámica basada en los parámetros.

**Retorna:**
```javascript
{
  tarifaDinamica: {
    precioBase: number,
    ajusteTotal: number,      // Porcentaje total
    ajusteMonto: number,       // Monto en CLP
    precioFinal: number,       // Precio con ajuste
    diasAnticipacion: number,
    ajustesAplicados: [       // Desglose de ajustes
      {
        nombre: string,
        tipo: string,
        porcentaje: number,
        detalle: string
      }
    ]
  },
  loading: boolean,
  error: string | null
}
```

#### `useDisponibilidadVehiculos(fecha, hora, tipo)`
Verifica la disponibilidad de vehículos para una fecha/hora específica.

**Retorna:**
```javascript
{
  disponibilidad: {
    total: number,
    disponibles: number,
    ocupados: number,
    vehiculos: Array,
    hayDisponibilidad: boolean
  },
  loading: boolean,
  error: string | null
}
```

### Componentes de Administración

#### `AdminVehiculos`
Interfaz completa para gestionar la flota de vehículos:
- Listar, crear, editar y eliminar vehículos
- Marcar vehículos en mantenimiento
- Gestionar capacidad y características

#### `AdminConductores`
Interfaz para gestionar conductores:
- Listar, crear, editar y eliminar conductores
- Gestionar licencias y vencimientos
- Calificaciones de conductores

#### `AdminTarifaDinamica`
Interfaz para configurar reglas de tarifa dinámica:
- Visualización agrupada por tipo de regla
- Creación y edición de configuraciones
- Control de prioridades y exclusiones
- Activación/desactivación de reglas

## 🎨 Interfaz de Usuario

### Visualización de Ajustes
La cotización muestra claramente los ajustes aplicados:

```
📊 Tarifa Dinámica (15 días anticipación)
  Precio estándar 4-13 días: 0%
  Alta demanda fin de semana: +10%
  Horario temprano (antes 9am): +15%
  Ajuste total: $12,500
```

### Alertas de Disponibilidad
Si no hay vehículos disponibles:
```
⚠️ No hay vehículos disponibles para esta fecha/hora
```

## 🔍 Lógica de Cálculo

El sistema calcula la tarifa dinámica en el siguiente orden:

1. **Precio Base**: Precio estándar del destino según tipo de vehículo y pasajeros
2. **Ajustes por Anticipación**: Se aplica según días de anticipación
3. **Ajustes por Día**: Recargo para días de alta demanda
4. **Ajustes por Horario**: Recargo para horarios premium
5. **Descuentos Adicionales**: Descuentos online, ida y vuelta, códigos, etc.
6. **Descuento Retorno**: Si aplica, 50% en viajes de retorno

### Ejemplo de Cálculo

```javascript
Viaje: Aeropuerto → Pucón
Fecha: Viernes en 5 días
Hora: 08:00 AM
Pasajeros: 4 (Auto Privado)

Precio base: $60,000
Anticipación (4-13 días): 0% → $60,000
Día (Viernes): +10% → $66,000
Horario (antes 9am): +15% → $75,900

Precio con tarifa dinámica: $75,900
Descuento online (5%): -$3,795
Total final: $72,105
```

## ⚙️ Configuración y Personalización

### Añadir Nueva Regla de Anticipación

1. Ir a **Admin Dashboard** → **Tarifa Dinámica**
2. Click en **Añadir Regla**
3. Configurar:
   - Nombre: "Reserva con 2 meses"
   - Tipo: "Por Anticipación"
   - Días Mínimos: 60
   - Días Máximos: (vacío para sin límite)
   - Ajuste: -20 (20% de descuento)
   - Prioridad: 4
   - Activo: ✓

### Excluir Destino de una Regla

1. Editar la configuración existente
2. En **Destinos Excluidos**, marcar los destinos
3. Guardar cambios

### Modificar Horarios de Alta Demanda

1. Localizar "Horario temprano (antes 9am)"
2. Editar la configuración
3. Cambiar **Hora Inicio** y **Hora Fin**
4. Ajustar el **Porcentaje de Ajuste**
5. Guardar

## 🧪 Pruebas

### Probar Tarifa Dinámica

1. **Mismo día (+25%)**
   - Seleccionar fecha de hoy
   - Verificar que se aplica recargo del 25%

2. **Un mes anticipado (-15%)**
   - Seleccionar fecha dentro de 30+ días
   - Verificar descuento del 15%

3. **Fin de semana (+10%)**
   - Seleccionar viernes, sábado o domingo
   - Verificar recargo del 10%

4. **Horario temprano (+15%)**
   - Seleccionar hora antes de 09:00
   - Verificar recargo adicional del 15%

5. **Combinación de reglas**
   - Mismo día + Sábado + 08:00 AM
   - Debería aplicar: +25% + 10% + 15% = +50%

### Probar Disponibilidad

1. Registrar varios vehículos en **AdminVehiculos**
2. Crear reservas para una fecha específica
3. Intentar cotizar cuando todos los vehículos estén ocupados
4. Verificar mensaje de no disponibilidad

## 🚀 Despliegue

### Backend (Render.com)

El backend se despliega automáticamente en Render.com. Asegurar:

1. Variables de entorno configuradas:
   - `DATABASE_URL`
   - `MERCADOPAGO_ACCESS_TOKEN`
   - `FLOW_SECRET_KEY`

2. La base de datos se inicializa automáticamente con:
   - Tablas de modelos
   - Configuraciones predeterminadas de tarifa dinámica

### Frontend (Hostinger)

El frontend se construye y despliega en Hostinger:

```bash
npm run build
# Subir contenido de dist/ a Hostinger
```

## 📝 Notas Técnicas

### Caché de Precios
- El endpoint `/pricing` incluye las configuraciones de tarifa dinámica
- Caché TTL: 60 segundos (configurable)
- Se invalida automáticamente al modificar configuraciones

### Relaciones de Base de Datos
- `Reserva` → `Vehiculo` (belongsTo)
- `Reserva` → `Conductor` (belongsTo)
- Permite tracking completo de asignaciones

### Campos Adicionales en Reserva
- `vehiculoId`: ID del vehículo asignado
- `conductorId`: ID del conductor asignado
- `ajusteTarifaDinamica`: Monto del ajuste aplicado
- `descuentoRetorno`: Descuento por viaje de retorno

## 🔮 Funcionalidades Futuras

1. **Descuento de Retorno Automático**
   - Detectar automáticamente vehículos disponibles en destino
   - Aplicar 50% de descuento en viajes de retorno
   - Optimizar rutas para reducir viajes vacíos

2. **Predicción de Demanda**
   - Análisis de patrones históricos
   - Ajustes dinámicos basados en demanda real
   - Temporadas altas/bajas

3. **Asignación Automática**
   - Asignar vehículo y conductor automáticamente
   - Optimizar por ubicación y disponibilidad
   - Notificaciones automáticas

4. **Dashboard de Analytics**
   - Visualización de ajustes aplicados
   - Impacto en ingresos
   - Análisis de ocupación de flota

## 📞 Soporte

Para soporte o consultas sobre el sistema de tarifa dinámica:
- Email: soporte@transportesaraucaria.cl
- Documentación adicional: `/backend/README.md`

---

**Versión**: 1.0.0  
**Última actualización**: Octubre 2025
