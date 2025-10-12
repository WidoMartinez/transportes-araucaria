# Ejemplos de Códigos con Valores No Cerrados

## 📋 Formato del código

**Estructura:** `ORIGEN-DESTINO-MONTO`

Donde:
- **ORIGEN**: Abreviación o nombre del origen
- **DESTINO**: Abreviación o nombre del destino  
- **MONTO**: Valor en miles de pesos, **ahora con decimales**

## 💰 Valores soportados

### Valores cerrados (múltiplos de mil)

| Código | Monto | Resultado |
|--------|-------|-----------|
| `A-CARAHUE-35` | 35 | $35.000 |
| `TEMUCO-PUCON-60` | 60 | $60.000 |
| `A-LONQUIMAY-45` | 45 | $45.000 |
| `VILLARRICA-TEMUCO-25` | 25 | $25.000 |

### Valores no cerrados (con decimales)

| Código | Monto | Resultado |
|--------|-------|-----------|
| `A-CARAHUE-32.5` | 32.5 | $32.500 |
| `TEMUCO-PUCON-47.25` | 47.25 | $47.250 |
| `A-LONQUIMAY-38.75` | 38.75 | $38.750 |
| `PUCON-CORRALCO-52.5` | 52.5 | $52.500 |
| `A-CONGUILLIO-67.25` | 67.25 | $67.250 |

### Valores con más decimales (se redondean)

| Código | Monto | Cálculo | Resultado |
|--------|-------|---------|-----------|
| `A-CARAHUE-32.567` | 32.567 | 32.567 × 1000 = 32567 | $32.567 |
| `TEMUCO-PUCON-47.251` | 47.251 | 47.251 × 1000 = 47251 | $47.251 |
| `A-LONQUIMAY-38.749` | 38.749 | 38.749 × 1000 = 38749 | $38.749 |

**Nota:** El sistema usa `Math.round()` para redondear automáticamente cualquier valor.

## 🎯 Casos de uso comunes

### Caso 1: Valor estándar
```
Cliente: "Necesito traslado aeropuerto a Carahue"
Admin: "El precio es $35.000"
Código: A-CARAHUE-35
```

### Caso 2: Valor con descuento
```
Cliente: "Necesito traslado Temuco a Pucón"
Admin: "El precio normal es $60.000, con descuento $47.250"
Código: TEMUCO-PUCON-47.25
```

### Caso 3: Valor personalizado
```
Cliente: "Necesito traslado aeropuerto a Carahue"
Admin: "Por ser cliente frecuente, $32.500"
Código: A-CARAHUE-32.5
```

### Caso 4: Precio con centavos exactos
```
Cliente: "¿Cuánto cuesta a Lonquimay?"
Admin: "Sale $38.750"
Código: A-LONQUIMAY-38.75
```

## 🔄 Cómo funciona el procesamiento

1. **Usuario ingresa:** `A-CARAHUE-32.5`
2. **Sistema separa:** 
   - Origen: `A` → `Aeropuerto La Araucanía`
   - Destino: `CARAHUE` → `Carahue`
   - Monto: `32.5`
3. **Sistema calcula:** `32.5 × 1000 = 32500`
4. **Sistema muestra:** `$32.500`

## ✅ Ventajas del nuevo sistema

1. **Flexibilidad total:** Cualquier valor, no solo múltiplos de mil
2. **Descuentos precisos:** Puedes aplicar descuentos exactos
3. **Precios personalizados:** Ofrece valores específicos a clientes especiales
4. **Fácil de recordar:** El código sigue siendo simple (ej: 32.5 en lugar de 32500)

## 📱 Flujo del cliente

1. Recibe código por WhatsApp: `A-CARAHUE-32.5`
2. Abre el link o ingresa el código manualmente
3. Hace clic en "Validar"
4. Ve: Origen, Destino, Monto ($32.500)
5. Completa sus datos y paga

## 🎓 Ejemplos de conversación por WhatsApp

### Conversación 1
```
Admin: "Hola! El traslado aeropuerto a Carahue tiene un costo de $32.500"
Admin: "Tu código es: A-CARAHUE-32.5"
Admin: "Paga aquí: https://transportesaraucaria.cl/?view=pago-personalizado&codigo=A-CARAHUE-32.5"
Cliente: "Perfecto, voy a pagar ahora"
```

### Conversación 2
```
Cliente: "¿Cuánto sale de Temuco a Pucón?"
Admin: "Sale $47.250"
Cliente: "Ok, dame el código"
Admin: "Tu código es: TEMUCO-PUCON-47.25"
Admin: "Ingresa a: transportesaraucaria.cl/pago-personalizado"
```

---

**Actualizado:** Octubre 12, 2025  
**Versión:** 2.1 (con soporte para decimales)
