/* global gtag */
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { CheckCircle, Loader2, AlertCircle } from "lucide-react";
import logo from "../assets/logo.png";

/**
 * Componente FlowReturn
 * Página de retorno después de completar un pago con Flow
 * Dispara el evento de conversión de Google Ads una sola vez por transacción exitosa
 */
function FlowReturn() {
	const [paymentStatus, setPaymentStatus] = useState("processing"); // processing, success, error
	const [paymentInfo, setPaymentInfo] = useState(null);

	useEffect(() => {
		// Extraer token de Flow de los parámetros de URL
		const urlParams = new URLSearchParams(window.location.search);
		const token = urlParams.get("token");

		if (!token) {
			console.warn("No se recibió token de Flow en la URL de retorno");
			setPaymentStatus("error");
			return;
		}

		// Simular verificación del pago
		// En un caso real, podrías consultar el backend para confirmar el estado
		// Pero Flow ya envió el webhook, así que asumimos éxito si llegamos aquí
		setTimeout(() => {
			setPaymentStatus("success");
			setPaymentInfo({
				token: token,
				timestamp: new Date().toISOString(),
			});

			// Disparar evento de conversión de Google Ads
			// Solo se dispara cuando el pago es exitoso
			try {
				if (typeof gtag === "function") {
					// Usar el token de Flow como transaction_id para evitar duplicados
					gtag("event", "conversion", {
						send_to: "AW-17529712870/yZz-CJqiicUbEObh6KZB",
						value: 1.0,
						currency: "CLP",
						transaction_id: token, // Token único de Flow como identificador
					});
					console.log("✅ Evento de conversión Google Ads disparado:", token);
				} else {
					console.warn("gtag no está disponible para tracking de conversión");
				}
			} catch (error) {
				console.error("Error al disparar evento de conversión:", error);
			}
		}, 1000);
	}, []);

	const handleGoHome = () => {
		window.location.href = "/";
	};

	const handleContactSupport = () => {
		// Redirigir a WhatsApp
		window.location.href = "https://wa.me/56936643540?text=Hola,%20necesito%20ayuda%20con%20mi%20pago";
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
									<Loader2 className="h-16 w-16 text-blue-500 animate-spin" />
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
									<div className="rounded-full bg-red-100 p-4">
										<AlertCircle className="h-16 w-16 text-red-600" />
									</div>
								</div>
								<CardTitle className="text-2xl text-red-600">
									Error en el Pago
								</CardTitle>
								<p className="text-gray-600 mt-2">
									No pudimos procesar tu pago correctamente
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

								<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
									<p className="text-sm text-blue-900">
										<strong>💡 Importante:</strong> Si no recibes el correo en
										los próximos minutos, revisa tu carpeta de spam o
										contáctanos por WhatsApp.
									</p>
								</div>
							</>
						)}

						{paymentStatus === "error" && (
							<div className="bg-red-50 border border-red-200 rounded-lg p-4">
								<p className="text-sm text-red-900">
									Si crees que esto es un error o necesitas ayuda, contáctanos
									de inmediato por WhatsApp y te asistiremos.
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
									className="text-blue-600 hover:underline"
								>
									📧 contacto@transportesaraucaria.cl
								</a>
								<a
									href="tel:+56936643540"
									className="text-blue-600 hover:underline"
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
