// src/utils/descuentoRetorno.js
// Utilidades para cálculo de descuentos escalonados en reservas de retorno

import { DESCUENTOS_RETORNO } from "../constants/tiempos";

/**
 * Calcula el descuento escalonado según el tiempo transcurrido desde el término del servicio original
 * Según el issue:
 * - 30 min (18:00 si termina a las 17:30) → 50% descuento
 * - 45 min (18:15) → 30% descuento
 * - 60 min (18:30) → 20% descuento
 * - Más de 60 min → sin descuento (precio normal)
 * 
 * @param {Date} horaTerminoServicio - Hora de término del servicio original
 * @param {Date} horaRetorno - Hora seleccionada para el retorno
 * @returns {Object} { porcentajeDescuento, mensaje, aplica, rangoMinutos, tipo }
 */
export const calcularDescuentoEscalonado = (horaTerminoServicio, horaRetorno) => {
	if (!horaTerminoServicio || !horaRetorno) {
		return { porcentajeDescuento: 0, mensaje: "", aplica: false, rangoMinutos: null };
	}

	// Calcular diferencia en minutos
	const diferenciaMs = horaRetorno.getTime() - horaTerminoServicio.getTime();
	const diferenciaMinutos = Math.round(diferenciaMs / (1000 * 60));

	// La holgura mínima es de 30 minutos para que aplique el descuento
	// Rechazar si es menor a 30 minutos (el retorno sería muy pronto)
	if (diferenciaMinutos < DESCUENTOS_RETORNO.MAXIMO.MINUTOS) {
		return {
			porcentajeDescuento: 0,
			mensaje: "El retorno debe ser al menos 30 minutos después del término del servicio",
			aplica: false,
			rangoMinutos: diferenciaMinutos,
			tipo: "muy_pronto"
		};
	}

	// Descuentos escalonados según especificaciones del issue:
	// - 30 min exactos → 50% descuento
	// - 31-45 min → 30% descuento
	// - 46-60 min → 20% descuento
	// - >60 min → sin descuento
	if (diferenciaMinutos === DESCUENTOS_RETORNO.MAXIMO.MINUTOS) {
		return {
			porcentajeDescuento: DESCUENTOS_RETORNO.MAXIMO.PORCENTAJE,
			mensaje: "¡Descuento máximo! Aprovecha el retorno inmediato",
			aplica: true,
			rangoMinutos: diferenciaMinutos,
			tipo: "maximo"
		};
	}

	if (diferenciaMinutos <= DESCUENTOS_RETORNO.INTERMEDIO.MINUTOS_MAX) {
		return {
			porcentajeDescuento: DESCUENTOS_RETORNO.INTERMEDIO.PORCENTAJE,
			mensaje: "Buen descuento por retorno cercano",
			aplica: true,
			rangoMinutos: diferenciaMinutos,
			tipo: "intermedio"
		};
	}

	if (diferenciaMinutos <= DESCUENTOS_RETORNO.BASICO.MINUTOS_MAX) {
		return {
			porcentajeDescuento: DESCUENTOS_RETORNO.BASICO.PORCENTAJE,
			mensaje: "Descuento por retorno dentro de la hora",
			aplica: true,
			rangoMinutos: diferenciaMinutos,
			tipo: "basico"
		};
	}

	// Más de 60 minutos: sin descuento
	return {
		porcentajeDescuento: 0,
		mensaje: "El horario seleccionado no aplica para descuento por retorno",
		aplica: false,
		rangoMinutos: diferenciaMinutos,
		tipo: "sin_descuento"
	};
};

/**
 * Genera las opciones de horarios con descuento para mostrar al usuario
 * @param {Date} horaTerminoServicio - Hora de término del servicio original  
 * @returns {Array} Lista de opciones con horario y descuento
 */
export const generarOpcionesDescuento = (horaTerminoServicio) => {
	if (!horaTerminoServicio) return [];

	const opciones = [];
	
	// Opción 1: 30 minutos después (50%)
	const hora30min = new Date(horaTerminoServicio.getTime() + DESCUENTOS_RETORNO.MAXIMO.MINUTOS * 60 * 1000);
	opciones.push({
		hora: hora30min,
		horaFormateada: formatearHora(hora30min),
		descuento: DESCUENTOS_RETORNO.MAXIMO.PORCENTAJE,
		etiqueta: "Mejor precio",
		color: "green"
	});

	// Opción 2: 45 minutos después (30%)
	const hora45min = new Date(horaTerminoServicio.getTime() + DESCUENTOS_RETORNO.INTERMEDIO.MINUTOS_MAX * 60 * 1000);
	opciones.push({
		hora: hora45min,
		horaFormateada: formatearHora(hora45min),
		descuento: DESCUENTOS_RETORNO.INTERMEDIO.PORCENTAJE,
		etiqueta: "Buen precio",
		color: "yellow"
	});

	// Opción 3: 60 minutos después (20%)
	const hora60min = new Date(horaTerminoServicio.getTime() + DESCUENTOS_RETORNO.BASICO.MINUTOS_MAX * 60 * 1000);
	opciones.push({
		hora: hora60min,
		horaFormateada: formatearHora(hora60min),
		descuento: DESCUENTOS_RETORNO.BASICO.PORCENTAJE,
		etiqueta: "Descuento",
		color: "orange"
	});

	return opciones;
};

/**
 * Formatea una hora en formato HH:MM
 * @param {Date} fecha - Objeto Date a formatear
 * @returns {string} Hora formateada en HH:MM
 */
export const formatearHora = (fecha) => {
	if (!fecha) return "";
	return fecha.toLocaleTimeString("es-CL", {
		hour: "2-digit",
		minute: "2-digit",
		hour12: false
	});
};

/**
 * Obtiene el esquema de colores según el porcentaje de descuento
 * @param {number} porcentaje - Porcentaje de descuento
 * @returns {Object} Objeto con clases de color para diferentes elementos
 */
export const getColorScheme = (porcentaje) => {
	if (porcentaje >= 50) {
		return {
			bg: "bg-gradient-to-r from-emerald-500/10 to-green-500/10",
			border: "border-emerald-400/50",
			text: "text-emerald-700",
			badge: "bg-emerald-500 text-white",
			icon: "text-emerald-500"
		};
	}
	if (porcentaje >= 30) {
		return {
			bg: "bg-gradient-to-r from-yellow-500/10 to-amber-500/10",
			border: "border-yellow-400/50",
			text: "text-yellow-700",
			badge: "bg-yellow-500 text-white",
			icon: "text-yellow-500"
		};
	}
	if (porcentaje >= 20) {
		return {
			bg: "bg-gradient-to-r from-orange-500/10 to-amber-500/10",
			border: "border-orange-400/50",
			text: "text-orange-700",
			badge: "bg-orange-500 text-white",
			icon: "text-orange-500"
		};
	}
	return {
		bg: "bg-muted/50",
		border: "border-muted-foreground/20",
		text: "text-muted-foreground",
		badge: "bg-muted text-muted-foreground",
		icon: "text-muted-foreground"
	};
};
