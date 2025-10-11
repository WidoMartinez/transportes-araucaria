# 🏗️ Arquitectura del Sistema - Transportes Araucaria

## 📐 Vista General del Sistema

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        ARQUITECTURA COMPLETA DEL SISTEMA                      │
└──────────────────────────────────────────────────────────────────────────────┘


                              ┌─────────────────┐
                              │   FRONTEND      │
                              │   (React)       │
                              └────────┬────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                  │
                    ↓                  ↓                  ↓
          ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
          │ HeroExpress  │   │   Contacto   │   │    Admin     │
          │  (2 pasos)   │   │ (Formulario  │   │  Dashboard   │
          │              │   │  completo)   │   │              │
          └──────┬───────┘   └──────┬───────┘   └──────┬───────┘
                 │                  │                   │
                 └──────────────────┼───────────────────┘
                                    │
                                    ↓
                          ┌─────────────────┐
                          │   BACKEND API   │
                          │  (Express.js)   │
                          │  server-db.js   │
                          └────────┬────────┘
                                   │
                 ┌─────────────────┼─────────────────┐
                 │                 │                 │
                 ↓                 ↓                 ↓
        ┌────────────────┐ ┌─────────────┐ ┌────────────────┐
        │ PASARELAS PAGO │ │  DATABASE   │ │ NOTIFICACIONES │
        ├────────────────┤ │   MySQL     │ ├────────────────┤
        │ • Flow         │ │ (Hostinger) │ │ • PHPMailer    │
        │ • Mercado Pago │ │             │ │ • WhatsApp     │
        └────────────────┘ └──────┬──────┘ └────────────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
                    ↓             ↓             ↓
        ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
        │   RESERVAS   │ │   DESTINOS   │ │   CÓDIGOS    │
        │              │ │              │ │  DESCUENTO   │
        └──────────────┘ └──────────────┘ └──────────────┘
                    │             │             │
                    └─────────────┼─────────────┘
                                  ↓
                        ┌──────────────────┐
                        │  AUDITORIA (opt) │
                        │  & ANALYTICS     │
                        └──────────────────┘
```

## 🎨 Flujo Completo de Reserva Express

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       FLUJO USUARIO - SISTEMA - BASE DE DATOS               │
└─────────────────────────────────────────────────────────────────────────────┘

USUARIO                    FRONTEND                  BACKEND              BASE DE DATOS
  │                           │                         │                      │
  │  1. Ingresa a sitio      │                         │                      │
  ├──────────────────────────>│                         │                      │
  │                           │                         │                      │
  │  2. Hace clic en         │                         │                      │
  │     "Reservar ahora"     │                         │                      │
  ├──────────────────────────>│                         │                      │
  │                           │                         │                      │
  │                           │  [PASO 1: VIAJE]       │                      │
  │                           │                         │                      │
  │  3. Selecciona:          │                         │                      │
  │     • Origen             │                         │                      │
  │     • Destino            │                         │  Query DESTINOS      │
  │     • Fecha              │─────────────────────────┼─────────────────────>│
  │     • Pasajeros          │                         │                      │
  │                           │<────────────────────────┼──────────────────────┤
  │                           │   Retorna precio        │                      │
  │                           │                         │                      │
  │                           │  Query DESCUENTOS       │                      │
  │                           │─────────────────────────┼─────────────────────>│
  │                           │<────────────────────────┼──────────────────────┤
  │                           │   Retorna descuentos    │                      │
  │                           │                         │                      │
  │  4. Ve precio estimado   │                         │                      │
  │<──────────────────────────┤                         │                      │
  │                           │                         │                      │
  │  5. Clic "Continuar"     │                         │                      │
  ├──────────────────────────>│                         │                      │
  │                           │                         │                      │
  │                           │  [PASO 2: DATOS]       │                      │
  │                           │                         │                      │
  │  6. Ingresa:             │                         │                      │
  │     • Nombre             │                         │                      │
  │     • Email              │                         │                      │
  │     • Teléfono           │                         │                      │
  │     • Código (opcional)  │                         │                      │
  │                           │                         │                      │
  │  7. Acepta términos      │                         │                      │
  │  8. Clic "Confirmar"     │                         │                      │
  ├──────────────────────────>│                         │                      │
  │                           │  POST /crear-reserva    │                      │
  │                           │─────────────────────────>│                      │
  │                           │                         │  INSERT RESERVA     │
  │                           │                         │─────────────────────>│
  │                           │                         │  (estado: pendiente) │
  │                           │                         │<─────────────────────┤
  │                           │                         │  Retorna ID: 123     │
  │                           │<─────────────────────────┤                      │
  │                           │  Reserva creada         │                      │
  │                           │                         │                      │
  │  9. Selecciona pago      │                         │                      │
  │     (Flow/Mercado Pago)  │                         │                      │
  ├──────────────────────────>│                         │                      │
  │                           │  POST /crear-preferencia│                      │
  │                           │─────────────────────────>│                      │
  │                           │                         │  Query RESERVA #123  │
  │                           │                         │─────────────────────>│
  │                           │                         │<─────────────────────┤
  │                           │<─────────────────────────┤                      │
  │                           │  URL de pago            │                      │
  │<──────────────────────────┤                         │                      │
  │  Redirección a pasarela  │                         │                      │
  │                           │                         │                      │
┌─┴──────────────────┐        │                         │                      │
│  PASARELA DE PAGO  │        │                         │                      │
│  (Flow/MercadoPago)│        │                         │                      │
└─┬──────────────────┘        │                         │                      │
  │  10. Paga                 │                         │                      │
  │  (Tarjeta/Transferencia)  │                         │                      │
  │                           │                         │                      │
  │  11. Pago exitoso         │                         │                      │
  │         └─────────────────┼─────── WEBHOOK ─────────>│                      │
  │                           │                         │  UPDATE RESERVA #123 │
  │                           │                         │  • estadoPago: pagado│
  │                           │                         │  • estado: pend_det  │
  │                           │                         │─────────────────────>│
  │                           │                         │<─────────────────────┤
  │                           │                         │                      │
  │                           │                         │  INSERT AUDITORIA    │
  │                           │                         │─────────────────────>│
  │                           │                         │<─────────────────────┤
  │                           │<─────────────────────────┤                      │
  │                           │  Confirmación           │                      │
  │                           │                         │                      │
  │  12. Redirección a        │                         │  📧 Envía email      │
  │      página éxito         │                         │  📱 Envía WhatsApp   │
  │<──────────────────────────┤                         │                      │
  │                           │                         │                      │
  │                           │  [POST-PAGO: DETALLES] │                      │
  │                           │                         │                      │
  │  13. Recibe email con    │                         │                      │
  │      link para detalles  │                         │                      │
  │<──────────────────────────┼─────────────────────────┤                      │
  │                           │                         │                      │
  │  14. Completa:           │                         │                      │
  │      • Hora específica   │                         │                      │
  │      • Número vuelo      │                         │                      │
  │      • Hotel             │                         │                      │
  ├──────────────────────────>│  PUT /completar-detalles│                      │
  │                           │─────────────────────────>│                      │
  │                           │                         │  UPDATE RESERVA #123 │
  │                           │                         │  • hora: 14:30       │
  │                           │                         │  • numeroVuelo: LA123│
  │                           │                         │  • estado: confirmada│
  │                           │                         │─────────────────────>│
  │                           │                         │<─────────────────────┤
  │                           │                         │                      │
  │                           │                         │  INSERT AUDITORIA    │
  │                           │                         │─────────────────────>│
  │                           │<─────────────────────────┤                      │
  │  15. Confirmación final  │                         │  📧 Email confirmación│
  │<──────────────────────────┤                         │                      │
  │                           │                         │                      │
  │  ✅ RESERVA CONFIRMADA   │                         │                      │
  │                           │                         │                      │
```

## 🔄 Estados y Transiciones

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    MÁQUINA DE ESTADOS - RESERVA                             │
└─────────────────────────────────────────────────────────────────────────────┘

                           ╔════════════════╗
                           ║  INICIO        ║
                           ║  (Usuario web) ║
                           ╚═══════╤════════╝
                                   │
                                   │ Completa formulario hero
                                   │ (origen, destino, fecha, datos)
                                   ↓
                           ┌───────────────┐
                           │  PENDIENTE    │◄─────────┐
                           │               │          │
                           │ • Creada      │          │ Pago fallido
                           │ • Sin pagar   │          │ (puede reintentar)
                           └───────┬───────┘          │
                                   │                  │
                                   │ Pago exitoso     │
                                   │                  │
                                   ↓                  │
                           ┌───────────────────┐      │
                           │ PENDIENTE_DETALLES│──────┘
                           │                   │
                           │ • Pagada          │
                           │ • Faltan detalles │
                           │   opcionales      │
                           └───────┬───────────┘
                                   │
                                   │ Completa hora, vuelo,
                                   │ hotel, equipaje, etc.
                                   ↓
                           ┌───────────────┐
                           │  CONFIRMADA   │
                           │               │
                           │ • Completa    │
                           │ • Lista para  │
                           │   operar      │
                           └───────┬───────┘
                                   │
                                   │ Servicio completado
                                   ↓
                           ┌───────────────┐
                           │  COMPLETADA   │
                           │               │
                           │ • Finalizada  │
                           │ • Puede       │
                           │   calificar   │
                           └───────────────┘

                    ┌─────────────────────────┐
                    │                         │
                    │  En cualquier momento   │
                    │  (antes del servicio):  │
                    │                         │
                    └────────────┬────────────┘
                                 │
                                 ↓
                         ┌───────────────┐
                         │  CANCELADA    │
                         │               │
                         │ • Por usuario │
                         │ • Por admin   │
                         └───────────────┘
```

## 📊 Capas del Sistema

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            ARQUITECTURA EN CAPAS                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  CAPA 1: PRESENTACIÓN (Frontend - React)                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  • HeroExpress.jsx        → Formulario de reserva express (2 pasos)         │
│  • Contacto.jsx           → Formulario completo tradicional                 │
│  • AdminDashboard.jsx     → Panel de administración                          │
│  • CodigoDescuento.jsx    → Componente para códigos promocionales           │
│  • App.jsx                → Lógica de estado y coordinación                  │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ HTTP/HTTPS
                                      │ REST API
                                      ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│  CAPA 2: LÓGICA DE NEGOCIO (Backend - Node.js/Express)                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  • server-db.js           → Servidor principal con endpoints                 │
│  • /crear-reserva-express → Crea reserva mínima                             │
│  • /crear-preferencia-*   → Integración con pasarelas de pago               │
│  • /completar-detalles    → Actualiza detalles post-pago                    │
│  • /webhook-flow          → Recibe confirmaciones de Flow                    │
│  • /webhook-mercadopago   → Recibe confirmaciones de Mercado Pago           │
│  • /destinos              → API de destinos y precios                        │
│  • /descuentos            → API de descuentos y promociones                  │
│  • /codigos               → Validación de códigos promocionales              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ Sequelize ORM
                                      │ MySQL Driver
                                      ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│  CAPA 3: PERSISTENCIA (Sequelize Models)                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  • Reserva.js             → Model de reservas (40+ campos)                  │
│  • Destino.js             → Model de destinos y precios                     │
│  • CodigoDescuento.js     → Model de códigos promocionales                  │
│  • Promocion.js           → Model de promociones por día                    │
│  • DescuentoGlobal.js     → Model de descuentos globales                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ SQL Queries
                                      │ Transacciones
                                      ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│  CAPA 4: BASE DE DATOS (MySQL en Hostinger)                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│  • reservas               → Tabla principal (40+ columnas)                   │
│  • destinos               → Catálogo de destinos (12 columnas)              │
│  • codigos_descuento      → Códigos promocionales (17 columnas)             │
│  • promociones            → Promociones por día (7 columnas)                │
│  • descuentos_globales    → Descuentos del sistema (7 columnas)             │
│  • auditoria_reservas*    → Historial de cambios (9 columnas) [OPCIONAL]   │
│                                                                              │
│  Índices optimizados:                                                        │
│  • idx_email, idx_fecha, idx_estado, idx_created_at                         │
│  • idx_fecha_estado, idx_created_estado_pago [ADICIONALES]                  │
└─────────────────────────────────────────────────────────────────────────────┘

* = Tabla opcional, requiere migración
```

## 🔐 Seguridad y Validación

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          CAPAS DE SEGURIDAD                                  │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  CAPA 1: VALIDACIÓN FRONTEND                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│  ✓ Validación de campos requeridos                                          │
│  ✓ Formato de email (regex)                                                 │
│  ✓ Formato de teléfono chileno                                              │
│  ✓ Fechas futuras solamente                                                 │
│  ✓ Rangos válidos (pasajeros, etc.)                                         │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│  CAPA 2: VALIDACIÓN BACKEND                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  ✓ Re-validación de todos los campos                                        │
│  ✓ Sanitización de inputs (SQL injection)                                   │
│  ✓ Verificación de códigos de descuento                                     │
│  ✓ Cálculo seguro de precios                                                │
│  ✓ Registro de IP y User Agent                                              │
│  ✓ Rate limiting (futuro)                                                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│  CAPA 3: INTEGRIDAD BASE DE DATOS                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│  ✓ Constraints NOT NULL                                                     │
│  ✓ Constraints UNIQUE                                                       │
│  ✓ Constraints CHECK (ej: calificacion 1-5)                                │
│  ✓ ENUM para estados (previene valores inválidos)                          │
│  ✓ Foreign Keys con ON DELETE CASCADE                                       │
│  ✓ Transacciones ACID                                                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│  CAPA 4: AUDITORÍA Y LOGGING                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│  ✓ Tabla auditoria_reservas (cambios)                                      │
│  ✓ Triggers automáticos en UPDATE                                           │
│  ✓ Logs de aplicación                                                       │
│  ✓ Registro de errores                                                      │
│  ✓ Monitoreo de queries lentas                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 📈 Escalabilidad y Rendimiento

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ESTRATEGIA DE ESCALAMIENTO                                │
└─────────────────────────────────────────────────────────────────────────────┘

FASE ACTUAL: MONOLITO OPTIMIZADO
┌──────────────────────────────────┐
│  Frontend (React)                │
│  Backend (Node.js)               │ ─→ MySQL (Hostinger)
│  @ Render.com                    │
└──────────────────────────────────┘

FASE 2: SEPARACIÓN Y CACHE (Mediano plazo)
┌──────────────────────────────────┐
│  Frontend (React)                │
│  @ Vercel/Netlify                │
└─────────────┬────────────────────┘
              │
              ↓
┌──────────────────────────────────┐
│  Backend API (Node.js)           │ ─→ MySQL (Hostinger)
│  @ Render.com                    │ ─→ Redis (Cache)
└──────────────────────────────────┘

FASE 3: MICROSERVICIOS (Largo plazo)
┌──────────────────────────────────┐
│  Frontend (React)                │
│  CDN Global                      │
└─────────────┬────────────────────┘
              │
              ↓
┌──────────────────────────────────┐
│  API Gateway                     │
└─────────────┬────────────────────┘
              │
    ┌─────────┼─────────┐
    ↓         ↓         ↓
┌────────┐ ┌────────┐ ┌────────┐
│Reservas│ │ Pagos  │ │Notific │
│Service │ │Service │ │Service │
└───┬────┘ └───┬────┘ └───┬────┘
    │          │          │
    └──────────┼──────────┘
               ↓
    ┌─────────────────────┐
    │  MySQL Cluster      │
    │  • Master (Write)   │
    │  • Replicas (Read)  │
    └─────────────────────┘
```

## 📚 Documentación Completa

```
RESUMEN_DISEÑO_BD.md (17 KB)
├─ Resumen ejecutivo
├─ Flujo completo
├─ Comandos principales
└─ Checklist de implementación

backend/README_BASE_DATOS.md (11 KB)
├─ Índice de toda la documentación
├─ Guías por rol
├─ FAQs
└─ Casos de uso

backend/DISEÑO_BASE_DATOS.md (24 KB)
├─ Especificación completa de tablas
├─ Campos y validaciones
├─ Índices optimizados
├─ Consultas SQL útiles
└─ Propuestas de mejoras

backend/DIAGRAMA_ER.md (18 KB)
├─ Diagrama entidad-relación
├─ Relaciones entre tablas
├─ Flujos de estados
└─ Cardinalidad

backend/GUIA_RAPIDA_BD.md (7.5 KB)
├─ Comandos esenciales
├─ Consultas comunes
├─ Troubleshooting
└─ Best practices

backend/migrations/
├─ README.md (6.3 KB)
├─ 001_add_enhanced_fields.js (5.4 KB)
└─ 002_create_auditoria.js (4.8 KB)

ARQUITECTURA_SISTEMA.md (este archivo)
├─ Vista general
├─ Flujos visuales
├─ Capas del sistema
└─ Seguridad y escalabilidad
```

## 🎯 Próximos Pasos Sugeridos

### 1. Implementación Inmediata
- [ ] Revisar documentación completa
- [ ] Decidir sobre migraciones opcionales
- [ ] Configurar backups automáticos

### 2. Mejoras Corto Plazo (1-2 semanas)
- [ ] Aplicar migración de campos mejorados
- [ ] Implementar tabla de auditoría
- [ ] Configurar monitoreo básico

### 3. Mejoras Mediano Plazo (1-3 meses)
- [ ] Sistema de notificaciones mejorado
- [ ] Dashboard de analíticas
- [ ] App para conductores

### 4. Mejoras Largo Plazo (3-6 meses)
- [ ] Implementar cache con Redis
- [ ] Réplicas de lectura
- [ ] Microservicios opcionales

---

**Fecha de creación**: 2025-01-11  
**Versión**: 1.0  
**Estado**: ✅ Sistema diseñado y documentado completamente  
**Total documentación**: ~92 KB en 8 archivos
