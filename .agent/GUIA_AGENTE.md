# 📋 Guía Rápida de Consulta para Agentes

> **Propósito**: Este documento sirve como punto de entrada rápido para agentes IA que trabajen en el proyecto.

## ⚠️ ANTES DE HACER CUALQUIER CAMBIO

1. **Consultar DOCUMENTACION_MAESTRA.md** - Contiene toda la arquitectura y funcionalidades
2. **Consultar GUIA_SOLUCION_PROBLEMAS.md** - Contiene soluciones a problemas recurrentes
3. Si el problema ya está documentado, **seguir la solución establecida** sin inventar alternativas

## 📚 Estructura de Documentación

### Documentos Oficiales (NO crear nuevos)

| Documento | Propósito | Cuándo actualizar |
|-----------|-----------|-------------------|
| `DOCUMENTACION_MAESTRA.md` | Arquitectura, funcionalidades, flujos técnicos | Nuevas features, cambios arquitectónicos, modificaciones de API |
| `GUIA_SOLUCION_PROBLEMAS.md` | Troubleshooting, errores y soluciones | Bugs resueltos, problemas recurrentes, errores de configuración |

### Workflows Disponibles

- `/documentacion` - Organizar y actualizar documentación
- `/build` - Construir aplicación para producción
- `/verificacion` - Verificar calidad del código
- `/verificar_pagos` - Comprobar flujos de pagos

## 🔍 Cómo Encontrar Información

### Para Funcionalidades
**Consultar**: `DOCUMENTACION_MAESTRA.md` → Sección 5 (Sistemas Técnicos Detallados)

Ejemplos:
- Autenticación → Sección 5.1
- Pagos y Finanzas → Sección 5.2
- Notificaciones → Sección 5.3
- Descuentos Personalizados → Sección 5.10
- Estadísticas → Sección 5.7

### Para Problemas/Errores
**Consultar**: `GUIA_SOLUCION_PROBLEMAS.md`

Problemas comunes documentados:
- Error 500 en backend
- Migraciones de base de datos
- Problemas de autenticación
- Google Maps y autocomplete
- Conversiones Google Ads
- Configuración de WhatsApp

## 🚨 Reglas Críticas

### Arquitectura
- ✅ Backend en **Render.com** (Node.js + Express)
- ✅ Emails vía **PHP en Hostinger** (no cambiar sin autorización)
- ✅ Base de datos **PostgreSQL** con Sequelize
- ❌ NO modificar archivos en `.github/` sin autorización
- ❌ NO cambiar PHPMailer sin autorización

### Migraciones de Base de Datos
- Crear script en `backend/migrations/`
- Integrar en `startServer()` de `backend/server-db.js`
- El sistema ejecuta auto-migraciones al inicio
- Consultar `backend/MIGRATION_README.md` antes de crear migraciones

### Flujos de Pago (CRÍTICO)
Hay **3 flujos** documentados en Sección 5.6:
1. **Express** (Home → Cotización → Pago → Detalles)
2. **Pagar con Código** (Código → Detalles + Pago)
3. **Consultar Reserva** (Consulta → Pagar Saldo)

**Regla de Oro**: Un solo campo de dirección específica (`direccionEspecifica`), el backend mapea inteligentemente según el sentido del viaje.

### Descuentos
- Descuentos personalizados se **suman** a descuentos globales
- Límite máximo: **75%** del precio base
- Consultar Sección 5.10 para lógica completa

## 📝 Después de Resolver un Problema

1. Ejecutar workflow `/documentacion`
2. Actualizar documento correspondiente:
   - **Funcionalidad nueva** → `DOCUMENTACION_MAESTRA.md`
   - **Bug/Error resuelto** → `GUIA_SOLUCION_PROBLEMAS.md`
3. Commit con formato: `docs: [descripción breve]`

## 🎯 Checklist Rápido

Antes de implementar un cambio:
- [ ] ¿Consulté `DOCUMENTACION_MAESTRA.md`?
- [ ] ¿Consulté `GUIA_SOLUCION_PROBLEMAS.md`?
- [ ] ¿El problema ya tiene solución documentada?
- [ ] ¿Entiendo la arquitectura del sistema?
- [ ] ¿Sé qué archivos modificar según la documentación?

Después de implementar un cambio:
- [ ] ¿Actualicé la documentación correspondiente?
- [ ] ¿Probé que la solución funciona?
- [ ] ¿Documenté archivos y líneas modificadas?
- [ ] ¿Hice commit con mensaje descriptivo?

## 🔗 Referencias Rápidas

- **Setup local**: Sección 2 de `DOCUMENTACION_MAESTRA.md`
- **Arquitectura**: Sección 3 de `DOCUMENTACION_MAESTRA.md`
- **Panel Admin**: Sección 4 de `DOCUMENTACION_MAESTRA.md`
- **Sistemas técnicos**: Sección 5 de `DOCUMENTACION_MAESTRA.md`
- **Troubleshooting**: `GUIA_SOLUCION_PROBLEMAS.md` completo

---

**Recuerda**: La documentación existe para evitar errores iterativos. Úsala siempre.
