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
app.use(cors());

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
				const fs = await import('fs');
				const pricingData = JSON.parse(fs.readFileSync('./data/pricing.json', 'utf8'));
				
				if (pricingData.dayPromotions && pricingData.dayPromotions.length > 0) {
					for (const promo of pricingData.dayPromotions) {
						await Promocion.create({
							nombre: promo.nombre,
							dia: 'lunes', // Por defecto
							tipo: 'porcentaje',
							valor: promo.descuentoPorcentaje || 0,
							activo: promo.activo !== false,
							descripcion: promo.descripcion || '',
						});
					}
					console.log(`✅ Migradas ${pricingData.dayPromotions.length} promociones`);
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

// --- ENDPOINTS PARA CONFIGURACIÓN DE PRECIOS ---
app.get("/pricing", async (req, res) => {
	try {
		const destinos = await Destino.findAll({
			order: [
				["orden", "ASC"],
				["nombre", "ASC"],
			],
		});

		const dayPromotions = await Promocion.findAll({
			order: [["dia", "ASC"]],
		});

		// Transformar promociones al formato esperado por el frontend
		const dayPromotionsFormatted = dayPromotions.map((promo) => ({
			id: `promo-${promo.id}`,
			nombre: promo.nombre,
			destino: "", // Las promociones de la BD no tienen destino específico
			descripcion: promo.descripcion || "",
			dias: [promo.dia], // Convertir dia singular a array
			aplicaPorDias: true, // Las promociones de BD se basan en días
			aplicaPorHorario: false,
			horaInicio: "",
			horaFin: "",
			descuentoPorcentaje: promo.tipo === "porcentaje" ? promo.valor : 0,
			aplicaTipoViaje: {
				ida: true,
				vuelta: true,
				ambos: true,
			},
		}));

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
		const codigosFormateados = codigosDescuento.map((codigo) => ({
			...codigo.toJSON(),
			usuariosQueUsaron: Array.isArray(codigo.usuariosQueUsaron)
				? codigo.usuariosQueUsaron
				: codigo.usuariosQueUsaron
				? JSON.parse(codigo.usuariosQueUsaron)
				: [],
		}));

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

		res.json({
			destinos: destinosFormateados,
			dayPromotions: dayPromotionsFormatted,
			descuentosGlobales: descuentosFormatted,
			codigosDescuento: codigosFormateados,
			updatedAt: new Date().toISOString(),
		});
	} catch (error) {
		console.error("Error al obtener la configuración de precios:", error);
		res.status(500).json({
			message: "No se pudo obtener la configuración de precios.",
		});
	}
});

// Endpoint PUT para actualizar precios
app.put("/pricing", async (req, res) => {
	const { destinos, dayPromotions, descuentosGlobales } = req.body || {};

	if (!Array.isArray(destinos) || !Array.isArray(dayPromotions)) {
		return res.status(400).json({
			message:
				"La estructura de datos enviada es incorrecta. Se esperaba un objeto con 'destinos' y 'dayPromotions'.",
		});
	}

	try {
		// Actualizar destinos
		for (const destino of destinos) {
			await Destino.upsert({
				nombre: destino.nombre,
				precioIda: destino.precioIda,
				precioVuelta: destino.precioVuelta,
				precioIdaVuelta: destino.precioIdaVuelta,
				activo: destino.activo !== false,
				orden: destino.orden || 0,
			});
		}

		// Actualizar promociones
		for (const promocion of dayPromotions) {
			// Si la promoción tiene múltiples días, crear una entrada por día
			const dias = Array.isArray(promocion.dias)
				? promocion.dias
				: [promocion.dia];

			for (const dia of dias) {
				await Promocion.upsert({
					nombre: promocion.nombre,
					dia: dia,
					tipo: "porcentaje", // Por defecto porcentaje
					valor: promocion.descuentoPorcentaje || 0,
					activo: promocion.activo !== false,
					descripcion: promocion.descripcion,
				});
			}
		}

		// Actualizar descuentos globales
		if (descuentosGlobales) {
			// Actualizar descuento online
			if (descuentosGlobales.descuentoOnline) {
				await DescuentoGlobal.upsert({
					tipo: "descuentoOnline",
					nombre: descuentosGlobales.descuentoOnline.nombre,
					valor: descuentosGlobales.descuentoOnline.valor,
					activo: descuentosGlobales.descuentoOnline.activo,
					descripcion: "Descuento por reserva online",
				});
			}

			// Actualizar descuento round trip
			if (descuentosGlobales.descuentoRoundTrip) {
				await DescuentoGlobal.upsert({
					tipo: "descuentoRoundTrip",
					nombre: descuentosGlobales.descuentoRoundTrip.nombre,
					valor: descuentosGlobales.descuentoRoundTrip.valor,
					activo: descuentosGlobales.descuentoRoundTrip.activo,
					descripcion: "Descuento por ida y vuelta",
				});
			}

			// Actualizar descuentos personalizados
			if (descuentosGlobales.descuentosPersonalizados) {
				// Eliminar descuentos personalizados existentes
				await DescuentoGlobal.destroy({
					where: { tipo: "descuentoPersonalizado" },
				});

				// Crear nuevos descuentos personalizados
				for (const descuento of descuentosGlobales.descuentosPersonalizados) {
					await DescuentoGlobal.create({
						tipo: "descuentoPersonalizado",
						nombre: descuento.nombre,
						valor: descuento.valor,
						activo: descuento.activo,
						descripcion: descuento.descripcion,
					});
				}
			}
		}

		res.json({ message: "Configuración actualizada correctamente" });
	} catch (error) {
		console.error("Error al guardar la configuración de precios:", error);
		res.status(500).json({
			message: "No se pudo guardar la configuración de precios.",
		});
	}
});

// --- ENDPOINTS PARA CÓDIGOS DE DESCUENTO ---
app.get("/api/codigos", async (req, res) => {
	try {
		const codigos = await CodigoDescuento.findAll({
			order: [["fechaCreacion", "DESC"]],
		});

		// Asegurar que usuariosQueUsaron sea siempre un array
		const codigosFormateados = codigos.map((codigo) => ({
			...codigo.toJSON(),
			usuariosQueUsaron: Array.isArray(codigo.usuariosQueUsaron)
				? codigo.usuariosQueUsaron
				: codigo.usuariosQueUsaron
				? JSON.parse(codigo.usuariosQueUsaron)
				: [],
		}));

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
		const [updatedRows] = await CodigoDescuento.update(req.body, {
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

		// Verificar destino aplicable
		if (
			codigoEncontrado.destinosAplicables.length > 0 &&
			!codigoEncontrado.destinosAplicables.includes(destino)
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

		res.json({ valido: true, codigo: codigoEncontrado });
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

// --- INICIALIZAR SERVIDOR ---
const PORT = process.env.PORT || 3001;

const startServer = async () => {
	await initializeDatabase();

	app.listen(PORT, () => {
		console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
		console.log(`📊 Base de datos MySQL conectada`);
	});
};

startServer().catch((error) => {
	console.error("❌ Error iniciando servidor:", error);
	process.exit(1);
});
