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
					alt="Fondo transporte"
					className="w-full h-full object-cover opacity-60 transition-all duration-700 hover:scale-105"
				/>
				<div className="absolute inset-0 bg-gradient-to-t from-zinc-900/95 via-zinc-900/60 via-50% to-zinc-800/30 animate-gradient-shift" />
				<div className="absolute inset-0 bg-gradient-to-br from-black/20 via-transparent to-black/20" />
			</div>

			{/* Hero Content */}
			<div className="relative z-10 w-full max-w-6xl px-4 flex flex-col items-center text-center mb-10 lg:mb-16 animate-fade-in-up">
				<h1 className="text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight text-white mb-4 drop-shadow-2xl transition-all duration-500 hover:scale-105 hover:drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]">
					Tu viaje comienza aquí.
				</h1>
				<p className="text-lg md:text-xl text-zinc-200 max-w-2xl font-medium drop-shadow-lg transition-all duration-300 hover:text-white">
					Conecta con Pucón, Villarrica y toda la región. Sin esperas, sin escalas.
				</p>
			</div>

			{/* Floating Booking Bar (Step 1) */}
			<div className="relative z-20 w-full max-w-5xl px-4 animate-fade-in-up animation-delay-200">
				<div className="bg-white/95 backdrop-blur-xl rounded-2xl lg:rounded-full shadow-2xl shadow-black/20 hover:shadow-3xl hover:shadow-black/30 p-4 lg:p-2 lg:pl-6 border border-zinc-100 flex flex-col lg:flex-row items-center gap-4 transition-all duration-500 hover:scale-[1.01] hover:bg-white">

					{/* Horizontal Inputs Grid */}
					<div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 w-full lg:items-center lg:divide-x lg:divide-zinc-100">

						{/* Origen */}
						<div className="relative lg:pr-3 group transition-all duration-300">
							<Label htmlFor="hero-origen" className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1 block lg:hidden group-hover:text-zinc-600 transition-colors duration-200">Origen</Label>
							<div className="flex items-center relative">
								<MapPin className="h-4 w-4 text-zinc-400 mr-2 lg:hidden group-hover:text-zinc-600 group-hover:scale-110 transition-all duration-200" />
								<div className="w-full">
									<select
										id="hero-origen"
										name="origen"
										value={formData.origen}
										onChange={(e) => {
											handleInputChange(e);
											if (stepError) setStepError("");
										}}
										className="w-full bg-transparent border-none text-zinc-900 font-medium focus:ring-0 focus:ring-offset-0 focus:outline-none p-0 text-sm lg:text-base truncate cursor-pointer appearance-none py-2 lg:py-0 transition-all duration-200 hover:text-black focus:text-black"
									>
										{origenes.map((origen) => (
											<option key={origen} value={origen}>{origen}</option>
										))}
									</select>
								</div>
							</div>
							<Label className="hidden lg:block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mt-1 group-hover:text-zinc-600 transition-colors duration-200">Origen</Label>
						</div>

						{/* Destino */}
						<div className="relative lg:px-3 group transition-all duration-300">
							<Label htmlFor="hero-destino" className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1 block lg:hidden group-hover:text-zinc-600 transition-colors duration-200">Destino</Label>
							<div className="flex items-center">
								<MapPin className="h-4 w-4 text-zinc-400 mr-2 lg:hidden group-hover:text-zinc-600 group-hover:scale-110 transition-all duration-200" />
								<div className="w-full">
									<select
										id="hero-destino"
										name="destino"
										value={formData.destino}
										onChange={(e) => {
											handleInputChange(e);
											if (stepError) setStepError("");
										}}
										className="w-full bg-transparent border-none text-zinc-900 font-medium focus:ring-0 focus:ring-offset-0 focus:outline-none p-0 text-sm lg:text-base truncate cursor-pointer appearance-none py-2 lg:py-0 transition-all duration-200 hover:text-black focus:text-black"
									>
										<option value="">Seleccionar destino</option>
										{destinos.map((d) => (
											<option key={d} value={d}>{d}</option>
										))}
									</select>
								</div>
							</div>
							<Label className="hidden lg:block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mt-1 group-hover:text-zinc-600 transition-colors duration-200">Destino</Label>
						</div>

						{/* Fecha */}
						<div className="relative lg:px-3 group transition-all duration-300">
							<Label htmlFor="hero-fecha" className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1 block lg:hidden group-hover:text-zinc-600 transition-colors duration-200">Fecha</Label>
							<div className="flex items-center">
								<Calendar className="h-4 w-4 text-zinc-400 mr-2 lg:hidden group-hover:text-zinc-600 group-hover:scale-110 transition-all duration-200" />
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
									className="w-full bg-transparent border-none text-zinc-900 font-medium focus:ring-0 focus:ring-offset-0 focus:outline-none p-0 text-sm lg:text-base cursor-pointer py-2 lg:py-0 transition-all duration-200 hover:text-black focus:text-black"
								/>
							</div>
							<Label className="hidden lg:block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mt-1 group-hover:text-zinc-600 transition-colors duration-200">Fecha</Label>
						</div>

						{/* Hora */}
						<div className="relative lg:px-3 group transition-all duration-300">
							<Label htmlFor="hero-hora" className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1 block lg:hidden group-hover:text-zinc-600 transition-colors duration-200">Hora</Label>
							<div className="flex items-center">
								<Clock className="h-4 w-4 text-zinc-400 mr-2 lg:hidden group-hover:text-zinc-600 group-hover:scale-110 transition-all duration-200" />
								<div className="w-full">
									<select
										id="hero-hora"
										name="hora"
										value={formData.hora}
										onChange={(e) => {
											handleInputChange({ target: { name: "hora", value: e.target.value } });
											if (stepError) setStepError("");
										}}
										className="w-full bg-transparent border-none text-zinc-900 font-medium focus:ring-0 focus:ring-offset-0 focus:outline-none p-0 text-sm lg:text-base cursor-pointer appearance-none py-2 lg:py-0 transition-all duration-200 hover:text-black focus:text-black"
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
							<Label className="hidden lg:block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mt-1 group-hover:text-zinc-600 transition-colors duration-200">Hora</Label>
						</div>

						{/* Pasajeros */}
						<div className="relative lg:px-3 group transition-all duration-300">
							<Label htmlFor="hero-pasajeros" className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1 block lg:hidden group-hover:text-zinc-600 transition-colors duration-200">Pasajeros</Label>
							<div className="flex items-center">
								<Users className="h-4 w-4 text-zinc-400 mr-2 lg:hidden group-hover:text-zinc-600 group-hover:scale-110 transition-all duration-200" />
								<div className="w-full">
									<select
										id="hero-pasajeros"
										name="pasajeros"
										value={formData.pasajeros}
										onChange={handleInputChange}
										className="w-full bg-transparent border-none text-zinc-900 font-medium focus:ring-0 focus:ring-offset-0 focus:outline-none p-0 text-sm lg:text-base cursor-pointer appearance-none py-2 lg:py-0 transition-all duration-200 hover:text-black focus:text-black"
									>
										{[...Array(maxPasajeros)].map((_, i) => (
											<option key={i + 1} value={i + 1}>
												{i + 1} {i === 0 ? "persona" : "personas"}
											</option>
										))}
									</select>
								</div>
							</div>
							<Label className="hidden lg:block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mt-1 group-hover:text-zinc-600 transition-colors duration-200">Pasajeros</Label>
						</div>
					</div>

					{/* Search Button */}
					<Button
						onClick={handleStepOneNext}
						className="w-full lg:w-auto h-12 lg:h-14 rounded-xl lg:rounded-full px-8 bg-gradient-to-r from-black to-zinc-800 hover:from-zinc-800 hover:to-black text-white font-semibold shadow-lg hover:shadow-2xl hover:shadow-black/40 transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-2 text-base group relative overflow-hidden"
						disabled={isSubmitting || verificandoDisponibilidad}
					>
						<span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
						{verificandoDisponibilidad ? (
							<LoaderCircle className="h-5 w-5 animate-spin" />
						) : (
							<>
								Buscar <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
							</>
						)}
					</Button>
				</div>

				{/* Validation Messages & Return Toggle */}
				<div className="mt-4 flex flex-col lg:flex-row justify-center items-center gap-4">
					<div className="flex items-center space-x-2 bg-black/30 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 transition-all duration-300 hover:bg-black/50 hover:border-white/20 hover:scale-105 active:scale-95 cursor-pointer group">
						<Checkbox
							id="hero-idaVuelta"
							checked={formData.idaVuelta}
							onCheckedChange={(value) => {
								const isRoundTrip = Boolean(value);
								handleInputChange({ target: { name: "idaVuelta", value: isRoundTrip } });
								if (!isRoundTrip) handleInputChange({ target: { name: "fechaRegreso", value: "" } });
								else if (formData.fecha) handleInputChange({ target: { name: "fechaRegreso", value: formData.fecha } });
							}}
							className="border-white data-[state=checked]:bg-white data-[state=checked]:text-black transition-all duration-200 group-hover:scale-110"
						/>
						<label htmlFor="hero-idaVuelta" className="text-sm font-medium text-white cursor-pointer select-none group-hover:text-zinc-100 transition-colors duration-200">
							Necesito regreso
						</label>
					</div>

					{formData.idaVuelta && (
						<div className="flex items-center bg-white/95 backdrop-blur-sm rounded-full px-4 py-1.5 shadow-lg hover:shadow-xl animate-fade-in transition-all duration-300 hover:scale-105 border border-zinc-100">
							<Label className="text-xs font-bold text-zinc-500 mr-2 uppercase">Regreso:</Label>
							<input
								type="date"
								name="fechaRegreso"
								value={formData.fechaRegreso}
								onChange={handleInputChange}
								min={formData.fecha || minDateTime}
								className="bg-transparent border-none text-sm font-medium text-zinc-900 focus:ring-0 focus:outline-none p-0 h-auto transition-colors duration-200 hover:text-black"
							/>
						</div>
					)}
				</div>

				{stepError && (
					<div className="mt-4 text-center animate-bounce">
						<Badge variant="destructive" className="px-4 py-1.5 text-sm font-normal shadow-lg shadow-red-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-red-500/40">
							{stepError}
						</Badge>
					</div>
				)}
			</div>

			{/* Step 2: Details & Payment Drawer (Sidebar) */}
			<Sheet open={currentStep === 1} onOpenChange={(open) => !open && handleStepBack()}>
				<SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto p-0 animate-slide-in-right">
					<div className="p-6">
						<SheetHeader className="mb-6 text-left">
							<SheetTitle className="text-3xl font-bold text-zinc-900 animate-fade-in">Resumen</SheetTitle>
							<SheetDescription className="text-zinc-500 animate-fade-in animation-delay-100">
								Revisa los detalles de tu viaje y completa tu información.
							</SheetDescription>
						</SheetHeader>

						<div className="space-y-8">
							{/* Route Summary Card */}
							<div className="bg-gradient-to-br from-zinc-50 to-zinc-100/50 p-5 rounded-2xl border border-zinc-200 shadow-sm hover:shadow-md transition-all duration-300 animate-fade-in animation-delay-200">
								<div className="flex items-start justify-between mb-4">
									<div className="flex flex-col">
										<span className="text-xs font-bold text-zinc-400 uppercase tracking-wide mb-1">Ruta</span>
										<div className="flex items-center gap-2 text-lg font-semibold text-zinc-900">
											<span>{formData.origen === "Otro" ? formData.otroOrigen : formData.origen}</span>
											<ArrowRight className="h-4 w-4 text-zinc-400 animate-pulse" />
											<span>{formData.destino === "Otro" ? formData.otroDestino : formData.destino}</span>
										</div>
									</div>
									<Button variant="ghost" size="icon" onClick={handleStepBack} className="text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200 -mt-1 -mr-2 transition-all duration-200 hover:scale-110 active:scale-95 hover:rotate-12">
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
								<div className="space-y-2 animate-fade-in animation-delay-300">
									<div className="flex items-end justify-between p-4 rounded-xl bg-gradient-to-br from-zinc-100 to-zinc-50 border border-zinc-200 transition-all duration-300 hover:shadow-md">
										<span className="text-sm font-medium text-zinc-500">Total estimado</span>
										<span className="text-3xl font-bold text-zinc-900 tracking-tight transition-all duration-300 hover:scale-110">
											{formatCurrency(pricing.totalConDescuento)}
										</span>
									</div>
									{descuentoRetorno && (
										<div className="bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2 border border-green-200 shadow-sm hover:shadow-md transition-all duration-300 animate-fade-in">
											<span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
											¡Descuento por retorno aplicado!
										</div>
									)}
								</div>
							)}

							{/* Form Fields */}
							<div className="space-y-5 animate-fade-in animation-delay-400">
								<div className="space-y-2 group">
									<Label htmlFor="hero-nombre" className="text-sm font-semibold text-zinc-700 group-focus-within:text-zinc-900 transition-colors duration-200">Nombre completo</Label>
									<Input
										id="hero-nombre"
										name="nombre"
										value={formData.nombre}
										onChange={handleInputChange}
										placeholder="Como aparece en tu documento"
										className="h-12 bg-zinc-50 border-zinc-200 focus:bg-white focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 transition-all duration-300 hover:border-zinc-300 hover:shadow-sm"
									/>
								</div>

								<div className="grid grid-cols-1 gap-4">
									<div className="space-y-2 group">
										<Label htmlFor="hero-email" className="text-sm font-semibold text-zinc-700 group-focus-within:text-zinc-900 transition-colors duration-200">Correo electrónico</Label>
										<div className="relative">
											<Input
												id="hero-email"
												type="email"
												name="email"
												value={formData.email}
												onChange={handleInputChange}
												onBlur={(e) => verificarReservaActiva(e.target.value)}
												className="h-12 bg-zinc-50 border-zinc-200 focus:bg-white focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 transition-all duration-300 hover:border-zinc-300 hover:shadow-sm"
												placeholder="ejemplo@correo.com"
											/>
											{verificandoReserva && (
												<span className="absolute right-3 top-3.5 text-xs text-zinc-400 animate-pulse">Verificando...</span>
											)}
										</div>
									</div>
									<div className="space-y-2 group">
										<Label htmlFor="hero-telefono" className="text-sm font-semibold text-zinc-700 group-focus-within:text-zinc-900 transition-colors duration-200">Teléfono móvil</Label>
										<div className="relative">
											<Input
												id="hero-telefono"
												name="telefono"
												value={formData.telefono}
												onChange={handleInputChange}
												className={`h-12 bg-zinc-50 border-zinc-200 focus:bg-white focus:border-zinc-400 focus:ring-2 transition-all duration-300 hover:border-zinc-300 hover:shadow-sm ${phoneError ? "border-red-300 focus:ring-red-200 focus:border-red-400" : "focus:ring-zinc-200"}`}
												placeholder="+56 9 ..."
											/>
										</div>
										{phoneError && <span className="text-xs text-red-500 mt-1 block animate-fade-in">{phoneError}</span>}
									</div>
								</div>
							</div>

							{/* Consent */}
							<div className="flex items-start space-x-3 py-2 group animate-fade-in animation-delay-500">
								<Checkbox
									id="hero-payment-consent"
									checked={paymentConsent}
									onCheckedChange={(value) => setPaymentConsent(Boolean(value))}
									className="mt-1 border-zinc-300 data-[state=checked]:bg-black data-[state=checked]:border-black transition-all duration-200 hover:border-zinc-400"
								/>
								<label htmlFor="hero-payment-consent" className="text-sm text-zinc-500 leading-snug cursor-pointer group-hover:text-zinc-700 transition-colors duration-200">
									Acepto los <span className="underline hover:text-zinc-900 transition-colors duration-200">términos y condiciones</span>.
								</label>
							</div>

							{/* Error Message */}
							{stepError && (
								<div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 text-red-600 p-4 rounded-xl text-sm font-medium text-center animate-fade-in shadow-sm hover:shadow-md transition-all duration-300">
									{stepError}
								</div>
							)}

							{/* Payment Actions */}
							<div className="pt-4 pb-10 animate-fade-in animation-delay-600">
								{mostrarPrecio && !requiereCotizacionManual && todosLosCamposCompletos ? (
									<div className="space-y-4">
										{!selectedPaymentType ? (
											<div className="grid grid-cols-2 gap-4">
												{paymentOptions.map((option) => (
													<button
														key={option.id}
														type="button"
														onClick={() => setSelectedPaymentType(option.type)}
														className={`p-4 rounded-xl border text-left transition-all duration-300 relative overflow-hidden group hover:scale-105 active:scale-95 ${
															option.recommended
																? "border-black bg-gradient-to-br from-zinc-900 to-black text-white shadow-lg hover:shadow-2xl hover:from-zinc-800 hover:to-zinc-900"
																: "border-zinc-200 hover:border-zinc-400 bg-white hover:bg-zinc-50 shadow-sm hover:shadow-md"
														}`}
													>
														<span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
														{option.recommended && (
															<div className="absolute top-0 right-0 bg-gradient-to-r from-green-500 to-emerald-500 text-[10px] font-bold px-2 py-0.5 text-white rounded-bl-lg shadow-md animate-pulse">
																POPULAR
															</div>
														)}
														<div className={`text-xs mb-1 transition-colors duration-200 ${option.recommended ? "text-zinc-400 group-hover:text-zinc-300" : "text-zinc-500 group-hover:text-zinc-600"}`}>{option.title}</div>
														<div className={`font-bold text-lg transition-all duration-200 ${option.recommended ? "text-white" : "text-zinc-900 group-hover:scale-105"}`}>{formatCurrency(option.amount)}</div>
													</button>
												))}
											</div>
										) : (
											<div className="space-y-4 animate-fade-in">
												<div className="flex items-center justify-between text-sm bg-gradient-to-r from-zinc-100 to-zinc-50 p-4 rounded-xl border border-zinc-200 shadow-sm transition-all duration-300 hover:shadow-md">
													<span className="text-zinc-600">Monto a pagar: <strong className="text-zinc-900 transition-all duration-200 hover:scale-110 inline-block">{formatCurrency(selectedPaymentType === 'total' ? pricing.totalConDescuento : pricing.abono)}</strong></span>
													<button onClick={() => setSelectedPaymentType(null)} className="text-zinc-500 hover:text-black text-xs font-medium underline transition-all duration-200 hover:scale-105 active:scale-95">Cambiar</button>
												</div>
												<Button
													type="button"
													onClick={() => handleProcesarPago("flow", selectedPaymentType)}
													disabled={isSubmitting || !!loadingGateway}
													className="w-full h-14 rounded-xl bg-gradient-to-r from-black to-zinc-800 hover:from-zinc-800 hover:to-black text-white font-bold text-lg shadow-lg hover:shadow-2xl hover:shadow-black/40 transition-all duration-300 hover:scale-105 active:scale-95 relative overflow-hidden group"
												>
													<span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
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
												className="w-full h-14 rounded-xl bg-white border-2 border-zinc-200 text-zinc-900 hover:border-black hover:bg-zinc-50 font-bold text-lg shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 relative overflow-hidden group"
												disabled={isSubmitting}
											>
												<span className="absolute inset-0 bg-gradient-to-r from-zinc-900/0 via-zinc-900/5 to-zinc-900/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
												{isSubmitting ? <LoaderCircle className="animate-spin" /> : "Solicitar Reserva"}
											</Button>
										) : (
											<div className="text-sm text-center text-zinc-400 py-2 italic animate-pulse">
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
