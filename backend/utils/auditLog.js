import AdminAuditLog from "../models/AdminAuditLog.js";

/**
 * Utilidad para registrar acciones en el log de auditoría
 */

/**
 * Registrar acción en el log de auditoría
 * @param {object} params - Parámetros del log
 * @param {number} params.adminUserId - ID del usuario admin
 * @param {string} params.accion - Tipo de acción
 * @param {string} params.entidad - Entidad afectada (opcional)
 * @param {number} params.entidadId - ID de la entidad (opcional)
 * @param {object} params.detalles - Detalles adicionales (opcional)
 * @param {string} params.ip - IP del usuario
 * @param {string} params.userAgent - User agent del navegador
 * @param {string} params.resultado - Resultado de la acción (exitoso, fallido, bloqueado)
 * @returns {Promise<object>} - Log creado
 */
export const logAction = async ({
	adminUserId,
	accion,
	entidad = null,
	entidadId = null,
	detalles = null,
	ip = null,
	userAgent = null,
	resultado = "exitoso",
}) => {
	try {
		const log = await AdminAuditLog.create({
			adminUserId,
			accion,
			entidad,
			entidadId,
			detalles: detalles ? JSON.stringify(detalles) : null,
			ip,
			userAgent,
			resultado,
		});

		return log;
	} catch (error) {
		console.error("Error al crear log de auditoría:", error);
		// No lanzamos error para no interrumpir la operación principal
		return null;
	}
};

/**
 * Registrar intento de login
 * @param {object} params - Parámetros del login
 */
export const logLogin = async ({
	adminUserId,
	username,
	ip,
	userAgent,
	exitoso,
}) => {
	return logAction({
		adminUserId,
		accion: exitoso ? "login_exitoso" : "login_fallido",
		detalles: { username },
		ip,
		userAgent,
		resultado: exitoso ? "exitoso" : "fallido",
	});
};

/**
 * Registrar logout
 */
export const logLogout = async ({ adminUserId, ip, userAgent }) => {
	return logAction({
		adminUserId,
		accion: "logout",
		ip,
		userAgent,
		resultado: "exitoso",
	});
};

/**
 * Registrar cuenta bloqueada
 */
export const logAccountLocked = async ({ adminUserId, username, ip, userAgent }) => {
	return logAction({
		adminUserId,
		accion: "cuenta_bloqueada",
		detalles: { username, razon: "Múltiples intentos fallidos" },
		ip,
		userAgent,
		resultado: "bloqueado",
	});
};

/**
 * Registrar creación de entidad
 */
export const logCreate = async ({
	adminUserId,
	entidad,
	entidadId,
	detalles,
	ip,
	userAgent,
}) => {
	return logAction({
		adminUserId,
		accion: "crear",
		entidad,
		entidadId,
		detalles,
		ip,
		userAgent,
	});
};

/**
 * Registrar actualización de entidad
 */
export const logUpdate = async ({
	adminUserId,
	entidad,
	entidadId,
	detalles,
	ip,
	userAgent,
}) => {
	return logAction({
		adminUserId,
		accion: "actualizar",
		entidad,
		entidadId,
		detalles,
		ip,
		userAgent,
	});
};

/**
 * Registrar eliminación de entidad
 */
export const logDelete = async ({
	adminUserId,
	entidad,
	entidadId,
	detalles,
	ip,
	userAgent,
}) => {
	return logAction({
		adminUserId,
		accion: "eliminar",
		entidad,
		entidadId,
		detalles,
		ip,
		userAgent,
	});
};

/**
 * Obtener IP del request
 */
export const getIpFromRequest = (req) => {
	return (
		req.headers["x-forwarded-for"]?.split(",")[0] ||
		req.headers["x-real-ip"] ||
		req.connection?.remoteAddress ||
		req.socket?.remoteAddress ||
		null
	);
};

/**
 * Obtener User Agent del request
 */
export const getUserAgentFromRequest = (req) => {
	return req.headers["user-agent"] || null;
};

export default {
	logAction,
	logLogin,
	logLogout,
	logAccountLocked,
	logCreate,
	logUpdate,
	logDelete,
	getIpFromRequest,
	getUserAgentFromRequest,
};
