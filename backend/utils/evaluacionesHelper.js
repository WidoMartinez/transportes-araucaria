// backend/utils/evaluacionesHelper.js
// Funciones auxiliares para el sistema de evaluaciones de conductores
import crypto from "crypto";
import Reserva from "../models/Reserva.js";
import EvaluacionConductor from "../models/EvaluacionConductor.js";
import EstadisticasConductor from "../models/EstadisticasConductor.js";

/**
 * Genera un token único para evaluación
 * @returns {string} Token único de 64 caracteres
 */
export const generarTokenEvaluacion = () => {
	return crypto.randomBytes(32).toString("hex");
};

/**
 * Calcula el promedio de calificaciones
 * @param {Object} calificaciones - Objeto con las 4 calificaciones
 * @returns {number} Promedio redondeado a 2 decimales
 */
export const calcularPromedioEvaluacion = (calificaciones) => {
	const { puntualidad, limpieza, seguridad, comunicacion } = calificaciones;
	const suma = puntualidad + limpieza + seguridad + comunicacion;
	const promedio = suma / 4;
	return Math.round(promedio * 100) / 100;
};

/**
 * Actualiza las estadísticas agregadas de un conductor
 * @param {number} conductorId - ID del conductor
 * @returns {Promise<Object>} Estadísticas actualizadas
 */
export const actualizarEstadisticasConductor = async (conductorId) => {
	try {
		// Obtener todas las evaluaciones del conductor
		const evaluaciones = await EvaluacionConductor.findAll({
			where: {
				conductorId,
				evaluada: true,
			},
		});

		const totalEvaluaciones = evaluaciones.length;

		// Si no hay evaluaciones, resetear estadísticas
		if (totalEvaluaciones === 0) {
			const [estadisticas] = await EstadisticasConductor.findOrCreate({
				where: { conductorId },
				defaults: {
					conductorId,
					promedioGeneral: 0,
					promedioPuntualidad: 0,
					promedioLimpieza: 0,
					promedioSeguridad: 0,
					promedioComunicacion: 0,
					totalEvaluaciones: 0,
					totalServiciosCompletados: 0,
					porcentajeEvaluado: 0,
					totalPropinasRecibidas: 0,
					cantidadPropinas: 0,
					promedioPropina: 0,
					cantidad5Estrellas: 0,
					mejorCalificadoEn: null,
				},
			});
			return estadisticas;
		}

		// Calcular promedios
		let sumaPuntualidad = 0;
		let sumaLimpieza = 0;
		let sumaSeguridad = 0;
		let sumaComunicacion = 0;
		let sumaGeneral = 0;
		let cantidad5Estrellas = 0;
		let totalPropinas = 0;
		let cantidadPropinas = 0;

		evaluaciones.forEach((evaluacion) => {
			sumaPuntualidad += evaluacion.calificacionPuntualidad;
			sumaLimpieza += evaluacion.calificacionLimpieza;
			sumaSeguridad += evaluacion.calificacionSeguridad;
			sumaComunicacion += evaluacion.calificacionComunicacion;
			sumaGeneral += parseFloat(evaluacion.calificacionPromedio || 0);

			// Contar evaluaciones de 5 estrellas (promedio >= 4.75)
			if (evaluacion.calificacionPromedio >= 4.75) {
				cantidad5Estrellas++;
			}

			// Sumar propinas pagadas
			if (evaluacion.propinaPagada && evaluacion.propinaMonto > 0) {
				totalPropinas += parseFloat(evaluacion.propinaMonto);
				cantidadPropinas++;
			}
		});

		const promedioPuntualidad = Math.round((sumaPuntualidad / totalEvaluaciones) * 100) / 100;
		const promedioLimpieza = Math.round((sumaLimpieza / totalEvaluaciones) * 100) / 100;
		const promedioSeguridad = Math.round((sumaSeguridad / totalEvaluaciones) * 100) / 100;
		const promedioComunicacion = Math.round((sumaComunicacion / totalEvaluaciones) * 100) / 100;
		const promedioGeneral = Math.round((sumaGeneral / totalEvaluaciones) * 100) / 100;
		const promedioPropina = cantidadPropinas > 0 
			? Math.round((totalPropinas / cantidadPropinas) * 100) / 100 
			: 0;

		// Determinar la categoría mejor calificada
		const promedios = {
			puntualidad: promedioPuntualidad,
			limpieza: promedioLimpieza,
			seguridad: promedioSeguridad,
			comunicacion: promedioComunicacion,
		};
		const mejorCategoria = Object.keys(promedios).reduce((a, b) =>
			promedios[a] > promedios[b] ? a : b
		);

		// Obtener total de servicios completados del conductor
		const totalServiciosCompletados = await Reserva.count({
			where: {
				conductorId,
				estado: "completada",
			},
		});

		const porcentajeEvaluado = totalServiciosCompletados > 0
			? Math.round((totalEvaluaciones / totalServiciosCompletados) * 10000) / 100
			: 0;

		// Actualizar o crear estadísticas
		const [estadisticas] = await EstadisticasConductor.findOrCreate({
			where: { conductorId },
			defaults: {
				conductorId,
				promedioGeneral,
				promedioPuntualidad,
				promedioLimpieza,
				promedioSeguridad,
				promedioComunicacion,
				totalEvaluaciones,
				totalServiciosCompletados,
				porcentajeEvaluado,
				totalPropinasRecibidas: totalPropinas,
				cantidadPropinas,
				promedioPropina,
				cantidad5Estrellas,
				mejorCalificadoEn: mejorCategoria,
			},
		});

		await estadisticas.update({
			promedioGeneral,
			promedioPuntualidad,
			promedioLimpieza,
			promedioSeguridad,
			promedioComunicacion,
			totalEvaluaciones,
			totalServiciosCompletados,
			porcentajeEvaluado,
			totalPropinasRecibidas: totalPropinas,
			cantidadPropinas,
			promedioPropina,
			cantidad5Estrellas,
			mejorCalificadoEn: mejorCategoria,
		});

		console.log(`✅ Estadísticas actualizadas para conductor ${conductorId}`);
		return estadisticas;
	} catch (error) {
		console.error(`❌ Error actualizando estadísticas del conductor ${conductorId}:`, error);
		throw error;
	}
};

/**
 * Crea una orden de pago en Flow para propina
 * @param {Object} params - Parámetros de la orden
 * @returns {Promise<Object>} Datos de la orden de Flow
 */
export const crearOrdenFlowPropina = async (params) => {
	const {
		evaluacionId,
		monto,
		email,
		conductorNombre,
		apiKey,
		secretKey,
		backendUrl,
	} = params;

	// Crear firma para Flow
	const signParams = (flowParams) => {
		const sortedKeys = Object.keys(flowParams).sort();
		let toSign = "";
		sortedKeys.forEach((key) => {
			toSign += key + flowParams[key];
		});
		return crypto.createHmac("sha256", secretKey).update(toSign).digest("hex");
	};

	const commerceOrder = `PROPINA-${evaluacionId}-${Date.now()}`;
	const description = `Propina para conductor ${conductorNombre}`;

	const flowParams = {
		apiKey,
		commerceOrder,
		subject: description,
		currency: "CLP",
		amount: Number(monto),
		email,
		urlConfirmation: `${backendUrl}/api/flow-confirmation`,
		urlReturn: `${backendUrl}/api/payment-result`,
		optional: JSON.stringify({
			evaluacionId,
			paymentOrigin: "propina",
			commerceOrder,
		}),
	};

	flowParams.s = signParams(flowParams);

	return {
		params: flowParams,
		commerceOrder,
	};
};
