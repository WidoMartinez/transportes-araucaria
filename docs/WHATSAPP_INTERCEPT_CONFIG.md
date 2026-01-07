# Sistema de Configuración del Modal de WhatsApp

Este documento describe el sistema de configuración que permite activar o desactivar el modal de intercepción de WhatsApp desde el panel de administración.

## 📋 Descripción General

El sistema permite a los administradores controlar si aparece un modal promocional cuando los usuarios intentan contactar por WhatsApp. Este modal incentiva las reservas online mostrando descuentos y beneficios.

### Comportamiento

- **Activo (por defecto):** Muestra el modal con descuentos y beneficios antes de abrir WhatsApp
- **Inactivo:** Abre WhatsApp directamente sin mostrar el modal

En ambos casos, el tracking de conversiones de Google Ads funciona correctamente.

## 🏗️ Arquitectura

### Backend

#### Modelo: `Configuracion.js`
- Tabla genérica para configuraciones clave-valor del sistema
- Campos:
  - `clave`: Identificador único de la configuración
  - `valor`: Valor almacenado como texto
  - `tipo`: Tipo de dato (string, number, boolean, json)
  - `descripcion`: Descripción legible de la configuración

#### Endpoints API

**GET `/api/configuracion/whatsapp-intercept`**
- Público (no requiere autenticación)
- Retorna el estado actual del modal
- Respuesta:
  ```json
  {
    "activo": true,
    "mensaje": "Modal de WhatsApp activo"
  }
  ```

**PUT `/api/configuracion/whatsapp-intercept`**
- Requiere autenticación de administrador
- Actualiza el estado del modal
- Body:
  ```json
  {
    "activo": true
  }
  ```
- Respuesta:
  ```json
  {
    "success": true,
    "activo": true,
    "mensaje": "Modal de WhatsApp activado correctamente"
  }
  ```

### Frontend

#### Componente Admin: `AdminConfiguracion.jsx`
- Panel de configuración general del sistema
- Switch para activar/desactivar el modal de WhatsApp
- Feedback visual de estado (activo/inactivo)
- Alertas de éxito/error al guardar cambios

#### Integración en Header: `Header.jsx`
- Carga la configuración al montar el componente
- Usa localStorage como caché para mejorar performance
- Consulta el backend para obtener el valor más actualizado
- Respeta la configuración antes de mostrar el modal

## 🚀 Flujo de Funcionamiento

### 1. Carga de Configuración (Header)
```
1. Componente Header se monta
2. Intenta leer de localStorage (caché)
3. Consulta al backend (/api/configuracion/whatsapp-intercept)
4. Actualiza estado local y localStorage
```

### 2. Clic en WhatsApp
```
Configuración Activa:
Usuario → Clic WhatsApp → Tracking Google Ads → Modal aparece → Usuario elige

Configuración Inactiva:
Usuario → Clic WhatsApp → Tracking Google Ads → Abre WhatsApp directamente
```

### 3. Cambio de Configuración (Admin)
```
1. Admin accede a Panel → Configuración General
2. Activa/desactiva el switch
3. PUT /api/configuracion/whatsapp-intercept
4. Se guarda en base de datos
5. Se registra en audit log
6. Usuarios verán el cambio en su próxima visita
```

## 📝 Archivos Modificados/Creados

### Backend
- ✅ `backend/models/Configuracion.js` - Nuevo modelo
- ✅ `backend/migrations/add-configuracion-table.js` - Nueva migración
- ✅ `backend/server-db.js` - Agregados endpoints y ejecución de migración

### Frontend
- ✅ `src/components/AdminConfiguracion.jsx` - Nuevo componente
- ✅ `src/components/AdminDashboard.jsx` - Agregada ruta para configuración
- ✅ `src/components/admin/layout/AdminSidebar.jsx` - Agregado menú
- ✅ `src/components/Header.jsx` - Integración de configuración

## 🧪 Testing

### Prueba del Modelo
```bash
cd backend
node test-configuracion.js
```

### Prueba Manual - Backend
```bash
# Obtener configuración (público)
curl http://localhost:3001/api/configuracion/whatsapp-intercept

# Actualizar configuración (requiere token)
curl -X PUT http://localhost:3001/api/configuracion/whatsapp-intercept \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"activo": false}'
```

### Prueba Manual - Frontend
1. Iniciar sesión como administrador
2. Ir a "Configuración General" en el menú lateral
3. Activar/desactivar el switch de "Modal de Intercepción de WhatsApp"
4. Verificar feedback visual
5. Abrir la página principal en una ventana privada
6. Hacer clic en el botón de WhatsApp
7. Verificar comportamiento según configuración

## 🔒 Seguridad

- ✅ Endpoint PUT protegido con autenticación JWT
- ✅ Validación de tipo de dato (boolean)
- ✅ Registro de cambios en audit log
- ✅ Endpoint GET público para mejor performance
- ✅ Caché con localStorage para reducir latencia

## �� Monitoreo

### Audit Log
Todos los cambios de configuración se registran en `admin_audit_logs`:
```sql
SELECT * FROM admin_audit_logs 
WHERE resource = 'whatsapp_intercept' 
ORDER BY created_at DESC;
```

### Tracking Google Ads
El tracking de conversiones funciona en ambos escenarios:
- ID de conversión: `AW-17529712870/M7-iCN_HtZUbEObh6KZB`
- Se dispara tanto en modal como en apertura directa

## 🔄 Futuras Mejoras

- [ ] Agregar más configuraciones al panel
- [ ] Implementar historial de cambios
- [ ] Agregar notificaciones push a usuarios sobre cambios
- [ ] Dashboard con métricas de uso del modal
- [ ] A/B testing automático

## 📚 Referencias

- Modelo similar: `ConfiguracionTarifaDinamica.js`
- Patrón de endpoints: Sección de pricing en `server-db.js`
- UI components: Shadcn/ui (Card, Switch, Alert)

