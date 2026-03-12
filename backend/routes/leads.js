/* eslint-env node */
// Rutas para gestión de leads incompletos (captura de abandono en Paso 2)
import express from "express";
import { Op } from "sequelize";
import LeadIncompleto from "../models/LeadIncompleto.js";

const router = express.Router();

/**
 * POST /api/leads/guardar
 * Guarda o actualiza un lead incompleto.
 * Se llama cuando el usuario avanza al Paso 2 o ingresa su email.
 */
router.post("/guardar", async (req, res) => {
	try {
		const {
			origen,
			destino,
			fecha_viaje,
			hora_viaje,
			num_pasajeros,
			email,
			telefono,
			nombre,
			precio_estimado,
			session_id,
		} = req.body;

		// Validar campos requeridos
		if (!origen || !destino || !fecha_viaje || !hora_viaje || !num_pasajeros || !session_id) {
			return res.status(400).json({
				success: false,
				message: "Campos requeridos faltantes: origen, destino, fecha_viaje, hora_viaje, num_pasajeros, session_id",
			});
		}

		// Buscar si ya existe un lead con este session_id
		const leadExistente = await LeadIncompleto.findOne({
			where: { sessionId: session_id },
		});

		let leadId;
		let accion;

		if (leadExistente) {
			// Actualizar lead existente
			const nuevosDatos = {
				origen,
				destino,
				fechaViaje: fecha_viaje,
				horaViaje: hora_viaje,
				numPasajeros: parseInt(num_pasajeros) || 1,
			};

			// Actualizar precio si se provee
			if (precio_estimado !== undefined && precio_estimado !== null) {
				nuevosDatos.precioEstimado = precio_estimado;
			}

			// Actualizar datos de contacto solo si se proveen (no sobreescribir con null)
			if (email && email.trim() !== "") {
				nuevosDatos.email = email.trim().toLowerCase();
				// Si ahora tiene email, actualizar estado
				if (leadExistente.estado === "sin_datos_contacto") {
					nuevosDatos.estado = "con_email";
				}
			}
			if (telefono && telefono.trim() !== "") {
				nuevosDatos.telefono = telefono.trim();
			}
			if (nombre && nombre.trim() !== "") {
				nuevosDatos.nombre = nombre.trim();
			}

			await leadExistente.update(nuevosDatos);
			leadId = leadExistente.id;
			accion = "actualizado";
		} else {
			// Crear nuevo lead
			const estado = email && email.trim() !== "" ? "con_email" : "sin_datos_contacto";

			const nuevoLead = await LeadIncompleto.create({
				origen,
				destino,
				fechaViaje: fecha_viaje,
				horaViaje: hora_viaje,
				numPasajeros: parseInt(num_pasajeros) || 1,
				email: email ? email.trim().toLowerCase() : null,
				telefono: telefono ? telefono.trim() : null,
				nombre: nombre ? nombre.trim() : null,
				precioEstimado: precio_estimado || null,
				sessionId: session_id,
				estado,
			});

			leadId = nuevoLead.id;
			accion = "creado";
		}

		return res.json({
			success: true,
			leadId,
			accion,
			message: `Lead ${accion} correctamente`,
		});
	} catch (error) {
		console.error("❌ Error en POST /api/leads/guardar:", error.message);
		return res.status(500).json({
			success: false,
			message: "Error al guardar lead: " + error.message,
		});
	}
});

/**
 * POST /api/leads/convertido
 * Marca un lead como convertido cuando el usuario completa el pago.
 */
router.post("/convertido", async (req, res) => {
	try {
		const { session_id } = req.body;

		if (!session_id) {
			return res.status(400).json({
				success: false,
				message: "session_id es requerido",
			});
		}

		const lead = await LeadIncompleto.findOne({
			where: { sessionId: session_id },
		});

		if (!lead) {
			// No es error grave si no se encuentra el lead
			return res.json({ success: true, message: "Lead no encontrado (puede no haberse registrado)" });
		}

		await lead.update({ estado: "convertido" });

		return res.json({
			success: true,
			message: "Lead marcado como convertido",
		});
	} catch (error) {
		console.error("❌ Error en POST /api/leads/convertido:", error.message);
		return res.status(500).json({
			success: false,
			message: "Error al actualizar lead: " + error.message,
		});
	}
});

/**
 * GET /api/leads
 * Obtiene lista de leads para el panel de administración.
 * Solo accesible con autenticación de administrador.
 */
router.get("/", async (req, res) => {
	try {
		const { estado, page = 1, limit = 50 } = req.query;
		const offset = (parseInt(page) - 1) * parseInt(limit);

		const where = {};
		if (estado) {
			where.estado = estado;
		}

		const { count, rows } = await LeadIncompleto.findAndCountAll({
			where,
			order: [["updatedAt", "DESC"]],
			limit: parseInt(limit),
			offset,
		});

		return res.json({
			success: true,
			total: count,
			page: parseInt(page),
			totalPages: Math.ceil(count / parseInt(limit)),
			leads: rows,
		});
	} catch (error) {
		console.error("❌ Error en GET /api/leads:", error.message);
		return res.status(500).json({
			success: false,
			message: "Error al obtener leads: " + error.message,
		});
	}
});

export default router;
