import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
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
import { CheckCircle2, LoaderCircle } from "lucide-react";
import heroVan from "../assets/hero-van.png";
import flow from "../assets/formasPago/flow.png";
import merPago from "../assets/formasPago/mp.png";
import CodigoDescuento from "./CodigoDescuento";
import ContinuarReserva from "./ContinuarReserva";
import CompletarDetalles from "./CompletarDetalles";

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

function Hero({
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
	descuentoRate,
	baseDiscountRate,
	promotionDiscountRate,
	roundTripDiscountRate,
	personalizedDiscountRate,
	// descuentosPersonalizados, // No usado en este componente
	activePromotion,
	reviewChecklist,
	setReviewChecklist,
	canPay,
	handlePayment,
	loadingGateway,
	setFormData,
	onSubmitWizard,
	validarTelefono,
	validarHorarioReserva,
	showSummary,
	codigoAplicado,
	codigoError,
	validandoCodigo,
	onAplicarCodigo,
	onRemoverCodigo,
}) {
	const [currentStep, setCurrentStep] = useState(0);
	const [stepError, setStepError] = useState("");
	const [selectedCharge, setSelectedCharge] = useState(null);
	const [selectedMethod, setSelectedMethod] = useState(null);
	const [showBookingModule, setShowBookingModule] = useState(false);
	const [discountUpdated, setDiscountUpdated] = useState(false);
	const [showContinuarReserva, setShowContinuarReserva] = useState(false);
	const [showCompletarDetalles, setShowCompletarDetalles] = useState(false);
	const [reservaIdParaCompletar, setReservaIdParaCompletar] = useState(null);
	const [codigoReserva, setCodigoReserva] = useState("");
	const [buscandoReserva, setBuscandoReserva] = useState(false);
	const [errorCodigoReserva, setErrorCodigoReserva] = useState("");

	// Generar opciones de tiempo
	const timeOptions = useMemo(() => generateTimeOptions(), []);

	// Función para manejar el cambio de hora
	const handleTimeChange = (field, value) => {
		setFormData((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	// Manejadores para continuar con reserva
	const handleCompletarReserva = (reservaId) => {
		setReservaIdParaCompletar(reservaId);
		setShowContinuarReserva(false);
		setShowCompletarDetalles(true);
	};

	const handlePayReservation = (reserva) => {
		// Cerrar el diálogo de continuar reserva
		setShowContinuarReserva(false);
		
		// Pre-llenar el formulario con los datos de la reserva
		setFormData({
			nombre: reserva.nombre || "",
			telefono: reserva.telefono || "",
			email: reserva.email || "",
			origen: reserva.origen || "Aeropuerto La Araucanía",
			destino: reserva.destino || "",
			fecha: reserva.fecha || "",
			hora: reserva.hora || "",
			pasajeros: reserva.pasajeros?.toString() || "1",
			numeroVuelo: reserva.numeroVuelo || "",
			hotel: reserva.hotel || "",
			equipajeEspecial: reserva.equipajeEspecial || "",
			sillaInfantil: reserva.sillaInfantil ? "si" : "no",
			mensaje: reserva.observaciones || "",
			idaVuelta: Boolean(reserva.idaVuelta),
			fechaRegreso: reserva.fechaRegreso || "",
			horaRegreso: reserva.horaRegreso || "",
			otroOrigen: "",
			otroDestino: "",
		});

		// Abrir el módulo de reserva y avanzar al paso de pago
		setShowBookingModule(true);
		setCurrentStep(2); // Ir directamente al paso de confirmación/pago
	};

	const handleCancelarCompletarDetalles = () => {
		setShowCompletarDetalles(false);
		setReservaIdParaCompletar(null);
		setShowContinuarReserva(false);
	};

	// Función para continuar con código de reserva desde el módulo
	const handleContinuarConCodigo = async () => {
		if (!codigoReserva.trim()) {
			setErrorCodigoReserva("Por favor, ingresa un código de reserva");
			return;
		}

		setBuscandoReserva(true);
		setErrorCodigoReserva("");

		try {
			const apiUrl =
				import.meta.env.VITE_API_URL ||
				"https://transportes-araucaria.onrender.com";
			const response = await fetch(`${apiUrl}/api/reservas/${codigoReserva.trim()}`);

			if (!response.ok) {
				if (response.status === 404) {
					throw new Error("No se encontró una reserva con ese código");
				}
				throw new Error("Error al buscar la reserva");
			}

			const data = await response.json();
			const reserva = data.reserva;

			// Pre-llenar el formulario con los datos de la reserva
			setFormData({
				nombre: reserva.nombre || "",
				telefono: reserva.telefono || "",
				email: reserva.email || "",
				origen: reserva.origen || "Aeropuerto La Araucanía",
				destino: reserva.destino || "",
				fecha: reserva.fecha || "",
				hora: reserva.hora || "",
				pasajeros: reserva.pasajeros?.toString() || "1",
				numeroVuelo: reserva.numeroVuelo || "",
				hotel: reserva.hotel || "",
				equipajeEspecial: reserva.equipajeEspecial || "",
				sillaInfantil: reserva.sillaInfantil ? "si" : "no",
				mensaje: reserva.observaciones || "",
				idaVuelta: Boolean(reserva.idaVuelta),
				fechaRegreso: reserva.fechaRegreso || "",
				horaRegreso: reserva.horaRegreso || "",
				otroOrigen: "",
				otroDestino: "",
			});

			// Avanzar directamente al paso 2 (pagar)
			setCurrentStep(2);
			setCodigoReserva("");
			setErrorCodigoReserva("");
		} catch (err) {
			console.error("Error buscando reserva:", err);
			setErrorCodigoReserva(err.message || "No se pudo cargar la información de la reserva");
		} finally {
			setBuscandoReserva(false);
		}
	};

	// Mostrar indicador cuando se actualizan los descuentos
	useEffect(() => {
		setDiscountUpdated(true);
		const timer = setTimeout(() => setDiscountUpdated(false), 2000);
		return () => clearTimeout(timer);
	}, [baseDiscountRate, roundTripDiscountRate]);

	const steps = useMemo(
		() => [
			{
				title: "1. Tu viaje",
				description: "Selecciona origen, destino, fecha y pasajeros.",
			},
			{
				title: "2. Tus datos",
				description: "Completa la información de contacto y extras.",
			},
			{
				title: "3. Revisar y pagar",
				description: "Confirma el resumen y paga online con descuento.",
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

	const horaLegible = formData.hora ? `${formData.hora} hrs` : "Por confirmar";
	const pasajerosLabel = `${formData.pasajeros || "1"} pasajero(s)`;
	const vehiculoSugerido = cotizacion.vehiculo || "A confirmar";

	const tieneCotizacionAutomatica = typeof cotizacion.precio === "number";
	const requiereCotizacionManual =
		formData.destino === "Otro" ||
		(formData.destino && !tieneCotizacionAutomatica);
	const mostrarPrecio = tieneCotizacionAutomatica;

	const promotionDetails = useMemo(() => {
		if (!activePromotion) return null;
		const parts = [];
		const promoDays = Array.isArray(activePromotion.dias)
			? activePromotion.dias
			: [];
		if (activePromotion.aplicaPorDias && promoDays.length > 0) {
			parts.push(`Días: ${promoDays.join(", ")}`);
		}
		if (
			activePromotion.aplicaPorHorario &&
			activePromotion.horaInicio &&
			activePromotion.horaFin
		) {
			parts.push(
				`Horario: ${activePromotion.horaInicio} - ${activePromotion.horaFin} hrs`
			);
		}
		return parts.join(" · ");
	}, [activePromotion]);

	useEffect(() => {
		if (showSummary) {
			setCurrentStep(2);
		}
	}, [showSummary]);

	useEffect(() => {
		if (
			!showSummary &&
			!formData.destino &&
			!formData.fecha &&
			!formData.nombre &&
			!formData.telefono
		) {
			setCurrentStep(0);
		}
	}, [
		showSummary,
		formData.destino,
		formData.fecha,
		formData.nombre,
		formData.telefono,
	]);

	useEffect(() => {
		setStepError("");
	}, [currentStep]);

	// Efecto para mantener el scroll en la parte superior del módulo cuando cambie el paso
	useEffect(() => {
		if (showBookingModule) {
			// Pequeño delay para asegurar que el DOM se haya actualizado
			setTimeout(() => {
				const moduleElement = document.querySelector("[data-booking-module]");
				if (moduleElement) {
					moduleElement.scrollIntoView({
						behavior: "smooth",
						block: "start",
					});
				}
			}, 100);
		}
	}, [currentStep, showBookingModule]);

	const handleStepOneNext = () => {
		if (!formData.origen.trim()) {
			setStepError("Indica el origen de tu viaje.");
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

		const validacion = validarHorarioReserva();
		if (!validacion.esValido) {
			setStepError(validacion.mensaje);
			return;
		}

		if (formData.idaVuelta) {
			if (!formData.fechaRegreso) {
				setStepError("Selecciona la fecha de regreso.");
				return;
			}
			if (!formData.horaRegreso) {
				setStepError("Selecciona la hora del regreso.");
				return;
			}
			const salida = new Date(`${formData.fecha}T${formData.hora}`);
			const regreso = new Date(
				`${formData.fechaRegreso}T${formData.horaRegreso}`
			);
			if (Number.isNaN(regreso.getTime())) {
				setStepError("La fecha de regreso no es válida.");
				return;
			}
			if (regreso <= salida) {
				setStepError(
					"El regreso debe ser posterior al viaje de ida. Revisa la fecha y hora seleccionadas."
				);
				return;
			}
		}

		setStepError("");
		setCurrentStep(1);
	};

	const handleStepTwoNext = async () => {
		if (!formData.nombre.trim()) {
			setStepError("Ingresa el nombre del pasajero principal.");
			return;
		}

		if (!formData.email.trim()) {
			setStepError(
				"Necesitamos un correo electrónico para enviar la confirmación."
			);
			return;
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(formData.email)) {
			setStepError("El correo electrónico ingresado no es válido.");
			return;
		}

		if (!formData.telefono.trim()) {
			setStepError("Indica un teléfono móvil de contacto.");
			return;
		}

		if (!validarTelefono(formData.telefono)) {
			setPhoneError(
				"Por favor, introduce un número de móvil chileno válido (ej: +56 9 1234 5678)."
			);
			setStepError("Revisa el número de teléfono antes de continuar.");
			return;
		}

		setPhoneError("");
		setStepError("");

		if (requiereCotizacionManual) {
			setCurrentStep(2);
			return;
		}

		const result = await onSubmitWizard();

		if (!result.success) {
			if (result.error === "horario" && result.message) {
				setStepError(result.message);
				setCurrentStep(0);
			} else if (result.error === "server" && result.message) {
				setStepError(`No pudimos enviar tu reserva: ${result.message}`);
			} else if (result.error === "telefono") {
				setStepError("Revisa el número de teléfono ingresado.");
			}
			return;
		}

		setStepError("");
		setCurrentStep(2);
	};

	const handleStepBack = () => {
		setCurrentStep((prev) => Math.max(prev - 1, 0));
	};

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
	const totalDiscountPercentage = Math.round(descuentoRate * 100);

	// Debug: mostrar información de descuentos personalizados (comentado para reducir ruido)
	// useEffect(() => {
	// 	console.log("🔍 DEBUG DESCUENTOS PERSONALIZADOS:", {
	// 		personalizedDiscountRate,
	// 		personalizedDiscountPercentage,
	// 		descuentosPersonalizados,
	// 		pricingDescuentosPersonalizados: pricing?.descuentosPersonalizados,
	// 		descuentosPersonalizadosArray: descuentosPersonalizados,
	// 	});
	// }, [
	// 	personalizedDiscountRate,
	// 	personalizedDiscountPercentage,
	// 	descuentosPersonalizados,
	// 	pricing?.descuentosPersonalizados,
	// ]);

	const chargeOptions = useMemo(
		() => [
			{
				id: "abono",
				type: "abono",
				title: "Pagar 40% ahora",
				subtitle: "Reserva tu cupo abonando el 40%",
				amount: pricing.abono,
				disabled: pricing.abono <= 0,
			},
			{
				id: "total",
				type: "total",
				title: "Pagar el 100%",
				subtitle: "Cancela ahora y aprovecha todo el descuento",
				amount: pricing.totalConDescuento,
				disabled: pricing.totalConDescuento <= 0,
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
				subtitle: "Webpay, tarjetas y transferencia",
				image: flow,
			},
			{
				id: "mercadopago",
				gateway: "mercadopago",
				title: "Mercado Pago",
				subtitle: "Tarjetas y billetera Mercado Pago",
				image: merPago,
			},
		],
		[]
	);

	const selectedChargeData = useMemo(
		() => chargeOptions.find((option) => option.id === selectedCharge) || null,
		[chargeOptions, selectedCharge]
	);

	const selectedMethodData = useMemo(
		() => paymentMethods.find((method) => method.id === selectedMethod) || null,
		[paymentMethods, selectedMethod]
	);

	useEffect(() => {
		const defaultCharge = chargeOptions.find((option) => !option.disabled);
		setSelectedCharge((prev) =>
			prev && chargeOptions.some((opt) => opt.id === prev && !opt.disabled)
				? prev
				: defaultCharge?.id || null
		);
	}, [chargeOptions]);

	useEffect(() => {
		const defaultMethod = paymentMethods[0];
		setSelectedMethod((prev) =>
			prev && paymentMethods.some((opt) => opt.id === prev)
				? prev
				: defaultMethod?.id || null
		);
	}, [paymentMethods]);

	const selectedCombinationLoading =
		selectedChargeData && selectedMethodData
			? loadingGateway ===
			  `${selectedMethodData.gateway}-${selectedChargeData.type}`
			: false;
	const isAnotherGatewayLoading = Boolean(
		loadingGateway && !selectedCombinationLoading
	);
	const canTriggerPayment = Boolean(
		selectedChargeData &&
			!selectedChargeData.disabled &&
			selectedMethodData &&
			!requiereCotizacionManual &&
			canPay &&
			!isSubmitting &&
			!isAnotherGatewayLoading &&
			!selectedCombinationLoading
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
			{/* Overlay que cubre toda la imagen de fondo */}
			<div className="absolute inset-0 bg-black/50"></div>
			<div className="relative container mx-auto px-4 text-center pt-4 md:pt-6 pb-16 md:pb-24">
				{!showBookingModule && !showContinuarReserva && !showCompletarDetalles && (
					<>
						<h1 className="text-5xl md:text-6xl font-bold mb-6 drop-shadow-2xl">
							Traslados Privados Aeropuerto La Araucanía
							<br />
							<span className="text-accent drop-shadow-lg">
								Corralco, Pucón, Melipeuco y los principales destinos de La
								Araucanía
							</span>
						</h1>
						<p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto drop-shadow-lg">
							Transportes Araucaria conecta el Aeropuerto La Araucanía con
							Malalcahuello, Pucón, Villarrica, Lican Ray, Conguillío, Huilo
							Huilo y otros centros turísticos imperdibles de la región. Reserva
							en línea, confirma tu conductor y asegura desde un{" "}
							{baseDiscountPercentage}% de descuento web garantizado
							{promoDiscountPercentage > 0
								? ` + ${
										activePromotion?.descripcion ||
										`${promoDiscountPercentage}% extra por promociones activas`
								  }`
								: ""}
							{roundTripDiscountPercentage > 0
								? ` + ${roundTripDiscountPercentage}% adicional por reservar ida y vuelta`
								: ""}
							{personalizedDiscountPercentage > 0
								? ` + ${personalizedDiscountPercentage}% por descuentos especiales`
								: ""}
							.
						</p>
					</>
				)}

				{!showBookingModule && !showContinuarReserva && (
					<div className="flex flex-col items-center justify-center space-y-6">
						<Button
							onClick={() => setShowBookingModule(true)}
							className="bg-accent hover:bg-accent/90 text-accent-foreground px-12 py-6 text-2xl font-bold rounded-xl shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-110 drop-shadow-lg animate-bounce hover:animate-none focus-visible:ring-accent/30"
						>
							🚐 Reservar mi traslado
						</Button>
						<p className="text-lg text-white/95 drop-shadow-md font-medium">
							Proceso rápido y seguro • Sin costos ocultos
						</p>
						<div className="flex items-center gap-3 text-white/90">
							<div className="h-px flex-1 bg-white/30"></div>
							<span className="text-sm">o</span>
							<div className="h-px flex-1 bg-white/30"></div>
						</div>
						<Button
							onClick={() => setShowContinuarReserva(true)}
							variant="outline"
							className="bg-white/10 hover:bg-white/20 text-white border-white/30 px-8 py-4 text-lg font-semibold backdrop-blur-sm"
						>
							📋 Continuar con una reserva existente
						</Button>
					</div>
				)}

				{/* Mostrar módulo de continuar reserva */}
				{showContinuarReserva && !showCompletarDetalles && (
					<div className="w-full max-w-4xl mx-auto">
						<div className="mb-4">
							<Button
								variant="ghost"
								onClick={() => setShowContinuarReserva(false)}
								className="text-white hover:text-white/80 hover:bg-white/10"
							>
								← Volver
							</Button>
						</div>
						<ContinuarReserva
							onComplete={handleCompletarReserva}
							onCancel={() => setShowContinuarReserva(false)}
							onPayReservation={handlePayReservation}
						/>
					</div>
				)}

				{/* Mostrar módulo de completar detalles */}
				{showCompletarDetalles && reservaIdParaCompletar && (
					<div className="w-full">
						<CompletarDetalles
							reservaId={reservaIdParaCompletar}
							onComplete={handleCancelarCompletarDetalles}
							onCancel={handleCancelarCompletarDetalles}
						/>
					</div>
				)}

				{showBookingModule && (
					<div className="w-full">
						{/* Texto motivacional cuando se abre el módulo */}
						<div className="text-center mb-6">
							<h3 className="text-2xl md:text-3xl font-bold text-white drop-shadow-2xl mb-3">
								¡Reserva ahora y ahorra!
							</h3>
							<p className="text-lg md:text-xl text-white/95 drop-shadow-lg font-medium">
								Descuento exclusivo del{" "}
								<span className="text-accent font-bold text-2xl">
									{baseDiscountPercentage}%
								</span>{" "}
								solo disponible en nuestra web
								{promoDiscountPercentage > 0 && (
									<span className="block mt-2 text-accent font-bold">
										+{" "}
										{activePromotion?.descripcion ||
											`${promoDiscountPercentage}% extra por promociones activas`}
									</span>
								)}
								{roundTripDiscountPercentage > 0 && (
									<span className="block text-accent font-bold">
										+ {roundTripDiscountPercentage}% adicional por ida y vuelta
									</span>
								)}
								{personalizedDiscountPercentage > 0 && (
									<span className="block text-accent font-bold">
										+ {personalizedDiscountPercentage}% por descuentos
										especiales
									</span>
								)}
							</p>
						</div>

						<Card
							className="max-w-5xl mx-auto bg-white/95 backdrop-blur-sm shadow-xl border text-left"
							data-booking-module
						>
							<CardHeader className="space-y-3">
								<div className="flex flex-wrap items-center justify-between gap-2">
									<Button
										variant="ghost"
										size="sm"
										onClick={() => setShowBookingModule(false)}
										className="text-gray-500 hover:text-gray-700"
									>
										✕
									</Button>
									<div className="flex items-center gap-2">
										<Badge variant="secondary" className="text-sm">
											Descuento en linea {baseDiscountPercentage}%
										</Badge>
										{promoDiscountPercentage > 0 && (
											<Badge
												variant="default"
												className="text-sm bg-emerald-500 text-slate-950"
											>
												{activePromotion?.descripcion ||
													`Promo extra +${promoDiscountPercentage}%`}
											</Badge>
										)}
										{roundTripDiscountPercentage > 0 && (
											<Badge
												variant="default"
												className="text-sm bg-sky-500 text-slate-950"
											>
												Ida & vuelta +{roundTripDiscountPercentage}%
											</Badge>
										)}
										{personalizedDiscountPercentage > 0 && (
											<Badge
												variant="default"
												className="text-sm bg-purple-500 text-slate-950"
											>
												Especial +{personalizedDiscountPercentage}%
											</Badge>
										)}
									</div>
								</div>
								<div className="space-y-4">
									<div className="grid gap-4 md:grid-cols-3">
										{steps.map((step, index) => {
											const isCompleted = index < currentStep;
											const isActive = index === currentStep;

											return (
												<div
													key={step.title}
													className={`flex items-start gap-3 rounded-lg border p-3 transition ${
														isActive
															? "border-primary bg-primary/10"
															: isCompleted
															? "border-green-500/50 bg-green-500/10"
															: "border-muted bg-muted/40"
													}`}
												>
													<div
														className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
															isCompleted
																? "border-green-500 bg-green-500/20 text-green-600"
																: isActive
																? "border-primary bg-primary/20 text-primary"
																: "border-muted-foreground/40 text-muted-foreground"
														}`}
													>
														{isCompleted ? (
															<CheckCircle2 className="h-6 w-6" />
														) : (
															index + 1
														)}
													</div>
													<div>
														<p className="font-semibold text-foreground">
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
									<Progress value={progressValue} className="h-2" />
								</div>
							</CardHeader>
							<CardContent className="space-y-8">
								{currentStep === 0 && (
									<div className="space-y-6">
										{/* Sección para continuar con código de reserva */}
										<div className="rounded-lg border-2 border-dashed border-primary/40 bg-primary/5 p-4">
											<div className="flex items-center gap-2 mb-3">
												<Badge variant="outline" className="border-primary text-primary">
													Opción rápida
												</Badge>
												<p className="text-sm font-medium text-foreground">
													¿Ya tienes una reserva? Continúa al pago
												</p>
											</div>
											<div className="flex gap-3">
												<div className="flex-1">
													<Input
														placeholder="Ingresa tu código de reserva (Ej: 12345)"
														value={codigoReserva}
														onChange={(e) => {
															setCodigoReserva(e.target.value);
															setErrorCodigoReserva("");
														}}
														disabled={buscandoReserva}
														onKeyDown={(e) => {
															if (e.key === "Enter" && codigoReserva.trim()) {
																e.preventDefault();
																handleContinuarConCodigo();
															}
														}}
													/>
												</div>
												<Button
													type="button"
													onClick={handleContinuarConCodigo}
													disabled={buscandoReserva || !codigoReserva.trim()}
													className="whitespace-nowrap"
												>
													{buscandoReserva ? (
														<>
															<LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
															Buscando...
														</>
													) : (
														"Ir a pagar"
													)}
												</Button>
											</div>
											{errorCodigoReserva && (
												<p className="text-sm text-destructive mt-2">
													{errorCodigoReserva}
												</p>
											)}
											<p className="text-xs text-muted-foreground mt-2">
												Si ya iniciaste una reserva, ingresa el código para continuar directamente al pago
											</p>
										</div>

										<div className="relative">
											<div className="absolute inset-0 flex items-center">
												<span className="w-full border-t" />
											</div>
											<div className="relative flex justify-center text-xs uppercase">
												<span className="bg-background px-2 text-muted-foreground">
													o completa una nueva reserva
												</span>
											</div>
										</div>

										<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
											<div className="space-y-2">
												<Label htmlFor="origen-hero">Origen</Label>
												<select
													id="origen-hero"
													name="origen"
													value={formData.origen}
													onChange={handleInputChange}
													className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-foreground"
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
												<Label htmlFor="destino-hero">Destino</Label>
												<select
													id="destino-hero"
													name="destino"
													value={formData.destino}
													onChange={handleInputChange}
													className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-foreground"
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
												<Label htmlFor="fecha-hero">Fecha</Label>
												<Input
													id="fecha-hero"
													type="date"
													name="fecha"
													value={formData.fecha}
													onChange={handleInputChange}
													min={minDateTime}
													required
												/>
											</div>
											<div className="space-y-2">
												<Label htmlFor="hora-hero">Hora</Label>
												<Select
													value={formData.hora}
													onValueChange={(value) =>
														handleTimeChange("hora", value)
													}
												>
													<SelectTrigger>
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
												<Label htmlFor="pasajeros-hero">Pasajeros</Label>
												<select
													id="pasajeros-hero"
													name="pasajeros"
													value={formData.pasajeros}
													onChange={handleInputChange}
													className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-foreground"
													required
												>
													{[...Array(maxPasajeros)].map((_, i) => (
														<option key={i + 1} value={i + 1}>
															{i + 1} pasajero(s)
														</option>
													))}
												</select>
											</div>
										</div>

										<div className="rounded-lg border border-muted/40 bg-muted/10 p-4 space-y-4">
											<div className="flex items-start gap-3">
												<Checkbox
													id="ida-vuelta"
													checked={formData.idaVuelta}
													onCheckedChange={(value) => {
														const isRoundTrip = Boolean(value);
														setFormData((prev) => {
															if (isRoundTrip) {
																return {
																	...prev,
																	idaVuelta: true,
																	fechaRegreso: prev.fechaRegreso || prev.fecha,
																	horaRegreso: prev.horaRegreso,
																};
															}
															return {
																...prev,
																idaVuelta: false,
																fechaRegreso: "",
																horaRegreso: "",
															};
														});
													}}
												/>
												<label
													htmlFor="ida-vuelta"
													className="text-sm text-muted-foreground"
												>
													¿Deseas reservar también el regreso? Coordina ida y
													vuelta en una sola solicitud.
												</label>
											</div>
											{formData.idaVuelta && (
												<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
													<div className="space-y-2">
														<Label htmlFor="fecha-regreso">Fecha regreso</Label>
														<Input
															id="fecha-regreso"
															type="date"
															name="fechaRegreso"
															min={formData.fecha || minDateTime}
															value={formData.fechaRegreso}
															onChange={handleInputChange}
															required={formData.idaVuelta}
														/>
													</div>
													<div className="space-y-2">
														<Label htmlFor="hora-regreso">Hora regreso</Label>
														<Select
															value={formData.horaRegreso}
															onValueChange={(value) =>
																handleTimeChange("horaRegreso", value)
															}
														>
															<SelectTrigger>
																<SelectValue placeholder="Selecciona la hora de regreso" />
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
												</div>
											)}
											<p className="text-xs text-muted-foreground">
												Validaremos la disponibilidad del retorno junto con tu
												reserva inicial. Al reservar ida y vuelta obtienes un 5%
												adicional de descuento.
											</p>
										</div>
										<div className="text-center text-sm text-muted-foreground">
											¿No encuentras tu destino?{" "}
											<a
												href="#contacto"
												className="text-primary hover:underline"
											>
												Contáctanos
											</a>{" "}
											para una cotización personalizada.
										</div>
										{mostrarPrecio ? (
											<div className="rounded-xl border border-primary/20 bg-primary/10 p-6 text-foreground">
												<div className="grid gap-4 md:grid-cols-2 md:items-center">
													<div className="space-y-1">
														<p className="text-sm uppercase tracking-wide text-muted-foreground">
															Vehículo sugerido
														</p>
														<p className="text-2xl font-semibold">
															{cotizacion.vehiculo}
														</p>
														<p className="text-sm text-muted-foreground">
															Tarifa estimada para {formData.pasajeros}{" "}
															pasajero(s).
														</p>
													</div>
													<div className="text-left md:text-right space-y-1">
														<div className="flex flex-wrap gap-2 md:justify-end">
															<Badge className="mb-1" variant="default">
																Base {baseDiscountPercentage}%
															</Badge>
															{promoDiscountPercentage > 0 && (
																<Badge
																	className="mb-1 bg-emerald-500 text-slate-950"
																	variant="default"
																>
																	{activePromotion?.descripcion ||
																		`Extra +${promoDiscountPercentage}%`}
																</Badge>
															)}
														</div>
														<p className="text-xs text-muted-foreground uppercase tracking-wide">
															Precio estándar
														</p>
														<p className="text-xl font-semibold">
															{formatCurrency(pricing.precioBase)}
														</p>
														<p className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-2">
															Total con descuento
															{discountUpdated && (
																<span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 animate-pulse">
																	✅ Actualizado
																</span>
															)}
														</p>
														<p className="text-2xl font-bold text-accent">
															{formatCurrency(pricing.totalConDescuento)}
														</p>
														<div className="space-y-1 text-sm">
															<p className="font-medium text-slate-600">
																Descuento base ({baseDiscountPercentage}%):{" "}
																{formatCurrency(pricing.descuentoBase)}
															</p>
															{promoDiscountPercentage > 0 && (
																<p className="font-medium text-slate-600">
																	{activePromotion?.descripcion ||
																		`Promo adicional (+${promoDiscountPercentage}%)`}
																	: {formatCurrency(pricing.descuentoPromocion)}
																</p>
															)}
															{roundTripDiscountPercentage > 0 && (
																<p className="font-medium text-slate-600">
																	Ida y vuelta (+{roundTripDiscountPercentage}
																	%):{" "}
																	{formatCurrency(pricing.descuentoRoundTrip)}
																</p>
															)}
															{personalizedDiscountPercentage > 0 && (
																<p className="font-medium text-slate-600">
																	Descuentos especiales (+
																	{personalizedDiscountPercentage}
																	%):{" "}
																	{formatCurrency(
																		pricing.descuentosPersonalizados
																	)}
																</p>
															)}
															<p className="text-slate-700 font-semibold">
																Ahorro total:{" "}
																{formatCurrency(pricing.descuentoOnline)}
																<span className="ml-1 text-xs text-slate-500">
																	({totalDiscountPercentage}% aplicado)
																</span>
															</p>
															{activePromotion && (
																<p className="text-xs font-semibold text-slate-600">
																	Promo activa:{" "}
																	{activePromotion.descripcion ||
																		`Descuento ${activePromotion.descuentoPorcentaje}%`}
																	{promotionDetails
																		? ` Â· ${promotionDetails}`
																		: ""}
																</p>
															)}
														</div>
													</div>
												</div>
											</div>
										) : (
											<div className="rounded-xl border border-dashed border-primary/40 bg-white/40 p-6 text-primary">
												<p className="font-semibold">
													Calcularemos el valor exacto y te lo enviaremos junto
													con la confirmación.
												</p>
												<p className="text-sm text-primary/80">
													Indícanos tu destino para sugerirte el vehículo más
													conveniente.
												</p>
											</div>
										)}

										<div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
											<p className="text-sm text-muted-foreground">
												Revisaremos disponibilidad en tiempo real antes de pasar
												al pago.
											</p>
											<Button
												type="button"
												className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground focus-visible:ring-accent/30"
												onClick={handleStepOneNext}
												disabled={isSubmitting}
											>
												Continuar con mis datos
											</Button>
										</div>
									</div>
								)}

								{currentStep === 1 && (
									<div className="space-y-6">
										<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
											<div className="space-y-2">
												<Label htmlFor="nombre-hero">Nombre completo</Label>
												<Input
													id="nombre-hero"
													name="nombre"
													value={formData.nombre}
													onChange={handleInputChange}
													placeholder="Ej: Juan Pérez"
												/>
											</div>
											<div className="space-y-2">
												<Label htmlFor="email-hero">Email</Label>
												<Input
													id="email-hero"
													type="email"
													name="email"
													value={formData.email}
													onChange={handleInputChange}
													placeholder="tu@email.cl"
												/>
											</div>
										</div>

										<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
											<div className="space-y-2">
												<Label htmlFor="telefono-hero">Teléfono móvil</Label>
												<Input
													id="telefono-hero"
													name="telefono"
													value={formData.telefono}
													onChange={handleInputChange}
													placeholder="+56 9 1234 5678"
												/>
												{phoneError && (
													<p className="text-sm text-red-500">{phoneError}</p>
												)}
											</div>
											<div className="space-y-2">
												<Label htmlFor="numeroVuelo-hero">
													Número de vuelo (si aplica)
												</Label>
												<Input
													id="numeroVuelo-hero"
													name="numeroVuelo"
													value={formData.numeroVuelo}
													onChange={handleInputChange}
													placeholder="Ej: LA123"
												/>
											</div>
										</div>

										<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
											<div className="space-y-2">
												<Label htmlFor="hotel-hero">
													Hotel o dirección final
												</Label>
												<Input
													id="hotel-hero"
													name="hotel"
													value={formData.hotel}
													onChange={handleInputChange}
													placeholder="Ej: Hotel Antumalal"
												/>
											</div>
											<div className="space-y-2">
												<Label htmlFor="sillaInfantil-hero">
													¿Necesitas alzador infantil?
												</Label>
												<select
													id="sillaInfantil-hero"
													name="sillaInfantil"
													value={formData.sillaInfantil}
													onChange={handleInputChange}
													className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-foreground"
												>
													<option value="no">No requiero</option>
													<option value="1 silla">Sí, 1 alzador</option>
													<option value="2 sillas">Sí, 2 alzadores</option>
												</select>
											</div>
										</div>

										<div className="space-y-2">
											<Label htmlFor="equipajeEspecial-hero">
												Equipaje extra o comentarios para el conductor
											</Label>
											<Textarea
												id="equipajeEspecial-hero"
												name="equipajeEspecial"
												value={formData.equipajeEspecial}
												onChange={handleInputChange}
												placeholder="Cuéntanos sobre equipaje voluminoso, mascotas u otros detalles relevantes."
											/>
										</div>

										{/* Código de descuento - Más visible y cerca del resumen */}
										<div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-6 shadow-lg">
											<div className="flex items-center gap-3 mb-4">
												<div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
													<span className="text-white font-bold text-sm">
														🎟️
													</span>
												</div>
												<div>
													<h3 className="text-lg font-bold text-purple-900">
														¿Tienes un código de descuento?
													</h3>
													<p className="text-sm text-purple-700">
														Ingresa tu código para obtener descuentos
														adicionales
													</p>
												</div>
											</div>
											<CodigoDescuento
												codigoAplicado={codigoAplicado}
												codigoError={codigoError}
												validandoCodigo={validandoCodigo}
												onAplicarCodigo={onAplicarCodigo}
												onRemoverCodigo={onRemoverCodigo}
											/>
										</div>

										{mostrarPrecio && (
											<div className="rounded-xl border border-secondary/30 bg-secondary/10 p-6 text-foreground">
												<h4 className="text-lg font-semibold mb-2">
													Resumen económico
												</h4>
												<div className="grid gap-2 text-sm">
													<div className="flex items-center justify-between">
														<span>Ahorro base ({baseDiscountPercentage}%)</span>
														<span className="font-semibold">
															{formatCurrency(pricing.descuentoBase)}
														</span>
													</div>
													{promoDiscountPercentage > 0 && (
														<div className="flex items-center justify-between">
															<span>
																{activePromotion?.descripcion ||
																	`Promo adicional (+${promoDiscountPercentage}%)`}
															</span>
															<span className="font-semibold">
																{formatCurrency(pricing.descuentoPromocion)}
															</span>
														</div>
													)}
													{codigoAplicado && (
														<div className="flex items-center justify-between bg-purple-50 p-2 rounded-lg border border-purple-200">
															<span className="text-purple-800 font-medium">
																🎟️ Código {codigoAplicado.codigo}
															</span>
															<span className="font-semibold text-purple-900">
																-{formatCurrency(pricing.descuentoCodigo || 0)}
															</span>
														</div>
													)}
													<div className="flex items-center justify-between text-slate-700">
														<span>Ahorro total aplicado</span>
														<span className="font-semibold">
															-{formatCurrency(pricing.descuentoOnline)}
															<span className="ml-1 text-xs text-slate-500">
																({totalDiscountPercentage}% total)
															</span>
														</span>
													</div>
													<div className="flex items-center justify-between">
														<span>Abono online (40%)</span>
														<span className="font-semibold">
															{formatCurrency(pricing.abono)}
														</span>
													</div>
													<div className="flex items-center justify-between">
														<span>Saldo con descuento</span>
														<span className="font-semibold">
															{formatCurrency(pricing.saldoPendiente)}
														</span>
													</div>
												</div>
												<p className="mt-3 text-xs text-muted-foreground">
													Podrás elegir entre abonar el 40% o pagar el total con
													descuento en el siguiente paso.
												</p>
											</div>
										)}

										<div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
											<Button
												type="button"
												variant="outline"
												className="w-full sm:w-auto"
												onClick={handleStepBack}
												disabled={isSubmitting}
											>
												Volver al paso anterior
											</Button>
											<Button
												type="button"
												className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground focus-visible:ring-accent/30"
												onClick={handleStepTwoNext}
												disabled={isSubmitting}
											>
												{isSubmitting ? (
													<>
														<LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
														Generando resumen...
													</>
												) : (
													"Revisar resumen y pagar"
												)}
											</Button>
										</div>
									</div>
								)}

								{currentStep === 2 && (
									<div className="max-h-[80vh] overflow-y-auto space-y-8 p-4 -m-4">
										{/* Resumen del viaje */}
										<div className="bg-white rounded-lg border border-gray-200 p-6">
											<h4 className="text-xl font-semibold text-gray-900 mb-6 border-b pb-2">
												Resumen de tu traslado
											</h4>
											<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
												<div className="space-y-2">
													<p className="text-sm font-medium text-gray-500">
														Origen
													</p>
													<p className="text-lg font-semibold text-gray-900">
														{origenFinal}
													</p>
												</div>
												<div className="space-y-2">
													<p className="text-sm font-medium text-gray-500">
														Destino
													</p>
													<p className="text-lg font-semibold text-gray-900">
														{destinoFinal}
													</p>
												</div>
												<div className="space-y-2">
													<p className="text-sm font-medium text-gray-500">
														Fecha
													</p>
													<p className="text-lg font-semibold text-gray-900">
														{fechaLegible}
													</p>
												</div>
												<div className="space-y-2">
													<p className="text-sm font-medium text-gray-500">
														Hora
													</p>
													<p className="text-lg font-semibold text-gray-900">
														{horaLegible}
													</p>
												</div>
												<div className="space-y-2">
													<p className="text-sm font-medium text-gray-500">
														Pasajeros
													</p>
													<p className="text-lg font-semibold text-gray-900">
														{pasajerosLabel}
													</p>
												</div>
												<div className="space-y-2">
													<p className="text-sm font-medium text-gray-500">
														Vehículo
													</p>
													<p className="text-lg font-semibold text-gray-900">
														{vehiculoSugerido}
													</p>
												</div>
											</div>

											{formData.idaVuelta && (
												<div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
													<div className="flex items-center gap-2 mb-2">
														<svg
															className="w-5 h-5 text-blue-600"
															fill="none"
															stroke="currentColor"
															viewBox="0 0 24 24"
														>
															<path
																strokeLinecap="round"
																strokeLinejoin="round"
																strokeWidth={2}
																d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
															/>
														</svg>
														<p className="font-semibold text-blue-900">
															Regreso incluido
														</p>
													</div>
													<p className="text-sm text-blue-700">
														{formData.fechaRegreso || "Por definir"} ·{" "}
														{formData.horaRegreso || "Por definir"} hrs
													</p>
												</div>
											)}
										</div>
										{requiereCotizacionManual ? (
											<div className="rounded-xl border border-dashed border-primary/40 bg-white/90 p-6 text-sm text-foreground">
												<h4 className="text-lg font-semibold text-primary mb-3">
													Cotización personalizada necesaria
												</h4>
												<p className="text-sm text-muted-foreground leading-relaxed">
													Este destino no está disponible para pago inmediato.
													Completa el formulario de contacto para recibir una
													tarifa en menos de 30 minutos.
												</p>
												<Button
													asChild
													className="mt-4 w-full sm:w-auto"
													variant="secondary"
												>
													<a href="#contacto">Ir al formulario de contacto</a>
												</Button>
											</div>
										) : (
											<div className="rounded-xl border border-secondary/30 bg-secondary/10 p-6 text-sm">
												<h4 className="text-lg font-semibold mb-3">
													Resumen de pago
												</h4>
												<div className="space-y-2">
													<div className="flex items-center justify-between">
														<span>
															Descuento base ({baseDiscountPercentage}%)
														</span>
														<span className="font-semibold">
															-{formatCurrency(pricing.descuentoBase)}
														</span>
													</div>
													{promoDiscountPercentage > 0 && (
														<div className="flex items-center justify-between">
															<span>
																{activePromotion?.descripcion ||
																	`Promo adicional (+${promoDiscountPercentage}%)`}
															</span>
															<span className="font-semibold">
																-{formatCurrency(pricing.descuentoPromocion)}
															</span>
														</div>
													)}
													{roundTripDiscountPercentage > 0 && (
														<div className="flex items-center justify-between">
															<span>
																Ida y vuelta (+{roundTripDiscountPercentage}%)
															</span>
															<span className="font-semibold">
																-{formatCurrency(pricing.descuentoRoundTrip)}
															</span>
														</div>
													)}
													{personalizedDiscountPercentage > 0 && (
														<div className="flex items-center justify-between">
															<span>
																Descuentos especiales (+
																{personalizedDiscountPercentage}%)
															</span>
															<span className="font-semibold">
																-
																{formatCurrency(
																	pricing.descuentosPersonalizados
																)}
															</span>
														</div>
													)}
													{codigoAplicado && (
														<div className="flex items-center justify-between bg-purple-50 p-2 rounded-lg border border-purple-200">
															<span className="text-purple-800 font-medium">
																🎟️ Código {codigoAplicado.codigo}
															</span>
															<span className="font-semibold text-purple-900">
																-{formatCurrency(pricing.descuentoCodigo || 0)}
															</span>
														</div>
													)}
													<div className="flex items-center justify-between text-slate-700">
														<span>Ahorro total aplicado</span>
														<span className="font-semibold">
															-{formatCurrency(pricing.descuentoOnline)}
															<span className="ml-1 text-xs text-slate-500">
																({totalDiscountPercentage}% total)
															</span>
														</span>
													</div>
													<div className="flex items-center justify-between">
														<span>Precio con descuento</span>
														<span className="font-semibold">
															{formatCurrency(pricing.totalConDescuento)}
														</span>
													</div>
													<div className="flex items-center justify-between">
														<span>Abono sugerido (40%)</span>
														<span className="font-semibold">
															{formatCurrency(pricing.abono)}
														</span>
													</div>
													<div className="flex items-center justify-between">
														<span>Saldo al llegar</span>
														<span className="font-semibold">
															{formatCurrency(pricing.saldoPendiente)}
														</span>
													</div>
												</div>
												<p className="mt-3 text-xs text-muted-foreground">
													Elige si deseas abonar ahora o pagar el total con
													descuento.
												</p>
											</div>
										)}

										{!requiereCotizacionManual && (
											<>
												{activePromotion && (
													<div className="rounded-md border border-emerald-400/40 bg-emerald-50 p-4 text-sm text-emerald-700">
														<p className="font-semibold">
															Descuento especial{" "}
															{activePromotion.descuentoPorcentaje}% ·{" "}
															{activePromotion.descripcion ||
																`Tramo ${activePromotion.destino}`}
														</p>
														{promotionDetails && (
															<p className="mt-1">{promotionDetails}</p>
														)}
													</div>
												)}

												<div className="space-y-4">
													<p className="text-sm font-medium text-foreground">
														Selecciona el monto a pagar
													</p>
													<div className="grid gap-4 md:grid-cols-2">
														{chargeOptions.map((option) => {
															const isSelected = selectedCharge === option.id;
															const isDisabled = option.disabled;
															return (
																<button
																	key={option.id}
																	type="button"
																	onClick={() =>
																		!isDisabled && setSelectedCharge(option.id)
																	}
																	disabled={isDisabled}
																	className={`flex w-full items-center gap-4 rounded-lg border bg-white/90 p-4 text-left transition focus:outline-none ${
																		isSelected
																			? "border-primary ring-2 ring-primary/40"
																			: "border-slate-300 hover:border-primary/60"
																	} ${
																		isDisabled
																			? "cursor-not-allowed opacity-60"
																			: "cursor-pointer"
																	}`}
																>
																	<div className="flex-1">
																		<p className="font-semibold text-slate-900">
																			{option.title}
																		</p>
																		<p className="text-sm text-muted-foreground">
																			{option.subtitle}
																		</p>
																		<p className="mt-2 text-sm font-semibold text-foreground">
																			{formatCurrency(option.amount)}
																		</p>
																	</div>
																	{isSelected && (
																		<span className="text-xs font-semibold uppercase text-primary">
																			Seleccionado
																		</span>
																	)}
																</button>
															);
														})}
													</div>
												</div>

												<div className="space-y-4">
													<p className="text-sm font-medium text-foreground">
														Selecciona tu medio de pago
													</p>
													<div className="grid gap-4 md:grid-cols-2">
														{paymentMethods.map((method) => {
															const isSelected = selectedMethod === method.id;
															const methodLoading =
																loadingGateway ===
																`${method.gateway}-${selectedChargeData?.type}`;
															return (
																<button
																	key={method.id}
																	type="button"
																	onClick={() => setSelectedMethod(method.id)}
																	disabled={isAnotherGatewayLoading}
																	className={`flex w-full items-center gap-4 rounded-lg border bg-white/90 p-4 text-left transition focus:outline-none ${
																		isSelected
																			? "border-primary ring-2 ring-primary/40"
																			: "border-slate-300 hover:border-primary/60"
																	}`}
																>
																	<div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-white shadow">
																		<img
																			src={method.image}
																			alt={method.title}
																			className="h-full w-full object-contain p-2"
																			loading="lazy"
																		/>
																	</div>
																	<div className="flex-1">
																		<p className="font-semibold text-slate-900">
																			{method.title}
																		</p>
																		<p className="text-sm text-muted-foreground">
																			{method.subtitle}
																		</p>
																		{methodLoading && (
																			<p className="mt-1 text-xs text-primary">
																				Generando enlace...
																			</p>
																		)}
																	</div>
																	{isSelected && !methodLoading && (
																		<span className="text-xs font-semibold uppercase text-primary">
																			Seleccionado
																		</span>
																	)}
																</button>
															);
														})}
													</div>
												</div>

												<div className="rounded-xl border border-muted/60 bg-muted/20 p-4 space-y-3">
													<p className="text-sm font-medium text-foreground">
														Antes de continuar
													</p>
													<div className="flex items-start gap-3">
														<Checkbox
															id="check-viaje"
															checked={reviewChecklist.viaje}
															onCheckedChange={(value) =>
																setReviewChecklist((prev) => ({
																	...prev,
																	viaje: Boolean(value),
																}))
															}
														/>
														<label
															htmlFor="check-viaje"
															className="text-sm leading-relaxed text-muted-foreground"
														>
															Confirmo que revisé origen, destino, fecha y hora
															de mi traslado.
														</label>
													</div>
													<div className="flex items-start gap-3">
														<Checkbox
															id="check-contacto"
															checked={reviewChecklist.contacto}
															onCheckedChange={(value) =>
																setReviewChecklist((prev) => ({
																	...prev,
																	contacto: Boolean(value),
																}))
															}
														/>
														<label
															htmlFor="check-contacto"
															className="text-sm leading-relaxed text-muted-foreground"
														>
															Acepto recibir la confirmación y enlace de pago
															por email y WhatsApp.
														</label>
													</div>
													{!canPay && (
														<p className="text-xs text-muted-foreground">
															Marca ambas casillas para habilitar las opciones
															de pago.
														</p>
													)}
												</div>

												<div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
													<div className="flex flex-wrap gap-3 w-full lg:w-auto">
														<Button
															type="button"
															variant="outline"
															className="w-full lg:w-auto"
															onClick={handleStepBack}
															disabled={isSubmitting || Boolean(loadingGateway)}
														>
															Editar información
														</Button>
													</div>
													<div className="w-full lg:w-auto">
														<Button
															type="button"
															className="w-full bg-accent hover:bg-accent/90 text-accent-foreground focus-visible:ring-accent/30"
															onClick={() => {
																if (
																	selectedMethodData &&
																	selectedChargeData &&
																	!selectedCombinationLoading
																) {
																	handlePayment(
																		selectedMethodData.gateway,
																		selectedChargeData.type
																	);
																}
															}}
															disabled={
																!canTriggerPayment || selectedCombinationLoading
															}
														>
															{selectedCombinationLoading ? (
																<>
																	<LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
																	Procesando pago...
																</>
															) : selectedMethodData && selectedChargeData ? (
																`Pagar ${formatCurrency(
																	selectedChargeData.amount
																)} con ${selectedMethodData.title}`
															) : (
																"Selecciona un medio de pago"
															)}
														</Button>
													</div>
												</div>
											</>
										)}
									</div>
								)}
								{stepError && (
									<div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
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

export default Hero;
