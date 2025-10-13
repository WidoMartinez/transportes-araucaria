/**
 * Utilidades para envío de correos electrónicos
 * Funciones helper para formatear información de conductores y vehículos
 */

/**
 * Obtiene los últimos 4 dígitos de una patente
 * @param {string} patente - Patente del vehículo (ej: "ABCD12", "AB-CD-12")
 * @returns {string} - Últimos 4 caracteres de la patente
 */
export function obtenerUltimos4Patente(patente) {
	if (!patente) return "****";
	
	// Eliminar guiones y espacios
	const patenteLimpia = patente.replace(/[-\s]/g, "");
	
	// Obtener últimos 4 caracteres
	if (patenteLimpia.length >= 4) {
		return patenteLimpia.slice(-4);
	}
	
	return patenteLimpia;
}

/**
 * Formatea la información del conductor para mostrar en emails
 * @param {Object} conductor - Objeto conductor de la base de datos
 * @returns {string} - Nombre del conductor
 */
export function formatearInfoConductor(conductor) {
	if (!conductor || !conductor.nombre) {
		return "Por asignar";
	}
	return conductor.nombre;
}

/**
 * Formatea la información del vehículo para mostrar en emails (solo últimos 4 dígitos)
 * @param {Object} vehiculo - Objeto vehículo de la base de datos
 * @returns {string} - Información del vehículo formateada
 */
export function formatearInfoVehiculo(vehiculo) {
	if (!vehiculo) {
		return "Por asignar";
	}
	
	const ultimos4 = obtenerUltimos4Patente(vehiculo.patente);
	const tipo = vehiculo.tipo || "";
	
	return `${tipo} (***${ultimos4})`;
}

/**
 * Envía notificación al servidor de Hostinger sobre asignación de conductor/vehículo
 * @param {Object} reserva - Datos de la reserva
 * @param {Object} conductor - Datos del conductor asignado
 * @param {Object} vehiculo - Datos del vehículo asignado
 * @returns {Promise<Object>} - Respuesta del servidor
 */
export async function notificarAsignacionConductor(reserva, conductor, vehiculo) {
	try {
		const emailUrl = process.env.EMAIL_NOTIFICATION_URL || 
			"https://www.transportesaraucaria.cl/enviar_notificacion_asignacion.php";
		
		const payload = {
			reservaId: reserva.id,
			nombre: reserva.nombre,
			email: reserva.email,
			telefono: reserva.telefono,
			origen: reserva.origen,
			destino: reserva.destino,
			fecha: reserva.fecha,
			hora: reserva.hora,
			conductorNombre: conductor ? conductor.nombre : null,
			vehiculoTipo: vehiculo ? vehiculo.tipo : null,
			vehiculoPatente: vehiculo ? obtenerUltimos4Patente(vehiculo.patente) : null,
		};

		// Por ahora, solo logeamos la notificación
		// En el futuro, se puede implementar el endpoint PHP correspondiente
		console.log("📧 Notificación de asignación de conductor/vehículo:", payload);
		
		// TODO: Descomentar cuando el endpoint PHP esté disponible
		// const response = await fetch(emailUrl, {
		// 	method: "POST",
		// 	headers: {
		// 		"Content-Type": "application/json",
		// 	},
		// 	body: JSON.stringify(payload),
		// });
		
		// return await response.json();
		
		return { success: true, message: "Notificación registrada (desarrollo)" };
	} catch (error) {
		console.error("Error enviando notificación de asignación:", error);
		throw error;
	}
}
