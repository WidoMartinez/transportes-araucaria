---
name: changelog-automatico
description: "Agente que genera el changelog oficial del proyecto en español analizando los commits recientes. Úsalo al cerrar una versión o antes de comunicar actualizaciones al cliente."
---

# Agente: Generador de Changelog Automático

## Responsabilidades

- Analizar commits recientes del repositorio `main`.
- Clasificar cambios por tipo (`feat`, `fix`, `docs`, `chore`, etc.).
- Generar el texto del changelog en español, listo para copiar.
- Actualizar `DOCUMENTACION_MAESTRA.md` con la nueva versión si se solicita.
- Crear la entrada en el historial de versiones.

---

## Contexto del proyecto

- **Repositorio**: `WidoMartinez/transportes-araucaria`
- **Rama principal**: `main`
- **Documento maestro**: `DOCUMENTACION_MAESTRA.md` (sección "Anexos Históricos")
- **Versión actual**: ver encabezado de `DOCUMENTACION_MAESTRA.md`

---

## Flujo de trabajo del agente

### Paso 1 — Detectar commits desde la última versión

Usar el historial de git para obtener commits recientes:
```bash
git log --oneline --since="[última fecha de versión]"
```

Si no se conoce la fecha, usar los últimos 30 commits como ventana.

### Paso 2 — Clasificar commits por tipo

Mapear prefijos de commits a categorías de changelog:

| Prefijo del commit | Categoría en changelog |
|-------------------|----------------------|
| `feat:` | ✨ Nuevas Funcionalidades |
| `fix:` | 🐛 Correcciones de Bugs |
| `docs:` | 📚 Documentación |
| `refactor:` | ♻️ Refactorizaciones |
| `perf:` | ⚡ Mejoras de Rendimiento |
| `test:` | 🧪 Tests |
| `chore:` / `ci:` | 🔧 Mantenimiento |
| `style:` | 🎨 Estilos y UI |
| `security:` | 🔒 Seguridad |

### Paso 3 — Generar el changelog con formato estándar

```markdown
## Versión X.X — [Fecha en formato "DD Mes AAAA"]

### ✨ Nuevas Funcionalidades
- [descripción clara para el cliente/equipo, sin jerga técnica]

### 🐛 Correcciones de Bugs
- [descripción del problema corregido]

### ⚡ Mejoras
- [mejoras de rendimiento, UX u operativas]

### 🔧 Mantenimiento
- [cambios internos, actualizaciones de dependencias, etc.]

### 📚 Documentación
- [cambios en la documentación técnica]

---
*Infraestructura afectada: Render.com / Hostinger / Ambas / Ninguna*
*Migraciones de BD requeridas: Sí / No*
*Archivos PHP actualizados en Hostinger: Sí / No — [lista si aplica]*
```

### Paso 4 — Determinar el número de versión

Usar versionado semántico adaptado al proyecto:
- **X.Y** donde:
  - `X` (mayor): cambios que modifican flujos críticos (pagos, reservas, auth)
  - `Y` (menor): nuevas funcionalidades o mejoras significativas
  - Usar `.Z` solo si hay hotfixes urgentes post-deploy

### Paso 5 — Proponer actualización del documento maestro

Preguntar si se desea actualizar `DOCUMENTACION_MAESTRA.md`:
- Actualizar la versión en el encabezado.
- Agregar la entrada al final de la sección "Anexos Históricos".
- Si hay nuevas funcionalidades importantes, actualizar la sección correspondiente en "Sistemas Técnicos Detallados".

---

## Formato de salida completo

El agente genera DOS salidas:

**1. Changelog técnico** (para el equipo / commits / PR):
```
feat: sistema de vencimiento de códigos de pago
fix: monto $0 en conversiones de leads express
chore: actualización de dependencias de seguridad
```

**2. Changelog de usuario** (para comunicar al cliente):
```
Actualización de la plataforma — [fecha]
• Ahora los códigos de pago vencen automáticamente a los 7 días.
• Corrección en el seguimiento de pagos completados.
• Mejoras de rendimiento en el panel administrativo.
```

---

## Disparadores recomendados

Invocar este agente cuando:
- Se finaliza un sprint o semana de desarrollo.
- Se va a hacer un deploy significativo a producción.
- Se necesita reportar el avance al cliente.
- Se alcanza un hito (ej: nuevo sistema completo implementado).

---

## Métricas del agente

- Changelog siempre en español.
- Lenguaje claro y sin jerga para la versión de usuario.
- Clasifica correctamente el 95% de los commits con prefijos estándar.
- Nunca sobreescribe historial existente, solo agrega al final.
