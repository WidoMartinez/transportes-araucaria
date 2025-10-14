# 🔍 Revisión de Errores en Implementación de Base de Datos

**Fecha:** 14 de octubre de 2025  
**Autor:** Copilot Code Review  
**Estado:** En proceso

---

## 📋 Resumen Ejecutivo

Se han identificado **8 categorías de errores** en la implementación de la base de datos MySQL con Sequelize. Estos errores van desde inconsistencias en nombres de campos hasta problemas de concurrencia y falta de validaciones.

---

## 🔴 Errores Críticos (Prioridad Alta)

### Error 1: Inconsistencia en Nombres de Campos (snake_case vs camelCase)

**Ubicación:** `backend/models/Reserva.js` y `backend/server-db.js`

**Problema:**
```javascript
// En el modelo (Reserva.js)
clienteId: {
    type: DataTypes.INTEGER,
    field: 'cliente_id',  // Mapea a snake_case en BD
}

// En queries (server-db.js línea 1873)
where: { clienteId: id }  // Usa camelCase pero BD tiene snake_case
```

**Impacto:**
- ❌ Las consultas WHERE con `clienteId` pueden fallar o no encontrar resultados
- ❌ Los JOIN entre tablas pueden no funcionar correctamente
- ❌ Inconsistencia entre lo que espera Sequelize y lo que hay en MySQL

**Solución Recomendada:**
1. Opción A: Eliminar el mapeo `field: 'cliente_id'` y usar solo camelCase
2. Opción B: Mantener snake_case en BD pero asegurar que Sequelize siempre traduce correctamente

**Estado:** ⏳ Pendiente

---

### Error 2: Uso Excesivo de `alter: true` en Sincronización

**Ubicación:** `backend/server-db.js` líneas 1055-1067, 1101, 1158

**Problema:**
```javascript
// Múltiples endpoints que alteran la estructura de BD
await CodigoDescuento.sync({ force: false, alter: true });
await Reserva.sync({ force: false, alter: true });
await Destino.sync({ force: false, alter: true });
```

**Impacto:**
- ❌ **PELIGRO:** Puede modificar estructura de tablas en producción sin control
- ❌ Puede causar pérdida de datos si Sequelize malinterpreta la estructura
- ❌ Bloqueos de tablas durante la alteración en producción
- ❌ Múltiples procesos pueden intentar alterar simultáneamente

**Solución Recomendada:**
- Usar `alter: true` SOLO en desarrollo o scripts de migración específicos
- En producción usar `sync({ force: false })` sin alter
- Usar migraciones controladas para cambios de esquema

**Estado:** ⏳ Pendiente

---

### Error 3: Falta de Validación de RUT Inconsistente

**Ubicación:** `backend/models/Cliente.js` líneas 18-27 y `backend/server-db.js` líneas 48-63

**Problema:**
```javascript
// Cliente.js espera formato con puntos
isChileanRutFormat(value) {
    const rutRegex = /^(\d{1,2}\.\d{3}\.\d{3}-[\dkK])|(\d{7,8}-[\dkK])$/;
}

// Pero formatearRUT() devuelve sin puntos
const formatearRUT = (rut) => {
    return `${cuerpo}-${dv}`;  // Formato: XXXXXXXX-X (sin puntos)
}
```

**Impacto:**
- ❌ Si se intenta guardar un Cliente con RUT formateado por `formatearRUT()`, falla la validación
- ❌ Inconsistencia entre diferentes partes del sistema
- ❌ Reservas se guardan con un formato, Clientes esperan otro

**Solución Recomendada:**
- Estandarizar formato: usar siempre `XXXXXXXX-X` (sin puntos)
- Actualizar validación en Cliente.js para aceptar formato sin puntos
- O cambiar formatearRUT() para incluir puntos

**Estado:** ⏳ Pendiente

---

## 🟡 Errores Moderados (Prioridad Media)

### Error 4: Campo Virtual Mal Configurado

**Ubicación:** `backend/models/Reserva.js` líneas 148-156

**Problema:**
```javascript
detallesCompletos: {
    type: DataTypes.VIRTUAL,
    get() {
        return this.getDataValue("detallesCompletos") ?? false;
    },
    set(val) {
        this.setDataValue("detallesCompletos", Boolean(val));
    },
},
```

**Impacto:**
- ⚠️ Los campos VIRTUAL no deben usar `getDataValue/setDataValue` con el mismo nombre
- ⚠️ Puede causar errores si se intenta persistir
- ⚠️ El getter/setter no funciona como se espera

**Solución Recomendada:**
```javascript
detallesCompletos: {
    type: DataTypes.VIRTUAL,
    get() {
        // Calcular basado en otros campos
        return this.numeroVuelo && this.hotel ? true : false;
    }
}
```

**Estado:** ⏳ Pendiente

---

### Error 5: Falta de Transacciones en Operaciones Críticas

**Ubicación:** `backend/server-db.js` líneas 1780-1830

**Problema:**
```javascript
// Actualizar pago de reserva (línea 1780)
const reserva = await Reserva.findByPk(id);
// ...
await reserva.save();

// Actualizar estadísticas del cliente (línea 1806)
if (estadoPago === "pagado" && reserva.clienteId) {
    const cliente = await Cliente.findByPk(reserva.clienteId);
    // ...
    await cliente.save();
}
```

**Impacto:**
- ❌ Si falla la actualización del cliente, la reserva ya está marcada como pagada
- ❌ Inconsistencia de datos en caso de error
- ❌ No hay rollback automático

**Solución Recomendada:**
```javascript
const transaction = await sequelize.transaction();
try {
    const reserva = await Reserva.findByPk(id, { transaction });
    // ...operaciones...
    await reserva.save({ transaction });
    await cliente.save({ transaction });
    await transaction.commit();
} catch (error) {
    await transaction.rollback();
    throw error;
}
```

**Estado:** ⏳ Pendiente

---

### Error 6: Migración Duplicada en startServer()

**Ubicación:** `backend/server-db.js` líneas 2246-2285

**Problema:**
```javascript
// La migración se ejecuta en startServer()
const queryInterface = sequelize.getQueryInterface();
await queryInterface.addColumn("reservas", "cliente_id", {...});

// Pero también existe en migrations/add-cliente-fields.js
// Y en package.json: "start:migrate"
```

**Impacto:**
- ⚠️ Código duplicado difícil de mantener
- ⚠️ Puede causar conflictos si se ejecutan ambos
- ⚠️ Lógica de migración mezclada con lógica de inicio del servidor

**Solución Recomendada:**
- Eliminar migración de startServer()
- Usar solo el script de migración separado
- O usar sistema de migraciones de Sequelize (umzug)

**Estado:** ⏳ Pendiente

---

## 🟢 Errores Menores (Prioridad Baja)

### Error 7: Índices Duplicados

**Ubicación:** `backend/models/Reserva.js` y `backend/migrations/add-cliente-fields.js`

**Problema:**
```javascript
// En Reserva.js (líneas 189-196)
indexes: [
    { fields: ["clienteId"] },
    { fields: ["rut"] },
]

// En migración (líneas 129-139)
await queryInterface.addIndex("reservas", ["cliente_id"], {...});
await queryInterface.addIndex("reservas", ["rut"], {...});
```

**Impacto:**
- ⚠️ Intentará crear índices que ya existen
- ⚠️ Errores en logs (aunque no crítico porque catch los captura)
- ⚠️ Confusión sobre dónde se definen los índices

**Solución Recomendada:**
- Definir índices solo en el modelo
- O solo en migraciones, no en ambos
- Verificar existencia antes de crear

**Estado:** ⏳ Pendiente

---

### Error 8: Validación Insuficiente en Endpoints

**Ubicación:** `backend/server-db.js` líneas 1410-1444

**Problema:**
```javascript
pasajeros: parseInt(datosReserva.pasajeros) || 1,
precio: parseFloat(datosReserva.precio) || 0,
abonoSugerido: parseFloat(datosReserva.abonoSugerido) || 0,
totalConDescuento: parseFloat(datosReserva.totalConDescuento) || 0,
```

**Impacto:**
- ⚠️ Si `parseInt` devuelve `NaN`, guarda 1 o 0 sin validar
- ⚠️ Valores negativos no son validados
- ⚠️ Puede guardar precios incorrectos en BD

**Solución Recomendada:**
```javascript
const parsePasajeros = (val) => {
    const num = parseInt(val);
    if (isNaN(num) || num < 1) throw new Error("Pasajeros inválido");
    return num;
};
const parsePrice = (val) => {
    const num = parseFloat(val);
    if (isNaN(num) || num < 0) throw new Error("Precio inválido");
    return num;
};
```

**Estado:** ⏳ Pendiente

---

## 📊 Resumen de Impactos

| Error | Prioridad | Impacto en Producción | Dificultad de Fix |
|-------|-----------|----------------------|-------------------|
| Error 1: Nombres inconsistentes | 🔴 Alta | Consultas fallidas | Baja |
| Error 2: alter: true excesivo | 🔴 Alta | Pérdida de datos | Baja |
| Error 3: Validación RUT | 🔴 Alta | Clientes no se guardan | Baja |
| Error 4: Campo Virtual | 🟡 Media | Errores esporádicos | Baja |
| Error 5: Sin transacciones | 🟡 Media | Inconsistencia datos | Media |
| Error 6: Migración duplicada | 🟡 Media | Conflictos | Baja |
| Error 7: Índices duplicados | 🟢 Baja | Solo logs | Baja |
| Error 8: Validaciones | 🟢 Baja | Datos incorrectos | Baja |

---

## 🎯 Plan de Acción Recomendado

### Fase 1: Correcciones Críticas (Prioridad 1)
1. ✅ Eliminar uso de `alter: true` en endpoints de producción
2. ✅ Estandarizar formato de RUT en toda la aplicación
3. ✅ Corregir queries que usan `clienteId` directamente

### Fase 2: Mejoras de Estabilidad (Prioridad 2)
4. ✅ Agregar transacciones a operaciones críticas
5. ✅ Eliminar migración duplicada de startServer()
6. ✅ Corregir campo virtual `detallesCompletos`

### Fase 3: Pulido (Prioridad 3)
7. ✅ Consolidar definición de índices
8. ✅ Agregar validaciones robustas en endpoints

---

## 📝 Notas Adicionales

### Recomendaciones Generales:

1. **Usar Migraciones Controladas**
   - Implementar sistema de migraciones versionadas
   - Usar herramientas como `umzug` o Sequelize CLI
   - No alterar esquema en código de aplicación

2. **Testing de BD**
   - Agregar tests de integración para modelos
   - Verificar que queries funcionen correctamente
   - Probar casos edge (valores null, etc)

3. **Monitoreo**
   - Activar logging de Sequelize en desarrollo
   - Monitorear queries lentas en producción
   - Revisar logs de errores de BD

4. **Documentación**
   - Documentar formato esperado de RUT
   - Documentar relaciones entre modelos
   - Mantener diagrama ER actualizado

---

## 🔗 Referencias

- [Documentación Sequelize - Migrations](https://sequelize.org/docs/v6/other-topics/migrations/)
- [Documentación Sequelize - Transactions](https://sequelize.org/docs/v6/other-topics/transactions/)
- [MySQL Best Practices](https://dev.mysql.com/doc/refman/8.0/en/optimization.html)

---

**Última actualización:** 14 de octubre de 2025  
**Próxima revisión:** Después de implementar correcciones
