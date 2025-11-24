import React, { useMemo, useState } from "react";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetDescription,
} from "./ui/sheet";
import { LoaderCircle, ArrowRight, MapPin, Calendar, Clock, Users, ChevronRight } from "lucide-react";
import heroVan from "../assets/hero-van.png";
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
	const [paymentConsent, setPaymentConsent] = useState(false);
	const [selectedPaymentType, setSelectedPaymentType] = useState(null); // 'abono' o 'total'
	const [reservaActiva, setReservaActiva] = useState(null); // Reserva activa sin pagar encontrada
	const [verificandoReserva, setVerificandoReserva] = useState(false);
	const [verificandoDisponibilidad, setVerificandoDisponibilidad] = useState(false);
	const [descuentoRetorno, setDescuentoRetorno] = useState(null); // Información de descuento por retorno

	// Generar opciones de tiempo en intervalos de 15 minutos
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
				} else {
					setReservaActiva(null);
				}
			}
		} catch (error) {
			console.error("Error verificando reserva activa:", error);
			setReservaActiva(null);
		} finally {
			setVerificandoReserva(false);
		}
	};

	// Verificar disponibilidad y buscar oportunidades de retorno
	const verificarDisponibilidadYRetorno = async () => {
		if (!formData.destino || !formData.fecha || !formData.hora) {
			return { disponible: true, descuento: null };
		}

		setVerificandoDisponibilidad(true);
		try {
			// Buscar el destino seleccionado para obtener la duración estimada
			const destinoSeleccionado = destinos.find(
				(d) => d.nombre === formData.destino
			);
			const duracionMinutos = destinoSeleccionado?.duracionIdaMinutos || 60;

			// 1. Verificar disponibilidad de vehículos
			const respDisponibilidad = await fetch(
				`${getBackendUrl()}/api/disponibilidad/verificar`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						fecha: formData.fecha,
						hora: formData.hora,
						duracionMinutos: duracionMinutos,
						pasajeros: formData.pasajeros || 1,
					}),
				}
			);

			if (!respDisponibilidad.ok) {
				return { disponible: true, descuento: null };
			}

			const dataDisponibilidad = await respDisponibilidad.json();

			if (!dataDisponibilidad.disponible) {
				return {
					disponible: false,
					mensaje: dataDisponibilidad.mensaje,
					descuento: null,
				};
			}

			// 2. Buscar oportunidades de retorno
			const respRetorno = await fetch(
				`${getBackendUrl()}/api/disponibilidad/oportunidades-retorno`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						origen: formData.origen,
						destino: formData.destino,
						fecha: formData.fecha,
						hora: formData.hora,
					}),
				}
			);

			if (respRetorno.ok) {
				const dataRetorno = await respRetorno.json();
				if (dataRetorno.hayOportunidad && dataRetorno.descuento > 0) {
					return {
						disponible: true,
						descuento: {
							porcentaje: dataRetorno.descuento,
							mensaje: dataRetorno.mensaje,
							detalles: dataRetorno.detalles,
						},
					};
				}
			}

			return { disponible: true, descuento: null };
		} catch (error) {
			console.error("Error verificando disponibilidad y retorno:", error);
			return { disponible: true, descuento: null };
		} finally {
			setVerificandoDisponibilidad(false);
		}
	};

	// Validaciones del primer paso
	const handleStepOneNext = async () => {
		if (!formData.origen?.trim()) return setStepError("Selecciona el origen.");
		if (!formData.destino) return setStepError("Selecciona el destino.");
		if (!formData.fecha) return setStepError("Selecciona la fecha.");
		if (!formData.hora) return setStepError("Selecciona la hora.");

		const fechaSeleccionada = new Date(`${formData.fecha}T00:00:00`);
		const hoy = new Date();
		hoy.setHours(0, 0, 0, 0);

		if (fechaSeleccionada < hoy) return setStepError("La fecha no puede ser pasada.");

		if (formData.idaVuelta) {
			if (!formData.fechaRegreso) return setStepError("Selecciona la fecha de regreso.");
			const fechaRegreso = new Date(`${formData.fechaRegreso}T00:00:00`);
			if (fechaRegreso < fechaSeleccionada) return setStepError("La fecha de regreso no puede ser anterior a la ida.");
		}

		const resultado = await verificarDisponibilidadYRetorno();

		if (!resultado.disponible) {
			setStepError(resultado.mensaje || "No hay vehículos disponibles.");
			return;
		}

		if (resultado.descuento) {
			setDescuentoRetorno(resultado.descuento);
		} else {
			setDescuentoRetorno(null);
		}

		setStepError("");
		setCurrentStep(1);
	};

	const validarDatosReserva = () => {
		if (!formData.nombre?.trim()) return setStepError("Falta tu nombre.");
		if (!formData.email?.trim()) return setStepError("Falta tu email.");
		if (!formData.telefono?.trim()) return setStepError("Falta tu teléfono.");

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(formData.email)) return setStepError("Email inválido.");

		if (!validarTelefono(formData.telefono)) {
			setPhoneError("Formato inválido (ej: +56 9 1234 5678)");
		} else {
			setPhoneError("");
		}

		if (!paymentConsent) return setStepError("Acepta los términos.");

		setStepError("");
		return true;
	};

	const handleGuardarReserva = async () => {
		if (!validarDatosReserva()) return;
		const result = await onSubmitWizard();
		if (!result.success) {
			setStepError(result.message || "Error al guardar.");
			return;
		}
		alert("✅ Reserva guardada. Revisa tu email para pagar después.");
	};

	const handleProcesarPago = async (gateway, type) => {
		if (!validarDatosReserva()) return;
		const result = await onSubmitWizard();
		if (!result.success) {
			setStepError(result.message || "Error al procesar.");
			return;
		}
		handlePayment(gateway, type, {
			reservaId: result.reservaId,
			codigoReserva: result.codigoReserva,
		});
	};

	const handleStepBack = () => setCurrentStep(0);

	const paymentOptions = useMemo(
		() => [
			{
				id: "abono",
				type: "abono",
				title: "Abonar 40%",
				amount: pricing.abono,
				recommended: true,
			},
			{
				id: "total",
				type: "total",
				title: "Pagar 100%",
				amount: pricing.totalConDescuento,
			},
		],
		[pricing.abono, pricing.totalConDescuento]
	);

	const todosLosCamposCompletos = useMemo(() => {
		if (currentStep !== 1) return false;
		return (
			formData.nombre?.trim().length > 0 &&
			formData.email?.trim().length > 0 &&
			/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) &&
			formData.telefono?.trim().length > 0 &&
			paymentConsent
		);
	}, [currentStep, formData, paymentConsent]);

	return (
		<section id="inicio" className="relative w-full h-[600px] lg:h-[700px] flex flex-col justify-center items-center overflow-hidden bg-zinc-900">

			{/* Background Image with Overlay */}
			<div className="absolute inset-0 z-0">
				<img
					src={heroVan}
					alt="Transporte privado y transfer aeropuerto Temuco a Pucón y Villarrica"
					className="w-full h-full object-cover opacity-60"
				/>
				<div className="absolute inset-0 bg-gradient-to-t from-zinc-900/90 via-zinc-900/40 to-transparent" />
			</div>

			{/* Hero Content */}
			<div className="relative z-10 w-full max-w-6xl px-4 flex flex-col items-center text-center mb-10 lg:mb-16 animate-fade-in-up">
				<h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-zinc-100 to-zinc-400 mb-6 drop-shadow-2xl">
					Transporte Exclusivo <br className="hidden md:block" /> y Transfer Aeropuerto Temuco
				</h1>
				<p className="text-lg md:text-xl text-zinc-300 max-w-3xl font-light leading-relaxed drop-shadow-md">
					La forma más <span className="text-amber-100 font-semibold">segura y cómoda</span> de viajar. Conecta con <span className="text-amber-100 font-semibold">Pucón, Villarrica</span> y toda la región de la Araucanía. Ideal para <span className="text-amber-100 font-semibold">vacaciones, negocios</span> y traslados privados desde el <span className="text-amber-100 font-semibold">Aeropuerto de Temuco</span>.
				</p>
			</div>

			{/* Floating Booking Bar (Step 1) */}
			<div className="relative z-20 w-full max-w-5xl px-4 animate-fade-in-up animation-delay-200">
				<div className="bg-white rounded-2xl lg:rounded-full shadow-2xl p-4 lg:p-2 lg:pl-6 border border-zinc-100 flex flex-col lg:flex-row items-center gap-4">

					{/* Horizontal Inputs Grid */}
					<div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 w-full lg:items-center lg:divide-x lg:divide-zinc-100">

						{/* Origen */}
						<div className="relative lg:pr-3 group">
							<Label htmlFor="hero-origen" className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1 block lg:hidden">Origen</Label>
							<div className="flex items-center relative">
								<MapPin className="h-4 w-4 text-zinc-400 mr-2 lg:hidden" />
								<div className="w-full">
									<select
										id="hero-origen"
										name="origen"
										value={formData.origen}
										onChange={(e) => {
											handleInputChange(e);
											if (stepError) setStepError("");
										}}
										className="w-full bg-transparent border-none text-zinc-900 font-medium focus:ring-0 p-0 text-sm lg:text-base truncate cursor-pointer appearance-none py-2 lg:py-0"
									>
										{origenes.map((origen) => (
											<option key={origen} value={origen}>{origen}</option>
										))}
									</select>
								</div>
							</div>
							<Label className="hidden lg:block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mt-1">Origen</Label>
						</div>

						{/* Destino */}
						<div className="relative lg:px-3 group">
							<Label htmlFor="hero-destino" className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1 block lg:hidden">Destino</Label>
							<div className="flex items-center">
								<MapPin className="h-4 w-4 text-zinc-400 mr-2 lg:hidden" />
								<div className="w-full">
									<select
										id="hero-destino"
										name="destino"
										value={formData.destino}
										onChange={(e) => {
											handleInputChange(e);
											if (stepError) setStepError("");
										}}
										className="w-full bg-transparent border-none text-zinc-900 font-medium focus:ring-0 p-0 text-sm lg:text-base truncate cursor-pointer appearance-none py-2 lg:py-0"
									>
										<option value="">Seleccionar destino</option>
										{destinos.map((d) => (
											<option key={d} value={d}>{d}</option>
										))}
									</select>
								</div>
							</div>
							<Label className="hidden lg:block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mt-1">Destino</Label>
						</div>

						{/* Fecha */}
						<div className="relative lg:px-3 group">
							<Label htmlFor="hero-fecha" className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1 block lg:hidden">Fecha</Label>
							<div className="flex items-center">
								<Calendar className="h-4 w-4 text-zinc-400 mr-2 lg:hidden" />
								<input
									id="hero-fecha"
									type="date"
									name="fecha"
									value={formData.fecha}
									onChange={(e) => {
										handleInputChange(e);
										if (stepError) setStepError("");
									}}
									min={minDateTime}
									className="w-full bg-transparent border-none text-zinc-900 font-medium focus:ring-0 p-0 text-sm lg:text-base cursor-pointer py-2 lg:py-0"
								/>
							</div>
							<Label className="hidden lg:block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mt-1">Fecha</Label>
						</div>

						{/* Hora */}
						<div className="relative lg:px-3 group">
							<Label htmlFor="hero-hora" className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1 block lg:hidden">Hora</Label>
							<div className="flex items-center">
								<Clock className="h-4 w-4 text-zinc-400 mr-2 lg:hidden" />
								<div className="w-full">
									<select
										id="hero-hora"
										name="hora"
										value={formData.hora}
										onChange={(e) => {
											handleInputChange({ target: { name: "hora", value: e.target.value } });
											if (stepError) setStepError("");
										}}
										className="w-full bg-transparent border-none text-zinc-900 font-medium focus:ring-0 p-0 text-sm lg:text-base cursor-pointer appearance-none py-2 lg:py-0"
									>
										<option value="" disabled>Seleccionar</option>
										{timeOptions.map((option) => (
											<option key={option.value} value={option.value}>
												{option.label}
											</option>
										))}
									</select>
								</div>
							</div>
							<Label className="hidden lg:block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mt-1">Hora</Label>
						</div>

						{/* Pasajeros */}
						<div className="relative lg:px-3 group">
							<Label htmlFor="hero-pasajeros" className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1 block lg:hidden">Pasajeros</Label>
							<div className="flex items-center">
								<Users className="h-4 w-4 text-zinc-400 mr-2 lg:hidden" />
								<div className="w-full">
									<select
										id="hero-pasajeros"
										name="pasajeros"
										value={formData.pasajeros}
										onChange={handleInputChange}
										className="w-full bg-transparent border-none text-zinc-900 font-medium focus:ring-0 p-0 text-sm lg:text-base cursor-pointer appearance-none py-2 lg:py-0"
									>
										{[...Array(maxPasajeros)].map((_, i) => (
											<option key={i + 1} value={i + 1}>
												{i + 1} {i === 0 ? "persona" : "personas"}
											</option>
										))}
									</select>
								</div>
							</div>
							<Label className="hidden lg:block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mt-1">Pasajeros</Label>
						</div>
					</div>

					{/* Search Button */}
					<Button
						onClick={handleStepOneNext}
						className="w-full lg:w-auto h-12 lg:h-14 rounded-xl lg:rounded-full px-8 bg-black hover:bg-zinc-800 text-white font-semibold shadow-lg transition-all hover:scale-105 flex items-center justify-center gap-2 text-base"
						disabled={isSubmitting || verificandoDisponibilidad}
					>
						{verificandoDisponibilidad ? (
							<LoaderCircle className="h-5 w-5 animate-spin" />
						) : (
							<>
								Buscar <ArrowRight className="h-5 w-5" />
							</>
						)}
					</Button>
				</div>

				{/* Validation Messages & Return Toggle */}
				<div className="mt-4 flex flex-col lg:flex-row justify-center items-center gap-4">
					<div className="flex items-center space-x-2 bg-black/30 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 transition-colors hover:bg-black/40">
						<Checkbox
							id="hero-idaVuelta"
							checked={formData.idaVuelta}
							onCheckedChange={(value) => {
								const isRoundTrip = Boolean(value);
								handleInputChange({ target: { name: "idaVuelta", value: isRoundTrip } });
								if (!isRoundTrip) handleInputChange({ target: { name: "fechaRegreso", value: "" } });
								else if (formData.fecha) handleInputChange({ target: { name: "fechaRegreso", value: formData.fecha } });
							}}
							className="border-white data-[state=checked]:bg-white data-[state=checked]:text-black"
						/>
						<label htmlFor="hero-idaVuelta" className="text-sm font-medium text-white cursor-pointer select-none">
							Necesito regreso
						</label>
					</div>

					{formData.idaVuelta && (
						<div className="flex items-center bg-white rounded-full px-4 py-1.5 shadow-lg animate-fade-in">
							<Label className="text-xs font-bold text-zinc-500 mr-2 uppercase">Regreso:</Label>
							<input
								type="date"
								name="fechaRegreso"
								value={formData.fechaRegreso}
								onChange={handleInputChange}
								min={formData.fecha || minDateTime}
								className="bg-transparent border-none text-sm font-medium text-zinc-900 focus:ring-0 p-0 h-auto"
							/>
						</div>
					)}
				</div>

				{stepError && (
					<div className="mt-4 text-center animate-bounce">
						<Badge variant="destructive" className="px-4 py-1.5 text-sm font-normal">
							{stepError}
						</Badge>
					</div>
				)}
			</div>

			{/* Step 2: Details & Payment Drawer (Sidebar) */}
			<Sheet open={currentStep === 1} onOpenChange={(open) => !open && handleStepBack()}>
				<SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto p-0">
					<div className="p-6">
						<SheetHeader className="mb-6 text-left">
							<SheetTitle className="text-3xl font-bold text-zinc-900">Resumen</SheetTitle>
							<SheetDescription className="text-zinc-500">
								Revisa los detalles de tu viaje y completa tu información.
							</SheetDescription>
						</SheetHeader>

						<div className="space-y-8">
							{/* Route Summary Card */}
							<div className="bg-zinc-50 p-5 rounded-2xl border border-zinc-100">
								<div className="flex items-start justify-between mb-4">
									<div className="flex flex-col">
										<span className="text-xs font-bold text-zinc-400 uppercase tracking-wide mb-1">Ruta</span>
										<div className="flex items-center gap-2 text-lg font-semibold text-zinc-900">
											<span>{formData.origen === "Otro" ? formData.otroOrigen : formData.origen}</span>
											<ArrowRight className="h-4 w-4 text-zinc-400" />
											<span>{formData.destino === "Otro" ? formData.otroDestino : formData.destino}</span>
										</div>
									</div>
									<Button variant="ghost" size="icon" onClick={handleStepBack} className="text-zinc-400 hover:text-zinc-900 -mt-1 -mr-2">
										<span className="sr-only">Editar</span>
										<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil h-4 w-4"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
									</Button>
								</div>

								<div className="grid grid-cols-2 gap-4">
									<div>
										<span className="text-xs font-bold text-zinc-400 uppercase tracking-wide block mb-1">Salida</span>
										<p className="text-sm font-medium text-zinc-800">{fechaLegible}</p>
										<p className="text-sm text-zinc-500">{formData.hora}</p>
									</div>
									<div>
										<span className="text-xs font-bold text-zinc-400 uppercase tracking-wide block mb-1">Pasajeros</span>
										<p className="text-sm font-medium text-zinc-800">{formData.pasajeros} personas</p>
									</div>
								</div>

								{formData.idaVuelta && (
									<div className="mt-4 pt-4 border-t border-zinc-200">
										<span className="text-xs font-bold text-green-600 uppercase tracking-wide block mb-1">Regreso</span>
										<p className="text-sm font-medium text-zinc-800">{new Date(formData.fechaRegreso).toLocaleDateString("es-CL")}</p>
									</div>
								)}
							</div>

							{/* Pricing Display */}
							{mostrarPrecio && (
								<div className="space-y-2">
									<div className="flex items-end justify-between">
										<span className="text-sm font-medium text-zinc-500">Total estimado</span>
										<span className="text-3xl font-bold text-zinc-900 tracking-tight">
											{formatCurrency(pricing.totalConDescuento)}
										</span>
									</div>
									{descuentoRetorno && (
										<div className="bg-green-50 text-green-700 px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2">
											<span className="h-1.5 w-1.5 rounded-full bg-green-500" />
											¡Descuento por retorno aplicado!
										</div>
									)}
								</div>
							)}

							{/* Form Fields */}
							<div className="space-y-5">
								<div className="space-y-2">
									<Label htmlFor="hero-nombre" className="text-sm font-semibold text-zinc-700">Nombre completo</Label>
									<Input
										id="hero-nombre"
										name="nombre"
										value={formData.nombre}
										onChange={handleInputChange}
										placeholder="Como aparece en tu documento"
										className="h-12 bg-zinc-50 border-zinc-200 focus:bg-white transition-all"
									/>
								</div>

								<div className="grid grid-cols-1 gap-4">
									<div className="space-y-2">
										<Label htmlFor="hero-email" className="text-sm font-semibold text-zinc-700">Correo electrónico</Label>
										<div className="relative">
											<Input
												id="hero-email"
												type="email"
												name="email"
												value={formData.email}
												onChange={handleInputChange}
												onBlur={(e) => verificarReservaActiva(e.target.value)}
												className="h-12 bg-zinc-50 border-zinc-200 focus:bg-white transition-all"
												placeholder="ejemplo@correo.com"
											/>
											{verificandoReserva && (
												<span className="absolute right-3 top-3.5 text-xs text-zinc-400">Verificando...</span>
											)}
										</div>
									</div>
									<div className="space-y-2">
										<Label htmlFor="hero-telefono" className="text-sm font-semibold text-zinc-700">Teléfono móvil</Label>
										<div className="relative">
											<Input
												id="hero-telefono"
												name="telefono"
												value={formData.telefono}
												onChange={handleInputChange}
												className={`h-12 bg-zinc-50 border-zinc-200 focus:bg-white transition-all ${phoneError ? "border-red-300 focus:ring-red-200" : ""}`}
												placeholder="+56 9 ..."
											/>
										</div>
										{phoneError && <span className="text-xs text-red-500 mt-1 block">{phoneError}</span>}
									</div>
								</div>
							</div>

							{/* Consent */}
							<div className="flex items-start space-x-3 py-2">
								<Checkbox
									id="hero-payment-consent"
									checked={paymentConsent}
									onCheckedChange={(value) => setPaymentConsent(Boolean(value))}
									className="mt-1 border-zinc-300"
								/>
								<label htmlFor="hero-payment-consent" className="text-sm text-zinc-500 leading-snug cursor-pointer">
									Acepto los <span className="underline hover:text-zinc-800">términos y condiciones</span>.
								</label>
							</div>

							{/* Error Message */}
							{stepError && (
								<div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-sm font-medium text-center">
									{stepError}
								</div>
							)}

							{/* Payment Actions */}
							<div className="pt-4 pb-10">
								{mostrarPrecio && !requiereCotizacionManual && todosLosCamposCompletos ? (
									<div className="space-y-4">
										{!selectedPaymentType ? (
											<div className="grid grid-cols-2 gap-4">
												{paymentOptions.map((option) => (
													<button
														key={option.id}
														type="button"
														onClick={() => setSelectedPaymentType(option.type)}
														className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden ${
															option.recommended
																? "border-black bg-zinc-900 text-white shadow-lg hover:bg-zinc-800"
																: "border-zinc-200 hover:border-zinc-400 bg-white hover:bg-zinc-50"
														}`}
													>
														{option.recommended && (
															<div className="absolute top-0 right-0 bg-green-500 text-[10px] font-bold px-2 py-0.5 text-white rounded-bl-lg">
																POPULAR
															</div>
														)}
														<div className={`text-xs mb-1 ${option.recommended ? "text-zinc-400" : "text-zinc-500"}`}>{option.title}</div>
														<div className={`font-bold text-lg ${option.recommended ? "text-white" : "text-zinc-900"}`}>{formatCurrency(option.amount)}</div>
													</button>
												))}
											</div>
										) : (
											<div className="space-y-4 animate-fade-in">
												<div className="flex items-center justify-between text-sm bg-zinc-100 p-4 rounded-xl">
													<span className="text-zinc-600">Monto a pagar: <strong className="text-zinc-900">{formatCurrency(selectedPaymentType === 'total' ? pricing.totalConDescuento : pricing.abono)}</strong></span>
													<button onClick={() => setSelectedPaymentType(null)} className="text-zinc-500 hover:text-black text-xs font-medium underline">Cambiar</button>
												</div>
												<Button
													type="button"
													onClick={() => handleProcesarPago("flow", selectedPaymentType)}
													disabled={isSubmitting || !!loadingGateway}
													className="w-full h-14 rounded-xl bg-black hover:bg-zinc-800 text-white font-bold text-lg shadow-lg"
												>
													{loadingGateway ? <LoaderCircle className="animate-spin" /> : "Ir a Pagar"}
												</Button>
											</div>
										)}
									</div>
								) : (
									<div>
										{todosLosCamposCompletos ? (
											<Button
												onClick={handleGuardarReserva}
												className="w-full h-14 rounded-xl bg-white border-2 border-zinc-200 text-zinc-900 hover:border-black hover:bg-zinc-50 font-bold text-lg"
												disabled={isSubmitting}
											>
												{isSubmitting ? <LoaderCircle className="animate-spin" /> : "Solicitar Reserva"}
											</Button>
										) : (
											<div className="text-sm text-center text-zinc-400 py-2 italic">
												Completa todos los campos para continuar
											</div>
										)}
									</div>
								)}
							</div>
						</div>
					</div>
				</SheetContent>
			</Sheet>
		</section>
	);
}

export default HeroExpress;
