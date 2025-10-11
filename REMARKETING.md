# Sistema de Captura de Leads para Remarketing

## Descripción General

El sistema de reservas express ahora incluye un módulo completo de captura de leads que permite almacenar datos de usuarios que interactúan con el formulario pero no completan la reserva o el pago. Estos datos son valiosos para estrategias de remarketing y seguimiento de conversiones.

## Características Implementadas

### 1. Captura Automática de Datos

El sistema captura automáticamente:

- ✅ **Datos de contacto**: nombre, email, teléfono
- ✅ **Datos del viaje**: origen, destino, fecha, pasajeros
- ✅ **Comportamiento del usuario**:
  - Última página visitada
  - Tiempo total en el sitio
  - Paso del proceso alcanzado
- ✅ **Información técnica**:
  - Tipo de dispositivo (mobile, tablet, desktop)
  - Navegador utilizado
  - Sistema operativo
  - Dirección IP
  - User Agent completo
- ✅ **Fuente de tráfico**:
  - Parámetros UTM (utm_source, utm_medium, utm_campaign, utm_term, utm_content)
  - Source (web, google_ads, facebook, etc.)

### 2. Modelos de Base de Datos

#### Modelo Lead (`backend/models/Lead.js`)

Tabla: `leads`

Campos principales:
- `id`: Identificador único
- `email`, `telefono`, `nombre`: Datos de contacto
- `origen`, `destino`, `fecha`, `pasajeros`: Datos del viaje
- `ultimaPagina`, `tiempoEnSitio`, `pasoAlcanzado`: Comportamiento
- `dispositivo`, `navegador`, `sistemaOperativo`: Info técnica
- `utmSource`, `utmMedium`, `utmCampaign`, etc.: Marketing
- `convertido`: Boolean que indica si el lead se convirtió en reserva
- `reservaId`: ID de la reserva si se convirtió
- `estadoRemarketing`: Estado del proceso de seguimiento
- `intentosContacto`: Contador de intentos de contacto
- `notas`: Notas del equipo de ventas

#### Modelo Reserva (existente, mejorado)

El modelo de Reserva ya capturaba datos completos antes del pago:
- Estado `pendiente_detalles` para reservas express sin pagar
- Todos los datos del usuario y viaje
- Información de pricing y descuentos
- IP y User Agent para análisis

### 3. Endpoints API

#### POST `/capturar-lead`

Captura o actualiza un lead basado en email/teléfono.

**Request Body:**
```json
{
  "nombre": "Juan Pérez",
  "email": "juan@example.com",
  "telefono": "+56912345678",
  "origen": "Temuco",
  "destino": "Santiago",
  "fecha": "2025-10-15",
  "pasajeros": 2,
  "ultimaPagina": "/reservas",
  "tiempoEnSitio": 180,
  "pasoAlcanzado": "cotizacion",
  "dispositivo": "mobile",
  "navegador": "Chrome",
  "sistemaOperativo": "Android",
  "source": "google_ads",
  "utmSource": "google",
  "utmMedium": "cpc",
  "utmCampaign": "verano2025"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Lead capturado correctamente",
  "leadId": 123
}
```

#### GET `/api/leads`

Obtiene lista de leads para remarketing.

**Query Parameters:**
- `page`: Número de página (default: 1)
- `limit`: Resultados por página (default: 50, max: 100)
- `convertido`: "true" | "false" - Filtrar por estado de conversión
- `estadoRemarketing`: "nuevo" | "contactado" | "interesado" | "no_interesado" | "convertido"
- `desde`: Fecha inicio (ISO 8601)
- `hasta`: Fecha fin (ISO 8601)

**Ejemplo:**
```
GET /api/leads?convertido=false&estadoRemarketing=nuevo&page=1&limit=50
```

**Response:**
```json
{
  "success": true,
  "leads": [...],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 50,
    "totalPages": 3
  }
}
```

#### PUT `/api/leads/:id/contactar`

Marca un lead como contactado y actualiza su estado.

**Request Body:**
```json
{
  "estadoRemarketing": "contactado",
  "notas": "Cliente interesado, llamar mañana a las 10am"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Lead actualizado correctamente",
  "lead": { ... }
}
```

### 4. Hook de React (`src/hooks/useLeadCapture.js`)

Hook personalizado que se integra automáticamente en el formulario de reservas.

**Características:**
- Captura datos con debounce de 3 segundos después de inactividad
- Usa `sendBeacon` API para capturar datos al salir de la página
- Detecta automáticamente dispositivo, navegador y SO
- Extrae parámetros UTM de la URL
- No interrumpe la experiencia del usuario si falla

**Uso:**
```javascript
import { useLeadCapture } from "./hooks/useLeadCapture";

function MyComponent() {
  const [formData, setFormData] = useState({...});
  const apiUrl = "https://transportes-araucaria.onrender.com";
  
  // Automáticamente captura leads
  useLeadCapture(formData, "paso_actual", apiUrl);
  
  // ...resto del componente
}
```

### 5. Conversión Automática de Leads

Cuando un lead se convierte en reserva:
1. El endpoint `/enviar-reserva-express` busca leads existentes por email/teléfono
2. Si encuentra un lead sin convertir, lo marca como convertido
3. Asocia la reserva al lead mediante `reservaId`
4. Cambia el estado a `"convertido"`

## Estrategias de Remarketing Recomendadas

### 1. Segmentación de Leads

Puedes segmentar leads por:
- **Paso alcanzado**: Enfócate en usuarios que llegaron lejos en el proceso
- **Tiempo en sitio**: Usuarios que pasaron más tiempo muestran mayor interés
- **Origen del tráfico**: Ajusta mensajes según fuente (Google Ads, Facebook, etc.)
- **Dispositivo**: Optimiza campañas para mobile/desktop
- **Destino deseado**: Crea campañas específicas por destino

### 2. Automatización de Contacto

```javascript
// Ejemplo: Obtener leads calientes (no convertidos, alta intención)
GET /api/leads?convertido=false&estadoRemarketing=nuevo

// Filtrar por tiempo en sitio > 120 segundos y paso alcanzado = cotizacion
// (Hacer filtrado adicional en el cliente o backend)
```

### 3. Email Marketing

Usa los datos capturados para:
- Enviar recordatorios personalizados
- Ofrecer descuentos especiales
- Mostrar testimonios de clientes similares
- Recordar fechas de viaje próximas

### 4. Google Ads / Facebook Ads

- Crea audiencias personalizadas con los emails capturados
- Implementa pixel de conversión cuando `convertido = true`
- Ajusta pujas basándote en tasas de conversión por fuente

## Consideraciones de Privacidad

⚠️ **Importante**: Este sistema captura datos personales. Asegúrate de:

1. **Consentimiento**: Incluir aviso de privacidad y términos de uso
2. **GDPR/CCPA**: Si tienes usuarios de EU o California, cumple con regulaciones
3. **Seguridad**: Los datos se almacenan en base de datos segura
4. **Retención**: Define políticas de retención de datos
5. **Opt-out**: Permite que usuarios soliciten eliminación de datos

## Monitoreo y Análisis

### Métricas Clave

Consultas SQL útiles para análisis:

```sql
-- Tasa de conversión general
SELECT 
  COUNT(*) as total_leads,
  SUM(CASE WHEN convertido = 1 THEN 1 ELSE 0 END) as convertidos,
  (SUM(CASE WHEN convertido = 1 THEN 1 ELSE 0 END) / COUNT(*) * 100) as tasa_conversion
FROM leads;

-- Leads por fuente de tráfico
SELECT 
  source,
  COUNT(*) as total,
  SUM(CASE WHEN convertido = 1 THEN 1 ELSE 0 END) as convertidos
FROM leads
GROUP BY source
ORDER BY total DESC;

-- Leads por dispositivo
SELECT 
  dispositivo,
  COUNT(*) as total,
  AVG(tiempoEnSitio) as tiempo_promedio
FROM leads
GROUP BY dispositivo;

-- Leads sin contactar (oportunidades)
SELECT *
FROM leads
WHERE convertido = 0 
  AND estadoRemarketing = 'nuevo'
  AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
ORDER BY created_at DESC;
```

## Migración de Base de Datos

El modelo Lead se sincronizará automáticamente al iniciar el servidor. Si necesitas crear la tabla manualmente:

```sql
CREATE TABLE IF NOT EXISTS leads (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(255),
  email VARCHAR(255),
  telefono VARCHAR(50),
  origen VARCHAR(255),
  destino VARCHAR(255),
  fecha DATE,
  pasajeros INT,
  ultima_pagina VARCHAR(500),
  tiempo_en_sitio INT,
  paso_alcanzado VARCHAR(100),
  dispositivo VARCHAR(50),
  navegador VARCHAR(100),
  sistema_operativo VARCHAR(100),
  ip_address VARCHAR(45),
  user_agent TEXT,
  source VARCHAR(100) DEFAULT 'web',
  utm_source VARCHAR(255),
  utm_medium VARCHAR(255),
  utm_campaign VARCHAR(255),
  utm_term VARCHAR(255),
  utm_content VARCHAR(255),
  convertido BOOLEAN DEFAULT FALSE,
  reserva_id INT,
  intentos_contacto INT DEFAULT 0,
  ultimo_contacto DATETIME,
  estado_remarketing ENUM('nuevo', 'contactado', 'interesado', 'no_interesado', 'convertido') DEFAULT 'nuevo',
  notas TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_telefono (telefono),
  INDEX idx_convertido (convertido),
  INDEX idx_estado_remarketing (estado_remarketing),
  INDEX idx_created_at (created_at),
  INDEX idx_source (source)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## Próximos Pasos

1. ✅ **Implementado**: Sistema de captura automática
2. ✅ **Implementado**: API REST para gestión de leads
3. ✅ **Implementado**: Hook de React para frontend
4. 📋 **Pendiente**: Panel de administración para ver leads
5. 📋 **Pendiente**: Sistema de notificaciones para leads calientes
6. 📋 **Pendiente**: Integración con herramientas de email marketing
7. 📋 **Pendiente**: Dashboard de métricas de conversión

## Soporte

Para más información o soporte, contacta al equipo de desarrollo.
