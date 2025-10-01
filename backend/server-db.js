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
import CodigoDescuento from "./models/CodigoDescuento.js";
import Destino from "./models/Destino.js";
import Promocion from "./models/Promocion.js";
import DescuentoGlobal from "./models/DescuentoGlobal.js";

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
  const aplicaPorDias = metadata?.aplicaPorDias ?? Boolean(promocion.aplicaPorDias);
  const diasMetadata = Array.isArray(metadata?.dias) ? metadata.dias.filter(Boolean) : [];
  const diasDesdePromo = Array.isArray(promocion.dias) ? promocion.dias.filter(Boolean) : [];
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
  const aplicaPorHorario = metadata?.aplicaPorHorario ?? Boolean(promocion.aplicaPorHorario);
  const horaInicio = metadata?.horaInicio ?? promocion.horaInicio ?? "";
  const horaFin = metadata?.horaFin ?? promocion.horaFin ?? "";
  const tipoViaje = metadata?.aplicaTipoViaje || promocion.aplicaTipoViaje || {};
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
  const [destinos, dayPromotions, descuentosGlobales, codigosDescuento] = await Promise.all([
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
    const aplicaPorDias = metadata?.aplicaPorDias !== undefined ? Boolean(metadata.aplicaPorDias) : true;
    const diasMetadata = Array.isArray(metadata?.dias) ? metadata.dias.filter(Boolean) : [];
    const diasDesdePromo = Array.isArray(promo.dias) ? promo.dias.filter(Boolean) : [];
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
      descripcion: metadata?.descripcion !== undefined ? metadata.descripcion : promo.descripcion || "",
      dias,
      aplicaPorDias,
      aplicaPorHorario: metadata?.aplicaPorHorario !== undefined ? Boolean(metadata.aplicaPorHorario) : false,
      horaInicio: metadata?.horaInicio || "",
      horaFin: metadata?.horaFin || "",
      descuentoPorcentaje: porcentaje,
      aplicaTipoViaje: {
        ida: tipoViaje.ida !== undefined ? Boolean(tipoViaje.ida) : true,
        vuelta: tipoViaje.vuelta !== undefined ? Boolean(tipoViaje.vuelta) : true,
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

<<<<<<< HEAD
		const dayPromotions = await Promocion.findAll({
			order: [["dia", "ASC"]],
		});

		// Transformar promociones al formato esperado por el frontend
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
					ambos:
						tipoViaje.ambos !== undefined ? Boolean(tipoViaje.ambos) : true,
				},
				activo:
					metadata?.activo !== undefined
						? Boolean(metadata.activo)
						: promo.activo !== undefined
						? Boolean(promo.activo)
						: true,
			};
		});

		const descuentosGlobales = await DescuentoGlobal.findAll();

		// Convertir descuentos globales al formato esperado
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

		// Mapear descuentos desde la base de datos
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

		const codigosDescuento = await CodigoDescuento.findAll({
			order: [["fechaCreacion", "DESC"]],
		});

		// Asegurar que usuariosQueUsaron sea siempre un array
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

		// Transformar destinos al formato esperado por el frontend
		const destinosFormateados = destinos.map((destino) => ({
			...destino.toJSON(),
			precios: {
				auto: {
					base: destino.precioIda,
					porcentajeAdicional: 0.1,
				},
				van: {
					base: destino.precioIda * 1.8, // Aproximación para van
					porcentajeAdicional: 0.1,
				},
			},
			descripcion: destino.descripcion || "",
			tiempo: destino.tiempo || "45 min",
			imagen: destino.imagen || "",
			maxPasajeros: destino.maxPasajeros || 4,
			minHorasAnticipacion: destino.minHorasAnticipacion || 5,
		}));

		const responseData = {
			destinos: destinosFormateados,
			dayPromotions: dayPromotionsFormatted,
			descuentosGlobales: descuentosFormatted,
			codigosDescuento: codigosFormateados,
			updatedAt: new Date().toISOString(),
		};

		res.json(responseData);
	} catch (error) {
		console.error("Error al obtener la configuración de precios:", error);
		res.status(500).json({
			message: "No se pudo obtener la configuración de precios.",
		});
	}
=======
    const payload = await buildPricingPayload();
    setPricingCache(payload);
    res.json(payload);
  } catch (error) {
    console.error("Error al obtener la configuracion de precios:", error);
    res.status(500).json({
      message: "No se pudo obtener la configuracion de precios.",
    });
  }
>>>>>>> cursor/fix-non-functional-payment-buttons-8e5f
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
        const precioBase = destino.precios?.auto?.base || destino.precioIda || 0;
        const precioVuelta = destino.precios?.auto?.base || destino.precioVuelta || 0;
        const precioIdaVuelta = destino.precios?.auto?.base || destino.precioIdaVuelta || 0;

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
      existingPromotions.map((promo) => [extractPromotionKeyFromRecord(promo), promo])
    );
    const seenPromotionKeys = new Set();

<<<<<<< HEAD
		for (const promocion of dayPromotions) {
			console.log("Procesando promocion:", promocion);
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
			const sourceId =
				metadata?.sourceId || promocion.id || generatePromotionId();
=======
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
>>>>>>> cursor/fix-non-functional-payment-buttons-8e5f

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
        await DescuentoGlobal.destroy({ where: { tipo: "descuentoPersonalizado" } });

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
		const { codigo, destino, monto, usuarioId } = req.body;
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
		if (usuarioId && codigoEncontrado.usuariosQueUsaron) {
			const usuarioYaUso =
				codigoEncontrado.usuariosQueUsaron.includes(usuarioId);
			if (usuarioYaUso) {
				return res.json({
					valido: false,
					error: "Ya has usado este código de descuento",
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
		const { codigo, usuarioId } = req.body;
		const codigoEncontrado = await CodigoDescuento.findOne({
			where: { codigo },
		});

		if (!codigoEncontrado) {
			return res.status(404).json({ error: "Código no encontrado" });
		}

		// Verificar si el usuario ya usó este código
		if (usuarioId && codigoEncontrado.usuariosQueUsaron) {
			const usuarioYaUso =
				codigoEncontrado.usuariosQueUsaron.includes(usuarioId);
			if (usuarioYaUso) {
				return res.json({
					exito: false,
					error: "Ya has usado este código de descuento",
				});
			}
		}

		// Actualizar usos
		const nuevosUsuarios = usuarioId
			? [...(codigoEncontrado.usuariosQueUsaron || []), usuarioId]
			: codigoEncontrado.usuariosQueUsaron || [];

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

<<<<<<< HEAD
		// Endpoint para recibir reservas desde el formulario web
		app.post("/enviar-reserva", async (req, res) => {
			try {
				const datosReserva = req.body || {};
=======

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

// Endpoint para recibir reservas desde el formulario web
app.post("/enviar-reserva", async (req, res) => {
	try {
		const datosReserva = req.body || {};
>>>>>>> cursor/fix-non-functional-payment-buttons-8e5f

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

				return res.json({
					success: true,
					message: "Reserva recibida correctamente",
				});
			} catch (error) {
				console.error("Error al procesar la reserva:", error);
				return res.status(500).json({
					success: false,
					message: "Error interno del servidor",
				});
			}
		});

// Endpoint para generar pagos desde el frontend
app.post("/create-payment", async (req, res) => {
	const { gateway, amount, description, email } = req.body || {};

	if (!gateway || !amount || !description || !email) {
		return res.status(400).json({
			message: "Faltan parametros requeridos: gateway, amount, description, email.",
		});
	}

	const frontendBase = process.env.FRONTEND_URL || "https://www.transportesaraucaria.cl";
	const backendBase = process.env.BACKEND_URL || "https://transportes-araucaria.onrender.com";

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
			console.error("Error al crear preferencia de Mercado Pago:",
				error.response ? error.response.data : error.message);
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
			console.error("Error al crear el pago con Flow:",
				error.response ? error.response.data : error.message);
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
    process.env.RENDER_KEEP_ALIVE_URL ||
    process.env.KEEP_ALIVE_URL ||
    "";

  if (!targetBase) {
    return;
  }

  const normalized = targetBase.endsWith("/health")
    ? targetBase
    : `${targetBase.replace(/\/$/, "")}/health`;
  const interval = Number(process.env.RENDER_KEEP_ALIVE_INTERVAL_MS || 300000);
  console.log(`Activando keep-alive cada ${interval / 1000}s hacia ${normalized}`);

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
<<<<<<< HEAD
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
=======

	await initializeDatabase();

	app.listen(PORT, () => {
		console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
		console.log("📊 Base de datos MySQL conectada");
		scheduleKeepAlive();
>>>>>>> cursor/fix-non-functional-payment-buttons-8e5f
	});
};

startServer().catch((error) => {
	console.error("❌ Error iniciando servidor:", error);
	process.exit(1);
});
