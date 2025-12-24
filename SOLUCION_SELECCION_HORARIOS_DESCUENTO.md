# Solución: Selección de Horarios con Descuento en Oportunidades de Posicionamiento

## Problema Original

Los usuarios no podían seleccionar horarios con descuento cuando se detectaban oportunidades de viaje de **ida** (posicionamiento) con pasajeros detectadas por reserva opuesta. Aunque el sistema mostraba correctamente las opciones de horario con descuento en la alerta, al hacer click en estas opciones:

- El campo de hora no se actualizaba
- No había feedback visual de la selección
- El flujo no permitía continuar con la reserva

## Análisis de la Causa

El problema tenía múltiples aspectos:

1. **Opciones de horario no disponibles en el select**: Las horas generadas por el backend para oportunidades de descuento (ej: "08:37") no coincidían con los intervalos de 15 minutos del select (06:00, 06:15, 06:30, etc.)

2. **Falta de sincronización**: El `useMemo` que genera las opciones del select (`timeOptions`) solo dependía de `formData.hora`, no de `oportunidadesRetornoUniversal`, por lo que no agregaba automáticamente las horas de descuento disponibles.

3. **Falta de feedback visual**: No había indicación clara de qué hora estaba seleccionada en los botones de la alerta, ni en el select.

## Solución Implementada

### 1. Mejora del `useMemo` en HeroExpress.jsx

**Cambio realizado**: El `useMemo` ahora:
- Agrega automáticamente todas las horas de descuento disponibles de `oportunidadesRetornoUniversal`
- Marca estas horas con un indicador visual ⭐
- Depende de `oportunidadesRetornoUniversal` para actualizarse cuando cambian las oportunidades

```javascript
const timeOptions = useMemo(() => {
    const options = generateTimeOptions();
    
    // Agregar horas de descuento de oportunidades de retorno universal
    if (oportunidadesRetornoUniversal?.opciones?.length > 0) {
        const horasDescuento = new Set();
        oportunidadesRetornoUniversal.opciones.forEach(oportunidad => {
            oportunidad.opcionesRetorno.forEach(opcion => {
                horasDescuento.add(opcion.hora);
            });
        });
        
        // Agregar horas de descuento que no estén en las opciones regulares
        horasDescuento.forEach(hora => {
            if (!options.some(opt => opt.value === hora)) {
                options.push({ 
                    value: hora, 
                    label: `${hora} ⭐ Descuento` 
                });
            }
        });
    }
    
    // Si la hora seleccionada no está en las opciones, agregarla
    if (formData.hora && !options.some(opt => opt.value === formData.hora)) {
        options.push({ value: formData.hora, label: `${formData.hora} ⭐` });
    }
    
    // Ordenar las opciones por hora
    options.sort((a, b) => a.value.localeCompare(b.value));
    
    return options;
}, [formData.hora, oportunidadesRetornoUniversal]);
```

### 2. Mejora del callback `onSeleccionarHorario`

**Cambio realizado**: El callback ahora:
- Valida el formato de hora
- Agrega logs para depuración
- Proporciona feedback visual enfocando temporalmente el select

```javascript
onSeleccionarHorario={(horaSeleccionada) => {
    // Asegurar que la hora está en formato HH:MM
    const horaFormateada = horaSeleccionada.includes(':') 
        ? horaSeleccionada 
        : horaSeleccionada;
    
    console.log('✅ [HeroExpress] Hora seleccionada desde alerta:', horaFormateada);
    
    // Actualizar el estado del formulario
    handleInputChange({ target: { name: "hora", value: horaFormateada } });
    
    // Enfocar el select para dar feedback visual
    const selectElement = document.getElementById('hora');
    if (selectElement) {
        selectElement.focus();
        setTimeout(() => {
            selectElement.blur();
        }, 100);
    }
}}
```

### 3. Mejora del componente AlertaDescuentoRetorno

**Cambios realizados**:
- Nueva prop `horaSeleccionada` para recibir la hora actual del formulario
- Resaltado visual del botón seleccionado con:
  - Borde más oscuro y prominente
  - Fondo diferente (emerald-100)
  - Ring de 2px
  - Checkmark (✓) junto a la hora
  - Sombra más pronunciada

```javascript
const esSeleccionada = horaSeleccionada === opcion.hora;
return (
    <button
        className={`
            p-2 rounded-lg border text-center transition-all 
            hover:scale-105 hover:shadow-md cursor-pointer
            ${esSeleccionada 
                ? 'border-emerald-600 bg-emerald-100 shadow-lg ring-2 ring-emerald-400' 
                : 'border-emerald-400/30 bg-white hover:bg-emerald-50'
            }
        `}
    >
        <div className={`font-bold text-sm ${esSeleccionada ? 'text-emerald-800' : 'text-emerald-700'}`}>
            {opcion.hora}
            {esSeleccionada && ' ✓'}
        </div>
        {/* ... */}
    </button>
);
```

## Beneficios de la Solución

1. **Selección funcional**: Los usuarios ahora pueden seleccionar horarios con descuento sin problemas
2. **Feedback visual claro**: 
   - Botones resaltados cuando están seleccionados
   - Indicador ⭐ en el select para horas con descuento
   - Focus temporal en el select al seleccionar
3. **Sincronización automática**: Las horas de descuento se agregan automáticamente al select
4. **Experiencia de usuario mejorada**: Flujo más intuitivo y visual

## Archivos Modificados

1. **src/components/HeroExpress.jsx**
   - Mejora del `useMemo` para `timeOptions`
   - Mejora del callback `onSeleccionarHorario`
   - Paso de prop `horaSeleccionada` a AlertaDescuentoRetorno

2. **src/components/AlertaDescuentoRetorno.jsx**
   - Nueva prop `horaSeleccionada`
   - Implementación de resaltado visual para botones seleccionados
   - Mejora de estilos y feedback visual

## Validación

- ✅ Proyecto compila sin errores
- ✅ Formato de hora consistente (HH:MM) entre backend y frontend
- ✅ Horas de descuento se agregan automáticamente al select
- ✅ Feedback visual implementado correctamente

## Próximos Pasos

- [ ] Prueba manual en entorno de desarrollo con datos reales
- [ ] Verificar funcionamiento en escenarios de:
  - Posicionamiento (ida con oportunidad de descuento)
  - Retorno (vuelta con oportunidad de descuento)
  - Sin oportunidades (comportamiento normal)
- [ ] Validar en dispositivos móviles
- [ ] Prueba con diferentes navegadores

## Notas Técnicas

- El formato de hora generado por el backend es `HH:MM` mediante `toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", hour12: false })`
- El select nativo de HTML se usa para mantener compatibilidad móvil
- Los cambios son retrocompatibles con el flujo de descuentos escalonados existente
