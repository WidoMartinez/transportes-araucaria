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
import merPago from "../assets/formasPago/mp.png";
import CodigoDescuento from "./CodigoDescuento";

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
				setStepError("Selecciona la fecha de regreso para tu viaje de ida y vuelta.");
				return;
			}

			const fechaRegreso = new Date(`${formData.fechaRegreso}T00:00:00`);
			if (fechaRegreso < fechaSeleccionada) {
				setStepError("La fecha de regreso no puede ser anterior a la fecha de ida.");
				return;
			}
		}

		setStepError("");
		setCurrentStep(1);
	};

	// Validaciones del segundo paso (solo valida, no crea reserva)
	const validateStepTwo = () => {
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
			setStepError("Debes aceptar los términos para continuar con el pago.");
			return false;
		}

		setStepError("");
		return true;
	};

	// Nueva función para procesar pago después de validar
	const handlePaymentWithReservation = async (gateway, type) => {
		// Primero validar los datos
		if (!validateStepTwo()) {
			return;
		}

		// Crear la reserva ANTES de redirigir al pago
		const result = await onSubmitWizard();

		if (!result.success) {
			if (result.message) {
				setStepError(`Error: ${result.message}`);
			} else {
				setStepError("Ocurrió un error al crear la reserva. Inténtalo de nuevo.");
			}
			return;
		}

		// Si la reserva se creó exitosamente, proceder con el pago
		await handlePayment(gateway, type);
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
			{
				id: "mercadopago",
				gateway: "mercadopago",
				title: "Mercado Pago",
				subtitle: "Tarjetas • Billetera digital",
				image: merPago,
			},
		],
		[]
	);

	const baseDiscountPercentage = Math.round((baseDiscountRate || 0) * 100);
	const promoDiscountPercentage = Math.round(
		(promotionDiscountRate || 0) * 100
	);

	return (
		<section
			id="inicio"
			className="relative bg-gradient-to-r from-primary to-secondary text-white min-h-screen flex items-center"
		>
			<div
				className="absolute inset-0 bg-cover bg-center bg-no-repeat"
				style={{ backgroundImage: `url(${heroVan})` }}
			></div>
			<div className="absolute inset-0 bg-black/50"></div>

			<div className="relative container mx-auto px-4 text-center pt-4 md:pt-6 pb-16 md:pb-24">
				{!showBookingModule && (
					<>
						<h1 className="text-4xl md:text-6xl font-bold mb-6 drop-shadow-2xl">
							Traslados Privados Aeropuerto La Araucanía
							<br />
							<span className="text-accent drop-shadow-lg text-3xl md:text-5xl">
								Reserva en 2 minutos
							</span>
						</h1>
						<p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto drop-shadow-lg">
							Conectamos el aeropuerto con Pucón, Villarrica, Malalcahuello y
							todos los destinos turísticos de La Araucanía.
							<br />
							<span className="text-accent font-bold">
								Descuento web del {baseDiscountPercentage}% garantizado
								{promoDiscountPercentage > 0 &&
									` + ${promoDiscountPercentage}% extra`}
							</span>
						</p>
					</>
				)}

				{!showBookingModule && (
					<div className="flex flex-col items-center justify-center space-y-6">
						<Button
							onClick={() => setShowBookingModule(true)}
							className="bg-accent hover:bg-accent/90 text-accent-foreground px-12 py-6 text-2xl font-bold rounded-xl shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-110 drop-shadow-lg animate-bounce hover:animate-none"
						>
							🚀 Reservar ahora
						</Button>
						<p className="text-lg text-white/95 drop-shadow-md font-medium">
							Proceso súper rápido • Solo 2 pasos • Pago seguro
						</p>
					</div>
				)}

				{showBookingModule && (
					<div className="w-full">
						<div className="text-center mb-6">
							<h3 className="text-2xl md:text-3xl font-bold text-white drop-shadow-2xl mb-3">
								¡Reserva express y ahorra!
							</h3>
							<p className="text-lg md:text-xl text-white/95 drop-shadow-lg font-medium">
								Solo 2 pasos • Descuento del{" "}
								<span className="text-accent font-bold text-2xl">
									{baseDiscountPercentage}%
								</span>{" "}
								aplicado automáticamente
							</p>
						</div>

						<Card className="max-w-4xl mx-auto bg-white/95 backdrop-blur-sm shadow-xl border text-left">
							<CardHeader className="space-y-4">
								<div className="flex flex-wrap items-center justify-between gap-2">
									<Button
										variant="ghost"
										size="sm"
										onClick={() => setShowBookingModule(false)}
										className="text-gray-500 hover:text-gray-700"
									>
										← Volver
									</Button>
									<div className="flex items-center gap-2">
										<Badge variant="secondary" className="text-sm">
											Descuento web {baseDiscountPercentage}%
										</Badge>
										{promoDiscountPercentage > 0 && (
											<Badge
												variant="default"
												className="text-sm bg-emerald-500 text-white"
											>
												Extra +{promoDiscountPercentage}%
											</Badge>
										)}
									</div>
								</div>

								{/* Progress simplificado */}
								<div className="space-y-4">
									<div className="grid gap-4 md:grid-cols-2">
										{steps.map((step, index) => {
											const isCompleted = index < currentStep;
											const isActive = index === currentStep;

											return (
												<div
													key={step.title}
													className={`flex items-center gap-3 rounded-lg border p-4 transition ${
														isActive
															? "border-primary bg-primary/10"
															: isCompleted
															? "border-green-500 bg-green-50"
															: "border-gray-200 bg-gray-50"
													}`}
												>
													<div
														className={`flex h-12 w-12 items-center justify-center rounded-full text-2xl ${
															isCompleted
																? "bg-green-500 text-white"
																: isActive
																? "bg-primary text-white"
																: "bg-gray-200 text-gray-500"
														}`}
													>
														{isCompleted ? "✓" : step.icon}
													</div>
													<div>
														<p className="font-semibold text-foreground text-lg">
															{step.title}
														</p>
														<p className="text-sm text-muted-foreground">
															{step.description}
														</p>
													</div>
												</div>
											);
										})}
									</div>
									<Progress value={progressValue} className="h-3" />
								</div>
							</CardHeader>

							<CardContent className="space-y-6">
								{/* PASO 1: Información básica del viaje */}
								{currentStep === 0 && (
									<div className="space-y-6">
										<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
											<div className="space-y-2">
												<Label
													htmlFor="origen-express"
													className="text-base font-medium"
												>
													<span className="flex items-center gap-2">
														🚐 Origen
													</span>
												</Label>
												<select
													id="origen-express"
													name="origen"
													value={formData.origen}
													onChange={handleInputChange}
													className="flex h-12 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
													required
												>
													{origenes.map((origen) => (
														<option key={origen} value={origen}>
															{origen}
														</option>
													))}
												</select>
											</div>

											<div className="space-y-2">
												<Label
													htmlFor="destino-express"
													className="text-base font-medium"
												>
													<span className="flex items-center gap-2">
														🎯 Destino
													</span>
												</Label>
												<select
													id="destino-express"
													name="destino"
													value={formData.destino}
													onChange={handleInputChange}
													className="flex h-12 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
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
										</div>

										<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
											<div className="space-y-2">
												<Label
													htmlFor="fecha-express"
													className="text-base font-medium"
												>
													<span className="flex items-center gap-2">
														<Calendar className="h-4 w-4" />
														Fecha del traslado
													</span>
												</Label>
												<Input
													id="fecha-express"
													type="date"
													name="fecha"
													value={formData.fecha}
													onChange={handleInputChange}
													min={minDateTime}
													className="h-12 text-base"
													required
												/>
											</div>

											<div className="space-y-2">
												<Label
													htmlFor="pasajeros-express"
													className="text-base font-medium"
												>
													<span className="flex items-center gap-2">
														<Users className="h-4 w-4" />
														Pasajeros
													</span>
												</Label>
												<select
													id="pasajeros-express"
													name="pasajeros"
													value={formData.pasajeros}
													onChange={handleInputChange}
													className="flex h-12 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
													required
												>
													{[...Array(maxPasajeros)].map((_, i) => (
														<option key={i + 1} value={i + 1}>
															{i + 1} {i === 0 ? "pasajero" : "pasajeros"}
														</option>
													))}
												</select>
											</div>
										</div>

										{/* Opción de ida y vuelta */}
										<div className="rounded-lg border border-muted/40 bg-muted/10 p-4 space-y-4">
											<div className="flex items-start gap-3">
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
															// Auto-completar fecha de regreso con la fecha de ida si está disponible
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
													className="text-sm font-medium leading-relaxed cursor-pointer"
												>
													¿También necesitas el regreso?
													<span className="block text-muted-foreground font-normal">
														Coordina ida y vuelta en una sola reserva y ahorra
													</span>
												</label>
											</div>

											{formData.idaVuelta && (
												<div className="pt-4 border-t border-muted/40">
													<div className="space-y-2">
														<Label
															htmlFor="fecha-regreso-express"
															className="text-base font-medium"
														>
															<span className="flex items-center gap-2">
																<Calendar className="h-4 w-4" />
																Fecha de regreso
															</span>
														</Label>
														<Input
															id="fecha-regreso-express"
															type="date"
															name="fechaRegreso"
															value={formData.fechaRegreso}
															onChange={handleInputChange}
															min={formData.fecha || minDateTime}
															className="h-12 text-base"
															required={formData.idaVuelta}
														/>
														<p className="text-xs text-muted-foreground">
															💡 La hora exacta de regreso podrás especificarla
															después del pago
														</p>
													</div>
												</div>
											)}
										</div>

										{/* Precio estimado */}
										{mostrarPrecio ? (
											<div className="rounded-xl border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5 p-6">
												<div className="grid gap-4 md:grid-cols-2 md:items-center">
													<div className="space-y-2">
														<div className="flex items-center gap-2 flex-wrap">
															<Badge variant="secondary">Precio estimado</Badge>
															<Badge variant="default" className="bg-green-500">
																-{baseDiscountPercentage}% web
															</Badge>
															{formData.idaVuelta && pricing.descuentoRoundTrip > 0 && (
																<Badge variant="default" className="bg-blue-500">
																	🔄 Ida y vuelta
																</Badge>
															)}
														</div>
														<p className="text-2xl font-bold text-primary">
															{formatCurrency(pricing.totalConDescuento)}
														</p>
														<p className="text-sm text-muted-foreground">
															Vehículo: {cotizacion.vehiculo}
															{formData.idaVuelta && " · Ida y vuelta"}
														</p>
													</div>
													<div className="text-left md:text-right space-y-1">
														<p className="text-sm text-muted-foreground line-through">
															Precio regular:{" "}
															{formatCurrency(pricing.precioBase)}
														</p>
														<p className="text-lg font-semibold text-green-600">
															Ahorro total:{" "}
															{formatCurrency(
																pricing.descuentoBase +
																	pricing.descuentoRoundTrip +
																	pricing.descuentoCodigo
															)}
														</p>
														{formData.idaVuelta && pricing.descuentoRoundTrip > 0 && (
															<p className="text-xs text-blue-600">
																Incluye descuento ida y vuelta:{" "}
																{formatCurrency(pricing.descuentoRoundTrip)}
															</p>
														)}
													</div>
												</div>
											</div>
										) : (
											<div className="rounded-xl border border-dashed border-primary/40 bg-primary/5 p-6 text-center">
												<p className="font-semibold text-primary">
													📋 Cotización personalizada
												</p>
												<p className="text-sm text-primary/80">
													Te enviaremos el precio exacto junto con la
													confirmación
												</p>
											</div>
										)}

										<div className="text-center">
											<p className="text-sm text-muted-foreground mb-4">
												💡 <strong>Tip:</strong> Podrás ajustar la hora exacta y
												otros detalles después de confirmar el pago
											</p>
											<Button
												type="button"
												onClick={handleStepOneNext}
												className="w-full md:w-auto bg-primary hover:bg-primary/90 text-white px-8 py-3 text-lg font-semibold"
												disabled={isSubmitting}
											>
												Continuar al pago →
											</Button>
										</div>
									</div>
								)}

								{/* PASO 2: Datos personales y pago */}
								{currentStep === 1 && (
									<div className="space-y-6">
										{/* Resumen del viaje */}
										<div className="bg-gray-50 rounded-lg p-4 space-y-2">
											<h4 className="font-semibold text-lg mb-3">
												📋 Resumen de tu traslado
											</h4>
											<div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
												<div>
													<span className="text-muted-foreground">Ruta:</span>
													<p className="font-medium">
														{origenFinal} → {destinoFinal}
														{formData.idaVuelta && (
															<>
																<br />
																<span className="text-blue-600">
																	{destinoFinal} → {origenFinal}
																</span>
															</>
														)}
													</p>
												</div>
												<div>
													<span className="text-muted-foreground">
														Fecha{formData.idaVuelta && "s"}:
													</span>
													<p className="font-medium">
														{fechaLegible}
														{formData.idaVuelta && formData.fechaRegreso && (
															<>
																<br />
																<span className="text-blue-600">
																	{new Date(
																		`${formData.fechaRegreso}T00:00:00`
																	).toLocaleDateString("es-CL", {
																		dateStyle: "long",
																		timeZone: "America/Santiago",
																	})}
																</span>
															</>
														)}
													</p>
												</div>
												<div>
													<span className="text-muted-foreground">
														Pasajeros:
													</span>
													<p className="font-medium">{formData.pasajeros}</p>
												</div>
											</div>
											{mostrarPrecio && (
												<div className="pt-2 border-t">
													<div className="flex justify-between items-center">
														<span className="font-medium">
															Total con descuento:
														</span>
														<span className="text-xl font-bold text-primary">
															{formatCurrency(pricing.totalConDescuento)}
														</span>
													</div>
													{formData.idaVuelta && (
														<p className="text-xs text-blue-600 mt-1">
															🔄 Incluye ida y vuelta
														</p>
													)}
												</div>
											)}
										</div>

										{/* Datos personales */}
										<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
											<div className="space-y-2">
												<Label
													htmlFor="nombre-express"
													className="text-base font-medium"
												>
													👤 Nombre completo
												</Label>
												<Input
													id="nombre-express"
													name="nombre"
													value={formData.nombre}
													onChange={handleInputChange}
													placeholder="Ej: Juan Pérez"
													className="h-12 text-base"
													required
												/>
											</div>

											<div className="space-y-2">
												<Label
													htmlFor="email-express"
													className="text-base font-medium"
												>
													📧 Correo electrónico
												</Label>
												<Input
													id="email-express"
													type="email"
													name="email"
													value={formData.email}
													onChange={handleInputChange}
													placeholder="tu@email.cl"
													className="h-12 text-base"
													required
												/>
											</div>

											<div className="space-y-2">
												<Label
													htmlFor="telefono-express"
													className="text-base font-medium"
												>
													📱 Teléfono
												</Label>
												<Input
													id="telefono-express"
													name="telefono"
													value={formData.telefono}
													onChange={handleInputChange}
													placeholder="+56 9 1234 5678"
													className="h-12 text-base"
													required
												/>
												{phoneError && (
													<p className="text-xs text-amber-600">{phoneError}</p>
												)}
											</div>
										</div>

										{/* Código de descuento */}
										<div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
											<h4 className="font-medium mb-3">
												🎟️ ¿Tienes un código de descuento?
											</h4>
											<CodigoDescuento
												codigoAplicado={codigoAplicado}
												codigoError={codigoError}
												validandoCodigo={validandoCodigo}
												onAplicarCodigo={onAplicarCodigo}
												onRemoverCodigo={onRemoverCodigo}
											/>
										</div>

										{/* Opciones de pago */}
										{mostrarPrecio && !requiereCotizacionManual && (
											<div className="space-y-4">
												<h4 className="font-semibold text-lg">
													💳 Selecciona tu opción de pago
												</h4>

												{/* Opciones de monto */}
												<div className="grid gap-3 md:grid-cols-2">
													{paymentOptions.map((option) => (
														<div
															key={option.id}
															className={`border rounded-lg p-4 cursor-pointer transition-all ${
																option.recommended
																	? "border-primary bg-primary/5 ring-2 ring-primary/20"
																	: "border-gray-200 hover:border-primary/50"
															}`}
														>
															<div className="flex justify-between items-start mb-2">
																<div>
																	<h5 className="font-semibold">
																		{option.title}
																	</h5>
																	<p className="text-sm text-muted-foreground">
																		{option.subtitle}
																	</p>
																</div>
																{option.recommended && (
																	<Badge variant="default" className="text-xs">
																		Recomendado
																	</Badge>
																)}
															</div>
															<p className="text-xl font-bold text-primary">
																{formatCurrency(option.amount)}
															</p>

															{/* Métodos de pago para esta opción */}
															<div className="grid grid-cols-2 gap-2 mt-3">
																{paymentMethods.map((method) => (
																	<Button
																		key={`${option.id}-${method.id}`}
																		type="button"
																		variant="outline"
																		onClick={() =>
																			handlePaymentWithReservation(method.gateway, option.type)
																		}
																		disabled={
																			isSubmitting ||
																			loadingGateway ===
																				`${method.gateway}-${option.type}`
																		}
																		className="h-auto p-2 flex flex-col items-center gap-1"
																	>
																		{loadingGateway ===
																		`${method.gateway}-${option.type}` ? (
																			<LoaderCircle className="h-4 w-4 animate-spin" />
																		) : (
																			<img
																				src={method.image}
																				alt={method.title}
																				className="h-6 w-auto object-contain"
																			/>
																		)}
																		<span className="text-xs">
																			{method.title}
																		</span>
																	</Button>
																))}
															</div>
														</div>
													))}
												</div>
											</div>
										)}

										{/* Consentimiento para pago */}
										<div className="border border-gray-200 rounded-lg p-4 space-y-3">
											<div className="flex items-start gap-3">
												<Checkbox
													id="payment-consent"
													checked={paymentConsent}
													onCheckedChange={(value) =>
														setPaymentConsent(Boolean(value))
													}
												/>
												<label
													htmlFor="payment-consent"
													className="text-sm leading-relaxed text-muted-foreground cursor-pointer"
												>
													✅ Acepto recibir la confirmación por email y
													WhatsApp, y comprendo que podré especificar la hora
													exacta y detalles adicionales después de confirmar el
													pago.
												</label>
											</div>
										</div>

										{/* Navegación */}
										<div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
											<Button
												type="button"
												variant="outline"
												onClick={handleStepBack}
												disabled={isSubmitting}
												className="w-full sm:w-auto"
											>
												← Volver
											</Button>

											{requiereCotizacionManual && (
												<Button
													asChild
													className="w-full sm:w-auto"
													variant="secondary"
												>
													<a href="#contacto">
														Solicitar cotización personalizada
													</a>
												</Button>
											)}
										</div>

										{/* Instrucciones de pago */}
										{!requiereCotizacionManual && (
											<div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
												<p className="text-sm text-blue-800">
													💳 <strong>Para confirmar tu reserva, selecciona un método de pago arriba</strong>
													<br />
													<span className="text-xs">
														La reserva se creará automáticamente al procesar el pago
													</span>
												</p>
											</div>
										)}
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
