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
			className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white min-h-screen flex items-center"
		>
			<div
				className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
				style={{ backgroundImage: `url(${heroVan})` }}
			></div>
			<div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/30 to-black/50"></div>

			<div className="relative container mx-auto px-4 text-center pt-12 md:pt-20 pb-16 md:pb-24">
				{!showBookingModule && (
					<div className="max-w-4xl mx-auto space-y-8">
						<div className="space-y-4">
							<h1 className="text-5xl md:text-7xl font-extrabold leading-tight tracking-tight">
								Traslados Privados
								<br />
								<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
									Aeropuerto La Araucanía
								</span>
							</h1>
							<p className="text-xl md:text-2xl text-blue-100 font-light max-w-2xl mx-auto">
								Viaja con comodidad y seguridad hacia Pucón, Villarrica y todos los destinos turísticos
							</p>
						</div>

						{/* Badge de descuento más limpio */}
						<div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/50 rounded-full px-6 py-3 backdrop-blur-sm">
							<span className="text-2xl">🎉</span>
							<span className="text-lg font-semibold text-emerald-300">
								{baseDiscountPercentage}% de descuento web
								{promoDiscountPercentage > 0 && ` + ${promoDiscountPercentage}% extra`}
							</span>
						</div>

						{/* Botones compactos tipo dashboard */}
						<div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
							<Button
								onClick={() => setShowBookingModule(true)}
								className="group bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-4 text-base font-bold rounded-lg shadow-lg hover:shadow-blue-500/30 transition-all will-change-transform hover:scale-[1.02]"
							>
								Reservar ahora
								<span className="ml-2 group-hover:translate-x-1 transition-transform inline-block" aria-hidden="true">→</span>
							</Button>
							<Button
								variant="outline"
								className="bg-white/10 border-2 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm px-6 py-4 text-sm rounded-lg hover:scale-[1.02] transition-all"
								asChild
							>
								<a href="#consultar-reserva">Continuar con código</a>
							</Button>
						</div>

						{/* Features con iconos minimalistas */}
						<div className="flex flex-wrap items-center justify-center gap-6 text-sm text-blue-200 pt-6">
							<div className="flex items-center gap-2">
								<div className="w-2 h-2 rounded-full bg-emerald-400"></div>
								<span>Proceso en 2 minutos</span>
							</div>
							<div className="flex items-center gap-2">
								<div className="w-2 h-2 rounded-full bg-emerald-400"></div>
								<span>Pago 100% seguro</span>
							</div>
							<div className="flex items-center gap-2">
								<div className="w-2 h-2 rounded-full bg-emerald-400"></div>
								<span>Confirmación inmediata</span>
							</div>
						</div>
					</div>
				)}

				{showBookingModule && (
					<div className="w-full max-w-7xl mx-auto">
						{/* Header compacto */}
						<div className="text-center mb-4">
							<h2 className="text-2xl md:text-3xl font-bold text-white mb-1">
								Completa tu reserva
							</h2>
							<p className="text-sm text-blue-200">
								Solo 2 pasos • {baseDiscountPercentage}% de descuento aplicado
							</p>
						</div>

						<div className="grid lg:grid-cols-[1fr_400px] gap-6">
							{/* Columna principal: Formulario */}
							<Card className="bg-white shadow-2xl border-0 overflow-hidden">
							{/* Header compacto */}
							<div className="bg-gradient-to-r from-blue-50 to-slate-50 px-4 py-3 border-b border-gray-100">
								<div className="flex items-center justify-between">
									<Button
										variant="ghost"
										size="sm"
										onClick={() => setShowBookingModule(false)}
										className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 -ml-2 text-sm"
									>
										← Volver
									</Button>
									<div className="flex items-center gap-1.5">
										<div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-xs font-medium">
											<div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
											{baseDiscountPercentage}% descuento
										</div>
										{promoDiscountPercentage > 0 && (
											<div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-xs font-medium">
												+{promoDiscountPercentage}%
											</div>
										)}
									</div>
								</div>
							</div>

							{/* Indicador de progreso compacto */}
							<div className="px-4 py-3 border-b border-gray-100">
								<div className="flex items-center justify-between">
									{steps.map((step, index) => {
										const isCompleted = index < currentStep;
										const isActive = index === currentStep;

										return (
											<React.Fragment key={step.title}>
												<div className="flex flex-col items-center flex-1">
													<div
														className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
															isCompleted
																? "bg-emerald-500 text-white"
																: isActive
																? "bg-blue-600 text-white ring-2 ring-blue-100"
																: "bg-gray-200 text-gray-400"
														}`}
														aria-label={isCompleted ? "Paso completado" : `Paso ${index + 1}`}
													>
														{isCompleted ? (
															<span aria-hidden="true">✓</span>
														) : (
															index + 1
														)}
													</div>
													<p className={`text-xs mt-1 font-medium ${
														isActive ? "text-blue-600" : "text-gray-500"
													}`}>
														{step.title}
													</p>
												</div>
												{index < steps.length - 1 && (
													<div 
														className={`h-0.5 flex-1 mx-2 ${
															isCompleted ? "bg-emerald-500" : "bg-gray-200"
														}`}
														style={{ marginTop: 'calc(-1rem - 2px)' }}
														aria-hidden="true"
													></div>
												)}
											</React.Fragment>
										);
									})}
								</div>
							</div>

							<CardContent className="p-5">
								{/* PASO 1: Información básica del viaje */}
								{currentStep === 0 && (
									<div className="space-y-4">
										<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
											<div className="space-y-2">
												<Label
													htmlFor="origen-express"
													className="text-sm font-semibold text-gray-900"
												>
													Origen
												</Label>
												<select
													id="origen-express"
													name="origen"
													value={formData.origen}
													onChange={handleInputChange}
													className="flex h-11 w-full items-center justify-between rounded-lg border-2 border-gray-300 bg-white px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
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
													className="text-sm font-semibold text-gray-900"
												>
													Destino
												</Label>
												<select
													id="destino-express"
													name="destino"
													value={formData.destino}
													onChange={handleInputChange}
													className="flex h-11 w-full items-center justify-between rounded-lg border-2 border-gray-300 bg-white px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
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

										<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
											<div className="space-y-2">
												<Label
													htmlFor="fecha-express"
													className="text-sm font-semibold text-gray-900 flex items-center gap-1.5"
												>
													<Calendar className="h-4 w-4 text-blue-600" />
													Fecha del traslado
												</Label>
												<Input
													id="fecha-express"
													type="date"
													name="fecha"
													value={formData.fecha}
													onChange={handleInputChange}
													min={minDateTime}
													className="h-11 text-sm border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500 font-medium"
													required
												/>
											</div>

											<div className="space-y-2">
												<Label
													htmlFor="pasajeros-express"
													className="text-sm font-semibold text-gray-900 flex items-center gap-1.5"
												>
													<Users className="h-4 w-4 text-blue-600" />
													Pasajeros
												</Label>
												<select
													id="pasajeros-express"
													name="pasajeros"
													value={formData.pasajeros}
													onChange={handleInputChange}
													className="flex h-11 w-full items-center justify-between rounded-lg border-2 border-gray-300 bg-white px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
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

										{/* Opción de ida y vuelta compacta */}
										<div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 space-y-3">
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
													className="mt-0.5"
												/>
												<label
													htmlFor="ida-vuelta-express"
													className="text-sm font-medium leading-snug cursor-pointer flex-1"
												>
													<span className="text-gray-900 font-bold">¿También necesitas el regreso?</span>
													<span className="block text-xs text-gray-600 font-normal mt-0.5">
														Coordina ida y vuelta en una reserva y ahorra más
													</span>
												</label>
											</div>

											{formData.idaVuelta && (
												<div className="pt-3 border-t-2 border-blue-200">
													<div className="space-y-2">
														<Label
															htmlFor="fecha-regreso-express"
															className="text-sm font-semibold text-gray-900 flex items-center gap-1.5"
														>
															<Calendar className="h-4 w-4 text-blue-600" />
															Fecha de regreso
														</Label>
														<Input
															id="fecha-regreso-express"
															type="date"
															name="fechaRegreso"
															value={formData.fechaRegreso}
															onChange={handleInputChange}
															min={formData.fecha || minDateTime}
															className="h-11 text-sm border-2 border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 rounded-lg font-medium"
															required={formData.idaVuelta}
														/>
														<div className="bg-blue-100 rounded-lg p-2">
															<p className="text-xs text-blue-800">
																La hora exacta de regreso la especificarás después del pago
															</p>
														</div>
													</div>
												</div>
											)}
										</div>

										{/* Precio estimado compacto */}
										{mostrarPrecio ? (
											<div className="bg-gradient-to-br from-blue-50 to-slate-50 rounded-xl p-5 border border-blue-100">
												<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
													<div className="space-y-2">
														<div className="flex items-center gap-2">
															<span className="text-xs font-medium text-gray-600">Precio total con descuento</span>
															{formData.idaVuelta && (
																<span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
																	Ida y vuelta
																</span>
															)}
														</div>
														<p className="text-3xl font-bold text-blue-600">
															{formatCurrency(pricing.totalConDescuento)}
														</p>
														<p className="text-xs text-gray-600">
															{cotizacion.vehiculo} • {formData.pasajeros} {formData.pasajeros === "1" ? "pasajero" : "pasajeros"}
														</p>
													</div>
													<div className="text-left md:text-right space-y-1.5 md:min-w-[180px]">
														<div className="space-y-0.5">
															<p className="text-xs text-gray-500 line-through">
																{formatCurrency(pricing.precioBase)}
															</p>
															<div className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-700 px-2.5 py-1.5 rounded-lg">
																<span className="text-sm font-bold">
																	Ahorras {formatCurrency(
																		pricing.descuentoBase +
																			pricing.descuentoRoundTrip +
																			pricing.descuentoCodigo
																	)}
																</span>
															</div>
														</div>
													</div>
												</div>
											</div>
										) : (
											<div className="bg-blue-50 rounded-2xl p-6 text-center border border-blue-100">
												<p className="text-lg font-semibold text-blue-900 mb-1">
													Cotización personalizada
												</p>
												<p className="text-sm text-blue-700">
													Te enviaremos el precio exacto por correo
												</p>
											</div>
										)}

										<div className="pt-4">
											<div className="bg-blue-50 rounded-xl p-4 mb-6 border-2 border-blue-200">
												<p className="text-sm text-blue-900 font-medium">
													<span className="font-bold">Siguiente paso:</span> Ingresarás tus datos y podrás ajustar la hora exacta después del pago
												</p>
											</div>
											<Button
												type="button"
												onClick={handleStepOneNext}
												className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3.5 text-base font-semibold rounded-lg shadow-md hover:shadow-lg transition-all will-change-transform hover:scale-[1.01]"
												disabled={isSubmitting}
											>
												Continuar al pago
												<span className="ml-2" aria-hidden="true">→</span>
											</Button>
										</div>
									</div>
								)}

								{/* PASO 2: Datos personales y pago */}
								{currentStep === 1 && (
									<div className="space-y-8">
										{/* Resumen del viaje - diseño más limpio */}
										<div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-6 border border-slate-200">
											<h4 className="font-bold text-lg mb-4 text-gray-900">
												Resumen de tu traslado
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
															Incluye ida y vuelta
														</p>
													)}
												</div>
											)}
										</div>

										{/* Datos personales compactos */}
										<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
											<div className="space-y-2">
												<Label
													htmlFor="nombre-express"
													className="text-sm font-semibold text-gray-900"
												>
													Nombre completo
													<span className="text-red-500 ml-1">*</span>
												</Label>
												<Input
													id="nombre-express"
													name="nombre"
													value={formData.nombre}
													onChange={handleInputChange}
													placeholder="Ej: Juan Pérez"
													className="h-11 text-sm border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500 font-medium"
													required
												/>
											</div>

											<div className="space-y-2">
												<Label
													htmlFor="email-express"
													className="text-sm font-semibold text-gray-900"
												>
													Correo electrónico
													<span className="text-red-500 ml-1">*</span>
												</Label>
												<Input
													id="email-express"
													type="email"
													name="email"
													value={formData.email}
													onChange={handleInputChange}
													onBlur={(e) => verificarReservaActiva(e.target.value)}
													placeholder="tu@email.cl"
													className="h-11 text-sm border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500 font-medium"
													required
												/>
												{verificandoReserva && (
													<p className="text-xs text-blue-600 flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg">
														<LoaderCircle className="w-4 h-4 animate-spin" />
														Verificando reservas...
													</p>
												)}
												{reservaActiva && (
													<div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 text-sm">
														<p className="font-bold text-amber-900 mb-2">
															Tienes una reserva sin pagar
														</p>
														<p className="text-amber-800 text-xs">
															Código:{" "}
															<span className="font-mono font-bold bg-amber-100 px-2 py-1 rounded">
																{reservaActiva.codigoReserva}
															</span>
															<br />
															<span className="text-xs mt-1 block">
																Al continuar, se modificará tu reserva existente en lugar de crear una nueva.
															</span>
														</p>
													</div>
												)}
											</div>

											<div className="space-y-2">
												<Label
													htmlFor="telefono-express"
													className="text-sm font-semibold text-gray-900"
												>
													Teléfono
													<span className="text-red-500 ml-1">*</span>
												</Label>
												<Input
													id="telefono-express"
													name="telefono"
													value={formData.telefono}
													onChange={handleInputChange}
													placeholder="+56 9 1234 5678"
													className="h-11 text-sm border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500 font-medium"
													required
												/>
												{phoneError && (
													<p className="text-xs text-amber-700 bg-amber-50 px-2 py-1.5 rounded-lg border border-amber-200">
														{phoneError}
													</p>
												)}
											</div>
										</div>

										{/* Código de descuento compacto */}
										<div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-4">
											<h4 className="font-bold mb-3 text-sm text-gray-900">
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

										{/* Opciones de pago - diseño mejorado */}
										{mostrarPrecio &&
											!requiereCotizacionManual &&
											todosLosCamposCompletos && (
												<div className="space-y-6">
													<div className="flex items-center gap-3">
														<div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white text-xl font-bold">
															3
														</div>
														<h4 className="font-bold text-xl text-gray-900">
															Elige tu opción de pago
														</h4>
													</div>

													{/* Paso 1: Seleccionar tipo de pago - Cards compactas tipo dashboard */}
													{!selectedPaymentType && (
														<div className="space-y-3">
															<p className="text-gray-600 text-sm">
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
																		className={`group relative overflow-hidden rounded-lg p-4 text-left transition-all will-change-transform hover:scale-[1.01] ${
																			option.recommended
																				? "bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-md hover:shadow-lg"
																				: "bg-white border-2 border-gray-200 hover:border-blue-300 hover:shadow-md"
																		}`}
																	>
																		{option.recommended && (
																			<div className="absolute top-3 right-3">
																				<span className="bg-emerald-400 text-emerald-900 text-xs font-bold px-2 py-0.5 rounded-full">
																					Recomendado
																				</span>
																			</div>
																		)}
																		<div className="space-y-2">
																			<div>
																				<h5 className={`text-base font-bold mb-0.5 ${
																					option.recommended ? "text-white" : "text-gray-900"
																				}`}>
																					{option.title}
																				</h5>
																				<p className={`text-xs ${
																					option.recommended ? "text-blue-100" : "text-gray-600"
																				}`}>
																					{option.subtitle}
																				</p>
																			</div>
																			<p className={`text-2xl font-bold ${
																				option.recommended ? "text-white" : "text-blue-600"
																			}`}>
																				{formatCurrency(option.amount)}
																			</p>
																		</div>
																	</button>
																))}
															</div>
														</div>
													)}

													{/* Paso 2: Seleccionar método de pago - diseño mejorado */}
													{selectedPaymentType && (
														<div className="space-y-6">
															<div className="bg-gradient-to-br from-blue-50 to-slate-50 rounded-xl p-6 border border-blue-100">
																<div className="flex items-center justify-between">
																	<div>
																		<p className="text-sm text-gray-600 mb-1">
																			Monto a pagar
																		</p>
																		<p className="text-3xl font-bold text-blue-600">
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
																		variant="outline"
																		size="sm"
																		onClick={() => setSelectedPaymentType(null)}
																		className="border-gray-300 hover:bg-gray-100"
																	>
																		← Cambiar
																	</Button>
																</div>
															</div>

															<div>
																<p className="text-gray-700 font-medium mb-4">Selecciona tu método de pago</p>
																<div className="space-y-3">
																	{paymentMethods.map((method) => (
																		<button
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
																			className="w-full bg-white border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 rounded-xl p-6 flex items-center justify-between transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
																		>
																			<div className="flex items-center gap-4">
																				{loadingGateway ===
																				`${method.gateway}-${selectedPaymentType}` ? (
																					<LoaderCircle className="h-10 w-10 animate-spin text-blue-600" />
																				) : (
																					<img
																						src={method.image}
																						alt={method.title}
																						className="h-10 w-auto object-contain"
																					/>
																				)}
																				<div className="text-left">
																					<p className="font-bold text-gray-900">
																						{method.title}
																					</p>
																					<p className="text-sm text-gray-600">
																						{method.subtitle}
																					</p>
																				</div>
																			</div>
																			<span className="text-2xl text-gray-400">→</span>
																		</button>
																	))}
																</div>
															</div>
														</div>
													)}
												</div>
											)}

										{/* Mensaje cuando faltan campos compacto */}
										{mostrarPrecio &&
											!requiereCotizacionManual &&
											!todosLosCamposCompletos && (
												<div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4">
													<div className="flex items-start gap-2.5">
														<div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white text-sm flex-shrink-0 font-bold">
															!
														</div>
														<div className="flex-1">
															<p className="font-bold text-amber-900 mb-1.5 text-sm">
																Completa la información requerida
															</p>
															<ul className="text-xs text-amber-800 space-y-1">
																{!formData.nombre?.trim() && (
																	<li className="flex items-center gap-2">
																		<div className="w-1.5 h-1.5 rounded-full bg-amber-600"></div>
																		Nombre completo
																	</li>
																)}
																{(!formData.email?.trim() ||
																	!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
																		formData.email
																	)) && (
																	<li className="flex items-center gap-2">
																		<div className="w-1.5 h-1.5 rounded-full bg-amber-600"></div>
																		Correo electrónico válido
																	</li>
																)}
																{!formData.telefono?.trim() && (
																	<li className="flex items-center gap-2">
																		<div className="w-1.5 h-1.5 rounded-full bg-amber-600"></div>
																		Teléfono
																	</li>
																)}
																{!paymentConsent && (
																	<li className="flex items-center gap-2">
																		<div className="w-1.5 h-1.5 rounded-full bg-amber-600"></div>
																		Aceptar términos y condiciones
																	</li>
																)}
															</ul>
														</div>
													</div>
												</div>
											)}

										{/* Consentimiento para pago compacto */}
										<div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-4">
											<div className="flex items-start gap-3">
												<Checkbox
													id="payment-consent"
													checked={paymentConsent}
													onCheckedChange={(value) =>
														setPaymentConsent(Boolean(value))
													}
													className="mt-0.5"
												/>
												<label
													htmlFor="payment-consent"
													className="text-xs leading-snug text-gray-700 cursor-pointer flex-1"
												>
													Acepto recibir la confirmación por email y WhatsApp, y comprendo que podré especificar la hora exacta y detalles adicionales después de confirmar el pago.
												</label>
											</div>
										</div>

										{/* Navegación compacta */}
										<div className="space-y-3 pt-2">
											{/* Botón de volver */}
											<div className="flex justify-start">
												<Button
													type="button"
													variant="ghost"
													size="sm"
													onClick={handleStepBack}
													disabled={isSubmitting}
													className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
												>
													← Volver al paso anterior
												</Button>
											</div>

											{requiereCotizacionManual ? (
												<Button 
													asChild 
													className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 py-5 text-base rounded-xl"
												>
													<a href="#contacto">
														Solicitar cotización personalizada
													</a>
												</Button>
											) : (
												<div className="space-y-3">
													{/* Card compacta tipo dashboard para guardar reserva */}
													<div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3">
														<div className="mb-2">
															<h5 className="font-bold text-blue-900 mb-0.5 text-xs">
																Guardar y continuar después
															</h5>
															<p className="text-xs text-blue-700 leading-snug">
																Guarda tu reserva ahora y recibe un enlace por email para pagar cuando quieras
															</p>
														</div>
														<Button
															type="button"
															onClick={handleGuardarReserva}
															disabled={
																isSubmitting || !todosLosCamposCompletos
															}
															variant="outline"
															className="w-full border-2 border-blue-400 text-blue-700 hover:bg-blue-100 py-2.5 rounded-md font-semibold text-xs"
														>
															{isSubmitting ? (
																<>
																	<LoaderCircle className="mr-1.5 h-3.5 w-3.5 animate-spin" />
																	Guardando reserva...
																</>
															) : (
																"Guardar reserva para después"
															)}
														</Button>
													</div>

													{/* Card compacta de instrucción para pago inmediato */}
													{todosLosCamposCompletos && (
														<div className="bg-emerald-50 border-2 border-emerald-300 rounded-lg p-3">
															<div>
																<p className="font-bold text-emerald-900 mb-0.5 text-xs">
																	¿Listo para pagar ahora?
																</p>
																<p className="text-xs text-emerald-800 leading-snug">
																	Selecciona el monto y método de pago arriba. Tu reserva se guardará automáticamente y serás redirigido al proceso de pago seguro.
																</p>
															</div>
														</div>
													)}
												</div>
											)}
										</div>
									</div>
								)}

								{stepError && (
									<div className="bg-red-50 border-2 border-red-300 rounded-2xl p-6">
										<div className="flex items-start gap-3">
											<div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white text-xl flex-shrink-0 font-bold">
												!
											</div>
											<div className="flex-1">
												<p className="font-bold text-red-900 mb-1">Error</p>
												<p className="text-sm text-red-800">{stepError}</p>
											</div>
										</div>
									</div>
								)}
							</CardContent>
						</Card>

						{/* Columna lateral: Resumen persistente */}
						<div className="hidden lg:block space-y-6">
							{/* Resumen del viaje */}
							{currentStep >= 0 && (
								<Card className="bg-white shadow-xl border-0 sticky top-6">
									<CardHeader className="bg-gradient-to-br from-blue-50 to-slate-50 border-b border-gray-100 py-3 px-4">
										<h3 className="font-bold text-base text-gray-900">
											Resumen de tu reserva
										</h3>
									</CardHeader>
									<CardContent className="p-4 space-y-4">
										{/* Ruta */}
										<div className="space-y-1.5">
											<div className="flex items-center gap-1.5 text-xs text-gray-600">
												<div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
												<span className="font-medium">Ruta</span>
											</div>
											<div className="pl-3 border-l-2 border-blue-200">
												<p className="font-semibold text-sm text-gray-900">
													{origenFinal}
												</p>
												<div className="text-blue-600 my-1 text-sm" aria-hidden="true">↓</div>
												<p className="font-semibold text-sm text-gray-900">
													{destinoFinal}
												</p>
											</div>
											{formData.idaVuelta && (
												<div className="mt-3 pl-3 border-l-2 border-emerald-200">
													<div className="flex items-center gap-1.5 mb-1">
														<div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
														<span className="text-xs font-medium text-emerald-700">Regreso</span>
													</div>
													<p className="font-semibold text-sm text-gray-900">
														{destinoFinal}
													</p>
													<div className="text-emerald-600 my-1 text-sm" aria-hidden="true">↓</div>
													<p className="font-semibold text-sm text-gray-900">
														{origenFinal}
													</p>
												</div>
											)}
										</div>

										{/* Fecha(s) */}
										<div className="space-y-1.5 pt-3 border-t border-gray-100">
											<div className="flex items-center gap-1.5 text-xs text-gray-600">
												<Calendar className="w-3.5 h-3.5 text-blue-600" />
												<span className="font-medium">Fecha{formData.idaVuelta ? "s" : ""}</span>
											</div>
											<p className="text-gray-900 text-sm font-medium pl-5">
												{fechaLegible || "Por confirmar"}
											</p>
											{formData.idaVuelta && formData.fechaRegreso && (
												<p className="text-emerald-700 text-sm font-medium pl-5">
													Regreso: {new Date(
														`${formData.fechaRegreso}T00:00:00`
													).toLocaleDateString("es-CL", {
														dateStyle: "long",
														timeZone: "America/Santiago",
													})}
												</p>
											)}
										</div>

										{/* Pasajeros */}
										<div className="space-y-1.5 pt-3 border-t border-gray-100">
											<div className="flex items-center gap-1.5 text-xs text-gray-600">
												<Users className="w-3.5 h-3.5 text-blue-600" />
												<span className="font-medium">Pasajeros</span>
											</div>
											<p className="text-gray-900 font-semibold text-base pl-5">
												{formData.pasajeros} {formData.pasajeros === "1" ? "pasajero" : "pasajeros"}
											</p>
										</div>

										{/* Vehículo */}
										{cotizacion.vehiculo && (
											<div className="space-y-1.5 pt-3 border-t border-gray-100">
												<div className="flex items-center gap-1.5 text-xs text-gray-600">
													<div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
													<span className="font-medium">Vehículo</span>
												</div>
												<p className="text-gray-900 text-sm font-medium pl-5">
													{cotizacion.vehiculo}
												</p>
											</div>
										)}

										{/* Precio */}
										{mostrarPrecio && (
											<div className="space-y-2 pt-3 border-t-2 border-gray-200">
												<div className="space-y-0.5">
													<div className="flex justify-between items-center text-xs">
														<span className="text-gray-600">Precio base</span>
														<span className="line-through text-gray-400">
															{formatCurrency(pricing.precioBase)}
														</span>
													</div>
													{pricing.descuentoBase > 0 && (
														<div className="flex justify-between items-center text-xs">
															<span className="text-emerald-600">Descuento web ({baseDiscountPercentage}%)</span>
															<span className="text-emerald-600 font-medium">
																-{formatCurrency(pricing.descuentoBase)}
															</span>
														</div>
													)}
													{pricing.descuentoRoundTrip > 0 && (
														<div className="flex justify-between items-center text-xs">
															<span className="text-emerald-600">Ida y vuelta</span>
															<span className="text-emerald-600 font-medium">
																-{formatCurrency(pricing.descuentoRoundTrip)}
															</span>
														</div>
													)}
													{pricing.descuentoCodigo > 0 && (
														<div className="flex justify-between items-center text-xs">
															<span className="text-emerald-600">Código descuento</span>
															<span className="text-emerald-600 font-medium">
																-{formatCurrency(pricing.descuentoCodigo)}
															</span>
														</div>
													)}
												</div>
												<div className="flex justify-between items-center pt-2 border-t-2 border-blue-100">
													<span className="text-base font-bold text-gray-900">Total</span>
													<span className="text-xl font-bold text-blue-600">
														{formatCurrency(pricing.totalConDescuento)}
													</span>
												</div>
												{(pricing.descuentoBase + pricing.descuentoRoundTrip + pricing.descuentoCodigo) > 0 && (
													<div className="bg-emerald-50 rounded-lg p-2 text-center">
														<p className="text-xs font-bold text-emerald-700">
															¡Ahorras {formatCurrency(
																pricing.descuentoBase +
																pricing.descuentoRoundTrip +
																pricing.descuentoCodigo
															)}!
														</p>
													</div>
												)}
											</div>
										)}

										{!mostrarPrecio && (
											<div className="bg-blue-50 rounded-lg p-3 text-center border border-blue-200">
												<p className="text-xs font-semibold text-blue-900">
													Cotización personalizada
												</p>
												<p className="text-xs text-blue-700 mt-0.5">
													Te enviaremos el precio por correo
												</p>
											</div>
										)}
									</CardContent>
								</Card>
							)}
						</div>
						</div>
					</div>
				)}
			</div>
		</section>
	);
}

export default HeroExpress;
