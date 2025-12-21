/* global gtag */
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { CheckCircle, Loader2, AlertCircle } from "lucide-react";
import logo from "../assets/logo.png";

// Configuración
const PAYMENT_VERIFICATION_DELAY_MS = 1000; // Tiempo de espera antes de confirmar el pago

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
	if (!phone) return '';
	
	// Limpiar espacios, guiones, paréntesis y otros caracteres especiales
	let cleaned = phone.replace(/[\s\-()]/g, '');
	
	// Si ya tiene +56 al inicio, retornar
	if (cleaned.startsWith('+56')) {
		return cleaned;
	}
	
	// Si empieza con 56 (sin +), agregar +
	if (cleaned.startsWith('56')) {
		return '+' + cleaned;
	}
	
	// Si empieza con 9 (número chileno móvil), agregar +56
	if (cleaned.startsWith('9') && cleaned.length >= 9) {
		return '+56' + cleaned;
	}
	
	// Fallback: Asumir que es chileno y agregar +56 (válido para sistema Chile-only)
	// Para soporte multi-país, retornar '' o implementar detección de código de área
	return '+56' + cleaned;
}

/**
 * Componente FlowReturn
 * Página de retorno después de completar un pago con Flow
 * Dispara el evento de conversión de Google Ads una sola vez por transacción exitosa
 */
function FlowReturn() {
	const [paymentStatus, setPaymentStatus] = useState("processing"); // processing, success, error

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

		// LOGICA DE VERIFICACIÓN
		const verifyPayment = async () => {
			// Pequeño delay artificial para UX
			await new Promise(resolve => setTimeout(resolve, PAYMENT_VERIFICATION_DELAY_MS));
			
			// Si el backend nos dice explícitamente que hubo error
			if (statusParam === "error" || errorParam) {
				console.warn(`❌ Error en pago detectado. Status: ${statusParam}, Error: ${errorParam}, FlowStatus: ${flowStatusParam}`);
				setPaymentStatus("error");
				return;
			}

			// Si el backend nos dice que fue exitoso
			if (statusParam === "success") {
				setPaymentStatus("success");
				// Disparar evento de conversión
				triggerConversion(amountParam, reservaIdParam, token);
				return;
			}

			// Fallback (status unknown o legacy): Asumimos éxito por ahora (comportamiento original)
			// O idealmente deberíamos consultar al backend nuevamente si es 'unknown'
			// Para mantener compatibilidad si no hay params, lo dejamos en success pero solo si no es error explícito
			setPaymentStatus("success");
			triggerConversion(amountParam, reservaIdParam, token);
		};

		const triggerConversion = (amount, id, tkn) => {
			try {
				if (typeof window.gtag === "function") {
					const transactionId = id || tkn || `manual_${Date.now()}`;
					// Usar el monto real si viene en la URL. Permitir 0. Si es nulo/undefined, 1.0.
					const conversionValue = (amount !== null && amount !== undefined && amount !== "") ? Number(amount) : 1.0;
					
					// Usar sessionStorage para evitar duplicados en recargas
					const conversionKey = `flow_conversion_${transactionId}`;
					
					if (!sessionStorage.getItem(conversionKey)) {
						// Extraer datos de usuario de los parámetros URL para conversiones avanzadas
						const urlParams = new URLSearchParams(window.location.search);
						
						let userEmail = '';
						let userName = '';
						let userPhone = '';

						// Intentar decodificar datos codificados en Base64 (nuevo formato seguro)
						const encodedData = urlParams.get('d');
						if (encodedData) {
							try {
								const decodedData = atob(encodedData); // Decodificar Base64
								const userData = JSON.parse(decodedData);
								
								// Validar que el objeto decodificado tenga la estructura esperada
								if (userData && typeof userData === 'object') {
									userEmail = userData.email || '';
									userName = userData.nombre || '';
									userPhone = userData.telefono || '';
									console.log('✅ Datos de usuario decodificados desde parámetro Base64');
								} else {
									throw new Error('Estructura de datos inválida');
								}
							} catch (error) {
								console.warn('⚠️ Error decodificando datos de usuario:', error.message);
								// Fallback a parámetros individuales (compatibilidad con URLs antiguas)
								userEmail = urlParams.get('email') || '';
								userName = urlParams.get('nombre') || '';
								userPhone = urlParams.get('telefono') || '';
							}
						} else {
							// Fallback: Leer parámetros individuales (compatibilidad con URLs antiguas)
							userEmail = urlParams.get('email') || '';
							userName = urlParams.get('nombre') || '';
							userPhone = urlParams.get('telefono') || '';
						}

						// Preparar datos de conversión básicos
						const conversionData = {
							send_to: "AW-17529712870/yZz-CJqiicUbEObh6KZB",
							value: conversionValue,
							currency: "CLP",
							transaction_id: transactionId,
						};

						// Agregar datos de usuario si están disponibles (Google los hashea automáticamente)
						if (userEmail) {
							conversionData.email = userEmail.toLowerCase().trim();
						}

						if (userPhone) {
							// Normalizar teléfono al formato E.164 (+56...)
							const phoneNormalized = normalizePhoneToE164(userPhone);
							conversionData.phone_number = phoneNormalized;
						}

						if (userName && userName.trim()) {
							// Separar nombre completo en first_name y last_name
							const nameParts = userName.trim().split(' ');
							const firstName = nameParts[0] || '';
							const lastName = nameParts.slice(1).join(' ') || '';
							
							conversionData.address = {
								first_name: firstName.toLowerCase(),
								last_name: lastName.toLowerCase(),
								country: 'CL' // Chile
							};
						}

						window.gtag("event", "conversion", conversionData);
						sessionStorage.setItem(conversionKey, 'true');
						
						// Log mejorado mostrando datos adicionales
						console.log(`✅ Evento de conversión Google Ads disparado (ID: ${transactionId}, Valor: ${conversionValue})`);
						if (userEmail) console.log(`   - email: ${conversionData.email}`);
						if (userPhone) console.log(`   - phone_number: ${conversionData.phone_number}`);
						if (userName) {
							console.log(`   - address.first_name: ${conversionData.address.first_name}`);
							console.log(`   - address.last_name: ${conversionData.address.last_name}`);
							console.log(`   - address.country: ${conversionData.address.country}`);
						}
					} else {
						console.log("ℹ️ Conversión ya registrada para esta sesión:", transactionId);
					}
				} else {
					console.warn("gtag no está disponible para tracking de conversión");
				}
			} catch (error) {
				console.error("Error al disparar evento de conversión:", error);
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
			"noopener,noreferrer"
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
									¡Pago Exitoso!
								</CardTitle>
								<p className="text-gray-600 mt-2 text-lg">
									Tu reserva ha sido confirmada
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
									No pudimos verificar la información de tu pago automáticamente.
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
												Recibirás un correo de confirmación con todos los detalles
												de tu reserva
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

						{paymentStatus === "error" && (
							<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
								<p className="text-sm text-yellow-900">
									Si realizaste el pago y ves este mensaje, por favor contáctanos por WhatsApp enviando tu comprobante y te ayudaremos de inmediato.
								</p>
							</div>
						)}

						{/* Botones de acción */}
						<div className="flex flex-col sm:flex-row gap-3 pt-4">
							{paymentStatus === "success" && (
								<>
									<Button
										onClick={handleGoHome}
										className="flex-1"
										size="lg"
									>
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
								<a
									href="tel:+56936643540"
									className="text-chocolate-600 hover:underline"
								>
									📱 +569 3664 3540
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
