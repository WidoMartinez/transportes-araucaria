# 📚 Documentación del Sistema de Base de Datos

## 📖 Índice de Documentación

Este directorio contiene la documentación completa del sistema de base de datos para Transportes Araucaria, diseñado específicamente para soportar el nuevo formulario de reservas express.

### 📄 Documentos Principales

| Documento | Descripción | Audiencia |
|-----------|-------------|-----------|
| **[DISEÑO_BASE_DATOS.md](./DISEÑO_BASE_DATOS.md)** | Diseño completo y detallado del sistema | Arquitectos, Desarrolladores |
| **[DIAGRAMA_ER.md](./DIAGRAMA_ER.md)** | Diagrama entidad-relación visual | Todos |
| **[GUIA_RAPIDA_BD.md](./GUIA_RAPIDA_BD.md)** | Referencia rápida y comandos útiles | Desarrolladores |
| **[MIGRATION_README.md](./MIGRATION_README.md)** | Guía de migración original a MySQL | DevOps, Administradores |
| **[migrations/README.md](./migrations/README.md)** | Documentación de migraciones | Desarrolladores |

## 🎯 Resumen Ejecutivo

### ¿Qué es este sistema?

Sistema de base de datos MySQL diseñado para:
- ✅ Soportar reservas express en 2 pasos desde el hero
- ✅ Permitir completar detalles después del pago
- ✅ Gestionar múltiples descuentos y promociones
- ✅ Auditar todos los cambios en reservas
- ✅ Escalar con el crecimiento del negocio

### Componentes Principales

```
┌─────────────────────────────────────────────────────────┐
│              SISTEMA DE BASE DE DATOS                    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  📊 TABLAS PRINCIPALES                                   │
│  ├─ reservas (Reservas de clientes)                     │
│  ├─ destinos (Catálogo de destinos y precios)           │
│  ├─ codigos_descuento (Códigos promocionales)           │
│  ├─ promociones (Promociones por día)                   │
│  └─ descuentos_globales (Descuentos del sistema)        │
│                                                          │
│  📈 TABLAS OPCIONALES (Migraciones)                      │
│  └─ auditoria_reservas (Historial de cambios)           │
│                                                          │
│  🔧 HERRAMIENTAS                                         │
│  ├─ Migraciones automáticas                             │
│  ├─ Scripts de backup                                   │
│  └─ Consultas de reporte                                │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## 🚀 Inicio Rápido

### 1. Configuración Inicial

```bash
# Instalar dependencias
cd backend
npm install

# Configurar variables de entorno
cp env.example .env
# Editar .env con tus credenciales de Hostinger

# Probar conexión
npm run test:connection

# Ejecutar migración base
npm run migrate
```

### 2. Aplicar Mejoras Opcionales

```bash
# Agregar campos mejorados (conductor, geolocalización, feedback)
npm run migrate:enhanced

# Agregar tabla de auditoría
npm run migrate:auditoria

# O aplicar todas juntas
npm run migrate:all
```

### 3. Iniciar Servidor

```bash
# Desarrollo
npm run dev

# Producción
npm start
```

## 📊 Estructura de Datos

### Reserva Express - Datos Mínimos

Capturados en el Hero Express (Paso 1 y 2):

```javascript
{
  // Paso 1: Información del viaje
  origen: "Aeropuerto La Araucanía",
  destino: "Pucón",
  fecha: "2024-12-15",
  pasajeros: 2,
  
  // Paso 2: Datos personales
  nombre: "Juan Pérez",
  email: "juan@email.com",
  telefono: "+56912345678",
  
  // Calculado automáticamente
  precio: 45000,
  vehiculo: "Sedan",
  totalConDescuento: 38250,
  
  // Estado inicial
  estado: "pendiente",
  estadoPago: "pendiente"
}
```

### Completar Detalles Post-Pago

```javascript
{
  // Detalles opcionales agregados después
  hora: "14:30",
  numeroVuelo: "LA1234",
  hotel: "Hotel Antumalal",
  equipajeEspecial: "2 bicicletas",
  sillaInfantil: false,
  mensaje: "Llegada vuelo internacional",
  
  // Estado actualizado
  estado: "confirmada"
}
```

## 🔄 Flujos de Proceso

### Flujo Express Completo

```
1. HERO EXPRESS (Frontend)
   ├─ Captura datos mínimos
   ├─ Consulta precio en DESTINOS
   ├─ Aplica DESCUENTOS_GLOBALES
   ├─ Valida CODIGO_DESCUENTO (si aplica)
   └─ Crea RESERVA (estado: pendiente)

2. PASARELA DE PAGO
   ├─ Flow o Mercado Pago
   └─ Webhook actualiza RESERVA
       └─ estadoPago: pagado
       └─ estado: pendiente_detalles

3. COMPLETAR DETALLES (Post-pago)
   ├─ Cliente ingresa hora, vuelo, hotel
   ├─ Actualiza RESERVA
   └─ estado: confirmada

4. OPERACIÓN (Admin)
   ├─ Asigna conductor y vehículo
   ├─ Actualiza campos operacionales
   └─ AUDITORIA_RESERVAS registra cambios

5. POST-SERVICIO
   ├─ Marca como completada
   ├─ Cliente califica servicio
   └─ Actualiza feedback
```

## 📈 Mejoras Implementadas

### Fase Actual (Producción)
- ✅ Tabla `reservas` con 40+ campos
- ✅ Sistema de estados flexible
- ✅ Soporte para múltiples descuentos
- ✅ Integración con pasarelas de pago
- ✅ Índices optimizados básicos

### Fase Opcional (Migraciones Disponibles)
- ✨ Campos de conductor y vehículo
- ✨ Geolocalización (latitud/longitud)
- ✨ Sistema de calificaciones (1-5 estrellas)
- ✨ Feedback de clientes
- ✨ Historial de notificaciones
- ✨ Tabla de auditoría completa
- ✨ Índices adicionales optimizados

## 🛠️ Comandos Útiles

### Gestión de Base de Datos

```bash
# Ver estado actual
npm run test:db

# Ejecutar migración base
npm run migrate

# Aplicar mejoras
npm run migrate:enhanced
npm run migrate:auditoria

# Revertir mejoras (si es necesario)
npm run migrate:rollback
```

### Desarrollo

```bash
# Modo debug con logs SQL
DEBUG=sequelize:* npm start

# Verificar conexión
npm run test:connection

# Ver estructura de tablas
mysql -u usuario -p -e "SHOW TABLES; DESCRIBE reservas;"
```

### Producción

```bash
# Iniciar servidor
npm start

# Ver logs
tail -f /var/log/app.log

# Backup manual
mysqldump -u usuario -p nombre_bd > backup_$(date +%Y%m%d).sql
```

## 📚 Guías Específicas

### Para Desarrolladores
1. Lee **[GUIA_RAPIDA_BD.md](./GUIA_RAPIDA_BD.md)** para comandos cotidianos
2. Consulta **[DIAGRAMA_ER.md](./DIAGRAMA_ER.md)** para entender relaciones
3. Revisa **[migrations/README.md](./migrations/README.md)** antes de crear migraciones

### Para Arquitectos
1. Estudia **[DISEÑO_BASE_DATOS.md](./DISEÑO_BASE_DATOS.md)** completo
2. Evalúa las optimizaciones propuestas
3. Considera las mejoras por fases

### Para DevOps/Admin
1. Sigue **[MIGRATION_README.md](./MIGRATION_README.md)** para configuración en Hostinger
2. Configura backups automáticos
3. Monitorea rendimiento de consultas

## 🔍 Consultas Frecuentes

### ¿Cómo crear una nueva reserva express?

```javascript
const reserva = await Reserva.create({
  nombre: "Juan Pérez",
  email: "juan@email.com",
  telefono: "+56912345678",
  origen: "Aeropuerto",
  destino: "Pucón",
  fecha: "2024-12-15",
  pasajeros: 2,
  precio: 45000,
  totalConDescuento: 38250,
  estado: "pendiente",
  source: "express"
});
```

### ¿Cómo actualizar después del pago?

```javascript
await reserva.update({
  estadoPago: "pagado",
  estado: "pendiente_detalles",
  metodoPago: "flow",
  referenciaPago: "FLW123456"
});
```

### ¿Cómo completar detalles?

```javascript
await reserva.update({
  hora: "14:30",
  numeroVuelo: "LA1234",
  hotel: "Hotel Antumalal",
  estado: "confirmada"
});
```

### ¿Cómo buscar reservas?

```javascript
// Por email
const reservas = await Reserva.findAll({
  where: { email: "juan@email.com" }
});

// Por fecha
const reservas = await Reserva.findAll({
  where: {
    fecha: {
      [Op.between]: ['2024-12-01', '2024-12-31']
    }
  }
});

// Pendientes de detalles
const pendientes = await Reserva.findAll({
  where: {
    estado: "pendiente_detalles",
    estadoPago: "pagado"
  }
});
```

## 🎯 Casos de Uso

### 1. Cliente hace reserva express
→ Ver flujo completo en [DISEÑO_BASE_DATOS.md](./DISEÑO_BASE_DATOS.md#-flujo-de-datos---reserva-express)

### 2. Admin asigna conductor
→ Ver caso de uso en [DIAGRAMA_ER.md](./DIAGRAMA_ER.md#caso-3-asignación-de-conductor)

### 3. Cliente deja review
→ Ver caso de uso en [DIAGRAMA_ER.md](./DIAGRAMA_ER.md#caso-4-feedback-post-servicio)

### 4. Generar reporte de ventas
→ Ver consultas SQL en [DISEÑO_BASE_DATOS.md](./DISEÑO_BASE_DATOS.md#-consultas-sql-útiles)

## 🔐 Seguridad

- ✅ Validación de datos en backend
- ✅ Sanitización de inputs
- ✅ Índices para prevenir SQL injection
- ✅ Auditoría de cambios críticos
- ✅ Registro de IP y User Agent
- ✅ Estados controlados con ENUM

## 📊 Monitoreo

### Métricas Clave

```sql
-- Total de reservas
SELECT COUNT(*) FROM reservas;

-- Tasa de conversión
SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN estadoPago = 'pagado' THEN 1 ELSE 0 END) as pagadas,
  ROUND(SUM(CASE WHEN estadoPago = 'pagado' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as tasa
FROM reservas;

-- Ingresos del mes
SELECT SUM(totalConDescuento) as ingresos
FROM reservas
WHERE estadoPago = 'pagado'
AND MONTH(created_at) = MONTH(NOW());
```

## 🆘 Soporte

### Problemas Comunes

| Problema | Solución |
|----------|----------|
| No conecta a BD | Verificar credenciales en `.env` |
| Tabla no existe | Ejecutar `npm run migrate` |
| Consulta lenta | Ver índices en [DISEÑO_BASE_DATOS.md](./DISEÑO_BASE_DATOS.md) |
| Error de duplicado | Verificar restricciones UNIQUE |

### Recursos

- **Issues técnicos**: Ver [GUIA_RAPIDA_BD.md](./GUIA_RAPIDA_BD.md#-troubleshooting)
- **Migraciones**: Ver [migrations/README.md](./migrations/README.md#-solución-de-problemas)
- **Sequelize**: https://sequelize.org/docs/v6/

## 🚀 Próximos Pasos

1. **Implementar mejoras opcionales**
   ```bash
   npm run migrate:all
   ```

2. **Configurar backups automáticos**
   - En panel de Hostinger
   - Diarios a las 3 AM

3. **Monitorear rendimiento**
   - Configurar alertas de slow queries
   - Revisar uso de índices

4. **Planificar escalamiento**
   - Considerar réplicas de lectura
   - Evaluar cache con Redis

## 📞 Contacto

Para más información o dudas sobre el diseño:
- Ver documentación completa en este directorio
- Revisar código en `backend/models/`
- Consultar configuración en `backend/config/database.js`

---

**Última actualización**: 2025-01-11  
**Versión del Sistema**: 1.0  
**Estado**: Producción (con mejoras opcionales disponibles)

**Documentos relacionados**:
- Frontend: `src/components/HeroExpress.jsx`
- Backend: `backend/server-db.js`
- Configuración: `backend/.env.example`
