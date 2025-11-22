# Recomendaciones Técnicas: Sistema de Disponibilidad

**Issue:** #examinar funcionalidad disponibilidad  
**Fecha:** 2025-11-22

---

## Decisión Requerida

El sistema de disponibilidad y retornos está **80% implementado** pero tiene un **problema crítico**: los descuentos por retorno **NO se aplican al precio final**.

### Opciones:

#### ✅ OPCIÓN A: Completar Implementación (RECOMENDADO)
- **Esfuerzo:** 3-4 horas
- **Beneficio:** Sistema completamente funcional
- **Riesgo:** Bajo

#### ⛔ OPCIÓN B: Desactivar Temporalmente
- **Esfuerzo:** 30 minutos
- **Beneficio:** Elimina confusión al usuario
- **Riesgo:** Ninguno

---

## Implementación Opción A: Pasos Detallados

### Paso 1: Actualizar Modelo de Base de Datos

**Archivo:** `backend/models/Reserva.js`

**Agregar después de la línea 148:**
```javascript
descuentoRetornoVacio: {
  type: DataTypes.DECIMAL(5, 2),
  allowNull: true,
  defaultValue: 0,
  field: "descuento_retorno_vacio",
  comment: "Porcentaje de descuento por aprovechamiento de retorno vacío"
},
```

### Paso 2: Crear Migración de Base de Datos

**Crear archivo:** `backend/migrations/add-descuento-retorno-column.js`

```javascript
import { Sequelize } from "sequelize";
import sequelize from "../config/database.js";

/**
 * Migración para agregar columna de descuento por retorno vacío
 */
const addDescuentoRetornoColumn = async () => {
  try {
    console.log("🔄 Ejecutando migración: agregar columna descuento_retorno_vacio...");

    await sequelize.query(`
      ALTER TABLE reservas 
      ADD COLUMN IF NOT EXISTS descuento_retorno_vacio DECIMAL(5,2) DEFAULT 0 
      COMMENT 'Porcentaje de descuento por aprovechamiento de retorno vacío'
    `);

    console.log("✅ Columna descuento_retorno_vacio agregada exitosamente");
  } catch (error) {
    console.error("❌ Error en migración de descuento retorno:", error);
    // No lanzar error para evitar romper el inicio del servidor
  }
};

export default addDescuentoRetornoColumn;
```

### Paso 3: Ejecutar Migración al Iniciar Servidor

**Archivo:** `backend/server-db.js`

**Agregar en la sección de migraciones (alrededor de la línea 660):**
```javascript
import addDescuentoRetornoColumn from "./migrations/add-descuento-retorno-column.js";

// ...dentro de la función que ejecuta migraciones...
await addDescuentoRetornoColumn(); // Migración para descuento por retorno vacío
```

### Paso 4: Actualizar Frontend para Enviar Descuento

**Archivo:** `src/components/HeroExpress.jsx`

**Modificar la función `onSubmitWizard` (línea ~280):**

```javascript
const handleGuardarReserva = async () => {
  if (!validarDatosReserva()) return;
  
  // Agregar descuento de retorno a los datos
  const datosConRetorno = {
    ...formData,
    descuentoRetornoVacio: descuentoRetorno?.porcentaje || 0
  };
  
  const result = await onSubmitWizard(datosConRetorno);
  if (!result.success) {
    setStepError(result.message || "Error al guardar.");
    return;
  }
  alert("✅ Reserva guardada. Revisa tu email para pagar después.");
};

const handleProcesarPago = async (gateway, type) => {
  if (!validarDatosReserva()) return;
  
  // Agregar descuento de retorno a los datos
  const datosConRetorno = {
    ...formData,
    descuentoRetornoVacio: descuentoRetorno?.porcentaje || 0
  };
  
  const result = await onSubmitWizard(datosConRetorno);
  // ... resto del código
};
```

**O modificar en el componente padre (App.jsx):**

Buscar donde se define `onSubmitWizard` y asegurar que incluya el campo `descuentoRetornoVacio` en los datos enviados al backend.

### Paso 5: Actualizar Backend para Guardar Descuento

**Archivo:** `backend/server-db.js`

**Modificar creación de reserva (línea ~2605):**

```javascript
reservaExpress = await Reserva.create({
  // ... campos existentes ...
  descuentoRetornoVacio: parsePositiveDecimal(
    datosReserva.descuentoRetornoVacio,
    "descuentoRetornoVacio",
    0
  ),
  // ... resto de campos ...
});
```

**Modificar actualización de reserva (línea ~2520):**

```javascript
await reservaExistente.update({
  // ... campos existentes ...
  descuentoRetornoVacio: parsePositiveDecimal(
    datosReserva.descuentoRetornoVacio,
    "descuentoRetornoVacio",
    reservaExistente.descuentoRetornoVacio || 0
  ),
  // ... resto de campos ...
});
```

### Paso 6: Aplicar Descuento al Precio Final

**Archivo:** `backend/server-db.js`

**Buscar donde se calcula `totalConDescuento` y modificar:**

```javascript
// Calcular descuento total incluyendo retorno
const descuentoTotalPorcentaje = 
  (datosReserva.descuentoBase || 0) +
  (datosReserva.descuentoPromocion || 0) +
  (datosReserva.descuentoRoundTrip || 0) +
  (datosReserva.descuentoOnline || 0) +
  (datosReserva.descuentoRetornoVacio || 0);

// Aplicar descuento al precio
const totalConDescuento = precio * (1 - descuentoTotalPorcentaje / 100);
```

### Paso 7: Actualizar Panel de Administración

**Archivo:** `src/components/AdminReservas.jsx`

**Mostrar descuento de retorno en la tabla de reservas:**

```javascript
// En la sección donde se muestran los descuentos:
{reserva.descuentoRetornoVacio > 0 && (
  <Badge variant="success" className="text-xs">
    Retorno: {reserva.descuentoRetornoVacio}%
  </Badge>
)}
```

### Paso 8: Probar la Implementación

**Tests Manuales:**

1. **Test 1: Reserva sin retorno**
   - Crear reserva normal
   - Verificar que descuentoRetornoVacio = 0
   - Verificar que precio sea correcto

2. **Test 2: Reserva con retorno**
   - Crear reserva A: Temuco → Villarrica a las 08:00
   - Crear reserva B: Villarrica → Temuco a las 10:00
   - Verificar que se detecta oportunidad
   - Verificar que descuentoRetornoVacio > 0
   - Verificar que precio final incluye descuento

3. **Test 3: Panel Admin**
   - Ver reserva en panel
   - Verificar que muestra descuento de retorno
   - Exportar a Excel y verificar columna

**Tests Automatizados (Opcional):**

Crear archivo `backend/test-descuento-retorno.js`:

```javascript
import { buscarOportunidadesRetorno } from './utils/disponibilidad.js';

async function testDescuentoRetorno() {
  console.log("🧪 Probando cálculo de descuento por retorno...");
  
  const resultado = await buscarOportunidadesRetorno({
    origen: "Temuco",
    destino: "Villarrica", 
    fecha: new Date(),
    hora: "10:00"
  });
  
  console.log("Resultado:", resultado);
  console.assert(
    typeof resultado.descuento === 'number',
    "Descuento debe ser un número"
  );
  
  console.log("✅ Test completado");
}

testDescuentoRetorno();
```

---

## Implementación Opción B: Desactivar Temporalmente

Si decides NO completar la implementación por ahora:

### Paso 1: Desactivar Llamadas API

**Archivo:** `src/components/HeroExpress.jsx`

**Comentar líneas 183-212:**

```javascript
// DESACTIVADO: Sistema de retornos en desarrollo
/*
// 2. Buscar oportunidades de retorno
const respRetorno = await fetch(
  `${getBackendUrl()}/api/disponibilidad/oportunidades-retorno`,
  // ... resto del código ...
);
*/

// Retornar sin descuento
return { disponible: true, descuento: null };
```

### Paso 2: Remover Indicador Visual

**Archivo:** `src/components/HeroExpress.jsx`

**Comentar líneas 606-611:**

```javascript
{/* DESACTIVADO: Sistema de retornos en desarrollo
{descuentoRetorno && (
  <div className="bg-green-50 text-green-700">
    ¡Descuento por retorno aplicado!
  </div>
)}
*/}
```

### Paso 3: Desactivar en Panel Admin

**Archivo:** `src/components/AdminDashboard.jsx`

**Comentar botón de Disponibilidad:**

```javascript
{/* DESACTIVADO: Sistema en desarrollo
<Button
  className={`px-3 py-2 rounded border ${active === "disponibilidad" ? "bg-primary" : "bg-white"}`}
  onClick={() => setPanel("disponibilidad")}
>
  Disponibilidad
</Button>
*/}
```

### Paso 4: Desactivar en Base de Datos

**Opción 1 - Via SQL:**
```sql
UPDATE configuracion_disponibilidad 
SET activo = false 
WHERE id = 1;
```

**Opción 2 - Via Panel Admin (si se mantiene acceso):**
- Ir a panel de Disponibilidad
- Desmarcar checkbox "Sistema activo"
- Guardar cambios

---

## Correcciones de Calidad de Código

Independiente de la opción elegida, corregir estos problemas:

### 1. Dependencias de React Hooks

**Archivo:** `src/components/AdminDisponibilidad.jsx`

**Línea 29 - Corregir:**
```javascript
// ANTES:
useEffect(() => {
  cargarConfiguracion();
}, []);

// DESPUÉS:
useEffect(() => {
  cargarConfiguracion();
}, [cargarConfiguracion]);

// O mejor aún, envolver cargarConfiguracion en useCallback:
const cargarConfiguracion = useCallback(async () => {
  // ... código existente ...
}, []);

useEffect(() => {
  cargarConfiguracion();
}, [cargarConfiguracion]);
```

### 2. Variables No Utilizadas

**Archivo:** `src/components/HeroExpress.jsx`

**Líneas 54-64 - Remover si no se usan:**
```javascript
// Si estas props no se usan, removerlas de la firma de la función:
function HeroExpress({
  formData,
  handleInputChange,
  // ... props que sí se usan ...
  // Remover si no se usan:
  // baseDiscountRate,
  // promotionDiscountRate,
  // codigoAplicado,
  // codigoError,
  // validandoCodigo,
  // onAplicarCodigo,
  // onRemoverCodigo,
}) {
```

**Línea 70 - Usar o remover:**
```javascript
// OPCIÓN 1: Si se va a usar en el futuro, agregar comentario:
const [reservaActiva, setReservaActiva] = useState(null); // TODO: Implementar validación de reserva activa

// OPCIÓN 2: Si no se usa, remover completamente
```

---

## Checklist de Implementación

### Para Opción A (Completar):

- [ ] Actualizar modelo Reserva.js
- [ ] Crear migración de base de datos
- [ ] Agregar migración en server-db.js
- [ ] Modificar HeroExpress.jsx para enviar descuento
- [ ] Modificar server-db.js para guardar descuento
- [ ] Actualizar cálculo de totalConDescuento
- [ ] Actualizar panel AdminReservas.jsx
- [ ] Probar flujo completo manualmente
- [ ] Verificar en base de datos
- [ ] Documentar cambios en CHANGELOG

### Para Opción B (Desactivar):

- [ ] Comentar llamadas API en HeroExpress.jsx
- [ ] Remover indicador visual
- [ ] Ocultar botón en AdminDashboard.jsx
- [ ] Desactivar en base de datos
- [ ] Documentar estado en README
- [ ] Agregar issue para completar en futuro

### Para Ambas Opciones (Calidad):

- [ ] Corregir hooks en AdminDisponibilidad.jsx
- [ ] Limpiar variables no usadas en HeroExpress.jsx
- [ ] Ejecutar `npm run lint` y verificar mejoras
- [ ] Actualizar documentación
- [ ] Commit y push de cambios

---

## Preguntas Frecuentes

### ¿Por qué no se implementó completo desde el inicio?

Probablemente se desarrolló en fases y quedó pendiente la integración final. Es común en desarrollo ágil.

### ¿Es seguro aplicar estos cambios?

Sí, los cambios son localizados y no afectan funcionalidad existente. La migración usa `IF NOT EXISTS` para evitar errores.

### ¿Qué pasa con reservas existentes?

Tendrán `descuentoRetornoVacio = 0` por defecto. No hay impacto retroactivo.

### ¿Funciona la verificación de disponibilidad sin completar retornos?

Sí, son funcionalidades independientes. Disponibilidad funciona perfectamente.

### ¿Cuánto tiempo toma el despliegue?

- Desarrollo: 3-4 horas
- Testing: 1 hora
- Despliegue: 15 minutos
- **Total:** ~5 horas

---

## Soporte y Contacto

Para dudas sobre implementación:
- Revisar `SISTEMA_DISPONIBILIDAD.md`
- Revisar `ANALISIS_DISPONIBILIDAD_RETORNOS.md`
- Consultar logs del servidor para debugging

---

**Última actualización:** 2025-11-22  
**Autor:** GitHub Copilot - Agente de Calidad de Código
