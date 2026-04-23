import PendingEmail from "../models/PendingEmail.js";
import Reserva from "../models/Reserva.js";
import axios from "axios";
import { Op } from "sequelize";
import sequelize from "../config/database.js";

// Constantes para reintentos de conexión
const MAX_CONNECTION_RETRIES = 3;
const INITIAL_RETRY_DELAY = 2000; // 2 segundos

/**
 * Función helper para reintentos con backoff exponencial
 * @param {Function} fn - Función async a ejecutar con reintentos
 * @param {number} retries - Número máximo de reintentos
 * @returns {Promise} - Resultado de la función o error si todos los reintentos fallan
 */
async function retryWithBackoff(fn, retries = MAX_CONNECTION_RETRIES) {
	for (let i = 0; i < retries; i++) {
		try {
			return await fn();
		} catch (error) {
			if (i === retries - 1) throw error;

			const delay = INITIAL_RETRY_DELAY * Math.pow(2, i);
			console.log(
				`⏳ Reintento de conexión ${i + 1}/${retries} en ${delay}ms...`,
			);
			await new Promise((resolve) => setTimeout(resolve, delay));
		}
	}
}

// Función para procesar correos pendientes
export const processPendingEmails = async () => {
	try {
		// VERIFICAR CONEXIÓN A BD ANTES DE CONSULTAS
		await retryWithBackoff(async () => {
			await sequelize.authenticate();
		});

		const now = new Date();

		// Buscar correos pendientes cuya fecha programada ya pasó
		const pendingEmails = await PendingEmail.findAll({
			where: {
				status: "pending",
				scheduledAt: {
					[Op.lte]: now,
				},
			},
			include: [{ model: Reserva, as: "reserva" }],
			limit: 50, // Procesar en lotes para no saturar
		});

		// --- SISTEMA DE AUTOPROGRAMACIÓN PARA LEADS ABANDONADOS ---
		// Buscamos reservas con source 'lead_hero_abandonado' o 'lead_banner_abandonado'
		// creadas hace más de 5 minutos que no tengan ya una tarea de correo asociada.
		const cincoMinutosAtras = new Date(now.getTime() - 5 * 60 * 1000);
		const doceHorasAtras = new Date(now.getTime() - 12 * 60 * 60 * 1000); // No recuperar leads muy viejos

		const leadsSinTarea = await Reserva.findAll({
			where: {
				source: { [Op.in]: ["lead_hero_abandonado", "lead_banner_abandonado", "lead_hotel_abandonado"] },
				estado: "pendiente",
				estadoPago: "pendiente",
				created_at: {
					[Op.lte]: cincoMinutosAtras,
					[Op.gte]: doceHorasAtras,
				},
			},
			attributes: ["id", "email"],
			raw: true,
		});

		for (const lead of leadsSinTarea) {
			// Verificar si ya tiene una tarea creada (por si se borró y quedó el lead)
			const exists = await PendingEmail.findOne({
				where: { reservaId: lead.id, type: "lead_recovery" },
			});

			if (!exists) {
				console.log(
					`🆕 Programando recuperación automatizada para lead ID ${lead.id}`,
				);
				await PendingEmail.create({
					reservaId: lead.id,
					email: lead.email,
					type: "lead_recovery",
					status: "pending",
					scheduledAt: now, // Enviar de inmediato ya que ya pasaron los 5 min
				});
			}
		}

		if (pendingEmails.length === 0) return;

		console.log(`🔄 Procesando ${pendingEmails.length} correos pendientes...`);

		for (const emailTask of pendingEmails) {
			let reserva = null; // Declarar fuera del try para que esté disponible en el catch
			try {
				reserva = await Reserva.findByPk(emailTask.reservaId);

				if (!reserva) {
					console.warn(
						`⚠️ Reserva no encontrada para email pendiente ID ${emailTask.id}. Cancelando.`,
					);
					await emailTask.update({
						status: "cancelled",
						lastError: "Reserva no encontrada",
					});
					continue;
				}

				// VERIFICACIONES DE ESTADO
				// 1. Si ya pagó, no enviar descuento
				if (
					reserva.estadoPago === "pagado" ||
					reserva.estadoPago === "aprobado" ||
					reserva.estadoPago === "parcial"
				) {
					console.log(
						`🚫 Reserva ${reserva.codigoReserva} ya pagada. Cancelando correo de descuento.`,
					);
					await emailTask.update({
						status: "cancelled",
						lastError: "Reserva ya pagada",
					});
					continue;
				}

				// 2. Si pagó con código (aunque estadoPago sea pendiente en algunos flujos raros, verificar source)
				// O si tiene un pagoMonto > 0
				if (
					reserva.source === "codigo_pago" ||
					(reserva.pagoMonto && reserva.pagoMonto > 0)
				) {
					console.log(
						`🚫 Reserva ${reserva.codigoReserva} tiene pago o es por código. Cancelando.`,
					);
					await emailTask.update({
						status: "cancelled",
						lastError: "Pago detectado o código usado",
					});
					continue;
				}

				// DETERMINAR ACCIÓN Y ENVIAR
				const action =
					emailTask.type === "lead_recovery"
						? "send_lead_recovery"
						: "send_discount_offer";
				console.log(
					`🚀 Enviando correo (${emailTask.type}) para ${reserva.codigoReserva}...`,
				);

				const phpUrl =
					process.env.PHP_EMAIL_URL ||
					"https://www.transportesaraucaria.cl/enviar_correo_mejorado.php";

				// Advertencia si se usa el fallback (debería configurarse en producción)
				if (!process.env.PHP_EMAIL_URL) {
					console.warn(
						"⚠️ PHP_EMAIL_URL no configurado, usando URL por defecto",
					);
				}

				// Preparar datos para el PHP
				const emailData = {
					id: reserva.id,
					nombre: reserva.nombre,
					email: reserva.email,
					telefono: reserva.telefono,
					origen: reserva.origen,
					destino: reserva.destino,
					fecha: reserva.fecha,
					hora: reserva.hora,
					pasajeros: reserva.pasajeros,
					vehiculo: reserva.vehiculo,
					codigoReserva: reserva.codigoReserva,
					totalConDescuento: reserva.totalConDescuento,
					precio: reserva.precio,
					estadoPago: reserva.estadoPago,
					upgradeVan: reserva.upgradeVan,
					action: action, // Acción dinámica
				};

				const response = await axios.post(phpUrl, emailData, {
					headers: { "Content-Type": "application/json" },
					timeout: 15000,
				});

				if (response.data && response.data.success) {
					await emailTask.update({
						status: "sent",
						sentAt: new Date(),
					});
					console.log(
						`✅ Correo de descuento enviado para ${reserva.codigoReserva}`,
					);
				} else {
					// Loguear la respuesta completa del PHP para diagnóstico
					const phpResponse =
						typeof response.data === "string"
							? response.data.substring(0, 500) // Truncar si es texto largo (ej. PHP warnings)
							: JSON.stringify(response.data);
					throw new Error(
						response.data?.message ||
							`Respuesta PHP sin success. Body: ${phpResponse}`,
					);
				}
			} catch (error) {
				// Logging mejorado con contexto completo
				console.error(`❌ Error procesando email ID ${emailTask.id}:`, {
					error: error.message,
					reservaId: emailTask.reservaId,
					codigoReserva: reserva?.codigoReserva,
					email: emailTask.email,
					attempts: emailTask.attempts + 1,
					scheduledAt: emailTask.scheduledAt,
					tipo: emailTask.type,
					stack:
						process.env.NODE_ENV === "development" ? error.stack : undefined,
				});

				// Incrementar intentos
				const newAttempts = emailTask.attempts + 1;
				const updateData = { attempts: newAttempts, lastError: error.message };

				// Si falla 3 veces, marcar como fallido y notificar al admin
				if (newAttempts >= 3) {
					updateData.status = "failed";

					// Notificar al administrador sobre el fallo definitivo
					try {
						const phpUrl =
							process.env.PHP_EMAIL_URL ||
							"https://www.transportesaraucaria.cl/enviar_correo_mejorado.php";

						// Advertencia si se usa el fallback
						if (!process.env.PHP_EMAIL_URL) {
							console.warn(
								"⚠️ PHP_EMAIL_URL no configurado para notificación de fallos",
							);
						}

						// Solo notificar si tenemos datos de la reserva
						if (reserva) {
							await axios.post(
								phpUrl,
								{
									action: "notify_admin_failed_email",
									reservaId: reserva.id,
									codigoReserva: reserva.codigoReserva,
									email: emailTask.email,
									attempts: newAttempts,
									lastError: error.message,
									tipo: emailTask.type,
									nombre: reserva.nombre,
									origen: reserva.origen,
									destino: reserva.destino,
									fecha: reserva.fecha,
									upgradeVan: reserva.upgradeVan,
								},
								{
									headers: { "Content-Type": "application/json" },
									timeout: 10000,
								},
							);
							console.log(
								`📧 Notificación de fallo enviada al admin para reserva ${reserva.codigoReserva}`,
							);
						} else {
							console.warn(
								`⚠️ No se pudo notificar al admin: reserva no disponible para email ID ${emailTask.id}`,
							);
						}
					} catch (notifError) {
						console.error(
							"❌ Error notificando fallo al admin:",
							notifError.message,
						);
					}
				} else {
					// Implementar exponential backoff: 2min, 4min, 8min...
					const delayMinutes = Math.pow(2, newAttempts);
					updateData.scheduledAt = new Date(Date.now() + delayMinutes * 60000);
					console.log(
						`⏰ Reintento ${newAttempts} programado en ${delayMinutes} minutos para email ID ${emailTask.id}`,
					);
				}

				await emailTask.update(updateData);
			}
		}
	} catch (globalError) {
		// Manejo específico de errores de conexión
		if (
			globalError.name === "SequelizeConnectionError" ||
			globalError.name === "ConnectionError" ||
			globalError.code === "ETIMEDOUT"
		) {
			const errorCode =
				globalError.parent?.code || globalError.code || "UNKNOWN";

			// Log estructurado y claro para diagnóstico
			console.error("❌ ERROR DE CONEXIÓN A BD (ETIMEDOUT/TIMEOUT):", {
				mensaje: globalError.message,
				codigo: errorCode,
				host: process.env.DB_HOST || "srv1551.hstgr.io",
				puerto: process.env.DB_PORT || 3306,
				timestamp: new Date().toISOString(),
			});

			console.log(
				"💡 Sugerencia: Verifica que el Acceso Remoto MySQL esté habilitado en Hostinger para la IP de este servidor.",
			);
			console.log(
				"⏭️ Saliendo gracefully. Se reintentará en el próximo ciclo (60s)",
			);
			return;
		}

		// Otros errores globales
		console.error("❌ Error global en processPendingEmails:", globalError);
	}
};
