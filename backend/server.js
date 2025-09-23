// backend/server.js
import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import axios from "axios";
import crypto from "crypto";
import mongoose from "mongoose";

import connectToDatabase from "./config/database.js";
import Booking from "./models/Booking.js";
import logger from "./utils/logger.js";
import { checkAvailability } from "./services/availabilityService.js";
import { enqueueInternalTask } from "./services/taskQueue.js";


dotenv.config();

const client = new MercadoPagoConfig({
        accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || "",
});
const paymentClient = process.env.MERCADOPAGO_ACCESS_TOKEN
        ? new Payment(client)
        : null;

const FLOW_STATUS_MAP = {
        1: "pending",
        2: "approved",
        3: "rejected",
        4: "cancelled",
};

connectToDatabase().catch((error) => {
        logger.error({ error }, "No fue posible conectar con la base de datos");
        process.exit(1);
});

const signParams = (params) => {
        const secretKey = process.env.FLOW_SECRET_KEY;
        if (!secretKey) {
                throw new Error("FLOW_SECRET_KEY no configurada");
        }
        const sortedKeys = Object.keys(params).sort();
        let toSign = "";
        sortedKeys.forEach((key) => {
                toSign += key + params[key];
        });
        return crypto.createHmac("sha256", secretKey).update(toSign).digest("hex");
};

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
        logger.info({ method: req.method, url: req.originalUrl }, "Solicitud entrante");
        next();
});

const calculateTotals = ({ totals = {}, extras = [], discounts = [] }) => {
        const baseAmount = Number(totals.baseAmount ?? 0);
        const extrasAmount = extras.reduce((acc, extra) => {
                const quantity = Number(extra.quantity || 1);
                const price = Number(extra.price || 0);
                return acc + quantity * price;
        }, 0);
        const discountAmount = discounts.reduce(
                (acc, discount) => acc + Number(discount.amount || 0),
                Number(totals.discountAmount || 0)
        );
        const grandTotal =
                totals.grandTotal !== undefined
                        ? Number(totals.grandTotal)
                        : baseAmount + extrasAmount - discountAmount;

        return {
                baseAmount,
                extrasAmount,
                discountAmount,
                grandTotal: grandTotal < 0 ? 0 : grandTotal,
                currency: totals.currency || "CLP",
        };
};

const captureBookingSnapshot = (bookingDoc) =>
        bookingDoc.toObject({ virtuals: true, versionKey: false });

const queueBookingAutomations = (bookingSnapshot, options = {}) => {
        if (!bookingSnapshot) {
                return;
        }
        const payload = { booking: bookingSnapshot };
        if (options.sync !== false) {
                enqueueInternalTask("SYNC_OPERATIONS", payload);
                enqueueInternalTask("SYNC_CRM", payload);
        }
        if (options.paymentUpdate) {
                enqueueInternalTask("SEND_PAYMENT_UPDATE", payload);
        }
        if (options.sendVoucher) {
                enqueueInternalTask("SEND_VOUCHER", payload);
        }
        if (options.notifyDriver) {
                enqueueInternalTask("NOTIFY_DRIVER", payload);
        }
        if (options.reminder) {
                enqueueInternalTask("SEND_REMINDER", payload);
        }
};

const findBookingById = async (id) => {
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
                return null;
        }
        return Booking.findById(id);
};

const findBookingByIdentifier = async (identifier) => {
        if (!identifier) {
                return null;
        }
        const byId = await findBookingById(identifier);
        if (byId) {
                return byId;
        }
        return Booking.findOne({ reference: identifier });
};

const updateBookingPaymentStatus = async ({
        booking,
        paymentStatus,
        metadata,
        performedBy = "system",
        notes,
}) => {
        if (!booking) {
                return null;
        }

        const previousStatus = booking.paymentStatus;
        if (paymentStatus && previousStatus !== paymentStatus) {
                booking.paymentStatus = paymentStatus;
                booking.recordAudit("payment_status_updated", {
                        performedBy,
                        notes,
                        metadata: {
                                previousStatus,
                                newStatus: paymentStatus,
                                ...metadata,
                        },
                });
                booking.recordStatus(`payment:${paymentStatus}`, {
                        performedBy,
                        notes,
                });

                if (paymentStatus === "approved" && booking.lifecycleStatus !== "confirmed") {
                        booking.lifecycleStatus = "confirmed";
                        booking.recordStatus("confirmed", { performedBy });
                }

                if (paymentStatus === "cancelled") {
                        booking.lifecycleStatus = "cancelled";
                        booking.recordStatus("cancelled", { performedBy });
                }
        }

        if (metadata) {
                booking.metadata = {
                        ...(booking.metadata || {}),
                        payment: {
                                ...(booking.metadata?.payment || {}),
                                ...metadata,
                                lastUpdatedAt: new Date().toISOString(),
                        },
                };
        }

        await booking.save();
        const snapshot = captureBookingSnapshot(booking);

        queueBookingAutomations(snapshot, {
                paymentUpdate: true,
                notifyDriver: paymentStatus === "approved",
                sendVoucher: paymentStatus === "approved",
        });

        return snapshot;
};

app.post("/bookings/availability", async (req, res) => {
        try {
                const availability = await checkAvailability(req.body);
                const status = availability.available ? 200 : 409;
                res.status(status).json(availability);
        } catch (error) {
                logger.error({ error }, "Error validando disponibilidad");
                res.status(400).json({ message: error.message });
        }
});

app.post("/bookings", async (req, res) => {
        try {
                const {
                        trip,
                        extras = [],
                        passengers = [],
                        discounts = [],
                        contact = {},
                        assignedDriver,
                        totals = {},
                        notes,
                        metadata,
                        requestedBy,
                } = req.body;

                const availability = await checkAvailability(req.body);
                if (!availability.available) {
                        return res.status(409).json({
                                message: availability.reason,
                                details: availability.details,
                        });
                }

                const computedTotals = calculateTotals({ totals, extras, discounts });
                const booking = new Booking({
                        trip,
                        extras,
                        passengers,
                        discounts,
                        contact,
                        assignedDriver,
                        totals: computedTotals,
                        notes,
                        metadata,
                        lifecycleStatus: "pending",
                        paymentStatus: "pending",
                });
                booking.recordStatus("pending", {
                        performedBy: requestedBy || contact?.email || "cliente",
                        notes: "Reserva preliminar creada",
                });
                booking.recordAudit("booking_created", {
                        performedBy: requestedBy || contact?.email || "cliente",
                        metadata: { source: req.body.source },
                });

                await booking.save();
                const bookingSnapshot = captureBookingSnapshot(booking);

                queueBookingAutomations(bookingSnapshot, { paymentUpdate: false });

                res.status(201).json({ booking: bookingSnapshot, availability });
        } catch (error) {
                logger.error({ error }, "Error al crear la reserva");
                res.status(500).json({ message: "No fue posible crear la reserva" });
        }
});

app.patch("/bookings/:id/status", async (req, res) => {
        try {
                const booking = await findBookingById(req.params.id);
                if (!booking) {
                        return res.status(404).json({ message: "Reserva no encontrada" });
                }

                const {
                        paymentStatus,
                        lifecycleStatus,
                        assignedDriver,
                        notes,
                        metadata,
                        performedBy,
                        sendNotifications = true,
                        scheduleReminder,
                } = req.body;

                if (assignedDriver) {
                        booking.assignedDriver = assignedDriver;
                        booking.recordAudit("driver_assigned", {
                                performedBy: performedBy || "operaciones",
                                metadata: assignedDriver,
                        });
                }

                if (typeof notes === "string") {
                        booking.notes = notes;
                }

                if (lifecycleStatus && booking.lifecycleStatus !== lifecycleStatus) {
                        booking.lifecycleStatus = lifecycleStatus;
                        booking.recordStatus(lifecycleStatus, {
                                performedBy: performedBy || "operaciones",
                                notes,
                        });
                        booking.recordAudit("lifecycle_updated", {
                                performedBy: performedBy || "operaciones",
                                metadata: { lifecycleStatus },
                        });
                }

                let snapshot = captureBookingSnapshot(booking);
                if (paymentStatus) {
                        snapshot = await updateBookingPaymentStatus({
                                booking,
                                paymentStatus,
                                metadata,
                                performedBy: performedBy || "pasarela",
                                notes,
                        });
                } else {
                        await booking.save();
                        snapshot = captureBookingSnapshot(booking);
                }

                if (sendNotifications) {
                        queueBookingAutomations(snapshot, {
                                sync: !paymentStatus,
                                notifyDriver: Boolean(assignedDriver),
                                paymentUpdate: false,
                                sendVoucher: false,
                                reminder: scheduleReminder,
                        });
                }

                res.json({ booking: snapshot });
        } catch (error) {
                logger.error({ error }, "Error actualizando la reserva");
                res.status(500).json({ message: "No fue posible actualizar la reserva" });
        }
});

app.post("/bookings/:id/self-service", async (req, res) => {
        try {
                const booking = await findBookingById(req.params.id);
                if (!booking) {
                        return res.status(404).json({ message: "Reserva no encontrada" });
                }

                const { token, action, updates = {}, performedBy } = req.body;
                if (!token || token !== booking.selfServiceToken) {
                        return res.status(403).json({ message: "Token de autoservicio inválido" });
                }

                let availability;

                if (action === "modify") {
                        const allowedFields = ["trip", "extras", "passengers", "contact", "notes", "discounts"];
                        const modifications = {};
                        allowedFields.forEach((field) => {
                                if (updates[field] !== undefined) {
                                        modifications[field] = updates[field];
                                }
                        });

                        if (modifications.trip || modifications.passengers) {
                                availability = await checkAvailability({
                                        ...booking.toObject({ virtuals: false }),
                                        ...modifications,
                                        ignoreBookingId: booking._id,
                                });
                                if (!availability.available) {
                                        return res.status(409).json({
                                                message: availability.reason,
                                                details: availability.details,
                                        });
                                }
                        }

                        Object.assign(booking, modifications);
                        booking.totals = calculateTotals({
                                totals: updates.totals || booking.totals,
                                extras: booking.extras,
                                discounts: booking.discounts,
                        });
                        booking.recordAudit("self_service_modify", {
                                performedBy: performedBy || "cliente",
                                metadata: modifications,
                        });
                        booking.recordStatus("modificado_por_cliente", {
                                performedBy: performedBy || "cliente",
                        });
                } else if (action === "cancel") {
                        booking.lifecycleStatus = "cancelled";
                        booking.paymentStatus = booking.paymentStatus === "approved" ? "refunded" : "cancelled";
                        booking.recordAudit("self_service_cancel", {
                                performedBy: performedBy || "cliente",
                                metadata: updates,
                        });
                        booking.recordStatus("cancelled", {
                                performedBy: performedBy || "cliente",
                                notes: updates.notes,
                        });
                } else {
                        return res.status(400).json({ message: "Acción no soportada" });
                }

                await booking.save();
                const snapshot = captureBookingSnapshot(booking);

                queueBookingAutomations(snapshot, {
                        notifyDriver: action === "modify",
                        paymentUpdate: action === "cancel",
                });

                res.json({ booking: snapshot, availability });
        } catch (error) {
                logger.error({ error }, "Error en autoservicio de reserva");
                res.status(500).json({ message: "No fue posible procesar la solicitud" });
        }
});

app.post("/create-payment", async (req, res) => {
        const { gateway, description, bookingId } = req.body;
        let { amount } = req.body;

        try {
                let booking = null;
                if (bookingId) {
                        booking = await findBookingById(bookingId);
                        if (!booking) {
                                return res.status(404).json({ message: "Reserva no encontrada" });
                        }
                        if (amount === undefined) {
                                amount = booking.totals?.grandTotal || 0;
                        }
                        booking.recordAudit("payment_link_requested", {
                                performedBy: req.body.performedBy || booking.contact?.email || "cliente",
                                metadata: { gateway },
                        });
                }

                if (gateway === "mercadopago") {
                        const preferenceData = {
                                items: [
                                        {
                                                title: description || "Pago de reserva",
                                                unit_price: Number(amount),
                                                quantity: 1,
                                        },
                                ],
                                back_urls: {
                                        success:
                                                process.env.MERCADOPAGO_SUCCESS_URL ||
                                                "https://www.transportesaraucaria.cl/pago-exitoso",
                                        failure:
                                                process.env.MERCADOPAGO_FAILURE_URL ||
                                                "https://www.transportesaraucaria.cl/pago-fallido",
                                        pending:
                                                process.env.MERCADOPAGO_PENDING_URL ||
                                                "https://www.transportesaraucaria.cl/pago-pendiente",
                                },
                                auto_return: "approved",
                                external_reference: booking?.reference || `ORDEN-${Date.now()}`,
                                metadata: {
                                        bookingId: booking?._id?.toString(),
                                        reference: booking?.reference,
                                },
                        };

                        if (booking?.contact?.email) {
                                preferenceData.payer = {
                                        email: booking.contact.email,
                                        name: booking.contact.name,
                                };
                        }

                        const preference = new Preference(client);
                        const result = await preference.create({ body: preferenceData });

                        if (booking) {
                                booking.metadata = {
                                        ...(booking.metadata || {}),
                                        payment: {
                                                ...(booking.metadata?.payment || {}),
                                                lastIntent: {
                                                        gateway: "mercadopago",
                                                        preferenceId: result.id,
                                                        initPoint: result.init_point,
                                                        createdAt: new Date().toISOString(),
                                                },
                                        },
                                };
                                await booking.save();
                        }

                        return res.json({ url: result.init_point });
                }

                if (gateway === "flow") {
                        const flowApiUrl = process.env.FLOW_API_URL || "https://sandbox.flow.cl/api";
                        const orderReference = booking?.reference || `ORDEN-${Date.now()}`;

                        const params = {
                                apiKey: process.env.FLOW_API_KEY,
                                commerceOrder: orderReference,
                                subject: description || `Reserva ${orderReference}`,
                                currency: "CLP",
                                amount: Number(amount).toFixed(0),
                                email: booking?.contact?.email || "contacto@transportesaraucaria.cl",
                                urlConfirmation: `${process.env.YOUR_BACKEND_URL}/webhooks/flow`,
                                urlReturn: `${process.env.YOUR_FRONTEND_URL}/flow-return`,
                        };

                        params.s = signParams(params);

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

                        if (booking) {
                                booking.metadata = {
                                        ...(booking.metadata || {}),
                                        payment: {
                                                ...(booking.metadata?.payment || {}),
                                                lastIntent: {
                                                        gateway: "flow",
                                                        token: payment.token,
                                                        order: orderReference,
                                                        redirectUrl,
                                                        createdAt: new Date().toISOString(),
                                                },
                                        },
                                };
                                await booking.save();
                        }

                        return res.json({ url: redirectUrl });
                }

                return res.status(400).json({ message: "Pasarela de pago no válida" });
        } catch (error) {
                logger.error({ error }, "Error al generar el pago");
                res.status(500).json({ message: "No fue posible generar el pago" });
        }
});

app.post("/webhooks/mercadopago", async (req, res) => {
        try {
                const event = req.body;
                logger.info({ event }, "Webhook recibido desde Mercado Pago");

                let booking = null;
                let paymentStatus = null;
                let metadata = { gateway: "mercadopago", event };

                const paymentId = event?.data?.id || event?.data?.resource?.id;
                let paymentInfo = null;

                if (paymentClient && paymentId) {
                        try {
                                paymentInfo = await paymentClient.get({ id: paymentId });
                        } catch (error) {
                                logger.error({ error }, "No fue posible consultar el pago en Mercado Pago");
                        }
                }

                const bookingIdentifier =
                        paymentInfo?.metadata?.bookingId ||
                        paymentInfo?.external_reference ||
                        event?.data?.metadata?.bookingId ||
                        event?.data?.external_reference;

                booking = await findBookingByIdentifier(bookingIdentifier);

                if (!booking) {
                        logger.warn({ bookingIdentifier }, "No se encontró la reserva asociada al webhook");
                        return res.status(200).json({ received: true });
                }

                paymentStatus =
                        paymentInfo?.status ||
                        event?.data?.status ||
                        event?.action ||
                        event?.type ||
                        null;

                if (typeof paymentStatus === "string") {
                        paymentStatus = paymentStatus.toLowerCase();
                        if (paymentStatus.includes(".")) {
                                paymentStatus = paymentStatus.split(".").pop();
                        }
                        if (paymentStatus === "payment") {
                                paymentStatus =
                                        event?.data?.status ||
                                        event?.data?.status_detail ||
                                        event?.action?.split(".").pop() ||
                                        "pending";
                        }
                }

                await updateBookingPaymentStatus({
                        booking,
                        paymentStatus,
                        metadata,
                        performedBy: "mercadopago-webhook",
                });

                res.status(200).json({ received: true });
        } catch (error) {
                logger.error({ error }, "Error procesando webhook de Mercado Pago");
                res.status(500).json({ message: "Error procesando webhook" });
        }
});

const parseFlowBody = (body) => {
        if (typeof body !== "object" || body === null) {
                return {};
        }
        return { ...body };
};

app.post(["/webhooks/flow", "/flow-confirmation"], async (req, res) => {
        try {
                const payload = parseFlowBody(req.body);
                logger.info({ payload }, "Webhook recibido desde Flow");

                const { s: signature, ...unsigned } = payload;
                if (signature) {
                        if (!process.env.FLOW_SECRET_KEY) {
                                logger.warn(
                                        "FLOW_SECRET_KEY no configurada; se omite validación de firma de Flow"
                                );
                        } else {
                                const expected = signParams(unsigned);
                                if (signature !== expected) {
                                        logger.warn("Firma inválida en webhook de Flow");
                                        return res.status(400).json({ message: "Firma inválida" });
                                }
                        }
                }

                const commerceOrder =
                        payload.commerceOrder ||
                        payload.flowOrder ||
                        payload.orderNumber ||
                        payload.reference;

                const booking = await findBookingByIdentifier(commerceOrder);
                if (!booking) {
                        logger.warn({ commerceOrder }, "No se encontró la reserva para el webhook de Flow");
                        return res.status(200).json({ received: true });
                }

                const statusCode = Number(payload.status);
                const paymentStatus = FLOW_STATUS_MAP[statusCode] || "pending";

                await updateBookingPaymentStatus({
                        booking,
                        paymentStatus,
                        metadata: { gateway: "flow", payload },
                        performedBy: "flow-webhook",
                });

                res.status(200).json({ received: true });
        } catch (error) {
                logger.error({ error }, "Error procesando webhook de Flow");
                res.status(500).json({ message: "Error procesando webhook" });
        }
});

app.post("/send-email", async (req, res) => {
        logger.info({ body: req.body }, "Petición recibida en /send-email");

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

        const emailSubject = `Nueva Cotización de Transfer: ${destino || "Destino no especificado"}`;
        const formattedPrice = precio
                ? `$${new Intl.NumberFormat("es-CL").format(precio)} CLP`
                : "A consultar";

        const emailHtml = `
        <div style="font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 20px auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #003366; color: white; padding: 20px; text-align: center;">
                <h1 style="margin: 0; font-size: 24px;">Nueva Solicitud de Cotización</h1>
                <p style="margin: 5px 0 0; color: #b3cde0;">Recibida desde: ${source || "Sitio Web"}</p>
            </div>

            <div style="padding: 20px;">
                <div style="background-color: #e0f2fe; border: 2px solid #3b82f6; padding: 15px; border-radius: 8px; text-align: center; margin-bottom: 25px;">
                    <h2 style="margin: 0 0 10px; font-size: 20px; color: #1e3a8a;">Resumen de la Cotización</h2>
                    <p style="margin: 5px 0; font-size: 18px;"><strong>Valor del Viaje:</strong> <span style="font-size: 22px; font-weight: bold; color: #1e3a8a;">${formattedPrice}</span></p>
                    <p style="margin: 5px 0; font-size: 16px;"><strong>Vehículo Sugerido:</strong> ${vehiculo || "No asignado"}</p>
                </div>

                <h2 style="border-bottom: 2px solid #eee; padding-bottom: 10px; color: #003366; font-size: 20px;">Detalles del Viaje</h2>
                <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                    <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px; font-weight: bold;">Origen:</td><td style="padding: 8px;">${origen || "No especificado"}</td></tr>
                    <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px; font-weight: bold;">Destino:</td><td style="padding: 8px;">${destino || "No especificado"}</td></tr>
                    <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px; font-weight: bold;">Fecha:</td><td style="padding: 8px;">${fecha || "No especificada"}</td></tr>
                    <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px; font-weight: bold;">Hora:</td><td style="padding: 8px;">${hora || "No especificada"}</td></tr>
                    <tr><td style="padding: 8px; font-weight: bold;">Nº de Pasajeros:</td><td style="padding: 8px;">${pasajeros || "No especificado"}</td></tr>
                </table>

                <h2 style="border-bottom: 2px solid #eee; padding-bottom: 10px; color: #003366; font-size: 20px; margin-top: 25px;">Información del Cliente</h2>
                <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                    <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px; font-weight: bold;">Nombre:</td><td style="padding: 8px;">${nombre || "No especificado"}</td></tr>
                    <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px; font-weight: bold;">Teléfono:</td><td style="padding: 8px;"><a href="tel:${telefono}" style="color: #3b82f6;">${telefono || "No especificado"}</a></td></tr>
                    <tr><td style="padding: 8px; font-weight: bold;">Email:</td><td style="padding: 8px;"><a href="mailto:${email}" style="color: #3b82f6;">${email || "No especificado"}</a></td></tr>
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
                await transporter.sendMail(mailOptions);
                logger.info("Correo enviado exitosamente desde /send-email");
                res.status(200).json({ message: "Mensaje enviado exitosamente." });
        } catch (error) {
                logger.error({ error }, "Error al enviar el correo desde /send-email");
                res.status(500).json({ message: "Error interno al enviar el correo." });
        }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
        logger.info(`Servidor backend escuchando en el puerto ${PORT}`);
});
