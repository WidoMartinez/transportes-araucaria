// backend/server.js
import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { MercadoPagoConfig, Preference } from "mercadopago";
import axios from "axios";
import crypto from "crypto";

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

// --- ENDPOINT PARA CREAR PAGOS ---
app.post("/create-payment", async (req, res) => {
	const { gateway, amount, description } = req.body;

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
		};

		try {
			const preference = new Preference(client);
			const result = await preference.create({ body: preferenceData });
			res.json({ url: result.init_point });
		} catch (error) {
			console.error("Error al crear preferencia de Mercado Pago:", error);
			res
				.status(500)
				.json({ message: "Error al generar el pago con Mercado Pago." });
		}
	} else if (gateway === "flow") {
		// --- LÍNEAS DE DEPURACIÓN ---
		console.log("Verificando API Key:", process.env.FLOW_API_KEY);
		console.log("Verificando Secret Key:", process.env.FLOW_SECRET_KEY); // <-- AÑADE ESTA LÍNEA
		// ---------------------------
		const flowApiUrl = process.env.FLOW_API_URL || "https://www.flow.cl/api";

		const params = {
			apiKey: process.env.FLOW_API_KEY,
			commerceOrder: `ORDEN-${Date.now()}`,
			subject: description,
			currency: "CLP",
			amount: amount,
			email: "cliente@example.com", // Puedes obtenerlo del formulario si lo necesitas
			urlConfirmation: `${process.env.YOUR_BACKEND_URL}/flow-confirmation`,
			urlReturn: `${process.env.YOUR_FRONTEND_URL}/flow-return`,
		};

		// Firmar los parámetros
		params.s = signParams(params);

		// Log para depuración final
		console.log("Parámetros finales enviados a Flow:", params);

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

// --- ENDPOINT PARA ENVÍO DE CORREO ---
app.post("/send-email", async (req, res) => {
	console.log("✅ Petición recibida en /send-email");
	console.log("✅ Datos recibidos:", req.body);

	const {
		nombre,
		email,
		telefono,
		source,
		mensaje,
		origen,
		destino,
		fecha,
		hora,
		pasajeros,
		precio,
		vehiculo,
	} = req.body;

	const transporter = nodemailer.createTransport({
		host: process.env.EMAIL_HOST,
		port: parseInt(process.env.EMAIL_PORT, 10),
		secure: process.env.EMAIL_PORT == 465,
		auth: {
			user: process.env.EMAIL_USER,
			pass: process.env.EMAIL_PASS,
		},
		connectionTimeout: 15000,
		socketTimeout: 15000,
	});

	const emailSubject = `Nueva Cotización de Transfer: ${
		destino || "Destino no especificado"
	}`;
	const formattedPrice = precio
		? `$${new Intl.NumberFormat("es-CL").format(precio)} CLP`
		: "A consultar";

	const emailHtml = `
        <div style="font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 20px auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #003366; color: white; padding: 20px; text-align: center;">
                <h1 style="margin: 0; font-size: 24px;">Nueva Solicitud de Cotización</h1>
                <p style="margin: 5px 0 0; color: #b3cde0;">Recibida desde: ${
									source || "Sitio Web"
								}</p>
            </div>
            
            <div style="padding: 20px;">
                <div style="background-color: #e0f2fe; border: 2px solid #3b82f6; padding: 15px; border-radius: 8px; text-align: center; margin-bottom: 25px;">
                    <h2 style="margin: 0 0 10px; font-size: 20px; color: #1e3a8a;">Resumen de la Cotización</h2>
                    <p style="margin: 5px 0; font-size: 18px;"><strong>Valor del Viaje:</strong> <span style="font-size: 22px; font-weight: bold; color: #1e3a8a;">${formattedPrice}</span></p>
                    <p style="margin: 5px 0; font-size: 16px;"><strong>Vehículo Sugerido:</strong> ${
											vehiculo || "No asignado"
										}</p>
                </div>

                <h2 style="border-bottom: 2px solid #eee; padding-bottom: 10px; color: #003366; font-size: 20px;">Detalles del Viaje</h2>
                <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                    <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px; font-weight: bold;">Origen:</td><td style="padding: 8px;">${
											origen || "No especificado"
										}</td></tr>
                    <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px; font-weight: bold;">Destino:</td><td style="padding: 8px;">${
											destino || "No especificado"
										}</td></tr>
                    <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px; font-weight: bold;">Fecha:</td><td style="padding: 8px;">${
											fecha || "No especificada"
										}</td></tr>
                    <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px; font-weight: bold;">Hora:</td><td style="padding: 8px;">${
											hora || "No especificada"
										}</td></tr>
                    <tr><td style="padding: 8px; font-weight: bold;">Nº de Pasajeros:</td><td style="padding: 8px;">${
											pasajeros || "No especificado"
										}</td></tr>
                </table>

                <h2 style="border-bottom: 2px solid #eee; padding-bottom: 10px; color: #003366; font-size: 20px; margin-top: 25px;">Información del Cliente</h2>
                <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                    <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px; font-weight: bold;">Nombre:</td><td style="padding: 8px;">${
											nombre || "No especificado"
										}</td></tr>
                    <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px; font-weight: bold;">Teléfono:</td><td style="padding: 8px;"><a href="tel:${telefono}" style="color: #3b82f6;">${
		telefono || "No especificado"
	}</a></td></tr>
                    <tr><td style="padding: 8px; font-weight: bold;">Email:</td><td style="padding: 8px;"><a href="mailto:${email}" style="color: #3b82f6;">${
		email || "No especificado"
	}</a></td></tr>
                </table>

                ${
									mensaje
										? `<h2 style="border-bottom: 2px solid #eee; padding-bottom: 10px; color: #003366; font-size: 20px; margin-top: 25px;">Mensaje Adicional</h2><div style="background-color: #f8f9fa; border-left: 4px solid #ccc; padding: 15px; margin-top: 10px;"><p style="margin: 0; font-style: italic;">"${mensaje}"</p></div>`
										: ""
								}
            </div>
            <div style="background-color: #f1f5f9; padding: 15px; text-align: center; font-size: 12px; color: #64748b;">
                <p>Este correo fue enviado automáticamente desde el sitio web de Transportes Araucaria.</p>
            </div>
        </div>
    `;

	const mailOptions = {
		from: `"Notificación Sitio Web" <${process.env.EMAIL_USER}>`,
		to: process.env.EMAIL_TO,
		subject: emailSubject,
		html: emailHtml,
	};

	try {
		console.log("⏳ Intentando enviar el correo electrónico...");
		await transporter.sendMail(mailOptions);
		console.log("✅ Correo enviado exitosamente.");
		res.status(200).json({ message: "Mensaje enviado exitosamente." });
	} catch (error) {
		console.error("❌ Error al enviar el correo:", error);
		res.status(500).json({ message: "Error interno al enviar el correo." });
	}
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
	console.log(`✅ El servidor backend está corriendo en el puerto ${PORT}`);
});
