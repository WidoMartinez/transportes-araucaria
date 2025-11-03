import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Checkbox } from "./ui/checkbox";
import { LoaderCircle, Calendar, Users } from "lucide-react";
import heroVan from "../assets/hero-van.png";
import flow from "../assets/formasPago/flow.png";
import CodigoDescuento from "./CodigoDescuento";
import { getBackendUrl } from "../lib/backend";

function HeroExpress({
	formData,
	handleInputChange,
	origenes,
	destinos,
	maxPasajeros,
	minDateTime,
	phoneError,
	setPhoneError,
	isSubmitting,
	cotizacion,
	pricing,
	baseDiscountRate,
	promotionDiscountRate,
	handlePayment,
	loadingGateway,
	onSubmitWizard,
	validarTelefono,
	codigoAplicado,
	codigoError,
	validandoCodigo,
	onAplicarCodigo,
	onRemoverCodigo,
}) {
	const [currentStep, setCurrentStep] = useState(0);
	const [stepError, setStepError] = useState("");
	const [showBookingModule, setShowBookingModule] = useState(false);
	const [paymentConsent, setPaymentConsent] = useState(false);
	const [selectedPaymentType, setSelectedPaymentType] = useState(null); // 'abono' o 'total'
	const [reservaActiva, setReservaActiva] = useState(null); // Reserva activa sin pagar encontrada
	const [verificandoReserva, setVerificandoReserva] = useState(false);

	// Pasos simplificados para flujo express
	const steps = useMemo(
		() => [
			{
				title: "¿A dónde viajas?",
				description: "Origen, destino, fecha y pasajeros",
				icon: "🚐",
			},
			{
				title: "Datos y pago",
				description: "Tu información y pago seguro",
				icon: "💳",
			},
		],
		[]
	);

	const progressValue = useMemo(() => {
		const safeStep = Math.min(currentStep, steps.length - 1);
		return Math.round(((safeStep + 1) / steps.length) * 100);
	}, [currentStep, steps.length]);

	const currencyFormatter = useMemo(
		() =>
			new Intl.NumberFormat("es-CL", {
				style: "currency",
				currency: "CLP",
			}),
		[]
	);

	const formatCurrency = (value) => currencyFormatter.format(value || 0);

	// Datos calculados
	const origenFinal =
		formData.origen === "Otro"
			? formData.otroOrigen || "Por confirmar"
			: formData.origen || "Por confirmar";
	const destinoFinal =
		formData.destino === "Otro"
			? formData.otroDestino || "Por confirmar"
			: formData.destino || "Por confirmar";

	const fechaLegible = useMemo(() => {
		if (!formData.fecha) return "Por confirmar";
		const parsed = new Date(`${formData.fecha}T00:00:00`);
		if (Number.isNaN(parsed.getTime())) return formData.fecha;
		return parsed.toLocaleDateString("es-CL", {
			dateStyle: "long",
			timeZone: "America/Santiago",
		});
	}, [formData.fecha]);

	const tieneCotizacionAutomatica = typeof cotizacion.precio === "number";
	const requiereCotizacionManual =
		formData.destino === "Otro" ||
		(formData.destino && !tieneCotizacionAutomatica);
	const mostrarPrecio = tieneCotizacionAutomatica;

	// Verificar si el email tiene una reserva activa sin pagar
	const verificarReservaActiva = async (email) => {
		if (!email || !email.trim()) {
			setReservaActiva(null);
			return;
		}

		setVerificandoReserva(true);
		try {
			const apiUrl =
				getBackendUrl() || "https://transportes-araucaria.onrender.com";
			const response = await fetch(
				`${apiUrl}/api/reservas/verificar-activa/${encodeURIComponent(
					email.trim()
				)}`
			);

			if (response.ok) {
				const data = await response.json();
				if (data.tieneReservaActiva) {
					setReservaActiva(data.reserva);
					console.log("⚠️ Se encontró reserva activa sin pagar:", data.reserva);
				} else {
					setReservaActiva(null);
				}
			}
		} catch (error) {
			console.error("Error verificando reserva activa:", error);
			// No mostramos error al usuario, simplemente continuamos
			setReservaActiva(null);
		} finally {
			setVerificandoReserva(false);
		}
	};

	// Validaciones del primer paso (mínimas)
	const handleStepOneNext = () => {
		if (!formData.origen?.trim()) {
			setStepError("Selecciona el origen de tu viaje.");
			return;
		}

		if (!formData.destino) {
			setStepError("Selecciona un destino para continuar.");
			return;
		}

		if (!formData.fecha) {
			setStepError("Selecciona la fecha de tu traslado.");
			return;
		}

		// Validar que la fecha no sea pasada
		const fechaSeleccionada = new Date(`${formData.fecha}T00:00:00`);
		const hoy = new Date();
		hoy.setHours(0, 0, 0, 0);

		if (fechaSeleccionada < hoy) {
			setStepError("La fecha no puede ser anterior a hoy.");
			return;
		}

		// Validar ida y vuelta si está seleccionado
		if (formData.idaVuelta) {
			if (!formData.fechaRegreso) {
				setStepError(
					"Selecciona la fecha de regreso para tu viaje de ida y vuelta."
				);
				return;
			}

			const fechaRegreso = new Date(`${formData.fechaRegreso}T00:00:00`);
			if (fechaRegreso < fechaSeleccionada) {
				setStepError(
					"La fecha de regreso no puede ser anterior a la fecha de ida."
				);
				return;
			}
		}

		setStepError("");
		setCurrentStep(1);
	};

	// Validar datos antes de guardar o pagar
	const validarDatosReserva = () => {
		if (!formData.nombre?.trim()) {
			setStepError("Ingresa tu nombre completo.");
			return false;
		}

		if (!formData.email?.trim()) {
			setStepError("Ingresa tu correo electrónico.");
			return false;
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(formData.email)) {
			setStepError("El correo electrónico no es válido.");
			return false;
		}

		if (!formData.telefono?.trim()) {
			setStepError("Ingresa tu teléfono móvil.");
			return false;
		}

		// Validación suave del teléfono (no bloquea el proceso)
		if (!validarTelefono(formData.telefono)) {
			setPhoneError("Verifica el formato del teléfono (ej: +56 9 1234 5678)");
		} else {
			setPhoneError("");
		}

		if (!paymentConsent) {
			setStepError("Debes aceptar los términos para continuar.");
			return false;
		}

		setStepError("");
		return true;
	};

	// Guardar reserva para continuar después (sin pago inmediato)
	const handleGuardarReserva = async () => {
		if (!validarDatosReserva()) {
			return;
		}

		// Procesar la reserva express (sin pago)
		const result = await onSubmitWizard();

		if (!result.success) {
			if (result.message) {
				setStepError(`Error: ${result.message}`);
			} else {
				setStepError("Ocurrió un error. Por favor, inténtalo de nuevo.");
			}
			return;
		}

		// Mostrar mensaje de éxito
		alert(
			"✅ Reserva guardada exitosamente. Te hemos enviado la confirmación por email. Podrás completar el pago más tarde usando el enlace que te enviamos."
		);
	};

	// Procesar pago (guarda reserva primero y luego redirige a pago)
	const handleProcesarPago = async (gateway, type) => {
		if (!validarDatosReserva()) {
			return;
		}

		// Primero guardar la reserva
		const result = await onSubmitWizard();

		if (!result.success) {
			if (result.message) {
				setStepError(`Error: ${result.message}`);
			} else {
				setStepError("Ocurrió un error. Por favor, inténtalo de nuevo.");
			}
			return;
		}

		// Si la reserva se guardó exitosamente, proceder con el pago usando los identificadores frescos
		handlePayment(gateway, type, {
			reservaId: result.reservaId,
			codigoReserva: result.codigoReserva,
		});
	};

	const handleStepBack = () => {
		setCurrentStep((prev) => Math.max(prev - 1, 0));
	};

	// Opciones de pago simplificadas
	const paymentOptions = useMemo(
		() => [
			{
				id: "abono",
				type: "abono",
				title: "Reservar con 40%",
				subtitle: "Paga el resto al llegar",
				amount: pricing.abono,
				recommended: true,
			},
			{
				id: "total",
				type: "total",
				title: "Pagar el 100%",
				subtitle: "Descuento completo aplicado",
				amount: pricing.totalConDescuento,
			},
		],
		[pricing.abono, pricing.totalConDescuento]
	);

	const paymentMethods = useMemo(
		() => [
			{
				id: "flow",
				gateway: "flow",
				title: "Flow",
				subtitle: "Webpay • Tarjetas • Transferencia",
				image: flow,
			},
		],
		[]
	);

	const baseDiscountPercentage = Math.round((baseDiscountRate || 0) * 100);
	const promoDiscountPercentage = Math.round(
		(promotionDiscountRate || 0) * 100
	);

	// Validar si todos los campos obligatorios del paso 2 están completos
	const todosLosCamposCompletos = useMemo(() => {
		if (currentStep !== 1) return false;

		const nombreValido = formData.nombre?.trim().length > 0;
		const emailValido =
			formData.email?.trim().length > 0 &&
			/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
		const telefonoValido = formData.telefono?.trim().length > 0;
		const consentimientoValido = paymentConsent;

		return (
			nombreValido && emailValido && telefonoValido && consentimientoValido
		);
	}, [
		currentStep,
		formData.nombre,
		formData.email,
		formData.telefono,
		paymentConsent,
	]);

	return (
		<section
			id="inicio"
			className="relative bg-white min-h-screen flex items-center"
		>
			<div className="relative container mx-auto px-4 pt-20 md:pt-24 pb-16 md:pb-20">
				{!showBookingModule && (
					<div className="max-w-2xl">
						<h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
							Viaja a cualquier lugar con Transportes Araucanía
						</h1>
						<p className="text-base md:text-lg mb-8 text-gray-600">
							Traslados privados desde el Aeropuerto La Araucanía hacia Pucón,
							Villarrica, Malalcahuello y todos los destinos de la región.
						</p>
					</div>
				)}

				{!showBookingModule && (
					<div className="flex flex-col items-start space-y-4 max-w-2xl">
						<Button
							onClick={() => setShowBookingModule(true)}
							className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-6 text-lg font-medium rounded-lg transition-colors"
						>
							Reservar traslado
						</Button>
						<Button
							variant="ghost"
							className="text-gray-700 hover:bg-gray-100"
							asChild
						>
							<a href="#consultar-reserva">Continuar con código de reserva</a>
						</Button>
					</div>
				)}

				{showBookingModule && (
					<div className="w-full max-w-2xl">
						<Card className="bg-white shadow-lg border-0 rounded-2xl">
							<CardHeader className="space-y-3 pb-4">
								<div className="flex items-center justify-between">
									<Button
										variant="ghost"
										size="sm"
										onClick={() => setShowBookingModule(false)}
										className="text-gray-600 hover:text-gray-900 -ml-2"
									>
										← Volver
									</Button>
									{baseDiscountPercentage > 0 && (
										<span className="text-sm text-gray-600">
											Descuento web {baseDiscountPercentage}% incluido
										</span>
									)}
								</div>
							</CardHeader>

							<CardContent className="space-y-5 px-6 pb-6">
								{/* PASO 1: Información básica del viaje */}
								{currentStep === 0 && (
									<div className="space-y-4">
										<div className="space-y-1">
											<Label
												htmlFor="origen-express"
												className="text-sm font-normal text-gray-700"
											>
												Punto de partida
											</Label>
											<select
												id="origen-express"
												name="origen"
												value={formData.origen}
												onChange={handleInputChange}
												className="flex h-14 w-full items-center justify-between rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
												required
											>
												{origenes.map((origen) => (
													<option key={origen} value={origen}>
														{origen}
													</option>
												))}
											</select>
										</div>

										<div className="space-y-1">
											<Label
												htmlFor="destino-express"
												className="text-sm font-normal text-gray-700"
											>
												Entrega
											</Label>
											<select
												id="destino-express"
												name="destino"
												value={formData.destino}
												onChange={handleInputChange}
												className="flex h-14 w-full items-center justify-between rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
												required
											>
												<option value="">Seleccionar destino</option>
												{destinos.map((d) => (
													<option key={d} value={d}>
														{d}
													</option>
												))}
											</select>
										</div>

										<div className="grid grid-cols-2 gap-4">
											<div className="space-y-1">
												<Label
													htmlFor="fecha-express"
													className="text-sm font-normal text-gray-700"
												>
													Fecha
												</Label>
												<Input
													id="fecha-express"
													type="date"
													name="fecha"
													value={formData.fecha}
													onChange={handleInputChange}
													min={minDateTime}
													className="h-14 text-base rounded-lg border-gray-300 bg-gray-50 focus:ring-2 focus:ring-gray-900"
													required
												/>
											</div>

											<div className="space-y-1">
												<Label
													htmlFor="pasajeros-express"
													className="text-sm font-normal text-gray-700"
												>
													Pasajeros
												</Label>
												<select
													id="pasajeros-express"
													name="pasajeros"
													value={formData.pasajeros}
													onChange={handleInputChange}
													className="flex h-14 w-full items-center justify-between rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
													required
												>
													{[...Array(maxPasajeros)].map((_, i) => (
														<option key={i + 1} value={i + 1}>
															{i + 1}
														</option>
													))}
												</select>
											</div>
										</div>

										{/* Opción de ida y vuelta */}
										<div className="flex items-center gap-2 py-2">
											<Checkbox
												id="ida-vuelta-express"
												checked={formData.idaVuelta}
												onCheckedChange={(value) => {
													const isRoundTrip = Boolean(value);
													handleInputChange({
														target: { name: "idaVuelta", value: isRoundTrip },
													});
													if (!isRoundTrip) {
														handleInputChange({
															target: { name: "fechaRegreso", value: "" },
														});
													} else if (formData.fecha) {
														handleInputChange({
															target: {
																name: "fechaRegreso",
																value: formData.fecha,
															},
														});
													}
												}}
											/>
											<label
												htmlFor="ida-vuelta-express"
												className="text-sm text-gray-700 cursor-pointer"
											>
												Agregar viaje de regreso
											</label>
										</div>

										{formData.idaVuelta && (
											<div className="space-y-1 pl-6 border-l-2 border-gray-200">
												<Label
													htmlFor="fecha-regreso-express"
													className="text-sm font-normal text-gray-700"
												>
													Fecha de regreso
												</Label>
												<Input
													id="fecha-regreso-express"
													type="date"
													name="fechaRegreso"
													value={formData.fechaRegreso}
													onChange={handleInputChange}
													min={formData.fecha || minDateTime}
													className="h-14 text-base rounded-lg border-gray-300 bg-gray-50 focus:ring-2 focus:ring-gray-900"
													required={formData.idaVuelta}
												/>
											</div>
										)}

										{/* Precio estimado */}
										{mostrarPrecio ? (
											<div className="bg-gray-50 rounded-lg p-4 space-y-2">
												<div className="flex items-center justify-between">
													<span className="text-sm text-gray-600">
														Precio estimado
													</span>
													<span className="text-xl font-semibold text-gray-900">
														{formatCurrency(pricing.totalConDescuento)}
													</span>
												</div>
												{pricing.descuentoBase > 0 && (
													<p className="text-xs text-gray-500">
														Incluye descuento web del {baseDiscountPercentage}%
													</p>
												)}
											</div>
										) : (
											<div className="bg-gray-50 rounded-lg p-4 text-center">
												<p className="text-sm text-gray-700">
													Te enviaremos una cotización personalizada
												</p>
											</div>
										)}

										<div className="pt-2">
											<Button
												type="button"
												onClick={handleStepOneNext}
												className="w-full bg-gray-900 hover:bg-gray-800 text-white h-14 text-base font-medium rounded-lg transition-colors"
												disabled={isSubmitting}
											>
												Ver precios
											</Button>
										</div>
									</div>
								)}

								{/* PASO 2: Datos personales y pago */}
								{currentStep === 1 && (
									<div className="space-y-4">
										{/* Resumen compacto del viaje */}
										<div className="bg-gray-50 rounded-lg p-4">
											<div className="flex items-center justify-between text-sm">
												<span className="text-gray-600">
													{origenFinal} → {destinoFinal}
												</span>
												{mostrarPrecio && (
													<span className="font-semibold text-gray-900">
														{formatCurrency(pricing.totalConDescuento)}
													</span>
												)}
											</div>
											<div className="mt-1 text-xs text-gray-500">
												{fechaLegible} · {formData.pasajeros}{" "}
												{formData.pasajeros === "1" ? "pasajero" : "pasajeros"}
											</div>
										</div>

										{/* Datos personales */}
										<div className="space-y-3">
											<div className="space-y-1">
												<Label
													htmlFor="nombre-express"
													className="text-sm font-normal text-gray-700"
												>
													Nombre completo
												</Label>
												<Input
													id="nombre-express"
													name="nombre"
													value={formData.nombre}
													onChange={handleInputChange}
													placeholder="Ej: Juan Pérez"
													className="h-14 text-base rounded-lg border-gray-300 bg-gray-50 focus:ring-2 focus:ring-gray-900"
													required
												/>
											</div>

											<div className="space-y-1">
												<Label
													htmlFor="email-express"
													className="text-sm font-normal text-gray-700"
												>
													Correo electrónico
												</Label>
												<Input
													id="email-express"
													type="email"
													name="email"
													value={formData.email}
													onChange={handleInputChange}
													onBlur={(e) => verificarReservaActiva(e.target.value)}
													placeholder="tu@email.cl"
													className="h-14 text-base rounded-lg border-gray-300 bg-gray-50 focus:ring-2 focus:ring-gray-900"
													required
												/>
												{verificandoReserva && (
													<p className="text-xs text-gray-500 flex items-center gap-1">
														<LoaderCircle className="w-3 h-3 animate-spin" />
														Verificando...
													</p>
												)}
												{reservaActiva && (
													<div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
														Ya tienes una reserva pendiente (Código:{" "}
														{reservaActiva.codigoReserva})
													</div>
												)}
											</div>

											<div className="space-y-1">
												<Label
													htmlFor="telefono-express"
													className="text-sm font-normal text-gray-700"
												>
													Teléfono
												</Label>
												<Input
													id="telefono-express"
													name="telefono"
													value={formData.telefono}
													onChange={handleInputChange}
													placeholder="+56 9 1234 5678"
													className="h-14 text-base rounded-lg border-gray-300 bg-gray-50 focus:ring-2 focus:ring-gray-900"
													required
												/>
												{phoneError && (
													<p className="text-xs text-amber-600">{phoneError}</p>
												)}
											</div>
										</div>

										{/* Código de descuento - más discreto */}
										<details className="group">
											<summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-900 flex items-center gap-2">
												<span>¿Tienes un código de descuento?</span>
												<span className="text-xs group-open:rotate-180 transition-transform">
													▼
												</span>
											</summary>
											<div className="mt-3 pt-3 border-t border-gray-200">
												<CodigoDescuento
													codigoAplicado={codigoAplicado}
													codigoError={codigoError}
													validandoCodigo={validandoCodigo}
													onAplicarCodigo={onAplicarCodigo}
													onRemoverCodigo={onRemoverCodigo}
												/>
											</div>
										</details>

										{/* Opciones de pago simplificadas */}
										{mostrarPrecio &&
											!requiereCotizacionManual &&
											todosLosCamposCompletos && (
												<div className="space-y-3">
													{!selectedPaymentType ? (
														<div className="space-y-2">
															{paymentOptions.map((option) => (
																<button
																	key={option.id}
																	type="button"
																	onClick={() =>
																		setSelectedPaymentType(option.type)
																	}
																	className="w-full border border-gray-300 rounded-lg p-4 text-left hover:border-gray-900 transition-colors"
																>
																	<div className="flex justify-between items-center">
																		<div>
																			<p className="font-medium text-gray-900">
																				{option.title}
																			</p>
																			<p className="text-sm text-gray-600">
																				{option.subtitle}
																			</p>
																		</div>
																		<p className="text-lg font-semibold text-gray-900">
																			{formatCurrency(option.amount)}
																		</p>
																	</div>
																</button>
															))}
														</div>
													) : (
														<div className="space-y-3">
															<div className="flex items-center justify-between text-sm">
																<span className="text-gray-600">
																	Pagarás:{" "}
																	{formatCurrency(
																		paymentOptions.find(
																			(opt) => opt.type === selectedPaymentType
																		)?.amount || 0
																	)}
																</span>
																<button
																	type="button"
																	onClick={() => setSelectedPaymentType(null)}
																	className="text-gray-900 hover:underline"
																>
																	Cambiar
																</button>
															</div>

															{paymentMethods.map((method) => (
																<Button
																	key={method.id}
																	type="button"
																	onClick={() =>
																		handleProcesarPago(
																			method.gateway,
																			selectedPaymentType
																		)
																	}
																	disabled={
																		isSubmitting ||
																		loadingGateway ===
																			`${method.gateway}-${selectedPaymentType}`
																	}
																	className="w-full bg-gray-900 hover:bg-gray-800 text-white h-14 rounded-lg transition-colors"
																>
																	{loadingGateway ===
																	`${method.gateway}-${selectedPaymentType}` ? (
																		<>
																			<LoaderCircle className="mr-2 h-5 w-5 animate-spin" />
																			Procesando...
																		</>
																	) : (
																		`Confirmar y pagar con ${method.title}`
																	)}
																</Button>
															))}
														</div>
													)}
												</div>
											)}

										{/* Consentimiento */}
										<div className="flex items-start gap-2 py-2">
											<Checkbox
												id="payment-consent"
												checked={paymentConsent}
												onCheckedChange={(value) =>
													setPaymentConsent(Boolean(value))
												}
											/>
											<label
												htmlFor="payment-consent"
												className="text-xs text-gray-600 leading-relaxed cursor-pointer"
											>
												Acepto recibir confirmación por email y WhatsApp
											</label>
										</div>

										{/* Navegación */}
										<div className="flex items-center justify-between pt-2">
											<Button
												type="button"
												variant="ghost"
												onClick={handleStepBack}
												disabled={isSubmitting}
												className="text-gray-600"
											>
												← Volver
											</Button>

											{requiereCotizacionManual ? (
												<Button asChild variant="ghost">
													<a href="#contacto">Solicitar cotización</a>
												</Button>
											) : !todosLosCamposCompletos ? (
												<span className="text-xs text-gray-500">
													Completa todos los campos
												</span>
											) : (
												<Button
													type="button"
													onClick={handleGuardarReserva}
													disabled={isSubmitting}
													variant="ghost"
													className="text-gray-600"
												>
													{isSubmitting ? (
														<>
															<LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
															Guardando...
														</>
													) : (
														"Guardar para después"
													)}
												</Button>
											)}
										</div>
									</div>
								)}

								{stepError && (
									<div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
										⚠️ {stepError}
									</div>
								)}
							</CardContent>
						</Card>
					</div>
				)}
			</div>
		</section>
	);
}

export default HeroExpress;
