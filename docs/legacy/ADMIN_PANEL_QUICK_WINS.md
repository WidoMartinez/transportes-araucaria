# Auditoría rápida del panel administrativo (Quick Wins 1-2 sprints)

## Resumen ejecutivo
- **Alcance**: Componentes `AdminReservas`, `AdminCodigosPago` y la navegación global (`AdminDashboard`, `AdminSidebar`, configuraciones compartidas). La revisión siguió las pautas de `DOCUMENTACION_MAESTRA.md` (18-feb-2026) y `GUIA_SOLUCION_PROBLEMAS.md` (27-feb-2026).
- **Contexto temporal**: 10-mar-2026, commit `089b0a8c` (rama local). La evaluación se hizo en entorno local (`npm install` ya ejecutado). No se levantó `npm run dev` por no contar con navegador en esta sesión; se documentan hallazgos de código y se deja pendiente capturar métricas LCP/TTI reales con QA.
- **Hallazgos clave**: 6 oportunidades priorizadas en rendimiento percibido, flujo operativo y consistencia visual. Todos los cambios propuestos caben en 1-2 sprints sin tocar contratos de backend.
- **Next steps sugeridos**:
  1. Instrumentar mediciones reales de `AdminReservas`/`AdminCodigosPago` (Chrome DevTools con CPU 4× y red “Fast 3G”).
  2. Planificar refactor ligero de `AdminReservas` (tabla, filtros y acciones masivas) antes de abordar code splitting global.
  3. Ejecutar pruebas exploratorias en móvil (≤390 px) para validar los ajustes antes de pasarlos a QA.

## Línea base y metodología
- **Documentos consultados**: `AGENTS.md`, `DOCUMENTACION_MAESTRA.md`, `GUIA_SOLUCION_PROBLEMAS.md`.
- **Estado técnico detectado**: `node_modules/` actualizado, backend apuntando a Render vía `getBackendUrl()`. `sessionStorage`/`localStorage` usados para columnas y banderas del panel.
- **Herramientas usadas**: lectura estática con PowerShell (`Get-Content`, `Select-String`) y revisión puntual de hooks.
- **Limitaciones**: Sin navegador gráfico → no fue posible capturar métricas LCP/TTI o screenshots. Recomendación: que QA ejecute Lighthouse en `npm run dev --host 0.0.0.0` y adjunte JSON de Performance al abordar los quick wins.

## Hallazgos priorizados

### 1. Bundle inicial sobredimensionado en `AdminDashboard`
- **Problema**: `src/components/AdminDashboard.jsx:1-31` importa **todos** los módulos del panel (reservas, códigos, gastos, etc.) aunque el usuario solo vea uno a la vez. Esto incrementa de inmediato el JS descargado (aprox. >1 MB) y retrasa el primer render del dashboard.
- **Impacto operativo**: Tiempo de carga alto para supervisores en terreno (dispositivos móviles/laptops lentas). Los módulos poco frecuentes (p. ej. `AdminTarifaDinamica`) lastran el uso diario.
- **Propuesta**: Migrar a `React.lazy` + `Suspense` por sección (“reservas”, “finanzas”, “configuración”), o bien cargar paquetes bajo demanda usando `import(/* webpackChunkName */ "./AdminReservas")`. Añadir un `Skeleton` simple durante la carga.
- **Esfuerzo estimado**: **M**. Cambios localizados en `AdminDashboard.jsx` y `AdminSidebar.jsx`, sin tocar lógica de negocio.
- **Dependencias**: Mantener `Toaster` global en el nivel superior para no duplicar instancias.

### 2. Buscador y filtros solo consideran la página actual
- **Evidencia**: `AdminReservas.jsx:1381-1401` filtra `reservas` (el array ya paginado por `limit`) con `searchTerm` y `estadoPagoFiltro`. El mensaje “Mostrando {reservasFiltradas.length} de {totalReservas}” (`AdminReservas.jsx:2839`) refuerza que solo se procesan 20 registros aunque existan cientos.
- **Impacto**: Operadores piensan que una búsqueda global no devuelve resultados cuando la reserva está en otra página, provocando tickets duplicados.
- **Propuesta**: Propagar `searchTerm`, `estadoPagoFiltro` y `estado` a la query del backend (ya existente en `fetchReservas` en `AdminReservas.jsx:1246-1344`) y resetear `currentPage` a 1 al modificar filtros. Mientras llega el backend, mostrar un aviso “Busca solo dentro de la página” para reducir confusiones.
- **Esfuerzo**: **S** si solo se actualiza la query string + reset de paginación; **M** si se agrega endpoint específico.
- **Dependencias**: Coordinación ligera con backend (`GET /api/reservas`) para aceptar `search` y `estado_pago`.

### 3. “Seleccionar todo” inconsistente con paginación y acciones masivas
- **Evidencia**: `toggleSelectAll` (`AdminReservas.jsx:2453-2458`) toma `reservasFiltradas` como universo. Esto solo marca los registros visibles en la página actual, pero las acciones (eliminación, exportación) y mensajes hablan de “todas las reservas”. Además, `Mostrando {reservasFiltradas.length} de {totalReservas}` puede insinuar que se afectarían cientos de filas.
- **Impacto**: Riesgo de eliminar/actualizar solo una fracción sin que el usuario lo note. También dificulta flujos como “archivar todas las pendientes de ayer”.
- **Propuesta**: Clarificar UI (“Seleccionar página actual”) o permitir seleccionar **todo** invocando un endpoint de bulk IDs. Añadir contador visible de seleccionadas (`selectedReservas.length`). Ajustar `exportarSeleccionadosXLS` para avisar cuando la selección parcial no cubre todos los filtros.
- **Esfuerzo**: **S** (mensajes + contador) a **M** (bulk verdadero).
- **Dependencias**: Ninguna si se queda en aclarar UI; coordinar backend para bulk real.

### 4. Alertas bloqueantes y falta de feedback consistente
- **Evidencia**: El componente usa más de 30 llamadas a `alert()` (`AdminReservas.jsx:643-3750`). Ejemplo crítico: validaciones de asignación (`AdminReservas.jsx:1186-1290`) y creación (`AdminReservas.jsx:2179-2413`). Esto bloquea la UI, no respeta branding y no funciona en móviles (pop-ups).
- **Impacto**: Operadores pierden contexto (el modal se queda detrás de la alerta), no hay logs accionables ni estados persistentes. Además, `alert` rompe accesibilidad (no hay focus management).
- **Propuesta**: Centralizar feedback con `toast` (ya disponible via `sonner` en `AdminCodigosPago.jsx`) y `DialogDescription`. Crear un hook `useAdminToast()` que reciba `type`, `mensaje`, `detalle`. Migrar errores críticos a banners dentro del modal para que el foco permanezca. Aprovechar `Dialog` para definir `initialFocus`.
- **Esfuerzo**: **M** (búsqueda y reemplazo con hook + pruebas manuales).
- **Dependencias**: `sonner` está ya montado en `AdminDashboard.jsx` (`<Toaster .../>`).

### 5. Edición de códigos resetea fecha de vencimiento
- **Evidencia**: Al abrir el modal de edición (`setCodigoEditando`), se setea `formEdicion.fechaVencimiento` con `obtenerFechaLocal(0).slice(0, 16)` incluso cuando el código ya tenía fecha (`AdminCodigosPago.jsx:508-514`). Resultado: al guardar sin tocar la fecha, se pisa por “ahora”.
- **Impacto**: Riesgo de acortar o extender códigos inadvertidamente → afecta cobranzas y genera confusión con clientes (“dijeron que vencía mañana”).
- **Propuesta**: Popular `formEdicion.fechaVencimiento` con `c.fechaVencimiento?.slice(0,16)` y solo usar `obtenerFechaLocal` como fallback cuando esté vacío. Añadir advertencia visual al momento de guardar si la fecha cambia respecto al valor original.
- **Esfuerzo**: **S** (dos líneas + test manual).
- **Dependencias**: Ninguna; cambio aislado al formulario.

### 6. Formularios financieros sin ayudas táctiles ni validación visual
- **Evidencia**: En la sección “Datos del cliente” del modal (`AdminCodigosPago.jsx:1086-1109`), los inputs se apilan en una cuadrícula `grid-cols-1 md:grid-cols-2` pero no hay helper text ni límites de caracteres. Los toggles críticos (`permitirAbono`, `sillaInfantil`) siguen usando `input type="checkbox"` con hit area de 16 px aunque el proyecto ya adoptó `Switch` en `HeroExpress.jsx`.
- **Impacto**: En móviles (≤390 px) se ven campos muy extensos sin formato, provocando errores en la captura de datos y necesidad de zoom.
- **Propuesta**: Reutilizar el componente `Switch` de `ui/switch`, añadir `aria-describedby` y helper texts cortos para cada campo financiero. Incluir máscaras (`inputMode="decimal"`, `maxLength`) y un `Tooltip` para icon-only buttons (copiar código, WhatsApp). Aprovechar `useMediaQuery` (`isMobile`) ya disponible para renderizar los botones rápidos (vencimientos, copiar enlace) con `Button` de ancho completo.
- **Esfuerzo**: **S-M** según la cantidad de campos ajustados.
- **Dependencias**: Ninguna; todo ocurre en `AdminCodigosPago.jsx`.

## Quick actions sugeridas (orden recomendado)
1. **Migrar alertas a toasts/banners** en `AdminReservas` (reduce fricción inmediata).
2. **Corregir `fechaVencimiento` en edición de códigos** y añadir helper texts.
3. **Clarificar/ajustar selección masiva** y mensaje de “Mostrando X de Y”.
4. **Propagar filtros/búsqueda al backend** para que la barra de búsqueda sea global.
5. **Iniciar code splitting en `AdminDashboard`** con `React.lazy` sobre módulos de baja frecuencia.

## Plan de pruebas recomendado
- **Manual**: Chrome 121 / Edge 121 en desktop (≥1280 px) y simulación iPhone 13 + iPad en DevTools. Verificar búsqueda global, selección masiva, creación/edición de códigos y flujo de asignación de vehículos.
- **Automatizado**: `npm run lint` y `npm run test` (si existieran pruebas). Validar que `authenticatedFetch` se use en los nuevos requests.
- **Performance**: Capturar profile (`Performance` tab) antes/después de habilitar lazy loading para estimar impacto en JS inicial.

## Supuestos y pendientes
- Credenciales de admin y datos de prueba deben estar disponibles al ejecutar QA manual (no verificados en esta sesión).
- Se requiere coordinar con backend si se decide soportar búsqueda global real; de momento solo se recomendó la modificación.
- QA debe adjuntar capturas y métricas LCP/TTI en la próxima iteración para cerrar la auditoría según lo planeado.

