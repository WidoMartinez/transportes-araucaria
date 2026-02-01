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
import { LoaderCircle, ArrowRight, ArrowLeft, ArrowRightLeft, MapPin, Calendar, Clock, Users, CheckCircle2, ShieldCheck, CreditCard, Info, Mountain, Lightbulb, Plane, Star, Sparkles } from "lucide-react";
import WhatsAppButton from "./WhatsAppButton";
import { useIsMobile } from "../hooks/use-mobile";
import heroVan from "../assets/hero-van.png";
import { getBackendUrl } from "../lib/backend";
import { motion, AnimatePresence } from "framer-motion";
import { destinosInfo } from "../data/destinos";
import AlertaDescuentoRetorno from "./AlertaDescuentoRetorno";
import { calcularDescuentoEscalonado, generarOpcionesDescuento } from "../utils/descuentoRetorno";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "./ui/dialog";
import { ScrollArea } from "./ui/scroll-area";
import { TERMINOS_CONDICIONES, POLITICA_PRIVACIDAD } from "../data/legal";

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
	oportunidadesRetornoUniversal, // Recibido desde App.jsx
	tipoVehiculoSeleccionado,
	onSeleccionarVehiculo,
}) {
	const [currentStep, setCurrentStep] = useState(0);
	const [stepError, setStepError] = useState("");
	const [errorRequiereVan, setErrorRequiereVan] = useState(false); // Error específico para grupos de 5-7 sin Van
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
	// Estado para manejar error de carga de imagen
	const [imageLoadError, setImageLoadError] = useState(false);
	// Hook para detectar si es dispositivo móvil
	const isMobile = useIsMobile();

	// Resetear error de imagen cuando cambia el destino/imagen seleccionada


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

	// Determinar el "target" para mostrar info (Destino principal o Origen si es traslado hacia aeropuerto)
	const targetName = useMemo(() => {
		return formData.destino !== "Aeropuerto La Araucanía" && formData.destino !== "Otro"
			? formData.destino
			: (formData.origen !== "Aeropuerto La Araucanía" && formData.origen !== "Otro" ? formData.origen : null);
	}, [formData.destino, formData.origen]);

	const timeOptions = useMemo(() => {
		let options = generateTimeOptions();

		// Incorporar opciones de oportunidades de retorno si existen
		if (oportunidadesRetornoUniversal && oportunidadesRetornoUniversal.opciones) {
			oportunidadesRetornoUniversal.opciones.forEach(oportunidad => {
				if (oportunidad.opcionesRetorno) {
					oportunidad.opcionesRetorno.forEach(opcion => {
						if (!options.some(opt => opt.value === opcion.hora)) {
							options.push({ value: opcion.hora, label: opcion.hora });
						}
					});
				}
			});
		}

		// Si la hora seleccionada no está en las opciones (ej: hora de descuento específica), agregarla
		if (formData.hora && !options.some(opt => opt.value === formData.hora)) {
			options.push({ value: formData.hora, label: formData.hora });
		}

		// --- FILTRADO POR ANTICIPACIÓN MÍNIMA ---
		// Si la fecha es HOY, filtrar opciones que no cumplen con la anticipación
		const hoy = new Date();
		const esHoy = formData.fecha === hoy.toISOString().split("T")[0];

		if (esHoy) {
			const destinoObj = Array.isArray(destinosData)
				? destinosData.find(d => d.nombre === targetName)
				: null;
			
			const anticipacion = destinoObj?.minHorasAnticipacion || 5;
			const ahora = new Date();

			options = options.filter(opt => {
				const [h, m] = opt.value.split(":").map(Number);
				const fechaOpt = new Date();
				fechaOpt.setHours(h, m, 0, 0);
				
				const diffHoras = (fechaOpt - ahora) / 3600000;
				return diffHoras >= anticipacion;
			});
		}

		// Ordenar las opciones por hora
		options.sort((a, b) => a.value.localeCompare(b.value));

		return options;
	}, [formData.hora, oportunidadesRetornoUniversal, formData.fecha, targetName, destinosData]);

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

	// Resetear error de imagen cuando cambia el destino/imagen seleccionada
	useEffect(() => {
		setImageLoadError(false);
	}, [selectedDestinoImage]);

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

	// Lógica de retornos universales movida a App.jsx para centralizar precios


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

	const handleSwap = () => {
		if (formData.origen === "Aeropuerto La Araucanía") {
			handleInputChange({ target: { name: "origen", value: formData.destino } });
		} else {
			handleInputChange({ target: { name: "destino", value: formData.origen } });
		}
	};

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
			if (!formData.horaRegreso) return setStepError("Selecciona la hora de regreso.");
			const fechaRegreso = new Date(`${formData.fechaRegreso}T00:00:00`);
			if (fechaRegreso < fechaSeleccionada) return setStepError("La fecha de regreso no puede ser anterior a la ida.");
		}

		// Verificar si la fecha/hora está bloqueada
		try {
			const respBloqueo = await fetch(
				`${getBackendUrl()}/api/bloqueos/verificar`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						fecha: formData.fecha,
						hora: formData.hora,
					}),
				}
			);
			
			if (respBloqueo.ok) {
				const dataBloqueo = await respBloqueo.json();
				if (dataBloqueo.bloqueado) {
					setStepError(`Agenda completada. ${dataBloqueo.motivo || "Esta fecha/hora no está disponible para reservas."}`);
					return;
				}
			}
		} catch (error) {
			console.error("Error verificando bloqueo:", error);
			// Continuar si hay error en la verificación de bloqueo
		}

		const resultado = await verificarDisponibilidadYRetorno();
		if (!resultado.disponible) {
			// Detectar si es un error por falta de vehículo Van para grupos grandes
			const numPasajeros = Number(formData.pasajeros) || 1;
			if (numPasajeros >= 5 && numPasajeros <= 7) {
				setErrorRequiereVan(true);
				setStepError("Consulta disponibilidad por WhatsApp");
			} else {
				setErrorRequiereVan(false);
				setStepError(resultado.mensaje || "No hay vehículos disponibles.");
			}
			return;
		}

		// VALIDACIÓN ADICIONAL DE ANTICIPACIÓN MÍNIMA
		if (formData.destino !== "Otro") {
			const destinoObj = Array.isArray(destinosData)
				? destinosData.find(d => d.nombre === targetName)
				: null;
			
			if (destinoObj) {
				const ahora = new Date();
				const fechaReserva = new Date(`${formData.fecha}T${formData.hora}`);
				const diffHoras = (fechaReserva - ahora) / 3600000;
				const anticipacion = destinoObj.minHorasAnticipacion || 5;

				if (diffHoras < anticipacion) {
					setStepError(`Para ${destinoObj.nombre}, reserva con al menos ${anticipacion} horas de anticipación.`);
					return;
				}
			}
		}

		setDescuentoRetorno(resultado.descuento || null);
		setStepError("");
		setErrorRequiereVan(false);
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
		setErrorRequiereVan(false);
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
		<section id="inicio" className="relative w-full min-h-screen flex flex-col lg:grid lg:grid-cols-2 bg-background pt-20">

			{/* Mobile Header (Visual) - Optimizado para rendimiento móvil */}
			<div className="lg:hidden relative h-[35vh] min-h-[200px] w-full overflow-hidden bg-primary">
				<img
					src={imageLoadError ? heroVan : selectedDestinoImage}
                    onError={() => setImageLoadError(true)}
					alt={`Imagen del destino ${formData.destino || 'seleccionado'}`}
					loading="eager"
					decoding="async"
					className="w-full h-full object-cover opacity-70 will-change-transform"
				/>
				<div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/40 to-primary/20" />
				<div className="absolute bottom-14 left-4 right-4 z-10 safe-area-inset-bottom flex flex-col items-center text-center">
					<motion.div
						key={richInfo.title}
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.3 }}
						className="flex flex-col items-center"
					>
						<h1 className="text-4xl lg:text-2xl font-bold text-white leading-tight drop-shadow-lg mb-1">
							{richInfo.isRich ? richInfo.titulo : richInfo.title}
						</h1>
						<p className="text-base text-white/95 font-medium drop-shadow-md mb-2 line-clamp-2 max-w-[85%]">
							{richInfo.isRich ? richInfo.bajada : richInfo.subtitle}
						</p>

						{/* Mobile Summary Pill - Tamaño táctil mejorado */}
						{richInfo.isRich && (
							<div className="flex flex-wrap justify-center gap-2 mt-2">
								<Badge variant="secondary" className="bg-white/90 backdrop-blur-sm text-xs font-semibold px-2.5 py-1 h-7 flex items-center gap-1.5 text-primary border-0 shadow-sm">
									<Plane className="w-3 h-3" /> {richInfo.distancia}
								</Badge>
								{richInfo.tiempo && (
									<Badge variant="secondary" className="bg-white/90 backdrop-blur-sm text-xs font-semibold px-2.5 py-1 h-7 flex items-center gap-1.5 text-primary border-0 shadow-sm">
										<Clock className="w-3 h-3" /> {richInfo.tiempo}
									</Badge>
								)}
							</div>
						)}
					</motion.div>
				</div>
			</div>

			{/* Left Panel: Interaction (Form) - Padding optimizado para móvil */}
			<div className="relative flex flex-col justify-start lg:justify-center px-4 sm:px-6 py-6 sm:py-8 lg:p-16 xl:p-24 overflow-y-auto bg-card z-10 -mt-6 mx-4 sm:mx-6 lg:mx-0 rounded-t-3xl rounded-b-3xl lg:mt-0 lg:rounded-none shadow-[0_-10px_40px_rgba(0,0,0,0.1)] lg:shadow-none mb-6 lg:mb-0">

				<AnimatePresence mode="wait">
					{currentStep === 0 && (
						<motion.div
							key="step0"
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: -20 }}
							transition={{ duration: 0.3 }}
							className="space-y-5 md:space-y-6 w-full max-w-lg mx-auto"
						>
							<div className="mb-6 hidden lg:block">
								<h2 className="text-4xl font-bold tracking-tight text-foreground mb-2">
									{richInfo.isRich ? richInfo.titulo : richInfo.title}
								</h2>
								<p className="text-muted-foreground text-lg">
									{richInfo.isRich ? richInfo.bajada : richInfo.subtitle}
								</p>
							</div>

							<div className="space-y-5 md:space-y-4">
								{/* Selectores de origen y destino - Con botón swap en desktop */}
								<div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 md:gap-3 md:items-end">
									<div className="space-y-2">
										<Label htmlFor="origen" className="text-base md:text-sm font-semibold text-foreground">Origen</Label>
										<div className="relative">
											<MapPin className="absolute left-3 top-3.5 md:top-3 h-5 w-5 text-muted-foreground pointer-events-none z-10" />
											<select
												id="origen"
												name="origen"
												value={formData.origen}
												onChange={handleInputChange}
												aria-label="Seleccionar origen del viaje"
												className="w-full h-12 md:h-11 pl-10 pr-8 bg-gray-50 md:bg-gray-50 border border-gray-200 rounded-xl md:rounded-lg text-base md:text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white appearance-none cursor-pointer touch-manipulation"
											>
												{origenes.map((o) => (
													<option key={o} value={o}>{o}</option>
												))}
											</select>
											{/* Flecha personalizada para mejor visibilidad móvil */}
											<div className="absolute right-3 top-3.5 md:top-3 h-5 w-5 pointer-events-none">
												<svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
												</svg>
											</div>
										</div>
									</div>

									{/* Swap Button - Hidden on mobile, visible on desktop */}
									<div className="hidden md:flex items-end pb-1">
										<Button
											type="button"
											variant="ghost"
											size="icon"
											onClick={handleSwap}
											className="rounded-full bg-white border border-gray-200 shadow-sm hover:bg-gray-50 h-9 w-9 text-muted-foreground hover:text-primary transition-all"
											title="Intercambiar Origen y Destino"
										>
											<ArrowRightLeft className="h-4 w-4" />
										</Button>
									</div>

									<div className="space-y-2">
										<Label htmlFor="destino" className="text-base md:text-sm font-semibold text-foreground">Destino</Label>
										<div className="relative">
											<MapPin className="absolute left-3 top-3.5 md:top-3 h-5 w-5 text-muted-foreground pointer-events-none z-10" />
											<select
												id="destino"
												name="destino"
												value={formData.destino}
												onChange={handleInputChange}
												aria-label="Seleccionar destino del viaje"
												className="w-full h-12 md:h-11 pl-10 pr-8 bg-gray-50 md:bg-gray-50 border border-gray-200 rounded-xl md:rounded-lg text-base md:text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white appearance-none cursor-pointer touch-manipulation"
											>
												<option value="">Seleccionar...</option>
												{destinos.map((d) => (
													<option key={d} value={d}>{d}</option>
												))}
											</select>
											<div className="absolute right-3 top-3.5 md:top-3 h-5 w-5 pointer-events-none">
												<svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
												</svg>
											</div>
										</div>
									</div>
								</div>

								{/* Fecha y Hora - Optimizados para móvil */}
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="fecha" className="text-base md:text-sm font-semibold text-foreground">Fecha</Label>
										<div className="relative">
											<Calendar className="absolute left-3 top-3.5 md:top-3 h-5 w-5 text-muted-foreground pointer-events-none z-10" />
											<input
												id="fecha"
												type="date"
												name="fecha"
												value={formData.fecha}
												onChange={handleInputChange}
												min={minDateTime}
												aria-label="Seleccionar fecha del viaje"
												className="w-full h-12 md:h-11 pl-10 pr-4 bg-gray-50 md:bg-gray-50 border border-gray-200 rounded-xl md:rounded-lg text-base md:text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white touch-manipulation"
											/>
										</div>
									</div>
									<div className="space-y-2">
										<Label htmlFor="hora" className="text-base md:text-sm font-semibold text-foreground">Hora</Label>
										<div className="relative">
											<Clock className="absolute left-3 top-3.5 md:top-3 h-5 w-5 text-muted-foreground pointer-events-none z-10" />
											<select
												id="hora"
												name="hora"
												value={formData.hora}
												onChange={(e) => {
													handleInputChange({ target: { name: "hora", value: e.target.value } });
												}}
												aria-label="Seleccionar hora del viaje"
												className="w-full h-12 md:h-11 pl-10 pr-8 bg-gray-50 md:bg-gray-50 border border-gray-200 rounded-xl md:rounded-lg text-base md:text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white appearance-none cursor-pointer touch-manipulation"
											>
												<option value="" disabled>Seleccionar...</option>
												{timeOptions.map((t) => (
													<option key={t.value} value={t.value}>{t.label}</option>
												))}
											</select>
											<div className="absolute right-3 top-3.5 md:top-3 h-5 w-5 pointer-events-none">
												<svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
												</svg>
											</div>
										</div>
									</div>
								</div>

								{/* Selector de pasajeros - Optimizado para móvil */}
								<div className="space-y-2">
									<Label htmlFor="pasajeros" className="text-base md:text-sm font-semibold text-foreground">Pasajeros</Label>
									<div className="relative">
										<Users className="absolute left-3 top-3.5 md:top-3 h-5 w-5 text-muted-foreground pointer-events-none z-10" />
										<select
											id="pasajeros"
											name="pasajeros"
											value={formData.pasajeros}
											onChange={handleInputChange}
											aria-label="Seleccionar número de pasajeros"
											className="w-full h-12 md:h-11 pl-10 pr-8 bg-gray-50 md:bg-gray-50 border border-gray-200 rounded-xl md:rounded-lg text-base md:text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white appearance-none cursor-pointer touch-manipulation"
										>
											{[...Array(maxPasajeros)].map((_, i) => (
												<option key={i + 1} value={i + 1}>
													{i + 1} {i === 0 ? "persona" : "personas"}
												</option>
											))}
										</select>
										<div className="absolute right-3 top-3.5 md:top-3 h-5 w-5 pointer-events-none">
											<svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
											</svg>
										</div>
									</div>
								</div>


								{/* Selector de Tipo de Vehículo */}
								{cotizacion?.opciones?.length > 1 && (
									<div className="space-y-3 mb-6">
										<label className="block text-sm font-semibold text-gray-800 mb-3">
											🚗 Selecciona tu vehículo
										</label>
										<div className="space-y-3">
											{cotizacion.opciones.map((opcion) => (
												<div
													key={opcion.codigo}
													onClick={() => onSeleccionarVehiculo(opcion.codigo)}
													className={`relative flex cursor-pointer rounded-xl border-2 p-4 shadow-sm transition-all hover:shadow-md ${
														opcion.codigo === cotizacion.opcionSeleccionada?.codigo
															? 'border-blue-600 bg-blue-50 ring-2 ring-blue-300'
															: 'border-gray-300 bg-white hover:border-gray-400'
													}`}
												>
													<div className="flex flex-1 items-center gap-4">
														<div className="flex-shrink-0">
															<input
																type="radio"
																name="tipo-vehiculo"
																checked={opcion.codigo === cotizacion.opcionSeleccionada?.codigo}
																onChange={() => onSeleccionarVehiculo(opcion.codigo)}
																className="h-5 w-5 text-blue-600 border-gray-300 focus:ring-blue-500"
															/>
														</div>
														<div className="flex-1 min-w-0">
															<p className="text-base font-bold text-gray-900">
																{opcion.tipo}
															</p>
															<p className="text-sm text-gray-600 mt-0.5">
																{opcion.capacidad}
															</p>
															<p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
																<span>✓</span>
																<span>{opcion.descripcion}</span>
															</p>
														</div>
														<div className="flex-shrink-0 text-right">
															<p className="text-xl md:text-2xl font-bold text-gray-900">
																{new Intl.NumberFormat("es-CL", {
																	style: "currency",
																	currency: "CLP",
																}).format(opcion.precio)}
															</p>
														</div>
													</div>
												</div>
											))}
										</div>
										<div className="mt-3 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
											<p className="text-xs text-blue-800 flex items-start gap-2">
												<span className="text-sm">💡</span>
												<span>Puedes elegir una van aunque sean menos de 4 pasajeros si necesitas más espacio para equipaje o mayor comodidad</span>
											</p>
										</div>
									</div>
								)}
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
										<div className="rounded-xl p-4 bg-chocolate-500/10 border border-chocolate-400/30">
											<div className="flex items-start gap-3">
												<Sparkles className="h-5 w-5 text-chocolate-500 mt-0.5" />
												<div>
													<h4 className="font-semibold text-chocolate-700 text-sm">
														¡Viaje de retorno detectado!
													</h4>
													<p className="text-xs text-chocolate-600 mt-1">
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
																	className="cursor-pointer hover:bg-chocolate-200 transition-colors text-xs"
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

								{/* Checkboxes Row - Optimizados para interacción táctil móvil */}
								<div className="flex flex-col sm:flex-row gap-3 pt-3 md:pt-2">
									<div
										className={`flex items-center space-x-3 p-4 md:p-3 rounded-xl md:rounded-lg border-2 transition-all cursor-pointer touch-manipulation min-h-[52px] ${formData.idaVuelta ? 'bg-muted border-primary shadow-sm' : 'border-border hover:bg-muted/50 active:bg-muted/70'}`}
										onClick={(e) => {
											// Evitar doble toggle cuando se hace click en el Label (que dispara click en Checkbox)
											// Si el click viene del label, lo ignoramos y dejamos que el evento del checkbox (sintetizado) lo maneje
											if (e.target.tagName === 'LABEL') return;

											const newValue = !formData.idaVuelta;
											handleInputChange({ target: { name: "idaVuelta", value: newValue } });
											if (!newValue) handleInputChange({ target: { name: "fechaRegreso", value: "" } });
											else if (formData.fecha) handleInputChange({ target: { name: "fechaRegreso", value: formData.fecha } });
										}}
										role="checkbox"
										aria-checked={formData.idaVuelta}
										tabIndex={0}
										onKeyDown={(e) => {
											if (e.key === 'Enter' || e.key === ' ') {
												e.preventDefault();
												const newValue = !formData.idaVuelta;
												handleInputChange({ target: { name: "idaVuelta", value: newValue } });
												if (!newValue) handleInputChange({ target: { name: "fechaRegreso", value: "" } });
												else if (formData.fecha) handleInputChange({ target: { name: "fechaRegreso", value: formData.fecha } });
											}
										}}
									>
										<Checkbox
											id="idaVuelta"
											checked={formData.idaVuelta}
											className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground size-5 md:size-4"
										/>
										<div className="flex flex-col">
											<Label htmlFor="idaVuelta" className="cursor-pointer font-medium text-foreground text-base md:text-sm leading-tight">Necesito regreso</Label>
											{!formData.idaVuelta && tieneCotizacionAutomatica && (
												<span className="text-[11px] md:text-xs text-emerald-600 font-medium animate-in fade-in slide-in-from-left-2 mt-0.5">
													Precio especial si reservas ida y vuelta
												</span>
											)}
										</div>
									</div>

									<div
										className={`flex items-center space-x-3 p-4 md:p-3 rounded-xl md:rounded-lg border-2 transition-all cursor-pointer touch-manipulation min-h-[52px] ${formData.sillaInfantil ? 'bg-muted border-primary shadow-sm' : 'border-border hover:bg-muted/50 active:bg-muted/70'}`}
										onClick={() => handleInputChange({ target: { name: "sillaInfantil", value: !formData.sillaInfantil } })}
										role="checkbox"
										aria-checked={formData.sillaInfantil}
										tabIndex={0}
										onKeyDown={(e) => {
											if (e.key === 'Enter' || e.key === ' ') {
												e.preventDefault();
												handleInputChange({ target: { name: "sillaInfantil", value: !formData.sillaInfantil } });
											}
										}}
									>
										<Checkbox
											id="sillaInfantil"
											checked={formData.sillaInfantil}
											className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground size-5 md:size-4"
										/>
										<Label htmlFor="sillaInfantil" className="cursor-pointer font-medium text-foreground text-base md:text-sm">Silla de niño</Label>
									</div>
								</div>

								{formData.idaVuelta && (
									<motion.div
										initial={{ opacity: 0, height: 0 }}
										animate={{ opacity: 1, height: "auto" }}
										className="space-y-4 pt-2"
									>
										<div className="space-y-2">
											<Label className="text-base md:text-sm font-semibold text-foreground">Fecha de Regreso</Label>
											<div className="relative">
												<Calendar className="absolute left-3 top-3.5 md:top-3 h-5 w-5 text-muted-foreground pointer-events-none z-10" />
												<input
													type="date"
													name="fechaRegreso"
													value={formData.fechaRegreso}
													onChange={handleInputChange}
													min={formData.fecha || minDateTime}
													aria-label="Seleccionar fecha de regreso"
													className="w-full h-12 md:h-11 pl-10 pr-4 bg-muted/50 border border-input rounded-xl md:rounded-lg text-base md:text-sm focus:ring-2 focus:ring-ring focus:border-transparent touch-manipulation"
												/>
											</div>
										</div>
										<div className="space-y-2">
											<Label htmlFor="horaRegreso" className="text-base md:text-sm font-semibold text-foreground">Hora de Regreso</Label>
											<div className="relative">
												<Clock className="absolute left-3 top-3.5 md:top-3 h-5 w-5 text-muted-foreground pointer-events-none z-10" />
												<select
													id="horaRegreso"
													name="horaRegreso"
													value={formData.horaRegreso || ""}
													onChange={handleInputChange}
													aria-label="Seleccionar hora de regreso"
													className="w-full h-12 md:h-11 pl-10 pr-8 bg-muted/50 border border-input rounded-xl md:rounded-lg text-base md:text-sm focus:ring-2 focus:ring-ring focus:border-transparent appearance-none cursor-pointer touch-manipulation"
												>
													<option value="" disabled>Seleccionar...</option>
													{timeOptions.map((t) => (
														<option key={t.value} value={t.value}>{t.label}</option>
													))}
												</select>
												<div className="absolute right-3 top-3.5 md:top-3 h-5 w-5 pointer-events-none">
													<svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
													</svg>
												</div>
											</div>
										</div>
									</motion.div>
								)}
							</div>							{stepError && (
								<div className="mt-4 p-4 md:p-3 bg-destructive/10 text-destructive rounded-xl md:rounded-lg text-sm animate-in fade-in space-y-3">
									<p>{stepError}</p>
									{errorRequiereVan && (
										<div className="space-y-2">
											<p className="text-xs text-center">
												Por favor comunícate con nosotros para coordinar tu viaje.
											</p>
											<WhatsAppButton
												message={`Hola, necesito reservar un traslado para ${formData.pasajeros} pasajeros desde ${formData.origen} a ${formData.destino} el ${formData.fecha} aproximadamente a las ${formData.hora}. ¿Tienen disponibilidad?`}
												variant="default"
												size="sm"
												className="w-full bg-green-600 hover:bg-green-700 text-white"
											>
												Consultar Disponibilidad por WhatsApp
											</WhatsAppButton>
										</div>
									)}
								</div>
							)}

							{/* Botón principal de reserva - Optimizado para móvil con área táctil grande */}
							<Button
								onClick={handleStepOneNext}
								className="w-full h-14 md:h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-lg font-bold shadow-lg transition-transform active:scale-[0.98] touch-manipulation min-h-[56px]"
								disabled={isSubmitting || verificandoDisponibilidad}
								aria-label="Reservar ahora"
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
							className="space-y-5 md:space-y-6 w-full max-w-lg mx-auto"
						>
							{/* Header del paso 2 con botón volver optimizado para táctil */}
							<div className="flex items-center gap-3 md:gap-4 mb-2">
								<Button 
									variant="ghost" 
									size="icon" 
									onClick={handleStepBack} 
									className="rounded-full hover:bg-muted active:bg-muted/80 min-w-[44px] min-h-[44px] touch-manipulation"
									aria-label="Volver al paso anterior"
								>
									<ArrowLeft className="h-5 w-5" />
								</Button>
								<div>
									<h2 className="text-xl md:text-2xl font-bold text-foreground">Detalles y Pago</h2>
									<p className="text-sm text-muted-foreground">Completa tus datos para finalizar.</p>
								</div>
							</div>

							{/* Resumen del viaje - Optimizado para lectura móvil */}
							<div className="bg-muted/30 p-4 rounded-xl border border-border space-y-3">
								<div className="flex justify-between items-start">
									<div className="flex-1 min-w-0">
										<p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Ruta</p>
										<p className="font-semibold text-foreground text-sm md:text-base break-words">
											{formData.origen === "Otro" ? formData.otroOrigen : formData.origen}
											<span className="mx-1 md:mx-2 text-muted-foreground">→</span>
											{formData.destino === "Otro" ? formData.otroDestino : formData.destino}
										</p>
									</div>
								</div>
								<div className="flex justify-between">
									<div>
										<p className="text-xs font-bold text-muted-foreground uppercase">Fecha</p>
										<p className="font-medium text-sm">{fechaLegible} - {formData.hora}</p>
										{formData.idaVuelta && formData.fechaRegreso && (
											<p className="font-medium text-sm mt-1">
												<span className="text-muted-foreground text-xs block">Retorno:</span>
												{new Date(`${formData.fechaRegreso}T00:00:00`).toLocaleDateString("es-CL", { dateStyle: "long" })}
											</p>
										)}
									</div>
									<div className="text-right flex flex-col items-end">
										<p className="text-xs font-bold text-muted-foreground uppercase">Total</p>
										{pricing.totalNormal > pricing.totalConDescuento && formData.idaVuelta ? (
											<>
												<p className="text-sm text-muted-foreground line-through decoration-destructive/60 decoration-1">
													{formatCurrency(pricing.totalNormal)}
												</p>
												<p className="font-bold text-lg text-emerald-600">
													{formatCurrency(pricing.totalConDescuento)}
												</p>
											</>
										) : (
											<p className="font-bold text-lg text-foreground">
												{formatCurrency(pricing.totalConDescuento)}
											</p>
										)}
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
									<Label htmlFor="nombre" className="font-semibold text-foreground text-base">Nombre Completo</Label>
									<Input
										id="nombre"
										name="nombre"
										type="text"
										inputMode="text"
										autoComplete="name"
										value={formData.nombre}
										onChange={handleInputChange}
										placeholder="Tu nombre completo"
										className="bg-muted/50 border-input h-12 md:h-11 text-base touch-manipulation"
									/>
								</div>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="email" className="font-semibold text-foreground text-base">Email</Label>
										<div className="relative">
											<Input
												id="email"
												type="email"
												inputMode="email"
												autoComplete="email"
												name="email"
												value={formData.email}
												onChange={handleInputChange}
												onBlur={(e) => verificarReservaActiva(e.target.value)}
												placeholder="tu@email.com"
												className="bg-muted/50 border-input h-12 md:h-11 text-base touch-manipulation"
											/>
											{verificandoReserva && <span className="absolute right-3 top-3.5 text-xs text-muted-foreground">...</span>}
										</div>
									</div>
									<div className="space-y-2">
										<Label htmlFor="telefono" className="font-semibold text-foreground text-base">Teléfono</Label>
										<Input
											id="telefono"
											name="telefono"
											type="tel"
											inputMode="tel"
											autoComplete="tel"
											value={formData.telefono}
											onChange={handleInputChange}
											placeholder="+56 9 1234 5678"
											className={`bg-muted/50 border-input h-12 md:h-11 text-base touch-manipulation ${phoneError ? "border-destructive" : ""}`}
										/>
										{phoneError && <p className="text-xs text-destructive mt-1">{phoneError}</p>}
									</div>
								</div>
							</div>

							{/* Checkbox de términos - Optimizado para área táctil móvil */}
							<div 
								className="flex items-start gap-3 p-4 md:p-3 bg-muted/30 rounded-xl md:rounded-lg border-2 border-border cursor-pointer touch-manipulation min-h-[52px] transition-colors hover:bg-muted/50 active:bg-muted/70"
								onClick={() => setPaymentConsent(!paymentConsent)}
								role="checkbox"
								aria-checked={paymentConsent}
								tabIndex={0}
								onKeyDown={(e) => {
									if (e.key === 'Enter' || e.key === ' ') {
										e.preventDefault();
										setPaymentConsent(!paymentConsent);
									}
								}}
							>
								<Checkbox
									id="terms"
									checked={paymentConsent}
									onCheckedChange={(c) => setPaymentConsent(!!c)}
									className="mt-0.5 data-[state=checked]:bg-primary size-5 md:size-4"
								/>
								<Label htmlFor="terms" className="text-sm md:text-sm text-muted-foreground leading-snug cursor-pointer select-none">
									Acepto los
									<Dialog>
										<DialogTrigger asChild>
											<span
												className="underline font-medium text-foreground mx-1 hover:text-primary transition-colors"
												onClick={(e) => e.stopPropagation()}
												role="button"
												tabIndex={0}
												onKeyDown={(e) => {
													if (e.key === 'Enter' || e.key === ' ') {
														e.stopPropagation();
													}
												}}
											>
												términos y condiciones
											</span>
										</DialogTrigger>
										<DialogContent onClick={(e) => e.stopPropagation()}>
											<DialogHeader>
												<DialogTitle>Términos y Condiciones</DialogTitle>
												<DialogDescription>
													Por favor, lee atentamente nuestras condiciones de servicio.
												</DialogDescription>
											</DialogHeader>
											<ScrollArea className="h-[60vh] pr-4">
												<div className="space-y-4">
													{TERMINOS_CONDICIONES.map((seccion, index) => (
														<div key={index} className="space-y-2">
															<h4 className="font-semibold text-foreground">{seccion.titulo}</h4>
															{Array.isArray(seccion.contenido) ? (
																<ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
																	{seccion.contenido.map((item, i) => (
																		<li key={i}>{item}</li>
																	))}
																</ul>
															) : (
																<p className="text-sm text-muted-foreground">{seccion.contenido}</p>
															)}
														</div>
													))}
												</div>
											</ScrollArea>
										</DialogContent>
									</Dialog>
									y la
									<Dialog>
										<DialogTrigger asChild>
											<span
												className="underline font-medium text-foreground ml-1 hover:text-primary transition-colors"
												onClick={(e) => e.stopPropagation()}
												role="button"
												tabIndex={0}
												onKeyDown={(e) => {
													if (e.key === 'Enter' || e.key === ' ') {
														e.stopPropagation();
													}
												}}
											>
												política de privacidad
											</span>
										</DialogTrigger>
										<DialogContent onClick={(e) => e.stopPropagation()}>
											<DialogHeader>
												<DialogTitle>Política de Privacidad</DialogTitle>
												<DialogDescription>
													Tu privacidad es importante para nosotros.
												</DialogDescription>
											</DialogHeader>
											<ScrollArea className="h-[60vh] pr-4">
												<div className="space-y-4">
													{POLITICA_PRIVACIDAD.map((seccion, index) => (
														<div key={index} className="space-y-2">
															<h4 className="font-semibold text-foreground">{seccion.titulo}</h4>
															<p className="text-sm text-muted-foreground">{seccion.contenido}</p>
														</div>
													))}
												</div>
											</ScrollArea>
										</DialogContent>
									</Dialog>
									.
								</Label>
							</div>

							{stepError && (
								<div className="p-4 md:p-3 rounded-xl md:rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-base md:text-sm text-center">
									{stepError}
								</div>
							)}

							{/* Botones de pago - Optimizados para móvil */}
							<div className="pt-2 space-y-3">
								{mostrarPrecio && !requiereCotizacionManual ? (
									<Button
										onClick={() => handleProcesarPago("flow", "total")}
										disabled={isSubmitting || !!loadingGateway}
										className="w-full h-14 md:h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-lg font-bold shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-[0.98] touch-manipulation min-h-[56px]"
										aria-label={`Pagar ${formatCurrency(pricing.totalConDescuento)}`}
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
										className="w-full h-14 md:h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-lg font-bold shadow-lg transition-transform active:scale-[0.98] touch-manipulation min-h-[56px]"
										aria-label="Solicitar reserva"
									>
										{isSubmitting ? <LoaderCircle className="animate-spin" /> : "Solicitar Reserva"}
									</Button>
								)}
								{/* Indicador de seguridad - Visible y claro en móvil */}
								<p className="text-center text-sm md:text-xs text-muted-foreground mt-4 flex items-center justify-center gap-1.5">
									<ShieldCheck className="h-4 w-4 md:h-3 md:w-3" /> Pago 100% seguro vía Flow
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
						loading="lazy"
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
									<motion.div variants={itemVariants} className="mt-6 bg-chocolate-900/40 backdrop-blur-md p-5 rounded-xl border border-chocolate-400/30">
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
