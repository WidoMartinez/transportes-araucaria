import React, { useMemo, useState, useEffect } from "react";
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
import { LoaderCircle, ArrowRight, ArrowLeft, MapPin, Calendar, Clock, Users, CheckCircle2, ShieldCheck, CreditCard, Info, Mountain, Lightbulb, Plane, Star, Sparkles } from "lucide-react";
import heroVan from "../assets/hero-van.png";
import { getBackendUrl } from "../lib/backend";
import { motion, AnimatePresence } from "framer-motion";
import { destinosInfo } from "../data/destinos";
import AlertaDescuentoRetorno from "./AlertaDescuentoRetorno";
import { calcularDescuentoEscalonado, generarOpcionesDescuento } from "../utils/descuentoRetorno";

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
	destinosData = [], // Data completa para imágenes
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
	const [selectedPaymentType, setSelectedPaymentType] = useState("total");
	const [reservaActiva, setReservaActiva] = useState(null);
	const [verificandoReserva, setVerificandoReserva] = useState(false);
	const [verificandoDisponibilidad, setVerificandoDisponibilidad] = useState(false);
	const [descuentoRetorno, setDescuentoRetorno] = useState(null);
	const [urgencyMessage, setUrgencyMessage] = useState(null);
	// Estado para alerta de descuento escalonado en reservas de retorno
	const [descuentoEscalonadoInfo, setDescuentoEscalonadoInfo] = useState(null);
	const [horaTerminoServicioActivo, setHoraTerminoServicioActivo] = useState(null);
	// Estado para oportunidades de retorno universal (sin email)
	const [oportunidadesRetornoUniversal, setOportunidadesRetornoUniversal] = useState(null);
	const [buscandoRetornos, setBuscandoRetornos] = useState(false);

	useEffect(() => {
		if (currentStep === 1) {
			const messages = [
				{ icon: <Clock className="h-3 w-3" />, text: "Solo queda 1 móvil" },
				{ icon: <Users className="h-3 w-3" />, text: "Alta demanda para hoy" },
				{ icon: <Users className="h-3 w-3" />, text: `${Math.floor(Math.random() * 3) + 2} personas cotizando` }
			];
			setUrgencyMessage(messages[Math.floor(Math.random() * messages.length)]);
		} else {
			setUrgencyMessage(null);
		}
	}, [currentStep]);

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

	// Determinar el "target" para mostrar info (Destino principal o Origen si es traslado hacia aeropuerto)
	const targetName = useMemo(() => {
		return formData.destino !== "Aeropuerto La Araucanía" && formData.destino !== "Otro"
			? formData.destino
			: (formData.origen !== "Aeropuerto La Araucanía" && formData.origen !== "Otro" ? formData.origen : null);
	}, [formData.destino, formData.origen]);

	// Imagen dinámica basada en el destino seleccionado
	const selectedDestinoImage = useMemo(() => {
		// 1. Buscar en destinosInfo (datos locales enriquecidos)
		if (targetName && destinosInfo[targetName]?.imagen) {
			return destinosInfo[targetName].imagen;
		}
		// 2. Fallback: Buscar en destinosData (backend/props)
		if (targetName && Array.isArray(destinosData)) {
			const dest = destinosData.find(d => d.nombre === targetName);
			if (dest && dest.imagen) return dest.imagen;
		}
		// 3. Imagen por defecto
		return heroVan;
	}, [targetName, destinosData]);

	// Texto e información dinámica para el panel visual
	const richInfo = useMemo(() => {
		// Prioridad: Info del paso 1 (Resumen)
		if (currentStep === 1) return {
			title: "Resumen de tu viaje",
			subtitle: "Estás a un paso de confirmar.",
			isSummary: true
		};

		// Prioridad: Info turística enriquecida
		if (targetName && destinosInfo[targetName]) {
			return {
				...destinosInfo[targetName],
				isRich: true
			};
		}

		// Fallback: Textos genéricos basados en selección
		if (formData.destino && formData.destino !== "Aeropuerto La Araucanía" && formData.destino !== "Otro") {
			return { title: `Viaja a ${formData.destino}`, subtitle: "Comodidad y seguridad garantizada." };
		}
		if (formData.origen && formData.origen !== "Aeropuerto La Araucanía" && formData.origen !== "Otro") {
			return { title: `Viaja desde ${formData.origen}`, subtitle: "Comenzamos el viaje donde tú estés." };
		}

		return { title: "Transporte Privado", subtitle: "Conecta con Pucón, Villarrica y toda la región." };
	}, [targetName, currentStep, formData.destino, formData.origen]);

	// Buscar retornos disponibles universalmente (sin email)
	const buscarRetornosUniversal = async () => {
		// Solo buscar si tenemos origen, destino y fecha
		if (!formData.origen || !formData.destino || !formData.fecha) {
			setOportunidadesRetornoUniversal(null);
			return;
		}

		// No buscar si es "Otro" en origen o destino
		if (formData.origen === "Otro" || formData.destino === "Otro") {
			setOportunidadesRetornoUniversal(null);
			return;
		}

		setBuscandoRetornos(true);
		try {
			const apiUrl = getBackendUrl() || "https://transportes-araucaria.onrender.com";
			const response = await fetch(
				`${apiUrl}/api/disponibilidad/buscar-retornos-disponibles`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						origen: formData.origen,
						destino: formData.destino,
						fecha: formData.fecha,
					}),
				}
			);

			if (response.ok) {
				const data = await response.json();
				if (data.hayOportunidades && data.opciones?.length > 0) {
					setOportunidadesRetornoUniversal(data);
				} else {
					setOportunidadesRetornoUniversal(null);
				}
			} else {
				setOportunidadesRetornoUniversal(null);
			}
		} catch (error) {
			console.error("Error buscando retornos universales:", error);
			setOportunidadesRetornoUniversal(null);
		} finally {
			setBuscandoRetornos(false);
		}
	};

	// useEffect para buscar retornos cuando cambia origen, destino o fecha
	useEffect(() => {
		buscarRetornosUniversal();
	}, [formData.origen, formData.destino, formData.fecha]);

	const verificarReservaActiva = async (email) => {
		if (!email || !email.trim()) {
			setReservaActiva(null);
			return;
		}
		setVerificandoReserva(true);
		try {
			const apiUrl = getBackendUrl() || "https://transportes-araucaria.onrender.com";
			const response = await fetch(
				`${apiUrl}/api/reservas/verificar-activa/${encodeURIComponent(email.trim())}`
			);
			if (response.ok) {
				const data = await response.json();
				const reserva = data.tieneReservaActiva ? data.reserva : null;
				setReservaActiva(reserva);
				
				// Si hay reserva activa, calcular hora de término para descuentos escalonados
				if (reserva && reserva.fecha && reserva.hora) {
					const destinoObj = Array.isArray(destinosData)
						? destinosData.find(d => d.nombre === reserva.destino)
						: null;
					const duracionMinutos = destinoObj?.duracionIdaMinutos || 90;
					
					// Calcular hora de término del servicio original
					const [horas, minutos] = reserva.hora.split(":").map(Number);
					const fechaHoraInicio = new Date(`${reserva.fecha}T00:00:00`);
					fechaHoraInicio.setHours(horas, minutos, 0, 0);
					const horaTermino = new Date(fechaHoraInicio.getTime() + duracionMinutos * 60 * 1000);
					setHoraTerminoServicioActivo(horaTermino);
				}
			}
		} catch (error) {
			console.error("Error verificando reserva activa:", error);
			setReservaActiva(null);
		} finally {
			setVerificandoReserva(false);
		}
	};

	// Efecto para calcular descuento escalonado cuando cambia la hora de retorno
	useEffect(() => {
		// Solo calcular si:
		// 1. Hay una reserva activa (viaje de ida ya reservado)
		// 2. El usuario está reservando un retorno (origen = destino anterior, destino = origen anterior)
		// 3. Es la misma fecha o fecha cercana
		// 4. Tiene hora seleccionada
		if (!reservaActiva || !formData.hora || !formData.fecha) {
			setDescuentoEscalonadoInfo(null);
			return;
		}

		// Verificar si es un viaje de retorno (el destino actual es el origen del viaje previo)
		const esViajeRetorno = 
			formData.origen === reservaActiva.destino && 
			formData.destino === reservaActiva.origen;

		// También verificar si la fecha es la misma del servicio original
		const mismaFecha = formData.fecha === reservaActiva.fecha;

		if (!esViajeRetorno || !mismaFecha || !horaTerminoServicioActivo) {
			setDescuentoEscalonadoInfo(null);
			return;
		}

		// Calcular hora de retorno seleccionada
		const [horasRetorno, minutosRetorno] = formData.hora.split(":").map(Number);
		const horaRetorno = new Date(`${formData.fecha}T00:00:00`);
		horaRetorno.setHours(horasRetorno, minutosRetorno, 0, 0);

		// Calcular descuento escalonado
		const descuento = calcularDescuentoEscalonado(horaTerminoServicioActivo, horaRetorno);
		setDescuentoEscalonadoInfo(descuento);

	}, [reservaActiva, formData.hora, formData.fecha, formData.origen, formData.destino, horaTerminoServicioActivo]);

	const verificarDisponibilidadYRetorno = async () => {
		if (!formData.destino || !formData.fecha || !formData.hora) {
			return { disponible: true, descuento: null };
		}
		setVerificandoDisponibilidad(true);
		try {
			// Buscar el destino seleccionado para obtener la duración estimada
			// Si destinosData está disponible, usarlo para más precisión, sino fallback a default
			const destinoObj = Array.isArray(destinosData)
				? destinosData.find(d => d.nombre === formData.destino)
				: null;

			const duracionMinutos = destinoObj?.duracionIdaMinutos || 60;

			const respDisponibilidad = await fetch(
				`${getBackendUrl()}/api/disponibilidad/verificar`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						fecha: formData.fecha,
						hora: formData.hora,
						duracionMinutos: duracionMinutos,
						pasajeros: formData.pasajeros || 1,
					}),
				}
			);

			if (!respDisponibilidad.ok) return { disponible: true, descuento: null };

			const dataDisponibilidad = await respDisponibilidad.json();
			if (!dataDisponibilidad.disponible) {
				return { disponible: false, mensaje: dataDisponibilidad.mensaje, descuento: null };
			}

			const respRetorno = await fetch(
				`${getBackendUrl()}/api/disponibilidad/oportunidades-retorno`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
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
		setDescuentoRetorno(resultado.descuento || null);
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
			return false;
		}
		setPhoneError("");
		if (!paymentConsent) return setStepError("Debes aceptar los términos.");
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
		// alert("✅ Reserva guardada."); // Esto lo maneja el App.jsx
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

	const handleStepBack = () => {
		setStepError("");
		setCurrentStep(0);
	};

	const paymentOptions = useMemo(
		() => [
			{
				id: "total",
				type: "total",
				title: "Pagar Total",
				amount: pricing.totalConDescuento,
				recommended: true,
			},
		],
		[pricing.totalConDescuento]
	);

	// Variants for animations
	const containerVariants = {
		hidden: { opacity: 0 },
		show: {
			opacity: 1,
			transition: {
				staggerChildren: 0.1
			}
		}
	};

	const itemVariants = {
		hidden: { opacity: 0, y: 20 },
		show: { opacity: 1, y: 0 }
	};

	return (
		<section id="inicio" className="relative w-full min-h-screen flex flex-col lg:grid lg:grid-cols-2 bg-background">

			{/* Mobile Header (Visual) */}
			<div className="lg:hidden relative h-[35vh] w-full overflow-hidden bg-primary">
				<img
					src={selectedDestinoImage}
					alt="Destino"
					className="w-full h-full object-cover opacity-60"
				/>
				<div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-black/30" />
				<div className="absolute bottom-16 left-4 right-4 z-10">
					<motion.div
						key={richInfo.title}
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
					>
						<h1 className="text-2xl font-bold text-foreground leading-tight drop-shadow-md">
							{richInfo.isRich ? richInfo.titulo : richInfo.title}
						</h1>
						<p className="text-sm text-muted-foreground font-medium drop-shadow-sm mb-2">
							{richInfo.isRich ? richInfo.bajada : richInfo.subtitle}
						</p>

						{/* Mobile Summary Pill */}
						{richInfo.isRich && (
							<div className="flex flex-wrap gap-2 mt-2">
								<Badge variant="secondary" className="bg-background/80 backdrop-blur-sm text-xs font-semibold px-2 py-0.5 h-6 flex items-center gap-1 border-primary/20">
									<Plane className="w-3 h-3" /> {richInfo.distancia}
								</Badge>
								{richInfo.tiempo && (
									<Badge variant="secondary" className="bg-background/80 backdrop-blur-sm text-xs font-semibold px-2 py-0.5 h-6 flex items-center gap-1 border-primary/20">
										<Clock className="w-3 h-3" /> {richInfo.tiempo}
									</Badge>
								)}
							</div>
						)}
					</motion.div>
				</div>
			</div>

			{/* Left Panel: Interaction (Form) */}
			<div className="relative flex flex-col justify-start lg:justify-center px-6 py-8 lg:p-16 xl:p-24 overflow-y-auto bg-card z-10 -mt-6 rounded-t-[2rem] lg:mt-0 lg:rounded-none shadow-[0_-10px_40px_rgba(0,0,0,0.1)] lg:shadow-none">

				<AnimatePresence mode="wait">
					{currentStep === 0 && (
						<motion.div
							key="step0"
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: -20 }}
							transition={{ duration: 0.3 }}
							className="space-y-6 w-full max-w-lg mx-auto"
						>
							<div className="mb-6 hidden lg:block">
								<h2 className="text-4xl font-bold tracking-tight text-foreground mb-2">
									{richInfo.isRich ? richInfo.titulo : richInfo.title}
								</h2>
								<p className="text-muted-foreground text-lg">
									{richInfo.isRich ? richInfo.bajada : richInfo.subtitle}
								</p>
							</div>

							<div className="space-y-4">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="origen" className="text-sm font-semibold text-foreground">Origen</Label>
										<div className="relative">
											<MapPin className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
											<select
												id="origen"
												name="origen"
												value={formData.origen}
												onChange={handleInputChange}
												className="w-full h-11 pl-10 pr-4 bg-muted/50 border border-input rounded-lg text-sm focus:ring-2 focus:ring-ring focus:border-transparent appearance-none"
											>
												{origenes.map((o) => (
													<option key={o} value={o}>{o}</option>
												))}
											</select>
										</div>
									</div>
									<div className="space-y-2">
										<Label htmlFor="destino" className="text-sm font-semibold text-foreground">Destino</Label>
										<div className="relative">
											<MapPin className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
											<select
												id="destino"
												name="destino"
												value={formData.destino}
												onChange={handleInputChange}
												className="w-full h-11 pl-10 pr-4 bg-muted/50 border border-input rounded-lg text-sm focus:ring-2 focus:ring-ring focus:border-transparent appearance-none"
											>
												<option value="">Seleccionar...</option>
												{destinos.map((d) => (
													<option key={d} value={d}>{d}</option>
												))}
											</select>
										</div>
									</div>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="fecha" className="text-sm font-semibold text-foreground">Fecha</Label>
										<div className="relative">
											<Calendar className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
											<input
												id="fecha"
												type="date"
												name="fecha"
												value={formData.fecha}
												onChange={handleInputChange}
												min={minDateTime}
												className="w-full h-11 pl-10 pr-4 bg-muted/50 border border-input rounded-lg text-sm focus:ring-2 focus:ring-ring focus:border-transparent"
											/>
										</div>
									</div>
									<div className="space-y-2">
										<Label htmlFor="hora" className="text-sm font-semibold text-foreground">Hora</Label>
										<div className="relative">
											<Clock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
											<select
												id="hora"
												name="hora"
												value={formData.hora}
												onChange={(e) => handleInputChange({ target: { name: "hora", value: e.target.value } })}
												className="w-full h-11 pl-10 pr-4 bg-muted/50 border border-input rounded-lg text-sm focus:ring-2 focus:ring-ring focus:border-transparent appearance-none"
											>
												<option value="" disabled>Seleccionar...</option>
												{timeOptions.map((t) => (
													<option key={t.value} value={t.value}>{t.label}</option>
												))}
											</select>
										</div>
									</div>
								</div>

								<div className="space-y-2">
									<Label htmlFor="pasajeros" className="text-sm font-semibold text-foreground">Pasajeros</Label>
									<div className="relative">
										<Users className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
										<select
											id="pasajeros"
											name="pasajeros"
											value={formData.pasajeros}
											onChange={handleInputChange}
											className="w-full h-11 pl-10 pr-4 bg-muted/50 border border-input rounded-lg text-sm focus:ring-2 focus:ring-ring focus:border-transparent appearance-none"
										>
											{[...Array(maxPasajeros)].map((_, i) => (
												<option key={i + 1} value={i + 1}>
													{i + 1} {i === 0 ? "persona" : "personas"}
												</option>
											))}
										</select>
									</div>
								</div>

								{/* Alerta de oportunidades de retorno universal (sin email) */}
								{oportunidadesRetornoUniversal && oportunidadesRetornoUniversal.opciones?.length > 0 && (
									<AlertaDescuentoRetorno
										oportunidadesRetorno={oportunidadesRetornoUniversal}
										onSeleccionarHorario={(horaSeleccionada) => {
											handleInputChange({ target: { name: "hora", value: horaSeleccionada } });
										}}
									/>
								)}

								{/* Alerta de descuento escalonado por retorno */}
								{descuentoEscalonadoInfo && reservaActiva && (
									<AlertaDescuentoRetorno
										descuentoInfo={descuentoEscalonadoInfo}
										horaTerminoServicio={horaTerminoServicioActivo}
										precioOriginal={cotizacion.precio}
										mostrarOpciones={true}
										onSeleccionarHorario={(horaSeleccionada) => {
											// Formatear la hora seleccionada a HH:MM
											const horaStr = horaSeleccionada.toLocaleTimeString("es-CL", {
												hour: "2-digit",
												minute: "2-digit",
												hour12: false
											});
											handleInputChange({ target: { name: "hora", value: horaStr } });
										}}
									/>
								)}

								{/* Mensaje informativo cuando hay reserva activa y es viaje de retorno sin descuento aún calculado */}
								{(() => {
									// Extraer la lógica de detección de viaje de retorno para mejor legibilidad
									const esViajeRetornoSinDescuento = reservaActiva && 
										!descuentoEscalonadoInfo && 
										formData.origen === reservaActiva.destino && 
										formData.destino === reservaActiva.origen && 
										formData.fecha === reservaActiva.fecha;
									
									if (!esViajeRetornoSinDescuento) return null;
									
									// Formatear hora de término del servicio
									const horaTerminoFormateada = horaTerminoServicioActivo?.toLocaleTimeString("es-CL", { 
										hour: "2-digit", 
										minute: "2-digit" 
									});
									
									return (
										<div className="rounded-xl p-4 bg-blue-500/10 border border-blue-400/30">
											<div className="flex items-start gap-3">
												<Sparkles className="h-5 w-5 text-blue-500 mt-0.5" />
												<div>
													<h4 className="font-semibold text-blue-700 text-sm">
														¡Viaje de retorno detectado!
													</h4>
													<p className="text-xs text-blue-600 mt-1">
														Selecciona una hora cercana al término de tu viaje de ida 
														(aproximadamente {horaTerminoFormateada}) 
														para obtener descuentos de hasta 50%.
													</p>
													{horaTerminoServicioActivo && (
														<div className="mt-2 flex flex-wrap gap-2">
															{generarOpcionesDescuento(horaTerminoServicioActivo).map((opcion, index) => (
																<Badge
																	key={index}
																	variant="secondary"
																	className="cursor-pointer hover:bg-blue-200 transition-colors text-xs"
																	onClick={() => {
																		handleInputChange({ target: { name: "hora", value: opcion.horaFormateada } });
																	}}
																>
																	{opcion.horaFormateada} → {opcion.descuento}% dcto
																</Badge>
															))}
														</div>
													)}
												</div>
											</div>
										</div>
									);
								})()}

								{/* Checkboxes Row with improved mobile wrapping */}
								<div className="flex flex-col sm:flex-row gap-3 pt-2">
									<div
										className={`flex items-center space-x-3 p-3 rounded-lg border transition-all cursor-pointer ${formData.idaVuelta ? 'bg-muted border-primary' : 'border-border hover:bg-muted/50'}`}
										onClick={() => {
											const newValue = !formData.idaVuelta;
											handleInputChange({ target: { name: "idaVuelta", value: newValue } });
											if (!newValue) handleInputChange({ target: { name: "fechaRegreso", value: "" } });
											else if (formData.fecha) handleInputChange({ target: { name: "fechaRegreso", value: formData.fecha } });
										}}
									>
										<Checkbox
											id="idaVuelta"
											checked={formData.idaVuelta}
											className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
										/>
										<Label htmlFor="idaVuelta" className="cursor-pointer font-medium text-foreground">Necesito regreso</Label>
									</div>

									<div
										className={`flex items-center space-x-3 p-3 rounded-lg border transition-all cursor-pointer ${formData.sillaInfantil ? 'bg-muted border-primary' : 'border-border hover:bg-muted/50'}`}
										onClick={() => handleInputChange({ target: { name: "sillaInfantil", value: !formData.sillaInfantil } })}
									>
										<Checkbox
											id="sillaInfantil"
											checked={formData.sillaInfantil}
											className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
										/>
										<Label htmlFor="sillaInfantil" className="cursor-pointer font-medium text-foreground">Silla de niño</Label>
									</div>
								</div>

								{formData.idaVuelta && (
									<motion.div
										initial={{ opacity: 0, height: 0 }}
										animate={{ opacity: 1, height: "auto" }}
										className="space-y-2 pt-2"
									>
										<Label className="text-sm font-semibold text-foreground">Fecha de Regreso</Label>
										<div className="relative">
											<Calendar className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
											<input
												type="date"
												name="fechaRegreso"
												value={formData.fechaRegreso}
												onChange={handleInputChange}
												min={formData.fecha || minDateTime}
												className="w-full h-11 pl-10 pr-4 bg-muted/50 border border-input rounded-lg text-sm focus:ring-2 focus:ring-ring focus:border-transparent"
											/>
										</div>
									</motion.div>
								)}
							</div>

							{stepError && (
								<div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center font-medium">
									{stepError}
								</div>
							)}

							<Button
								onClick={handleStepOneNext}
								className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-lg font-bold shadow-lg transition-transform active:scale-95"
								disabled={isSubmitting || verificandoDisponibilidad}
							>
								{verificandoDisponibilidad ? (
									<LoaderCircle className="h-6 w-6 animate-spin" />
								) : (
									<span className="flex items-center gap-2">
										Reservar Ahora <ArrowRight className="h-5 w-5" />
									</span>
								)}
							</Button>
						</motion.div>
					)}

					{currentStep === 1 && (
						<motion.div
							key="step1"
							initial={{ opacity: 0, x: 20 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: 20 }}
							transition={{ duration: 0.3 }}
							className="space-y-6 w-full max-w-lg mx-auto"
						>
							<div className="flex items-center gap-4 mb-2">
								<Button variant="ghost" size="icon" onClick={handleStepBack} className="rounded-full hover:bg-muted">
									<ArrowLeft className="h-5 w-5" />
								</Button>
								<div>
									<h2 className="text-2xl font-bold text-foreground">Detalles y Pago</h2>
									<p className="text-sm text-muted-foreground">Completa tus datos para finalizar.</p>
								</div>
							</div>

							<div className="bg-muted/30 p-4 rounded-xl border border-border space-y-3">
								<div className="flex justify-between items-start">
									<div>
										<p className="text-xs font-bold text-muted-foreground uppercase">Ruta</p>
										<p className="font-semibold text-foreground text-sm md:text-base">
											{formData.origen === "Otro" ? formData.otroOrigen : formData.origen}
											<span className="mx-2 text-muted-foreground">→</span>
											{formData.destino === "Otro" ? formData.otroDestino : formData.destino}
										</p>
									</div>
								</div>
								<div className="flex justify-between">
									<div>
										<p className="text-xs font-bold text-muted-foreground uppercase">Fecha</p>
										<p className="font-medium text-sm">{fechaLegible} - {formData.hora}</p>
									</div>
									<div className="text-right flex flex-col items-end">
										<p className="text-xs font-bold text-muted-foreground uppercase">Total</p>
										<p className="font-bold text-lg text-foreground">{formatCurrency(pricing.totalConDescuento)}</p>
										{urgencyMessage && (
											<Badge variant="outline" className="mt-1 border-muted-foreground/30 text-muted-foreground text-[10px] px-2 py-0 h-5 font-medium flex items-center gap-1 animate-in fade-in zoom-in duration-300">
												{urgencyMessage.icon}
												{urgencyMessage.text}
											</Badge>
										)}
									</div>
								</div>
								{descuentoRetorno && (
									<div className="flex items-center gap-2 text-xs font-medium text-accent bg-accent/10 p-2 rounded-lg">
										<CheckCircle2 className="h-4 w-4" />
										¡Descuento por retorno aplicado!
									</div>
								)}
							</div>

							<div className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="nombre" className="font-semibold text-foreground">Nombre Completo</Label>
									<Input
										id="nombre"
										name="nombre"
										value={formData.nombre}
										onChange={handleInputChange}
										placeholder="Tu nombre completo"
										className="bg-muted/50 border-input h-11"
									/>
								</div>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="email" className="font-semibold text-foreground">Email</Label>
										<div className="relative">
											<Input
												id="email"
												type="email"
												name="email"
												value={formData.email}
												onChange={handleInputChange}
												onBlur={(e) => verificarReservaActiva(e.target.value)}
												placeholder="tu@email.com"
												className="bg-muted/50 border-input h-11"
											/>
											{verificandoReserva && <span className="absolute right-3 top-3 text-xs text-muted-foreground">...</span>}
										</div>
									</div>
									<div className="space-y-2">
										<Label htmlFor="telefono" className="font-semibold text-foreground">Teléfono</Label>
										<Input
											id="telefono"
											name="telefono"
											value={formData.telefono}
											onChange={handleInputChange}
											placeholder="+56 9 1234 5678"
											className={`bg-muted/50 border-input h-11 ${phoneError ? "border-destructive" : ""}`}
										/>
										{phoneError && <p className="text-xs text-destructive">{phoneError}</p>}
									</div>
								</div>
							</div>

							<div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg border border-border">
								<Checkbox
									id="terms"
									checked={paymentConsent}
									onCheckedChange={(c) => setPaymentConsent(!!c)}
									className="mt-1 data-[state=checked]:bg-primary"
								/>
								<Label htmlFor="terms" className="text-sm text-muted-foreground leading-snug cursor-pointer">
									Acepto los <span className="underline font-medium text-foreground">términos y condiciones</span> y la política de privacidad.
								</Label>
							</div>

							{stepError && (
								<div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
									{stepError}
								</div>
							)}

							<div className="pt-2">
								{mostrarPrecio && !requiereCotizacionManual ? (
									<Button
										onClick={() => handleProcesarPago("flow", "total")}
										disabled={isSubmitting || !!loadingGateway}
										className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-lg font-bold shadow-lg flex items-center justify-center gap-2"
									>
										{loadingGateway ? <LoaderCircle className="animate-spin" /> : (
											<>
												<CreditCard className="h-5 w-5" />
												Pagar {formatCurrency(pricing.totalConDescuento)}
											</>
										)}
									</Button>
								) : (
									<Button
										onClick={handleGuardarReserva}
										disabled={isSubmitting}
										className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-lg font-bold shadow-lg"
									>
										{isSubmitting ? <LoaderCircle className="animate-spin" /> : "Solicitar Reserva"}
									</Button>
								)}
								<p className="text-center text-xs text-muted-foreground mt-4 flex items-center justify-center gap-1">
									<ShieldCheck className="h-3 w-3" /> Pago 100% seguro vía Flow
								</p>
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</div>

			{/* Right Panel: Dynamic Visuals (Desktop) */}
			<div className="relative hidden lg:block h-full overflow-hidden bg-primary sticky top-0">
				<AnimatePresence mode="wait">
					<motion.img
						key={selectedDestinoImage}
						src={selectedDestinoImage}
						alt="Destino"
						initial={{ opacity: 0, scale: 1.1 }}
						animate={{ opacity: 0.6, scale: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 1 }}
						className="absolute inset-0 w-full h-full object-cover"
					/>
				</AnimatePresence>

				<div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/50 to-primary/20" />

				<div className="absolute bottom-0 left-0 w-full p-16 z-10 flex flex-col justify-end h-full">
					<motion.div
						key={richInfo.title}
						variants={containerVariants}
						initial="hidden"
						animate="show"
						className="space-y-8 max-w-xl"
					>
						{/* Título y Bajada */}
						<motion.div variants={itemVariants}>
							<h1 className="text-6xl font-bold text-primary-foreground mb-4 tracking-tight leading-none drop-shadow-lg">
								{richInfo.isRich ? richInfo.titulo : richInfo.title}
							</h1>
							<p className="text-xl text-primary-foreground/90 font-medium border-l-4 border-white/30 pl-4">
								{richInfo.isRich ? richInfo.bajada : richInfo.subtitle}
							</p>
						</motion.div>

						{/* Información de Viaje (Rich Data) */}
						{richInfo.isRich && !richInfo.isSummary && (
							<>
								<motion.div variants={itemVariants} className="flex gap-4">
									<div className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 flex-1">
										<div className="p-2 bg-white/20 rounded-full">
											<Plane className="w-5 h-5 text-white" />
										</div>
										<div>
											<p className="text-xs text-white/70 uppercase font-semibold">Distancia</p>
											<p className="text-white font-bold">{richInfo.distancia}</p>
										</div>
									</div>
									<div className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 flex-1">
										<div className="p-2 bg-white/20 rounded-full">
											<Clock className="w-5 h-5 text-white" />
										</div>
										<div>
											<p className="text-xs text-white/70 uppercase font-semibold">Tiempo Estimado</p>
											<p className="text-white font-bold">{richInfo.tiempo}</p>
										</div>
									</div>
								</motion.div>

								<motion.div variants={itemVariants} className="space-y-4">
									<div className="flex items-center gap-2">
										<Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
										<h3 className="text-lg font-bold text-white">Imperdibles</h3>
									</div>
									<ul className="grid gap-3">
										{richInfo.puntosInteres?.map((punto, i) => (
											<li key={i} className="flex items-center gap-3 text-white/90 font-medium">
												<CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
												{punto}
											</li>
										))}
									</ul>
								</motion.div>

								{richInfo.datoCurioso && (
									<motion.div variants={itemVariants} className="mt-6 bg-blue-900/40 backdrop-blur-md p-5 rounded-xl border border-blue-400/30">
										<div className="flex gap-3">
											<Lightbulb className="w-6 h-6 text-yellow-300 flex-shrink-0" />
											<div>
												<p className="text-sm font-bold text-yellow-300 mb-1">¿Sabías que?</p>
												<p className="text-sm text-white/90 italic leading-relaxed">
													"{richInfo.datoCurioso}"
												</p>
											</div>
										</div>
									</motion.div>
								)}
							</>
						)}
					</motion.div>
				</div>
			</div>
		</section>
	);
}

export default HeroExpress;
