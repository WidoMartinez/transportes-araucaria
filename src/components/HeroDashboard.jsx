import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";
import {
	CheckCircle2,
	LoaderCircle,
	Calendar,
	MapPin,
	Users,
	Banknote,
	Clock,
	ArrowRight,
	Info,
} from "lucide-react";
import heroVan from "../assets/hero-van.png";
import flow from "../assets/formasPago/flow.png";
import merPago from "../assets/formasPago/mp.png";
import CodigoDescuento from "./CodigoDescuento";

// Función para generar opciones de hora en intervalos de 15 minutos (6:00 AM - 8:00 PM)
const generateTimeOptions = () => {
	const options = [];
	for (let hour = 6; hour <= 20; hour++) {
		for (let minute = 0; minute < 60; minute += 15) {
			const timeString = `${hour.toString().padStart(2, "0")}:${minute
				.toString()
				.padStart(2, "0")}`;
			options.push({ value: timeString, label: timeString });
		}
	}
	return options;
};

function HeroDashboard({
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
	roundTripDiscountRate,
	personalizedDiscountRate,
	activePromotion,
	handlePayment,
	loadingGateway,
	onSubmitWizard,
	validarTelefono,
	codigoAplicado,
	codigoError,
	validandoCodigo,
	onAplicarCodigo,
	onRemoverCodigo,
	setFormData,
	canPay,
}) {
	const [currentStep, setCurrentStep] = useState(0);
	const [stepError, setStepError] = useState("");
	const [showBookingModule, setShowBookingModule] = useState(false);
	const [selectedPaymentOption, setSelectedPaymentOption] = useState("total");
	const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("flow");
	const [paymentConsent, setPaymentConsent] = useState(false);

	// Generar opciones de tiempo
	const timeOptions = useMemo(() => generateTimeOptions(), []);

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

	const baseDiscountPercentage = Math.round((baseDiscountRate || 0) * 100);
	const promoDiscountPercentage = Math.round(
		(promotionDiscountRate || 0) * 100
	);
	const roundTripDiscountPercentage = Math.round(
		(roundTripDiscountRate || 0) * 100
	);
	const personalizedDiscountPercentage = Math.round(
		(personalizedDiscountRate || 0) * 100
	);
	const totalDiscountPercentage =
		baseDiscountPercentage +
		promoDiscountPercentage +
		roundTripDiscountPercentage +
		personalizedDiscountPercentage;

	// Opciones de pago
	const paymentOptions = useMemo(
		() => [
			{
				id: "abono",
				type: "abono",
				title: "Abonar 40%",
				subtitle: "Reserva tu cupo",
				amount: pricing.abono,
				badge: "Opción flexible",
			},
			{
				id: "total",
				type: "total",
				title: "Pagar 100%",
				subtitle: "Descuento completo",
				amount: pricing.totalConDescuento,
				badge: "Recomendado",
				recommended: true,
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

	// Resetear errores al cambiar de paso
	useEffect(() => {
		setStepError("");
	}, [currentStep]);

	// Validación paso 1: Información de viaje
	const handleStepOneNext = () => {
		if (!formData.origen?.trim()) {
			setStepError("Selecciona el origen de tu viaje.");
			return;
		}

		if (!formData.destino?.trim()) {
			setStepError("Selecciona el destino de tu viaje.");
			return;
		}

		if (!formData.fecha) {
			setStepError("Selecciona la fecha de tu traslado.");
			return;
		}

		// Validar fecha no sea en el pasado
		const hoy = new Date();
		hoy.setHours(0, 0, 0, 0);
		const fechaSeleccionada = new Date(`${formData.fecha}T00:00:00`);

		if (fechaSeleccionada < hoy) {
			setStepError("La fecha no puede ser anterior a hoy.");
			return;
		}

		if (!formData.pasajeros || parseInt(formData.pasajeros) < 1) {
			setStepError("Indica el número de pasajeros.");
			return;
		}

		// Validación de regreso si es ida y vuelta
		if (formData.idaVuelta) {
			if (!formData.fechaRegreso) {
				setStepError("Selecciona la fecha de regreso.");
				return;
			}

			const fechaRegreso = new Date(`${formData.fechaRegreso}T00:00:00`);
			if (fechaRegreso < fechaSeleccionada) {
				setStepError("La fecha de regreso debe ser posterior a la fecha de ida.");
				return;
			}
		}

		setStepError("");
		setCurrentStep(1);
	};

	// Validación paso 2: Datos personales y pago
	const handleStepTwoNext = async () => {
		if (!formData.nombre?.trim()) {
			setStepError("Ingresa tu nombre completo.");
			return;
		}

		if (!formData.email?.trim()) {
			setStepError("Ingresa tu correo electrónico.");
			return;
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(formData.email)) {
			setStepError("El correo electrónico no es válido.");
			return;
		}

		if (!formData.telefono?.trim()) {
			setStepError("Ingresa tu número de teléfono.");
			return;
		}

		if (!validarTelefono(formData.telefono)) {
			setPhoneError(
				"Número no válido. Formato: +56 9 1234 5678 o 9 1234 5678"
			);
			setStepError("Verifica el número de teléfono.");
			return;
		}

		if (!paymentConsent) {
			setStepError(
				"Debes aceptar los términos para continuar con el pago."
			);
			return;
		}

		setPhoneError("");
		setStepError("");

		// Si requiere cotización manual, no procedemos al pago
		if (requiereCotizacionManual) {
			setStepError(
				"Este destino requiere cotización personalizada. Contáctanos para completar tu reserva."
			);
			return;
		}

		// Crear reserva en el backend con estado "pendiente_detalles"
		const result = await onSubmitWizard();

		if (!result.success) {
			if (result.error === "horario" && result.message) {
				setStepError(result.message);
			} else if (result.error === "server" && result.message) {
				setStepError(`Error al procesar: ${result.message}`);
			} else {
				setStepError("Ocurrió un error. Por favor, inténtalo de nuevo.");
			}
			return;
		}

		// Proceder al pago
		setCurrentStep(2);
	};

	const handleStepBack = () => {
		setCurrentStep((prev) => Math.max(prev - 1, 0));
	};

	const handleProceedToPayment = () => {
		if (!selectedPaymentOption || !selectedPaymentMethod) {
			setStepError("Selecciona una opción y método de pago.");
			return;
		}

		const selectedOption = paymentOptions.find(
			(opt) => opt.id === selectedPaymentOption
		);
		const selectedMethod = paymentMethods.find(
			(method) => method.id === selectedPaymentMethod
		);

		if (!selectedOption || !selectedMethod) {
			setStepError("Opción de pago inválida.");
			return;
		}

		// Trigger payment
		handlePayment(selectedMethod.gateway, selectedOption.type);
	};

	const selectedCombinationLoading =
		loadingGateway === `${selectedPaymentMethod}-${selectedPaymentOption}`;
	const isAnotherGatewayLoading = Boolean(
		loadingGateway && !selectedCombinationLoading
	);

	return (
		<section
			id="inicio"
			className="relative bg-gradient-to-br from-primary via-secondary to-primary text-white min-h-screen flex items-center"
		>
			<div
				className="absolute inset-0 bg-cover bg-center bg-no-repeat"
				style={{ backgroundImage: `url(${heroVan})` }}
			></div>
			<div className="absolute inset-0 bg-black/60"></div>

			<div className="relative container mx-auto px-4 text-center pt-6 pb-20">
				{!showBookingModule && (
					<>
						<h1 className="text-4xl md:text-6xl font-bold mb-6 drop-shadow-2xl animate-fade-in">
							Traslados Privados Aeropuerto La Araucanía
							<br />
							<span className="text-accent drop-shadow-lg text-3xl md:text-5xl mt-2 inline-block">
								Reserva en 2 pasos • Paga online
							</span>
						</h1>
						<p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto drop-shadow-lg">
							Conectamos el aeropuerto con Pucón, Villarrica, Malalcahuello y
							todos los destinos turísticos de La Araucanía.
							<br />
							<span className="text-accent font-bold text-2xl mt-3 inline-block">
								Descuento web del {baseDiscountPercentage}% garantizado
								{promoDiscountPercentage > 0 &&
									` + ${promoDiscountPercentage}% extra`}
							</span>
						</p>
					</>
				)}

				{!showBookingModule && (
					<div className="flex flex-col items-center justify-center space-y-6 animate-fade-in">
						<Button
							onClick={() => setShowBookingModule(true)}
							className="bg-accent hover:bg-accent/90 text-accent-foreground px-16 py-8 text-2xl font-bold rounded-2xl shadow-2xl hover:shadow-accent/50 transition-all duration-300 transform hover:scale-105 drop-shadow-lg"
						>
							🚀 Reservar ahora
						</Button>
						<p className="text-lg text-white/95 drop-shadow-md font-medium">
							Proceso rápido • Pago seguro • Confirmación inmediata
						</p>
					</div>
				)}

				{showBookingModule && (
					<div className="w-full max-w-7xl mx-auto">
						<div className="text-center mb-8">
							<h2 className="text-3xl md:text-4xl font-bold text-white drop-shadow-2xl mb-3">
								Tu traslado en {currentStep === 0 ? "2 pasos" : currentStep === 1 ? "1 paso" : "proceso de pago"}
							</h2>
							<p className="text-lg md:text-xl text-white/95 drop-shadow-lg font-medium">
								{currentStep === 0 && "Ingresa los datos de tu viaje y ve el precio al instante"}
								{currentStep === 1 && "Completa tus datos y procede al pago seguro"}
								{currentStep === 2 && "Confirma y paga • Los detalles adicionales se completarán después"}
							</p>
						</div>

						{/* Dashboard de pasos */}
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
							<Card
								className={`transition-all duration-300 ${
									currentStep === 0
										? "ring-4 ring-accent shadow-xl scale-105"
										: currentStep > 0
										? "bg-green-50 border-green-500"
										: "bg-white/90"
								}`}
							>
								<CardContent className="p-6 text-center">
									<div
										className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center text-2xl ${
											currentStep === 0
												? "bg-accent text-white animate-pulse"
												: currentStep > 0
												? "bg-green-500 text-white"
												: "bg-gray-200 text-gray-500"
										}`}
									>
										{currentStep > 0 ? <CheckCircle2 /> : "1"}
									</div>
									<h3 className="text-lg font-bold text-gray-900 mb-1">
										¿A dónde viajas?
									</h3>
									<p className="text-sm text-gray-600">
										Ruta, fecha y pasajeros
									</p>
								</CardContent>
							</Card>

							<Card
								className={`transition-all duration-300 ${
									currentStep === 1
										? "ring-4 ring-accent shadow-xl scale-105"
										: currentStep > 1
										? "bg-green-50 border-green-500"
										: "bg-white/90"
								}`}
							>
								<CardContent className="p-6 text-center">
									<div
										className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center text-2xl ${
											currentStep === 1
												? "bg-accent text-white animate-pulse"
												: currentStep > 1
												? "bg-green-500 text-white"
												: "bg-gray-200 text-gray-500"
										}`}
									>
										{currentStep > 1 ? <CheckCircle2 /> : "2"}
									</div>
									<h3 className="text-lg font-bold text-gray-900 mb-1">
										Tus datos y pago
									</h3>
									<p className="text-sm text-gray-600">
										Información personal y método de pago
									</p>
								</CardContent>
							</Card>

							<Card
								className={`transition-all duration-300 ${
									currentStep === 2
										? "ring-4 ring-accent shadow-xl scale-105"
										: "bg-white/90"
								}`}
							>
								<CardContent className="p-6 text-center">
									<div
										className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center text-2xl ${
											currentStep === 2
												? "bg-accent text-white animate-pulse"
												: "bg-gray-200 text-gray-500"
										}`}
									>
										<Banknote />
									</div>
									<h3 className="text-lg font-bold text-gray-900 mb-1">
										Confirmar pago
									</h3>
									<p className="text-sm text-gray-600">
										Pago seguro y confirmación
									</p>
								</CardContent>
							</Card>
						</div>

						{/* Contenido principal */}
						<Card className="bg-white/95 backdrop-blur-sm shadow-2xl border-2 text-left">
							<CardContent className="p-6 md:p-8">
								{/* PASO 1: Información del viaje */}
								{currentStep === 0 && (
									<div className="space-y-6">
										<div className="flex items-center justify-between mb-6">
											<h3 className="text-2xl font-bold text-gray-900">
												Información de tu viaje
											</h3>
											<Button
												variant="ghost"
												size="sm"
												onClick={() => setShowBookingModule(false)}
												className="text-gray-500 hover:text-gray-700"
											>
												← Volver
											</Button>
										</div>

										<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
											<div className="space-y-2">
												<Label
													htmlFor="origen-dashboard"
													className="text-base font-semibold flex items-center gap-2"
												>
													<MapPin className="w-5 h-5 text-primary" />
													Origen
												</Label>
												<select
													id="origen-dashboard"
													name="origen"
													value={formData.origen}
													onChange={handleInputChange}
													className="flex h-12 w-full items-center justify-between rounded-lg border-2 border-input bg-background px-4 py-2 text-base ring-offset-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition"
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
													htmlFor="destino-dashboard"
													className="text-base font-semibold flex items-center gap-2"
												>
													<MapPin className="w-5 h-5 text-secondary" />
													Destino
												</Label>
												<select
													id="destino-dashboard"
													name="destino"
													value={formData.destino}
													onChange={handleInputChange}
													className="flex h-12 w-full items-center justify-between rounded-lg border-2 border-input bg-background px-4 py-2 text-base ring-offset-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition"
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
													htmlFor="fecha-dashboard"
													className="text-base font-semibold flex items-center gap-2"
												>
													<Calendar className="w-5 h-5 text-primary" />
													Fecha
												</Label>
												<Input
													id="fecha-dashboard"
													type="date"
													name="fecha"
													value={formData.fecha}
													onChange={handleInputChange}
													min={minDateTime}
													className="h-12 text-base border-2 rounded-lg"
													required
												/>
											</div>

											<div className="space-y-2">
												<Label
													htmlFor="hora-dashboard"
													className="text-base font-semibold flex items-center gap-2"
												>
													<Clock className="w-5 h-5 text-primary" />
													Hora aproximada
												</Label>
												<select
													id="hora-dashboard"
													name="hora"
													value={formData.hora}
													onChange={handleInputChange}
													className="flex h-12 w-full items-center justify-between rounded-lg border-2 border-input bg-background px-4 py-2 text-base ring-offset-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition"
												>
													<option value="">Seleccionar hora</option>
													{timeOptions.map((option) => (
														<option key={option.value} value={option.value}>
															{option.label}
														</option>
													))}
												</select>
												<p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
													<Info className="w-3 h-3" />
													Podrás especificar la hora exacta después del pago
												</p>
											</div>

											<div className="space-y-2">
												<Label
													htmlFor="pasajeros-dashboard"
													className="text-base font-semibold flex items-center gap-2"
												>
													<Users className="w-5 h-5 text-primary" />
													Pasajeros
												</Label>
												<select
													id="pasajeros-dashboard"
													name="pasajeros"
													value={formData.pasajeros}
													onChange={handleInputChange}
													className="flex h-12 w-full items-center justify-between rounded-lg border-2 border-input bg-background px-4 py-2 text-base ring-offset-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition"
													required
												>
													{[...Array(maxPasajeros)].map((_, i) => (
														<option key={i + 1} value={i + 1}>
															{i + 1} pasajero{i > 0 ? "s" : ""}
														</option>
													))}
												</select>
											</div>
										</div>

										{/* Ida y vuelta */}
										<div className="rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-6">
											<div className="flex items-center gap-3 mb-4">
												<Checkbox
													id="ida-vuelta-dashboard"
													checked={formData.idaVuelta}
													onCheckedChange={(value) => {
														const isRoundTrip = Boolean(value);
														setFormData((prev) => ({
															...prev,
															idaVuelta: isRoundTrip,
															fechaRegreso: isRoundTrip
																? prev.fechaRegreso || prev.fecha
																: "",
															horaRegreso: isRoundTrip ? prev.horaRegreso : "",
														}));
													}}
													className="w-6 h-6"
												/>
												<label
													htmlFor="ida-vuelta-dashboard"
													className="text-base font-medium text-gray-900 cursor-pointer"
												>
													¿También necesitas el regreso? Ahorra{" "}
													{roundTripDiscountPercentage}% extra
												</label>
											</div>

											{formData.idaVuelta && (
												<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pl-9">
													<div className="space-y-2">
														<Label htmlFor="fecha-regreso-dashboard">
															Fecha de regreso
														</Label>
														<Input
															id="fecha-regreso-dashboard"
															type="date"
															name="fechaRegreso"
															min={formData.fecha || minDateTime}
															value={formData.fechaRegreso}
															onChange={handleInputChange}
															className="h-12 text-base border-2 rounded-lg"
															required={formData.idaVuelta}
														/>
													</div>
													<div className="space-y-2">
														<Label htmlFor="hora-regreso-dashboard">
															Hora aproximada de regreso
														</Label>
														<select
															id="hora-regreso-dashboard"
															name="horaRegreso"
															value={formData.horaRegreso}
															onChange={handleInputChange}
															className="flex h-12 w-full items-center justify-between rounded-lg border-2 border-input bg-background px-4 py-2 text-base ring-offset-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition"
														>
															<option value="">Seleccionar hora</option>
															{timeOptions.map((option) => (
																<option key={option.value} value={option.value}>
																	{option.label}
																</option>
															))}
														</select>
													</div>
												</div>
											)}
										</div>

										{/* Resumen de precio INMEDIATO */}
										{mostrarPrecio && (
											<div className="rounded-2xl bg-gradient-to-br from-accent/20 via-accent/10 to-accent/5 border-2 border-accent/30 p-8 shadow-lg">
												<div className="flex items-center justify-between mb-6">
													<div>
														<h4 className="text-3xl font-bold text-gray-900 mb-1">
															{formatCurrency(pricing.totalConDescuento)}
														</h4>
														<p className="text-sm text-gray-600 line-through">
															Precio regular: {formatCurrency(pricing.precioBase)}
														</p>
													</div>
													<Badge className="bg-green-500 text-white text-lg px-4 py-2">
														Ahorras {totalDiscountPercentage}%
													</Badge>
												</div>

												<div className="space-y-2 bg-white/70 rounded-lg p-4">
													<div className="flex items-center justify-between text-sm">
														<span className="text-gray-600">Vehículo sugerido:</span>
														<span className="font-semibold text-gray-900">
															{cotizacion.vehiculo}
														</span>
													</div>
													{baseDiscountPercentage > 0 && (
														<div className="flex items-center justify-between text-sm">
															<span className="text-gray-600">
																Descuento web ({baseDiscountPercentage}%):
															</span>
															<span className="font-semibold text-green-600">
																-{formatCurrency(pricing.descuentoBase)}
															</span>
														</div>
													)}
													{promoDiscountPercentage > 0 && (
														<div className="flex items-center justify-between text-sm">
															<span className="text-gray-600">
																Promoción ({promoDiscountPercentage}%):
															</span>
															<span className="font-semibold text-green-600">
																-{formatCurrency(pricing.descuentoPromocion)}
															</span>
														</div>
													)}
													{roundTripDiscountPercentage > 0 && formData.idaVuelta && (
														<div className="flex items-center justify-between text-sm">
															<span className="text-gray-600">
																Ida y vuelta ({roundTripDiscountPercentage}%):
															</span>
															<span className="font-semibold text-green-600">
																-{formatCurrency(pricing.descuentoRoundTrip)}
															</span>
														</div>
													)}
												</div>
											</div>
										)}

										{requiereCotizacionManual && (
											<div className="rounded-xl border-2 border-orange-300 bg-orange-50 p-6">
												<p className="text-orange-900 font-medium mb-2">
													Este destino requiere cotización personalizada
												</p>
												<p className="text-sm text-orange-700">
													Por favor, contáctanos para recibir tu cotización en
													menos de 30 minutos.
												</p>
											</div>
										)}

										{stepError && (
											<div className="rounded-lg bg-red-50 border border-red-200 p-4">
												<p className="text-red-800 font-medium">{stepError}</p>
											</div>
										)}

										<div className="flex justify-end pt-4">
											<Button
												type="button"
												onClick={handleStepOneNext}
												disabled={!mostrarPrecio}
												className="bg-accent hover:bg-accent/90 text-accent-foreground px-10 py-6 text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
											>
												Ver precio y continuar
												<ArrowRight className="ml-2 w-5 h-5" />
											</Button>
										</div>
									</div>
								)}

								{/* PASO 2: Datos personales y preparación para pago */}
								{currentStep === 1 && (
									<div className="space-y-6">
										<div className="flex items-center justify-between mb-6">
											<h3 className="text-2xl font-bold text-gray-900">
												Tus datos para el pago
											</h3>
											<Button
												variant="ghost"
												size="sm"
												onClick={handleStepBack}
												className="text-gray-500 hover:text-gray-700"
											>
												← Volver
											</Button>
										</div>

										{/* Resumen compacto del viaje */}
										<div className="rounded-xl bg-gray-50 border border-gray-200 p-6">
											<h4 className="font-semibold text-lg mb-4 text-gray-900">
												📋 Resumen de tu traslado
											</h4>
											<div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
												<div>
													<p className="text-gray-600 mb-1">Ruta</p>
													<p className="font-semibold text-gray-900">
														{origenFinal} → {destinoFinal}
													</p>
												</div>
												<div>
													<p className="text-gray-600 mb-1">Fecha</p>
													<p className="font-semibold text-gray-900">
														{fechaLegible}
													</p>
												</div>
												<div>
													<p className="text-gray-600 mb-1">Pasajeros</p>
													<p className="font-semibold text-gray-900">
														{formData.pasajeros}
													</p>
												</div>
												<div>
													<p className="text-gray-600 mb-1">Total a pagar</p>
													<p className="font-bold text-accent text-lg">
														{formatCurrency(pricing.totalConDescuento)}
													</p>
												</div>
											</div>
										</div>

										{/* Formulario de datos personales */}
										<div className="space-y-4">
											<div className="space-y-2">
												<Label htmlFor="nombre-dashboard" className="text-base font-semibold">
													Nombre completo *
												</Label>
												<Input
													id="nombre-dashboard"
													type="text"
													name="nombre"
													value={formData.nombre}
													onChange={handleInputChange}
													placeholder="Ej: Juan Pérez González"
													className="h-12 text-base border-2 rounded-lg"
													required
												/>
											</div>

											<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
												<div className="space-y-2">
													<Label htmlFor="email-dashboard" className="text-base font-semibold">
														Correo electrónico *
													</Label>
													<Input
														id="email-dashboard"
														type="email"
														name="email"
														value={formData.email}
														onChange={handleInputChange}
														placeholder="tu@email.com"
														className="h-12 text-base border-2 rounded-lg"
														required
													/>
												</div>

												<div className="space-y-2">
													<Label htmlFor="telefono-dashboard" className="text-base font-semibold">
														Teléfono (WhatsApp) *
													</Label>
													<Input
														id="telefono-dashboard"
														type="tel"
														name="telefono"
														value={formData.telefono}
														onChange={handleInputChange}
														placeholder="+56 9 1234 5678"
														className="h-12 text-base border-2 rounded-lg"
														required
													/>
													{phoneError && (
														<p className="text-sm text-red-600">{phoneError}</p>
													)}
												</div>
											</div>
										</div>

										{/* Código de descuento */}
										<CodigoDescuento
											codigoAplicado={codigoAplicado}
											codigoError={codigoError}
											validandoCodigo={validandoCodigo}
											onAplicarCodigo={onAplicarCodigo}
											onRemoverCodigo={onRemoverCodigo}
										/>

										{/* Información importante */}
										<div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-6">
											<h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
												<Info className="w-5 h-5" />
												Proceso de reserva
											</h4>
											<ul className="space-y-2 text-sm text-blue-800">
												<li className="flex items-start gap-2">
													<span className="text-blue-600">✓</span>
													<span>
														Paga ahora de forma segura y confirma tu reserva
													</span>
												</li>
												<li className="flex items-start gap-2">
													<span className="text-blue-600">✓</span>
													<span>
														Después del pago, podrás especificar detalles adicionales
														(número de vuelo, hotel, equipaje especial, etc.)
													</span>
												</li>
												<li className="flex items-start gap-2">
													<span className="text-blue-600">✓</span>
													<span>
														Recibirás confirmación por email y WhatsApp
													</span>
												</li>
											</ul>
										</div>

										{/* Consentimiento */}
										<div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
											<Checkbox
												id="consent-dashboard"
												checked={paymentConsent}
												onCheckedChange={(value) => setPaymentConsent(Boolean(value))}
												className="mt-1 w-5 h-5"
											/>
											<label
												htmlFor="consent-dashboard"
												className="text-sm text-gray-700 cursor-pointer"
											>
												Acepto recibir la confirmación por email y WhatsApp, y
												comprendo que podré completar los detalles adicionales
												después de confirmar el pago.
											</label>
										</div>

										{stepError && (
											<div className="rounded-lg bg-red-50 border border-red-200 p-4">
												<p className="text-red-800 font-medium">{stepError}</p>
											</div>
										)}

										<div className="flex items-center justify-between pt-4">
											<Button
												type="button"
												variant="outline"
												onClick={handleStepBack}
												disabled={isSubmitting}
												className="px-6 py-3"
											>
												← Volver
											</Button>
											<Button
												type="button"
												onClick={handleStepTwoNext}
												disabled={isSubmitting || !paymentConsent}
												className="bg-accent hover:bg-accent/90 text-accent-foreground px-10 py-6 text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
											>
												{isSubmitting ? (
													<>
														<LoaderCircle className="mr-2 h-5 w-5 animate-spin" />
														Procesando...
													</>
												) : (
													<>
														Ir al pago
														<ArrowRight className="ml-2 w-5 h-5" />
													</>
												)}
											</Button>
										</div>
									</div>
								)}

								{/* PASO 3: Selección de método de pago */}
								{currentStep === 2 && (
									<div className="space-y-6">
										<div className="text-center mb-8">
											<h3 className="text-3xl font-bold text-gray-900 mb-2">
												Confirma tu pago
											</h3>
											<p className="text-gray-600">
												Selecciona tu opción y método de pago preferido
											</p>
										</div>

										{/* Opciones de monto */}
										<div>
											<h4 className="font-semibold text-lg mb-4 text-gray-900">
												💰 ¿Cuánto deseas pagar?
											</h4>
											<div className="grid gap-4 md:grid-cols-2">
												{paymentOptions.map((option) => (
													<div
														key={option.id}
														onClick={() => setSelectedPaymentOption(option.id)}
														className={`relative cursor-pointer rounded-xl border-2 p-6 transition-all ${
															selectedPaymentOption === option.id
																? "border-accent bg-accent/10 shadow-lg scale-105"
																: "border-gray-200 hover:border-accent/50 hover:shadow-md"
														}`}
													>
														{option.recommended && (
															<Badge className="absolute -top-3 right-4 bg-green-500 text-white">
																{option.badge}
															</Badge>
														)}
														{!option.recommended && option.badge && (
															<Badge className="absolute -top-3 right-4 bg-blue-500 text-white">
																{option.badge}
															</Badge>
														)}
														<div className="flex items-center justify-between">
															<div>
																<p className="text-lg font-bold text-gray-900 mb-1">
																	{option.title}
																</p>
																<p className="text-sm text-gray-600">
																	{option.subtitle}
																</p>
															</div>
															<div className="text-right">
																<p className="text-2xl font-bold text-accent">
																	{formatCurrency(option.amount)}
																</p>
															</div>
														</div>
													</div>
												))}
											</div>
										</div>

										{/* Métodos de pago */}
										<div>
											<h4 className="font-semibold text-lg mb-4 text-gray-900">
												💳 Método de pago
											</h4>
											<div className="grid gap-4 md:grid-cols-2">
												{paymentMethods.map((method) => (
													<div
														key={method.id}
														onClick={() => setSelectedPaymentMethod(method.id)}
														className={`cursor-pointer rounded-xl border-2 p-6 transition-all ${
															selectedPaymentMethod === method.id
																? "border-accent bg-accent/10 shadow-lg scale-105"
																: "border-gray-200 hover:border-accent/50 hover:shadow-md"
														}`}
													>
														<div className="flex items-center gap-4">
															<img
																src={method.image}
																alt={method.title}
																className="w-16 h-16 object-contain"
															/>
															<div>
																<p className="text-lg font-bold text-gray-900">
																	{method.title}
																</p>
																<p className="text-sm text-gray-600">
																	{method.subtitle}
																</p>
															</div>
														</div>
													</div>
												))}
											</div>
										</div>

										{stepError && (
											<div className="rounded-lg bg-red-50 border border-red-200 p-4">
												<p className="text-red-800 font-medium">{stepError}</p>
											</div>
										)}

										<div className="flex items-center justify-between pt-6 border-t-2">
											<Button
												type="button"
												variant="outline"
												onClick={handleStepBack}
												disabled={isAnotherGatewayLoading || selectedCombinationLoading}
												className="px-6 py-3"
											>
												← Volver
											</Button>
											<Button
												type="button"
												onClick={handleProceedToPayment}
												disabled={
													!selectedPaymentOption ||
													!selectedPaymentMethod ||
													isAnotherGatewayLoading ||
													selectedCombinationLoading ||
													!canPay
												}
												className="bg-accent hover:bg-accent/90 text-accent-foreground px-12 py-6 text-xl font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
											>
												{selectedCombinationLoading ? (
													<>
														<LoaderCircle className="mr-2 h-6 w-6 animate-spin" />
														Procesando pago...
													</>
												) : (
													<>
														Pagar{" "}
														{formatCurrency(
															paymentOptions.find(
																(opt) => opt.id === selectedPaymentOption
															)?.amount || 0
														)}
													</>
												)}
											</Button>
										</div>
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

export default HeroDashboard;
