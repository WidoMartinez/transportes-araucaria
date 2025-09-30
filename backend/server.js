/* eslint-env node */
/* global process */
// backend/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MercadoPagoConfig, Preference } from "mercadopago";
import axios from "axios";
import crypto from "crypto";
import { access, mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, "data");
const PRICING_FILE_PATH = path.join(DATA_DIR, "pricing.json");

const defaultPricing = {
	destinos: [], // Nueva estructura para almacenar las tarifas por destino
	dayPromotions: [],
	descuentosGlobales: {
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
	},
	updatedAt: new Date().toISOString(),
};

const ensurePricingFile = async () => {
	try {
		await access(PRICING_FILE_PATH);
	} catch {
		await mkdir(DATA_DIR, { recursive: true });
		await writeFile(
			PRICING_FILE_PATH,
			JSON.stringify(defaultPricing, null, 2),
			"utf-8"
		);
	}
};

const readPricingData = async () => {
	await ensurePricingFile();
	const fileContents = await readFile(PRICING_FILE_PATH, "utf-8");
	try {
		return JSON.parse(fileContents);
	} catch (error) {
		console.error(
			"No se pudo parsear pricing.json, usando valores por defecto.",
			error
		);
		return { ...defaultPricing, updatedAt: new Date().toISOString() };
	}
};

const writePricingData = async (data) => {
	await mkdir(DATA_DIR, { recursive: true });
	const payload = {
		...data,
		updatedAt: new Date().toISOString(),
	};
	await writeFile(PRICING_FILE_PATH, JSON.stringify(payload, null, 2), "utf-8");
	return payload;
};

app.get("/pricing", async (req, res) => {
	try {
		const pricing = await readPricingData();
		res.json(pricing);
	} catch (error) {
		console.error("Error al obtener la información de precios:", error);
		res.status(500).json({
			message: "No se pudo obtener la configuración de precios.",
		});
	}
});

// Endpoint PUT actualizado para manejar la nueva estructura de datos
app.put("/pricing", async (req, res) => {
	const { destinos, dayPromotions, descuentosGlobales } = req.body || {};

	// Validación robusta para la nueva estructura
	if (!Array.isArray(destinos) || !Array.isArray(dayPromotions)) {
		return res.status(400).json({
			message:
				"La estructura de datos enviada es incorrecta. Se esperaba un objeto con 'destinos' y 'dayPromotions'.",
		});
	}

	try {
		const dataToSave = {
			destinos,
			dayPromotions,
			descuentosGlobales: descuentosGlobales || {
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
			},
		};
		const savedData = await writePricingData(dataToSave);
		res.json(savedData);
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
		const pricing = await readPricingData();
		const codigos = pricing.codigosDescuento || [];
		res.json(codigos);
	} catch (error) {
		console.error("Error leyendo códigos:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

app.post("/api/codigos", async (req, res) => {
	try {
		const pricing = await readPricingData();
		const nuevoCodigo = {
			...req.body,
			id: req.body.codigo,
			usosActuales: 0,
			fechaCreacion: new Date().toISOString().split("T")[0],
			creadoPor: "admin",
		};

		if (!pricing.codigosDescuento) {
			pricing.codigosDescuento = [];
		}

		pricing.codigosDescuento.push(nuevoCodigo);
		await writePricingData(pricing);

		res.json(nuevoCodigo);
	} catch (error) {
		console.error("Error creando código:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

app.put("/api/codigos/:id", async (req, res) => {
	try {
		const pricing = await readPricingData();
		const codigoIndex = pricing.codigosDescuento.findIndex(
			(c) => c.id === req.params.id
		);

		if (codigoIndex === -1) {
			return res.status(404).json({ error: "Código no encontrado" });
		}

		pricing.codigosDescuento[codigoIndex] = {
			...pricing.codigosDescuento[codigoIndex],
			...req.body,
			id: req.params.id,
		};

		await writePricingData(pricing);
		res.json(pricing.codigosDescuento[codigoIndex]);
	} catch (error) {
		console.error("Error actualizando código:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

app.delete("/api/codigos/:id", async (req, res) => {
	try {
		const pricing = await readPricingData();
		pricing.codigosDescuento = pricing.codigosDescuento.filter(
			(c) => c.id !== req.params.id
		);

		await writePricingData(pricing);
		res.json({ success: true });
	} catch (error) {
		console.error("Error eliminando código:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// Endpoint para validar código de descuento
app.post("/api/codigos/validar", async (req, res) => {
	try {
		const { codigo, destino, monto, usuarioId } = req.body;
		const pricing = await readPricingData();
		const codigos = pricing.codigosDescuento || [];

		const codigoEncontrado = codigos.find(
			(c) => c.codigo === codigo && c.activo && c.usosActuales < c.limiteUsos
		);

		if (!codigoEncontrado) {
			return res.json({ valido: false, error: "Código no válido o agotado" });
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
		const pricing = await readPricingData();
		const codigos = pricing.codigosDescuento || [];

		const codigoIndex = codigos.findIndex((c) => c.codigo === codigo);
		if (codigoIndex === -1) {
			return res.status(404).json({ error: "Código no encontrado" });
		}

		const codigoEncontrado = codigos[codigoIndex];

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

		// Registrar el uso
		codigos[codigoIndex].usosActuales += 1;
		if (usuarioId) {
			if (!codigos[codigoIndex].usuariosQueUsaron) {
				codigos[codigoIndex].usuariosQueUsaron = [];
			}
			codigos[codigoIndex].usuariosQueUsaron.push(usuarioId);
		}

		// Guardar los cambios
		pricing.codigosDescuento = codigos;
		await writePricingData(pricing);

		res.json({
			exito: true,
			usosActuales: codigos[codigoIndex].usosActuales,
			usuariosQueUsaron: codigos[codigoIndex].usuariosQueUsaron,
		});
	} catch (error) {
		console.error("Error registrando uso del código:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// Endpoint para eliminar un usuario específico de un código
app.delete("/api/codigos/:codigoId/usuarios/:usuarioId", async (req, res) => {
	try {
		const { codigoId, usuarioId } = req.params;
		const pricing = await readPricingData();
		const codigos = pricing.codigosDescuento || [];

		const codigoIndex = codigos.findIndex((c) => c.id === codigoId);
		if (codigoIndex === -1) {
			return res.status(404).json({ error: "Código no encontrado" });
		}

		const codigo = codigos[codigoIndex];

		// Verificar si el usuario existe en la lista
		if (
			!codigo.usuariosQueUsaron ||
			!codigo.usuariosQueUsaron.includes(usuarioId)
		) {
			return res
				.status(404)
				.json({ error: "Usuario no encontrado en este código" });
		}

		// Eliminar el usuario de la lista
		codigos[codigoIndex].usuariosQueUsaron = codigos[
			codigoIndex
		].usuariosQueUsaron.filter((uid) => uid !== usuarioId);

		// Reducir el contador de usos
		if (codigos[codigoIndex].usosActuales > 0) {
			codigos[codigoIndex].usosActuales -= 1;
		}

		// Guardar los cambios
		pricing.codigosDescuento = codigos;
		await writePricingData(pricing);

		res.json({
			exito: true,
			usosActuales: codigos[codigoIndex].usosActuales,
			usuariosQueUsaron: codigos[codigoIndex].usuariosQueUsaron,
		});
	} catch (error) {
		console.error("Error eliminando usuario del código:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// --- ENDPOINT PARA CREAR PAGOS (sin cambios) ---
app.post("/create-payment", async (req, res) => {
	const { gateway, amount, description, email } = req.body;

	if (!gateway || !amount || !description || !email) {
		return res.status(400).json({
			message:
				"Faltan parámetros requeridos: gateway, amount, description, email.",
		});
	}

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
				success: "https://www.transportesaraucaria.cl/pago-exitoso",
				failure: "https://www.transportesaraucaria.cl/pago-fallido",
				pending: "https://www.transportesaraucaria.cl/pago-pendiente",
			},
			auto_return: "approved",
			payer: {
				email: email,
			},
		};

		try {
			const preference = new Preference(client);
			const result = await preference.create({ body: preferenceData });
			res.json({ url: result.init_point });
		} catch (error) {
			console.error(
				"Error al crear preferencia de Mercado Pago:",
				error.response ? error.response.data : error.message
			);
			res
				.status(500)
				.json({ message: "Error al generar el pago con Mercado Pago." });
		}
	} else if (gateway === "flow") {
		const flowApiUrl = process.env.FLOW_API_URL || "https://www.flow.cl/api";

		const params = {
			apiKey: process.env.FLOW_API_KEY,
			commerceOrder: `ORDEN-${Date.now()}`,
			subject: description,
			currency: "CLP",
			amount: amount,
			email: email,
			urlConfirmation: `${process.env.YOUR_BACKEND_URL}/flow-confirmation`,
			urlReturn: `${process.env.YOUR_FRONTEND_URL}/flow-return`,
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
				throw new Error("Respuesta inválida desde Flow");
			}
			const redirectUrl = `${payment.url}?token=${payment.token}`;
			res.json({ url: redirectUrl });
		} catch (error) {
			console.error(
				"Error al crear el pago con Flow:",
				error.response ? error.response.data : error.message
			);
			res.status(500).json({ message: "Error al generar el pago con Flow." });
		}
	} else {
		res.status(400).json({ message: "Pasarela de pago no válida." });
	}
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
	console.log(`✅ El servidor de pagos está corriendo en el puerto ${PORT}`);
});
