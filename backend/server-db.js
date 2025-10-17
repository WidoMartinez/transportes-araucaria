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
import Cliente from "./models/Cliente.js";
import Vehiculo from "./models/Vehiculo.js";
import Conductor from "./models/Conductor.js";
import CodigoPago from "./models/CodigoPago.js";
import addPaymentFields from "./migrations/add-payment-fields.js";
import addCodigosPagoTable from "./migrations/add-codigos-pago-table.js";

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

// Middleware de autenticación para rutas administrativas
const authAdmin = (req, res, next) => {
	// TODO: Implementar validación de token/sesión real
	// Por ahora, verificamos que exista un header de autorización
	const authHeader = req.headers["authorization"];
	const adminToken = process.env.ADMIN_TOKEN;

	if (!adminToken) {
		// Misconfiguration: ADMIN_TOKEN must be set
		return res.status(500).json({
			error: "ADMIN_TOKEN no configurado en el entorno del servidor.",
		});
	}
	if (adminToken === "admin-secret-token") {
		// Insecure default token should not be used
		return res.status(500).json({
			error:
				"ADMIN_TOKEN tiene un valor inseguro por defecto. Cambie la configuración.",
		});
	}
	if (!authHeader || authHeader !== `Bearer ${adminToken}`) {
		return res.status(401).json({
			error: "No autorizado. Se requiere autenticación de administrador.",
		});
	}

	next();
};

app.get("/health", (req, res) => {
	res.json({ status: "ok", timestamp: new Date().toISOString() });
});

const generatePromotionId = () =>
	`promo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

// Función para validar RUT chileno con dígito verificador (Módulo 11)
const validarRUT = (rut) => {
	if (!rut) return false;

	// Eliminar puntos, guiones y espacios
	const rutLimpio = rut.toString().replace(/[.\-\s]/g, "");

	if (rutLimpio.length < 2) return false;

	// Separar cuerpo y dígito verificador
	const cuerpo = rutLimpio.slice(0, -1);
	const dv = rutLimpio.slice(-1).toUpperCase();

	// Validar que el cuerpo sea numérico
	if (!/^\d+$/.test(cuerpo)) return false;

	// Calcular dígito verificador esperado
	let suma = 0;
	let multiplicador = 2;

	for (let i = cuerpo.length - 1; i >= 0; i--) {
		suma += parseInt(cuerpo.charAt(i)) * multiplicador;
		multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
	}

	const dvEsperado = 11 - (suma % 11);
	const dvCalculado =
		dvEsperado === 11 ? "0" : dvEsperado === 10 ? "K" : dvEsperado.toString();

	return dv === dvCalculado;
};

// Función para formatear RUT chileno
const formatearRUT = (rut) => {
	if (!rut) return null;

	// Eliminar puntos, guiones y espacios
	const rutLimpio = rut.toString().replace(/[.\-\s]/g, "");

	if (rutLimpio.length < 2) return null;

	// Separar dígito verificador
	const cuerpo = rutLimpio.slice(0, -1);
	const dv = rutLimpio.slice(-1).toUpperCase();

	// Formatear sin puntos: XXXXXXXX-X
	return `${cuerpo}-${dv}`;
};

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

// Funciones de validación robustas para campos numéricos
const parsePositiveInteger = (value, fieldName, defaultValue = 1) => {
	const parsed = parseInt(value, 10);
	if (isNaN(parsed)) {
		console.warn(
			`⚠️ Valor inválido para ${fieldName}: "${value}", usando ${defaultValue}`
		);
		return defaultValue;
	}
	if (parsed < 1) {
		console.warn(
			`⚠️ Valor menor a 1 para ${fieldName}: ${parsed}, usando ${defaultValue}`
		);
		return defaultValue;
	}
	return parsed;
};

const parsePositiveDecimal = (value, fieldName, defaultValue = 0) => {
	const parsed = parseFloat(value);
	if (isNaN(parsed)) {
		console.warn(
			`⚠️ Valor inválido para ${fieldName}: "${value}", usando ${defaultValue}`
		);
		return defaultValue;
	}
	if (parsed < 0) {
		const fallback = Math.max(0, defaultValue);
		console.warn(
			`⚠️ Valor negativo para ${fieldName}: ${parsed}, usando ${fallback}`
		);
		return fallback;
	}
	return parsed;
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

// Función para generar código único de reserva
const generarCodigoReserva = async () => {
	try {
		// Obtener fecha actual
		const fecha = new Date();
		const año = fecha.getFullYear();
		const mes = String(fecha.getMonth() + 1).padStart(2, '0');
		const dia = String(fecha.getDate()).padStart(2, '0');
		const fechaStr = `${año}${mes}${dia}`;
		
		// Calcular inicio y fin del día actual
		const inicioDelDia = new Date(fecha);
		inicioDelDia.setHours(0, 0, 0, 0);
		
		const finDelDia = new Date(fecha);
		finDelDia.setHours(23, 59, 59, 999);
		
		// Contar reservas creadas hoy
		const reservasDelDia = await Reserva.count({
			where: {
				createdAt: {
					[Op.gte]: inicioDelDia,
					[Op.lte]: finDelDia,
				},
			},
		});
		
		// Generar consecutivo (siguiente número del día)
		const consecutivo = String(reservasDelDia + 1).padStart(4, '0');
		
		// Formato: AR-YYYYMMDD-XXXX
		const codigoReserva = `AR-${fechaStr}-${consecutivo}`;
		
		console.log(`📋 Código de reserva generado: ${codigoReserva}`);
		
		return codigoReserva;
	} catch (error) {
		console.error("Error generando código de reserva:", error);
		// Generar código de respaldo con timestamp si falla la consulta
		const timestamp = Date.now();
		return `AR-${timestamp}`;
	}
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
// Función para ejecutar migración automática del código de reserva
const ejecutarMigracionCodigoReserva = async () => {
	try {
		console.log("🔄 Verificando migración de codigo_reserva...");

		// Verificar si la columna ya existe
		const [columns] = await sequelize.query(`
			SHOW COLUMNS FROM reservas LIKE 'codigo_reserva';
		`);

		if (columns.length === 0) {
			console.log("📋 Agregando columna codigo_reserva...");
			
			// Agregar la columna
			await sequelize.query(`
				ALTER TABLE reservas 
				ADD COLUMN codigo_reserva VARCHAR(50) NULL UNIQUE
				COMMENT 'Código único de reserva (formato: AR-YYYYMMDD-XXXX)';
			`);

			// Crear índice único
			await sequelize.query(`
				CREATE UNIQUE INDEX idx_codigo_reserva 
				ON reservas(codigo_reserva);
			`);

			console.log("✅ Columna codigo_reserva agregada exitosamente");
		} else {
			console.log("✅ Columna codigo_reserva ya existe");
		}

		// Generar códigos para reservas sin código
		const [reservasSinCodigo] = await sequelize.query(`
			SELECT id, created_at 
			FROM reservas 
			WHERE codigo_reserva IS NULL 
			ORDER BY created_at ASC;
		`);

		if (reservasSinCodigo.length > 0) {
			console.log(`📋 Generando códigos para ${reservasSinCodigo.length} reservas existentes...`);

			const reservasPorFecha = {};
			
			for (const reserva of reservasSinCodigo) {
				const fecha = new Date(reserva.created_at);
				const año = fecha.getFullYear();
				const mes = String(fecha.getMonth() + 1).padStart(2, '0');
				const dia = String(fecha.getDate()).padStart(2, '0');
				const fechaStr = `${año}${mes}${dia}`;

				if (!reservasPorFecha[fechaStr]) {
					reservasPorFecha[fechaStr] = 0;
				}

				reservasPorFecha[fechaStr]++;
				const consecutivo = String(reservasPorFecha[fechaStr]).padStart(4, '0');
				const codigoReserva = `AR-${fechaStr}-${consecutivo}`;

				await sequelize.query(`
					UPDATE reservas 
					SET codigo_reserva = :codigoReserva 
					WHERE id = :id;
				`, {
					replacements: { codigoReserva, id: reserva.id }
				});
			}

			console.log(`✅ Códigos generados para ${reservasSinCodigo.length} reservas`);
		}

		console.log("✅ Migración de codigo_reserva completada");
	} catch (error) {
		// Si hay error pero no es crítico, solo advertir
		console.warn("⚠️ Advertencia en migración de codigo_reserva:", error.message);
	}
};

const initializeDatabase = async () => {
	try {
		const connected = await testConnection();
		if (!connected) {
			throw new Error("No se pudo conectar a la base de datos");
		}
		await syncDatabase(false); // false = no forzar recreación

		// Ejecutar migraciones automáticas
		await ejecutarMigracionCodigoReserva();
		await addPaymentFields();
		await addCodigosPagoTable();

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
		// NOTA: Removido alter:true para evitar modificar estructura en producción
		console.log("Sincronizando tabla codigos_descuento...");
		await CodigoDescuento.sync({ force: false });

		console.log("Sincronizando tabla reservas...");
		await Reserva.sync({ force: false });

		console.log("Sincronizando tabla destinos...");
		await Destino.sync({ force: false });

		console.log("Sincronizando tabla promociones...");
		await Promocion.sync({ force: false });

		console.log("Sincronizando tabla descuentos_globales...");
		await DescuentoGlobal.sync({ force: false });

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

		// Sincronizar sin alterar estructura (usar migraciones para cambios de esquema)
		await sequelize.sync({ force: false });

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

		// Sincronizar sin alterar estructura (usar migraciones para cambios de esquema)
		await sequelize.sync({ force: false });

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

		// Formatear RUT si se proporciona
		const rutFormateado = datosReserva.rut
			? formatearRUT(datosReserva.rut)
			: null;

		// Generar código único de reserva
		const codigoReserva = await generarCodigoReserva();

		console.log("Reserva web recibida:", {
			nombre: datosReserva.nombre,
			email: datosReserva.email,
			telefono: datosReserva.telefono,
			clienteId: datosReserva.clienteId,
			rut: rutFormateado,
			codigoReserva: codigoReserva,
			origen: datosReserva.origen,
			destino: datosReserva.destino,
			fecha: datosReserva.fecha,
			hora: datosReserva.hora,
			pasajeros: datosReserva.pasajeros,
			totalConDescuento: datosReserva.totalConDescuento,
			source: datosReserva.source || "web",
		});

		// Guardar reserva en la base de datos con validaciones robustas
		const reservaGuardada = await Reserva.create({
			codigoReserva: codigoReserva,
			nombre: datosReserva.nombre || "No especificado",
			email: datosReserva.email || "",
			telefono: datosReserva.telefono || "",
			clienteId: datosReserva.clienteId || null,
			rut: rutFormateado,
			origen: datosReserva.origen || "",
			destino: datosReserva.destino || "",
			fecha: datosReserva.fecha || new Date(),
			hora: datosReserva.hora || "00:00:00",
			pasajeros: parsePositiveInteger(datosReserva.pasajeros, "pasajeros", 1),
			precio: parsePositiveDecimal(datosReserva.precio, "precio", 0),
			vehiculo: datosReserva.vehiculo || "",
			numeroVuelo: datosReserva.numeroVuelo || "",
			hotel: datosReserva.hotel || "",
			equipajeEspecial: datosReserva.equipajeEspecial || "",
			sillaInfantil: datosReserva.sillaInfantil === "si" || false,
			idaVuelta: Boolean(datosReserva.idaVuelta),
			fechaRegreso: datosReserva.fechaRegreso || null,
			horaRegreso: datosReserva.horaRegreso || null,
			abonoSugerido: parsePositiveDecimal(
				datosReserva.abonoSugerido,
				"abonoSugerido",
				0
			),
			saldoPendiente: parsePositiveDecimal(
				datosReserva.saldoPendiente,
				"saldoPendiente",
				0
			),
			descuentoBase: parsePositiveDecimal(
				datosReserva.descuentoBase,
				"descuentoBase",
				0
			),
			descuentoPromocion: parsePositiveDecimal(
				datosReserva.descuentoPromocion,
				"descuentoPromocion",
				0
			),
			descuentoRoundTrip: parsePositiveDecimal(
				datosReserva.descuentoRoundTrip,
				"descuentoRoundTrip",
				0
			),
			descuentoOnline: parsePositiveDecimal(
				datosReserva.descuentoOnline,
				"descuentoOnline",
				0
			),
			totalConDescuento: parsePositiveDecimal(
				datosReserva.totalConDescuento,
				"totalConDescuento",
				0
			),
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
			reservaGuardada.id,
			"Código:",
			reservaGuardada.codigoReserva
		);

		// Enviar email de confirmación llamando al PHP en Hostinger
		try {
			const phpUrl = process.env.PHP_EMAIL_URL || "https://www.transportesaraucaria.cl/enviar_correo_completo.php";
			
			const emailData = {
				...datosReserva,
				codigoReserva: reservaGuardada.codigoReserva,
				rut: rutFormateado,
			};

			console.log("📧 Enviando email de confirmación al PHP...");
			
			const emailResponse = await axios.post(phpUrl, emailData, {
				headers: { "Content-Type": "application/json" },
				timeout: 10000, // 10 segundos timeout
			});

			if (emailResponse.data.success) {
				console.log("✅ Email enviado correctamente");
			} else {
				console.warn("⚠️ Email no se pudo enviar:", emailResponse.data.message);
			}
		} catch (emailError) {
			console.error("❌ Error enviando email:", emailError.message);
			// No fallar la respuesta si el email falla
		}

		return res.json({
			success: true,
			message: "Reserva recibida y guardada correctamente",
			reservaId: reservaGuardada.id,
			codigoReserva: reservaGuardada.codigoReserva,
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

		// Formatear RUT si se proporciona
		const rutFormateado = datosReserva.rut
			? formatearRUT(datosReserva.rut)
			: null;

		// Generar código único de reserva
		const codigoReserva = await generarCodigoReserva();

		console.log("Reserva express recibida:", {
			nombre: datosReserva.nombre,
			email: datosReserva.email,
			telefono: datosReserva.telefono,
			clienteId: datosReserva.clienteId,
			rut: rutFormateado,
			codigoReserva: codigoReserva,
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
			codigoReserva: codigoReserva,
			nombre: datosReserva.nombre,
			email: datosReserva.email,
			telefono: datosReserva.telefono,
			clienteId: datosReserva.clienteId || null,
			rut: rutFormateado,
			origen: datosReserva.origen,
			destino: datosReserva.destino,
			fecha: datosReserva.fecha,
			hora: "08:00:00", // Hora por defecto - se actualiza después
			pasajeros: parsePositiveInteger(datosReserva.pasajeros, "pasajeros", 1),
			precio: parsePositiveDecimal(datosReserva.precio, "precio", 0),
			vehiculo: datosReserva.vehiculo || "",

			// Campos que se completarán después del pago (opcionales por ahora)
			numeroVuelo: "",
			hotel: "",
			equipajeEspecial: "",
			sillaInfantil: false,
			idaVuelta: Boolean(datosReserva.idaVuelta),
			fechaRegreso: datosReserva.fechaRegreso || null,
			horaRegreso: null,

			// Campos financieros con validación
			abonoSugerido: parsePositiveDecimal(
				datosReserva.abonoSugerido,
				"abonoSugerido",
				0
			),
			saldoPendiente: parsePositiveDecimal(
				datosReserva.saldoPendiente,
				"saldoPendiente",
				0
			),
			descuentoBase: parsePositiveDecimal(
				datosReserva.descuentoBase,
				"descuentoBase",
				0
			),
			descuentoPromocion: parsePositiveDecimal(
				datosReserva.descuentoPromocion,
				"descuentoPromocion",
				0
			),
			descuentoRoundTrip: parsePositiveDecimal(
				datosReserva.descuentoRoundTrip,
				"descuentoRoundTrip",
				0
			),
			descuentoOnline: parsePositiveDecimal(
				datosReserva.descuentoOnline,
				"descuentoOnline",
				0
			),
			totalConDescuento: parsePositiveDecimal(
				datosReserva.totalConDescuento,
				"totalConDescuento",
				0
			),
			mensaje: datosReserva.mensaje || "",

			// Metadata del sistema
			source: datosReserva.source || "express_web",
			estado: "pendiente_detalles", // Estado específico para reservas express
			ipAddress: req.ip || req.connection.remoteAddress || "",
			userAgent: req.get("User-Agent") || "",
			codigoDescuento: datosReserva.codigoDescuento || "",
			estadoPago: "pendiente",
		});

		console.log(
			"✅ Reserva express guardada en base de datos con ID:",
			reservaExpress.id,
			"Código:",
			reservaExpress.codigoReserva
		);

		// Si la reserva fue creada con un código de pago, NO marcarlo como usado aquí.
		// El código debe marcarse como usado SOLO después de la confirmación de pago,
		// idealmente en el webhook de confirmación de Flow/Mercado Pago.
		// Enviar notificación por email usando el PHP de Hostinger
		try {
			console.log("📧 Enviando email de notificación express...");
			const emailDataExpress = {
				...datosReserva,
				codigoReserva: reservaExpress.codigoReserva,
				precio: reservaExpress.precio,
				totalConDescuento: reservaExpress.totalConDescuento,
				source: reservaExpress.source || "express_web",
			};

			const phpUrl =
				process.env.PHP_EMAIL_URL ||
				"https://www.transportesaraucaria.cl/enviar_correo_mejorado.php";

			const emailResponse = await axios.post(phpUrl, emailDataExpress, {
				headers: { "Content-Type": "application/json" },
				timeout: 10000,
			});

			console.log("✅ Email express enviado exitosamente:", emailResponse.data);
		} catch (emailError) {
			console.error(
				"❌ Error al enviar email express (no afecta la reserva):",
				emailError.message
			);
		}

		return res.json({
			success: true,
			message: "Reserva express creada correctamente",
			reservaId: reservaExpress.id,
			codigoReserva: reservaExpress.codigoReserva,
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

// --- ENDPOINTS PARA CODIGOS DE PAGO ---

// Crear un nuevo código de pago
app.post("/api/codigos-pago", authAdmin, async (req, res) => {
	try {
		const {
			codigo,
			origen,
			destino,
			monto,
			descripcion,
			vehiculo,
			pasajeros,
			idaVuelta,
			fechaVencimiento,
			usosMaximos,
			observaciones,
		} = req.body;

		// Validar campos requeridos
		if (!codigo || !origen || !destino || !monto) {
			return res.status(400).json({
				success: false,
				message: "Faltan campos requeridos: codigo, origen, destino, monto",
			});
		}

		// Verificar que el código no exista
		const codigoExistente = await CodigoPago.findOne({ where: { codigo } });
		if (codigoExistente) {
			return res.status(409).json({
				success: false,
				message: "El código ya existe",
			});
		}

		// Crear el código de pago
		const codigoPago = await CodigoPago.create({
			codigo,
			origen,
			destino,
			monto,
			descripcion,
			vehiculo,
			pasajeros: pasajeros || 1,
			idaVuelta: idaVuelta || false,
			fechaVencimiento,
			usosMaximos: usosMaximos || 1,
			observaciones,
			estado: "activo",
		});

		console.log(`✅ Código de pago creado: ${codigo}`);

		res.json({
			success: true,
			codigoPago,
		});
	} catch (error) {
		console.error("Error creando código de pago:", error);
		res.status(500).json({
			success: false,
			message: "Error interno del servidor",
			error: error.message,
		});
	}
});

// Validar un código de pago (disponible para todos)
app.get("/api/codigos-pago/:codigo", async (req, res) => {
	try {
		const { codigo } = req.params;
		const codigoUpper = codigo.toUpperCase();
		const codigoPago = await CodigoPago.findOne({
			where: { codigo: codigoUpper },
		});

		if (!codigoPago) {
			return res.status(404).json({
				success: false,
				message: "Código de pago no encontrado",
			});
		}

		// Verificar si el código está activo
		if (codigoPago.estado !== "activo") {
			return res.status(400).json({
				success: false,
				message: `El código está ${codigoPago.estado}`,
				estado: codigoPago.estado,
			});
		}

		// Verificar si está vencido
		if (
			codigoPago.fechaVencimiento &&
			new Date(codigoPago.fechaVencimiento) < new Date()
		) {
			// Actualizar estado a vencido
			await codigoPago.update({ estado: "vencido" });
			return res.status(400).json({
				success: false,
				message: "El código ha vencido",
				estado: "vencido",
			});
		}

		// Verificar si ha alcanzado el máximo de usos
		if (codigoPago.usosActuales >= codigoPago.usosMaximos) {
			return res.status(400).json({
				success: false,
				message: "El código ya ha sido utilizado el máximo de veces",
			});
		}

		// Devolver información del código
		res.json({
			success: true,
			codigoPago: {
				codigo: codigoPago.codigo,
				origen: codigoPago.origen,
				destino: codigoPago.destino,
				monto: codigoPago.monto,
				descripcion: codigoPago.descripcion,
				vehiculo: codigoPago.vehiculo,
				pasajeros: codigoPago.pasajeros,
				idaVuelta: codigoPago.idaVuelta,
				estado: codigoPago.estado,
			},
		});
	} catch (error) {
		console.error("Error validando código de pago:", error);
		res.status(500).json({
			success: false,
			message: "Error interno del servidor",
			error: error.message,
		});
	}
});

// Marcar un código de pago como usado (después del pago exitoso)
app.put("/api/codigos-pago/:codigo/usar", async (req, res) => {
	try {
		const { codigo } = req.params;
		const { reservaId, emailCliente } = req.body;

		const codigoPago = await CodigoPago.findOne({
			where: { codigo },
		});

		if (!codigoPago) {
			return res.status(404).json({
				success: false,
				message: "Código de pago no encontrado",
			});
		}

		// Verificar si el código está activo
		if (codigoPago.estado !== "activo") {
			return res.status(400).json({
				success: false,
				message: `El código está ${codigoPago.estado}`,
			});
		}

		// Incrementar usos
		const nuevosUsos = codigoPago.usosActuales + 1;

		// Actualizar el código
		await codigoPago.update({
			usosActuales: nuevosUsos,
			estado: nuevosUsos >= codigoPago.usosMaximos ? "usado" : "activo",
			reservaId,
			emailCliente,
			fechaUso: new Date(),
		});

		console.log(
			`✅ Código de pago usado: ${codigo} (usos: ${nuevosUsos}/${codigoPago.usosMaximos})`
		);

		res.json({
			success: true,
			message: "Código marcado como usado",
			codigoPago,
		});
	} catch (error) {
		console.error("Error marcando código como usado:", error);
		res.status(500).json({
			success: false,
			message: "Error interno del servidor",
			error: error.message,
		});
	}
});

// Obtener todos los códigos de pago (admin)
app.get("/api/codigos-pago", authAdmin, async (req, res) => {
	try {
		const { estado, page = 1, limit = 50 } = req.query;

		const whereClause = {};
		if (estado) {
			whereClause.estado = estado;
		}

		const offset = (page - 1) * limit;

		const { rows: codigosPago, count } = await CodigoPago.findAndCountAll({
			where: whereClause,
			order: [["created_at", "DESC"]],
			limit: parseInt(limit),
			offset: offset,
		});

		res.json({
			success: true,
			codigosPago,
			pagination: {
				total: count,
				page: parseInt(page),
				limit: parseInt(limit),
				totalPages: Math.ceil(count / limit),
			},
		});
	} catch (error) {
		console.error("Error obteniendo códigos de pago:", error);
		res.status(500).json({
			success: false,
			message: "Error interno del servidor",
			error: error.message,
		});
	}
});

// Actualizar un código de pago (admin)
app.put("/api/codigos-pago/:codigo", authAdmin, async (req, res) => {
	try {
		const { codigo } = req.params;
		const updates = req.body;

		const codigoPago = await CodigoPago.findOne({ where: { codigo } });

		if (!codigoPago) {
			return res.status(404).json({
				success: false,
				message: "Código de pago no encontrado",
			});
		}

		// No permitir cambiar el código mismo
		delete updates.codigo;

		await codigoPago.update(updates);

		console.log(`✅ Código de pago actualizado: ${codigo}`);

		res.json({
			success: true,
			codigoPago,
		});
	} catch (error) {
		console.error("Error actualizando código de pago:", error);
		res.status(500).json({
			success: false,
			message: "Error interno del servidor",
			error: error.message,
		});
	}
});

// Eliminar un código de pago (admin)
app.delete("/api/codigos-pago/:codigo", authAdmin, async (req, res) => {
	try {
		const { codigo } = req.params;

		const codigoPago = await CodigoPago.findOne({ where: { codigo } });

		if (!codigoPago) {
			return res.status(404).json({
				success: false,
				message: "Código de pago no encontrado",
			});
		}

		await codigoPago.destroy();

		console.log(`✅ Código de pago eliminado: ${codigo}`);

		res.json({
			success: true,
			message: "Código de pago eliminado correctamente",
		});
	} catch (error) {
		console.error("Error eliminando código de pago:", error);
		res.status(500).json({
			success: false,
			message: "Error interno del servidor",
			error: error.message,
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

// Obtener estadísticas de reservas
app.get("/api/reservas/estadisticas", async (req, res) => {
	try {
		// Usar consultas separadas con manejo de errores individual
		let totalReservas = 0;
		let reservasPendientes = 0;
		let reservasConfirmadas = 0;
		let reservasPagadas = 0;
		let totalIngresos = 0;

		try {
			totalReservas = await Reserva.count();
		} catch (error) {
			console.error("Error contando total de reservas:", error.message);
		}

		try {
			reservasPendientes = await Reserva.count({
				where: { estado: "pendiente" },
			});
		} catch (error) {
			console.error("Error contando reservas pendientes:", error.message);
		}

		try {
			reservasConfirmadas = await Reserva.count({
				where: { estado: "confirmada" },
			});
		} catch (error) {
			console.error("Error contando reservas confirmadas:", error.message);
		}

		try {
			reservasPagadas = await Reserva.count({
				where: { estadoPago: "pagado" },
			});
		} catch (error) {
			console.error("Error contando reservas pagadas:", error.message);
		}

		// Ingresos totales con manejo de errores mejorado
		try {
			// Usar método de Sequelize que maneja automáticamente los nombres de columnas
			// Esto evita problemas con camelCase vs snake_case
			const reservasPagadasList = await Reserva.findAll({
				where: { estadoPago: "pagado" },
				attributes: ["totalConDescuento"],
			});

			totalIngresos = reservasPagadasList.reduce((sum, reserva) => {
				const monto = parseFloat(reserva.totalConDescuento) || 0;
				return sum + monto;
			}, 0);
		} catch (error) {
			console.error("Error calculando ingresos totales:", error.message);
			// Continuar con totalIngresos = 0
		}

		res.json({
			totalReservas,
			reservasPendientes,
			reservasConfirmadas,
			reservasPagadas,
			totalIngresos: totalIngresos || 0,
		});
	} catch (error) {
		console.error("Error obteniendo estadísticas:", error);
		console.error("Stack completo:", error.stack);
		// Devolver valores por defecto en lugar de error
		res.json({
			totalReservas: 0,
			reservasPendientes: 0,
			reservasConfirmadas: 0,
			reservasPagadas: 0,
			totalIngresos: 0,
			error: "Error al obtener estadísticas, mostrando valores por defecto",
		});
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

// Buscar reserva por código de reserva (público)
app.get("/api/reservas/codigo/:codigo", async (req, res) => {
	try {
		const { codigo } = req.params;
		
		console.log(`🔍 Buscando reserva con código: ${codigo}`);
		
		const reserva = await Reserva.findOne({
			where: {
				codigoReserva: codigo.toUpperCase(),
			},
		});

		if (!reserva) {
			console.log(`❌ No se encontró reserva con código: ${codigo}`);
			return res.status(404).json({ error: "Reserva no encontrada" });
		}

		console.log(`✅ Reserva encontrada: ID ${reserva.id}`);
		res.json(reserva);
	} catch (error) {
		console.error("Error buscando reserva por código:", error);
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

// Actualizar estado de pago de una reserva (con transacciones para garantizar consistencia)
app.put("/api/reservas/:id/pago", async (req, res) => {
	// Usar transacción para asegurar que reserva y cliente se actualizan juntos
	const transaction = await sequelize.transaction();

	try {
		const { id } = req.params;
		const { estadoPago, metodoPago, referenciaPago } = req.body;

		const reserva = await Reserva.findByPk(id, { transaction });
		if (!reserva) {
			await transaction.rollback();
			return res.status(404).json({ error: "Reserva no encontrada" });
		}

		await reserva.update(
			{
				estadoPago,
				metodoPago: metodoPago || reserva.metodoPago,
				referenciaPago: referenciaPago || reserva.referenciaPago,
			},
			{ transaction }
		);

		// Si el pago es exitoso, actualizar el cliente en la misma transacción
		if (estadoPago === "pagado" && reserva.clienteId) {
			const cliente = await Cliente.findByPk(reserva.clienteId, {
				transaction,
			});
			if (cliente) {
				await cliente.update(
					{
						esCliente: true,
						totalPagos: cliente.totalPagos + 1,
						totalGastado:
							parseFloat(cliente.totalGastado) +
							parseFloat(reserva.totalConDescuento || 0),
					},
					{ transaction }
				);
			}
		}

		// Confirmar transacción solo si todo fue exitoso
		await transaction.commit();

		res.json({
			success: true,
			message: "Estado de pago actualizado",
			reserva,
		});
	} catch (error) {
		// Revertir todos los cambios si hay error
		await transaction.rollback();
		console.error("Error actualizando estado de pago:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// --- ENDPOINTS PARA GESTIONAR CLIENTES ---

// Buscar cliente por email, RUT o nombre (autocompletado)
app.get("/api/clientes/buscar", async (req, res) => {
	try {
		const { query } = req.query;

		if (!query || query.length < 2) {
			return res.json({ clientes: [] });
		}

		const clientes = await Cliente.findAll({
			where: {
				[Op.or]: [
					{ email: { [Op.like]: `%${query}%` } },
					{ nombre: { [Op.like]: `%${query}%` } },
					{ rut: { [Op.like]: `%${query}%` } },
					{ telefono: { [Op.like]: `%${query}%` } },
				],
			},
			limit: 10,
			order: [["ultimaReserva", "DESC"]],
		});

		res.json({ clientes });
	} catch (error) {
		console.error("Error buscando clientes:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// Obtener historial completo de un cliente
app.get("/api/clientes/:id/historial", async (req, res) => {
	try {
		const { id } = req.params;

		const cliente = await Cliente.findByPk(id);
		if (!cliente) {
			return res.status(404).json({ error: "Cliente no encontrado" });
		}

		// Obtener todas las reservas del cliente
		const reservas = await Reserva.findAll({
			where: { clienteId: id },
			order: [["created_at", "DESC"]],
		});

		// Calcular estadísticas
		const estadisticas = {
			totalReservas: reservas.length,
			totalPagadas: reservas.filter((r) => r.estadoPago === "pagado").length,
			totalPendientes: reservas.filter((r) => r.estadoPago === "pendiente")
				.length,
			totalGastado: reservas
				.filter((r) => r.estadoPago === "pagado")
				.reduce((sum, r) => sum + parseFloat(r.totalConDescuento || 0), 0),
			ultimaReserva: reservas[0]?.created_at || null,
			primeraReserva: reservas[reservas.length - 1]?.created_at || null,
		};

		res.json({
			cliente,
			reservas,
			estadisticas,
		});
	} catch (error) {
		console.error("Error obteniendo historial del cliente:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// Marcar/desmarcar cliente manualmente
app.put("/api/clientes/:id/marcar-cliente", async (req, res) => {
	try {
		const { id } = req.params;
		const { esCliente, marcadoManualmente, notas } = req.body;

		const cliente = await Cliente.findByPk(id);
		if (!cliente) {
			return res.status(404).json({ error: "Cliente no encontrado" });
		}

		await cliente.update({
			esCliente: esCliente !== undefined ? esCliente : cliente.esCliente,
			marcadoManualmente:
				marcadoManualmente !== undefined
					? marcadoManualmente
					: cliente.marcadoManualmente,
			notas: notas !== undefined ? notas : cliente.notas,
		});

		res.json({
			success: true,
			message: "Cliente actualizado",
			cliente,
		});
	} catch (error) {
		console.error("Error actualizando cliente:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// Crear o actualizar cliente (desde formulario de reserva)
app.post("/api/clientes/crear-o-actualizar", async (req, res) => {
	try {
		const { rut, nombre, email, telefono, notas } = req.body;

		if (!nombre || !email || !telefono) {
			return res.status(400).json({
				error: "Nombre, email y teléfono son obligatorios",
			});
		}

		// Formatear RUT si se proporciona
		const rutFormateado = rut ? formatearRUT(rut) : null;

		// Buscar cliente existente por email o RUT
		let cliente = null;
		if (rutFormateado) {
			cliente = await Cliente.findOne({ where: { rut: rutFormateado } });
		}
		if (!cliente) {
			cliente = await Cliente.findOne({ where: { email } });
		}

		if (cliente) {
			// Actualizar datos opcionales sin sobrescribir histórico
			const updateData = {};
			if (rutFormateado && rutFormateado !== cliente.rut) {
				updateData.rut = rutFormateado;
			}
			if (telefono && telefono !== cliente.telefono) {
				updateData.telefono = telefono;
			}
			if (nombre && nombre !== cliente.nombre) {
				updateData.nombre = nombre;
			}
			if (notas) {
				updateData.notas = notas;
			}

			if (Object.keys(updateData).length > 0) {
				await cliente.update(updateData);
			}
		} else {
			// Crear nuevo cliente
			cliente = await Cliente.create({
				rut: rutFormateado,
				nombre,
				email,
				telefono,
				notas: notas || null,
				totalReservas: 0,
				totalPagos: 0,
				esCliente: false,
			});
		}

		res.json({
			success: true,
			cliente,
			created: !cliente,
		});
	} catch (error) {
		console.error("Error creando/actualizando cliente:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// ==================== RUTAS DE VEHÍCULOS ====================

// Listar todos los vehículos
app.get("/api/vehiculos", async (req, res) => {
	try {
		const { estado, tipo } = req.query;
		const where = {};

		if (estado) {
			where.estado = estado;
		}
		if (tipo) {
			where.tipo = tipo;
		}

		const vehiculos = await Vehiculo.findAll({
			where,
			order: [["patente", "ASC"]],
		});

		res.json({ vehiculos });
	} catch (error) {
		console.error("Error obteniendo vehículos:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// Obtener un vehículo por ID
app.get("/api/vehiculos/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const vehiculo = await Vehiculo.findByPk(id);

		if (!vehiculo) {
			return res.status(404).json({ error: "Vehículo no encontrado" });
		}

		res.json({ vehiculo });
	} catch (error) {
		console.error("Error obteniendo vehículo:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// Crear un nuevo vehículo
app.post("/api/vehiculos", authAdmin, async (req, res) => {
	try {
		const {
			patente,
			tipo,
			marca,
			modelo,
			anio,
			capacidad,
			estado,
			observaciones,
		} = req.body;

		if (!patente || !tipo) {
			return res.status(400).json({
				error: "Patente y tipo son obligatorios",
			});
		}

		// Normalizar patente: convertir a mayúsculas y trim para evitar duplicados por casing
		const patenteNorm = patente?.trim().toUpperCase();

		// Normalizar año: convertir cadena vacía a null para respetar allowNull
		const anioNorm =
			anio === "" || anio === null || anio === undefined ? null : Number(anio);

		// Normalizar capacidad
		const capacidadNorm =
			capacidad === "" || capacidad === null || capacidad === undefined
				? 4
				: Number(capacidad);

		// Validar año y capacidad
		if (
			(anioNorm !== null &&
				(isNaN(anioNorm) ||
					anioNorm < 1900 ||
					anioNorm > new Date().getFullYear() + 1)) ||
			isNaN(capacidadNorm) ||
			!Number.isInteger(capacidadNorm) ||
			capacidadNorm < 1 ||
			capacidadNorm > 50
		) {
			return res.status(400).json({
				error:
					"Año o capacidad inválidos. Año debe ser un número entre 1900 y el próximo año, capacidad debe ser un entero positivo entre 1 y 50.",
			});
		}
		// Verificar si ya existe un vehículo con esa patente normalizada
		const existente = await Vehiculo.findOne({
			where: { patente: patenteNorm },
		});
		if (existente) {
			return res.status(409).json({
				error: "Ya existe un vehículo con esta patente",
			});
		}

		const vehiculo = await Vehiculo.create({
			patente: patenteNorm,
			tipo,
			marca,
			modelo,
			anio: anioNorm,
			capacidad: capacidadNorm,
			estado: estado || "disponible",
			observaciones,
		});

		res.status(201).json({
			success: true,
			message: "Vehículo creado exitosamente",
			vehiculo,
		});
	} catch (error) {
		console.error("Error creando vehículo:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// Actualizar un vehículo
app.put("/api/vehiculos/:id", authAdmin, async (req, res) => {
	try {
		const { id } = req.params;
		const {
			patente,
			tipo,
			marca,
			modelo,
			anio,
			capacidad,
			estado,
			observaciones,
		} = req.body;

		const vehiculo = await Vehiculo.findByPk(id);
		if (!vehiculo) {
			return res.status(404).json({ error: "Vehículo no encontrado" });
		}

		// Normalizar patente si viene
		const patenteNorm = patente
			? patente.trim().toUpperCase()
			: vehiculo.patente;

		// Validar y normalizar año
		let anioNorm;
		if (anio === "") {
			anioNorm = null;
		} else if (anio !== undefined) {
			const anioNum = Number(anio);
			const currentYear = new Date().getFullYear();
			if (isNaN(anioNum) || anioNum < 1900 || anioNum > currentYear + 1) {
				return res.status(400).json({
					error:
						"El año debe ser un número válido entre 1900 y " +
						(currentYear + 1),
				});
			}
			anioNorm = anioNum;
		} else {
			anioNorm = vehiculo.anio;
		}

		// Validar y normalizar capacidad
		let capacidadNorm;
		if (capacidad !== undefined) {
			const capacidadNum = Number(capacidad);
			const MAX_CAPACIDAD = 50; // Si el valor máximo es configurable, reemplazar por la variable correspondiente
			if (isNaN(capacidadNum) || capacidadNum <= 0) {
				return res.status(400).json({
					error: "La capacidad debe ser un número positivo válido",
				});
			}
			if (capacidadNum > MAX_CAPACIDAD) {
				return res.status(400).json({
					error: `La capacidad máxima permitida es ${MAX_CAPACIDAD}`,
				});
			}
			capacidadNorm = capacidadNum;
		} else {
			capacidadNorm = vehiculo.capacidad;
		}

		// Si se está cambiando la patente, verificar que no exista otra con ese valor
		if (patenteNorm !== vehiculo.patente) {
			const existente = await Vehiculo.findOne({
				where: { patente: patenteNorm },
			});
			if (existente) {
				return res.status(409).json({
					error: "Ya existe un vehículo con esta patente",
				});
			}
		}

		await vehiculo.update({
			patente: patenteNorm,
			tipo: tipo || vehiculo.tipo,
			marca: marca !== undefined ? marca : vehiculo.marca,
			modelo: modelo !== undefined ? modelo : vehiculo.modelo,
			anio: anioNorm,
			capacidad: capacidadNorm,
			estado: estado !== undefined ? estado : vehiculo.estado,
			observaciones:
				observaciones !== undefined ? observaciones : vehiculo.observaciones,
		});

		res.json({
			success: true,
			message: "Vehículo actualizado exitosamente",
			vehiculo,
		});
	} catch (error) {
		console.error("Error actualizando vehículo:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// Eliminar un vehículo
app.delete("/api/vehiculos/:id", authAdmin, async (req, res) => {
	try {
		const { id } = req.params;

		const vehiculo = await Vehiculo.findByPk(id);
		if (!vehiculo) {
			return res.status(404).json({ error: "Vehículo no encontrado" });
		}

		await vehiculo.destroy();

		res.json({
			success: true,
			message: "Vehículo eliminado exitosamente",
		});
	} catch (error) {
		console.error("Error eliminando vehículo:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// ==================== RUTAS DE CONDUCTORES ====================

// Listar todos los conductores
app.get("/api/conductores", async (req, res) => {
	try {
		const { estado } = req.query;
		const where = {};

		if (estado) {
			where.estado = estado;
		}

		const conductores = await Conductor.findAll({
			where,
			order: [["nombre", "ASC"]],
		});

		res.json({ conductores });
	} catch (error) {
		console.error("Error obteniendo conductores:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// Obtener un conductor por ID
app.get("/api/conductores/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const conductor = await Conductor.findByPk(id);

		if (!conductor) {
			return res.status(404).json({ error: "Conductor no encontrado" });
		}

		res.json({ conductor });
	} catch (error) {
		console.error("Error obteniendo conductor:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// Crear un nuevo conductor
app.post("/api/conductores", authAdmin, async (req, res) => {
	try {
		const {
			nombre,
			rut,
			telefono,
			email,
			licencia,
			fechaVencimientoLicencia,
			estado,
			observaciones,
		} = req.body;

		if (!nombre || !rut || !telefono) {
			return res.status(400).json({
				error: "Nombre, RUT y teléfono son obligatorios",
			});
		}

		// Validar RUT con dígito verificador
		if (!validarRUT(rut)) {
			return res
				.status(400)
				.json({ error: "RUT inválido. Verifique el dígito verificador." });
		}

		// Formatear RUT
		const rutFormateado = formatearRUT(rut);
		if (!rutFormateado) {
			return res.status(400).json({ error: "RUT inválido" });
		}

		// Normalizar email: cadena vacía a null para respetar validación isEmail
		const emailNorm = email?.trim() === "" || !email ? null : email.trim();

		// Normalizar fecha: cadena vacía a null para evitar fechas inválidas
		const fechaNorm =
			!fechaVencimientoLicencia || fechaVencimientoLicencia === ""
				? null
				: fechaVencimientoLicencia;

		// Verificar si ya existe un conductor con ese RUT
		const existente = await Conductor.findOne({
			where: { rut: rutFormateado },
		});
		if (existente) {
			return res.status(409).json({
				error: "Ya existe un conductor con este RUT",
			});
		}

		const conductor = await Conductor.create({
			nombre,
			rut: rutFormateado,
			telefono,
			email: emailNorm,
			licencia,
			fechaVencimientoLicencia: fechaNorm,
			estado: estado || "disponible",
			observaciones,
		});

		res.status(201).json({
			success: true,
			message: "Conductor creado exitosamente",
			conductor,
		});
	} catch (error) {
		console.error("Error creando conductor:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// Actualizar un conductor
app.put("/api/conductores/:id", authAdmin, async (req, res) => {
	try {
		const { id } = req.params;
		const {
			nombre,
			rut,
			telefono,
			email,
			licencia,
			fechaVencimientoLicencia,
			estado,
			observaciones,
		} = req.body;

		const conductor = await Conductor.findByPk(id);
		if (!conductor) {
			return res.status(404).json({ error: "Conductor no encontrado" });
		}

		// Si se está cambiando el RUT, validar y formatear
		let rutFormateado = conductor.rut;
		if (rut && rut !== conductor.rut) {
			// Validar RUT con dígito verificador
			if (!validarRUT(rut)) {
				return res
					.status(400)
					.json({ error: "RUT inválido. Verifique el dígito verificador." });
			}

			rutFormateado = formatearRUT(rut);
			if (!rutFormateado) {
				return res.status(400).json({ error: "RUT inválido" });
			}

			const existente = await Conductor.findOne({
				where: { rut: rutFormateado },
			});
			if (existente) {
				return res.status(409).json({
					error: "Ya existe un conductor con este RUT",
				});
			}
		}

		// Normalizar email: aplicar trim y cadena vacía a null
		const emailNorm =
			typeof email === "string" && email.trim() === ""
				? null
				: typeof email === "string"
				? email.trim()
				: email;

		// Normalizar fecha: cadena vacía a null
		const fechaNorm =
			fechaVencimientoLicencia === "" ? null : fechaVencimientoLicencia;

		await conductor.update({
			nombre: nombre || conductor.nombre,
			rut: rutFormateado,
			telefono: telefono || conductor.telefono,
			email: email !== undefined ? emailNorm : conductor.email,
			licencia: licencia !== undefined ? licencia : conductor.licencia,
			fechaVencimientoLicencia:
				fechaVencimientoLicencia !== undefined
					? fechaNorm
					: conductor.fechaVencimientoLicencia,
			estado: estado !== undefined ? estado : conductor.estado,
			observaciones:
				observaciones !== undefined ? observaciones : conductor.observaciones,
		});

		res.json({
			success: true,
			message: "Conductor actualizado exitosamente",
			conductor,
		});
	} catch (error) {
		console.error("Error actualizando conductor:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// Eliminar un conductor
app.delete("/api/conductores/:id", authAdmin, async (req, res) => {
	try {
		const { id } = req.params;

		const conductor = await Conductor.findByPk(id);
		if (!conductor) {
			return res.status(404).json({ error: "Conductor no encontrado" });
		}

		await conductor.destroy();

		res.json({
			success: true,
			message: "Conductor eliminado exitosamente",
		});
	} catch (error) {
		console.error("Error eliminando conductor:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// Eliminar una reserva
app.delete("/api/reservas/:id", async (req, res) => {
	try {
		const { id } = req.params;

		const reserva = await Reserva.findByPk(id);
		if (!reserva) {
			return res.status(404).json({ error: "Reserva no encontrada" });
		}

		await reserva.destroy();

		res.json({
			success: true,
			message: "Reserva eliminada exitosamente",
		});
	} catch (error) {
		console.error("Error eliminando reserva:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// Cambiar estado de una reserva
app.put("/api/reservas/:id/estado", async (req, res) => {
	try {
		const { id } = req.params;
		const { estado } = req.body;

		const reserva = await Reserva.findByPk(id);
		if (!reserva) {
			return res.status(404).json({ error: "Reserva no encontrada" });
		}

		await reserva.update({ estado });

		res.json({
			success: true,
			message: "Estado actualizado",
			reserva,
		});
	} catch (error) {
		console.error("Error actualizando estado:", error);
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

// Webhook para MercadoPago - Maneja notificaciones de pago
app.post("/api/webhook-mercadopago", async (req, res) => {
	try {
		console.log("🔔 Webhook MercadoPago recibido:", req.body);

		const { type, data } = req.body;

		// Responder rápido a MercadoPago (requisito de la API)
		res.status(200).send("OK");

		// Procesar solo notificaciones de pago
		if (type !== "payment") {
			console.log("ℹ️  Tipo de notificación no es payment, ignorando");
			return;
		}

		// Obtener ID del pago
		const paymentId = data?.id;
		if (!paymentId) {
			console.log("⚠️  No se recibió payment ID");
			return;
		}

		console.log(`🔍 Consultando pago MercadoPago ID: ${paymentId}`);

		// Consultar detalles del pago a la API de MercadoPago
		const mpResponse = await axios.get(
			`https://api.mercadopago.com/v1/payments/${paymentId}`,
			{
				headers: {
					Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
				},
			}
		);

		const payment = mpResponse.data;
		console.log("💳 Detalles del pago:", {
			id: payment.id,
			status: payment.status,
			status_detail: payment.status_detail,
			amount: payment.transaction_amount,
		});

		// Solo procesar pagos aprobados
		if (payment.status !== "approved") {
			console.log(
				`ℹ️  Pago no aprobado (status: ${payment.status}), no se actualiza reserva`
			);
			return;
		}

		// Extraer datos relevantes
		const externalReference =
			payment.external_reference || payment.metadata?.reserva_id;
		const email = payment.payer?.email;

		if (!externalReference && !email) {
			console.log(
				"⚠️  No se puede identificar la reserva (falta external_reference o email)"
			);
			return;
		}

		// Buscar reserva por ID o email
		let reserva;
		if (externalReference) {
			reserva = await Reserva.findByPk(externalReference);
		}
		if (!reserva && email) {
			reserva = await Reserva.findOne({
				where: { email: email },
				order: [["created_at", "DESC"]],
			});
		}

		if (!reserva) {
			console.log("⚠️  Reserva no encontrada en la base de datos");
			return;
		}

		console.log(`✅ Reserva encontrada: ID ${reserva.id}, Código ${reserva.codigoReserva}`);

		// Actualizar estado de pago en la reserva
		await reserva.update({
			estadoPago: "aprobado",
			pagoId: payment.id.toString(),
			pagoGateway: "mercadopago",
			pagoMonto: payment.transaction_amount,
			pagoFecha: new Date(payment.date_approved || new Date()),
			estado: reserva.estado === "pendiente_detalles" ? reserva.estado : "confirmada",
		});

		console.log("💾 Reserva actualizada con información de pago");

		// Enviar correo de confirmación de pago
		try {
			console.log("📧 Enviando email de confirmación de pago...");

			const emailData = {
				email: reserva.email,
				nombre: reserva.nombre,
				codigoReserva: reserva.codigoReserva,
				origen: reserva.origen,
				destino: reserva.destino,
				fecha: reserva.fecha,
				hora: reserva.hora,
				pasajeros: reserva.pasajeros,
				vehiculo: reserva.vehiculo,
				monto: payment.transaction_amount,
				gateway: "MercadoPago",
				paymentId: payment.id.toString(),
				estadoPago: "approved",
			};

			const phpUrl =
				process.env.PHP_EMAIL_URL ||
				"https://www.transportesaraucaria.cl/enviar_confirmacion_pago.php";

			const emailResponse = await axios.post(phpUrl, emailData, {
				headers: { "Content-Type": "application/json" },
				timeout: 10000,
			});

			console.log("✅ Email de confirmación de pago enviado:", emailResponse.data);
		} catch (emailError) {
			console.error(
				"❌ Error al enviar email de confirmación (no crítico):",
				emailError.message
			);
		}
	} catch (error) {
		console.error("❌ Error procesando webhook MercadoPago:", error.message);
		// No lanzar error para no reintentar el webhook
	}
});

// Webhook para Flow - Maneja confirmaciones de pago
app.post("/api/flow-confirmation", async (req, res) => {
	try {
		console.log("🔔 Confirmación Flow recibida:", req.body);

		const { token } = req.body;

		if (!token) {
			console.log("⚠️  No se recibió token de Flow");
			return res.status(400).send("Missing token");
		}

		// Consultar estado del pago en Flow
		const params = {
			apiKey: process.env.FLOW_API_KEY,
			token: token,
		};
		params.s = signParams(params);

		const flowResponse = await axios.get(
			"https://www.flow.cl/api/payment/getStatus",
			{ params }
		);

		const payment = flowResponse.data;
		console.log("💳 Estado del pago Flow:", {
			flowOrder: payment.flowOrder,
			status: payment.status,
			amount: payment.amount,
		});

		// Responder a Flow
		res.status(200).send("OK");

		// Solo procesar pagos exitosos (status 2 = pagado)
		if (payment.status !== 2) {
			console.log(
				`ℹ️  Pago no exitoso (status: ${payment.status}), no se actualiza reserva`
			);
			return;
		}

		// Extraer email del optional
		const optional = payment.optional ? JSON.parse(payment.optional) : {};
		const email = payment.payer?.email || optional.email;
		const commerceOrder = payment.commerceOrder;

		if (!commerceOrder && !email) {
			console.log(
				"⚠️  No se puede identificar la reserva (falta commerceOrder o email)"
			);
			return;
		}

		// Buscar reserva por email (más reciente)
		let reserva;
		if (email) {
			reserva = await Reserva.findOne({
				where: { email: email },
				order: [["created_at", "DESC"]],
			});
		}

		if (!reserva) {
			console.log("⚠️  Reserva no encontrada en la base de datos");
			return;
		}

		console.log(`✅ Reserva encontrada: ID ${reserva.id}, Código ${reserva.codigoReserva}`);

		// Actualizar estado de pago en la reserva
		await reserva.update({
			estadoPago: "aprobado",
			pagoId: payment.flowOrder.toString(),
			pagoGateway: "flow",
			pagoMonto: payment.amount,
			pagoFecha: new Date(payment.paymentDate || new Date()),
			estado: reserva.estado === "pendiente_detalles" ? reserva.estado : "confirmada",
		});

		console.log("💾 Reserva actualizada con información de pago Flow");

		// Enviar correo de confirmación de pago
		try {
			console.log("📧 Enviando email de confirmación de pago...");

			const emailData = {
				email: reserva.email,
				nombre: reserva.nombre,
				codigoReserva: reserva.codigoReserva,
				origen: reserva.origen,
				destino: reserva.destino,
				fecha: reserva.fecha,
				hora: reserva.hora,
				pasajeros: reserva.pasajeros,
				vehiculo: reserva.vehiculo,
				monto: payment.amount,
				gateway: "Flow",
				paymentId: payment.flowOrder.toString(),
				estadoPago: "approved",
			};

			const phpUrl =
				process.env.PHP_EMAIL_URL ||
				"https://www.transportesaraucaria.cl/enviar_confirmacion_pago.php";

			const emailResponse = await axios.post(phpUrl, emailData, {
				headers: { "Content-Type": "application/json" },
				timeout: 10000,
			});

			console.log("✅ Email de confirmación de pago Flow enviado:", emailResponse.data);
		} catch (emailError) {
			console.error(
				"❌ Error al enviar email de confirmación (no crítico):",
				emailError.message
			);
		}
	} catch (error) {
		console.error("❌ Error procesando confirmación Flow:", error.message);
		res.status(500).send("Error");
	}
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

		// NOTA: Las migraciones de base de datos deben ejecutarse con el script
		// separado: npm run migrate o npm run start:migrate
		// Esto evita duplicar lógica y asegura que las migraciones se ejecuten
		// de forma controlada antes del inicio del servidor
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
