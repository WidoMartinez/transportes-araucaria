# 📱 Guía de Uso: Configuración del Modal de WhatsApp

## 🎯 ¿Qué es esto?

Un sistema que te permite **activar o desactivar** el modal promocional que aparece cuando los usuarios hacen clic en el botón de WhatsApp.

## 🚀 Cómo Usar (Administradores)

### Paso 1: Acceder al Panel de Configuración

1. Inicia sesión en el panel de administración
2. En el menú lateral, ve a: **Configuración → Configuración General**

### Paso 2: Cambiar el Estado del Modal

Verás una tarjeta con el título **"Modal de Intercepción de WhatsApp"**

**Para Desactivar:**
- Clic en el switch para que quede en posición OFF (izquierda)
- Verás una alerta verde: "Modal de WhatsApp desactivado correctamente"

**Para Activar:**
- Clic en el switch para que quede en posición ON (derecha)
- Verás una alerta verde: "Modal de WhatsApp activado correctamente"

### Paso 3: Verificar el Cambio

1. Abre una ventana privada de tu navegador
2. Ve a la página principal del sitio
3. Haz clic en el botón de WhatsApp
4. Observa el comportamiento:
   - **Si está activo:** Aparece el modal con descuentos
   - **Si está inactivo:** Se abre WhatsApp directamente

## 🎨 Apariencia del Panel

```
┌─────────────────────────────────────────────────────────┐
│ ⚙️  Configuración General                                │
│    Gestiona las configuraciones globales del sistema     │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 💬 Modal de Intercepción de WhatsApp                    │
│                                                          │
│ Controla si aparece el modal cuando los usuarios        │
│ intentan contactar por WhatsApp                         │
│                                                          │
│ ┌────────────────────────────────────────────────────┐ │
│ │  ✅ Estado: Activo                        ⚪→○     │ │
│ │     El modal aparece antes de abrir WhatsApp       │ │
│ └────────────────────────────────────────────────────┘ │
│                                                          │
│ Comportamiento:                                         │
│ ✅ Activo: Muestra un modal incentivando la reserva    │
│    online con información de descuentos                 │
│                                                          │
│ ⚪ Inactivo: Abre WhatsApp directamente sin modal      │
│                                                          │
│ ℹ️  Nota: El tracking de Google Ads se mantiene       │
│    activo en ambos casos                               │
└─────────────────────────────────────────────────────────┘
```

## 📊 ¿Qué Sucede en el Sitio Web?

### Comportamiento con Modal ACTIVO (por defecto)

```
Usuario en la página
       ↓
Hace clic en botón WhatsApp
       ↓
📊 Google Ads registra el clic
       ↓
Aparece Modal con:
  • Descuento online (si hay)
  • Confirmación instantánea
  • Comprobante por email
  • Sin esperas
       ↓
Usuario tiene 2 opciones:
  1. "Reservar Ahora" → Va a formulario
  2. "Continuar a WhatsApp" → Abre WhatsApp
```

### Comportamiento con Modal INACTIVO

```
Usuario en la página
       ↓
Hace clic en botón WhatsApp
       ↓
📊 Google Ads registra el clic
       ↓
Se abre WhatsApp directamente
(Sin mostrar modal)
```

## 🔒 Seguridad

- ✅ Solo administradores pueden cambiar esta configuración
- ✅ Todos los cambios se registran en el historial de auditoría
- ✅ Los usuarios regulares solo pueden ver el efecto del cambio

## 💡 Casos de Uso Recomendados

### ¿Cuándo ACTIVAR el modal?

- ✅ Cuando tienes descuentos online activos
- ✅ En temporada alta con alta demanda
- ✅ Para incentivar reservas directas en el sitio
- ✅ Cuando quieres reducir carga de consultas por WhatsApp

### ¿Cuándo DESACTIVAR el modal?

- ✅ En temporada baja para facilitar contacto directo
- ✅ Cuando no hay descuentos online activos
- ✅ Si los usuarios reportan que el modal es molesto
- ✅ Para pruebas A/B de conversión

## 📈 Métricas para Monitorear

Para evaluar qué configuración funciona mejor, revisa:

1. **Tasa de Conversión**
   - ¿Cuántos usuarios completan una reserva?
   - ¿Cambia con el modal activo/inactivo?

2. **Tiempo de Respuesta**
   - Con modal: Reservas instantáneas
   - Sin modal: Tiempo de respuesta por WhatsApp

3. **Valor Promedio de Reserva**
   - ¿Los usuarios que reservan online gastan más?

4. **Satisfacción del Cliente**
   - Encuestas post-servicio
   - Comentarios en redes sociales

## 🐛 Solución de Problemas

### El modal sigue apareciendo después de desactivarlo

1. Limpia la caché del navegador (Ctrl+Shift+Delete)
2. O abre una ventana privada
3. El cambio debería verse inmediatamente

### No puedo cambiar la configuración

1. Verifica que estés conectado como administrador
2. Revisa que tu sesión no haya expirado
3. Intenta cerrar sesión y volver a entrar

### El cambio no se guarda

1. Verifica tu conexión a internet
2. Revisa la consola del navegador (F12) por errores
3. Contacta soporte técnico si persiste

## 🎓 Preguntas Frecuentes

**P: ¿El tracking de Google Ads funciona en ambos casos?**  
R: Sí, el tracking se mantiene activo independiente de la configuración del modal.

**P: ¿Los cambios son instantáneos?**  
R: Sí, los usuarios verán el cambio en su próxima interacción con el botón de WhatsApp.

**P: ¿Puedo programar cambios automáticos?**  
R: No por el momento, pero es una funcionalidad planeada para futuras versiones.

**P: ¿Afecta esto al SEO del sitio?**  
R: No, esta configuración solo afecta el comportamiento del botón de WhatsApp, no el contenido indexable.

**P: ¿Puedo ver un historial de cambios?**  
R: Sí, todos los cambios se registran en el log de auditoría del panel admin.

## 📞 Soporte

Si tienes problemas o preguntas sobre esta funcionalidad:

1. Revisa esta guía completa
2. Consulta la documentación técnica en `docs/WHATSAPP_INTERCEPT_CONFIG.md`
3. Revisa el resumen de implementación en `RESUMEN_IMPLEMENTACION.md`

---

**Última actualización:** 6 de Enero, 2026  
**Versión:** 1.0  
**Autor:** Sistema de Transportes Araucanía
