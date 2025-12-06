// src/components/AlertaDescuentoRetorno.jsx
// Componente para mostrar alertas de descuentos escalonados en reservas de retorno
import React, { useMemo } from "react";
import { Badge } from "./ui/badge";
import { Sparkles, Clock, TrendingDown, AlertCircle, Gift, Info } from "lucide-react";
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
	mostrarOpciones = false,
	oportunidadesRetorno = null // Nueva prop para sistema universal
}) {
	// 1. PRIORIDAD: Si hay oportunidades de retorno universales (nuevo sistema), mostrar esa alerta INMEDIATAMENTE
	if (oportunidadesRetorno && oportunidadesRetorno.opciones?.length > 0) {
		const oportunidad = oportunidadesRetorno.opciones[0];
		return (
			<motion.div
				initial={{ opacity: 0, y: -10 }}
				animate={{ opacity: 1, y: 0 }}
				className="rounded-xl p-4 bg-gradient-to-r from-emerald-500/10 to-green-500/10 border-2 border-emerald-400/50 shadow-sm mt-4"
			>
				<div className="flex items-start gap-3">
					<div className="p-2 rounded-full bg-emerald-500/10 text-emerald-500">
						<Sparkles className="h-5 w-5" />
					</div>
					<div className="flex-1 min-w-0">
						<div className="flex items-center gap-2 flex-wrap">
							<h4 className="font-bold text-emerald-700">
								¡Aprovecha el Retorno Disponible!
							</h4>
							<Badge className="bg-emerald-500 text-white font-bold">
								Hasta -50%
							</Badge>
						</div>
						<p className="text-sm text-emerald-700 mt-1">
							Hay {oportunidadesRetorno.opciones.length} vehículo(s) regresando. 
							Selecciona un horario con descuento:
						</p>
						
						{/* Mostrar opciones de horario */}
						<div className="mt-3 grid grid-cols-3 gap-2">
							{oportunidad.opcionesRetorno.map((opcion, index) => (
								<button
									key={index}
									type="button"
									onClick={() => onSeleccionarHorario?.(opcion.hora)}
									className="p-2 rounded-lg border border-emerald-400/30 bg-white hover:bg-emerald-50 text-center transition-all hover:scale-105 hover:shadow-md cursor-pointer"
								>
									<div className="font-bold text-sm text-emerald-700">
										{opcion.hora}
									</div>
									<Badge variant="secondary" className="text-xs mt-1 bg-emerald-100 text-emerald-700">
										-{opcion.descuento}%
									</Badge>
								</button>
							))}
						</div>
						
						<div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
							<Info className="h-3 w-3" />
							<span>
								Vehículo termina servicio ~{oportunidad.horaTerminoEstimada}
							</span>
						</div>
					</div>
				</div>
			</motion.div>
		);
	}

	// 2. LÓGICA ANTIGUA (Legacy): Si no hay sistema universal, intentar mostrar alerta antigua
	
	// Si no hay información de descuento antigua, no mostrar nada
	if (!descuentoInfo || !horaTerminoServicio) {
		return null;
	}

	// Calcular opciones de descuento disponibles (solo si aplica lógica antigua)
	const opcionesDescuento = useMemo(() => {
		if (!horaTerminoServicio) return [];
		return generarOpcionesDescuento(horaTerminoServicio);
	}, [horaTerminoServicio]);

	// Calcular ahorro potencial
	const ahorroPotencial = useMemo(() => {
		if (!precioOriginal || !descuentoInfo?.porcentajeDescuento) return 0;
		return Math.round(precioOriginal * (descuentoInfo.porcentajeDescuento / 100));
	}, [precioOriginal, descuentoInfo?.porcentajeDescuento]);

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
