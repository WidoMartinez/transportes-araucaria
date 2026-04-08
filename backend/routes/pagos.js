/* eslint-env node */
/* global process */
/**
 * backend/routes/pagos.js
 *
 * Rutas Express para la integración con Mercado Pago Chile (Checkout Pro).
 *
 * Endpoints disponibles:
 *   POST /api/pagos/crear-preferencia  - Crea una preferencia de pago en MP
 *   POST /api/pagos/webhook            - Recibe notificaciones de MP (IPN)
 *   GET  /api/pagos/estado/:paymentId  - Consulta el estado de un pago por ID
 *
 * Requiere las variables de entorno:
 *   MP_ACCESS_TOKEN  - Token de acceso de Mercado Pago
 *   FRONTEND_URL     - URL del frontend para las back_urls
 *   BACKEND_URL      - URL del backend para el webhook
 */

import express from "express";
import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import Reserva from "../models/Reserva.js";

const router = express.Router();

// Advertir si el access token no está configurado (no bloqueamos el inicio del servidor,
// pero los endpoints fallarán con error claro si no está definido)
if (!process.env.MP_ACCESS_TOKEN) {
	console.warn(
		"⚠️ MP_ACCESS_TOKEN no está definido. Las rutas de Mercado Pago no funcionarán.",
	);
}

// Inicializar cliente de Mercado Pago con el access token de entorno
const mpClient = new MercadoPagoConfig({
	accessToken: process.env.MP_ACCESS_TOKEN || "",
});

// ─── POST /api/pagos/crear-preferencia ───────────────────────────────────────
/**
 * Crea una preferencia de pago en Mercado Pago.
 *
 * Body esperado:
 * {
 *   reservaId:    number | string  (requerido)
 *   monto:        number           (requerido, positivo)
 *   descripcion:  string           (opcional)
 *   email_cliente: string          (opcional)
 * }
 *
 * Responde con:
 * {
 *   init_point:    string  - URL de pago de Mercado Pago (sandbox o producción)
 *   preference_id: string  - ID de la preferencia creada
 * }
 */
router.post("/crear-preferencia", async (req, res) => {
	try {
		const { reservaId, monto, descripcion, email_cliente } = req.body;

		// Validar que reservaId esté presente
		if (!reservaId) {
			return res.status(400).json({
				error: "El campo reservaId es obligatorio.",
			});
		}

		// Validar que monto sea un número positivo
		const montoNum = Number(monto);
		if (!monto || isNaN(montoNum) || montoNum <= 0) {
			return res.status(400).json({
				error: "El campo monto debe ser un número positivo.",
			});
		}

		// Verificar que la reserva exista en la base de datos
		const reserva = await Reserva.findByPk(reservaId);
		if (!reserva) {
			return res.status(404).json({
				error: `No se encontró la reserva con ID ${reservaId}.`,
			});
		}

		// Construir el objeto de preferencia para Mercado Pago
		const preference = new Preference(mpClient);

		const preferenceData = {
			items: [
				{
					title:
						descripcion ||
						"Reserva de transporte - Transportes Araucanía",
					unit_price: montoNum,
					quantity: 1,
					currency_id: "CLP",
				},
			],
			back_urls: {
				success: `${process.env.FRONTEND_URL}/pago-exitoso`,
				failure: `${process.env.FRONTEND_URL}/pago-fallido`,
				pending: `${process.env.FRONTEND_URL}/pago-pendiente`,
			},
			auto_return: "approved",
			external_reference: String(reservaId),
			notification_url: `${process.env.BACKEND_URL}/api/pagos/webhook`,
		};

		// Agregar el email del pagador si se proporcionó
		if (email_cliente) {
			preferenceData.payer = { email: email_cliente };
		}

		const response = await preference.create({ body: preferenceData });

		console.log(
			`✅ Preferencia MP creada para reserva ${reservaId}: ${response.id}`,
		);

		return res.json({
			init_point: response.init_point,
			preference_id: response.id,
		});
	} catch (error) {
		console.error("❌ Error al crear preferencia en Mercado Pago:", error);
		return res.status(500).json({
			error: "Error interno al crear la preferencia de pago.",
			detalle:
				process.env.NODE_ENV !== "production" ? error.message : undefined,
		});
	}
});

// ─── POST /api/pagos/webhook ──────────────────────────────────────────────────
/**
 * Recibe notificaciones IPN (Instant Payment Notification) de Mercado Pago.
 *
 * MP puede llamar a este endpoint múltiples veces para el mismo evento,
 * por lo que se maneja idempotencia verificando el estado actual de la reserva.
 *
 * Siempre responde con status 200 para evitar reintentos innecesarios.
 */
router.post("/webhook", async (req, res) => {
	try {
		const { type, data } = req.body;

		// Solo procesar notificaciones de tipo "payment"
		if (type !== "payment") {
			console.log(`ℹ️ Webhook MP recibido (tipo ignorado): ${type}`);
			return res.sendStatus(200);
		}

		const paymentId = data?.id;
		if (!paymentId) {
			console.warn("⚠️ Webhook MP sin payment ID en data");
			return res.sendStatus(200);
		}

		// Obtener el detalle del pago desde la API de Mercado Pago
		const paymentApi = new Payment(mpClient);
		const pagoDetalle = await paymentApi.get({ id: paymentId });

		const estado = pagoDetalle.status;
		const reservaId = pagoDetalle.external_reference;

		console.log(
			`📨 Webhook MP: pago ${paymentId}, estado=${estado}, reservaId=${reservaId}`,
		);

		// Solo actualizar si el pago fue aprobado
		if (estado === "approved" && reservaId) {
			const reserva = await Reserva.findByPk(reservaId);

			if (!reserva) {
				console.warn(
					`⚠️ Webhook MP: reserva ${reservaId} no encontrada`,
				);
				return res.sendStatus(200);
			}

			// Idempotencia: no actualizar si ya está en un estado de pago completado
			const ESTADOS_PAGADO = ["aprobado", "pagado"];
			if (ESTADOS_PAGADO.includes(reserva.estadoPago)) {
				console.log(
					`ℹ️ Reserva ${reservaId} ya tenía estado de pago '${reserva.estadoPago}', sin cambios`,
				);
				return res.sendStatus(200);
			}

			// Actualizar el estado de la reserva: pago aprobado y reserva confirmada
			await reserva.update({
				estadoPago: "aprobado",
				estado: "confirmada",
			});

			console.log(
				`✅ Reserva ${reservaId} confirmada por pago MP ${paymentId}`,
			);
		}

		return res.sendStatus(200);
	} catch (error) {
		console.error("❌ Error en webhook de Mercado Pago:", error);
		// Siempre responder 200 para que MP no reintente
		return res.sendStatus(200);
	}
});

// ─── GET /api/pagos/estado/:paymentId ────────────────────────────────────────
/**
 * Consulta el estado de un pago de Mercado Pago por su ID.
 *
 * Responde con:
 * {
 *   payment_id: string
 *   status:     string  (approved, pending, rejected, etc.)
 *   status_detail: string
 *   external_reference: string  - el reservaId
 *   amount:     number
 * }
 */
router.get("/estado/:paymentId", async (req, res) => {
	try {
		const { paymentId } = req.params;

		if (!paymentId) {
			return res.status(400).json({ error: "paymentId es requerido." });
		}

		const paymentApi = new Payment(mpClient);
		const pagoDetalle = await paymentApi.get({ id: paymentId });

		return res.json({
			payment_id: pagoDetalle.id,
			status: pagoDetalle.status,
			status_detail: pagoDetalle.status_detail,
			external_reference: pagoDetalle.external_reference,
			amount: pagoDetalle.transaction_amount,
		});
	} catch (error) {
		console.error(
			"❌ Error al consultar estado del pago:",
			req.params.paymentId,
			error,
		);
		return res.status(500).json({
			error: "Error al consultar el estado del pago.",
			detalle:
				process.env.NODE_ENV !== "production" ? error.message : undefined,
		});
	}
});

export default router;
