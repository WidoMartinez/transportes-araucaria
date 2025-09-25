/* eslint-env node */
// backend/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MercadoPagoConfig, Preference } from "mercadopago";
import axios from "axios";
import crypto from "crypto";
import process from "process";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, "data");
const dataFilePath = path.join(dataDir, "database.json");

const defaultData = {
        destinations: [
                {
                        id: crypto.randomUUID(),
                        name: "Temuco",
                        description: "Centro comercial y administrativo de La Araucanía.",
                        travelTime: "45 min",
                        maxPassengers: 4,
                        minAdvanceHours: 5,
                        image: "/assets/temuco.jpg",
                        vehicles: {
                                auto: {
                                        label: "Auto Privado",
                                        basePrice: 20000,
                                        additionalPassengerPercentage: 0.1,
                                        includedPassengers: 1,
                                },
                        },
                },
                {
                        id: crypto.randomUUID(),
                        name: "Villarrica",
                        description: "Turismo y naturaleza junto al lago.",
                        travelTime: "1h 15min",
                        maxPassengers: 7,
                        minAdvanceHours: 5,
                        image: "/assets/villarrica.jpg",
                        vehicles: {
                                auto: {
                                        label: "Auto Privado",
                                        basePrice: 55000,
                                        additionalPassengerPercentage: 0.05,
                                        includedPassengers: 1,
                                },
                                van: {
                                        label: "Van de Pasajeros",
                                        basePrice: 200000,
                                        additionalPassengerPercentage: 0.05,
                                        includedPassengers: 5,
                                },
                        },
                },
                {
                        id: crypto.randomUUID(),
                        name: "Pucón",
                        description: "Aventura, termas y volcán.",
                        travelTime: "1h 30min",
                        maxPassengers: 7,
                        minAdvanceHours: 5,
                        image: "/assets/pucon.jpg",
                        vehicles: {
                                auto: {
                                        label: "Auto Privado",
                                        basePrice: 60000,
                                        additionalPassengerPercentage: 0.05,
                                        includedPassengers: 1,
                                },
                                van: {
                                        label: "Van de Pasajeros",
                                        basePrice: 250000,
                                        additionalPassengerPercentage: 0.05,
                                        includedPassengers: 5,
                                },
                        },
                },
        ],
        promotions: [],
};

async function ensureDataFile() {
        try {
                await fs.access(dataFilePath);
        } catch {
                await fs.mkdir(dataDir, { recursive: true });
                await fs.writeFile(dataFilePath, JSON.stringify(defaultData, null, 2), "utf-8");
        }
}

async function readData() {
        await ensureDataFile();
        const raw = await fs.readFile(dataFilePath, "utf-8");
        return JSON.parse(raw);
}

async function writeData(data) {
        await fs.writeFile(dataFilePath, JSON.stringify(data, null, 2), "utf-8");
}

function validateVehicle(vehicle) {
        if (!vehicle) return false;
        const { label, basePrice, additionalPassengerPercentage, includedPassengers } = vehicle;
        if (!label || typeof label !== "string") return false;
        if (typeof basePrice !== "number" || basePrice < 0) return false;
        if (
                typeof additionalPassengerPercentage !== "number" ||
                additionalPassengerPercentage < 0 ||
                additionalPassengerPercentage > 1
        ) {
                return false;
        }
        if (
                typeof includedPassengers !== "number" ||
                includedPassengers < 1 ||
                !Number.isInteger(includedPassengers)
        ) {
                return false;
        }
        return true;
}

function validateDestination(payload, { partial = false } = {}) {
        const errors = [];
        if (!partial || payload.name !== undefined) {
                if (!payload.name || typeof payload.name !== "string") {
                        errors.push("El nombre del destino es obligatorio.");
                }
        }
        if (!partial || payload.description !== undefined) {
                if (!payload.description || typeof payload.description !== "string") {
                        errors.push("La descripción es obligatoria.");
                }
        }
        if (!partial || payload.travelTime !== undefined) {
                if (!payload.travelTime || typeof payload.travelTime !== "string") {
                        errors.push("El tiempo de viaje es obligatorio.");
                }
        }
        if (!partial || payload.maxPassengers !== undefined) {
                if (
                        typeof payload.maxPassengers !== "number" ||
                        payload.maxPassengers < 1 ||
                        !Number.isInteger(payload.maxPassengers)
                ) {
                        errors.push("El número máximo de pasajeros debe ser un número entero positivo.");
                }
        }
        if (!partial || payload.minAdvanceHours !== undefined) {
                if (
                        typeof payload.minAdvanceHours !== "number" ||
                        payload.minAdvanceHours < 0 ||
                        !Number.isInteger(payload.minAdvanceHours)
                ) {
                        errors.push("Las horas mínimas de anticipación deben ser un número entero no negativo.");
                }
        }
        if (!partial || payload.vehicles !== undefined) {
                if (typeof payload.vehicles !== "object" || Array.isArray(payload.vehicles)) {
                        errors.push("Debes proporcionar un objeto de vehículos.");
                } else {
                        Object.entries(payload.vehicles).forEach(([key, vehicle]) => {
                                if (!validateVehicle(vehicle)) {
                                        errors.push(
                                                `La configuración del vehículo '${key}' no es válida. Revísala e inténtalo nuevamente.`
                                        );
                                }
                        });
                }
        }
        return errors;
}

function validatePromotion(payload, { partial = false } = {}) {
        const errors = [];
        if (!partial || payload.title !== undefined) {
                if (!payload.title || typeof payload.title !== "string") {
                        errors.push("El título de la promoción es obligatorio.");
                }
        }
        if (!partial || payload.description !== undefined) {
                if (!payload.description || typeof payload.description !== "string") {
                        errors.push("La descripción de la promoción es obligatoria.");
                }
        }
        if (!partial || payload.discountPercentage !== undefined) {
                if (
                        typeof payload.discountPercentage !== "number" ||
                        payload.discountPercentage < 0 ||
                        payload.discountPercentage > 100
                ) {
                        errors.push("El porcentaje de descuento debe estar entre 0 y 100.");
                }
        }
        if (!partial || payload.active !== undefined) {
                if (typeof payload.active !== "boolean") {
                        errors.push("El estado de la promoción debe ser verdadero o falso.");
                }
        }
        if (payload.appliesToDestinations !== undefined) {
                if (!Array.isArray(payload.appliesToDestinations)) {
                        errors.push("'appliesToDestinations' debe ser un arreglo de identificadores de destinos.");
                }
        }
        return errors;
}

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

// Middleware simple de logging para depuración
app.use((req, res, next) => {
        console.info(`${req.method} ${req.url}`);
        next();
});

// --- ENDPOINTS DE ADMINISTRACIÓN ---
app.get("/api/destinations", async (req, res) => {
        try {
                const data = await readData();
                res.json(data.destinations);
        } catch (error) {
                console.error("Error al leer destinos", error);
                res.status(500).json({ message: "No fue posible obtener los destinos." });
        }
});

app.post("/api/destinations", async (req, res) => {
        try {
                const payload = req.body;
                const errors = validateDestination(payload);
                if (errors.length > 0) {
                        return res.status(400).json({ message: "Datos inválidos", errors });
                }
                const data = await readData();
                const newDestination = {
                        id: crypto.randomUUID(),
                        name: payload.name,
                        description: payload.description,
                        travelTime: payload.travelTime,
                        maxPassengers: payload.maxPassengers,
                        minAdvanceHours: payload.minAdvanceHours,
                        image: payload.image || null,
                        vehicles: payload.vehicles,
                };
                data.destinations.push(newDestination);
                await writeData(data);
                res.status(201).json(newDestination);
        } catch (error) {
                console.error("Error al crear destino", error);
                res.status(500).json({ message: "No fue posible crear el destino." });
        }
});

app.put("/api/destinations/:id", async (req, res) => {
        try {
                const payload = req.body;
                const errors = validateDestination(payload, { partial: true });
                if (errors.length > 0) {
                        return res.status(400).json({ message: "Datos inválidos", errors });
                }
                const data = await readData();
                const destinationIndex = data.destinations.findIndex((d) => d.id === req.params.id);
                if (destinationIndex === -1) {
                        return res.status(404).json({ message: "Destino no encontrado." });
                }
                const destination = data.destinations[destinationIndex];
                data.destinations[destinationIndex] = {
                        ...destination,
                        ...payload,
                        vehicles: payload.vehicles || destination.vehicles,
                };
                await writeData(data);
                res.json(data.destinations[destinationIndex]);
        } catch (error) {
                console.error("Error al actualizar destino", error);
                res.status(500).json({ message: "No fue posible actualizar el destino." });
        }
});

app.delete("/api/destinations/:id", async (req, res) => {
        try {
                const data = await readData();
                const destinationIndex = data.destinations.findIndex((d) => d.id === req.params.id);
                if (destinationIndex === -1) {
                        return res.status(404).json({ message: "Destino no encontrado." });
                }
                const [removed] = data.destinations.splice(destinationIndex, 1);
                // Eliminar el destino de promociones que lo utilicen
                data.promotions = data.promotions.map((promo) => ({
                        ...promo,
                        appliesToDestinations: Array.isArray(promo.appliesToDestinations)
                                ? promo.appliesToDestinations.filter((destId) => destId !== removed.id)
                                : promo.appliesToDestinations,
                }));
                await writeData(data);
                res.json({ message: "Destino eliminado correctamente." });
        } catch (error) {
                console.error("Error al eliminar destino", error);
                res.status(500).json({ message: "No fue posible eliminar el destino." });
        }
});

app.get("/api/promotions", async (req, res) => {
        try {
                const data = await readData();
                res.json(data.promotions);
        } catch (error) {
                console.error("Error al leer promociones", error);
                res.status(500).json({ message: "No fue posible obtener las promociones." });
        }
});

app.post("/api/promotions", async (req, res) => {
        try {
                const payload = req.body;
                const errors = validatePromotion(payload);
                if (errors.length > 0) {
                        return res.status(400).json({ message: "Datos inválidos", errors });
                }
                const data = await readData();

                const invalidDestinations = (payload.appliesToDestinations || []).filter(
                        (destId) => !data.destinations.find((dest) => dest.id === destId)
                );
                if (invalidDestinations.length > 0) {
                        return res.status(400).json({
                                message: "Existen destinos no válidos en la promoción.",
                                errors: [
                                        `Los siguientes destinos no existen: ${invalidDestinations.join(", ")}.`,
                                ],
                        });
                }

                const newPromotion = {
                        id: crypto.randomUUID(),
                        title: payload.title,
                        description: payload.description,
                        discountPercentage: payload.discountPercentage,
                        active: payload.active ?? true,
                        appliesToDestinations: payload.appliesToDestinations || null,
                        startsAt: payload.startsAt || null,
                        endsAt: payload.endsAt || null,
                };

                data.promotions.push(newPromotion);
                await writeData(data);
                res.status(201).json(newPromotion);
        } catch (error) {
                console.error("Error al crear promoción", error);
                res.status(500).json({ message: "No fue posible crear la promoción." });
        }
});

app.put("/api/promotions/:id", async (req, res) => {
        try {
                const payload = req.body;
                const errors = validatePromotion(payload, { partial: true });
                if (errors.length > 0) {
                        return res.status(400).json({ message: "Datos inválidos", errors });
                }
                const data = await readData();
                const promotionIndex = data.promotions.findIndex((p) => p.id === req.params.id);
                if (promotionIndex === -1) {
                        return res.status(404).json({ message: "Promoción no encontrada." });
                }

                if (payload.appliesToDestinations) {
                        const invalidDestinations = payload.appliesToDestinations.filter(
                                (destId) => !data.destinations.find((dest) => dest.id === destId)
                        );
                        if (invalidDestinations.length > 0) {
                                return res.status(400).json({
                                        message: "Existen destinos no válidos en la promoción.",
                                        errors: [
                                                `Los siguientes destinos no existen: ${invalidDestinations.join(", ")}.`,
                                        ],
                                });
                        }
                }

                const promotion = data.promotions[promotionIndex];
                data.promotions[promotionIndex] = {
                        ...promotion,
                        ...payload,
                };

                await writeData(data);
                res.json(data.promotions[promotionIndex]);
        } catch (error) {
                console.error("Error al actualizar promoción", error);
                res.status(500).json({ message: "No fue posible actualizar la promoción." });
        }
});

app.delete("/api/promotions/:id", async (req, res) => {
        try {
                const data = await readData();
                const promotionIndex = data.promotions.findIndex((p) => p.id === req.params.id);
                if (promotionIndex === -1) {
                        return res.status(404).json({ message: "Promoción no encontrada." });
                }
                data.promotions.splice(promotionIndex, 1);
                await writeData(data);
                res.json({ message: "Promoción eliminada correctamente." });
        } catch (error) {
                console.error("Error al eliminar promoción", error);
                res.status(500).json({ message: "No fue posible eliminar la promoción." });
        }
});

// --- ENDPOINT PARA CREAR PAGOS ---
app.post("/create-payment", async (req, res) => {
        const { gateway, amount, description, email } = req.body;

        if (!gateway || !amount || !description || !email) {
                return res.status(400).json({
                        message: "Faltan parámetros requeridos: gateway, amount, description, email.",
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
                        res.status(500).json({ message: "Error al generar el pago con Mercado Pago." });
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

// Middleware final para rutas no encontradas
app.use((req, res) => {
        res.status(404).json({ message: "Ruta no encontrada." });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, async () => {
        await ensureDataFile();
        console.log(`✅ El servidor de administración y pagos está corriendo en el puerto ${PORT}`);
});
