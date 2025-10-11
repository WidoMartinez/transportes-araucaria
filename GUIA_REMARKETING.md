# 📊 Guía de Usuario: Sistema de Remarketing

## ¿Qué es y para qué sirve?

El sistema de captura de leads te permite **guardar automáticamente los datos de todos los usuarios que visitan tu sitio**, incluso si no completan la reserva o no pagan. Esto es extremadamente valioso para:

1. **Remarketing**: Contactar usuarios que mostraron interés pero no compraron
2. **Análisis de conversión**: Entender dónde abandonan el proceso los usuarios
3. **Campañas de seguimiento**: Enviar emails o WhatsApps personalizados
4. **Optimización**: Mejorar el proceso de reserva basándote en datos reales

## ✨ Lo que ya tenías (y ahora está mejorado)

**Antes**: Tu sistema ya guardaba reservas en la base de datos, incluso sin pago.

**Ahora**: Además de las reservas, capturas **leads** que son usuarios que:
- Llenaron parte del formulario pero no enviaron
- Visitaron la página pero no cotizaron
- Cotizaron pero no pagaron
- Abandonaron en cualquier punto del proceso

## 🚀 Cómo Funciona Automáticamente

### 1. Captura Pasiva en el Frontend

Cuando un usuario:
1. Llena su nombre, email o teléfono
2. Espera 3 segundos sin hacer nada
3. **→ El sistema guarda automáticamente sus datos**

Ejemplo: Un usuario escribe su email "maria@example.com" y destino "Aeropuerto". Después de 3 segundos, esos datos ya están guardados para remarketing, **aunque el usuario cierre la página**.

### 2. Captura al Salir

Si el usuario cierra la pestaña o navega a otro sitio:
- **→ El sistema envía sus datos antes de que se vaya**
- Usa la API `sendBeacon` que garantiza el envío

### 3. Datos Capturados

Para cada lead se guarda:
- **Contacto**: Nombre, email, teléfono
- **Viaje deseado**: Origen, destino, fecha, número de pasajeros
- **Comportamiento**: 
  - Cuánto tiempo estuvo en el sitio
  - Qué páginas visitó
  - Hasta dónde llegó en el proceso (ej: "cotización", "pago")
- **Tecnología**:
  - Dispositivo (mobile, tablet, desktop)
  - Navegador (Chrome, Safari, etc.)
  - Sistema operativo
  - Dirección IP
- **Marketing**:
  - De dónde vino (Google Ads, Facebook, directo, etc.)
  - Parámetros UTM de tus campañas

## 📱 Panel de Administración de Leads

### Acceder al Panel

1. Ve a tu sitio y agrega `?admin=true` en la URL
   - Ejemplo: `https://tudominio.com/?admin=true`
2. Verás el **Panel Administrativo** con varias pestañas
3. Haz clic en **"Leads Remarketing"**

### Vista Principal

Verás una tabla con todos los leads capturados:

| Columna | Descripción |
|---------|-------------|
| **Contacto** | Nombre, email, teléfono del usuario |
| **Viaje** | Ruta deseada (origen → destino) y fecha |
| **Paso Alcanzado** | Dónde abandonó (ej: "cotización", "formulario_inicial") |
| **Dispositivo** | Mobile, tablet o desktop |
| **Estado** | Nuevo, Contactado, Interesado, No interesado, Convertido |
| **Fecha** | Cuándo se capturó el lead |
| **Acciones** | Botón "Contactar" |

### Filtros Disponibles

**Estado de Conversión:**
- **Todos**: Muestra todos los leads
- **No convertidos**: Solo los que NO completaron reserva (ideal para remarketing)
- **Convertidos**: Los que sí completaron reserva

**Estado Remarketing:**
- **Nuevo**: Recién capturados, no contactados
- **Contactado**: Ya intentaste contactarlos
- **Interesado**: Mostraron interés en completar la reserva
- **No interesado**: No quieren continuar
- **Convertido**: Se convirtieron en clientes

### Contactar un Lead

1. Haz clic en **"Contactar"** junto a cualquier lead
2. Se abre un diálogo con:
   - Información completa del lead
   - Selector de nuevo estado
   - Campo de notas
3. Selecciona el nuevo estado (ej: "Contactado")
4. Escribe notas: "Cliente interesado, llamar mañana 10am"
5. Haz clic en **"Guardar Contacto"**
6. El contador de intentos de contacto aumenta automáticamente

## 💡 Casos de Uso Prácticos

### Caso 1: Remarketing Diario
**Objetivo**: Contactar leads nuevos cada día

**Pasos**:
1. Entra al panel cada mañana
2. Filtra por "No convertidos" + "Nuevo"
3. Revisa los leads del día anterior
4. Para cada uno:
   - Llama por teléfono o envía WhatsApp
   - Marca como "Contactado" y agrega notas
   - Si muestra interés → "Interesado"
   - Si no responde → deja en "Contactado" para reintento

### Caso 2: Campañas de Email
**Objetivo**: Enviar emails a usuarios que cotizaron pero no pagaron

**Pasos**:
1. Filtra por "No convertidos"
2. Busca manualmente (o exporta) leads con paso "cotización"
3. Copia los emails
4. Envía email personalizado:
   ```
   Hola [Nombre],
   
   Vi que cotizaste un viaje a [Destino] para el [Fecha].
   ¿Necesitas ayuda para completar tu reserva?
   
   Tenemos un 10% de descuento si reservas hoy.
   ```

### Caso 3: Análisis de Abandono
**Objetivo**: Entender dónde pierdes clientes

**Pasos**:
1. Exporta todos los leads
2. Revisa la columna "Paso Alcanzado"
3. Si muchos abandonan en "cotización" → el precio puede ser alto
4. Si abandonan en "formulario_inicial" → el formulario puede ser confuso
5. Optimiza según los datos

### Caso 4: Google Ads Remarketing
**Objetivo**: Crear audiencias para tus campañas

**Pasos**:
1. Filtra por "No convertidos" de los últimos 30 días
2. Exporta los emails
3. Sube a Google Ads como audiencia personalizada
4. Crea anuncios específicos para estos usuarios
5. Cuando se conviertan, aparecerán automáticamente como "Convertido"

## 📊 Consultas SQL Útiles

Si tienes acceso a la base de datos, estas queries te ayudarán:

### Ver leads no convertidos de la última semana
```sql
SELECT nombre, email, telefono, destino, fecha, paso_alcanzado
FROM leads
WHERE convertido = 0
  AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
ORDER BY created_at DESC;
```

### Tasa de conversión por fuente de tráfico
```sql
SELECT 
  source,
  COUNT(*) as total_leads,
  SUM(CASE WHEN convertido = 1 THEN 1 ELSE 0 END) as convertidos,
  ROUND(SUM(CASE WHEN convertido = 1 THEN 1 ELSE 0 END) / COUNT(*) * 100, 2) as tasa_conversion
FROM leads
GROUP BY source
ORDER BY total_leads DESC;
```

### Leads calientes (mucho tiempo en sitio, no contactados)
```sql
SELECT nombre, email, telefono, destino, tiempo_en_sitio
FROM leads
WHERE convertido = 0
  AND estado_remarketing = 'nuevo'
  AND tiempo_en_sitio > 120
ORDER BY tiempo_en_sitio DESC
LIMIT 20;
```

### Rendimiento por dispositivo
```sql
SELECT 
  dispositivo,
  COUNT(*) as total,
  AVG(tiempo_en_sitio) as tiempo_promedio,
  SUM(CASE WHEN convertido = 1 THEN 1 ELSE 0 END) as conversiones
FROM leads
GROUP BY dispositivo;
```

## ⚠️ Consideraciones Importantes

### Privacidad y Cumplimiento Legal

**IMPORTANTE**: Este sistema captura datos personales. Debes:

1. ✅ **Tener un aviso de privacidad** en tu sitio que mencione:
   - Qué datos capturas
   - Para qué los usas (mejorar servicio, remarketing)
   - Cuánto tiempo los guardas
   - Cómo pueden solicitar eliminación

2. ✅ **GDPR** (si tienes usuarios europeos):
   - Requiere consentimiento explícito
   - Permite que soliciten ver sus datos
   - Permite que soliciten eliminación

3. ✅ **Ley de Protección de Datos de Chile**:
   - Informa claramente el uso de datos
   - Mantén los datos seguros
   - No los vendas ni compartas sin consentimiento

### Ejemplo de Aviso de Privacidad

Agrega esto en tu footer o formulario:

```
Al usar este sitio, aceptas nuestra Política de Privacidad.
Capturamos información de contacto y navegación para mejorar 
nuestro servicio y poder contactarte sobre tu reserva.
```

### Seguridad

- ✅ Los datos se guardan en tu base de datos segura
- ✅ No se comparten con terceros automáticamente
- ✅ Solo tu equipo con acceso admin puede verlos
- ⚠️ No guardes contraseñas ni datos bancarios (esto NO lo hace el sistema)

### Retención de Datos

**Recomendación**: Define una política, por ejemplo:
- Leads no convertidos: Guardar 90 días
- Leads convertidos: Guardar indefinidamente (son clientes)
- Leads "no interesado": Eliminar después de 30 días

Puedes implementar limpieza automática con esta query:
```sql
DELETE FROM leads
WHERE convertido = 0
  AND estado_remarketing = 'no_interesado'
  AND created_at < DATE_SUB(NOW(), INTERVAL 30 DAY);
```

## 🎯 Estrategias de Remarketing Recomendadas

### 1. Seguimiento Inmediato (Primeras 24 horas)

**Por qué funciona**: El interés es alto, aún recuerdan tu servicio.

**Acciones**:
- Email automático: "¿Necesitas ayuda para completar tu reserva?"
- WhatsApp: "Hola [Nombre], vi que cotizaste un viaje a [Destino]"
- Oferta: "Reserva hoy y obtén 10% de descuento"

### 2. Recordatorio (3-7 días después)

**Por qué funciona**: Puede que hayan estado comparando opciones.

**Acciones**:
- Email con testimonios de clientes
- Mostrar beneficios únicos (seguridad, puntualidad)
- "Tu cotización sigue vigente para el [Fecha]"

### 3. Última Oportunidad (7-14 días)

**Por qué funciona**: Sentido de urgencia.

**Acciones**:
- "¡Última oportunidad! Descuento especial del 15%"
- "Solo quedan 2 vehículos disponibles para [Fecha]"
- "Esta es la última vez que te contactaremos"

### 4. Retargeting Ads

**Por qué funciona**: Los ves en todas partes.

**Acciones**:
- Crear audiencia en Google Ads con los emails
- Crear audiencia en Facebook con los emails
- Mostrar anuncios recordándoles tu servicio

### 5. Campañas Estacionales

**Por qué funciona**: Aprovechas fechas clave.

**Acciones**:
- Verano: "¿Ya planificaste tu viaje a las termas?"
- Fiestas Patrias: "Reserva transporte para las celebraciones"
- Fin de año: "Cierra el año con un viaje increíble"

## 📈 Métricas para Monitorear

### Semanalmente
- ✅ Número de leads nuevos
- ✅ Tasa de conversión de leads a reservas
- ✅ Leads sin contactar

### Mensualmente
- ✅ Tasa de conversión por fuente (Google Ads, Facebook, etc.)
- ✅ Tiempo promedio en sitio antes de abandonar
- ✅ Paso del proceso con más abandonos
- ✅ Dispositivo con mejor conversión

### Dashboard Recomendado
```
┌─────────────────────────────────────────┐
│  LEADS ESTE MES                         │
│                                         │
│  Total: 150                             │
│  Convertidos: 45 (30%)                  │
│  Pendientes contacto: 87                │
│  No interesados: 18                     │
│                                         │
│  FUENTES TOP:                           │
│  1. Google Ads: 65 leads (35% conv)     │
│  2. Directo: 42 leads (28% conv)        │
│  3. Facebook: 28 leads (18% conv)       │
│                                         │
│  PASO CON MÁS ABANDONO:                 │
│  Cotización → 45% abandonan aquí        │
└─────────────────────────────────────────┘
```

## 🛠️ Solución de Problemas

### "No veo ningún lead en el panel"

**Causas posibles**:
1. La tabla no se ha creado en la base de datos
   - **Solución**: Ejecuta `npm run start` en el backend, automáticamente crea la tabla
2. No hay leads capturados aún
   - **Solución**: Prueba llenando el formulario tú mismo y espera 3 segundos
3. Problema de conexión con la API
   - **Solución**: Verifica que el backend esté corriendo

### "Los leads no se capturan automáticamente"

**Causas posibles**:
1. JavaScript desactivado en el navegador
2. AdBlockers bloqueando la captura
3. Error en el hook de React

**Solución**: Abre la consola del navegador (F12) y busca mensajes de error.

### "No puedo actualizar el estado de un lead"

**Causas posibles**:
1. Problema de conexión con la API
2. Permisos insuficientes

**Solución**: Verifica que el endpoint `/api/leads/:id/contactar` esté funcionando.

## 📚 Recursos Adicionales

- **Documentación técnica completa**: Ver `REMARKETING.md`
- **Tests del sistema**: `backend/test-leads.js`
- **Modelo de datos**: `backend/models/Lead.js`
- **Hook de captura**: `src/hooks/useLeadCapture.js`
- **Panel admin**: `src/components/AdminLeads.jsx`

## 🎉 ¡Empieza Ahora!

1. ✅ El sistema ya está activo y capturando leads automáticamente
2. ✅ Entra al panel de administración (?admin=true)
3. ✅ Ve a la pestaña "Leads Remarketing"
4. ✅ Filtra por "No convertidos" + "Nuevo"
5. ✅ ¡Empieza a contactar tus primeros leads!

---

**¿Necesitas ayuda?** Consulta la documentación técnica en `REMARKETING.md` o contacta al equipo de desarrollo.
