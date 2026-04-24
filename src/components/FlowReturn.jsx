import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { CheckCircle, Loader2, AlertCircle, Clock } from "lucide-react";
import logo from "../assets/logo.png";

// Configuración
// Polling: cuánto esperar entre cada intento de verificar si gtag está listo
const GTAG_POLL_INTERVAL_MS = 100;
// Tiempo máximo de espera total para que gtag esté disponible (5 segundos)
const GTAG_WAIT_TIMEOUT_MS = 5000;

/**
 * Normaliza un número de teléfono al formato E.164 internacional
 * Formato E.164: +[código país][número]
 * Ejemplo: +56987654321 (Chile)
 *
 * NOTA: Esta función asume números chilenos por defecto.
 * Para un sistema multi-país, se requeriría detección de código de país.
 *
 * @param {string} phone - Número de teléfono en cualquier formato
 * @returns {string} - Número en formato E.164 o string vacío si no es válido
 */
function normalizePhoneToE164(phone) {
	if (!phone) return "";

	// Limpiar espacios, guiones, paréntesis y otros caracteres especiales
	let cleaned = phone.replace(/[\s\-()]/g, "");

	// Si ya tiene +56 al inicio, retornar
	if (cleaned.startsWith("+56")) {
		return cleaned;
	}

	// Si empieza con 56 (sin +), agregar +
	if (cleaned.startsWith("56")) {
		return "+" + cleaned;
	}

	// Si empieza con 9 (número chileno móvil), agregar +56
	if (cleaned.startsWith("9") && cleaned.length >= 9) {
		return "+56" + cleaned;
	}

	// Fallback: Asumir que es chileno y agregar +56 (válido para sistema Chile-only)
	// Para soporte multi-país, retornar '' o implementar detección de código de área
	return "+56" + cleaned;
}

/**
 * Componente FlowReturn
 * Página de retorno después de completar un pago con Flow
 * Dispara el evento de conversión de Google Ads una sola vez por transacción exitosa
 */
function FlowReturn() {
	const [paymentStatus, setPaymentStatus] = useState("processing"); // processing, success, error

	// Extraer reservaId a nivel de componente para usarlo en el botón "Completar dirección"
	const urlParamsGlobal = new URLSearchParams(window.location.search);
	const reservaIdGlobal = urlParamsGlobal.get("reserva_id");

	useEffect(() => {
		// Extraer token de Flow de los parámetros de URL
		const urlParams = new URLSearchParams(window.location.search);
		const token = urlParams.get("token");
		const amountParam = urlParams.get("amount");
		const reservaIdParam = urlParams.get("reserva_id");
		const statusParam = urlParams.get("status"); // Nuevo parámetro de estado
		const errorParam = urlParams.get("error"); // Parámetro de error explícito
		const flowStatusParam = urlParams.get("flow_status"); // Estado interno de Flow (debugging)

		if (!token) {
			console.warn("No se recibió token de Flow en la URL de retorno");
			// No marcar error inmediatamente, permitir que la UI cargue y mostrar mensaje amigable
			// Opcional: redirigir a una página de ayuda o home después de unos segundos
		}

		// Espera activa (polling) hasta que window.gtag esté disponible o se agote el timeout
		// Soluciona el race condition donde gtag.js no termina de cargar en los primeros 100ms
		const waitForGtag = () =>
			new Promise((resolve) => {
				if (typeof window.gtag === "function") {
					return resolve(true);
				}
				const inicio = Date.now();
				const intervalo = setInterval(() => {
					if (typeof window.gtag === "function") {
						clearInterval(intervalo);
						console.log(
							`✅ [FlowReturn] gtag disponible tras ${Date.now() - inicio}ms`,
						);
						resolve(true);
					} else if (Date.now() - inicio >= GTAG_WAIT_TIMEOUT_MS) {
						clearInterval(intervalo);
						console.warn(
							`⚠️ [FlowReturn] gtag no disponible tras ${GTAG_WAIT_TIMEOUT_MS}ms. Se omitirá conversión.`,
						);
						resolve(false);
					}
				}, GTAG_POLL_INTERVAL_MS);
			});

		// LOGICA DE VERIFICACIÓN
		const verifyPayment = async () => {
			console.log(
				`🔍 [FlowReturn] Verificando estado: Status=${statusParam}, Error=${errorParam}, Amount=${amountParam}`,
			);

			// Detección de retorno de propina: mostrar éxito sin disparar conversiones de reserva
			const esPropina = urlParams.get("propina") === "1";
			if (esPropina) {
				if (statusParam === "error") {
					setPaymentStatus("error");
				} else {
					setPaymentStatus("success");
					// Guardar flag para que el render muestre mensaje de propina
					sessionStorage.setItem("flow_return_propina", "1");
				}
				return;
			}

			// Si el backend nos dice explícitamente que hubo error
			if (statusParam === "error" || errorParam) {
				console.warn(
					`❌ Error en pago detectado. Status: ${statusParam}, Error: ${errorParam}, FlowStatus: ${flowStatusParam}`,
				);
				setPaymentStatus("error");
				return;
			}

			// Si el backend nos dice que fue exitoso
			if (statusParam === "success") {
				setPaymentStatus("success");
				// Esperar a que gtag esté disponible antes de disparar la conversión
				const gtagListo = await waitForGtag();
				if (gtagListo) {
					triggerConversion(amountParam, reservaIdParam, token);
				}
				return;
			}

			// Si el pago está PENDIENTE (esperando confirmación del webhook de Flow)
			// El flujo de Flow envía primero status=1 al navegador del usuario y luego status=2
			// solo al webhook del servidor. Por eso el usuario queda en "pending" y el redirect
			// final con status=success nunca llega al browser. Solución: polling al backend.
			// NOTA: El backend ahora también consulta directamente a Flow API si la DB está pendiente,
			// compensando el cold start de Render (el webhook pudo haberse perdido).
			if (statusParam === "pending") {
				console.warn(
					`⏳ Pago PENDIENTE detectado. Iniciando polling para verificar confirmación...`,
				);
				setPaymentStatus("pending");

				const apiBase =
					import.meta.env.VITE_API_URL ||
					"https://transportes-araucaria.onrender.com";
				// Estrategia de polling adaptativo:
				// - Primeros 6 intentos: cada 5s (primeros 30s, para pagos rápidos con tarjeta)
				// - Siguientes 18 intentos: cada 15s (siguientes 4.5 min, para transferencias lentas)
				// Total máximo: ~5 minutos de espera activa
				const INTERVALOS_RAPIDOS = 6;
				const MAX_INTENTOS = 24;
				let intentos = 0;
				let cancelado = false;
				let timerRef = null;

				const ejecutarIntento = async () => {
					if (cancelado) return;
					intentos++;
					try {
						const url = `${apiBase}/api/payment-status?token=${encodeURIComponent(token || "")}&reserva_id=${encodeURIComponent(reservaIdParam || "")}`;
						const resp = await fetch(url);
						if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
						const data = await resp.json();

						console.log(
							`🔄 [FlowReturn] Polling intento ${intentos}/${MAX_INTENTOS}: pagado=${data.pagado}, status=${data.status}, fuente=${data.fuente || "db"}`,
						);

						const transaccionConfirmada =
							data?.transaccionConfirmada ||
							data?.pagado ||
							data?.status === "parcial";

						if (transaccionConfirmada) {
							cancelado = true;
							setPaymentStatus("success");
							// Usar monto retornado por el backend (desde DB o Flow API) o el que vino en URL
							const montoConfirmado =
								amountParam && Number(amountParam) > 0
									? amountParam
									: data.monto?.toString() || amountParam;
							const gtagListo = await waitForGtag();
							if (gtagListo) {
								triggerConversion(montoConfirmado, reservaIdParam, token);
							}
							return; // Detener polling
						}

						// Si Flow reportó rechazo o anulación, mostrar error
						if (data.status === "rechazado" || data.status === "anulado") {
							cancelado = true;
							setPaymentStatus("error");
							return;
						}
					} catch (e) {
						console.warn(
							`⚠️ [FlowReturn] Error en polling (intento ${intentos}):`,
							e.message,
						);
					}

					if (intentos >= MAX_INTENTOS) {
						cancelado = true;
						console.log(
							"⏲️ [FlowReturn] Polling finalizado sin confirmación de pago (timeout ~5 min). El usuario debe revisar su email.",
						);
						return;
					}

					// Programar siguiente intento con intervalo adaptativo
					const siguienteIntervalo =
						intentos < INTERVALOS_RAPIDOS ? 5000 : 15000;
					timerRef = setTimeout(ejecutarIntento, siguienteIntervalo);
				};

				// Primer intento tras 5 segundos de espera inicial
				timerRef = setTimeout(ejecutarIntento, 5000);

				// Limpieza si el componente se desmonta antes de completar
				return () => {
					cancelado = true;
					if (timerRef) clearTimeout(timerRef);
				};
			}

			// Fallback (status desconocido o legacy): asumir éxito si no hay error explícito
			setPaymentStatus("success");
			const gtagListoFallback = await waitForGtag();
			if (gtagListoFallback) {
				triggerConversion(amountParam, reservaIdParam, token);
			}
		};

		// triggerConversion ya puede asumir que gtag está disponible (se usa después de waitForGtag)
		const triggerConversion = (amount, id, tkn) => {
			try {
				if (typeof window.gtag === "function") {
					// Usar ID de reserva y token para asegurar unicidad absoluta en Google Ads
					// Evita deduplicación errónea de reservas múltiples del mismo usuario
					const transactionId =
						id && tkn
							? `${id}_${tkn.substring(0, 8)}`
							: id || tkn || `manual_${Date.now()}`;

					// ESTRATEGIA B: amount contiene el valor TOTAL de la reserva
					// Lógica robusta: asegurarse que no sea null, undefined ni string vacío antes de convertir
					let conversionValue = 0;
					if (amount !== null && amount !== undefined && amount !== "") {
						const parsed = Number(amount);
						if (!isNaN(parsed) && parsed > 0) {
							conversionValue = parsed;
						}
					}

					// Si el monto es inválido, no disparar la conversión (evita distorsionar métricas)
					if (conversionValue <= 0) {
						console.error(
							"❌ [GA-ALERTA] Conversión omitida: monto inválido en URL.",
							"amount recibido:", amount,
							"— verificar que backend pase amount en URL de retorno (/api/payment-result en Render).",
						);
						return;
					} else {
						console.log(
							`✅ [FlowReturn] Valor total de conversión: ${conversionValue}, Transaction ID: ${transactionId}`,
						);
					}

					// Deduplicar por transacción real para no bloquear pagos distintos
					// del mismo `reserva_id` (por ejemplo abono + saldo) en la misma sesión.
					const conversionKey = `flow_conversion_${transactionId}`;

					if (!sessionStorage.getItem(conversionKey)) {
						// Extraer datos de usuario de los parámetros URL para conversiones avanzadas
						const urlParams = new URLSearchParams(window.location.search);

						let userEmail = "";
						let userName = "";
						let userPhone = "";

						// Intentar decodificar datos codificados en Base64 (nuevo formato seguro)
						const encodedData = urlParams.get("d");
						if (encodedData) {
							try {
								// ✅ Decodificar Base64 con soporte UTF-8 usando TextDecoder (estándar moderno, sin escape() deprecated)
								// Paso 1: Decodificar URL encoding (revertir encodeURIComponent del backend)
								const decodedFromUrl = decodeURIComponent(encodedData);

								// Paso 2: Decodificar Base64 a bytes
								const base64Decoded = atob(decodedFromUrl);

								// Paso 3: Convertir bytes a string UTF-8 con TextDecoder (soporta ñ, acentos y caracteres especiales)
								const bytes = Uint8Array.from(base64Decoded, (c) =>
									c.charCodeAt(0),
								);
								const utf8Decoded = new TextDecoder("utf-8").decode(bytes);
								// Paso 4: Parsear JSON
								const userData = JSON.parse(utf8Decoded);

								if (userData && typeof userData === "object") {
									userEmail = userData.email || "";
									userName = userData.nombre || "";
									userPhone = userData.telefono || "";
									console.log(
										"✅ [FlowReturn] Datos de usuario decodificados desde parámetro Base64 (UTF-8)",
									);
								}
							} catch (error) {
								console.warn(
									"⚠️ [FlowReturn] Error decodificando datos de usuario:",
									error.message,
								);
								// Fallback a parámetros individuales (compatibilidad con URLs antiguas)
								userEmail = urlParams.get("email") || "";
								userName = urlParams.get("nombre") || "";
								userPhone = urlParams.get("telefono") || "";
							}
						} else {
							// Fallback: Leer parámetros individuales (compatibilidad con URLs antiguas)
							userEmail = urlParams.get("email") || "";
							userName = urlParams.get("nombre") || "";
							userPhone = urlParams.get("telefono") || "";
						}

						// Preparar datos de conversión básicos
						const conversionData = {
							send_to: "AW-17529712870/yZz-CJqiicUbEObh6KZB",
							value: conversionValue,
							currency: "CLP",
							transaction_id: transactionId,
						};

						// ✅ Enhanced Conversions: usar gtag('set', 'user_data', ...) para máxima compatibilidad
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
							console.log(
								"👤 [FlowReturn] Set user_data para Enhanced Conversions",
							);
							window.gtag("set", "user_data", userData);
						}

						console.log(
							`🚀 [FlowReturn] Disparando conversión Google Ads:`,
							conversionData,
						);
						window.gtag("event", "conversion", conversionData);
						sessionStorage.setItem(conversionKey, "true");
						if (id) {
							sessionStorage.setItem(`flow_conversion_express_${id}`, "true"); // legacy express compatibility
						}
					} else {
						console.log(
							"ℹ️ [FlowReturn] Conversión ya registrada para esta sesión:",
							transactionId,
						);
					}
				} else {
					console.warn(
						"⚠️ [FlowReturn] gtag no está disponible para tracking de conversión",
					);
				}
			} catch (error) {
				console.error(
					"❌ [FlowReturn] Error al disparar evento de conversión:",
					error,
				);
			}
		};

		verifyPayment();
		// Removed timeout wrapper to verify payment immediately after delay
	}, []);

	const handleGoHome = () => {
		// Usar window.location.href porque la app no usa React Router
		// y necesitamos recargar la página principal
		window.location.href = "/";
	};

	const handleContactSupport = () => {
		// Abrir WhatsApp en nueva pestaña para preservar el estado de la página
		window.open(
			"https://wa.me/56936643540?text=Hola,%20necesito%20ayuda%20con%20mi%20pago",
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
									Por favor espera mientras confirmamos tu transacción
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
									{sessionStorage.getItem("flow_return_propina") === "1"
										? "¡Propina enviada!"
										: "¡Pago Exitoso!"}
								</CardTitle>
								<p className="text-gray-600 mt-2 text-lg">
									{sessionStorage.getItem("flow_return_propina") === "1"
										? "Tu propina fue pagada exitosamente. ¡Muchas gracias!"
										: "Tu reserva ha sido confirmada"}
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
									Tu pago está siendo procesado y será confirmado pronto.
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
									Tu pago está siendo procesado por Flow. Esto puede tardar unos
									minutos.
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
									contáctanos por WhatsApp enviando tu comprobante y te
									ayudaremos de inmediato.
								</p>
							</div>
						)}

						{/* Botones de acción */}
						<div className="flex flex-col sm:flex-row gap-3 pt-4">
							{paymentStatus === "success" && (
								<>
									{reservaIdGlobal ? (
										<Button
											onClick={() => {
												window.location.href = `/#completar-detalles?id=${reservaIdGlobal}`;
											}}
											className="flex-1"
											size="lg"
										>
											Completar dirección de viaje
										</Button>
									) : (
										<Button onClick={handleGoHome} className="flex-1" size="lg">
											Volver al Inicio
										</Button>
									)}
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

							{paymentStatus === "error" && (
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
						<div className="text-center pt-4 border-t">
							<p className="text-sm text-gray-600">
								¿Necesitas ayuda? Escríbenos
							</p>
							<div className="flex justify-center gap-4 mt-2 text-sm">
								<a
									href="mailto:contacto@transportesaraucaria.cl"
									className="text-chocolate-600 hover:underline"
								>
									📧 contacto@transportesaraucaria.cl
								</a>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

export default FlowReturn;
