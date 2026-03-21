/* eslint-env node */
// backend/utils/evaluacionesHelper.js
// Funciones auxiliares para el sistema de evaluaciones de conductor post-viaje

import crypto from "crypto";
import axios from "axios";

/**
 * Genera un token SHA-256 único para el enlace de evaluación.
 * Combina timestamp, número aleatorio y prefijo para asegurar unicidad.
 * @returns {string} Token hexadecimal de 64 caracteres
 */
export const generarTokenEvaluacion = () => {
	const data = `evaluacion-${Date.now()}-${Math.random().toString(36).slice(2)}-${crypto.randomBytes(16).toString("hex")}`;
	return crypto.createHash("sha256").update(data).digest("hex");
};

/**
 * Calcula el promedio de las 4 calificaciones de la evaluación.
 * @param {number} puntualidad - Calificación de puntualidad (1-5)
 * @param {number} limpieza - Calificación de limpieza (1-5)
 * @param {number} seguridad - Calificación de seguridad (1-5)
 * @param {number} comunicacion - Calificación de comunicación (1-5)
 * @returns {number} Promedio con 2 decimales
 */
export const calcularPromedioEvaluacion = (puntualidad, limpieza, seguridad, comunicacion) => {
	const valores = [
		Number(puntualidad),
		Number(limpieza),
		Number(seguridad),
		Number(comunicacion),
	];
	const suma = valores.reduce((acc, v) => acc + v, 0);
	return parseFloat((suma / valores.length).toFixed(2));
};

/**
 * Firma los parámetros de Flow usando HMAC-SHA256.
 * Replica la misma lógica de signParams en server-db.js.
 * @param {Object} params - Parámetros a firmar
 * @returns {string} Firma hexadecimal
 */
const signFlowParams = (params) => {
	const secretKey = process.env.FLOW_SECRET_KEY;
	const sortedKeys = Object.keys(params).sort();
	let toSign = "";
	sortedKeys.forEach((key) => {
		toSign += key + params[key];
	});
	return crypto.createHmac("sha256", secretKey).update(toSign).digest("hex");
};

/**
 * Crea una orden de pago en Flow para una propina post-viaje.
 * Usa la misma API key y forma de construir la orden que el resto del sistema.
 * @param {number} monto - Monto de la propina en CLP
 * @param {string} reservaCodigo - Código de la reserva (para el asunto del pago)
 * @param {number} evaluacionId - ID de la evaluación en BD
 * @param {string} clienteEmail - Email del pasajero que paga la propina
 * @returns {Promise<{url: string, token: string, flowOrder: number}>} Datos de la orden creada
 */
export const crearOrdenFlowPropina = async (monto, reservaCodigo, evaluacionId, clienteEmail) => {
	const flowApiUrl = process.env.FLOW_API_URL || "https://www.flow.cl/api";
	const backendBase = process.env.BACKEND_URL || "https://transportes-araucaria.onrender.com";

	const commerceOrder = `PROPINA-${reservaCodigo || evaluacionId}-${Date.now()}`;

	// Metadata para identificar la propina en el webhook de confirmación
	const optionalPayload = {
		paymentOrigin: "propina_evaluacion",
		evaluacionId: evaluacionId,
		commerceOrder,
	};

	const params = {
		apiKey: process.env.FLOW_API_KEY,
		commerceOrder,
		subject: `Propina - Reserva #${reservaCodigo || evaluacionId}`,
		currency: "CLP",
		amount: Number(monto),
		email: clienteEmail,
		urlConfirmation: `${backendBase}/api/flow-confirmation`,
		urlReturn: `${backendBase}/api/payment-result`,
		optional: JSON.stringify(optionalPayload),
	};

	params.s = signFlowParams(params);

	const response = await axios.post(
		`${flowApiUrl}/payment/create`,
		new URLSearchParams(params).toString(),
		{ headers: { "Content-Type": "application/x-www-form-urlencoded" } }
	);

	const payment = response.data;

	if (!payment.url || !payment.token) {
		throw new Error("Respuesta inválida desde Flow al crear orden de propina");
	}

	return {
		flowUrl: `${payment.url}?token=${payment.token}`,
		token: payment.token,
		flowOrder: payment.flowOrder,
	};
};
