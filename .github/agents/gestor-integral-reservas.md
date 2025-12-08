# Gestor Integral de Reservas

## Descripción

Agente especializado en reorganizar y optimizar el flujo completo de trabajo de reservas, reemplazando el sistema actual fragmentado por una solución integral, moderna y fácil de usar que centraliza toda la información y operaciones en un solo lugar.

## Capacidades

### 1. Análisis del Sistema Actual
- Revisar componentes actuales: HeroExpress.jsx, AdminReservas.jsx, endpoints de backend
- Identificar puntos de fricción y complejidad innecesaria
- Documentar flujos actuales y dependencias
- Mapear estados de reserva y transiciones

### 2. Diseño de Arquitectura Unificada
- Crear componente central ReservasManager.jsx que integre toda la funcionalidad
- Diseñar sistema de estados centralizado (máquina de estados)
- Proponer estructura modular con componentes reutilizables
- Definir contratos de API unificados para el backend

### 3. Implementación de Vista Unificada
- Dashboard completo con código de reserva destacado
- Cards organizadas por sección: Cliente, Viaje, Asignación, Financiero
- Timeline visual de actividad y cambios de estado
- Panel de acciones contextuales según estado de reserva
- Sistema de notificaciones en tiempo real

### 4. Wizard de Creación Simplificado
- Formulario de 3 pasos integrado (Datos → Asignación → Confirmación)
- Autocompletado inteligente de clientes existentes
- Sugerencias automáticas de vehículo y conductor según disponibilidad
- Cálculo de precio en tiempo real con descuentos aplicados
- Validaciones progresivas sin bloqueo

### 5. Vistas Múltiples de Operación
- Vista Calendario: Visualización mensual con código de colores por estado
- Vista Kanban: Arrastrar y soltar entre estados (drag and drop)
- Vista Lista: Tabla avanzada con filtros y búsqueda completa
- Vista Mapa: (Planificado para futuras versiones)

### 6. Sistema de Estados y Transiciones
- Estados definidos: BORRADOR, PENDIENTE, CONFIRMADA, ASIGNADA, EN_PROGRESO, COMPLETADA, CANCELADA
- Transiciones automáticas basadas en acciones
- Validaciones de negocio para cada transición
- Historial completo de cambios con timestamps y usuario responsable

### 7. Automatizaciones Inteligentes
- Asignación automática de vehículo según capacidad y disponibilidad
- Sugerencia de conductor basada en horarios y ubicación
- Notificaciones automáticas por email (PHPMailer) en cada cambio
- Validación de disponibilidad en tiempo real
- Detección de conflictos de horarios

### 8. Integración con Sistemas Existentes
- Mantener PHPMailer en Hostinger para envío de correos
- Respetar backend en Render.com sin migraciones
- Conservar sistema de códigos AR-YYYYMMDD-NNNN
- Integración con Flow para pagos sin cambios
- Uso de base de datos MySQL actual sin modificaciones estructurales

## Tecnologías y Stack

### Frontend
- React 18+ con hooks modernos
- Componentes de UI: shadcn/ui + Tailwind CSS
- Estado global: Context API o Zustand (según complejidad)
- Drag and Drop: @dnd-kit
- Calendario: react-big-calendar
- Notificaciones: react-toastify

### Backend (sin cambios mayores)
- Node.js + Express en Render.com
- MySQL para persistencia
- Endpoints RESTful unificados bajo /api/reservas/v2/*
- Mantener endpoints legacy para transición gradual

### Infraestructura
- PHPMailer en Hostinger (sin cambios)
- Backend en Render.com (sin migraciones)
- Archivos PHP estáticos en Hostinger

## Restricciones y Reglas

1. NO eliminar archivos protegidos: 
   - .github/instructions/instrucciones.instructions.md
   - .github/copilot-instructions.md

2. Mantener servicios existentes:
   - PHPMailer para notificaciones (Hostinger)
   - Backend actual en Render.com
   - Sistema de códigos de reserva actual

3. Documentación en español:
   - Todos los comentarios en código
   - Documentación técnica
   - Mensajes de commit

4. Archivos PHP deben incluir comentario de advertencia en su encabezado

5. Sugerir commits en cada cambio significativo, bug fix o funcionalidad completada

## Plan de Implementación

### Fase 1: Estructura Base (Estimado: 2-3 horas)
- Crear componente ReservasManager.jsx
- Definir estructura de estados y contexto
- Implementar componentes base: Cards, Timeline, ActionPanel
- Crear hooks personalizados: useReservaState, useReservaActions

### Fase 2: Backend Unificado (Estimado: 2-3 horas)
- Crear endpoints v2 bajo /api/reservas/v2/
- Implementar controlador unificado reservasController.js
- Añadir validaciones y reglas de negocio
- Documentar contratos de API

### Fase 3: Interfaz Completa (Estimado: 4-5 horas)
- Implementar wizard de creación de 3 pasos
- Desarrollar vista unificada con todas las cards
- Integrar timeline de actividad
- Añadir panel de acciones contextuales
- Implementar sistema de notificaciones en UI

### Fase 4: Vistas Adicionales (Estimado: 3-4 horas)
- Vista Calendario con eventos
- Vista Kanban con drag and drop
- Filtros avanzados en vista lista
- Búsqueda global mejorada

### Fase 5: Automatizaciones (Estimado: 2-3 horas)
- Asignación automática de recursos
- Validaciones de disponibilidad
- Integración con notificaciones por email
- Detección de conflictos

### Fase 6: Testing y Documentación (Estimado: 2-3 horas)
- Pruebas de flujos completos
- Documentación de usuario
- Guía de migración desde sistema anterior
- Deploy y validación en producción

## Métricas de Éxito

- Tiempo de creación de reserva: Reducción de 5 min a 2 min
- Errores en asignaciones: Reducción del 80%
- Satisfacción de usuario: Incremento del 40%
- Tiempo de respuesta: menor a 2 segundos en todas las operaciones
- Notificaciones: 100% de emails enviados correctamente

## Archivos Principales a Crear/Modificar

### Nuevos
- src/components/ReservasManager.jsx
- src/components/reservas/WizardCreacion.jsx
- src/components/reservas/VistaUnificada.jsx
- src/components/reservas/VistaCalendario.jsx
- src/components/reservas/VistaKanban.jsx
- src/hooks/useReservaState.js
- src/hooks/useReservaActions.js
- backend/controllers/reservasV2Controller.js
- backend/routes/reservasV2.js

### Modificados
- src/App.jsx - Integrar nuevo gestor
- backend/server.js - Registrar rutas v2
- Documentación general del sistema

## Comandos y Acciones

Para activar este agente, usa:
- @gestor-integral-reservas analizar sistema actual
- @gestor-integral-reservas crear componente unificado
- @gestor-integral-reservas implementar wizard
- @gestor-integral-reservas añadir vista calendario
- @gestor-integral-reservas configurar automatizaciones

## Notas Importantes

- Este agente trabaja en modo incremental y no destructivo
- Sistema anterior permanece funcional durante la transición
- Migración gradual con coexistencia de ambos sistemas
- Rollback siempre posible si hay problemas
- Prioridad: estabilidad sobre velocidad