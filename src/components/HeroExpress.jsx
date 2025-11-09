import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Checkbox } from "./ui/checkbox";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";
import { LoaderCircle, Calendar, Users, Clock } from "lucide-react";
import heroVan from "../assets/hero-van.png";
import flow from "../assets/formasPago/flow.png";
import CodigoDescuento from "./CodigoDescuento";
import { getBackendUrl } from "../lib/backend";

// Función para generar opciones de hora en intervalos de 15 minutos (6:00 AM - 8:00 PM)
const generateTimeOptions = () => {
	const options = [];
	for (let hour = 6; hour <= 20; hour++) {
		for (let minute = 0; minute < 60; minute += 15) {
			const timeString = `${hour.toString().padStart(2, "0")}:${minute
				.toString()
				.padStart(2, "0")}`;
			const displayTime = `${hour.toString().padStart(2, "0")}:${minute
				.toString()
				.padStart(2, "0")}`;
			options.push({ value: timeString, label: displayTime });
		}
	}
	return options;
};

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

	// Generar opciones de tiempo en intervalos de 15 minutos
	const timeOptions = useMemo(() => generateTimeOptions(), []);

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

		if (!formData.hora) {
			setStepError("Selecciona la hora de recogida.");
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
			className="relative bg-primary text-white min-h-screen flex items-center"
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
							Traslados Aeropuerto La Araucanía
						</h1>
						<p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto drop-shadow-lg">
							Reserva tu traslado privado al aeropuerto. Rápido, seguro y con {baseDiscountPercentage}% de descuento.
						</p>
					</>
				)}

				{!showBookingModule && (
					<div className="flex flex-col items-center justify-center space-y-4">
						<Button
							onClick={() => setShowBookingModule(true)}
							className="bg-accent hover:bg-accent/90 text-accent-foreground px-8 py-4 text-xl font-semibold rounded-lg shadow-lg"
						>
							Reservar ahora
						</Button>
						<Button
							variant="outline"
							className="bg-transparent border-white text-white hover:bg-white/20"
							asChild
						>
							<a href="#consultar-reserva">Continuar con código</a>
						</Button>
					</div>
				)}

				{showBookingModule && (
					<div className="w-full">
						<div className="text-center mb-6">
							<h3 className="text-2xl font-bold text-white mb-2">
								Reserva tu traslado
							</h3>
							<p className="text-base text-white/90">
								{baseDiscountPercentage}% de descuento incluido
							</p>
						</div>

						<Card className="max-w-4xl mx-auto bg-white shadow-xl text-left">
							<CardHeader className="space-y-4">
								<div className="flex items-center justify-between">
									<Button
										variant="ghost"
										size="sm"
										onClick={() => setShowBookingModule(false)}
										className="text-gray-500 hover:text-gray-700"
									>
										← Volver
									</Button>
									<Badge variant="secondary" className="text-sm">
										Descuento {baseDiscountPercentage}%
									</Badge>
								</div>

								{/* Indicador de progreso simple */}
								<div className="space-y-3">
									<div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
										{steps.map((step, index) => {
											const isActive = index === currentStep;
											const isCompleted = index < currentStep;

											return (
												<React.Fragment key={step.title}>
													<div
														className={`flex items-center gap-2 ${
															isActive ? "text-primary font-medium" : ""
														} ${isCompleted ? "text-green-600" : ""}`}
													>
														<div
															className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
																isCompleted
																	? "bg-green-500 text-white"
																	: isActive
																	? "bg-primary text-white"
																	: "bg-gray-200 text-gray-500"
															}`}
														>
															{isCompleted ? "✓" : index + 1}
														</div>
														<span className="hidden sm:inline">{step.title}</span>
													</div>
													{index < steps.length - 1 && (
														<div className="w-8 h-px bg-gray-300"></div>
													)}
												</React.Fragment>
											);
										})}
									</div>
									<Progress value={progressValue} className="h-2" />
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

										<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
													htmlFor="hora-express"
													className="text-base font-medium"
												>
													<span className="flex items-center gap-2">
														<Clock className="h-4 w-4" />
														Hora de recogida
													</span>
												</Label>
												<Select
													value={formData.hora}
													onValueChange={(value) => {
														handleInputChange({
															target: { name: "hora", value },
														});
													}}
												>
													<SelectTrigger className="h-12 text-base">
														<SelectValue placeholder="Selecciona la hora" />
													</SelectTrigger>
													<SelectContent>
														{timeOptions.map((option) => (
															<SelectItem
																key={option.value}
																value={option.value}
															>
																{option.label}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
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
											<div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
												<div className="flex justify-between items-center mb-2">
													<span className="text-sm text-muted-foreground">
														Total con descuento
													</span>
													<span className="text-2xl font-bold text-primary">
														{formatCurrency(pricing.totalConDescuento)}
													</span>
												</div>
												<div className="text-xs text-muted-foreground space-y-1">
													<p>Vehículo: {cotizacion.vehiculo}</p>
													{formData.idaVuelta && <p>Incluye ida y vuelta</p>}
												</div>
											</div>
										) : (
											<div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center">
												<p className="font-medium text-muted-foreground">
													Cotización personalizada
												</p>
												<p className="text-sm text-muted-foreground">
													Te enviaremos el precio por email
												</p>
											</div>
										)}

										<div className="text-center">
											<Button
												type="button"
												onClick={handleStepOneNext}
												className="w-full md:w-auto bg-primary hover:bg-primary/90 text-white px-8 py-3"
												disabled={isSubmitting}
											>
												Continuar
											</Button>
										</div>
									</div>
								)}

								{/* PASO 2: Datos personales y pago */}
								{currentStep === 1 && (
									<div className="space-y-6">
										{/* Resumen del viaje */}
										<div className="bg-gray-50 rounded-lg p-4">
											<h4 className="font-medium text-base mb-3">
												Resumen del viaje
											</h4>
											<div className="space-y-2 text-sm">
												<div className="flex justify-between">
													<span className="text-muted-foreground">Ruta:</span>
													<span className="font-medium text-right">
														{origenFinal} → {destinoFinal}
													</span>
												</div>
												<div className="flex justify-between">
													<span className="text-muted-foreground">Fecha:</span>
													<span className="font-medium">{fechaLegible}</span>
												</div>
												<div className="flex justify-between">
													<span className="text-muted-foreground">Pasajeros:</span>
													<span className="font-medium">{formData.pasajeros}</span>
												</div>
												{formData.idaVuelta && formData.fechaRegreso && (
													<div className="pt-2 border-t">
														<div className="flex justify-between text-primary">
															<span>Regreso:</span>
															<span className="font-medium">
																{new Date(
																	`${formData.fechaRegreso}T00:00:00`
																).toLocaleDateString("es-CL", {
																	dateStyle: "medium",
																	timeZone: "America/Santiago",
																})}
															</span>
														</div>
													</div>
												)}
												{mostrarPrecio && (
													<div className="pt-2 border-t">
														<div className="flex justify-between items-center">
															<span className="font-medium">Total:</span>
															<span className="text-xl font-bold text-primary">
																{formatCurrency(pricing.totalConDescuento)}
															</span>
														</div>
													</div>
												)}
											</div>
										</div>

										{/* Datos personales */}
										<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
											<div className="space-y-2">
												<Label
													htmlFor="nombre-express"
													className="text-base font-medium"
												>
													👤 Nombre completo{" "}
													<span className="text-destructive">*</span>
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
													📧 Correo electrónico{" "}
													<span className="text-destructive">*</span>
												</Label>
												<Input
													id="email-express"
													type="email"
													name="email"
													value={formData.email}
													onChange={handleInputChange}
													onBlur={(e) => verificarReservaActiva(e.target.value)}
													placeholder="tu@email.cl"
													className="h-12 text-base"
													required
												/>
												{verificandoReserva && (
													<p className="text-xs text-blue-600 flex items-center gap-1">
														<LoaderCircle className="w-3 h-3 animate-spin" />
														Verificando reservas...
													</p>
												)}
												{reservaActiva && (
													<div className="bg-amber-50 border border-amber-300 rounded-lg p-3 text-sm">
														<p className="font-medium text-amber-800 mb-1">
															⚠️ Tienes una reserva sin pagar
														</p>
														<p className="text-amber-700 text-xs">
															Código:{" "}
															<span className="font-mono font-semibold">
																{reservaActiva.codigoReserva}
															</span>
															<br />
															Al continuar, se modificará tu reserva existente
															en lugar de crear una nueva.
														</p>
													</div>
												)}
											</div>

											<div className="space-y-2">
												<Label
													htmlFor="telefono-express"
													className="text-base font-medium"
												>
													📱 Teléfono{" "}
													<span className="text-destructive">*</span>
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
										<div className="border border-gray-200 rounded-lg p-4">
											<h4 className="font-medium text-sm mb-3">
												¿Tienes un código de descuento?
											</h4>
											<CodigoDescuento
												codigoAplicado={codigoAplicado}
												codigoError={codigoError}
												validandoCodigo={validandoCodigo}
												onAplicarCodigo={onAplicarCodigo}
												onRemoverCodigo={onRemoverCodigo}
											/>
										</div>

										{/* Opciones de pago - Solo si todos los campos están completos */}
										{mostrarPrecio &&
											!requiereCotizacionManual &&
											todosLosCamposCompletos && (
												<div className="space-y-3">
													<h4 className="font-medium text-base">
														Forma de pago
													</h4>

													{/* Paso 1: Seleccionar tipo de pago (40% o 100%) */}
													{!selectedPaymentType && (
														<div className="grid gap-3 md:grid-cols-2">
															{paymentOptions.map((option) => (
																<button
																	key={option.id}
																	type="button"
																	onClick={() =>
																		setSelectedPaymentType(option.type)
																	}
																	className={`border rounded-lg p-3 text-left transition-all hover:border-primary ${
																		option.recommended
																			? "border-primary bg-primary/5"
																			: "border-gray-200"
																	}`}
																>
																	<div className="space-y-1">
																		<h5 className="font-medium text-sm">
																			{option.title}
																		</h5>
																		<p className="text-xs text-muted-foreground">
																			{option.subtitle}
																		</p>
																		<p className="text-lg font-bold text-primary">
																			{formatCurrency(option.amount)}
																		</p>
																	</div>
																</button>
															))}
														</div>
													)}

													{/* Paso 2: Seleccionar método de pago una vez elegido el tipo */}
													{selectedPaymentType && (
														<div className="space-y-3">
															<div className="flex items-center justify-between text-sm">
																<span className="text-muted-foreground">
																	Total a pagar:
																</span>
																<span className="font-semibold">
																	{formatCurrency(
																		paymentOptions.find(
																			(opt) => opt.type === selectedPaymentType
																		)?.amount || 0
																	)}
																</span>
															</div>

															<div className="grid gap-3">
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
																		className="h-auto p-3 flex items-center gap-3"
																	>
																		{loadingGateway ===
																		`${method.gateway}-${selectedPaymentType}` ? (
																			<LoaderCircle className="h-6 w-6 animate-spin" />
																		) : (
																			<>
																				<img
																					src={method.image}
																					alt={method.title}
																					className="h-6 w-auto object-contain"
																				/>
																				<span className="text-sm">
																					Pagar con {method.title}
																				</span>
																			</>
																		)}
																	</Button>
																))}
															</div>
															<Button
																type="button"
																variant="ghost"
																size="sm"
																onClick={() => setSelectedPaymentType(null)}
																className="w-full text-xs"
															>
																Cambiar monto
															</Button>
														</div>
													)}
												</div>
											)}

										{/* Mensaje cuando faltan campos por completar */}
										{mostrarPrecio &&
											!requiereCotizacionManual &&
											!todosLosCamposCompletos && (
												<div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
													<p className="text-sm text-muted-foreground">
														Completa todos los campos para continuar
													</p>
												</div>
											)}

										{/* Consentimiento para pago */}
										<div className="border border-gray-200 rounded-lg p-3">
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
													className="text-sm text-muted-foreground cursor-pointer"
												>
													Acepto los términos y recibir confirmación por email
												</label>
											</div>
										</div>

										{/* Navegación */}
										<div className="space-y-3">
											<Button
												type="button"
												variant="outline"
												onClick={handleStepBack}
												disabled={isSubmitting}
												size="sm"
											>
												← Volver
											</Button>

											{requiereCotizacionManual ? (
												<Button asChild className="w-full" variant="secondary">
													<a href="#contacto">
														Solicitar cotización
													</a>
												</Button>
											) : (
												<div className="space-y-2">
													{/* Botón para guardar reserva sin pagar */}
													<div className="border border-gray-200 rounded-lg p-3">
														<p className="text-sm text-muted-foreground mb-2">
															Guarda tu reserva y paga después
														</p>
														<Button
															type="button"
															onClick={handleGuardarReserva}
															disabled={
																isSubmitting || !todosLosCamposCompletos
															}
															variant="outline"
															className="w-full"
															size="sm"
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
													</div>
												</div>
											)}
										</div>
									</div>
								)}

								{stepError && (
									<div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
										{stepError}
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
