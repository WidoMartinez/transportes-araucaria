/**
 * cotizacion.js — Endpoint POST /api/cotizar
 *
 * Punto de entrada HTTP para calcular el precio completo de una cotización.
 * Delega toda la lógica al PricingService y devuelve el desglose al cliente.
 *
 * VENTAJAS sobre el sistema anterior (useMemo en App.jsx):
 *  - La fuente de verdad del precio vive en el servidor (no manipulable desde el cliente).
 *  - Tarifa dinámica incluida en la misma llamada (sin debounce asíncrono en el frontend).
 *  - Reutilizable para re-validar el monto al crear una reserva.
 *
 * USO:
 *   POST /api/cotizar
 *   Content-Type: application/json
 *   Body: { origen, destino, pasajeros, fecha, hora?, idaVuelta?, ... }
 *
 * Se monta en server-db.js con:
 *   import cotizacionRouter from "./endpoints/cotizacion.js";
 *   app.use(cotizacionRouter);
 */

import express from "express";
import { cotizar, validarMonto } from "../services/PricingService.js";

const router = express.Router();

// ─── POST /api/cotizar ────────────────────────────────────────────────────────

/**
 * Calcula el precio completo de un viaje con todos los descuentos.
 *
 * Body esperado:
 * {
 *   origen:            string  (requerido)
 *   destino:           string  (requerido)
 *   pasajeros:         number  (requerido)
 *   fecha:             string  YYYY-MM-DD (requerido)
 *   hora:              string  HH:MM      (opcional)
 *   idaVuelta:         boolean (default: false)
 *   fechaRegreso:      string  YYYY-MM-DD (requerido si idaVuelta=true)
 *   horaRegreso:       string  HH:MM      (opcional)
 *   upgradeVan:        boolean (default: false)
 *   codigoDescuento:   string  (opcional)
 *   sillaInfantil:     boolean (default: false)
 *   cantidadSillas:    number  (default: 1)
 * }
 */
router.post("/api/cotizar", async (req, res) => {
	try {
		const {
			origen,
			destino,
			pasajeros,
			fecha,
			hora,
			idaVuelta = false,
			fechaRegreso,
			horaRegreso,
			upgradeVan = false,
			codigoDescuento,
			sillaInfantil = false,
			cantidadSillas = 1,
		} = req.body || {};

		// ── Validación de campos requeridos ───────────────────────────────────
		if (!origen || !destino || !pasajeros || !fecha) {
			return res.status(400).json({
				error: "Faltan parámetros requeridos: origen, destino, pasajeros, fecha.",
			});
		}

		// Validar formato de fecha (YYYY-MM-DD)
		const regexFecha = /^\d{4}-\d{2}-\d{2}$/;
		if (!regexFecha.test(fecha)) {
			return res.status(400).json({ error: "El campo 'fecha' debe tener formato YYYY-MM-DD." });
		}

		if (idaVuelta && !fechaRegreso) {
			return res.status(400).json({
				error: "El campo 'fechaRegreso' es requerido cuando 'idaVuelta' es true.",
			});
		}

		const numPasajeros = parseInt(pasajeros, 10);
		if (!Number.isFinite(numPasajeros) || numPasajeros <= 0 || numPasajeros > 10) {
			return res.status(400).json({
				error: "El campo 'pasajeros' debe ser un número entre 1 y 10.",
			});
		}

		// ── Llamar al servicio ────────────────────────────────────────────────
		const resultado = await cotizar({
			origen,
			destino,
			pasajeros: numPasajeros,
			fecha,
			hora: hora || null,
			idaVuelta: Boolean(idaVuelta),
			fechaRegreso: fechaRegreso || null,
			horaRegreso: horaRegreso || null,
			upgradeVan: Boolean(upgradeVan),
			codigoDescuento: codigoDescuento || null,
			sillaInfantil: Boolean(sillaInfantil),
			cantidadSillas: parseInt(cantidadSillas, 10) || 1,
		});

		// Si el servicio retornó un error (destino no encontrado, etc.)
		if (resultado.error) {
			return res.status(422).json({ error: resultado.error });
		}

		return res.json(resultado);
	} catch (error) {
		console.error("Error en POST /api/cotizar:", error);
		res.status(500).json({ error: "Error interno al calcular la cotización." });
	}
});

// ─── POST /api/cotizar/validar-monto ─────────────────────────────────────────

/**
 * Valida que el monto enviado por el cliente coincida con el calculado por el servidor.
 * Útil para re-verificar el total antes de procesar el pago.
 *
 * Body esperado: mismos campos que /api/cotizar más:
 * {
 *   ...params cotización,
 *   montoCliente: number  (total que el cliente dice haber calculado)
 * }
 *
 * Responde:
 * {
 *   valido: boolean,
 *   diferencia: number,
 *   totalServidor: number,
 *   desglose: object    (resultado completo de cotizar)
 * }
 */
router.post("/api/cotizar/validar-monto", async (req, res) => {
	try {
		const { montoCliente, ...paramsCotizacion } = req.body || {};

		if (montoCliente === undefined || montoCliente === null) {
			return res.status(400).json({ error: "El campo 'montoCliente' es requerido." });
		}

		// Reutilizar la lógica de /api/cotizar para mayor consistencia
		const {
			origen,
			destino,
			pasajeros,
			fecha,
			hora,
			idaVuelta = false,
			fechaRegreso,
			horaRegreso,
			upgradeVan = false,
			codigoDescuento,
			sillaInfantil = false,
			cantidadSillas = 1,
		} = paramsCotizacion;

		if (!origen || !destino || !pasajeros || !fecha) {
			return res.status(400).json({
				error: "Faltan parámetros requeridos para validar el monto.",
			});
		}

		const desglose = await cotizar({
			origen,
			destino,
			pasajeros: parseInt(pasajeros, 10),
			fecha,
			hora: hora || null,
			idaVuelta: Boolean(idaVuelta),
			fechaRegreso: fechaRegreso || null,
			horaRegreso: horaRegreso || null,
			upgradeVan: Boolean(upgradeVan),
			codigoDescuento: codigoDescuento || null,
			sillaInfantil: Boolean(sillaInfantil),
			cantidadSillas: parseInt(cantidadSillas, 10) || 1,
		});

		if (desglose.error) {
			return res.status(422).json({ error: desglose.error });
		}

		const { valido, diferencia } = validarMonto(
			Number(montoCliente),
			desglose.totalConDescuento,
		);

		return res.json({
			valido,
			diferencia,
			totalServidor: desglose.totalConDescuento,
			desglose,
		});
	} catch (error) {
		console.error("Error en POST /api/cotizar/validar-monto:", error);
		res.status(500).json({ error: "Error interno al validar el monto." });
	}
});

export default router;
