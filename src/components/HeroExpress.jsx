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
		<section id="inicio" className="bg-slate-50">
			<div className="container mx-auto px-4 py-12 md:py-20">
				<div className="grid gap-12 md:grid-cols-[minmax(0,1fr)_minmax(0,380px)] md:items-center">
					<div className="space-y-6">
						<div className="space-y-2">
							<span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
								Traslados privados en La Araucanía
							</span>
							<h1 className="text-3xl md:text-4xl font-bold text-slate-900">
								Conecta el aeropuerto con tu destino en un par de pasos
							</h1>
							<p className="text-base md:text-lg text-slate-600">
								Gestiona tu traslado express con un flujo claro y directo. Confirmas
								tu ruta, compartes tus datos y decides cómo pagar en minutos.
							</p>
						</div>
						<div className="flex flex-col sm:flex-row gap-4">
							<Button
								onClick={() => setShowBookingModule(true)}
								className="w-full sm:w-auto bg-primary text-white hover:bg-primary/90 px-6 py-3 text-base font-semibold"
							>
								Reservar en línea
							</Button>
							<Button
								variant="outline"
								className="w-full sm:w-auto border-slate-300 text-slate-700 hover:bg-slate-100"
								asChild
							>
								<a href="#consultar-reserva">Tengo un código</a>
							</Button>
						</div>
						<div className="flex items-center gap-2 text-sm text-slate-500">
							<Calendar className="h-4 w-4" />
							<span>Flujo simple en dos etapas con confirmación inmediata</span>
						</div>
					</div>

					{!showBookingModule && (
						<div className="hidden md:block">
							<div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white">
								<img
									src={heroVan}
									alt="Transporte privado"
									className="h-full w-full object-cover"
								/>
							</div>
						</div>
					)}
				</div>

				{showBookingModule && (
					<div className="mt-12">
						<Card className="max-w-4xl mx-auto border border-slate-200 shadow-sm">
							<CardHeader className="space-y-4">
								<div className="flex flex-wrap items-center justify-between gap-3">
									<Button
										variant="ghost"
										size="sm"
										onClick={() => setShowBookingModule(false)}
										className="text-slate-500 hover:text-slate-700"
									>
										Volver
									</Button>
									<div className="flex items-center gap-2 text-sm text-slate-600">
										<Badge variant="secondary" className="bg-primary/10 text-primary">
											Descuento {baseDiscountPercentage}%
										</Badge>
										{promoDiscountPercentage > 0 && (
											<Badge variant="outline" className="border-primary/40 text-primary">
												Extra +{promoDiscountPercentage}%
											</Badge>
										)}
									</div>
								</div>

								<div className="space-y-3">
									<div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
										{steps.map((step, index) => {
											const isCompleted = index < currentStep;
											const isActive = index === currentStep;

											return (
												<React.Fragment key={step.title}>
													<div className="flex items-center gap-3">
														<span
															className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${
																isCompleted
																        ? "bg-primary text-white"
																        : isActive
																        ? "bg-primary/90 text-white"
																        : "bg-slate-200 text-slate-600"
																}`}
															>
																{isCompleted ? "✓" : index + 1}
															</span>
															<div className="space-y-0.5">
																<p className="text-sm font-semibold text-slate-900">
																	{step.title}
																</p>
																<p className="text-xs text-slate-500">
																	{step.description}
																</p>
															</div>
														</div>
														{index < steps.length - 1 && (
															<span className="hidden md:block h-px flex-1 bg-slate-200" aria-hidden="true"></span>
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
                                                                                                        className="text-sm font-semibold text-slate-600"
                                                                                                >
                                                                                                        Origen
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
                                                                                                        className="text-sm font-semibold text-slate-600"
                                                                                                >
                                                                                                        Destino
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
                                                                                                        className="text-sm font-semibold text-slate-600"
                                                                                                >
                                                                                                        Fecha del traslado
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
                                                                                                        className="text-sm font-semibold text-slate-600"
                                                                                                >
                                                                                                        Pasajeros
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
                                                                                                        className="text-sm font-semibold text-slate-600 leading-relaxed cursor-pointer"
                                                                                                >
                                                                                                        ¿Necesitas el regreso?
                                                                                                        <span className="block text-xs font-normal text-slate-500">
                                                                                                                Gestiona ida y vuelta con la misma reserva.
                                                                                                        </span>
                                                                                                </label>
											</div>

											{formData.idaVuelta && (
												<div className="pt-4 border-t border-muted/40">
													<div className="space-y-2">
                                                                                                                <Label
                                                                                                                        htmlFor="fecha-regreso-express"
                                                                                                                        className="text-sm font-semibold text-slate-600"
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
															className="h-12 text-base"
															required={formData.idaVuelta}
														/>
                                                                                                                <p className="text-xs text-slate-500">
                                                                                                                        Podrás definir la hora exacta al confirmar el servicio.
                                                                                                                </p>
													</div>
												</div>
											)}
										</div>

										{/* Precio estimado */}
										{mostrarPrecio ? (
                                                                                        <div className="rounded-lg border border-slate-200 bg-white p-5">
												<div className="grid gap-4 md:grid-cols-2 md:items-center">
													<div className="space-y-2">
                                                                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                                                                        <Badge
                                                                                                                                variant="outline"
                                                                                                                                className="text-xs font-medium text-slate-600"
                                                                                                                        >
                                                                                                                                Precio estimado
                                                                                                                        </Badge>
                                                                                                                        <Badge
                                                                                                                                variant="secondary"
                                                                                                                                className="bg-primary/10 text-primary"
                                                                                                                        >
                                                                                                                                -{baseDiscountPercentage}% web
                                                                                                                        </Badge>
															{formData.idaVuelta &&
																pricing.descuentoRoundTrip > 0 && (
                                                                                                                                <Badge
                                                                                                                                        variant="outline"
                                                                                                                                        className="text-xs font-medium text-slate-600"
                                                                                                                                >
                                                                                                                                        Ida y vuelta
                                                                                                                                </Badge>
																)}
														</div>
                                                                                                                <p className="text-2xl font-semibold text-slate-900">
															{formatCurrency(pricing.totalConDescuento)}
														</p>
                                                                                                                <p className="text-xs text-slate-500">
															Vehículo: {cotizacion.vehiculo}
															{formData.idaVuelta && " · Ida y vuelta"}
														</p>
													</div>
                                                                                                        <div className="text-left md:text-right space-y-1">
                                                                                                                <p className="text-xs text-slate-400 line-through">
															Precio regular:{" "}
															{formatCurrency(pricing.precioBase)}
														</p>
                                                                                                                <p className="text-sm font-medium text-slate-600">
															Ahorro total:{" "}
															{formatCurrency(
																pricing.descuentoBase +
																	pricing.descuentoRoundTrip +
																	pricing.descuentoCodigo
															)}
														</p>
														{formData.idaVuelta &&
															pricing.descuentoRoundTrip > 0 && (
                                                                                                                                <p className="text-xs text-slate-500">
                                                                                                                                        Incluye beneficio ida y vuelta:{" "}
																	{formatCurrency(pricing.descuentoRoundTrip)}
																</p>
															)}
													</div>
												</div>
											</div>
                                                                                ) : (
                                                                                        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-5 text-center">
                                                                                                <p className="font-semibold text-slate-700">
                                                                                                        Cotización personalizada
                                                                                                </p>
                                                                                                <p className="text-xs text-slate-500">
                                                                                                        Te enviaremos el monto final junto con la confirmación.
                                                                                                </p>
                                                                                        </div>
                                                                                )}

                                                                                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                                                                        <p className="text-xs text-slate-500">
                                                                                                Verifica la información y avanza cuando estés listo.
                                                                                        </p>
                                                                                        <Button
                                                                                                type="button"
                                                                                                onClick={handleStepOneNext}
                                                                                                className="w-full md:w-auto bg-primary text-white hover:bg-primary/90 px-6 py-3 text-base font-semibold"
                                                                                                disabled={isSubmitting}
                                                                                        >
                                                                                                Continuar al siguiente paso
                                                                                        </Button>
                                                                                </div>
									</div>
								)}

								{/* PASO 2: Datos personales y pago */}
								{currentStep === 1 && (
									<div className="space-y-6">
										{/* Resumen del viaje */}
                                                                                <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
                                                                                        <h4 className="text-base font-semibold text-slate-700">
                                                                                                Resumen del traslado
                                                                                        </h4>
											<div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
												<div>
													<span className="text-muted-foreground">Ruta:</span>
													<p className="font-medium">
														{origenFinal} → {destinoFinal}
                                                                                                                {formData.idaVuelta && (
                                                                                                                        <>
                                                                                                                                <br />
                                                                                                                                <span className="text-slate-500">
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
                                                                                                                                <span className="text-slate-500">
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
                                                                                                                <span className="text-xl font-semibold text-slate-900">
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
                                                                                                        className="text-sm font-semibold text-slate-600"
                                                                                                >
                                                                                                        Nombre completo <span className="text-destructive">*</span>
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
                                                                                                        className="text-sm font-semibold text-slate-600"
                                                                                                >
                                                                                                        Correo electrónico <span className="text-destructive">*</span>
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
                                                                                                        className="text-sm font-semibold text-slate-600"
                                                                                                >
                                                                                                        Teléfono <span className="text-destructive">*</span>
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

										{/* Opciones de pago - Solo si todos los campos están completos */}
										{mostrarPrecio &&
											!requiereCotizacionManual &&
											todosLosCamposCompletos && (
												<div className="space-y-4">
													<h4 className="font-semibold text-lg">
														💳 Opciones de pago
													</h4>

													{/* Paso 1: Seleccionar tipo de pago (40% o 100%) */}
													{!selectedPaymentType && (
														<div className="space-y-3">
															<p className="text-sm text-muted-foreground">
																Elige cuánto deseas pagar ahora
															</p>
															<div className="grid gap-3 md:grid-cols-2">
																{paymentOptions.map((option) => (
																	<button
																		key={option.id}
																		type="button"
																		onClick={() =>
																			setSelectedPaymentType(option.type)
																		}
																		className={`border rounded-lg p-4 text-left transition-all hover:border-primary hover:shadow-md ${
																			option.recommended
																				? "border-primary bg-primary/5 ring-2 ring-primary/20"
																				: "border-gray-200"
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
																				<Badge
																					variant="default"
																					className="text-xs"
																				>
																					Recomendado
																				</Badge>
																			)}
																		</div>
																		<p className="text-xl font-bold text-primary">
																			{formatCurrency(option.amount)}
																		</p>
																	</button>
																))}
															</div>
														</div>
													)}

													{/* Paso 2: Seleccionar método de pago una vez elegido el tipo */}
													{selectedPaymentType && (
														<div className="space-y-3">
															<div className="flex items-center justify-between">
																<div>
																	<p className="text-sm text-muted-foreground">
																		Elige tu método de pago
																	</p>
																	<p className="text-lg font-semibold text-primary">
																		Pagarás:{" "}
																		{formatCurrency(
																			paymentOptions.find(
																				(opt) =>
																					opt.type === selectedPaymentType
																			)?.amount || 0
																		)}
																	</p>
																</div>
																<Button
																	type="button"
																	variant="ghost"
																	size="sm"
																	onClick={() => setSelectedPaymentType(null)}
																	className="text-sm"
																>
																	← Cambiar monto
																</Button>
															</div>

															<div className="grid gap-3 md:grid-cols-2">
																{paymentMethods.map((method) => (
																	<Button
																		key={method.id}
																		type="button"
																		variant="outline"
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
																		className="h-auto p-4 flex flex-col items-center gap-2 hover:border-primary hover:bg-primary/5"
																	>
																		{loadingGateway ===
																		`${method.gateway}-${selectedPaymentType}` ? (
																			<LoaderCircle className="h-8 w-8 animate-spin" />
																		) : (
																			<img
																				src={method.image}
																				alt={method.title}
																				className="h-8 w-auto object-contain"
																			/>
																		)}
																		<span className="text-sm font-medium">
																			{method.title}
																		</span>
																		<span className="text-xs text-muted-foreground text-center">
																			{method.subtitle}
																		</span>
																	</Button>
																))}
															</div>
														</div>
													)}
												</div>
											)}

										{/* Mensaje cuando faltan campos por completar */}
										{mostrarPrecio &&
											!requiereCotizacionManual &&
											!todosLosCamposCompletos && (
												<div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
													<p className="text-sm text-amber-800 font-medium">
														⚠️ Completa todos los campos obligatorios para ver
														las opciones de pago
													</p>
													<ul className="text-xs text-amber-700 mt-2 space-y-1 ml-5 list-disc">
														{!formData.nombre?.trim() && (
															<li>Nombre completo</li>
														)}
														{(!formData.email?.trim() ||
															!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
																formData.email
															)) && <li>Correo electrónico válido</li>}
														{!formData.telefono?.trim() && <li>Teléfono</li>}
														{!paymentConsent && (
															<li>Aceptar términos y condiciones</li>
														)}
													</ul>
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
										<div className="space-y-3">
											{/* Botón de volver */}
											<div className="flex justify-start">
												<Button
													type="button"
													variant="outline"
													onClick={handleStepBack}
													disabled={isSubmitting}
													size="sm"
												>
													← Volver
												</Button>
											</div>

											{requiereCotizacionManual ? (
												<Button asChild className="w-full" variant="secondary">
													<a href="#contacto">
														Solicitar cotización personalizada
													</a>
												</Button>
											) : (
												<div className="space-y-3">
													{/* Botón para guardar reserva sin pagar */}
													<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
														<div className="flex items-start gap-3 mb-3">
															<div className="flex-1">
																<h5 className="font-medium text-blue-900 mb-1">
																	💾 Guardar y continuar después
																</h5>
																<p className="text-sm text-blue-700">
																	Guarda tu reserva ahora y recibe un enlace por
																	email para pagar más tarde
																</p>
															</div>
														</div>
														<Button
															type="button"
															onClick={handleGuardarReserva}
															disabled={
																isSubmitting || !todosLosCamposCompletos
															}
															variant="outline"
															className="w-full border-blue-300 text-blue-700 hover:bg-blue-100"
														>
															{isSubmitting ? (
																<>
																	<LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
																	Guardando reserva...
																</>
															) : (
																"Guardar reserva para después"
															)}
														</Button>
													</div>

													{/* Instrucciones para pago inmediato */}
													{todosLosCamposCompletos && (
														<div className="bg-green-50 border border-green-200 rounded-lg p-4">
															<p className="text-sm text-green-800 font-medium mb-2">
																✅ ¿Listo para pagar? Selecciona el monto y
																método de pago arriba
															</p>
															<p className="text-xs text-green-700">
																Al elegir una opción de pago arriba, tu reserva
																se guardará automáticamente y serás redirigido
																al proceso de pago seguro
															</p>
														</div>
													)}
												</div>
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
