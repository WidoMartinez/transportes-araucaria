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
	// Validar que la patente sea un string válido
	if (!patente || typeof patente !== "string") {
		return "****";
	}
	
	// Eliminar guiones, espacios y caracteres especiales, convertir a mayúsculas
	const patenteLimpia = patente
		.replace(/[-\s.]/g, "")
		.toUpperCase()
		.trim();
	
	// Si no hay caracteres válidos, retornar placeholder
	if (patenteLimpia.length === 0) {
		return "****";
	}
	
	// Obtener últimos 4 caracteres
	if (patenteLimpia.length >= 4) {
		return patenteLimpia.slice(-4);
	}
	
	// Si tiene menos de 4 caracteres, rellenar con asteriscos al inicio
	return "*".repeat(4 - patenteLimpia.length) + patenteLimpia;
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
	// Importar axios dinámicamente para evitar problemas de dependencias circulares
	const axios = (await import("axios")).default;
	
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

		console.log("📧 Enviando notificación de asignación de conductor/vehículo:", payload);
		
		// Intentar enviar la notificación al endpoint PHP
		try {
			const response = await axios.post(emailUrl, payload, {
				headers: {
					"Content-Type": "application/json",
				},
				timeout: 10000, // 10 segundos de timeout
			});
			
			console.log("✅ Notificación enviada exitosamente:", response.data);
			return response.data;
		} catch (fetchError) {
			// Si el endpoint no está disponible, logear pero no fallar
			console.warn("⚠️ No se pudo enviar notificación al endpoint PHP:", fetchError.message);
			console.log("ℹ️ Asegúrate de que el archivo enviar_notificacion_asignacion.php esté en el servidor");
			
			// Retornar éxito de todas formas para no bloquear la asignación
			return { 
				success: false, 
				message: "Notificación no enviada - endpoint no disponible",
				error: fetchError.message 
			};
		}
	} catch (error) {
		console.error("❌ Error procesando notificación de asignación:", error);
		// No lanzar error para evitar que falle la asignación si el email falla
		return { 
			success: false, 
			message: "Error procesando notificación",
			error: error.message 
		};
	}
}
