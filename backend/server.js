/* eslint-env node */
// backend/server.js
import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import axios from "axios";
import crypto from "crypto";

dotenv.config();

// --- CONFIGURACIÓN DE MERCADO PAGO ---
const client = new MercadoPagoConfig({
        accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
});
const paymentClient = new Payment(client);

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
		const flowApiUrl =
			process.env.FLOW_API_URL || "https://sandbox.flow.cl/api";

		const params = {
			apiKey: process.env.FLOW_API_KEY,
			commerceOrder: `ORDEN-${Date.now()}`,
			subject: description,
			currency: "CLP",
			amount: amount,
			email: "contacto@transportesaraucaria.cl", // <-- ÚNICO CAMBIO AQUÍ
			urlConfirmation: `${process.env.YOUR_BACKEND_URL}/flow-confirmation`,
			urlReturn: `${process.env.YOUR_FRONTEND_URL}/flow-return`,
		};

		// Firmar los parámetros
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

app.post("/process-payment", async (req, res) => {
        const {
                token,
                amount,
                description,
                installments,
                paymentMethodId,
                issuerId,
                email,
                identification,
                metadata,
        } = req.body;

        if (!token || !amount || !paymentMethodId) {
                return res
                        .status(400)
                        .json({ message: "Faltan datos obligatorios para procesar el pago." });
        }

        const transactionAmount = Number(amount);
        if (Number.isNaN(transactionAmount) || transactionAmount <= 0) {
                return res.status(400).json({ message: "Monto de pago inválido." });
        }

        try {
                const paymentResponse = await paymentClient.create({
                        body: {
                                token,
                                transaction_amount: transactionAmount,
                                description: description || "Reserva Transportes Araucaria",
                                installments: installments || 1,
                                payment_method_id: paymentMethodId,
                                issuer_id: issuerId || undefined,
                                payer: {
                                        email: email || process.env.MERCADOPAGO_PAYER_EMAIL,
                                        identification,
                                },
                                metadata,
                                capture: true,
                                binary_mode: false,
                                statement_descriptor: "ARAUCA TRAVEL",
                                additional_info: {
                                        payer: {
                                                registration_date: new Date().toISOString(),
                                        },
                                },
                        },
                });

                res.json({
                        id: paymentResponse.id,
                        status: paymentResponse.status,
                        statusDetail: paymentResponse.status_detail,
                        receiptUrl:
                                paymentResponse.point_of_interaction?.transaction_data?.ticket_url ||
                                paymentResponse.transaction_details?.external_resource_url ||
                                null,
                });
        } catch (error) {
                console.error("Error al procesar el pago:", error);
                const message =
                        error?.message ||
                        error?.error?.message ||
                        error?.cause?.[0]?.description ||
                        "No se pudo procesar el pago.";
                res.status(500).json({ message });
        }
});

// ... (Tu endpoint /send-email se mantiene igual)
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
                extras = [],
                coupon = null,
                clubBenefit = null,
                pricing = null,
                payment = null,
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
        const formatCLP = (value) =>
                `$${new Intl.NumberFormat("es-CL").format(Math.round(Number(value) || 0))} CLP`;

        const totalPrice = pricing?.total ?? precio;
        const formattedPrice = totalPrice ? formatCLP(totalPrice) : "A consultar";
        const baseFareFormatted = pricing?.baseFare ? formatCLP(pricing.baseFare) : formatCLP(precio || 0);
        const extrasTotalFormatted = formatCLP(pricing?.extrasTotal || 0);
        const discountTotalFormatted = formatCLP(pricing?.totalDiscounts || 0);
        const taxesFormatted = formatCLP(pricing?.taxes || 0);

        const extrasListHtml =
                extras.length > 0
                        ? `<ul style="margin: 0; padding-left: 18px;">${extras
                                  .map(
                                          (extra) =>
                                                  `<li><strong>${extra.name || extra.descripcion || "Extra"}</strong> (${formatCLP(
                                                          extra.amount || extra.precio || 0
                                                  )})</li>`
                                  )
                                  .join("")}</ul>`
                        : '<p style="margin: 0;">Sin extras adicionales.</p>';

        const discountDetails = [];
        if (pricing?.onlineDiscountValue) {
                discountDetails.push(
                        `Descuento online ${Math.round((pricing.onlineDiscountRate || 0) * 100)}%: <strong>- ${formatCLP(
                                pricing.onlineDiscountValue
                        )}</strong>`
                );
        }
        if (pricing?.couponValue && coupon?.code) {
                discountDetails.push(
                        `Cupón ${coupon.code}: <strong>- ${formatCLP(pricing.couponValue)}</strong>`
                );
        }
        if (pricing?.clubBenefitValue && clubBenefit?.label) {
                discountDetails.push(
                        `${clubBenefit.label}: <strong>- ${formatCLP(pricing.clubBenefitValue)}</strong>`
                );
        }
        const discountsHtml = discountDetails.length
                ? `<ul style="margin: 0; padding-left: 18px;">${discountDetails
                          .map((line) => `<li>${line}</li>`)
                          .join("")}</ul>`
                : '<p style="margin: 0;">No se aplicaron descuentos adicionales.</p>';

        const paymentHtml =
                payment?.status === "succeeded"
                        ? `<div style="padding: 15px; background-color: #dcfce7; border: 1px solid #16a34a; border-radius: 8px; margin-top: 20px;">
                                <h3 style="margin: 0 0 10px; color: #166534;">Pago procesado en línea</h3>
                                <p style="margin: 0;"><strong>Método:</strong> ${payment.methodLabel || payment.method}</p>
                                <p style="margin: 4px 0;"><strong>Monto acreditado:</strong> ${formatCLP(payment.amount)}</p>
                                ${
                                        payment.mode === "deposit"
                                                ? `<p style="margin: 4px 0;"><strong>Saldo pendiente:</strong> ${formatCLP(
                                                          payment.balance
                                                  )}</p>`
                                                : ""
                                }
                                ${
                                        payment.receiptUrl
                                                ? `<p style="margin: 10px 0 0;"><a href="${payment.receiptUrl}" target="_blank" rel="noopener" style="color: #0f172a; font-weight: bold;">Ver comprobante de pago</a></p>`
                                                : ""
                                }
                        </div>`
                        : `<div style="padding: 15px; background-color: #fff7ed; border: 1px solid #f97316; border-radius: 8px; margin-top: 20px;">
                                <h3 style="margin: 0 0 10px; color: #c2410c;">Pago pendiente</h3>
                                <p style="margin: 0;">Puedes completar el abono online o coordinar con el equipo comercial.</p>
                        </div>`;

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
                    ${
                            payment?.status === "succeeded" && payment.mode === "deposit"
                                    ? `<p style="margin: 5px 0; font-size: 14px;"><strong>Saldo pendiente:</strong> ${formatCLP(
                                              payment.balance
                                      )}</p>`
                                    : ""
                    }
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

                <h2 style="border-bottom: 2px solid #eee; padding-bottom: 10px; color: #003366; font-size: 20px; margin-top: 25px;">Resumen Económico</h2>
                <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                    <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px; font-weight: bold;">Tarifa base</td><td style="padding: 8px;">${baseFareFormatted}</td></tr>
                    <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px; font-weight: bold;">Extras</td><td style="padding: 8px;">${extrasTotalFormatted}</td></tr>
                    <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px; font-weight: bold;">Descuentos</td><td style="padding: 8px;">-${discountTotalFormatted}</td></tr>
                    <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px; font-weight: bold;">Impuestos</td><td style="padding: 8px;">${taxesFormatted}</td></tr>
                    <tr><td style="padding: 8px; font-weight: bold;">Total confirmado</td><td style="padding: 8px; font-size: 16px; font-weight: bold; color: #0f172a;">${formattedPrice}</td></tr>
                </table>

                <div style="background-color: #f8fafc; border: 1px solid #cbd5f5; padding: 15px; border-radius: 8px; margin-top: 15px;">
                    <h3 style="margin: 0 0 8px; color: #1e3a8a;">Detalle de descuentos y beneficios</h3>
                    ${discountsHtml}
                </div>

                <div style="background-color: #f8fafc; border: 1px solid #cbd5f5; padding: 15px; border-radius: 8px; margin-top: 15px;">
                    <h3 style="margin: 0 0 8px; color: #1e3a8a;">Extras confirmados</h3>
                    ${extrasListHtml}
                </div>

                ${paymentHtml}

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
