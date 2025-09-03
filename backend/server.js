// server.js
import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

app.post("/send-email", async (req, res) => {
	console.log("✅ Petición recibida en /send-email");
	console.log("✅ Datos recibidos:", req.body);

	const {
		// Campos comunes
		nombre,
		email,
		telefono,
		source,
		mensaje,
		// Campos de Transportes Araucaria
		origen,
		destino,
		fecha,
		hora,
		pasajeros,
		// Campos del formulario original (AnunciAds)
		website,
		calculatorData,
	} = req.body;

	// --- Validación ---
	// Valida campos básicos que ambos formularios deberían tener
	if (!nombre || !email || !telefono) {
		console.log("❌ Error: Faltan campos de contacto básicos.");
		return res
			.status(400)
			.json({ message: "El nombre, email y teléfono son obligatorios." });
	}

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

	let emailSubject = `Nuevo Contacto desde ${source || "Sitio Web"}`;
	let emailHtml;

	// --- Lógica para determinar el tipo de formulario ---
	const isTransportForm = origen && destino && fecha && hora;

	if (isTransportForm) {
		// --- PLANTILLA PARA TRANSPORTES ARAUCARIA ---
		emailSubject = `Nueva Cotización de Transfer: ${origen} a ${destino}`;
		emailHtml = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h1 style="color: #1e40af;">Nueva Solicitud de Cotización de Transfer</h1>
                <p><strong>Origen del Formulario:</strong> ${
									source || "Transportes Araucaria"
								}</p>
                
                <h2 style="border-bottom: 2px solid #1e40af; padding-bottom: 5px; color: #1e40af;">Detalles del Cliente</h2>
                <ul>
                    <li><strong>Nombre:</strong> ${nombre}</li>
                    <li><strong>Email:</strong> <a href="mailto:${email}">${email}</a></li>
                    <li><strong>Teléfono:</strong> <a href="tel:${telefono}">${telefono}</a></li>
                </ul>

                <h2 style="border-bottom: 2px solid #1e40af; padding-bottom: 5px; color: #1e40af;">Detalles del Viaje</h2>
                <ul>
                    <li><strong>Origen:</strong> ${origen}</li>
                    <li><strong>Destino:</strong> ${destino}</li>
                    <li><strong>Fecha:</strong> ${fecha}</li>
                    <li><strong>Hora:</strong> ${hora}</li>
                    <li><strong>Pasajeros:</strong> ${pasajeros}</li>
                </ul>

                ${
									mensaje
										? `
                <h2 style="border-bottom: 2px solid #1e40af; padding-bottom: 5px; color: #1e40af;">Mensaje Adicional</h2>
                <div style="background-color: #f8f9fa; border-left: 4px solid #ccc; padding: 10px; margin-top: 10px;">
                    <p style="margin: 0;">${mensaje}</p>
                </div>
                `
										: ""
								}

                <p style="margin-top: 20px; font-style: italic;">
                    Contactar al cliente para confirmar la cotización.
                </p>
            </div>
        `;
	} else {
		// --- PLANTILLA GENÉRICA PARA ANUNCIADS U OTROS ---
		let additionalDataHtml = "";
		if (calculatorData) {
			additionalDataHtml = `
                <h2>Detalles de la Calculadora:</h2>
                <ul>
                    <li><strong>Presupuesto Mensual:</strong> ${calculatorData.budget}</li>
                    <li><strong>Objetivos:</strong> ${calculatorData.goals}</li>
                </ul>`;
		} else if (mensaje) {
			additionalDataHtml = `<h2>Mensaje Adicional:</h2><pre>${mensaje}</pre>`;
		}

		emailHtml = `
            <h1>Nuevo Contacto desde ${source || "tu sitio web"}</h1>
            <p>Has recibido un nuevo mensaje a través de tu sitio web.</p>
            <h2>Detalles del Contacto:</h2>
            <ul>
                <li><strong>Nombre:</strong> ${nombre}</li>
                <li><strong>Email:</strong> ${email}</li>
                <li><strong>Teléfono:</strong> ${telefono}</li>
                ${
									website
										? `<li><strong>Sitio Web:</strong> <a href="${website}">${website}</a></li>`
										: ""
								}
            </ul>
            ${additionalDataHtml}
        `;
	}

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
