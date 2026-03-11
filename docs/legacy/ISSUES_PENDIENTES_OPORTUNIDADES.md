# Issues Pendientes - Sistema de Oportunidades

## 🔴 CRÍTICOS - Corregir antes de producción

### 1. Generación de Código no Único
**Archivo**: `backend/routes/oportunidades.js` línea 11-17
**Problema**: La función usa `Math.random() * 1000` que genera solo 1000 posibles valores por día, alta probabilidad de colisión.
**Solución**:
```javascript
const generarCodigoOportunidad = async () => {
    const fecha = new Date();
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, "0");
    const day = String(fecha.getDate()).padStart(2, "0");
    
    const timestamp = Date.now().toString(36).toUpperCase();
    const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
    let codigo = `OP-${year}${month}${day}-${timestamp}-${randomStr}`;
    
    let intentos = 0;
    while (intentos < 5) {
        const existe = await Oportunidad.findOne({ where: { codigo } });
        if (!existe) return codigo;
        intentos++;
        const newRandom = Math.random().toString(36).substring(2, 6).toUpperCase();
        codigo = `OP-${year}${month}${day}-${timestamp}-${newRandom}`;
    }
    throw new Error("No se pudo generar código único");
};
```

### 2. Asociaciones Sequelize Fuera de Función
**Archivo**: `backend/models/associations.js` líneas 170-193
**Problema**: Las asociaciones de Oportunidad están definidas fuera de `setupAssociations()`, se ejecutan al importar el módulo.
**Solución**: Mover el código dentro de la función `setupAssociations()`

### 3. JSON Doble Stringify/Parse
**Archivo**: `backend/routes/oportunidades.js` líneas 253, 262, 274
**Problema**: Sequelize ya maneja JSON automáticamente, hacer stringify/parse causa doble conversión.
**Solución**: 
```javascript
// Cambiar de:
rutas: JSON.stringify(rutas)
// A:
rutas: rutas

// Y cambiar de:
JSON.parse(suscripcion.rutas)
// A:
suscripcion.rutas
```

### 4. Falta Validación de Entrada
**Archivo**: `backend/routes/oportunidades.js` endpoint `/suscribir`
**Problema**: No valida formato de email, estructura de rutas, etc.
**Solución**: Usar zod o express-validator

### 5. Sin Rate Limiting
**Archivo**: `backend/routes/oportunidades.js`
**Problema**: Endpoints públicos sin límite de requests, vulnerable a abuso.
**Solución**: Agregar middleware de rate limiting

## 🟡 MODERADOS - Sprint actual

### 6. Sin Límite en Consultas
**Archivo**: `backend/routes/oportunidades.js` línea 191
**Solución**: Agregar paginación con `findAndCountAll` y parámetros `limit`, `offset`

### 7. useCallback Faltante
**Archivo**: `src/pages/OportunidadesTraslado.jsx` línea 35
**Problema**: `cargarOportunidades` debería usar `useCallback` para evitar recreaciones
**Solución**:
```javascript
const cargarOportunidades = useCallback(async () => {
    // ... código existente
}, [filtros]);
```

### 8. Manejo Incorrecto de Timezone
**Archivo**: `src/components/OportunidadCard.jsx` línea 44
**Problema**: `new Date(fecha)` puede causar offset de timezone
**Solución**:
```javascript
const formatFecha = (fecha) => {
    const [year, month, day] = fecha.split('-');
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("es-CL", opciones);
};
```

### 9. Validaciones de Sequelize Faltantes
**Archivo**: `backend/models/Oportunidad.js`
**Solución**: Agregar validaciones a campos críticos:
```javascript
codigo: {
    type: DataTypes.STRING(50),
    validate: {
        is: /^OP-\d{8}-[A-Z0-9]+-[A-Z0-9]+$/
    }
},
descuento: {
    type: DataTypes.INTEGER,
    validate: {
        min: 0,
        max: 100
    }
}
```

### 10. Código Duplicado
**Archivo**: `src/pages/OportunidadesTraslado.jsx` línea 81
**Problema**: `datosReserva.codigoOportunidad = oportunidad.id;` está duplicado
**Solución**: Eliminar una línea

## 🟢 MENORES - Backlog

### 11. Números Mágicos Hardcodeados
**Archivos varios**
**Problema**: BASE = "Temuco", descuentos 50%, 60%, etc. hardcodeados
**Solución**: Extraer a archivo de configuración

### 12. Console.log en Producción
**Archivos varios**
**Problema**: Muchos console.log que impactan rendimiento
**Solución**: Usar logger condicional o eliminar

### 13. Comentarios Mixtos (ES/EN)
**Archivos varios**
**Problema**: Algunos comentarios en inglés, otros en español
**Solución**: Estandarizar todo a español según instrucciones

## 📋 Checklist de Implementación

### Semana 1 (Críticos)
- [ ] Corregir generación de código
- [ ] Mover asociaciones Sequelize
- [ ] Corregir JSON double conversion
- [ ] Agregar validación de entrada
- [ ] Implementar rate limiting

### Semana 2 (Moderados)
- [ ] Agregar paginación
- [ ] Implementar useCallback
- [ ] Corregir timezone
- [ ] Agregar validaciones Sequelize
- [ ] Eliminar código duplicado

### Backlog
- [ ] Extraer constantes
- [ ] Limpiar console.logs
- [ ] Estandarizar comentarios

## 🔗 Referencias

- **Reporte Completo**: Ver `REPORTE_CALIDAD_OPORTUNIDADES.md`
- **Checklist Detallado**: Ver `CHECKLIST_CORRECCIONES_OPORTUNIDADES.md`
- **Issues para GitHub**: Ver `ISSUES_OPORTUNIDADES.md`

---
**Generado por**: Agente de Calidad de Código  
**Fecha**: 2026-02-09  
**Estado**: Pendiente de corrección
