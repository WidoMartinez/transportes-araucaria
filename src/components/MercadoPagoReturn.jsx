// src/components/MercadoPagoReturn.jsx
// Página de retorno después de completar un pago con Mercado Pago Checkout Pro
// Dispara el evento de conversión de Google Ads una sola vez por transacción exitosa
// Replica la lógica de FlowReturn.jsx adaptada a los parámetros de MP

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { CheckCircle, Loader2, AlertCircle, Clock } from "lucide-react";
import logo from "../assets/logo.png";

// Constantes de polling (misma estrategia adaptativa que FlowReturn)
const GTAG_POLL_INTERVAL_MS = 100;
const GTAG_WAIT_TIMEOUT_MS = 5000;

/**
 * Normaliza un número de teléfono al formato E.164 (Chile)
 */
function normalizePhoneToE164(phone) {
	if (!phone) return "";
	let cleaned = phone.replace(/[\s\-()]/g, "");
	if (cleaned.startsWith("+56")) return cleaned;
	if (cleaned.startsWith("56")) return "+" + cleaned;
	if (cleaned.startsWith("9") && cleaned.length >= 9) return "+56" + cleaned;
	return "+56" + cleaned;
}

/**
 * Componente MercadoPagoReturn
 * Página de retorno después de completar un pago con Mercado Pago Checkout Pro.
 * Mercado Pago añade automáticamente a la URL de retorno:
 *   - collection_id: ID del pago aprobado (usado como transaction_id único)
 *   - collection_status: "approved" | "pending" | ...
 *   - payment_id: igual que collection_id
 *   - status: "approved" | "pending" | "failure"
 *   - payment_type: "credit_card" | "debit_card" | "ticket" | ...
 * Además, nuestro backend agrega:
 *   - amount: monto total del pago (para tracking de conversión)
 *   - reserva_id: ID de la reserva
 *   - codigo: código de reserva (AR-XXXX)
 *   - d: datos del usuario en Base64 (para Enhanced Conversions)
 */
function MercadoPagoReturn() {
	// estados: processing | success | pending | error
	const [paymentStatus, setPaymentStatus] = useState("processing");

	useEffect(() => {
		const urlParams = new URLSearchParams(window.location.search);

		// Parámetros que pasa nuestro backend en la back_url
		const statusParam = urlParams.get("status");
		const amountParam = urlParams.get("amount");
		const reservaIdParam = urlParams.get("reserva_id");
		const codigoParam = urlParams.get("codigo");

		// Parámetros que añade Mercado Pago automáticamente
		// collection_id es el ID único del pago aprobado → úsalo como transaction_id
		const collectionId =
			urlParams.get("collection_id") || urlParams.get("payment_id");
		const collectionStatus = urlParams.get("collection_status");

		// El status real puede venir de nuestro parámetro o del de MP
		const statusFinal =
			statusParam ||
			(collectionStatus === "approved"
				? "success"
				: collectionStatus === "pending"
					? "pending"
					: collectionStatus === "rejected"
						? "error"
						: null);

		// Espera activa hasta que window.gtag esté disponible
		const waitForGtag = () =>
			new Promise((resolve) => {
				if (typeof window.gtag === "function") return resolve(true);
				const inicio = Date.now();
				const intervalo = setInterval(() => {
					if (typeof window.gtag === "function") {
						clearInterval(intervalo);
						console.log(
							`✅ [MPReturn] gtag disponible tras ${Date.now() - inicio}ms`,
						);
						resolve(true);
					} else if (Date.now() - inicio >= GTAG_WAIT_TIMEOUT_MS) {
						clearInterval(intervalo);
						console.warn(
							`⚠️ [MPReturn] gtag no disponible tras ${GTAG_WAIT_TIMEOUT_MS}ms. Se omitirá conversión.`,
						);
						resolve(false);
					}
				}, GTAG_POLL_INTERVAL_MS);
			});

		/**
		 * Dispara el evento Purchase de Google Ads.
		 * Usa collection_id como transaction_id para evitar duplicados al recargar.
		 * @param {string|number} amount - monto a reportar
		 * @param {string|number} reservaId - ID de la reserva
		 * @param {string} transactionRef - ID único de la transacción MP
		 */
		const triggerConversion = (amount, reservaId, transactionRef) => {
			try {
				if (typeof window.gtag !== "function") {
					console.warn("⚠️ [MPReturn] gtag no disponible para conversión");
					return;
				}

				// transaction_id único: priorizar collection_id de MP (no el código de reserva)
				const transactionId =
					transactionRef ||
					(reservaId
						? `mp_${reservaId}_${Date.now().toString().slice(-6)}`
						: `mp_${Date.now()}`);

				// Valor de conversión robusto
				let conversionValue = 0;
				if (amount !== null && amount !== undefined && amount !== "") {
					const parsed = Number(amount);
					if (!isNaN(parsed) && parsed > 0) conversionValue = parsed;
				}

				if (conversionValue <= 0) {
					console.warn(
						"⚠️ [MPReturn] Monto inválido para conversión. Usando valor 1.0 como fallback.",
						"amount recibido:",
						amount,
					);
					conversionValue = 1.0;
				} else {
					console.log(
						`✅ [MPReturn] Valor de conversión: ${conversionValue}, Transaction ID: ${transactionId}`,
					);
				}

				// Deduplicar por transacción real para permitir pagos múltiples
				// sobre la misma reserva dentro de una misma sesión.
				const conversionKey = `mp_conversion_${transactionId}`;

				if (sessionStorage.getItem(conversionKey)) {
					console.log(
						"ℹ️ [MPReturn] Conversión ya registrada para esta sesión (deduplicada):",
						transactionId,
					);
					return;
				}

				// Leer datos de usuario desde parámetro Base64 (Enhanced Conversions)
				let userEmail = "";
				let userName = "";
				let userPhone = "";
				const encodedData = urlParams.get("d");
				if (encodedData) {
					try {
						const decodedFromUrl = decodeURIComponent(encodedData);
						const base64Decoded = atob(decodedFromUrl);
						const bytes = Uint8Array.from(base64Decoded, (c) =>
							c.charCodeAt(0),
						);
						const utf8Decoded = new TextDecoder("utf-8").decode(bytes);
						const userData = JSON.parse(utf8Decoded);
						if (userData && typeof userData === "object") {
							userEmail = userData.email || "";
							userName = userData.nombre || "";
							userPhone = userData.telefono || "";
							console.log(
								"✅ [MPReturn] Datos de usuario decodificados desde Base64 UTF-8",
							);
						}
					} catch (decodeErr) {
						console.warn(
							"⚠️ [MPReturn] Error decodificando datos de usuario:",
							decodeErr.message,
						);
						// Fallback a parámetros individuales
						userEmail = urlParams.get("email") || "";
						userName = urlParams.get("nombre") || "";
						userPhone = urlParams.get("telefono") || "";
					}
				} else {
					userEmail = urlParams.get("email") || "";
					userName = urlParams.get("nombre") || "";
					userPhone = urlParams.get("telefono") || "";
				}

				// Enhanced Conversions: set user_data antes de disparar el evento
				const userData = {};
				if (userEmail) userData.email = userEmail.toLowerCase().trim();
				if (userPhone) {
					const phoneNormalized = normalizePhoneToE164(userPhone);
					userData.phone_number = phoneNormalized;
				}
				if (userName && userName.trim()) {
					const nameParts = userName.trim().split(" ");
					userData.address = {
						first_name: (nameParts[0] || "").toLowerCase(),
						last_name: (nameParts.slice(1).join(" ") || "").toLowerCase(),
						country: "CL",
					};
				}

				if (Object.keys(userData).length > 0) {
					console.log("👤 [MPReturn] Set user_data para Enhanced Conversions");
					window.gtag("set", "user_data", userData);
				}

				// Disparar evento de conversión Purchase de Google Ads
				const conversionData = {
					send_to: "AW-17529712870/yZz-CJqiicUbEObh6KZB",
					value: conversionValue,
					currency: "CLP",
					transaction_id: transactionId,
				};

				console.log(
					`🚀 [MPReturn] Disparando conversión Google Ads:`,
					conversionData,
				);
				window.gtag("event", "conversion", conversionData);
				sessionStorage.setItem(conversionKey, "true");
			} catch (convErr) {
				console.error(
					"❌ [MPReturn] Error al disparar evento de conversión:",
					convErr,
				);
			}
		};

		// ── LÓGICA PRINCIPAL DE VERIFICACIÓN ──────────────────────────────────────
		const verifyPayment = async () => {
			console.log(
				`🔍 [MPReturn] Status=${statusFinal}, collection_id=${collectionId}, amount=${amountParam}`,
			);

			if (statusFinal === "error") {
				setPaymentStatus("error");
				return;
			}

			if (statusFinal === "success") {
				setPaymentStatus("success");
				const gtagListo = await waitForGtag();
				if (gtagListo) {
					triggerConversion(amountParam, reservaIdParam, collectionId);
				}
				return;
			}

			// Pago pendiente: iniciar polling al backend
			if (statusFinal === "pending") {
				console.warn(
					`⏳ [MPReturn] Pago PENDIENTE. Iniciando polling para verificar confirmación...`,
				);
				setPaymentStatus("pending");

				const apiBase =
					import.meta.env.VITE_API_URL ||
					"https://transportes-araucaria.onrender.com";

				// Estrategia adaptativa idéntica a FlowReturn
				const INTERVALOS_RAPIDOS = 6;
				const MAX_INTENTOS = 24;
				let intentos = 0;
				let cancelado = false;
				let timerRef = null;

				const ejecutarIntento = async () => {
					if (cancelado) return;
					intentos++;
					try {
						const url = `${apiBase}/api/payment-status?reserva_id=${encodeURIComponent(reservaIdParam || "")}`;
						const resp = await fetch(url);
						if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
						const data = await resp.json();

						console.log(
							`🔄 [MPReturn] Polling intento ${intentos}/${MAX_INTENTOS}: pagado=${data.pagado}, status=${data.status}`,
						);

						const transaccionConfirmada =
							data?.transaccionConfirmada ||
							data?.pagado ||
							data?.status === "parcial";

						if (transaccionConfirmada) {
							cancelado = true;
							setPaymentStatus("success");
							const montoConfirmado =
								amountParam && Number(amountParam) > 0
									? amountParam
									: data.monto?.toString() || amountParam;
							const gtagListo = await waitForGtag();
							if (gtagListo) {
								triggerConversion(
									montoConfirmado,
									reservaIdParam,
									collectionId,
								);
							}
							return;
						}

						if (data.status === "rechazado" || data.status === "anulado") {
							cancelado = true;
							setPaymentStatus("error");
							return;
						}
					} catch (pollErr) {
						console.warn(
							`⚠️ [MPReturn] Error en polling (intento ${intentos}):`,
							pollErr.message,
						);
					}

					if (intentos >= MAX_INTENTOS) {
						cancelado = true;
						console.log(
							"⏲️ [MPReturn] Polling finalizado sin confirmación (timeout ~5 min).",
						);
						return;
					}

					const siguienteIntervalo =
						intentos < INTERVALOS_RAPIDOS ? 5000 : 15000;
					timerRef = setTimeout(ejecutarIntento, siguienteIntervalo);
				};

				timerRef = setTimeout(ejecutarIntento, 5000);
				return () => {
					cancelado = true;
					if (timerRef) clearTimeout(timerRef);
				};
			}

			// Fallback: sin status claro → asumir éxito
			setPaymentStatus("success");
			const gtagListoFallback = await waitForGtag();
			if (gtagListoFallback) {
				triggerConversion(amountParam, reservaIdParam, collectionId);
			}
		};

		verifyPayment();
	}, []);

	const handleGoHome = () => {
		window.location.href = "/";
	};

	const handleContactSupport = () => {
		window.open(
			"https://wa.me/56936643540?text=Hola,%20necesito%20ayuda%20con%20mi%20pago%20en%20Mercado%20Pago",
			"_blank",
			"noopener,noreferrer",
		);
	};

	return (
		<div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-4">
			<div className="max-w-2xl w-full">
				{/* Logo */}
				<div className="text-center mb-8">
					<img
						src={logo}
						alt="Transportes Araucaria"
						className="h-20 mx-auto mb-4"
					/>
				</div>

				<Card className="shadow-lg">
					<CardHeader className="text-center pb-4">
						{paymentStatus === "processing" && (
							<>
								<div className="flex justify-center mb-4">
									<Loader2 className="h-16 w-16 text-chocolate-500 animate-spin" />
								</div>
								<CardTitle className="text-2xl">
									Procesando tu pago...
								</CardTitle>
								<p className="text-gray-600 mt-2">
									Por favor espera mientras confirmamos tu transacción con
									Mercado Pago
								</p>
							</>
						)}

						{paymentStatus === "success" && (
							<>
								<div className="flex justify-center mb-4">
									<div className="rounded-full bg-green-100 p-4">
										<CheckCircle className="h-16 w-16 text-green-600" />
									</div>
								</div>
								<CardTitle className="text-3xl text-green-600">
									¡Pago Exitoso!
								</CardTitle>
								<p className="text-gray-600 mt-2 text-lg">
									Tu reserva ha sido confirmada
								</p>
							</>
						)}

						{paymentStatus === "pending" && (
							<>
								<div className="flex justify-center mb-4">
									<div className="rounded-full bg-blue-100 p-4">
										<Clock className="h-16 w-16 text-blue-600" />
									</div>
								</div>
								<CardTitle className="text-2xl text-blue-600">
									Pago Pendiente de Confirmación
								</CardTitle>
								<p className="text-gray-600 mt-2">
									Tu pago está siendo procesado por Mercado Pago y será
									confirmado pronto.
								</p>
							</>
						)}

						{paymentStatus === "error" && (
							<>
								<div className="flex justify-center mb-4">
									<div className="rounded-full bg-yellow-100 p-4">
										<AlertCircle className="h-16 w-16 text-yellow-600" />
									</div>
								</div>
								<CardTitle className="text-2xl text-yellow-600">
									¿Hubo un problema?
								</CardTitle>
								<p className="text-gray-600 mt-2">
									No pudimos verificar la información de tu pago
									automáticamente.
								</p>
							</>
						)}
					</CardHeader>

					<CardContent className="space-y-6">
						{paymentStatus === "success" && (
							<>
								<div className="bg-green-50 border border-green-200 rounded-lg p-6">
									<h3 className="font-semibold text-green-900 mb-3">
										📧 Próximos pasos:
									</h3>
									<ul className="space-y-2 text-green-800">
										<li className="flex items-start">
											<span className="mr-2">✓</span>
											<span>
												Recibirás un correo de confirmación con todos los
												detalles de tu reserva
											</span>
										</li>
										<li className="flex items-start">
											<span className="mr-2">✓</span>
											<span>
												Nuestro equipo te contactará para coordinar los detalles
												finales
											</span>
										</li>
										<li className="flex items-start">
											<span className="mr-2">✓</span>
											<span>
												Guarda tu código de reserva para futuras consultas
											</span>
										</li>
									</ul>
								</div>

								<div className="bg-chocolate-50 border border-chocolate-200 rounded-lg p-4">
									<p className="text-sm text-chocolate-900">
										<strong>💡 Importante:</strong> Si no recibes el correo en
										los próximos minutos, revisa tu carpeta de spam o
										contáctanos por WhatsApp.
									</p>
								</div>
							</>
						)}

						{paymentStatus === "pending" && (
							<div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
								<h3 className="font-semibold text-blue-900 mb-3">
									⏳ ¿Qué significa esto?
								</h3>
								<p className="text-sm text-blue-800 mb-3">
									Tu pago está siendo procesado por Mercado Pago. Esto puede
									tardar unos minutos.
								</p>
								<ul className="space-y-2 text-blue-800 text-sm">
									<li className="flex items-start">
										<span className="mr-2">•</span>
										<span>
											Recibirás un correo de confirmación cuando el pago sea
											aprobado
										</span>
									</li>
									<li className="flex items-start">
										<span className="mr-2">•</span>
										<span>Si tienes dudas, contáctanos por WhatsApp</span>
									</li>
								</ul>
							</div>
						)}

						{paymentStatus === "error" && (
							<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
								<p className="text-sm text-yellow-900">
									Si realizaste el pago y ves este mensaje, por favor
									contáctanos por WhatsApp enviando tu comprobante de Mercado
									Pago y te ayudaremos de inmediato.
								</p>
							</div>
						)}

						{/* Botones de acción */}
						<div className="flex flex-col sm:flex-row gap-3 pt-4">
							{paymentStatus === "success" && (
								<>
									<Button onClick={handleGoHome} className="flex-1" size="lg">
										Volver al Inicio
									</Button>
									<Button
										onClick={handleContactSupport}
										variant="outline"
										className="flex-1"
										size="lg"
									>
										Contactar por WhatsApp
									</Button>
								</>
							)}

							{(paymentStatus === "error" || paymentStatus === "pending") && (
								<>
									<Button
										onClick={handleContactSupport}
										className="flex-1"
										size="lg"
									>
										Contactar Soporte
									</Button>
									<Button
										onClick={handleGoHome}
										variant="outline"
										className="flex-1"
										size="lg"
									>
										Volver al Inicio
									</Button>
								</>
							)}
						</div>

						{/* Información de contacto */}
						<div className="text-center text-sm text-gray-500 pt-2">
							<p>
								¿Necesitas ayuda?{" "}
								<button
									onClick={handleContactSupport}
									className="text-chocolate-600 hover:underline font-medium"
								>
									Contáctanos por WhatsApp
								</button>
							</p>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

export default MercadoPagoReturn;
