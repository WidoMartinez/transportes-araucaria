import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { LoaderCircle, CheckCircle, AlertCircle } from "lucide-react";
import flow from "../assets/formasPago/flow.png";
import { getBackendUrl } from "../lib/backend";

// Componente para pagar usando un código de pago estandarizado
function PagarConCodigo() {
	const [codigo, setCodigo] = useState("");
	const [validando, setValidando] = useState(false);
	const [codigoValidado, setCodigoValidado] = useState(null);
	const [error, setError] = useState("");
	const [step, setStep] = useState(1); // 1: Validar código, 2: Completar datos, 3: Pagar

	// Datos del cliente
	const [formData, setFormData] = useState({
		nombre: "",
		email: "",
		telefono: "",
		fecha: "",
		hora: "",
		numeroVuelo: "",
		hotel: "",
		mensaje: "",
	});

	const [procesando, setProcesando] = useState(false);
	const [loadingGateway, setLoadingGateway] = useState(null);

	const backendUrl = getBackendUrl();

	const formatCurrency = (value) => {
		return new Intl.NumberFormat("es-CL", {
			style: "currency",
			currency: "CLP",
		}).format(value || 0);
	};

	// Validar el código de pago
	const validarCodigo = async () => {
		if (!codigo.trim()) {
			setError("Por favor ingresa un código de pago");
			return;
		}

		setValidando(true);
		setError("");

		try {
			const response = await fetch(
				`${backendUrl}/api/codigos-pago/${codigo.toUpperCase()}`
			);

			const data = await response.json();

			if (!response.ok) {
				setError(data.message || "Código inválido");
				setCodigoValidado(null);
				return;
			}

			setCodigoValidado(data.codigoPago);
			setStep(2);
		} catch (error) {
			console.error("Error validando código:", error);
			setError("Error al validar el código. Intenta nuevamente.");
		} finally {
			setValidando(false);
		}
	};

	// Manejar cambios en el formulario
	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	// Validar datos del formulario
	const validarDatos = () => {
		if (!formData.nombre.trim()) {
			setError("Por favor ingresa tu nombre completo");
			return false;
		}

		if (!formData.email.trim()) {
			setError("Por favor ingresa tu correo electrónico");
			return false;
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(formData.email)) {
			setError("El correo electrónico no es válido");
			return false;
		}

		if (!formData.telefono.trim()) {
			setError("Por favor ingresa tu teléfono");
			return false;
		}

		// Validar fecha y hora del viaje para poder coordinar la recogida
		if (!formData.fecha) {
			setError("Por favor selecciona la fecha del servicio");
			return false;
		}

		if (!formData.hora) {
			setError("Por favor selecciona la hora del servicio");
			return false;
		}

		setError("");
		return true;
	};

	// Pago con código: crea reserva express y genera link de Flow
	const procesarPagoConCodigoFlow = async () => {
		if (!validarDatos() || !codigoValidado) return;
		setProcesando(true);
		setLoadingGateway("flow");
		setError("");
		try {
			const reservaPayload = {
				nombre: formData.nombre,
				email: formData.email,
				telefono: formData.telefono,
				origen: codigoValidado.origen,
				destino: codigoValidado.destino,
				// Usar fecha y hora proporcionadas por el cliente
				fecha: formData.fecha || new Date().toISOString().split("T")[0],
				hora: formData.hora || "",
				pasajeros: codigoValidado.pasajeros || 1,
				precio: codigoValidado.monto,
				totalConDescuento: codigoValidado.monto,
				vehiculo: codigoValidado.vehiculo || "Por asignar",
				numeroVuelo: formData.numeroVuelo,
				hotel: formData.hotel,
				mensaje: formData.mensaje,
				idaVuelta: !!codigoValidado.idaVuelta,
				referenciaPago: codigoValidado.codigo,
				source: "codigo_pago",
			};

			const r = await fetch(`${backendUrl}/enviar-reserva-express`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(reservaPayload),
			});
			const rj = await r.json();
			if (!r.ok || rj.success === false) {
				throw new Error(rj.message || "No se pudo crear la reserva");
			}

			// Si la reserva se creó o modificó, intentar actualizar detalles adicionales
			// en caso de que exista una reserva previa que no haya guardado hora/otros campos.
			try {
				const reservaId = rj.reservaId || rj.reserva?.id || null;
				if (reservaId) {
					const detallesPayload = {
						hora: formData.hora || "",
						// Incluir fecha para que el backend la persista (evita discrepancias por conversiones)
						fecha: formData.fecha || "",
						numeroVuelo: formData.numeroVuelo || "",
						hotel: formData.hotel || "",
						equipajeEspecial: formData.mensaje || "",
						sillaInfantil: formData.sillaInfantil || false,
						idaVuelta: !!codigoValidado.idaVuelta,
						fechaRegreso: codigoValidado.fechaRegreso || null,
						horaRegreso: codigoValidado.horaRegreso || null,
					};

					const upd = await fetch(
						`${backendUrl}/completar-reserva-detalles/${reservaId}`,
						{
							method: "PUT",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify(detallesPayload),
						}
					);

					if (!upd.ok) {
						// No bloquear el flujo de pago si la actualización de detalles falla
						console.warn(
							"No se pudo actualizar detalles de la reserva:",
							await upd.text().catch(() => "")
						);
					} else {
						console.log(
							"Detalles de reserva actualizados correctamente para ID:",
							reservaId
						);
					}
				}
			} catch (err) {
				console.error(
					"Error actualizando detalles de reserva (no crítico):",
					err
				);
			}

			const description = `Traslado ${codigoValidado.origen} - ${codigoValidado.destino}`;
			const p = await fetch(`${backendUrl}/create-payment`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					gateway: "flow",
					amount: parseFloat(codigoValidado.monto),
					description,
					email: formData.email,
				}),
			});
			const pj = await p.json();
			if (p.ok && pj.url) {
				window.location.href = pj.url;
			} else {
				throw new Error(pj.message || "No se pudo generar el enlace de pago");
			}
		} catch (e) {
			setError(e.message || "Error al procesar el pago.");
		} finally {
			setProcesando(false);
			setLoadingGateway(null);
		}
	};

	return (
		<section className="py-16 bg-gradient-to-b from-gray-50 to-white">
			<div className="container mx-auto px-4">
				<div className="max-w-3xl mx-auto">
					<div className="text-center mb-8">
						<h2 className="text-3xl font-bold text-gray-900 mb-3">
							Pagar con Código
						</h2>
						<p className="text-gray-600">
							Ingresa el código que recibiste por WhatsApp para completar tu
							pago
						</p>
					</div>

					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								{step === 1 && "🔍 Paso 1: Validar Código"}
								{step === 2 && "📋 Paso 2: Completar Datos"}
								{step === 3 && "💳 Paso 3: Realizar Pago"}
							</CardTitle>
						</CardHeader>

						<CardContent className="space-y-6">
							{/* Paso 1: Validar código */}
							{step === 1 && (
								<div className="space-y-4">
									<div>
										<Label htmlFor="codigo" className="text-base font-medium">
											Código de Pago
										</Label>
										<p className="text-sm text-gray-500 mb-2">
											Ejemplo: A-TCO-25, P-VLL-30, etc.
										</p>
										<div className="flex gap-2">
											<Input
												id="codigo"
												type="text"
												value={codigo}
												onChange={(e) =>
													setCodigo(e.target.value.toUpperCase())
												}
												placeholder="Ingresa tu código"
												className="text-lg font-mono uppercase"
												disabled={validando}
											/>
											<Button
												onClick={validarCodigo}
												disabled={validando || !codigo.trim()}
												className="px-6"
											>
												{validando ? (
													<LoaderCircle className="h-5 w-5 animate-spin" />
												) : (
													"Validar"
												)}
											</Button>
										</div>
									</div>

									{error && (
										<Alert variant="destructive">
											<AlertCircle className="h-4 w-4" />
											<AlertDescription>{error}</AlertDescription>
										</Alert>
									)}

									<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
										<p className="text-sm text-blue-900">
											<strong>💡 ¿No tienes un código?</strong>
											<br />
											Contacta con nosotros por WhatsApp para obtener tu código
											de pago personalizado.
										</p>
									</div>
								</div>
							)}

							{/* Paso 2: Mostrar resumen y completar datos */}
							{step === 2 && codigoValidado && (
								<div className="space-y-6">
									{/* Resumen del servicio */}
									<div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
										<div className="flex items-start justify-between mb-4">
											<div>
												<h3 className="text-lg font-semibold text-green-900 mb-1">
													✅ Código Validado
												</h3>
												<Badge variant="default" className="text-sm">
													{codigoValidado.codigo}
												</Badge>
											</div>
											<CheckCircle className="h-8 w-8 text-green-600" />
										</div>

										<div className="space-y-3">
											<div className="flex justify-between">
												<span className="text-gray-600">Origen:</span>
												<span className="font-medium">
													{codigoValidado.origen}
												</span>
											</div>
											<div className="flex justify-between">
												<span className="text-gray-600">Destino:</span>
												<span className="font-medium">
													{codigoValidado.destino}
												</span>
											</div>
											{codigoValidado.vehiculo && (
												<div className="flex justify-between">
													<span className="text-gray-600">Vehículo:</span>
													<span className="font-medium">
														{codigoValidado.vehiculo}
													</span>
												</div>
											)}
											<div className="flex justify-between">
												<span className="text-gray-600">Pasajeros:</span>
												<span className="font-medium">
													{codigoValidado.pasajeros}
												</span>
											</div>
											{codigoValidado.idaVuelta && (
												<div className="flex justify-between">
													<span className="text-gray-600">Tipo:</span>
													<Badge variant="default" className="bg-blue-500">
														🔄 Ida y vuelta
													</Badge>
												</div>
											)}
											<div className="pt-3 border-t border-green-200">
												<div className="flex justify-between items-center">
													<span className="text-lg font-semibold text-gray-900">
														Total a Pagar:
													</span>
													<span className="text-2xl font-bold text-green-600">
														{formatCurrency(codigoValidado.monto)}
													</span>
												</div>
											</div>
										</div>

										{codigoValidado.descripcion && (
											<div className="mt-4 pt-4 border-t border-green-200">
												<p className="text-sm text-gray-700">
													{codigoValidado.descripcion}
												</p>
											</div>
										)}
									</div>

									{/* Formulario de datos personales */}
									<div className="space-y-4">
										<h4 className="font-semibold text-lg">
											Completa tus datos
										</h4>

										<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
											<div className="space-y-2">
												<Label htmlFor="nombre">
													Nombre completo{" "}
													<span className="text-red-500">*</span>
												</Label>
												<Input
													id="nombre"
													name="nombre"
													value={formData.nombre}
													onChange={handleInputChange}
													placeholder="Juan Pérez"
													required
												/>
											</div>

											<div className="space-y-2">
												<Label htmlFor="email">
													Correo electrónico{" "}
													<span className="text-red-500">*</span>
												</Label>
												<Input
													id="email"
													name="email"
													type="email"
													value={formData.email}
													onChange={handleInputChange}
													placeholder="tu@email.cl"
													required
												/>
											</div>

											<div className="space-y-2">
												<Label htmlFor="telefono">
													Teléfono <span className="text-red-500">*</span>
												</Label>
												<Input
													id="telefono"
													name="telefono"
													value={formData.telefono}
													onChange={handleInputChange}
													placeholder="+56 9 1234 5678"
													required
												/>
											</div>

											{/* Fecha y hora del servicio */}
											<div className="space-y-2">
												<Label htmlFor="fecha">
													Fecha del servicio{" "}
													<span className="text-red-500">*</span>
												</Label>
												<Input
													id="fecha"
													name="fecha"
													type="date"
													value={formData.fecha}
													onChange={handleInputChange}
													min={new Date().toISOString().split("T")[0]}
													required
												/>
											</div>

											<div className="space-y-2">
												<Label htmlFor="hora">
													Hora del servicio{" "}
													<span className="text-red-500">*</span>
												</Label>
												<Input
													id="hora"
													name="hora"
													type="time"
													value={formData.hora}
													onChange={handleInputChange}
													required
												/>
											</div>

											<div className="space-y-2">
												<Label htmlFor="numeroVuelo">
													Número de vuelo (opcional)
												</Label>
												<Input
													id="numeroVuelo"
													name="numeroVuelo"
													value={formData.numeroVuelo}
													onChange={handleInputChange}
													placeholder="LA1234"
												/>
											</div>

											<div className="space-y-2 md:col-span-2">
												<Label htmlFor="hotel">
													Hotel o alojamiento (opcional)
												</Label>
												<Input
													id="hotel"
													name="hotel"
													value={formData.hotel}
													onChange={handleInputChange}
													placeholder="Hotel Dreams Araucanía"
												/>
											</div>

											<div className="space-y-2 md:col-span-2">
												<Label htmlFor="mensaje">
													Mensaje adicional (opcional)
												</Label>
												<textarea
													id="mensaje"
													name="mensaje"
													value={formData.mensaje}
													onChange={handleInputChange}
													placeholder="Información adicional sobre tu viaje..."
													className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
												/>
											</div>
										</div>
									</div>

									{error && (
										<Alert variant="destructive">
											<AlertCircle className="h-4 w-4" />
											<AlertDescription>{error}</AlertDescription>
										</Alert>
									)}

									{/* Métodos de pago */}
									<div className="space-y-4">
										<h4 className="font-semibold text-lg">Método de pago</h4>
										<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
											<Button
												type="button"
												variant="outline"
												onClick={procesarPagoConCodigoFlow}
												disabled={procesando}
												className="h-auto p-6 flex flex-col items-center gap-3 w-full"
											>
												{loadingGateway === "flow" ? (
													<LoaderCircle className="h-8 w-8 animate-spin" />
												) : (
													<img
														src={flow}
														alt="Flow"
														className="h-8 w-auto object-contain"
													/>
												)}
												<span className="text-sm font-medium">Flow</span>
												<span className="text-xs text-muted-foreground">
													Webpay • Tarjetas • Transferencia
												</span>
											</Button>
										</div>
									</div>

									<div className="flex gap-3">
										<Button
											type="button"
											variant="outline"
											onClick={() => {
												setStep(1);
												setCodigoValidado(null);
												setError("");
											}}
											disabled={procesando}
										>
											← Cambiar código
										</Button>
									</div>
								</div>
							)}
						</CardContent>
					</Card>
				</div>
			</div>
		</section>
	);
}

export default PagarConCodigo;
