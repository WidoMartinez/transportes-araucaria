/* eslint-env node */
/* global process */
// backend/server-db.js - Servidor con base de datos MySQL
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MercadoPagoConfig, Preference } from "mercadopago";
import axios from "axios";
import crypto from "crypto";
import { testConnection, syncDatabase } from "./config/database.js";
import { Op } from "sequelize";
import sequelize from "./config/database.js";
import CodigoDescuento from "./models/CodigoDescuento.js";
import Destino from "./models/Destino.js";
import Promocion from "./models/Promocion.js";
import DescuentoGlobal from "./models/DescuentoGlobal.js";
import Reserva from "./models/Reserva.js";

dotenv.config();

// --- CONFIGURACIÓN DE MERCADO PAGO ---
const client = new MercadoPagoConfig({
	accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
});

// --- FUNCIÓN PARA FIRMAR PARÁMETROS DE FLOW ---
const signParams = (params) => {
	const secretKey = process.env.FLOW_SECRET_KEY;
	const sortedKeys = Object.keys(params).sort();
	let toSign = "";
	sortedKeys.forEach((key) => {
		toSign += key + params[key];
	});
	return crypto.createHmac("sha256", secretKey).update(toSign).digest("hex");
};

const app = express();
app.use(express.json());

app.get("/health", (req, res) => {
	res.json({ status: "ok", timestamp: new Date().toISOString() });
});

const generatePromotionId = () =>
	`promo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const parsePromotionMetadata = (record) => {
	if (!record || typeof record.descripcion !== "string") {
		return null;
	}
	try {
		const parsed = JSON.parse(record.descripcion);
		return parsed && typeof parsed === "object" && !Array.isArray(parsed)
			? parsed
			: null;
	} catch (error) {
		return null;
	}
};

const toNumber = (value, fallback = 0) => {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : fallback;
};

const parseJsonArray = (raw) => {
	if (!raw) return [];
	let value = raw;
	const seen = new Set();

	while (typeof value === "string") {
		const trimmed = value.trim();
		if (trimmed.length === 0) {
			return [];
		}
		if (seen.has(trimmed)) {
			break;
		}
		seen.add(trimmed);
		try {
			value = JSON.parse(trimmed);
		} catch (error) {
			return [];
		}
	}

	return Array.isArray(value) ? value : [];
};

const normalizeDestinosAplicables = (raw) => {
	const parsed = parseJsonArray(raw);
	return parsed
		.map((item) => {
			if (typeof item === "string") return item;
			if (item && typeof item === "object") {
				return item.value || item.nombre || item.label || "";
			}
			return "";
		})
		.filter(Boolean);
};

const normalizeUsuariosQueUsaron = (raw) => {
	const parsed = parseJsonArray(raw);
	return parsed
		.map((item) => (typeof item === "string" ? item : ""))
		.filter(Boolean);
};

app.use(
	cors({
		origin: [
			"https://www.transportesaraucaria.cl",
			"https://transportesaraucaria.cl",
			"http://localhost:3000",
			"http://localhost:5173",
			"http://127.0.0.1:5173",
		],
		credentials: true,
		methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization"],
	})
);

// --- INICIALIZACIÓN DE BASE DE DATOS ---
const initializeDatabase = async () => {
	try {
		const connected = await testConnection();
		if (!connected) {
			throw new Error("No se pudo conectar a la base de datos");
		}
		await syncDatabase(false); // false = no forzar recreación

		// Verificar y migrar promociones si no existen
		const promocionesExistentes = await Promocion.count();
		if (promocionesExistentes === 0) {
			console.log("🔄 Migrando promociones desde JSON...");
			try {
				const fs = await import("fs");
				const pricingData = JSON.parse(
					fs.readFileSync("./data/pricing.json", "utf8")
				);

				if (pricingData.dayPromotions && pricingData.dayPromotions.length > 0) {
					for (const promo of pricingData.dayPromotions) {
						await Promocion.create({
							nombre: promo.nombre,
							dia: "lunes", // Por defecto
							tipo: "porcentaje",
							valor: promo.descuentoPorcentaje || 0,
							activo: promo.activo !== false,
							descripcion: promo.descripcion || "",
						});
					}
					console.log(
						`✅ Migradas ${pricingData.dayPromotions.length} promociones`
					);
				}
			} catch (error) {
				console.log("⚠️ No se pudieron migrar las promociones:", error.message);
			}
		}

		console.log("✅ Base de datos inicializada correctamente");
	} catch (error) {
		console.error("❌ Error inicializando base de datos:", error);
		process.exit(1);
	}
};

// --- ENDPOINTS PARA CONFIGURACION DE PRECIOS ---
const PRICING_CACHE_TTL_MS = Number(process.env.PRICING_CACHE_TTL_MS || 60000);
let pricingCache = { payload: null, expiresAt: 0 };

const setPricingCache = (payload) => {
	pricingCache = {
		payload,
		expiresAt: Date.now() + PRICING_CACHE_TTL_MS,
	};
};

const invalidatePricingCache = () => {
	pricingCache = { payload: null, expiresAt: 0 };
};

const buildPromotionKey = (sourceId, day) => `${sourceId}::${day}`;

const extractPromotionKeyFromRecord = (promo) => {
	const metadata = parsePromotionMetadata(promo);
	const sourceId = metadata?.sourceId || promo.sourceId || `promo-${promo.id}`;
	const dayTag =
		metadata?.diaIndividual ||
		(Array.isArray(metadata?.dias) && metadata.dias[0]) ||
		promo.dia ||
		(Array.isArray(promo.dias) && promo.dias[0]) ||
		"lunes";
	return buildPromotionKey(sourceId, dayTag);
};

const buildPromotionEntries = (promocion) => {
	const metadata = parsePromotionMetadata(promocion);
	const porcentaje = toNumber(
		metadata?.porcentaje ??
			promocion.porcentaje ??
			promocion.descuentoPorcentaje ??
			promocion.valor ??
			0,
		0
	);
	const aplicaPorDias =
		metadata?.aplicaPorDias ?? Boolean(promocion.aplicaPorDias);
	const diasMetadata = Array.isArray(metadata?.dias)
		? metadata.dias.filter(Boolean)
		: [];
	const diasDesdePromo = Array.isArray(promocion.dias)
		? promocion.dias.filter(Boolean)
		: [];
	const diaBase =
		metadata?.diaIndividual ||
		promocion.dia ||
		diasDesdePromo[0] ||
		diasMetadata[0] ||
		"lunes";
	const diasParaIterar = aplicaPorDias
		? diasMetadata.length > 0
			? diasMetadata
			: diasDesdePromo.length > 0
			? diasDesdePromo
			: [diaBase]
		: [diaBase];
	const destino = metadata?.destino || promocion.destino || "";
	const nombre =
		metadata?.nombre ||
		promocion.nombre ||
		metadata?.descripcion ||
		promocion.descripcion ||
		"Promocion";
	const descripcion = metadata?.descripcion || promocion.descripcion || "";
	const aplicaPorHorario =
		metadata?.aplicaPorHorario ?? Boolean(promocion.aplicaPorHorario);
	const horaInicio = metadata?.horaInicio ?? promocion.horaInicio ?? "";
	const horaFin = metadata?.horaFin ?? promocion.horaFin ?? "";
	const tipoViaje =
		metadata?.aplicaTipoViaje || promocion.aplicaTipoViaje || {};
	const tipoViajeNormalizado = {
		ida: Boolean(tipoViaje.ida),
		vuelta: Boolean(tipoViaje.vuelta),
		ambos: Boolean(tipoViaje.ambos),
	};
	const activo = metadata?.activo ?? promocion.activo ?? true;
	const sourceId = metadata?.sourceId || promocion.id || generatePromotionId();

	return diasParaIterar.map((dia) => {
		const payload = {
			sourceId,
			nombre,
			destino,
			descripcion,
			dias: aplicaPorDias ? diasParaIterar : [],
			aplicaPorDias,
			aplicaPorHorario,
			horaInicio,
			horaFin,
			porcentaje,
			aplicaTipoViaje: tipoViajeNormalizado,
			activo,
			diaIndividual: dia,
		};

		return {
			key: buildPromotionKey(sourceId, dia),
			record: {
				nombre,
				dia,
				tipo: "porcentaje",
				valor: porcentaje,
				activo,
				descripcion: JSON.stringify(payload),
			},
		};
	});
};

const buildPricingPayload = async () => {
	const [destinos, dayPromotions, descuentosGlobales, codigosDescuento] =
		await Promise.all([
			Destino.findAll({
				order: [
					["orden", "ASC"],
					["nombre", "ASC"],
				],
			}),
			Promocion.findAll({
				order: [["dia", "ASC"]],
			}),
			DescuentoGlobal.findAll(),
			CodigoDescuento.findAll({
				order: [["fechaCreacion", "DESC"]],
			}),
		]);

	const dayPromotionsFormatted = dayPromotions.map((promo) => {
		const metadata = parsePromotionMetadata(promo);
		const baseId = metadata?.sourceId || `promo-${promo.id}`;
		const porcentajeBase = metadata?.porcentaje;
		const porcentaje =
			porcentajeBase !== undefined
				? toNumber(porcentajeBase, 0)
				: promo.tipo === "porcentaje"
				? toNumber(promo.valor, 0)
				: 0;
		const aplicaPorDias =
			metadata?.aplicaPorDias !== undefined
				? Boolean(metadata.aplicaPorDias)
				: true;
		const diasMetadata = Array.isArray(metadata?.dias)
			? metadata.dias.filter(Boolean)
			: [];
		const diasDesdePromo = Array.isArray(promo.dias)
			? promo.dias.filter(Boolean)
			: [];
		const defaultDay =
			metadata?.diaIndividual ||
			promo.dia ||
			diasDesdePromo[0] ||
			diasMetadata[0] ||
			"lunes";
		const dias = aplicaPorDias
			? diasMetadata.length > 0
				? diasMetadata
				: diasDesdePromo.length > 0
				? diasDesdePromo
				: [defaultDay]
			: [];
		const tipoViaje = metadata?.aplicaTipoViaje || {};
		return {
			id: baseId,
			nombre: metadata?.nombre || promo.nombre || "",
			destino: metadata?.destino || "",
			descripcion:
				metadata?.descripcion !== undefined
					? metadata.descripcion
					: promo.descripcion || "",
			dias,
			aplicaPorDias,
			aplicaPorHorario:
				metadata?.aplicaPorHorario !== undefined
					? Boolean(metadata.aplicaPorHorario)
					: false,
			horaInicio: metadata?.horaInicio || "",
			horaFin: metadata?.horaFin || "",
			descuentoPorcentaje: porcentaje,
			aplicaTipoViaje: {
				ida: tipoViaje.ida !== undefined ? Boolean(tipoViaje.ida) : true,
				vuelta:
					tipoViaje.vuelta !== undefined ? Boolean(tipoViaje.vuelta) : true,
				ambos: tipoViaje.ambos !== undefined ? Boolean(tipoViaje.ambos) : true,
			},
			activo:
				metadata?.activo !== undefined
					? Boolean(metadata.activo)
					: promo.activo !== undefined
					? Boolean(promo.activo)
					: true,
		};
	});

	const descuentosFormatted = {
		descuentoOnline: {
			valor: 5,
			activo: true,
			nombre: "Descuento por Reserva Online",
		},
		descuentoRoundTrip: {
			valor: 10,
			activo: true,
			nombre: "Descuento por Ida y Vuelta",
		},
		descuentosPersonalizados: [],
	};

	descuentosGlobales.forEach((descuento) => {
		if (descuento.tipo === "descuentoOnline") {
			descuentosFormatted.descuentoOnline = {
				valor: descuento.valor,
				activo: descuento.activo,
				nombre: descuento.nombre,
			};
		} else if (descuento.tipo === "descuentoRoundTrip") {
			descuentosFormatted.descuentoRoundTrip = {
				valor: descuento.valor,
				activo: descuento.activo,
				nombre: descuento.nombre,
			};
		} else if (descuento.tipo === "descuentoPersonalizado") {
			descuentosFormatted.descuentosPersonalizados.push({
				nombre: descuento.nombre,
				valor: descuento.valor,
				activo: descuento.activo,
				descripcion: descuento.descripcion,
			});
		}
	});

	const codigosFormateados = codigosDescuento.map((codigo) => {
		const codigoJson = codigo.toJSON();
		return {
			...codigoJson,
			destinosAplicables: normalizeDestinosAplicables(
				codigoJson.destinosAplicables ?? codigo.destinosAplicables
			),
			usuariosQueUsaron: normalizeUsuariosQueUsaron(
				codigoJson.usuariosQueUsaron ?? codigo.usuariosQueUsaron
			),
		};
	});

	const destinosFormateados = destinos.map((destino) => ({
		...destino.toJSON(),
		precios: {
			auto: {
				base: destino.precioIda,
				porcentajeAdicional: 0.1,
			},
			van: {
				base: destino.precioIda * 1.8,
				porcentajeAdicional: 0.1,
			},
		},
		descripcion: destino.descripcion || "",
		tiempo: destino.tiempo || "45 min",
		imagen: destino.imagen || "",
		maxPasajeros: destino.maxPasajeros || 4,
		minHorasAnticipacion: destino.minHorasAnticipacion || 5,
	}));

	return {
		destinos: destinosFormateados,
		dayPromotions: dayPromotionsFormatted,
		descuentosGlobales: descuentosFormatted,
		codigosDescuento: codigosFormateados,
		updatedAt: new Date().toISOString(),
	};
};

app.get("/pricing", async (req, res) => {
	try {
		const now = Date.now();
		if (pricingCache.payload && pricingCache.expiresAt > now) {
			return res.json(pricingCache.payload);
		}

		const payload = await buildPricingPayload();
		setPricingCache(payload);
		res.json(payload);
	} catch (error) {
		console.error("Error al obtener la configuracion de precios:", error);
		res.status(500).json({
			message: "No se pudo obtener la configuracion de precios.",
		});
	}
});

app.put("/pricing", async (req, res) => {
	console.log("PUT /pricing recibido");
	console.log("Body recibido:", JSON.stringify(req.body, null, 2));

	const { destinos, dayPromotions, descuentosGlobales } = req.body || {};

	if (!Array.isArray(destinos) || !Array.isArray(dayPromotions)) {
		return res.status(400).json({
			message:
				"La estructura de datos enviada es incorrecta. Se esperaba un objeto con 'destinos' y 'dayPromotions'.",
		});
	}

	try {
		invalidatePricingCache();

		await Promise.all(
			(destinos || []).map((destino) => {
				const precioBase =
					destino.precios?.auto?.base || destino.precioIda || 0;
				const precioVuelta =
					destino.precios?.auto?.base || destino.precioVuelta || 0;
				const precioIdaVuelta =
					destino.precios?.auto?.base || destino.precioIdaVuelta || 0;

				return Destino.upsert({
					nombre: destino.nombre,
					precioIda: precioBase,
					precioVuelta,
					precioIdaVuelta,
					activo: destino.activo !== false,
					orden: destino.orden || 0,
					descripcion: destino.descripcion || "",
					tiempo: destino.tiempo || "45 min",
					imagen: destino.imagen || "",
					maxPasajeros: destino.maxPasajeros || 4,
					minHorasAnticipacion: destino.minHorasAnticipacion || 5,
				});
			})
		);

		const existingPromotions = await Promocion.findAll();
		const existingPromotionMap = new Map(
			existingPromotions.map((promo) => [
				extractPromotionKeyFromRecord(promo),
				promo,
			])
		);
		const seenPromotionKeys = new Set();

		for (const promocion of dayPromotions) {
			for (const entry of buildPromotionEntries(promocion)) {
				seenPromotionKeys.add(entry.key);
				const existing = existingPromotionMap.get(entry.key);
				if (existing) {
					await existing.update(entry.record);
				} else {
					await Promocion.create(entry.record);
				}
			}
		}

		const idsToDelete = [];
		for (const [key, promo] of existingPromotionMap.entries()) {
			if (!seenPromotionKeys.has(key)) {
				idsToDelete.push(promo.id);
			}
		}

		if (idsToDelete.length > 0) {
			await Promocion.destroy({ where: { id: idsToDelete } });
		}

		if (descuentosGlobales) {
			const globalUpdates = [];

			if (descuentosGlobales.descuentoOnline) {
				globalUpdates.push(
					DescuentoGlobal.upsert({
						tipo: "descuentoOnline",
						nombre: descuentosGlobales.descuentoOnline.nombre,
						valor: descuentosGlobales.descuentoOnline.valor,
						activo: descuentosGlobales.descuentoOnline.activo,
						descripcion: "Descuento por reserva online",
					})
				);
			}

			if (descuentosGlobales.descuentoRoundTrip) {
				globalUpdates.push(
					DescuentoGlobal.upsert({
						tipo: "descuentoRoundTrip",
						nombre: descuentosGlobales.descuentoRoundTrip.nombre,
						valor: descuentosGlobales.descuentoRoundTrip.valor,
						activo: descuentosGlobales.descuentoRoundTrip.activo,
						descripcion: "Descuento por ida y vuelta",
					})
				);
			}

			await Promise.all(globalUpdates);

			if (Array.isArray(descuentosGlobales.descuentosPersonalizados)) {
				await DescuentoGlobal.destroy({
					where: { tipo: "descuentoPersonalizado" },
				});

				if (descuentosGlobales.descuentosPersonalizados.length > 0) {
					await DescuentoGlobal.bulkCreate(
						descuentosGlobales.descuentosPersonalizados.map((descuento) => ({
							tipo: "descuentoPersonalizado",
							nombre: descuento.nombre,
							valor: descuento.valor,
							activo: descuento.activo,
							descripcion: descuento.descripcion || "",
						}))
					);
				}
			}
		}

		const payload = await buildPricingPayload();
		setPricingCache(payload);
		res.json(payload);
	} catch (error) {
		console.error("Error al guardar la configuracion de precios:", error);
		res.status(500).json({
			message: "No se pudo guardar la configuracion de precios.",
		});
	}
});

// --- ENDPOINTS PARA CODIGOS DE DESCUENTO ---
app.get("/api/codigos", async (req, res) => {
	try {
		const codigos = await CodigoDescuento.findAll({
			order: [["fechaCreacion", "DESC"]],
		});

		// Asegurar que usuariosQueUsaron sea siempre un array
		const codigosFormateados = codigos.map((codigo) => {
			const codigoJson = codigo.toJSON();
			return {
				...codigoJson,
				destinosAplicables: normalizeDestinosAplicables(
					codigoJson.destinosAplicables ?? codigo.destinosAplicables
				),
				usuariosQueUsaron: normalizeUsuariosQueUsaron(
					codigoJson.usuariosQueUsaron ?? codigo.usuariosQueUsaron
				),
			};
		});

		res.json(codigosFormateados);
	} catch (error) {
		console.error("Error obteniendo códigos:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

app.post("/api/codigos", async (req, res) => {
	try {
		const nuevoCodigo = {
			...req.body,
			destinosAplicables: normalizeDestinosAplicables(
				req.body.destinosAplicables
			),
			id: req.body.codigo,
			usosActuales: 0,
			fechaCreacion: new Date().toISOString().split("T")[0],
			creadoPor: "admin",
		};

		const codigoCreado = await CodigoDescuento.create(nuevoCodigo);
		res.json(codigoCreado);
	} catch (error) {
		console.error("Error creando código:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

app.put("/api/codigos/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const payload = { ...req.body };

		if (Object.prototype.hasOwnProperty.call(req.body, "destinosAplicables")) {
			payload.destinosAplicables = normalizeDestinosAplicables(
				req.body.destinosAplicables
			);
		}

		const [updatedRows] = await CodigoDescuento.update(payload, {
			where: { id },
		});

		if (updatedRows === 0) {
			return res.status(404).json({ error: "Código no encontrado" });
		}

		const codigoActualizado = await CodigoDescuento.findByPk(id);
		res.json(codigoActualizado);
	} catch (error) {
		console.error("Error actualizando código:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

app.delete("/api/codigos/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const deletedRows = await CodigoDescuento.destroy({
			where: { id },
		});

		if (deletedRows === 0) {
			return res.status(404).json({ error: "Código no encontrado" });
		}

		res.json({ message: "Código eliminado correctamente" });
	} catch (error) {
		console.error("Error eliminando código:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// Endpoint para validar código de descuento
app.post("/api/codigos/validar", async (req, res) => {
	try {
		const { codigo, destino, monto, email, telefono } = req.body;

		// Crear identificador único del usuario basado en email + teléfono
		const usuarioId =
			email && telefono
				? crypto
						.createHash("sha256")
						.update(`${email}-${telefono}`)
						.digest("hex")
				: null;

		const codigoEncontrado = await CodigoDescuento.findOne({
			where: { codigo, activo: true },
		});

		if (!codigoEncontrado) {
			return res.json({ valido: false, error: "Código no válido o agotado" });
		}

		// Verificar límite de usos
		if (codigoEncontrado.usosActuales >= codigoEncontrado.limiteUsos) {
			return res.json({ valido: false, error: "Código agotado" });
		}

		// Verificar fecha de vencimiento
		const ahora = new Date();
		const vencimiento = new Date(codigoEncontrado.fechaVencimiento);
		if (vencimiento < ahora) {
			return res.json({ valido: false, error: "Código vencido" });
		}

		// Verificar si el usuario ya usó este código
		if (usuarioId) {
			const usuariosQueUsaron = normalizeUsuariosQueUsaron(
				codigoEncontrado.usuariosQueUsaron || []
			);
			const usuarioYaUso = usuariosQueUsaron.includes(usuarioId);
			if (usuarioYaUso) {
				return res.json({
					valido: false,
					error: "Ya has usado este código de descuento anteriormente",
				});
			}
		}

		const destinosAplicables = normalizeDestinosAplicables(
			codigoEncontrado.destinosAplicables
		);

		// Verificar destino aplicable
		if (
			destinosAplicables.length > 0 &&
			!destinosAplicables.includes(destino)
		) {
			return res.json({
				valido: false,
				error: "Código no aplicable para este destino",
			});
		}

		// Verificar monto mínimo
		if (monto < codigoEncontrado.montoMinimo) {
			return res.json({
				valido: false,
				error: `Monto mínimo requerido: $${codigoEncontrado.montoMinimo.toLocaleString()}`,
			});
		}

		const codigoPlano = codigoEncontrado.toJSON();
		codigoPlano.destinosAplicables = destinosAplicables;
		codigoPlano.usuariosQueUsaron = normalizeUsuariosQueUsaron(
			codigoPlano.usuariosQueUsaron ?? codigoEncontrado.usuariosQueUsaron
		);

		res.json({ valido: true, codigo: codigoPlano });
	} catch (error) {
		console.error("Error validando código:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// Endpoint para registrar el uso de un código por un usuario
app.post("/api/codigos/usar", async (req, res) => {
	try {
		const { codigo, email, telefono } = req.body;

		// Crear identificador único del usuario basado en email + teléfono
		const usuarioId =
			email && telefono
				? crypto
						.createHash("sha256")
						.update(`${email}-${telefono}`)
						.digest("hex")
				: null;

		const codigoEncontrado = await CodigoDescuento.findOne({
			where: { codigo },
		});

		if (!codigoEncontrado) {
			return res.status(404).json({ error: "Código no encontrado" });
		}

		// Verificar si el usuario ya usó este código
		if (usuarioId) {
			const usuariosQueUsaron = normalizeUsuariosQueUsaron(
				codigoEncontrado.usuariosQueUsaron || []
			);
			const usuarioYaUso = usuariosQueUsaron.includes(usuarioId);
			if (usuarioYaUso) {
				return res.json({
					exito: false,
					error: "Ya has usado este código de descuento anteriormente",
				});
			}
		}

		// Actualizar usos - asegurar que no se duplique el usuario
		const usuariosActuales = normalizeUsuariosQueUsaron(
			codigoEncontrado.usuariosQueUsaron || []
		);
		const nuevosUsuarios = usuarioId
			? [...usuariosActuales, usuarioId]
			: usuariosActuales;

		await CodigoDescuento.update(
			{
				usosActuales: codigoEncontrado.usosActuales + 1,
				usuariosQueUsaron: nuevosUsuarios,
			},
			{
				where: { codigo },
			}
		);

		res.json({
			exito: true,
			usosActuales: codigoEncontrado.usosActuales + 1,
			usuariosQueUsaron: nuevosUsuarios,
		});
	} catch (error) {
		console.error("Error registrando uso del código:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// Endpoint para eliminar un usuario específico de un código
app.delete("/api/codigos/:codigo/usuarios/:usuarioId", async (req, res) => {
	try {
		const { codigo, usuarioId } = req.params;
		const codigoEncontrado = await CodigoDescuento.findOne({
			where: { codigo },
		});

		if (!codigoEncontrado) {
			return res.status(404).json({ error: "Código no encontrado" });
		}

		const usuariosActualizados = (
			codigoEncontrado.usuariosQueUsaron || []
		).filter((id) => id !== usuarioId);

		await CodigoDescuento.update(
			{
				usuariosQueUsaron: usuariosActualizados,
			},
			{
				where: { codigo },
			}
		);

		res.json({
			exito: true,
			usuariosQueUsaron: usuariosActualizados,
		});
	} catch (error) {
		console.error("Error eliminando usuario del código:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// --- ENDPOINTS MEJORADOS PARA PANEL DE ADMINISTRACIÓN ---

// Endpoint para obtener usuarios de un código específico con detalles
app.get("/api/codigos/:id/usuarios", async (req, res) => {
	try {
		const { id } = req.params;
		const codigo = await CodigoDescuento.findByPk(id);

		if (!codigo) {
			return res.status(404).json({ error: "Código no encontrado" });
		}

		const usuariosQueUsaron = normalizeUsuariosQueUsaron(
			codigo.usuariosQueUsaron || []
		);

		// Obtener detalles de las reservas de estos usuarios
		const reservas = await Reserva.findAll({
			where: {
				codigoDescuento: codigo.codigo,
			},
			attributes: [
				"id",
				"nombre",
				"email",
				"telefono",
				"created_at",
				"totalConDescuento",
				"estado",
				"estadoPago",
			],
			order: [["created_at", "DESC"]],
		});

		// Combinar datos de usuarios con reservas
		const usuariosConDetalles = usuariosQueUsaron.map((usuarioId) => {
			const reserva = reservas.find((r) => {
				const hashUsuario = crypto
					.createHash("sha256")
					.update(`${r.email}-${r.telefono}`)
					.digest("hex");
				return hashUsuario === usuarioId;
			});

			return {
				usuarioId,
				nombre: reserva?.nombre || "Usuario no encontrado",
				email: reserva?.email || "Email no disponible",
				telefono: reserva?.telefono || "Teléfono no disponible",
				fechaUso: reserva?.created_at || null,
				monto: reserva?.totalConDescuento || 0,
				estado: reserva?.estado || "No disponible",
				estadoPago: reserva?.estadoPago || "No disponible",
			};
		});

		res.json({
			codigo: {
				id: codigo.id,
				codigo: codigo.codigo,
				descripcion: codigo.descripcion,
				usosActuales: codigo.usosActuales,
				limiteUsos: codigo.limiteUsos,
				activo: codigo.activo,
			},
			usuarios: usuariosConDetalles,
			totalUsuarios: usuariosConDetalles.length,
		});
	} catch (error) {
		console.error("Error obteniendo usuarios del código:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// Endpoint para resetear un código (eliminar todos los usuarios y resetear contador)
app.post("/api/codigos/:id/reset", async (req, res) => {
	try {
		const { id } = req.params;
		const { confirmar } = req.body;

		if (!confirmar) {
			return res.status(400).json({
				error: "Debe confirmar la acción de reset",
			});
		}

		const codigo = await CodigoDescuento.findByPk(id);
		if (!codigo) {
			return res.status(404).json({ error: "Código no encontrado" });
		}

		await CodigoDescuento.update(
			{
				usosActuales: 0,
				usuariosQueUsaron: [],
			},
			{
				where: { id },
			}
		);

		res.json({
			exito: true,
			message: "Código reseteado exitosamente",
			codigo: {
				id: codigo.id,
				codigo: codigo.codigo,
				usosActuales: 0,
				usuariosQueUsaron: [],
			},
		});
	} catch (error) {
		console.error("Error reseteando código:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// Endpoint para probar la conexión a la base de datos
app.get("/api/test-db", async (req, res) => {
	try {
		await sequelize.authenticate();
		res.json({
			status: "ok",
			message: "Conexión a la base de datos exitosa",
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error("Error de conexión a la base de datos:", error);
		res.status(500).json({
			error: "Error de conexión a la base de datos",
			details: error.message,
			timestamp: new Date().toISOString(),
		});
	}
});

// Endpoint para verificar tablas existentes
app.get("/api/test-tables", async (req, res) => {
	try {
		await sequelize.authenticate();

		// Verificar si la tabla codigos_descuento existe
		const [results] = await sequelize.query(
			"SHOW TABLES LIKE 'codigos_descuento'"
		);
		const tableExists = results.length > 0;

		// Si la tabla no existe, intentar crearla
		if (!tableExists) {
			console.log("Tabla codigos_descuento no existe, sincronizando...");
			await sequelize.sync({ force: false });
		}

		// Contar registros en la tabla
		let codigosCount = 0;
		if (tableExists) {
			codigosCount = await CodigoDescuento.count();
		}

		res.json({
			status: "ok",
			message: "Verificación de tablas completada",
			tableExists,
			codigosCount,
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error("Error verificando tablas:", error);
		res.status(500).json({
			error: "Error verificando tablas",
			details: error.message,
			timestamp: new Date().toISOString(),
		});
	}
});

// Endpoint para forzar la sincronización de todas las tablas
app.get("/api/sync-all", async (req, res) => {
	try {
		// Verificar conexión primero
		await sequelize.authenticate();

		// Importar todos los modelos
		const CodigoDescuento = (await import("./models/CodigoDescuento.js"))
			.default;
		const Reserva = (await import("./models/Reserva.js")).default;
		const Destino = (await import("./models/Destino.js")).default;
		const Promocion = (await import("./models/Promocion.js")).default;
		const DescuentoGlobal = (await import("./models/DescuentoGlobal.js"))
			.default;

		// Sincronizar tablas una por una para evitar conflictos
		console.log("Sincronizando tabla codigos_descuento...");
		await CodigoDescuento.sync({ force: false, alter: true });

		console.log("Sincronizando tabla reservas...");
		await Reserva.sync({ force: false, alter: true });

		console.log("Sincronizando tabla destinos...");
		await Destino.sync({ force: false, alter: true });

		console.log("Sincronizando tabla promociones...");
		await Promocion.sync({ force: false, alter: true });

		console.log("Sincronizando tabla descuentos_globales...");
		await DescuentoGlobal.sync({ force: false, alter: true });

		// Verificar estructura de las tablas principales
		const [codigosResults] = await sequelize.query(
			"DESCRIBE codigos_descuento"
		);
		const [reservasResults] = await sequelize.query("DESCRIBE reservas");

		res.json({
			status: "ok",
			message: "Todas las tablas sincronizadas correctamente",
			tables: {
				codigos_descuento: codigosResults.map((row) => row.Field),
				reservas: reservasResults.map((row) => row.Field),
			},
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error("Error sincronizando tablas:", error);
		res.status(500).json({
			error: "Error sincronizando tablas",
			details: error.message,
			timestamp: new Date().toISOString(),
		});
	}
});

// Endpoint para forzar la sincronización de la tabla
app.get("/api/codigos/sync", async (req, res) => {
	try {
		// Verificar conexión primero
		await sequelize.authenticate();

		// Forzar sincronización para actualizar la estructura de la tabla
		await sequelize.sync({ force: false, alter: true });

		// Verificar que las columnas existen
		const [results] = await sequelize.query("DESCRIBE codigos_descuento");
		const columns = results.map((row) => row.Field);

		res.json({
			status: "ok",
			message: "Tabla sincronizada correctamente",
			columns,
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error("Error sincronizando tabla:", error);
		res.status(500).json({
			error: "Error sincronizando tabla",
			details: error.message,
			timestamp: new Date().toISOString(),
		});
	}
});

// Endpoint simple para probar el modelo CodigoDescuento
app.get("/api/codigos/test", async (req, res) => {
	try {
		// Verificar conexión primero
		await sequelize.authenticate();

		// Intentar sincronizar la tabla si no existe
		await sequelize.sync({ force: false });

		// Contar códigos (esto debería funcionar si la tabla existe)
		const totalCodigos = await CodigoDescuento.count();

		res.json({
			status: "ok",
			totalCodigos,
			message: "Modelo CodigoDescuento funcionando correctamente",
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error("Error probando modelo CodigoDescuento:", error);
		res.status(500).json({
			error: "Error probando modelo",
			details: error.message,
			timestamp: new Date().toISOString(),
		});
	}
});

// Endpoint para obtener estadísticas de códigos
app.get("/api/codigos/estadisticas", async (req, res) => {
	try {
		// Verificar conexión primero
		await sequelize.authenticate();

		// Intentar sincronizar la tabla para asegurar que tiene todas las columnas
		await sequelize.sync({ force: false, alter: true });

		const totalCodigos = await CodigoDescuento.count();
		const codigosActivos = await CodigoDescuento.count({
			where: { activo: true },
		});

		// Verificar si las columnas necesarias existen antes de usarlas
		let codigosAgotados = 0;
		let codigosMasUsados = [];
		let totalUsos = 0;

		try {
			// Verificar si las columnas existen
			const [results] = await sequelize.query("DESCRIBE codigos_descuento");
			const columns = results.map((row) => row.Field);
			const hasUsosActuales = columns.includes("usosActuales");
			const hasLimiteUsos = columns.includes("limiteUsos");

			if (hasUsosActuales && hasLimiteUsos) {
				codigosAgotados = await CodigoDescuento.count({
					where: {
						activo: true,
						[Op.and]: [
							sequelize.where(
								sequelize.col("usosActuales"),
								Op.gte,
								sequelize.col("limiteUsos")
							),
						],
					},
				});

				// Códigos más usados
				codigosMasUsados = await CodigoDescuento.findAll({
					where: { activo: true },
					order: [["usosActuales", "DESC"]],
					limit: 5,
					attributes: ["codigo", "descripcion", "usosActuales", "limiteUsos"],
				});

				// Total de usos en el sistema
				totalUsos = await CodigoDescuento.sum("usosActuales");
			}
		} catch (columnError) {
			console.warn(
				"Columnas de uso no disponibles, usando valores por defecto:",
				columnError.message
			);
		}

		res.json({
			totalCodigos,
			codigosActivos,
			codigosAgotados,
			codigosMasUsados,
			totalUsos,
		});
	} catch (error) {
		console.error("Error obteniendo estadísticas:", error);
		res.status(500).json({
			error: "Error interno del servidor",
			details: error.message,
			timestamp: new Date().toISOString(),
		});
	}
});

// Endpoint para buscar códigos con filtros avanzados
app.get("/api/codigos/buscar", async (req, res) => {
	try {
		const {
			activo,
			agotado,
			vencido,
			buscar,
			ordenar = "fechaCreacion",
			direccion = "DESC",
			limite = 20,
			pagina = 1,
		} = req.query;

		const offset = (pagina - 1) * limite;
		const whereClause = {};

		// Filtros
		if (activo !== undefined) {
			whereClause.activo = activo === "true";
		}

		if (agotado === "true") {
			whereClause[Op.and] = [
				sequelize.where(
					sequelize.col("usosActuales"),
					Op.gte,
					sequelize.col("limiteUsos")
				),
			];
		}

		if (vencido === "true") {
			whereClause.fechaVencimiento = {
				[Op.lt]: new Date(),
			};
		}

		if (buscar) {
			whereClause[Op.or] = [
				{ codigo: { [Op.like]: `%${buscar}%` } },
				{ descripcion: { [Op.like]: `%${buscar}%` } },
			];
		}

		const { count, rows: codigos } = await CodigoDescuento.findAndCountAll({
			where: whereClause,
			order: [[ordenar, direccion]],
			limit: parseInt(limite),
			offset: parseInt(offset),
		});

		res.json({
			codigos,
			paginacion: {
				total: count,
				pagina: parseInt(pagina),
				limite: parseInt(limite),
				totalPaginas: Math.ceil(count / limite),
			},
		});
	} catch (error) {
		console.error("Error buscando códigos:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// Endpoint para obtener historial de usos de códigos
app.get("/api/codigos/historial", async (req, res) => {
	try {
		const {
			codigo,
			fechaDesde,
			fechaHasta,
			estado,
			ordenar = "created_at",
			direccion = "DESC",
		} = req.query;

		const whereClause = {};

		// Filtros
		if (codigo) {
			whereClause.codigoDescuento = { [Op.like]: `%${codigo}%` };
		}

		if (fechaDesde || fechaHasta) {
			whereClause.created_at = {};
			if (fechaDesde) whereClause.created_at[Op.gte] = fechaDesde;
			if (fechaHasta) whereClause.created_at[Op.lte] = fechaHasta;
		}

		if (estado) {
			whereClause.estado = estado;
		}

		// Obtener reservas con códigos de descuento
		const reservas = await Reserva.findAll({
			where: {
				...whereClause,
				codigoDescuento: { [Op.ne]: null, [Op.ne]: "" },
			},
			attributes: [
				"id",
				"nombre",
				"email",
				"telefono",
				"created_at",
				"totalConDescuento",
				"estado",
				"estadoPago",
				"codigoDescuento",
			],
			order: [[ordenar, direccion]],
		});

		// Formatear datos para el historial
		const historial = reservas.map((reserva) => ({
			codigo: reserva.codigoDescuento,
			nombre: reserva.nombre,
			email: reserva.email,
			telefono: reserva.telefono,
			fechaUso: reserva.created_at,
			monto: reserva.totalConDescuento,
			estado: reserva.estado,
			estadoPago: reserva.estadoPago,
		}));

		// Estadísticas
		const totalUsos = historial.length;
		const usuariosUnicos = new Set(
			historial.map((h) => `${h.email}-${h.telefono}`)
		).size;
		const totalDescuentos = historial.reduce(
			(sum, h) => sum + (h.monto || 0),
			0
		);

		// Usos de hoy
		const hoy = new Date();
		hoy.setHours(0, 0, 0, 0);
		const usosHoy = historial.filter((h) => new Date(h.fechaUso) >= hoy).length;

		const estadisticas = {
			totalUsos,
			usuariosUnicos,
			totalDescuentos,
			usosHoy,
		};

		res.json({
			historial,
			estadisticas,
		});
	} catch (error) {
		console.error("Error obteniendo historial:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// Endpoint para recibir reservas desde el formulario web
app.post("/enviar-reserva", async (req, res) => {
	try {
		const datosReserva = req.body || {};

		console.log("Reserva web recibida:", {
			nombre: datosReserva.nombre,
			email: datosReserva.email,
			telefono: datosReserva.telefono,
			origen: datosReserva.origen,
			destino: datosReserva.destino,
			fecha: datosReserva.fecha,
			hora: datosReserva.hora,
			pasajeros: datosReserva.pasajeros,
			totalConDescuento: datosReserva.totalConDescuento,
			source: datosReserva.source || "web",
		});

		// Guardar reserva en la base de datos
		const reservaGuardada = await Reserva.create({
			nombre: datosReserva.nombre || "No especificado",
			email: datosReserva.email || "",
			telefono: datosReserva.telefono || "",
			origen: datosReserva.origen || "",
			destino: datosReserva.destino || "",
			fecha: datosReserva.fecha || new Date(),
			hora: datosReserva.hora || "00:00:00",
			pasajeros: parseInt(datosReserva.pasajeros) || 1,
			precio: parseFloat(datosReserva.precio) || 0,
			vehiculo: datosReserva.vehiculo || "",
			numeroVuelo: datosReserva.numeroVuelo || "",
			hotel: datosReserva.hotel || "",
			equipajeEspecial: datosReserva.equipajeEspecial || "",
			sillaInfantil: datosReserva.sillaInfantil === "si" || false,
			idaVuelta: Boolean(datosReserva.idaVuelta),
			fechaRegreso: datosReserva.fechaRegreso || null,
			horaRegreso: datosReserva.horaRegreso || null,
			abonoSugerido: parseFloat(datosReserva.abonoSugerido) || 0,
			saldoPendiente: parseFloat(datosReserva.saldoPendiente) || 0,
			descuentoBase: parseFloat(datosReserva.descuentoBase) || 0,
			descuentoPromocion: parseFloat(datosReserva.descuentoPromocion) || 0,
			descuentoRoundTrip: parseFloat(datosReserva.descuentoRoundTrip) || 0,
			descuentoOnline: parseFloat(datosReserva.descuentoOnline) || 0,
			totalConDescuento: parseFloat(datosReserva.totalConDescuento) || 0,
			mensaje: datosReserva.mensaje || "",
			source: datosReserva.source || "web",
			estado: "pendiente",
			ipAddress: req.ip || req.connection.remoteAddress || "",
			userAgent: req.get("User-Agent") || "",
			codigoDescuento: datosReserva.codigoDescuento || "",
			estadoPago: "pendiente",
		});

		console.log(
			"✅ Reserva guardada en base de datos con ID:",
			reservaGuardada.id
		);

		return res.json({
			success: true,
			message: "Reserva recibida y guardada correctamente",
			reservaId: reservaGuardada.id,
		});
	} catch (error) {
		console.error("Error al procesar la reserva:", error);
		return res.status(500).json({
			success: false,
			message: "Error interno del servidor",
		});
	}
});

// Endpoint para recibir reservas express (flujo simplificado)
app.post("/enviar-reserva-express", async (req, res) => {
	try {
		const datosReserva = req.body || {};

		console.log("Reserva express recibida:", {
			nombre: datosReserva.nombre,
			email: datosReserva.email,
			telefono: datosReserva.telefono,
			origen: datosReserva.origen,
			destino: datosReserva.destino,
			fecha: datosReserva.fecha,
			pasajeros: datosReserva.pasajeros,
			totalConDescuento: datosReserva.totalConDescuento,
			source: datosReserva.source || "express_web",
		});

		// Validar campos mínimos requeridos
		const camposRequeridos = [
			"nombre",
			"email",
			"telefono",
			"origen",
			"destino",
			"fecha",
		];
		const camposFaltantes = camposRequeridos.filter(
			(campo) => !datosReserva[campo]
		);

		if (camposFaltantes.length > 0) {
			return res.status(400).json({
				success: false,
				message: `Faltan campos requeridos: ${camposFaltantes.join(", ")}`,
			});
		}

		// Crear reserva express con campos mínimos
		const reservaExpress = await Reserva.create({
			nombre: datosReserva.nombre,
			email: datosReserva.email,
			telefono: datosReserva.telefono,
			origen: datosReserva.origen,
			destino: datosReserva.destino,
			fecha: datosReserva.fecha,
			hora: "08:00:00", // Hora por defecto - se actualiza después
			pasajeros: parseInt(datosReserva.pasajeros) || 1,
			precio: parseFloat(datosReserva.precio) || 0,
			vehiculo: datosReserva.vehiculo || "",

			// Campos que se completarán después del pago (opcionales por ahora)
			numeroVuelo: "",
			hotel: "",
			equipajeEspecial: "",
			sillaInfantil: false,
			idaVuelta: Boolean(datosReserva.idaVuelta),
			fechaRegreso: datosReserva.fechaRegreso || null,
			horaRegreso: null,

			// Campos financieros
			abonoSugerido: parseFloat(datosReserva.abonoSugerido) || 0,
			saldoPendiente: parseFloat(datosReserva.saldoPendiente) || 0,
			descuentoBase: parseFloat(datosReserva.descuentoBase) || 0,
			descuentoPromocion: parseFloat(datosReserva.descuentoPromocion) || 0,
			descuentoRoundTrip: parseFloat(datosReserva.descuentoRoundTrip) || 0,
			descuentoOnline: parseFloat(datosReserva.descuentoOnline) || 0,
			totalConDescuento: parseFloat(datosReserva.totalConDescuento) || 0,
			mensaje: datosReserva.mensaje || "",

			// Metadata del sistema
			source: datosReserva.source || "express_web",
			estado: "pendiente_detalles", // Estado específico para reservas express
			detallesCompletos: false, // Se marcará como true después del pago
			ipAddress: req.ip || req.connection.remoteAddress || "",
			userAgent: req.get("User-Agent") || "",
			codigoDescuento: datosReserva.codigoDescuento || "",
			estadoPago: "pendiente",
		});

		console.log(
			"✅ Reserva express guardada en base de datos con ID:",
			reservaExpress.id
		);

		return res.json({
			success: true,
			message: "Reserva express creada correctamente",
			reservaId: reservaExpress.id,
			tipo: "express",
		});
	} catch (error) {
		console.error("Error al procesar la reserva express:", error);
		return res.status(500).json({
			success: false,
			message: "Error interno del servidor",
		});
	}
});

// Endpoint para completar detalles después del pago
app.put("/completar-reserva-detalles/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const detalles = req.body;

		console.log(`Completando detalles para reserva ${id}:`, detalles);

		// Buscar la reserva
		const reserva = await Reserva.findByPk(id);
		if (!reserva) {
			return res.status(404).json({
				success: false,
				message: "Reserva no encontrada",
			});
		}

		// Actualizar con los detalles proporcionados
		const datosActualizados = {
			hora: detalles.hora || reserva.hora,
			numeroVuelo: detalles.numeroVuelo || "",
			hotel: detalles.hotel || "",
			equipajeEspecial: detalles.equipajeEspecial || "",
			sillaInfantil: detalles.sillaInfantil || reserva.sillaInfantil,
			idaVuelta: Boolean(detalles.idaVuelta),
			fechaRegreso: detalles.fechaRegreso || reserva.fechaRegreso,
			horaRegreso: detalles.horaRegreso || reserva.horaRegreso,
			detallesCompletos: true,
			estado: "confirmada", // Cambiar estado a confirmada
		};

		await reserva.update(datosActualizados);

		console.log(`✅ Detalles completados para reserva ${id}`);

		return res.json({
			success: true,
			message: "Detalles actualizados correctamente",
			reserva: await Reserva.findByPk(id), // Devolver reserva actualizada
		});
	} catch (error) {
		console.error("Error actualizando detalles de reserva:", error);
		return res.status(500).json({
			success: false,
			message: "Error interno del servidor",
		});
	}
});

// --- ENDPOINTS PARA GESTIONAR RESERVAS ---

// Obtener todas las reservas
app.get("/api/reservas", async (req, res) => {
	try {
		const {
			page = 1,
			limit = 20,
			estado,
			fecha_desde,
			fecha_hasta,
		} = req.query;
		const offset = (page - 1) * limit;

		const whereClause = {};
		if (estado) whereClause.estado = estado;
		if (fecha_desde || fecha_hasta) {
			whereClause.fecha = {};
			if (fecha_desde) whereClause.fecha[Op.gte] = fecha_desde;
			if (fecha_hasta) whereClause.fecha[Op.lte] = fecha_hasta;
		}

		const { count, rows: reservas } = await Reserva.findAndCountAll({
			where: whereClause,
			order: [["created_at", "DESC"]],
			limit: parseInt(limit),
			offset: parseInt(offset),
		});

		res.json({
			reservas,
			pagination: {
				total: count,
				page: parseInt(page),
				limit: parseInt(limit),
				totalPages: Math.ceil(count / limit),
			},
		});
	} catch (error) {
		console.error("Error obteniendo reservas:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// Obtener una reserva específica
app.get("/api/reservas/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const reserva = await Reserva.findByPk(id);

		if (!reserva) {
			return res.status(404).json({ error: "Reserva no encontrada" });
		}

		res.json(reserva);
	} catch (error) {
		console.error("Error obteniendo reserva:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// Actualizar estado de una reserva
app.put("/api/reservas/:id/estado", async (req, res) => {
	try {
		const { id } = req.params;
		const { estado, observaciones } = req.body;

		const reserva = await Reserva.findByPk(id);
		if (!reserva) {
			return res.status(404).json({ error: "Reserva no encontrada" });
		}

		await reserva.update({
			estado,
			observaciones: observaciones || reserva.observaciones,
		});

		res.json({
			success: true,
			message: "Estado de reserva actualizado",
			reserva,
		});
	} catch (error) {
		console.error("Error actualizando estado de reserva:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// Actualizar estado de pago de una reserva
app.put("/api/reservas/:id/pago", async (req, res) => {
	try {
		const { id } = req.params;
		const { estadoPago, metodoPago, referenciaPago } = req.body;

		const reserva = await Reserva.findByPk(id);
		if (!reserva) {
			return res.status(404).json({ error: "Reserva no encontrada" });
		}

		await reserva.update({
			estadoPago,
			metodoPago: metodoPago || reserva.metodoPago,
			referenciaPago: referenciaPago || reserva.referenciaPago,
		});

		res.json({
			success: true,
			message: "Estado de pago actualizado",
			reserva,
		});
	} catch (error) {
		console.error("Error actualizando estado de pago:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// Obtener estadísticas de reservas
app.get("/api/reservas/estadisticas", async (req, res) => {
	try {
		const totalReservas = await Reserva.count();
		const reservasPendientes = await Reserva.count({
			where: { estado: "pendiente" },
		});
		const reservasConfirmadas = await Reserva.count({
			where: { estado: "confirmada" },
		});
		const reservasPagadas = await Reserva.count({
			where: { estadoPago: "pagado" },
		});

		// Ingresos totales
		const ingresosResult = await Reserva.findOne({
			attributes: [
				[
					sequelize.fn("SUM", sequelize.col("totalConDescuento")),
					"totalIngresos",
				],
			],
			where: { estadoPago: "pagado" },
		});

		const totalIngresos = parseFloat(
			ingresosResult?.dataValues?.totalIngresos || 0
		);

		res.json({
			totalReservas,
			reservasPendientes,
			reservasConfirmadas,
			reservasPagadas,
			totalIngresos,
		});
	} catch (error) {
		console.error("Error obteniendo estadísticas:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// Endpoint para generar pagos desde el frontend
app.post("/create-payment", async (req, res) => {
	const { gateway, amount, description, email } = req.body || {};

	if (!gateway || !amount || !description || !email) {
		return res.status(400).json({
			message:
				"Faltan parametros requeridos: gateway, amount, description, email.",
		});
	}

	const frontendBase =
		process.env.FRONTEND_URL || "https://www.transportesaraucaria.cl";
	const backendBase =
		process.env.BACKEND_URL || "https://transportes-araucaria.onrender.com";

	if (gateway === "mercadopago") {
		const preferenceData = {
			items: [
				{
					title: description,
					unit_price: Number(amount),
					quantity: 1,
				},
			],
			back_urls: {
				success: `${frontendBase}/pago-exitoso`,
				failure: `${frontendBase}/pago-fallido`,
				pending: `${frontendBase}/pago-pendiente`,
			},
			auto_return: "approved",
			payer: {
				email,
			},
		};

		try {
			const preference = new Preference(client);
			const result = await preference.create({ body: preferenceData });
			return res.json({ url: result.init_point });
		} catch (error) {
			console.error(
				"Error al crear preferencia de Mercado Pago:",
				error.response ? error.response.data : error.message
			);
			return res.status(500).json({
				message: "Error al generar el pago con Mercado Pago.",
			});
		}
	}

	if (gateway === "flow") {
		const flowApiUrl = process.env.FLOW_API_URL || "https://www.flow.cl/api";
		const params = {
			apiKey: process.env.FLOW_API_KEY,
			commerceOrder: `ORDEN-${Date.now()}`,
			subject: description,
			currency: "CLP",
			amount: Number(amount),
			email: email,
			urlConfirmation: `${backendBase}/api/flow-confirmation`,
			urlReturn: `${frontendBase}/flow-return`,
		};
		params.s = signParams(params);

		try {
			const response = await axios.post(
				`${flowApiUrl}/payment/create`,
				new URLSearchParams(params).toString(),
				{
					headers: {
						"Content-Type": "application/x-www-form-urlencoded",
					},
				}
			);
			const payment = response.data;
			if (!payment.url || !payment.token) {
				throw new Error("Respuesta invalida desde Flow");
			}
			const redirectUrl = `${payment.url}?token=${payment.token}`;
			return res.json({ url: redirectUrl });
		} catch (error) {
			console.error(
				"Error al crear el pago con Flow:",
				error.response ? error.response.data : error.message
			);
			return res.status(500).json({
				message: "Error al generar el pago con Flow.",
			});
		}
	}

	return res.status(400).json({ message: "Pasarela de pago no valida." });
});

// --- ENDPOINTS DE PAGO (mantener los existentes) ---
app.post("/api/create-preference", async (req, res) => {
	try {
		const { items, back_urls, auto_return } = req.body;

		const preference = new Preference(client);
		const result = await preference.create({
			body: {
				items,
				back_urls,
				auto_return,
				notification_url: `${process.env.BACKEND_URL}/api/webhook-mercadopago`,
			},
		});

		res.json(result);
	} catch (error) {
		console.error("Error creando preferencia:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

app.post("/api/create-flow-payment", async (req, res) => {
	try {
		const { amount, subject, email, nombre, apellido, telefono } = req.body;

		const params = {
			apiKey: process.env.FLOW_API_KEY,
			commerceOrder: `order_${Date.now()}`,
			subject: subject,
			amount: amount,
			email: email,
			urlConfirmation: `${process.env.BACKEND_URL}/api/flow-confirmation`,
			urlReturn: `${process.env.FRONTEND_URL}/confirmacion`,
			optional: JSON.stringify({
				nombre: nombre,
				apellido: apellido,
				telefono: telefono,
			}),
		};

		params.s = signParams(params);

		const response = await axios.post(
			"https://www.flow.cl/api/payment/create",
			params,
			{
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
			}
		);

		res.json(response.data);
	} catch (error) {
		console.error("Error creando pago Flow:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

app.post("/api/webhook-mercadopago", (req, res) => {
	console.log("Webhook MercadoPago recibido:", req.body);
	res.status(200).send("OK");
});

app.post("/api/flow-confirmation", (req, res) => {
	console.log("Confirmación Flow recibida:", req.body);
	res.status(200).send("OK");
});

// --- UTILIDADES DE KEEP ALIVE ---
const scheduleKeepAlive = () => {
	const targetBase =
		process.env.RENDER_KEEP_ALIVE_URL || process.env.KEEP_ALIVE_URL || "";

	if (!targetBase) {
		return;
	}

	const normalized = targetBase.endsWith("/health")
		? targetBase
		: `${targetBase.replace(/\/$/, "")}/health`;
	const interval = Number(process.env.RENDER_KEEP_ALIVE_INTERVAL_MS || 300000);
	console.log(
		`Activando keep-alive cada ${interval / 1000}s hacia ${normalized}`
	);

	const timer = setInterval(() => {
		axios.get(normalized).catch((error) => {
			console.warn("Keep-alive fallido:", error.message);
		});
	}, interval);

	if (typeof timer.unref === "function") {
		timer.unref();
	}
};

// --- INICIALIZAR SERVIDOR ---
const PORT = process.env.PORT || 3001;

const startServer = async () => {
	try {
		await initializeDatabase();
		console.log("📊 Base de datos MySQL conectada");
	} catch (error) {
		console.error(
			"⚠️ Advertencia: No se pudo conectar a la base de datos:",
			error.message
		);
		console.log(
			"🔄 Continuando sin base de datos - algunas funciones estarán limitadas"
		);
	}

	app.listen(PORT, () => {
		console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
		scheduleKeepAlive();
	});
};

startServer().catch((error) => {
	console.error("❌ Error iniciando servidor:", error);
	process.exit(1);
});
