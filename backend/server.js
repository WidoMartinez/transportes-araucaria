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
	const { destinos, dayPromotions } = req.body || {};

	// Validación robusta para la nueva estructura
	if (!Array.isArray(destinos) || !Array.isArray(dayPromotions)) {
		return res.status(400).json({
			message:
				"La estructura de datos enviada es incorrecta. Se esperaba un objeto con 'destinos' y 'dayPromotions'.",
		});
	}

	try {
		const savedData = await writePricingData({ destinos, dayPromotions });
		res.json(savedData);
	} catch (error) {
		console.error("Error al guardar la configuración de precios:", error);
		res.status(500).json({
			message: "No se pudo guardar la configuración de precios.",
		});
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
