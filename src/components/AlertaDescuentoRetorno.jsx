// src/components/AlertaDescuentoRetorno.jsx
// Componente para mostrar alertas de descuentos escalonados en reservas de retorno
import React, { useMemo } from "react";
import { Badge } from "./ui/badge";
import { Sparkles, Clock, TrendingDown, AlertCircle, Gift } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { generarOpcionesDescuento, getColorScheme } from "../utils/descuentoRetorno";

/**
 * Componente visual para mostrar la alerta de descuento por retorno
 */
function AlertaDescuentoRetorno({
descuentoInfo,
horaTerminoServicio,
precioOriginal,
onSeleccionarHorario,
mostrarOpciones = false
}) {
// Calcular opciones de descuento disponibles
const opcionesDescuento = useMemo(() => {
if (!horaTerminoServicio) return [];
return generarOpcionesDescuento(horaTerminoServicio);
}, [horaTerminoServicio]);

// Calcular ahorro potencial
const ahorroPotencial = useMemo(() => {
if (!precioOriginal || !descuentoInfo?.porcentajeDescuento) return 0;
return Math.round(precioOriginal * (descuentoInfo.porcentajeDescuento / 100));
}, [precioOriginal, descuentoInfo?.porcentajeDescuento]);

// Si no hay información de descuento, no mostrar nada
if (!descuentoInfo || !horaTerminoServicio) {
return null;
}

const colors = getColorScheme(descuentoInfo.porcentajeDescuento);

return (
<AnimatePresence>
{descuentoInfo.aplica ? (
<motion.div
initial={{ opacity: 0, y: -10, scale: 0.95 }}
animate={{ opacity: 1, y: 0, scale: 1 }}
exit={{ opacity: 0, y: -10, scale: 0.95 }}
transition={{ duration: 0.3 }}
className={`rounded-xl p-4 ${colors.bg} border-2 ${colors.border} shadow-sm`}
>
<div className="flex items-start gap-3">
<div className={`p-2 rounded-full ${colors.bg} ${colors.icon}`}>
<Sparkles className="h-5 w-5" />
</div>

<div className="flex-1 min-w-0">
<div className="flex items-center gap-2 flex-wrap">
<h4 className={`font-bold ${colors.text}`}>
¡Descuento por Retorno!
</h4>
<Badge className={`${colors.badge} font-bold animate-pulse`}>
-{descuentoInfo.porcentajeDescuento}%
</Badge>
</div>

<p className={`text-sm ${colors.text} mt-1`}>
{descuentoInfo.mensaje}
</p>

{ahorroPotencial > 0 && (
<div className="flex items-center gap-2 mt-2">
<TrendingDown className={`h-4 w-4 ${colors.icon}`} />
<span className={`text-sm font-semibold ${colors.text}`}>
Ahorras hasta ${ahorroPotencial.toLocaleString("es-CL")}
</span>
</div>
)}

{/* Información del horario recomendado */}
<div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
<Clock className="h-3 w-3" />
<span>
Retorno a las{" "}
{new Date(
horaTerminoServicio.getTime() + descuentoInfo.rangoMinutos * 60 * 1000
).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}{" "}
({descuentoInfo.rangoMinutos} min después)
</span>
</div>
</div>
</div>

{/* Mostrar opciones de horarios con descuento si está habilitado */}
{mostrarOpciones && opcionesDescuento.length > 0 && (
<div className="mt-4 pt-4 border-t border-dashed border-current/20">
<p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
<Gift className="h-3 w-3" />
Opciones de horario con descuento:
</p>
<div className="grid grid-cols-3 gap-2">
{opcionesDescuento.map((opcion, index) => (
<button
key={index}
type="button"
onClick={() => onSeleccionarHorario?.(opcion.hora)}
className={`
p-2 rounded-lg border text-center transition-all
hover:scale-105 hover:shadow-md cursor-pointer
${getColorScheme(opcion.descuento).bg}
${getColorScheme(opcion.descuento).border}
`}
>
<div className={`font-bold text-sm ${getColorScheme(opcion.descuento).text}`}>
{opcion.horaFormateada}
</div>
<Badge variant="secondary" className="text-xs mt-1">
-{opcion.descuento}%
</Badge>
</button>
))}
</div>
</div>
)}
</motion.div>
) : descuentoInfo.tipo === "muy_pronto" ? (
<motion.div
initial={{ opacity: 0 }}
animate={{ opacity: 1 }}
className="rounded-lg p-3 bg-yellow-500/10 border border-yellow-400/30"
>
<div className="flex items-center gap-2">
<AlertCircle className="h-4 w-4 text-yellow-600" />
<span className="text-sm text-yellow-700">
{descuentoInfo.mensaje}
</span>
</div>
</motion.div>
) : descuentoInfo.tipo === "sin_descuento" ? (
<motion.div
initial={{ opacity: 0 }}
animate={{ opacity: 1 }}
className="rounded-lg p-3 bg-muted/50 border border-muted-foreground/20"
>
<div className="flex items-start gap-2">
<Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
<div>
<span className="text-sm text-muted-foreground block">
{descuentoInfo.mensaje}
</span>
{opcionesDescuento.length > 0 && (
<span className="text-xs text-primary mt-1 block">
💡 Selecciona un horario antes de las{" "}
{opcionesDescuento[2]?.horaFormateada} para obtener descuento
</span>
)}
</div>
</div>
</motion.div>
) : null}
</AnimatePresence>
);
}

export default AlertaDescuentoRetorno;
