import nodemailer from "nodemailer";
import dayjs from "dayjs";
import Booking from "../models/Booking.js";
import logger from "../utils/logger.js";

const resolveFromAddress = () => {
        if (process.env.EMAIL_FROM) {
                return process.env.EMAIL_FROM;
        }
        if (process.env.EMAIL_USER) {
                return `"Transportes Araucaria" <${process.env.EMAIL_USER}>`;
        }
        return "notificaciones@transportesaraucaria.local";
};

const getEmailTransportConfig = () => {
        if (!process.env.EMAIL_HOST) {
                return null;
        }

        return {
                host: process.env.EMAIL_HOST,
                port: parseInt(process.env.EMAIL_PORT || "587", 10),
                secure: process.env.EMAIL_PORT === "465",
                auth: process.env.EMAIL_USER
                        ? {
                                  user: process.env.EMAIL_USER,
                                  pass: process.env.EMAIL_PASS,
                          }
                        : undefined,
                connectionTimeout: 15000,
                socketTimeout: 15000,
        };
};

const createTransporter = () => {
        const config = getEmailTransportConfig();
        if (!config) {
                logger.warn("No se ha configurado un servidor SMTP. El envío de correo se omitirá.");
                return null;
        }

        return nodemailer.createTransport(config);
};

const sendEmail = async (options) => {
        const transporter = createTransporter();
        if (!transporter) {
                return;
        }

        const finalOptions = {
                from: resolveFromAddress(),
                ...options,
        };

        await transporter.sendMail(finalOptions);
        logger.info({ to: finalOptions.to, subject: finalOptions.subject }, "Correo enviado");
};

const sendSMS = async (phoneNumber, message) => {
        if (!phoneNumber) {
                logger.warn("No se proporcionó número telefónico para enviar SMS");
                return;
        }

        logger.info({ phoneNumber, message }, "SMS simulado enviado");
};

const formatCurrency = (amount = 0, currency = "CLP") =>
        new Intl.NumberFormat("es-CL", {
                style: "currency",
                currency,
                minimumFractionDigits: currency === "CLP" ? 0 : 2,
        }).format(amount);

const resolveBooking = async (payload = {}) => {
        if (!payload) {
                return null;
        }

        if (payload.booking) {
                if (typeof payload.booking.toObject === "function") {
                        return payload.booking.toObject({ virtuals: true });
                }
                return payload.booking;
        }

        if (payload.bookingId) {
                const bookingDoc = await Booking.findById(payload.bookingId);
                if (bookingDoc) {
                        return bookingDoc.toObject({ virtuals: true });
                }
        }

        return null;
};

const buildVoucherContent = (booking) => {
        const passengerCount = booking.passengerCount || booking.passengers?.length || 0;
        const currency = booking.totals?.currency || "CLP";
        return `Reserva Confirmada\n\nReferencia: ${booking.reference}\nCliente: ${booking.contact?.name || "No informado"}\nOrigen: ${booking.trip?.origin}\nDestino: ${booking.trip?.destination}\nFecha/Hora: ${dayjs(booking.trip?.departure).format(
                "DD-MM-YYYY HH:mm"
        )}\nPasajeros: ${passengerCount}\nTotal Pagado: ${formatCurrency(
                booking.totals?.grandTotal || 0,
                currency
        )}`;
};

const buildInvoice = (booking) => {
        const baseAmount = booking.totals?.baseAmount || 0;
        const extrasAmount = booking.totals?.extrasAmount || 0;
        const discountAmount = booking.totals?.discountAmount || 0;
        return {
                invoiceNumber: `FAC-${dayjs().format("YYYYMMDD-HHmmss")}`,
                issuedAt: new Date().toISOString(),
                customer: booking.contact,
                trip: booking.trip,
                items: [
                        {
                                description: "Servicio de transporte",
                                quantity: 1,
                                unitPrice: baseAmount,
                                total: baseAmount,
                        },
                        ...((booking.extras || []).map((extra) => ({
                                description: extra.name,
                                quantity: extra.quantity || 1,
                                unitPrice: extra.price || 0,
                                total: (extra.quantity || 1) * (extra.price || 0),
                        })) || []),
                ],
                totals: {
                        baseAmount,
                        extrasAmount,
                        discountAmount,
                        grandTotal: booking.totals?.grandTotal || baseAmount + extrasAmount - discountAmount,
                },
        };
};

export const sendVoucherAndInvoice = async (payload) => {
        const booking = await resolveBooking(payload);
        if (!booking) {
                logger.warn("No se encontró la reserva al intentar enviar voucher");
                return;
        }

        if (!booking.contact?.email) {
                logger.warn({ bookingId: booking._id }, "La reserva no tiene correo de contacto para enviar voucher");
                return;
        }

        const voucherContent = buildVoucherContent(booking);
        const invoice = buildInvoice(booking);

        try {
                await sendEmail({
                        to: booking.contact.email,
                        subject: `Voucher de viaje ${booking.reference}`,
                        text: voucherContent,
                        attachments: [
                                {
                                        filename: `voucher-${booking.reference}.txt`,
                                        content: voucherContent,
                                },
                                {
                                        filename: `factura-${booking.reference}.json`,
                                        content: JSON.stringify(invoice, null, 2),
                                        contentType: "application/json",
                                },
                        ],
                });
        } catch (error) {
                logger.error({ error, bookingId: booking._id }, "Error enviando voucher e invoice");
        }
};

export const sendPaymentStatusNotification = async (payload) => {
        const booking = await resolveBooking(payload);
        if (!booking) {
                logger.warn("No se encontró la reserva al notificar estado de pago");
                return;
        }

        const status = booking.paymentStatus;
        const subject = `Actualización estado de pago: ${booking.reference}`;
        const message = `Hola ${booking.contact?.name || ""},\n\nEl estado de tu pago ha sido actualizado a: ${status}.\nReferencia de reserva: ${booking.reference}.\nTotal: ${formatCurrency(booking.totals?.grandTotal || 0, booking.totals?.currency)}.`;

        try {
                if (booking.contact?.email) {
                        await sendEmail({ to: booking.contact.email, subject, text: message });
                }
                if (booking.contact?.phone) {
                        await sendSMS(booking.contact.phone, `Estado de pago ${status} para reserva ${booking.reference}`);
                }
        } catch (error) {
                logger.error({ error, bookingId: booking._id }, "Error notificando estado de pago");
        }
};

export const sendReminderNotifications = async (payload) => {
        const booking = await resolveBooking(payload);
        if (!booking) {
                logger.warn("No se encontró la reserva al enviar recordatorio");
                return;
        }

        const departure = dayjs(booking.trip?.departure);
        const subject = `Recordatorio de viaje ${booking.reference}`;
        const message = `Hola ${booking.contact?.name || ""},\n\nTe recordamos tu viaje programado para el ${departure.format(
                "DD-MM-YYYY HH:mm"
        )}.\nOrigen: ${booking.trip?.origin}\nDestino: ${booking.trip?.destination}`;

        try {
                if (booking.contact?.email) {
                        await sendEmail({ to: booking.contact.email, subject, text: message });
                }
                if (booking.contact?.phone) {
                        await sendSMS(
                                booking.contact.phone,
                                `Recordatorio: viaje ${booking.reference} el ${departure.format("DD/MM HH:mm")}`
                        );
                }
        } catch (error) {
                logger.error({ error, bookingId: booking._id }, "Error enviando recordatorio");
        }
};

export const notifyDrivers = async (payload) => {
        const booking = await resolveBooking(payload);
        if (!booking) {
                logger.warn("No se encontró la reserva al notificar conductor");
                return;
        }

        if (!booking.assignedDriver) {
                logger.info(
                        { bookingId: booking._id },
                        "La reserva no tiene conductor asignado. Se omite notificación."
                );
                return;
        }

        const message = `Nueva reserva asignada ${booking.reference}. Pasajeros: ${
                booking.passengerCount
        }. Origen: ${booking.trip?.origin} - Destino: ${booking.trip?.destination}. Salida: ${dayjs(
                booking.trip?.departure
        ).format("DD-MM-YYYY HH:mm")}`;

        try {
                if (booking.assignedDriver.email) {
                        await sendEmail({ to: booking.assignedDriver.email, subject: "Nueva asignación", text: message });
                }
                if (booking.assignedDriver.phone) {
                        await sendSMS(booking.assignedDriver.phone, message);
                }
        } catch (error) {
                logger.error({ error, bookingId: booking._id }, "Error notificando a conductor");
        }
};

export const syncWithOperationalSystems = async (payload) => {
        const booking = await resolveBooking(payload);
        if (!booking) {
                logger.warn("No se encontró la reserva al sincronizar con operaciones");
                return;
        }

        logger.info({ bookingId: booking._id }, "Sincronización con sistema operativo simulada");
};

export const syncWithCRM = async (payload) => {
        const booking = await resolveBooking(payload);
        if (!booking) {
                logger.warn("No se encontró la reserva al sincronizar con CRM");
                return;
        }

        logger.info({ bookingId: booking._id }, "Sincronización con CRM simulada");
};

export default {
        sendVoucherAndInvoice,
        sendPaymentStatusNotification,
        sendReminderNotifications,
        notifyDrivers,
        syncWithOperationalSystems,
        syncWithCRM,
};
