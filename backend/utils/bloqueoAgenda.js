import { Op } from "sequelize";
import BloqueoAgenda from "../models/BloqueoAgenda.js";

/**
 * Verifica si una fecha y hora están bloqueadas según los bloqueos de agenda configurados
 * @param {Date|string} fecha - Fecha a verificar (formato YYYY-MM-DD)
 * @param {string} hora - Hora a verificar (formato HH:MM:SS o HH:MM) - opcional
 * @returns {Promise<{bloqueado: boolean, motivo?: string, bloqueo?: Object}>}
 */
export const verificarBloqueoAgenda = async (fecha, hora = null) => {
	try {
		// Convertir fecha a formato YYYY-MM-DD si es objeto Date
		const fechaStr = fecha instanceof Date 
			? fecha.toISOString().split('T')[0] 
			: fecha;

		// Buscar bloqueos activos que apliquen a esta fecha
		const bloqueos = await BloqueoAgenda.findAll({
			where: {
				activo: true,
				fechaInicio: {
					[Op.lte]: fechaStr, // Fecha de inicio menor o igual a la fecha consultada
				},
				[Op.or]: [
					{ fechaFin: null }, // Bloqueo de un solo día
					{ fechaFin: { [Op.gte]: fechaStr } }, // O fecha de fin mayor o igual
				],
			},
		});

		// Si no hay bloqueos para esta fecha, no está bloqueado
		if (bloqueos.length === 0) {
			return { bloqueado: false };
		}

		// Verificar cada bloqueo encontrado
		for (const bloqueo of bloqueos) {
			const { tipo, horaInicio, horaFin, motivo } = bloqueo;

			// Si es día completo o fecha específica, está bloqueado
			if (tipo === "dia_completo" || tipo === "fecha_especifica") {
				return {
					bloqueado: true,
					motivo: motivo || "Fecha bloqueada por el administrador",
					bloqueo: bloqueo.toJSON(),
				};
			}

			// Si es rango horario, verificar si la hora cae dentro del rango
			if (tipo === "rango_horario" && hora) {
				// Normalizar hora a formato HH:MM para comparación
				const horaNormalizada = hora.substring(0, 5); // Obtener solo HH:MM
				const horaInicioNorm = horaInicio ? horaInicio.substring(0, 5) : null;
				const horaFinNorm = horaFin ? horaFin.substring(0, 5) : null;

				// Si hay hora de inicio y fin definidas
				if (horaInicioNorm && horaFinNorm) {
					// Verificar si la hora está dentro del rango bloqueado
					if (horaNormalizada >= horaInicioNorm && horaNormalizada <= horaFinNorm) {
						return {
							bloqueado: true,
							motivo: motivo || `Horario bloqueado entre ${horaInicioNorm} y ${horaFinNorm}`,
							bloqueo: bloqueo.toJSON(),
						};
					}
				}
			}
		}

		// Si ningún bloqueo aplica, no está bloqueado
		return { bloqueado: false };
	} catch (error) {
		console.error("Error al verificar bloqueo de agenda:", error);
		// En caso de error, por seguridad no bloqueamos (permitir la reserva)
		return { bloqueado: false };
	}
};

/**
 * Obtiene todos los bloqueos activos para un rango de fechas
 * @param {Date|string} fechaInicio - Fecha de inicio del rango
 * @param {Date|string} fechaFin - Fecha de fin del rango
 * @returns {Promise<Array>} Lista de bloqueos en el rango
 */
export const obtenerBloqueosEnRango = async (fechaInicio, fechaFin) => {
	try {
		const fechaInicioStr = fechaInicio instanceof Date 
			? fechaInicio.toISOString().split('T')[0] 
			: fechaInicio;
		const fechaFinStr = fechaFin instanceof Date 
			? fechaFin.toISOString().split('T')[0] 
			: fechaFin;

		const bloqueos = await BloqueoAgenda.findAll({
			where: {
				activo: true,
				[Op.or]: [
					{
						// Bloqueos que empiezan dentro del rango
						fechaInicio: {
							[Op.between]: [fechaInicioStr, fechaFinStr],
						},
					},
					{
						// Bloqueos que terminan dentro del rango
						fechaFin: {
							[Op.between]: [fechaInicioStr, fechaFinStr],
						},
					},
					{
						// Bloqueos que contienen todo el rango
						[Op.and]: [
							{ fechaInicio: { [Op.lte]: fechaInicioStr } },
							{
								[Op.or]: [
									{ fechaFin: null },
									{ fechaFin: { [Op.gte]: fechaFinStr } },
								],
							},
						],
					},
				],
			},
			order: [["fechaInicio", "ASC"]],
		});

		return bloqueos;
	} catch (error) {
		console.error("Error al obtener bloqueos en rango:", error);
		return [];
	}
};
