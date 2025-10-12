# Módulo de Pago Personalizado

## 📋 Descripción

El módulo de **Pago Personalizado** permite a los clientes generar de forma autónoma enlaces de pago para traslados y valores personalizados que no están disponibles en la base de datos del sistema.

## 🎯 Problema que resuelve

Anteriormente, cuando los clientes contactaban por WhatsApp para solicitar pagos de tramos personalizados (que no están en la base de datos), el administrador tenía que:
1. Solicitar los datos manualmente
2. Generar el link de pago con valores personalizados
3. Enviar el link al cliente

Esto consumía mucho tiempo y recursos.

## ✨ Solución

Ahora los clientes pueden:
1. Acceder al módulo desde el menú principal
2. Ingresar sus datos de traslado personalizado (origen, destino, monto)
3. Completar sus datos personales
4. Generar el pago directamente con Flow o Mercado Pago
5. Compartir enlaces pre-llenados con otros clientes

## 🔗 Formas de acceder

### Desde el menú de navegación
- En desarrollo: Click en "Pago Personalizado" en el header
- En producción: `https://www.transportesaraucaria.cl/pago-personalizado`

### URLs directas con parámetros
- `/?view=pago-personalizado`
- `#pago-personalizado`
- `/pago-personalizado`

### URLs pre-llenadas (para compartir con clientes)

Puedes generar links con datos pre-llenados usando parámetros URL:

```
/?view=pago-personalizado&origen=Lonquimay&destino=Temuco&monto=45000&descripcion=Transfer%20urgente
```

**Parámetros disponibles:**
- `origen` - Origen del traslado
- `destino` - Destino del traslado
- `monto` - Monto en CLP (sin puntos ni formato)
- `descripcion` - Descripción del servicio (opcional)
- `nombre` - Nombre del cliente (opcional)
- `email` - Email del cliente (opcional)
- `telefono` - Teléfono del cliente (opcional)

## 📱 Flujo de uso

### Para el administrador (generar link compartible)

1. Accede a `/?view=pago-personalizado`
2. Completa los datos del traslado:
   - Origen personalizado
   - Destino personalizado
   - Monto a cobrar
   - Descripción (opcional)
3. Haz clic en **"Generar link compartible"**
4. El link se copia automáticamente al portapapeles
5. Comparte el link con tu cliente vía WhatsApp, email, etc.

### Para el cliente (realizar el pago)

1. Abre el link recibido (datos ya pre-llenados)
2. Verifica los datos del traslado
3. Completa sus datos personales:
   - Nombre completo
   - Email
   - Teléfono
4. Selecciona el método de pago (Mercado Pago o Flow)
5. Completa el pago en la ventana segura que se abre

## 🎨 Características

### Validación en tiempo real
- Todos los campos obligatorios están marcados con asterisco rojo (*)
- Los botones de pago solo se habilitan cuando todos los campos son válidos
- Validación de formato de email
- Formateo automático de montos en pesos chilenos (CLP)

### Seguridad
- Integración directa con el backend existente (`/create-payment`)
- Sin modificaciones al backend
- Validación de datos antes de enviar
- Apertura de ventana segura para pagos

### Experiencia de usuario
- Interfaz limpia y profesional
- Mensajes de ayuda contextuales
- Feedback visual inmediato
- Compatible con dispositivos móviles
- Pre-llenado automático desde URL

## 🛠️ Implementación técnica

### Archivos nuevos
- `src/components/PagoPersonalizado.jsx` - Componente principal del módulo

### Archivos modificados
- `src/App.jsx` - Agregado import, resolver y renderizado condicional
- `src/components/Header.jsx` - Agregado link en navegación

### Integración con backend
El módulo usa el mismo endpoint del backend que el sistema regular:
```javascript
POST /create-payment
{
  gateway: "mercadopago" | "flow",
  amount: number,
  description: string,
  email: string,
  reservationId: null
}
```

**No se requieren cambios en el backend.**

## 📊 Casos de uso

### Ejemplo 1: Traslado a Carahue
```
Origen: Aeropuerto La Araucanía
Destino: Carahue
Monto: $35.000
```

### Ejemplo 2: Transfer a Lonquimay
```
Origen: Temuco
Destino: Lonquimay
Monto: $45.000
Descripción: Transfer urgente con equipaje especial
```

### Ejemplo 3: Ruta personalizada
```
Origen: Victoria
Destino: Curacautín
Monto: $28.000
```

## 🔒 Notas de seguridad

- El módulo no guarda información sensible en el frontend
- Los pagos se procesan a través de las pasarelas oficiales (Flow y Mercado Pago)
- Los emails de confirmación se envían desde el backend
- No se exponen credenciales de API en el cliente

## 🌐 Compatibilidad

- ✅ Funciona en localhost (desarrollo)
- ✅ Funciona en Hostinger (producción)
- ✅ Compatible con navegadores modernos
- ✅ Responsive (móvil y desktop)
- ✅ No requiere cambios en PHP del servidor

## 💡 Recomendaciones de uso

1. **Para administrador**: Genera links pre-llenados y compártelos directamente con clientes
2. **Para clientes**: Envíales el link limpio `/?view=pago-personalizado` y que ellos completen todo
3. **Para marketing**: Úsalo en campañas específicas con destinos personalizados

## 🎯 Beneficios

- ⏱️ **Ahorro de tiempo**: El administrador ya no necesita generar links manualmente
- 🤝 **Autonomía del cliente**: Los clientes pueden pagar sin intermediarios
- 📈 **Escalabilidad**: Maneja múltiples solicitudes simultáneas sin problemas
- 💼 **Profesionalismo**: Proceso automatizado y confiable
- 🔄 **Flexibilidad**: Funciona para cualquier origen/destino/monto

## 📞 Soporte

Para cualquier consulta o problema:
- WhatsApp: +56 9 3664 3540
- Email: contacto@transportesaraucaria.cl

---

**Versión**: 1.0  
**Fecha**: Octubre 2025  
**Autor**: Sistema Transportes Araucaria
