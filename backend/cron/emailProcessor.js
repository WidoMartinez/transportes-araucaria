import PendingEmail from "../models/PendingEmail.js";
import Reserva from "../models/Reserva.js";
import axios from "axios";
import { Op } from "sequelize";
import sequelize from "../config/database.js";

// Función para procesar correos pendientes
export const processPendingEmails = async () => {
    try {


        const now = new Date();
        
        // Buscar correos pendientes cuya fecha programada ya pasó
        const pendingEmails = await PendingEmail.findAll({
            where: {
                status: "pending",
                scheduledAt: {
                    [Op.lte]: now
                }
            },
            include: [{ model: Reserva, as: "reserva" }],
            limit: 50 // Procesar en lotes para no saturar
        });

        if (pendingEmails.length === 0) return;

        console.log(`🔄 Procesando ${pendingEmails.length} correos pendientes...`);

        for (const emailTask of pendingEmails) {
            let reserva = null; // Declarar fuera del try para que esté disponible en el catch
            try {
                reserva = await Reserva.findByPk(emailTask.reservaId);
                
                if (!reserva) {
                    console.warn(`⚠️ Reserva no encontrada para email pendiente ID ${emailTask.id}. Cancelando.`);
                    await emailTask.update({ status: "cancelled", lastError: "Reserva no encontrada" });
                    continue;
                }

                // VERIFICACIONES DE ESTADO
                // 1. Si ya pagó, no enviar descuento
                if (reserva.estadoPago === "pagado" || reserva.estadoPago === "aprobado" || reserva.estadoPago === "parcial") {
                    console.log(`🚫 Reserva ${reserva.codigoReserva} ya pagada. Cancelando correo de descuento.`);
                    await emailTask.update({ status: "cancelled", lastError: "Reserva ya pagada" });
                    continue;
                }

                // 2. Si pagó con código (aunque estadoPago sea pendiente en algunos flujos raros, verificar source)
                // O si tiene un pagoMonto > 0
                if (reserva.source === "codigo_pago" || (reserva.pagoMonto && reserva.pagoMonto > 0)) {
                    console.log(`🚫 Reserva ${reserva.codigoReserva} tiene pago o es por código. Cancelando.`);
                    await emailTask.update({ status: "cancelled", lastError: "Pago detectado o código usado" });
                    continue;
                }

                // ENVIAR CORREO DE DESCUENTO
                console.log(`🚀 Enviando correo de descuento para ${reserva.codigoReserva}...`);
                
                const phpUrl = process.env.PHP_EMAIL_URL || "https://www.transportesaraucaria.cl/enviar_correo_mejorado.php";
                
                // Advertencia si se usa el fallback (debería configurarse en producción)
                if (!process.env.PHP_EMAIL_URL) {
                    console.warn("⚠️ PHP_EMAIL_URL no configurado, usando URL por defecto");
                }
                
                // Preparar datos para el PHP
                const emailData = {
                    nombre: reserva.nombre,
                    email: reserva.email,
                    telefono: reserva.telefono,
                    origen: reserva.origen,
                    destino: reserva.destino,
                    fecha: reserva.fecha,
                    hora: reserva.hora,
                    pasajeros: reserva.pasajeros,
                    vehiculo: reserva.vehiculo,
                    codigoReserva: reserva.codigoReserva,
                    totalConDescuento: reserva.totalConDescuento,
                    precio: reserva.precio,
                    estadoPago: reserva.estadoPago,
                    action: "send_discount_offer" // Acción específica para el PHP
                };

                const response = await axios.post(phpUrl, emailData, {
                    headers: { "Content-Type": "application/json" },
                    timeout: 15000
                });

                if (response.data && response.data.success) {
                    await emailTask.update({ 
                        status: "sent", 
                        sentAt: new Date() 
                    });
                    console.log(`✅ Correo de descuento enviado para ${reserva.codigoReserva}`);
                } else {
                    throw new Error(response.data?.message || "Error desconocido del PHP");
                }

            } catch (error) {
                // Logging mejorado con contexto completo
                console.error(`❌ Error procesando email ID ${emailTask.id}:`, {
                    error: error.message,
                    reservaId: emailTask.reservaId,
                    codigoReserva: reserva?.codigoReserva,
                    email: emailTask.email,
                    attempts: emailTask.attempts + 1,
                    scheduledAt: emailTask.scheduledAt,
                    tipo: emailTask.type,
                    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
                });
                
                // Incrementar intentos
                const newAttempts = emailTask.attempts + 1;
                const updateData = { attempts: newAttempts, lastError: error.message };
                
                // Si falla 3 veces, marcar como fallido y notificar al admin
                if (newAttempts >= 3) {
                    updateData.status = "failed";
                    
                    // Notificar al administrador sobre el fallo definitivo
                    try {
                        const phpUrl = process.env.PHP_EMAIL_URL || "https://www.transportesaraucaria.cl/enviar_correo_mejorado.php";
                        
                        // Advertencia si se usa el fallback
                        if (!process.env.PHP_EMAIL_URL) {
                            console.warn("⚠️ PHP_EMAIL_URL no configurado para notificación de fallos");
                        }
                        
                        // Solo notificar si tenemos datos de la reserva
                        if (reserva) {
                            await axios.post(phpUrl, {
                                action: "notify_admin_failed_email",
                                reservaId: reserva.id,
                                codigoReserva: reserva.codigoReserva,
                                email: emailTask.email,
                                attempts: newAttempts,
                                lastError: error.message,
                                tipo: emailTask.type,
                                nombre: reserva.nombre,
                                origen: reserva.origen,
                                destino: reserva.destino,
                                fecha: reserva.fecha
                            }, {
                                headers: { "Content-Type": "application/json" },
                                timeout: 10000
                            });
                            console.log(`📧 Notificación de fallo enviada al admin para reserva ${reserva.codigoReserva}`);
                        } else {
                            console.warn(`⚠️ No se pudo notificar al admin: reserva no disponible para email ID ${emailTask.id}`);
                        }
                    } catch (notifError) {
                        console.error("❌ Error notificando fallo al admin:", notifError.message);
                    }
                } else {
                    // Implementar exponential backoff: 2min, 4min, 8min...
                    const delayMinutes = Math.pow(2, newAttempts);
                    updateData.scheduledAt = new Date(Date.now() + delayMinutes * 60000);
                    console.log(`⏰ Reintento ${newAttempts} programado en ${delayMinutes} minutos para email ID ${emailTask.id}`);
                }
                
                await emailTask.update(updateData);
            }
        }
    } catch (globalError) {
        console.error("❌ Error global en processPendingEmails:", globalError);
    }
};
