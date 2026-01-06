# Sistema de Evaluación de Conductores - Transportes Araucanía

## 📋 Descripción General

Sistema completo de evaluación de conductores similar a Uber, que permite a los clientes calificar el servicio recibido y opcionalmente dejar propinas. El sistema garantiza la privacidad de las propinas, que solo son visibles para administradores.

## 🎯 Características Principales

### 1. Evaluación Post-Servicio
- **Envío automático** de solicitud de evaluación al completar una reserva
- **Token único** válido por 72 horas
- **4 categorías** de evaluación (1-5 estrellas cada una):
  - ⏰ Puntualidad
  - ✨ Limpieza del vehículo
  - 🛡️ Conducción segura
  - 💬 Comunicación y trato
- **Comentario opcional** del cliente
- **Una evaluación por reserva** (no se puede evaluar dos veces)

### 2. Sistema de Propinas
- **Opciones predefinidas**: $0, $1.000, $3.000, $5.000 CLP
- **Monto personalizado** disponible
- **Pago mediante Flow** integrado
- **100% privado** para el conductor (solo visible para administradores)

### 3. Notificaciones por Correo
- **Cliente**: Recibe solicitud de evaluación con enlace único
- **Conductor**: Recibe notificación con calificaciones y comentarios (SIN propinas)
- **Admin**: Recibe notificación completa incluyendo propinas

### 4. Estadísticas por Conductor
- Promedio general y por categoría
- Total de evaluaciones vs servicios completados
- Porcentaje de evaluación
- Cantidad de evaluaciones 5 estrellas
- Categoría mejor calificada
- **Propinas totales** (solo visible para admin)

### 5. Panel Administrativo
- Ver todas las evaluaciones del sistema
- Filtrar por conductor, fecha y calificación
- Métricas generales del sistema
- Dashboard de estadísticas por conductor
- **Información completa de propinas**

## 🗄️ Estructura de Base de Datos

### Tabla: `evaluaciones_conductor`

Almacena todas las evaluaciones realizadas.

```sql
CREATE TABLE evaluaciones_conductor (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reserva_id INT NOT NULL UNIQUE,
  conductor_id INT NOT NULL,
  cliente_email VARCHAR(255) NOT NULL,
  cliente_nombre VARCHAR(255),
  
  -- Calificaciones (1-5)
  calificacion_puntualidad TINYINT NOT NULL,
  calificacion_limpieza TINYINT NOT NULL,
  calificacion_seguridad TINYINT NOT NULL,
  calificacion_comunicacion TINYINT NOT NULL,
  calificacion_promedio DECIMAL(3,2),
  
  comentario TEXT,
  
  -- Sistema de propinas
  propina_monto DECIMAL(10,2) DEFAULT 0,
  propina_pagada BOOLEAN DEFAULT FALSE,
  propina_flow_order INT,
  propina_flow_token VARCHAR(255),
  propina_payment_id VARCHAR(255),
  
  -- Control de notificaciones
  notificacion_conductor_enviada BOOLEAN DEFAULT FALSE,
  fecha_notificacion_conductor DATETIME,
  notificacion_admin_enviada BOOLEAN DEFAULT FALSE,
  fecha_notificacion_admin DATETIME,
  
  -- Control de evaluación
  token_evaluacion VARCHAR(100) NOT NULL UNIQUE,
  token_expiracion DATETIME,
  evaluada BOOLEAN DEFAULT FALSE,
  fecha_evaluacion DATETIME,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_reserva_id (reserva_id),
  INDEX idx_conductor_id (conductor_id),
  INDEX idx_token (token_evaluacion),
  INDEX idx_evaluada (evaluada),
  INDEX idx_flow_order (propina_flow_order),
  
  FOREIGN KEY (reserva_id) REFERENCES reservas(id) ON DELETE CASCADE,
  FOREIGN KEY (conductor_id) REFERENCES conductores(id) ON DELETE CASCADE
);
```

### Tabla: `estadisticas_conductor`

Almacena estadísticas agregadas para consultas rápidas.

```sql
CREATE TABLE estadisticas_conductor (
  id INT AUTO_INCREMENT PRIMARY KEY,
  conductor_id INT NOT NULL UNIQUE,
  
  -- Promedios de calificación
  promedio_general DECIMAL(3,2) DEFAULT 0,
  promedio_puntualidad DECIMAL(3,2) DEFAULT 0,
  promedio_limpieza DECIMAL(3,2) DEFAULT 0,
  promedio_seguridad DECIMAL(3,2) DEFAULT 0,
  promedio_comunicacion DECIMAL(3,2) DEFAULT 0,
  
  -- Contadores
  total_evaluaciones INT DEFAULT 0,
  total_servicios_completados INT DEFAULT 0,
  porcentaje_evaluado DECIMAL(5,2) DEFAULT 0,
  
  -- Estadísticas de propinas (solo admin)
  total_propinas_recibidas DECIMAL(10,2) DEFAULT 0,
  cantidad_propinas INT DEFAULT 0,
  promedio_propina DECIMAL(10,2) DEFAULT 0,
  
  -- Métricas adicionales
  cantidad_5_estrellas INT DEFAULT 0,
  mejor_calificado_en VARCHAR(50),
  
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_conductor_id (conductor_id),
  INDEX idx_promedio_general (promedio_general),
  
  FOREIGN KEY (conductor_id) REFERENCES conductores(id) ON DELETE CASCADE
);
```

## 🔄 Flujo Completo del Sistema

### 1. Completar Reserva
```
Admin/Usuario marca reserva como "completada"
  ↓
Backend detecta cambio de estado
  ↓
Verifica que tiene conductor asignado
  ↓
Crea registro en evaluaciones_conductor con token único (72h)
  ↓
Envía correo al cliente con enlace de evaluación
  ↓
Cliente recibe: https://www.transportesaraucania.cl/evaluar?token=XXXXX
```

### 2. Cliente Evalúa
```
Cliente hace clic en enlace
  ↓
GET /api/evaluaciones/validar-token/:token
  ↓
Si válido: Muestra formulario de evaluación
  ↓
Cliente completa 4 calificaciones + comentario opcional + propina
  ↓
POST /api/evaluaciones/guardar
  ↓
Guarda evaluación en BD
  ↓
Actualiza estadísticas del conductor
  ↓
Envía notificación al conductor (sin propina)
  ↓
Envía notificación al admin (con propina)
  ↓
Si propina > 0: Crea orden Flow y redirige
  ↓
Si propina = 0: Muestra mensaje de agradecimiento
```

### 3. Pago de Propina (si aplica)
```
Cliente redirigido a Flow
  ↓
Realiza pago de propina
  ↓
Flow envía webhook a /api/flow-confirmation
  ↓
Backend detecta paymentOrigin = "propina"
  ↓
Actualiza evaluaciones_conductor.propina_pagada = true
  ↓
Actualiza estadísticas de propinas del conductor
  ↓
Admin puede ver propina pagada en panel
```

## 📡 Endpoints API

### Públicos

#### `GET /api/evaluaciones/validar-token/:token`
Valida el token de evaluación y retorna datos de la reserva.

**Respuesta exitosa:**
```json
{
  "success": true,
  "estado": "valido",
  "data": {
    "evaluacionId": 123,
    "reserva": {
      "codigoReserva": "AR-20261206-0123",
      "origen": "Aeropuerto",
      "destino": "Temuco Centro",
      "fecha": "2026-12-06"
    },
    "conductor": {
      "nombre": "Juan Pérez"
    },
    "clienteNombre": "María García"
  }
}
```

**Estados posibles:**
- `valido`: Token válido, puede evaluar
- `invalido`: Token no existe
- `expirado`: Token expiró (>72 horas)
- `evaluada`: Ya fue evaluada

#### `POST /api/evaluaciones/guardar`
Guarda la evaluación y envía notificaciones.

**Body:**
```json
{
  "token": "abc123...",
  "calificaciones": {
    "puntualidad": 5,
    "limpieza": 4,
    "seguridad": 5,
    "comunicacion": 5
  },
  "comentario": "Excelente servicio, muy puntual",
  "propinaMonto": 3000
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Evaluación guardada exitosamente",
  "data": {
    "evaluacionId": 123,
    "promedio": 4.75,
    "paymentUrl": "https://www.flow.cl/app/web/pay.php?token=xxx"
  }
}
```

### Administrativos (requieren autenticación JWT)

#### `GET /api/conductores/:id/estadisticas`
Obtiene estadísticas de un conductor específico.

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "conductor": {
      "id": 5,
      "nombre": "Juan Pérez"
    },
    "estadisticas": {
      "promedioGeneral": 4.75,
      "promedioPuntualidad": 4.80,
      "promedioLimpieza": 4.70,
      "promedioSeguridad": 4.85,
      "promedioComunicacion": 4.65,
      "totalEvaluaciones": 45,
      "totalServiciosCompletados": 52,
      "porcentajeEvaluado": 86.54,
      "cantidad5Estrellas": 38,
      "mejorCalificadoEn": "seguridad"
    },
    "ultimasEvaluaciones": [...]
  }
}
```

#### `GET /api/admin/evaluaciones`
Lista todas las evaluaciones con filtros opcionales.

**Query params:**
- `conductorId` (opcional): ID del conductor
- `desde` (opcional): Fecha inicio (ISO 8601)
- `hasta` (opcional): Fecha fin (ISO 8601)
- `calificacionMin` (opcional): Calificación mínima (1-5)

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "metricas": {
      "totalEvaluaciones": 150,
      "promedioGlobal": 4.65,
      "totalPropinas": 450000
    },
    "evaluaciones": [
      {
        "id": 123,
        "fecha": "2026-12-06T14:30:00Z",
        "conductor": {
          "id": 5,
          "nombre": "Juan Pérez"
        },
        "reserva": {
          "codigoReserva": "AR-20261206-0123",
          "fecha": "2026-12-06",
          "origen": "Aeropuerto",
          "destino": "Temuco"
        },
        "clienteNombre": "María García",
        "clienteEmail": "maria@example.com",
        "calificaciones": {
          "puntualidad": 5,
          "limpieza": 4,
          "seguridad": 5,
          "comunicacion": 5,
          "promedio": 4.75
        },
        "comentario": "Excelente servicio",
        "propinaMonto": 3000,
        "propinaPagada": true
      }
    ]
  }
}
```

## 📧 Sistema de Notificaciones (PHPMailer)

### 1. Solicitud de Evaluación al Cliente
**Archivo:** `enviar_correo_evaluacion.php`

Envía enlace único válido por 72 horas.

**Datos requeridos:**
```php
{
  "email": "cliente@example.com",
  "nombre": "María García",
  "codigoReserva": "AR-20261206-0123",
  "conductorNombre": "Juan Pérez",
  "enlaceEvaluacion": "https://..../evaluar?token=xxx",
  "fechaExpiracion": "09/12/2026"
}
```

### 2. Notificación al Conductor
**Archivo:** `enviar_notificacion_evaluacion_conductor.php`

**IMPORTANTE:** NO incluye información de propinas.

**Datos requeridos:**
```php
{
  "conductorEmail": "conductor@example.com",
  "conductorNombre": "Juan Pérez",
  "codigoReserva": "AR-20261206-0123",
  "clienteNombre": "María García",
  "calificaciones": {
    "puntualidad": 5,
    "limpieza": 4,
    "seguridad": 5,
    "comunicacion": 5,
    "promedio": 4.75
  },
  "comentario": "Excelente servicio"
}
```

### 3. Notificación al Admin
**Archivo:** `enviar_notificacion_evaluacion_admin.php`

**Incluye información completa** de propinas.

**Datos requeridos:**
```php
{
  "adminEmail": "admin@transportesaraucania.cl",
  "codigoReserva": "AR-20261206-0123",
  "conductorNombre": "Juan Pérez",
  "clienteNombre": "María García",
  "clienteEmail": "maria@example.com",
  "calificaciones": {...},
  "comentario": "Excelente servicio",
  "propinaMonto": 3000
}
```

## 🎨 Componentes Frontend

### 1. `Evaluar.jsx` (Página Pública)
Página de evaluación accesible mediante enlace único.

**URL:** `/evaluar?token=XXXXX`

**Estados manejados:**
- `validando`: Verificando token
- `valido`: Formulario de evaluación
- `invalido`: Token no válido
- `expirado`: Token expiró
- `evaluada`: Ya evaluada

### 2. `EvaluarServicio.jsx` (Formulario)
Formulario completo de evaluación con:
- Sistema de estrellas interactivo (hover y click)
- 4 categorías obligatorias
- Comentario opcional (0-500 caracteres)
- Selector de propina con opciones predefinidas
- Integración con Flow para pagos

### 3. `AdminEvaluaciones.jsx` (Panel Admin)
Panel administrativo completo con:
- Métricas generales (total, promedio, propinas)
- Filtros (conductor, fechas, calificación)
- Tabla de evaluaciones
- Modal de detalle
- **Información de propinas visible** (marcada como confidencial)

### 4. `EstadisticasConductor.jsx` (Dashboard)
Dashboard de estadísticas individuales con:
- Promedio general destacado
- Métricas principales
- Gráfico de categorías
- Últimas evaluaciones
- **NO muestra información de propinas**

## 🔐 Reglas de Privacidad

| Información | Conductor | Admin |
|-------------|-----------|-------|
| Calificaciones por categoría | ✅ Sí | ✅ Sí |
| Promedio general | ✅ Sí | ✅ Sí |
| Comentarios | ✅ Sí | ✅ Sí |
| Total de evaluaciones | ✅ Sí | ✅ Sí |
| Propina elegida | ❌ NO | ✅ Sí |
| Propina pagada | ❌ NO | ✅ Sí |
| Estadísticas de propinas totales | ❌ NO | ✅ Sí |
| Identidad del cliente (email) | ❌ Nombre solamente | ✅ Completa |

**Justificación:** Las propinas son privadas para evitar sesgos en el servicio y mantener la evaluación objetiva.

## 🧪 Testing

### Pruebas Manuales Recomendadas

1. **Flujo completo de evaluación**
   - Crear reserva con conductor
   - Cambiar estado a "completada"
   - Verificar recepción de correo con enlace
   - Abrir enlace y completar evaluación
   - Verificar notificaciones a conductor y admin

2. **Validación de token**
   - Token válido → Mostrar formulario
   - Token inválido → Mensaje de error
   - Token expirado (>72h) → Mensaje de expiración
   - Token ya usado → Mensaje "ya evaluada"

3. **Sistema de propinas**
   - Evaluación sin propina ($0)
   - Evaluación con propina predefinida
   - Evaluación con monto personalizado
   - Verificar pago en Flow
   - Confirmar webhook actualiza estado

4. **Privacidad**
   - Verificar que conductor NO ve propinas en sus notificaciones
   - Verificar que admin SÍ ve propinas en AdminEvaluaciones
   - Verificar que EstadisticasConductor NO muestra propinas

5. **Estadísticas**
   - Crear múltiples evaluaciones
   - Verificar cálculo de promedios
   - Verificar actualización en tiempo real
   - Verificar "mejor_calificado_en"

## 🚀 Despliegue

### Backend (Render.com)
Las migraciones se ejecutan automáticamente al iniciar el servidor:
```javascript
await addEvaluacionesConductorTable();
await addEstadisticasConductorTable();
```

### Frontend (Hostinger)
Los archivos PHP deben estar en el root del servidor:
- `enviar_correo_evaluacion.php`
- `enviar_notificacion_evaluacion_conductor.php`
- `enviar_notificacion_evaluacion_admin.php`

### Variables de Entorno
No se requieren nuevas variables. El sistema usa:
- `FLOW_API_KEY` (existente)
- `FLOW_SECRET_KEY` (existente)
- `BACKEND_URL` (existente)
- `FRONTEND_URL` (existente)
- `ADMIN_EMAIL` (para notificaciones admin)

## 📊 Métricas y KPIs

El sistema permite medir:
- **Tasa de evaluación**: % de reservas completadas que son evaluadas
- **Satisfacción general**: Promedio global de todas las evaluaciones
- **Conductores destacados**: Top 5 por promedio general
- **Categorías a mejorar**: Promedios más bajos por categoría
- **Propinas promedio**: Indicador de satisfacción extraordinaria
- **Tendencias temporales**: Evolución de calificaciones en el tiempo

## 🔧 Mantenimiento

### Limpieza de Datos
Considerar script para:
- Eliminar tokens expirados antiguos (>90 días)
- Archivar evaluaciones muy antiguas (>1 año)

### Monitoreo
- Rate de evaluaciones completadas vs enviadas
- Tiempo promedio para evaluar
- Errores en envío de correos
- Fallos en pagos de propinas

## 📝 Notas Técnicas

- Las estadísticas se actualizan automáticamente al guardar cada evaluación
- El sistema usa transacciones implícitas de Sequelize
- Los correos se encolan en `pending_emails` si falla el envío directo
- Flow webhook detecta propinas mediante `paymentOrigin = "propina"`
- Los tokens son hash SHA-256 de 64 caracteres

## 🆘 Soporte

Para problemas o dudas:
- **Backend**: Revisar logs en Render.com
- **Frontend**: Console del navegador
- **Correos**: Verificar logs de PHPMailer en Hostinger
- **Pagos**: Panel de Flow para transacciones

---

**Versión:** 1.0.0  
**Fecha:** Diciembre 2026  
**Autor:** Sistema de Evaluaciones - Transportes Araucanía
