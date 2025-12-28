# 📅 Guía de Uso: Planificación y Calendario de Viajes

Esta funcionalidad permite a los administradores generar una vista imprimible y cronológica de todas las reservas dentro de un rango de fechas específico.

## 🚀 Acceso
Desde el panel de **Reservas**, haz clic en el botón **"Planificación"** (icono de impresora <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-printer"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect width="12" height="8" x="6" y="14"></rect></svg>) ubicado en la barra de herramientas superior.

## 📋 Funcionalidades Clave

### 1. Selección de Fechas
Puedes seleccionar un rango personalizado o usar los accesos rápidos:
- **Hoy**: Muestra viajes de ida y retornos programados para el día actual.
- **Mañana**: Útil para preparar la jornada siguiente.
- **Próx. 7 días**: Vista semanal completa.

### 2. Gestión de Retornos (Ida y Vuelta)
El sistema maneja inteligentemente las reservas de "Ida y Vuelta":
- **Ida**: Aparece en la fecha de inicio normal.
- **Vuelta**: El sistema genera automáticamente una entrada de "RETORNO" en la fecha de regreso correspondiente.
- **Visualización**: Los retornos se marcan con una etiqueta azul **RETORNO** y muestran el trayecto invertido (Destino original -> Origen original).

### 3. Vista de Impresión
Al hacer clic en "Generar Vista de Impresión":
- Se abre una **nueva pestaña** limpia, sin menús ni distracciones.
- Los viajes se agrupan por **Día**.
- Se muestran datos esenciales: Hora, Cliente, Teléfono, Ruta y Vehículo asignado.
- Formato optimizado para usar `Ctrl + P` o el botón "IMPRIMIR" en pantalla.

## 🛠️ Consejos
- **Asignaciones**: Asegúrate de asignar vehículos y conductores antes de imprimir la planificación diaria para que la hoja de ruta esté completa.
- **Cambios de último minuto**: Si editas una reserva, vuelve a generar la vista de impresión para reflejar los cambios.
