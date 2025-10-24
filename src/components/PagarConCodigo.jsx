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
	const [selectedPaymentType, setSelectedPaymentType] = useState("total"); // 'total' | 'abono'

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
		direccionDestino: "",
		direccionOrigen: "",
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

	const montoTotal = codigoValidado ? Number(codigoValidado.monto) || 0 : 0;
	const abonoSugerido = codigoValidado
		? Math.max(Math.round(montoTotal * 0.4), 0)
		: 0;
	const saldoPendiente = Math.max(montoTotal - abonoSugerido, 0);
	const montoSeleccionado =
		selectedPaymentType === "abono" ? abonoSugerido : montoTotal;

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
			setSelectedPaymentType("total");
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
		if (!formData.fecha) {
			setError("Por favor selecciona la fecha del servicio");
			return false;
		}
		if (!formData.hora) {
			setError("Por favor selecciona la hora del servicio");
			return false;
		}
		// Validar dirección obligatoria según sentido del viaje
		if (codigoValidado) {
			if (
				codigoValidado.origen === "Aeropuerto La Araucanía" &&
				!formData.direccionDestino.trim()
			) {
				setError("Por favor ingresa la dirección de destino");
				return false;
			}
			if (
				codigoValidado.destino === "Aeropuerto La Araucanía" &&
				!formData.direccionOrigen.trim()
			) {
				setError("Por favor ingresa la dirección de origen");
				return false;
			}
		}
		setError("");
		return true;
	};

	// Pago con código: crea reserva express y genera link de Flow
	// IMPORTANTE: El backend debe mantener la reserva en estado 'pendiente' hasta recibir la confirmación de pago exitosa desde Flow.
	// No debe cambiar el estado a 'confirmada' antes de recibir el webhook/callback de Flow.
	const procesarPagoConCodigoFlow = async () => {
		if (!validarDatos() || !codigoValidado) return;
		setProcesando(true);
		setLoadingGateway("flow");
		setError("");

		if (!montoSeleccionado || montoSeleccionado <= 0) {
			setError(
				"El monto a pagar no es válido. Contacta a soporte para obtener ayuda."
			);
			setProcesando(false);
			setLoadingGateway(null);
			return;
		}

		const descripcionPago =
			selectedPaymentType === "abono"
				? `Abono 40% - Código ${codigoValidado.codigo}`
				: `Pago total - Código ${codigoValidado.codigo}`;

		try {
			const reservaPayload = {
				nombre: formData.nombre,
				email: formData.email,
				telefono: formData.telefono,
				origen: codigoValidado.origen,
				destino: codigoValidado.destino,
				// Estado inicial: pendiente hasta confirmar el pago
				estado: "pendiente",
				estadoPago: "pendiente",
				// Usar fecha y hora proporcionadas por el cliente (enviar solo si existen)
				fecha: formData.fecha,
				// hora se añade condicionalmente más abajo
				pasajeros: codigoValidado.pasajeros || 1,
				precio: montoTotal,
				totalConDescuento: montoTotal,
				vehiculo: codigoValidado.vehiculo || "Por asignar",
				numeroVuelo: formData.numeroVuelo,
				hotel: formData.hotel,
				mensaje: formData.mensaje,
				idaVuelta: !!codigoValidado.idaVuelta,
				referenciaPago: codigoValidado.codigo,
				source: "codigo_pago",
				abonoSugerido: selectedPaymentType === "abono" ? abonoSugerido : 0,
				saldoPendiente:
					selectedPaymentType === "abono" ? saldoPendiente : montoTotal,
				tipoPago: selectedPaymentType,
			};

			// Añadir hora solo si el usuario la proporcionó
			if (formData.hora && formData.hora.trim()) {
				reservaPayload.hora = formData.hora;
			}

			const r = await fetch(`${backendUrl}/enviar-reserva-express`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(reservaPayload),
			});
			const rj = await r.json();
			if (!r.ok || rj.success === false) {
				throw new Error(rj.message || "No se pudo crear la reserva");
			}

			// NOTA: no llamamos a `/completar-reserva-detalles/:id` desde el frontend porque
			// ese endpoint en el backend marca la reserva como 'confirmada'. El backend
			// debe marcar confirmada solo cuando reciba el webhook/callback de pago.
			// Simplemente registramos el ID de reserva si existe y seguimos con el flujo
			// de pago (no bloquear el proceso).
			const reservaId = rj.reservaId || rj.reserva?.id || null;
			const codigoReservaGenerado =
				rj.codigoReserva ||
				rj.codigo_reserva ||
				rj.reserva?.codigoReserva ||
				null;
			const codigoPagoNormalizado = (codigoValidado.codigo || "")
				.toString()
				.toUpperCase();
			if (reservaId) {
				console.log(
					"Reserva creada (detalles pendientes) ID:",
					reservaId,
					"- no se llamará a completar-reserva-detalles desde frontend"
				);
			}

			const description = `Traslado ${codigoValidado.origen} - ${codigoValidado.destino}`;
			const p = await fetch(`${backendUrl}/create-payment`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					gateway: "flow",
					amount: parseFloat(montoSeleccionado),
					description: `${description} • ${descripcionPago}`,
					email: formData.email,
					reservaId,
					codigoReserva: codigoReservaGenerado,
					tipoPago: selectedPaymentType,
					referenciaPago: codigoPagoNormalizado,
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

											{/* Dirección obligatoria según sentido del viaje */}
											{codigoValidado?.origen === "Aeropuerto La Araucanía" && (
												<div className="space-y-2 md:col-span-2">
													<Label htmlFor="direccionDestino">
														Dirección de destino{" "}
														<span className="text-red-500">*</span>
													</Label>
													<Input
														id="direccionDestino"
														name="direccionDestino"
														value={formData.direccionDestino}
														onChange={handleInputChange}
														placeholder="Ej: Av. Alemania 1234, Temuco"
														required
													/>
												</div>
											)}
											{codigoValidado?.destino ===
												"Aeropuerto La Araucanía" && (
												<div className="space-y-2 md:col-span-2">
													<Label htmlFor="direccionOrigen">
														Dirección de origen{" "}
														<span className="text-red-500">*</span>
													</Label>
													<Input
														id="direccionOrigen"
														name="direccionOrigen"
														value={formData.direccionOrigen}
														onChange={handleInputChange}
														placeholder="Ej: Av. O'Higgins 567, Temuco"
														required
													/>
												</div>
											)}
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

									{/* Selección del monto a pagar */}
									<div className="space-y-3">
										<h4 className="font-semibold text-lg">Monto a pagar</h4>
										<p className="text-sm text-muted-foreground">
											Elige si deseas pagar la totalidad o abonar el 40% para
											reservar tu traslado.
										</p>
										<div className="grid gap-3 md:grid-cols-2">
											<Button
												type="button"
												variant="outline"
												onClick={() => setSelectedPaymentType("abono")}
												disabled={procesando || abonoSugerido <= 0}
												className={`h-auto p-4 flex flex-col items-start gap-1 text-left transition-all ${
													selectedPaymentType === "abono"
														? "border-primary bg-primary/5 shadow-md"
														: "border-gray-200"
												}`}
											>
												<span className="text-sm font-semibold">
													Abonar 40%
												</span>
												<span className="text-xl font-bold text-primary">
													{formatCurrency(abonoSugerido)}
												</span>
												<span className="text-xs text-muted-foreground">
													Reserva tu viaje pagando una parte ahora
												</span>
											</Button>
											<Button
												type="button"
												variant="outline"
												onClick={() => setSelectedPaymentType("total")}
												disabled={procesando || montoTotal <= 0}
												className={`h-auto p-4 flex flex-col items-start gap-1 text-left transition-all ${
													selectedPaymentType === "total"
														? "border-primary bg-primary/5 shadow-md"
														: "border-gray-200"
												}`}
											>
												<span className="text-sm font-semibold">
													Pagar 100%
												</span>
												<span className="text-xl font-bold text-primary">
													{formatCurrency(montoTotal)}
												</span>
												<span className="text-xs text-muted-foreground">
													Completa el pago total del servicio
												</span>
											</Button>
										</div>
										<p className="text-sm text-muted-foreground">
											Pagarás ahora:{" "}
											<span className="font-semibold text-gray-900">
												{formatCurrency(montoSeleccionado)}
											</span>
										</p>
										{selectedPaymentType === "abono" && (
											<p className="text-xs text-amber-600">
												Saldo pendiente al momento del servicio:{" "}
												{formatCurrency(saldoPendiente)}
											</p>
										)}
									</div>

									{/* Métodos de pago */}
									<div className="space-y-4">
										<h4 className="font-semibold text-lg">Método de pago</h4>
										<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
											<Button
												type="button"
												variant="outline"
												onClick={procesarPagoConCodigoFlow}
												disabled={
													procesando ||
													!montoSeleccionado ||
													montoSeleccionado <= 0
												}
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
												<span className="text-xs text-gray-600 font-semibold">
													Monto: {formatCurrency(montoSeleccionado)}
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
												setSelectedPaymentType("total");
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
