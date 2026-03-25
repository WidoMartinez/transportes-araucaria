# Skill: Optimización de Modales Admin

Esta skill define los estándares y procedimientos para mejorar, optimizar y embellecer los modales del panel administrativo (`AdminReservas`).

## 🎯 Objetivos
1.  **Reducción de Deuda Técnica**: Extraer la lógica de los modales de `AdminReservas.jsx` (actualmente >7000 líneas) a componentes aislados.
2.  **Excelencia Visual**: Implementar diseños premium que incluyan micro-animaciones, estados de carga (skeletons) y transiciones suaves.
3.  **Rendimiento**: Minimizar re-renders en el listado principal al interactuar con un modal específico.
4.  **UX Móvil**: Adaptar los modales para que sean 100% funcionales y cómodos en dispositivos pequeños.

## 🛠️ Protocolo de Optimización

### 1. Extracción y Componentización
Al intervenir un modal en `AdminReservas.jsx`, sigue este patrón:
- Crear el componente en `src/components/modals/[Nombre]Modal.jsx`.
- Pasar solo las props necesarias (datos de la reserva, funciones de cierre y onUpdate).
- Usar `React.memo` si el modal se abre/cierra frecuentemente.

### 2. Estándar UI/UX (Shadcn/UI Premium)
- **Header**: Título descriptivo + icono de `lucide-react`.
- **Content**: Uso de `ScrollArea` si el contenido es largo. Agrupar campos en `Card` o secciones con separadores.
- **Footer**: Botón principal a la derecha, botón de cancelar a la izquierda.
- **Loading State**: El botón principal debe entrar en estado `disabled` y mostrar un spinner durante la operación.

### 3. Manejo de Errores y Feedback
- Cada acción asíncrona dentro de un modal DEBE estar envuelta en un `try-catch`.
- Usar `toast.promise` para mostrar el progreso de operaciones largas (como la asignación de conductores).
- Notificar errores específicos en lugar de mensajes genéricos.

## 📐 Ejemplo de Estructura Premium (Referencia)
```jsx
<Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent className="max-w-2xl">
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        <Car className="w-5 h-5 text-primary" />
        Asignar Vehículo
      </DialogTitle>
    </DialogHeader>
    {/* Body con ScrollArea y Grid */}
    <div className="grid gap-4 py-4">
      {loading ? <Skeleton className="h-40 w-full" /> : <FormContent />}
    </div>
    <DialogFooter>
      <Button variant="outline" onClick={onClose}>Cancelar</Button>
      <Button onClick={handleSave} disabled={saving}>
        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Confirmar Asignación
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

## 📜 Comandos de Ayuda
- `npx shadcn-ui@latest add dialog`: Para asegurar que la base esté actualizada.
- `grep -n "Dialog" src/components/AdminReservas.jsx`: Localizar todos los modales pendientes de extracción.
