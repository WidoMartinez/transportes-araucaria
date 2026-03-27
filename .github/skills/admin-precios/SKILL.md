---
name: admin-precios
description: "Skill especializado en el panel de administración de precios de Transportes Araucanía. Usar cuando: se necesite modificar tarifas por destino y tipo de vehículo, configurar descuentos (online, ida y vuelta, personalizados, promociones por día/horario, códigos de descuento), calcular precios con todos los descuentos aplicados, o generar listas de precios personalizadas para exportar en formato .xlsx."
---

# Skill: Admin de Precios — Transportes Araucanía

## Propósito

Guía completa para trabajar con el sistema de precios y descuentos del panel administrativo. Cubre el flujo de cálculo, los modelos de datos, los endpoints del backend y la generación de listas de precios exportables en `.xlsx`.

---

## Arquitectura del Sistema de Precios

```
Frontend (AdminPricing.jsx / App.jsx)
      ↕ GET/PUT /pricing
Backend (server-db.js)
      ↕ Sequelize ORM
BD (PostgreSQL en Render.com)
  Tablas: Destino, Promocion, DescuentoGlobal, CodigoDescuento, Configuracion
```

---

## Paso 1 — Mapa de Archivos Clave

| Archivo | Rol |
|---------|-----|
| `src/components/AdminPricing.jsx` | Panel UI para editar tarifas, descuentos y promociones |
| `src/App.jsx` (líneas 760-845, 1300-1420) | Lógica de cálculo de cotización y descuentos en el frontend |
| `src/data/destinos.jsx` | Datos base / fallback de destinos con precios por defecto |
| `backend/server-db.js` (líneas 1033-1490) | Endpoints `GET /pricing` y `PUT /pricing`, caché, constructores |
| `backend/models/Destino.js` | Modelo Sequelize — tarifas por vehículo, porcentajes adicionales |
| `backend/models/DescuentoGlobal.js` | Modelo — descuentos fijos y personalizados |
| `backend/models/Promocion.js` | Modelo — promociones por día/horario/destino |
| `backend/models/CodigoDescuento.js` | Modelo — códigos de descuento con restricciones |
| `backend/routes/auth.js` | Middleware de autenticación requerido en endpoints admin |

---

## Paso 2 — Estructura de Datos de Precios

### 2.1 Destino (tarifa por vehículo)

```javascript
{
  nombre: "Temuco",
  activo: true,
  orden: 0,
  descripcion: "Centro comercial y administrativo de La Araucanía.",
  tiempo: "45 min",
  maxPasajeros: 7,
  minHorasAnticipacion: 5,
  duracionIdaMinutos: 45,
  duracionVueltaMinutos: 45,
  precios: {
    auto: {
      base: 20000,              // Precio base auto (1-4 pasajeros)
      porcentajeAdicional: 0.1  // +10% del base por cada pasajero >4
    },
    van: {
      base: 45000,              // Precio base van (5-7 pasajeros)
      porcentajeAdicional: 0.1  // +10% del base van por cada pasajero >5
    }
  }
}
```

> **Nota**: Si `precioBaseVan` existe en la BD, se usa directamente. Si no, el fallback es `precioIda * 1.8`.

### 2.2 Descuentos Globales

```javascript
{
  descuentoOnline: {
    valor: 5,    // % de descuento (número entero)
    activo: true,
    nombre: "Descuento por Reserva Online"
  },
  descuentoRoundTrip: {
    valor: 10,   // % de descuento
    activo: true,
    nombre: "Descuento por Ida y Vuelta"
  },
  descuentosPersonalizados: [
    { nombre: "Temporada", valor: 10, activo: true, descripcion: "..." }
  ]
}
```

### 2.3 Promociones por Día/Horario (`dayPromotions`)

```javascript
{
  id: "promo-1234-abc",
  nombre: "Oferta Fin de Semana",
  destino: "Pucón",    // "" = aplica a todos
  descripcion: "...",
  aplicaPorDias: true,
  dias: ["Sábado", "Domingo"],
  aplicaPorHorario: false,
  horaInicio: "",
  horaFin: "",
  descuentoPorcentaje: 15,
  aplicaTipoViaje: { ida: false, vuelta: false, ambos: true },
  activo: true
}
```

### 2.4 Códigos de Descuento

```javascript
{
  codigo: "VERANO2026",
  porcentaje: 20,
  activo: true,
  usoMaximo: 100,
  usosActuales: 0,
  destinosAplicables: ["Pucón", "Villarrica"],  // [] = todos
  fechaExpiracion: "2026-03-31",
  usuariosQueUsaron: []
}
```

---

## Paso 3 — Flujo Completo de Cálculo de Precios

### 3.1 Fórmula General

```
precioBase = precio auto/van base × pasajeros adicionales
precioIda  = calcularCotizacion(origen, destino, pasajeros, upgradeVan)

— Descuentos sobre precio de CADA TRAMO —
descuentoOnline           = precioIda × (descuentoOnline.valor / 100)
descuentoPromocion        = precioIda × (porcentajePromoDiaria / 100)
descuentosPersonalizados  = precioIda × (sumaDescuentosPersonalizados / 100)

— Descuento sobre TOTAL IDA + VUELTA —
descuentoRoundTrip        = (precioIda + precioVuelta) × (descuentoRoundTrip.valor / 100)

— Descuento por CÓDIGO —
descuentoCodigo           = precioBase × (codigoDescuento.porcentaje / 100)

— SUMA TOTAL DESCUENTOS (límite: 75% del precioBase) —
descuentoTotal = MIN(
  descuentoOnline + descuentoPromocion + descuentosPersonalizados +
  descuentoRoundTrip + descuentoCodigo,
  precioBase × 0.75
)

— PRECIO FINAL —
totalConDescuento = MAX(precioBase - descuentoTotal, 0) + costoSilla
```

### 3.2 Cálculo de Precio Base por Vehículo

```javascript
// Auto (1-4 pasajeros)
if (pasajeros <= 4) {
  precioFinal = precios.auto.base;
}

// Auto upgrade van (5-7 pasajeros con porcentaje adicional)
if (pasajeros >= 5 && pasajeros <= 7) {
  pasajerosAdicionales = pasajeros - 4;
  costoAdicional = precios.auto.base * precios.auto.porcentajeAdicional;
  precioFinal = precios.auto.base + pasajerosAdicionales * costoAdicional;
}
```

### 3.3 Tarifa Dinámica (`/api/tarifa-dinamica/calcular`)

Se llama al backend con `{ precioBase, destino, fecha, hora }` y el backend aplica ajustes por días de anticipación u otras reglas configuradas. El resultado reemplaza al `precioBase` antes de aplicar descuentos.

---

## Paso 4 — Endpoints del Backend

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/pricing` | No | Retorna toda la configuración de precios (con caché 60s) |
| `PUT` | `/pricing` | Sí (JWT) | Guarda configuración de precios, invalida caché |
| `GET` | `/api/descuentos-codigos` | Sí | Lista todos los códigos de descuento |
| `POST` | `/api/descuentos-codigos` | Sí | Crea nuevo código de descuento |
| `PUT` | `/api/descuentos-codigos/:id` | Sí | Actualiza código de descuento |
| `DELETE` | `/api/descuentos-codigos/:id` | Sí | Elimina código de descuento |
| `POST` | `/api/descuentos-codigos/verificar` | No | Verifica validez de un código |
| `POST` | `/api/tarifa-dinamica/calcular` | No | Calcula tarifa dinámica con ajustes |

### Caché de precios

```javascript
// TTL configurado en variable de entorno
const PRICING_CACHE_TTL_MS = Number(process.env.PRICING_CACHE_TTL_MS || 60000);

// Invalidar manualmente si los datos fueron modificados
invalidatePricingCache();
```

> **Importante**: `PUT /pricing` siempre invalida el caché y devuelve el payload actualizado después de guardar.

---

## Paso 5 — Componente AdminPricing (Frontend)

### 5.1 Funciones principales

| Función | Descripción |
|---------|-------------|
| `fetchPricing()` | Carga configuración desde el backend |
| `handleDestinoChange(nombre, vehiculo, field, value)` | Edita tarifa de un destino/vehículo |
| `handleGeneralDestinoChange(nombre, field, value)` | Edita campo general de un destino |
| `handleAddPromotion()` | Agrega nueva promoción por día/horario |
| `handlePromotionFieldChange(id, field, value)` | Edita campo de una promoción |
| `handleTogglePromotionDay(id, day)` | Activa/desactiva día en una promoción |
| `handleToggleTipoViaje(id, tipoViaje)` | Alterna ida/vuelta/ambos en promoción |
| `handleDescuentoFijoChange(tipo, field, value)` | Edita descuento online o ida y vuelta |
| `addDescuentoPersonalizado()` | Agrega descuento personalizado |
| `handleDescuentoPersonalizadoChange(id, field, value)` | Edita descuento personalizado |
| `handleSave()` | Guarda toda la configuración vía PUT /pricing |
| `fetchInactiveDestinos()` | Carga destinos inactivos para reactivar |

### 5.2 Validaciones críticas antes de guardar

- `descuentoPorcentaje` debe estar entre 0 y 100.
- `precioBase` no puede ser negativo.
- Si `aplicaPorDias: true`, el array `dias` no puede estar vacío.
- Si `aplicaPorHorario: true`, `horaInicio` y `horaFin` son obligatorias.
- Siempre debe existir al menos una opción en `aplicaTipoViaje`.

---

## Paso 6 — Modelos de BD relevantes

### Destino

```javascript
// Campos de precios en Destino:
precioIda              // base del precio (usado como base auto)
precioVuelta
precioIdaVuelta
precioBaseVan          // precio separado para van
porcentajeAdicionalAuto  // default 0.1
porcentajeAdicionalVan   // default 0.05
maxPasajeros           // default 4
minHorasAnticipacion   // default 5
duracionIdaMinutos
duracionVueltaMinutos
```

### DescuentoGlobal

```javascript
tipo: ENUM('descuentoOnline', 'descuentoRoundTrip', 'descuentoPersonalizado')
nombre: STRING
valor: FLOAT          // número de porcentaje (ej: 5 = 5%)
activo: BOOLEAN
descripcion: TEXT
```

### Promocion

```javascript
nombre: STRING
dia: STRING            // día base (diaIndividual en metadata JSON)
tipo: STRING           // 'porcentaje'
valor: FLOAT           // porcentaje numérico
activo: BOOLEAN
descripcion: TEXT      // JSON serializado con metadata completa
// La metadata JSON incluye: sourceId, porcentaje, dias[], aplicaPorDias,
// aplicaPorHorario, horaInicio, horaFin, destino, aplicaTipoViaje {}
```

### CodigoDescuento

```javascript
codigo: STRING         // código que ingresa el usuario
porcentaje: FLOAT
activo: BOOLEAN
usoMaximo: INTEGER
usosActuales: INTEGER
destinosAplicables: JSON  // array de strings o []
fechaExpiracion: DATE
usuariosQueUsaron: JSON   // array de emails
fechaCreacion: DATE
```

---

## Paso 7 — Generación de Lista de Precios (.xlsx)

### 7.1 Librería recomendada

Usar **`xlsx`** (SheetJS — ya disponible en muchos proyectos React) o **`exceljs`** para mayor control de estilos.

```bash
# Instalar en el frontend
pnpm add xlsx
# o con más opciones de formato
pnpm add exceljs file-saver
```

### 7.2 Estructura del archivo .xlsx exportado

El archivo debe tener **tres hojas**:

#### Hoja 1: "Tarifas por Destino"

| Destino | Tiempo | Auto (1-4 pax) | Van (5-7 pax) | % Adicional Auto | % Adicional Van | Max Pasajeros | Activo |
|---------|--------|----------------|---------------|------------------|-----------------|---------------|--------|
| Temuco  | 45 min | $20.000        | $45.000       | 10%              | 10%             | 7             | Sí     |
| Pucón   | 1h 30min | $60.000      | $250.000      | 5%               | 5%              | 7             | Sí     |

#### Hoja 2: "Descuentos Vigentes"

| Tipo de Descuento | Nombre | Valor (%) | Activo | Aplica a | Días | Horario |
|-------------------|--------|-----------|--------|----------|------|---------|
| Online | Descuento por Reserva Online | 5% | Sí | Todos | Todos | - |
| Ida y Vuelta | Descuento por Ida y Vuelta | 10% | Sí | Todos | Todos | - |
| Personalizado | Temporada | 10% | Sí | Todos | Todos | - |
| Promoción Día | Oferta Fin de Semana | 15% | Sí | Pucón | Sáb, Dom | - |

#### Hoja 3: "Ejemplo de Precios Finales"

Matriz de precios calculados para combinaciones comunes:

| Destino | Pax | Vehículo | Solo Ida | Con Dto. Online | Ida y Vuelta | Ida y Vuelta con Dtos. |
|---------|-----|----------|----------|-----------------|--------------|------------------------|
| Temuco  | 1   | Auto     | $20.000  | $19.000         | $40.000      | $34.000                |
| Temuco  | 5   | Van      | $49.500  | $47.025         | $99.000      | $83.925                |

### 7.3 Implementación del botón de exportación en AdminPricing.jsx

```jsx
// Importar al inicio del componente
import * as XLSX from 'xlsx';

// Función de exportación
const exportarListaPrecios = () => {
  const wb = XLSX.utils.book_new();

  // --- Hoja 1: Tarifas por Destino ---
  const hojaTarifas = pricing.destinos.map((dest) => ({
    'Destino': dest.nombre,
    'Tiempo de Viaje': dest.tiempo || '-',
    'Precio Auto (base)': dest.precios?.auto?.base || 0,
    'Precio Van (base)': dest.precios?.van?.base || 0,
    '% Adicional Auto': `${(dest.precios?.auto?.porcentajeAdicional || 0.1) * 100}%`,
    '% Adicional Van': `${(dest.precios?.van?.porcentajeAdicional || 0.05) * 100}%`,
    'Max Pasajeros': dest.maxPasajeros || 4,
    'Horas Anticipación Mín.': dest.minHorasAnticipacion || 5,
    'Activo': dest.activo ? 'Sí' : 'No',
  }));
  const wsTarifas = XLSX.utils.json_to_sheet(hojaTarifas);
  XLSX.utils.book_append_sheet(wb, wsTarifas, 'Tarifas por Destino');

  // --- Hoja 2: Descuentos Vigentes ---
  const hojaDescuentos = [];

  // Descuentos fijos
  hojaDescuentos.push({
    'Tipo': 'Online',
    'Nombre': pricing.descuentosGlobales.descuentoOnline.nombre || 'Descuento Online',
    'Valor (%)': pricing.descuentosGlobales.descuentoOnline.valor,
    'Activo': pricing.descuentosGlobales.descuentoOnline.activo ? 'Sí' : 'No',
    'Aplica a Destino': 'Todos',
    'Días': 'Todos',
    'Horario': '-',
  });
  hojaDescuentos.push({
    'Tipo': 'Ida y Vuelta',
    'Nombre': pricing.descuentosGlobales.descuentoRoundTrip.nombre || 'Ida y Vuelta',
    'Valor (%)': pricing.descuentosGlobales.descuentoRoundTrip.valor,
    'Activo': pricing.descuentosGlobales.descuentoRoundTrip.activo ? 'Sí' : 'No',
    'Aplica a Destino': 'Todos',
    'Días': 'Todos',
    'Horario': '-',
  });

  // Descuentos personalizados
  (pricing.descuentosGlobales.descuentosPersonalizados || []).forEach((desc) => {
    hojaDescuentos.push({
      'Tipo': 'Personalizado',
      'Nombre': desc.nombre,
      'Valor (%)': desc.valor,
      'Activo': desc.activo ? 'Sí' : 'No',
      'Aplica a Destino': 'Todos',
      'Días': 'Todos',
      'Horario': '-',
    });
  });

  // Promociones por día/horario
  (pricing.dayPromotions || []).forEach((promo) => {
    hojaDescuentos.push({
      'Tipo': 'Promoción Día/Horario',
      'Nombre': promo.nombre || '-',
      'Valor (%)': promo.descuentoPorcentaje,
      'Activo': promo.activo ? 'Sí' : 'No',
      'Aplica a Destino': promo.destino || 'Todos',
      'Días': promo.aplicaPorDias ? promo.dias.join(', ') : 'Todos',
      'Horario': promo.aplicaPorHorario
        ? `${promo.horaInicio} - ${promo.horaFin}`
        : 'Todo el día',
    });
  });

  const wsDescuentos = XLSX.utils.json_to_sheet(hojaDescuentos);
  XLSX.utils.book_append_sheet(wb, wsDescuentos, 'Descuentos Vigentes');

  // --- Hoja 3: Precios Finales Calculados ---
  const hojaPrecios = [];
  const pasajerosEjemplo = [1, 2, 3, 4, 5, 6, 7];
  const dtoOnline = pricing.descuentosGlobales.descuentoOnline.activo
    ? pricing.descuentosGlobales.descuentoOnline.valor / 100 : 0;
  const dtoRoundTrip = pricing.descuentosGlobales.descuentoRoundTrip.activo
    ? pricing.descuentosGlobales.descuentoRoundTrip.valor / 100 : 0;
  const dtoPersonalizados = (pricing.descuentosGlobales.descuentosPersonalizados || [])
    .filter((d) => d.activo && d.valor > 0)
    .reduce((sum, d) => sum + d.valor / 100, 0);

  pricing.destinos.filter((d) => d.activo).forEach((dest) => {
    pasajerosEjemplo.forEach((pax) => {
      const esVan = pax > 4;
      let precioBase;

      if (!esVan) {
        precioBase = dest.precios?.auto?.base || 0;
      } else if (pax <= 7) {
        // Precio van con adicionales
        const baseVan = dest.precios?.van?.base || 0;
        const addPct = dest.precios?.van?.porcentajeAdicional || 0.1;
        precioBase = baseVan + (pax - 5) * baseVan * addPct;
      } else {
        return; // más de 7, no aplica
      }

      const precioSoloIda = Math.round(precioBase);
      const dtoOnlineMonto = Math.round(precioBase * dtoOnline);
      const dtoPersonalizadosMonto = Math.round(precioBase * dtoPersonalizados);
      const precioIdaConDtos = Math.max(precioSoloIda - dtoOnlineMonto - dtoPersonalizadosMonto, 0);

      const precioIdaVuelta = precioBase * 2;
      const dtoIdaVueltaMonto = Math.round(precioIdaVuelta * dtoRoundTrip);
      const dtoOnlineIdaVueltaMonto = Math.round(precioBase * dtoOnline) * 2;
      const dtoPersonalizadosIdaVuelta = Math.round(precioBase * dtoPersonalizados) * 2;
      const precioIdaVueltaConDtos = Math.max(
        precioIdaVuelta - dtoIdaVueltaMonto - dtoOnlineIdaVueltaMonto - dtoPersonalizadosIdaVuelta,
        0
      );

      hojaPrecios.push({
        'Destino': dest.nombre,
        'Pasajeros': pax,
        'Vehículo': esVan ? 'Van' : 'Auto',
        'Solo Ida (sin dto)': precioSoloIda,
        'Solo Ida (con dtos activos)': precioIdaConDtos,
        'Ida y Vuelta (sin dto)': Math.round(precioIdaVuelta),
        'Ida y Vuelta (con todos los dtos)': precioIdaVueltaConDtos,
      });
    });
  });

  const wsPrecios = XLSX.utils.json_to_sheet(hojaPrecios);
  XLSX.utils.book_append_sheet(wb, wsPrecios, 'Precios Calculados');

  // --- Guardar archivo ---
  const fechaHoy = new Date().toLocaleDateString('es-CL').replace(/\//g, '-');
  XLSX.writeFile(wb, `lista-precios-araucaria-${fechaHoy}.xlsx`);
};
```

### 7.4 Botón en la UI

Agregar este botón junto al botón "Guardar Configuración" en `AdminPricing.jsx`:

```jsx
<button
  type="button"
  onClick={exportarListaPrecios}
  disabled={loading || pricing.destinos.length === 0}
  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
>
  📥 Exportar Lista de Precios (.xlsx)
</button>
```

---

## Paso 8 — Errores Comunes y Soluciones

| Error | Causa | Solución |
|-------|-------|----------|
| `PUT /pricing` retorna 401 | Token JWT vencido o ausente | Verificar `useAuthenticatedFetch` y que el token esté en localStorage |
| Precios no se actualizan tras guardar | Caché de 60s activo | El frontend debe llamar `recargarDatosPrecios()` después del PUT |
| `precioBaseVan` no se guarda | Campo no enviado en el body del PUT | Verificar que `precios.van.base` esté en el payload de destinos al guardar |
| Descuento aparece pero no se aplica | `activo: false` en BD | Verificar el toggle en AdminPricing o directamente en BD |
| Promoción no aplica en un día | `diaIndividual` no coincide con día real | Verificar el campo `dia` en la tabla Promocion y el JSON en `descripcion` |
| XLS exportado con valores 0 | `pricing.destinos` vacío al exportar | Esperar que `loading === false` antes de habilitar el botón de exportación |
| Precio final negativo | Suma de descuentos supera el 75% | El sistema aplica `MIN(descuentoTotal, precioBase × 0.75)` automáticamente |

---

## Paso 9 — Checklist de Implementación (Exportación XLS)

- [ ] Instalar `xlsx` con `pnpm add xlsx` en la raíz del frontend
- [ ] Importar `* as XLSX from 'xlsx'` en `AdminPricing.jsx`
- [ ] Agregar la función `exportarListaPrecios()` en el componente
- [ ] Agregar el botón de exportación en el JSX, cerca del botón "Guardar"
- [ ] Validar que el botón se deshabilite mientras `loading === true`
- [ ] Probar con al menos 2 destinos y 1 descuento activo
- [ ] Verificar que el nombre del archivo incluya la fecha actual
- [ ] Confirmar que las tres hojas se generan correctamente
- [ ] Verificar en localhost y en Hostinger (el componente está en el frontend)

---

## Referencias de Archivos

| Archivo | Descripción breve |
|---------|-------------------|
| [src/components/AdminPricing.jsx](src/components/AdminPricing.jsx) | Componente principal del panel de precios |
| [src/App.jsx](src/App.jsx) | Lógica de cálculo de cotización (líneas 1300-1420) |
| [src/data/destinos.jsx](src/data/destinos.jsx) | Datos base de destinos (fallback) |
| [backend/server-db.js](backend/server-db.js) | Endpoints de pricing (líneas 1033-1490) |
| [DOCUMENTACION_MAESTRA.md](DOCUMENTACION_MAESTRA.md) | Sección 5.10: Descuentos Personalizados |
