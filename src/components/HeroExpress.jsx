import React, { useMemo, useState, useEffect, useRef } from "react";
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
import { Switch } from "./ui/switch";
import { Baby, LoaderCircle, ArrowRight, ArrowLeft, ArrowRightLeft, MapPin, Calendar, Clock, Users, CheckCircle2, ShieldCheck, CreditCard, Info, Mountain, Lightbulb, Plane, Star, Sparkles, Zap, Radio } from "lucide-react";
import { cn } from "@/lib/utils";
import { AddressAutocomplete } from "./ui/address-autocomplete";
import WhatsAppButton from "./WhatsAppButton";
import { useIsMobile } from "../hooks/use-mobile";
import heroVan from "../assets/hero-van.png";
import fondovariante from "../assets/fondovariante.png";
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

// Función para generar opciones de hora en intervalos de 15 minutos (6:00 AM - 10:00 PM)
const generateTimeOptions = () => {
	const options = [];
	for (let hour = 6; hour <= 22; hour++) {
		for (let minute = 0; minute < 60; minute += 15) {
			if (hour === 22 && minute > 0) break;
			const timeString = `${hour.toString().padStart(2, "0")}:${minute
				.toString()
				.padStart(2, "0")}`;
			options.push({ value: timeString, label: timeString });
		}
	}
	return options;
};

function HeroExpress({
	formData,
	handleInputChange,
	setFormData,
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
	configSillas = { habilitado: false, maxSillas: 2, precioPorSilla: 5000 },
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

	// Refs para inputs de fecha
	const fechaInputRef = useRef(null);
	const fechaRegresoInputRef = useRef(null);

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

	// --- LÓGICA DE CAPTURA DE LEADS (REMARKETING) ---
	useEffect(() => {
		// Solo intentar capturar si estamos en el paso de contacto (Step 1) y hay un email válido
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (currentStep !== 1 || !formData.email || !emailRegex.test(formData.email)) {
			return;
		}

		// Debounce de 2 segundos para no saturar el backend mientras el usuario escribe
		const timer = setTimeout(async () => {
			try {
				const apiUrl = getBackendUrl() || "https://transportes-araucaria.onrender.com";
				const leadData = {
					nombre: formData.nombre,
					email: formData.email,
					telefono: formData.telefono,
					origen: formData.origen,
					destino: formData.destino,
					fecha: formData.fecha,
					hora: formData.hora,
					pasajeros: formData.pasajeros,
					precio: pricing.precioBase,
					totalConDescuento: pricing.totalConDescuento,
					vehiculo: cotizacion.vehiculo,
					idaVuelta: formData.idaVuelta,
					fechaRegreso: formData.fechaRegreso,
					horaRegreso: formData.horaRegreso
				};

				const response = await fetch(`${apiUrl}/api/reservas/capturar-lead`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(leadData)
				});

				if (response.ok) {
					const data = await response.json();
					console.log("🎯 Lead capturado exitosamente:", data.codigoReserva);
				}
			} catch (error) {
				console.error("❌ Error capturando lead silenciosamente:", error);
			}
		}, 2000);

		return () => clearTimeout(timer);
	}, [currentStep, formData.email, formData.nombre, formData.telefono, pricing.totalConDescuento]);

	// Determinar el "target" para mostrar info (Destino principal o Origen si es traslado hacia aeropuerto)
	const targetName = useMemo(() => {
		return formData.destino !== "Aeropuerto La Araucanía"
			? formData.destino
			: (formData.origen !== "Aeropuerto La Araucanía" ? formData.origen : null);
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
		// Obtener fecha hoy en formato YYYY-MM-DD (Chile)
		const hoyChile = new Intl.DateTimeFormat('fr-CA', {
			timeZone: 'America/Santiago',
			year: 'numeric',
			month: '2-digit',
			day: '2-digit'
		}).format(new Date());

		if (formData.fecha === hoyChile) {
			const destinoObj = Array.isArray(destinosData)
				? destinosData.find(d => d.nombre === targetName)
				: null;
			
			const anticipacion = destinoObj?.minHorasAnticipacion || 5;
			
			// Obtener hora actual en Chile de forma robusta
			const now = new Date();
			const formatter = new Intl.DateTimeFormat('en-US', {
				timeZone: 'America/Santiago',
				hour: 'numeric',
				minute: 'numeric',
				hour12: false
			});
			const parts = formatter.formatToParts(now);
			const hActual = parseInt(parts.find(p => p.type === 'hour').value);
			const mActual = parseInt(parts.find(p => p.type === 'minute').value);
			const horaActualDecimal = hActual + mActual / 60;

			options = options.filter(opt => {
				const [h, m] = opt.value.split(":").map(Number);
				const horaOpcionDecimal = h + m / 60;
				return horaOpcionDecimal >= horaActualDecimal + anticipacion;
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
	const requiereCotizacionManual = formData.destino && !tieneCotizacionAutomatica;
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
		if (formData.destino && formData.destino !== "Aeropuerto La Araucanía") {
			return { title: `Viaja a ${formData.destino}`, subtitle: "Comodidad y seguridad garantizada." };
		}
		if (formData.origen && formData.origen !== "Aeropuerto La Araucanía") {
			return { title: `Viaja desde ${formData.origen}`, subtitle: "Comenzamos el viaje donde tú estés." };
		}

		return { 
			title: "Transporte Privado", 
			subtitle: "Conecta con Pucón, Villarrica, Lican Ray, Malalcahuello y toda La Araucanía.",
			descripcion: "Traslados exclusivos puerta a puerta, disponibles las 24 horas para todos los destinos de la región y el sur de Chile. Nuestra flota cuenta con vehículos modernos y conductores profesionales para brindarte la mejor experiencia.",
			beneficios: [
				{ text: "Tarifas fijas y transparentes", icon: ShieldCheck, color: "text-emerald-400" },
				{ text: "Reserva inmediata 100% online", icon: Zap, color: "text-amber-400" },
				{ text: "Sillas para niños obligatorias", icon: Baby, color: "text-blue-400" },
				{ text: "Paga en hasta 3 cuotas sin intereses", icon: CreditCard, color: "text-emerald-400" }
			]
		};
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
			// console.error("Error verificando reserva activa:", error);
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
		// Intercambiar origen y destino de forma atómica para evitar estados intermedios inconsistentes
		setFormData(prev => ({
			...prev,
			origen: prev.destino || prev.origen,
			destino: prev.origen || prev.destino,
		}));
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
			// console.error("Error verificando disponibilidad y retorno:", error);
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
			// console.error("Error verificando bloqueo:", error);
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
		<section id="inicio" className="relative w-full min-h-screen flex flex-col lg:grid lg:grid-cols-2 bg-transparent pt-20">

			{/* Mobile Header (Visual) - Optimizado para rendimiento móvil */}
			<div className="lg:hidden relative h-[35vh] min-h-50 w-full overflow-hidden bg-gray-900">
				{/* Imagen de fondo dinámica según destino */}
				<img
					src={selectedDestinoImage}
					alt={targetName || "Transporte privado"}
					loading="eager"
					onError={(e) => { e.currentTarget.src = heroVan; }}
					className="absolute inset-0 w-full h-full object-cover object-center"
				/>
				{/* Degradado oscuro para asegurar contraste */}
				<div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/30 to-transparent z-0 pointer-events-none" />
				
				<div className="absolute bottom-4 left-4 right-4 z-10 flex flex-col items-center text-center">
					<AnimatePresence mode="wait">
						{richInfo.isSummary ? (
							/* Paso 1: vista de resumen — icono de check + texto compacto */
							<motion.div
								key="summary"
								initial={{ opacity: 0, scale: 0.95 }}
								animate={{ opacity: 1, scale: 1 }}
								exit={{ opacity: 0, scale: 0.95 }}
								transition={{ duration: 0.25 }}
								className="flex flex-col items-center gap-2"
							>
								<div className="w-12 h-12 rounded-full bg-emerald-500/90 backdrop-blur-sm flex items-center justify-center shadow-lg">
									<CheckCircle2 className="w-7 h-7 text-white" />
								</div>
								<h1 className="text-xl font-bold text-white" style={{textShadow: '0 2px 8px rgba(0,0,0,0.8)'}}>
									Resumen de tu viaje
								</h1>
								<p className="text-sm text-white/90 font-medium" style={{textShadow: '0 1px 6px rgba(0,0,0,0.8)'}}>
									{formData.origen} → {formData.destino}
								</p>
							</motion.div>
						) : (
							/* Paso 0: vista de selección — título dinámico + badge */
							<motion.div
								key={richInfo.title}
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -10 }}
								transition={{ duration: 0.3 }}
								className="flex flex-col items-center"
							>
								<h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight mb-1" style={{textShadow: '0 2px 12px rgba(0,0,0,0.7), 0 1px 4px rgba(0,0,0,0.9)'}}>
									{richInfo.isRich ? richInfo.titulo : richInfo.title}
								</h1>
								<p className="text-sm text-white font-medium mb-2 line-clamp-2 max-w-[85%]" style={{textShadow: '0 1px 8px rgba(0,0,0,0.85)'}}>
									{richInfo.isRich ? richInfo.bajada : richInfo.subtitle}
								</p>

								{/* Badge promocional — solo en paso 0 */}
								<motion.div
									initial={{ opacity: 0, scale: 0.9 }}
									animate={{ opacity: 1, scale: 1 }}
									transition={{ delay: 0.5 }}
									className="mt-1"
								>
									<a
										href="/oportunidades"
										className="flex items-center gap-2 px-4 py-2 bg-chocolate-600/90 backdrop-blur-md rounded-full border border-chocolate-400 shadow-xl"
									>
										<Sparkles className="h-3.5 w-3.5 text-chocolate-100" />
										<span className="text-xs font-bold text-white">¡Ahorra un 50%! Ver Oportunidades</span>
									</a>
								</motion.div>

								{/* Badges de distancia/tiempo para destino rico */}
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
						)}
					</AnimatePresence>
				</div>
			</div>

			{/* Left Panel: Interaction (Form) - Padding optimizado para móvil */}
			<div 
				className="relative flex flex-col justify-start lg:justify-center px-4 sm:px-6 py-6 sm:py-8 lg:p-16 xl:p-24 overflow-y-auto bg-transparent z-10 -mt-6 mx-4 sm:mx-6 lg:mx-0 rounded-t-3xl rounded-b-3xl lg:mt-0 lg:rounded-none shadow-none mb-6 lg:mb-0"
			>
				{/* Indicador de pasos — visible en móvil, oculto en desktop */}
				<div className="flex items-center justify-center gap-2 mb-4 lg:hidden">
					<div className={`h-2 rounded-full transition-all duration-300 ${currentStep === 0 ? 'w-6 bg-primary' : 'w-2 bg-primary/30'}`} />
					<div className={`h-2 rounded-full transition-all duration-300 ${currentStep === 1 ? 'w-6 bg-primary' : 'w-2 bg-primary/30'}`} />
				</div>

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
								
								{/* 📢 NUEVO: Badge promocional de Tarifas Bajas */}
								<motion.div 
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: 0.5 }}
									className="inline-block"
								>
									<a 
										href="/oportunidades" 
										className="group flex items-center gap-2 px-3 py-1.5 bg-chocolate-50 border border-chocolate-200 rounded-full hover:bg-chocolate-100 transition-colors cursor-pointer animate-pulse-subtle"
									>
										<Sparkles className="h-4 w-4 text-chocolate-600" />
										<span className="text-sm font-medium text-chocolate-800">
											¡Ahorra hasta un 50%! Revisa nuestras <span className="font-bold underline decoration-chocolate-400 group-hover:decoration-chocolate-600">tarifas bajas en Oportunidades</span>
										</span>
									</a>
								</motion.div>
							</div>

							<div className="space-y-5 md:space-y-4 bg-white/80 backdrop-blur-md p-6 sm:p-8 rounded-3xl lg:rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100/50">
								{/* Selectores de origen y destino - Con botón swap en desktop y móvil */}
								{/* Botón swap visible solo en móvil — encima de los selectores */}
								<div className="flex md:hidden justify-end -mb-1">
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={handleSwap}
										className="h-8 px-3 rounded-full bg-white border border-gray-200 shadow-sm text-muted-foreground hover:text-primary flex items-center gap-1.5 touch-manipulation text-xs"
										aria-label="Intercambiar origen y destino"
									>
										<ArrowRightLeft className="h-3.5 w-3.5" />
										Intercambiar
									</Button>
								</div>
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
												ref={fechaInputRef}
												defaultValue={formData.fecha}
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

								{/* Grupo de Opciones Extra (Regreso y Sillas) - Armonizado para PC */}
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
									{/* Control de Regreso */}
									<div
										className={`group flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer touch-manipulation min-h-[76px] ${
											formData.idaVuelta 
												? 'bg-primary/5 border-primary shadow-sm' 
												: 'bg-muted/30 border-border hover:bg-muted/50 active:bg-muted/70'
										}`}
										onClick={(e) => {
											if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
											const newValue = !formData.idaVuelta;
											handleInputChange({ target: { name: "idaVuelta", value: newValue } });
											if (!newValue) handleInputChange({ target: { name: "fechaRegreso", value: "" } });
											else if (formData.fecha) handleInputChange({ target: { name: "fechaRegreso", value: formData.fecha } });
										}}
									>
										<div className="flex flex-col flex-1 mr-3">
											<Label htmlFor="idaVuelta" className="cursor-pointer font-bold text-foreground text-sm leading-tight mb-1">Necesito regreso</Label>
											<span className="text-[11px] text-muted-foreground font-medium leading-none">
												{formData.idaVuelta ? "Regreso reservado" : "Ahorra ida y vuelta"}
											</span>
										</div>
										<Switch
											id="idaVuelta"
											checked={formData.idaVuelta}
											onCheckedChange={(checked) => {
												handleInputChange({ target: { name: "idaVuelta", value: checked } });
												if (!checked) handleInputChange({ target: { name: "fechaRegreso", value: "" } });
												else if (formData.fecha) handleInputChange({ target: { name: "fechaRegreso", value: formData.fecha } });
											}}
										/>
									</div>

									{/* Selector de Sillas Infantiles (Optimizado Móvil + PC) */}
									{configSillas.habilitado && (
										<div
											className={`group flex flex-col justify-center p-4 rounded-2xl border-2 transition-all cursor-pointer touch-manipulation min-h-[76px] ${
												formData.sillaInfantil 
													? 'bg-chocolate-500/10 border-chocolate-500 shadow-sm' 
													: 'bg-chocolate-50/50 border-chocolate-200/50 hover:bg-chocolate-50 active:bg-chocolate-100'
											}`}
											onClick={(e) => {
												if (e.target.tagName === 'BUTTON' || e.target.closest('button') || e.target.closest('.no-click-prop')) return;
												const newValue = !formData.sillaInfantil;
												setFormData(prev => ({ 
													...prev, 
													sillaInfantil: newValue,
													cantidadSillasInfantiles: newValue ? 1 : 0 
												}));
											}}
										>
											<div className="flex items-center justify-between w-full">
												<div className="flex items-center gap-2 flex-1 mr-3">
													<div className={`p-1.5 rounded-lg transition-colors ${formData.sillaInfantil ? 'bg-chocolate-500 text-white' : 'bg-chocolate-100 text-chocolate-600'}`}>
														<Baby className="h-4" />
													</div>
													<div className="flex flex-col">
														<p className="text-sm font-bold text-foreground leading-tight">¿Silla niños?</p>
														<p className="text-[11px] text-muted-foreground font-medium leading-none">Gratis</p>
													</div>
												</div>
												<div className="no-click-prop">
													<Switch
														id="silla-infantil-toggle"
														checked={formData.sillaInfantil}
														onCheckedChange={(checked) => {
															setFormData(prev => ({ 
																...prev, 
																sillaInfantil: checked,
																cantidadSillasInfantiles: checked ? 1 : 0 
															}));
														}}
													/>
												</div>
											</div>
										</div>
									)}
								</div>

								{/* Detalles de Regreso (Expansión) */}
								<AnimatePresence>
									{formData.idaVuelta && (
										<motion.div
											initial={{ opacity: 0, height: 0 }}
											animate={{ opacity: 1, height: "auto" }}
											exit={{ opacity: 0, height: 0 }}
											className="space-y-4 pt-2 overflow-hidden"
										>
											<div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-2xl border border-border">
												<div className="space-y-2">
													<Label className="text-xs font-bold text-muted-foreground uppercase tracking-tight">Fecha de Regreso</Label>
													<div className="relative">
														<Calendar className="absolute left-3 top-3 h-5 w-5 text-muted-foreground pointer-events-none z-10" />
														<input
															type="date"
															name="fechaRegreso"
															ref={fechaRegresoInputRef}
															defaultValue={formData.fechaRegreso}
															onChange={handleInputChange}
															min={formData.fecha || minDateTime}
															aria-label="Seleccionar fecha de regreso"
															className="w-full h-11 pl-10 pr-4 bg-white border border-input rounded-xl text-sm md:text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary touch-manipulation"
														/>
													</div>
												</div>
												<div className="space-y-2">
													<Label htmlFor="horaRegreso" className="text-xs font-bold text-muted-foreground uppercase tracking-tight">Hora de Regreso</Label>
													<div className="relative">
														<Clock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground pointer-events-none z-10" />
														<select
															id="horaRegreso"
															name="horaRegreso"
															value={formData.horaRegreso || ""}
															onChange={handleInputChange}
															aria-label="Seleccionar hora de regreso"
															className="w-full h-11 pl-10 pr-8 bg-white border border-input rounded-xl text-sm md:text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none cursor-pointer touch-manipulation"
														>
															<option value="" disabled>Seleccionar...</option>
															{timeOptions.map((t) => (
																<option key={t.value} value={t.value}>{t.label}</option>
															))}
														</select>
														<div className="absolute right-3 top-3 h-5 w-5 pointer-events-none">
															<svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
															</svg>
														</div>
													</div>
												</div>
											</div>
										</motion.div>
									)}
								</AnimatePresence>

								{/* Expansión de Cantidad de Sillas */}
								{configSillas.habilitado && (
									<AnimatePresence>
										{formData.sillaInfantil && (
											<motion.div
												initial={{ height: 0, opacity: 0 }}
												animate={{ height: "auto", opacity: 1 }}
												exit={{ height: 0, opacity: 0 }}
												className="overflow-visible"
											>
												<div className="mt-2 p-4 bg-chocolate-500/5 rounded-2xl border border-chocolate-200/30">
													<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
														<Label htmlFor="cantidad-sillas" className="text-xs font-bold text-chocolate-800 uppercase tracking-tight">Cantidad de sillas</Label>
														<div className="flex items-center gap-3 p-1">
															{[...Array(configSillas.maxSillas)].map((_, i) => (
																<button
																	key={i + 1}
																	type="button"
																	onClick={() => setFormData(prev => ({ ...prev, cantidadSillasInfantiles: i + 1 }))}
																	className={`w-14 h-14 md:w-12 md:h-12 rounded-xl text-sm font-black transition-all active:scale-90 touch-manipulation flex items-center justify-center ${
																		formData.cantidadSillasInfantiles === (i + 1)
																			? 'bg-chocolate-600 text-white shadow-lg shadow-chocolate-200 ring-4 ring-chocolate-500/30'
																			: 'bg-white text-chocolate-900 border-2 border-chocolate-100 hover:border-chocolate-200 active:bg-chocolate-50'
																	}`}
																>
																	{i + 1}
																</button>
															))}
														</div>
													</div>
												</div>
											</motion.div>
										)}
									</AnimatePresence>
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
							className="space-y-5 md:space-y-6 w-full max-w-lg mx-auto bg-white p-6 sm:p-8 rounded-3xl lg:rounded-[2rem] shadow-xl border border-gray-100/50 overflow-y-auto"
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
										<p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Ruta y Pasajeros</p>
										<p className="font-semibold text-foreground text-sm md:text-base break-words">
											{formData.origen === "Otro" ? formData.otroOrigen : formData.origen}
											<span className="mx-1 md:mx-2 text-muted-foreground">→</span>
											{formData.destino === "Otro" ? formData.otroDestino : formData.destino}
										</p>
										<p className="text-xs font-medium text-muted-foreground mt-0.5 flex items-center gap-1">
											<Users className="w-3.5 h-3.5" />
											{formData.pasajeros} {parseInt(formData.pasajeros) === 1 ? 'pasajero' : 'pasajeros'}
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
										{formData.sillaInfantil && formData.cantidadSillasInfantiles > 0 && (
											<p className="text-xs font-medium text-chocolate-700 flex items-center gap-1 mt-1">
												<Baby className="w-3 h-3" />
												{formData.cantidadSillasInfantiles} {formData.cantidadSillasInfantiles === 1 ? 'silla infantil' : 'sillas infantiles'}
											</p>
										)}
									</div>
									<div className="text-right flex flex-col items-end">
										<p className="text-xs font-bold text-muted-foreground uppercase">Total</p>
										{pricing.totalNormal > pricing.totalConDescuento ? (
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
								{(pricing?.totalNormal > pricing?.totalConDescuento) && (
									<div className="flex items-center gap-2 text-xs font-medium text-emerald-600 bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/20 animate-in fade-in zoom-in duration-300">
										<Sparkles className="h-4 w-4" />
										¡Descuento exclusivo web aplicado!
									</div>
								)}

								{(descuentoRetorno || (pricing?.descuentoRetornoUniversal > 0)) && (
									<div className="flex items-center gap-2 text-xs font-medium text-accent bg-accent/10 p-2.5 rounded-lg border border-accent/20 animate-in fade-in zoom-in duration-300">
										<CheckCircle2 className="h-4 w-4" />
										¡Descuento adicional por retorno aplicado!
									</div>
								)}
							</div>

							{/* NUEVO: Opción de upgrade a Van - Solo para 1-3 pasajeros */}
							{formData.pasajeros && parseInt(formData.pasajeros) <= 3 && (() => {
								const tramo = [formData.origen, formData.destino].find(lugar => lugar !== "Aeropuerto La Araucanía");
								const destinoInfo = destinosData.find(d => d.nombre === tramo);
								if (!destinoInfo || !destinoInfo.precios?.van?.base) return null;
								
								// CALCULAR SIEMPRE BASÁNDOSE EN EL PRECIO DEL SEDÁN, NO EN EL ESTADO ACTUAL
								// Calcular precio base del Sedán sin descuentos
								const preciosAuto = destinoInfo.precios.auto;
								const baseAuto = Number(preciosAuto.base);
								const adicionales = parseInt(formData.pasajeros) - 1;
								const precioSedanBase = baseAuto + (adicionales * baseAuto * preciosAuto.porcentajeAdicional);
								const precioSedanSinDescuentos = formData.idaVuelta ? precioSedanBase * 2 : precioSedanBase;
								
								// Calcular precio Sedán CON descuentos (usando pricing solo si NO está en modo upgrade)
								// Si upgrade está activado, usar cotización inversa
								let precioSedanConDescuentos;
								if (formData.upgradeVan) {
									// Si upgrade activado, calcular desde el precio total actual
									// El pricing.totalConDescuento es de la Van, necesitamos recalcular el Sedán
									// Usar mismo porcentaje de descuento
									const precioActualVan = pricing.totalConDescuento || 0;
									const precioBaseVan = Number(destinoInfo.precios.van.base);
									const precioVan4PaxSinDescuentos = formData.idaVuelta ? precioBaseVan * 2 : precioBaseVan;
									const porcentajeDescuento = precioVan4PaxSinDescuentos > 0 
										? 1 - (precioActualVan / precioVan4PaxSinDescuentos)
										: 0;
									precioSedanConDescuentos = precioSedanSinDescuentos * (1 - porcentajeDescuento);
								} else {
									// Si upgrade NO activado, usar el precio actual directamente
									precioSedanConDescuentos = pricing.totalConDescuento || 0;
								}
								
								// Calcular precio Van para 4 pasajeros (precio base sin adicionales)
								const precioBaseVan = Number(destinoInfo.precios.van.base);
								const precioVan4PaxSinDescuentos = formData.idaVuelta ? precioBaseVan * 2 : precioBaseVan;
								
								// Calcular porcentaje de descuento (siempre el mismo para ambos vehículos)
								const porcentajeDescuento = formData.upgradeVan
									? (precioVan4PaxSinDescuentos > 0 ? 1 - ((pricing.totalConDescuento || 0) / precioVan4PaxSinDescuentos) : 0)
									: (precioSedanSinDescuentos > 0 ? 1 - ((pricing.totalConDescuento || 0) / precioSedanSinDescuentos) : 0);
								
								// Aplicar el mismo porcentaje de descuento a la Van para 4 pax
								const precioVan4PaxConDescuentos = precioVan4PaxSinDescuentos * (1 - porcentajeDescuento);
								
								// Diferencia = Van 4 pax con descuentos - Sedán con descuentos (SIEMPRE FIJA)
								const diferenciaTotal = precioVan4PaxConDescuentos - precioSedanConDescuentos;
								
								// No mostrar si la diferencia es negativa o muy pequeña
								if (diferenciaTotal <= 500) return null;
								
								return (
									<div className="mt-6 pt-6 border-t border-border">
										{/* Upgrade a Van — área táctil grande para móvil */}
										<div
											className={`flex items-start gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer touch-manipulation min-h-20 active:scale-[0.99] ${
												formData.upgradeVan 
													? 'bg-primary/5 border-primary shadow-sm' 
													: 'bg-muted/30 border-border hover:bg-muted/40 active:bg-muted/60'
											}`}
											onClick={() => setFormData(prev => ({ ...prev, upgradeVan: !prev.upgradeVan }))}
										>
											{/* Checkbox visualmente grande */}
											<div className={`mt-0.5 w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${formData.upgradeVan ? 'bg-primary border-primary' : 'bg-white border-input'}`}>
												{formData.upgradeVan && (
													<svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
													</svg>
												)}
											</div>
											<label htmlFor="upgrade-van" className="flex-1 cursor-pointer">
												<div className="flex items-center justify-between gap-3 mb-2">
													<div className="flex items-center gap-2 flex-wrap">
														<span className="text-sm font-semibold text-foreground">
															Upgrade a Van
														</span>
														<span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground border border-border">
															Precio fijo hasta 4 pax
														</span>
													</div>
													<span className="text-base font-bold text-primary whitespace-nowrap">
														+{formatCurrency(diferenciaTotal)}
													</span>
												</div>
												
												<div className="space-y-2">
													<p className="text-xs text-muted-foreground leading-relaxed">
														<strong>Más espacio y confort:</strong> Asientos amplios y reclinables<br />
														<strong>Equipaje extra:</strong> Ideal para maletas grandes o compras
													</p>
													
													{parseInt(formData.pasajeros) === 3 && (
														<div className="bg-muted/50 border border-border rounded px-3 py-2">
															<p className="text-xs text-muted-foreground">
																<strong>Nota:</strong> Si suman un pasajero más, la Van es obligatoria por solo un pequeño adicional
															</p>
														</div>
													)}
													
													{formData.upgradeVan && (
														<div className="bg-primary/10 border border-primary/20 rounded px-3 py-2 mt-2">
															<p className="text-xs text-primary font-medium">
																Upgrade activado - Descuentos aplicados
															</p>
														</div>
													)}
												</div>
											</label>
										</div>
									</div>
								);
							})()}

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

							{/* Botones de pago - Optimizados para móvil con safe-area para notch */}
							<div className="pt-2 space-y-3 pb-[env(safe-area-inset-bottom,0px)]">
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
			<div className="relative hidden lg:block h-full overflow-hidden bg-transparent sticky top-0">

				<div className="absolute top-0 left-0 w-full px-16 py-24 z-10 flex flex-col justify-start h-full">
					<motion.div
						key={richInfo.title}
						variants={containerVariants}
						initial="hidden"
						animate="show"
						className="space-y-8 max-w-xl"
					>
						{/* Título y Bajada */}
						<motion.div variants={itemVariants}>
							<h1 className="text-6xl font-extrabold text-white mb-6 tracking-tight leading-none" style={{textShadow: '0 4px 20px rgba(0,0,0,0.8), 0 2px 8px rgba(0,0,0,0.9)'}}>
								{richInfo.isRich ? richInfo.titulo : richInfo.title}
							</h1>
							<p className="text-2xl text-white font-semibold border-l-4 border-primary/80 pl-4 py-1" style={{textShadow: '0 2px 10px rgba(0,0,0,0.7)'}}>
								{richInfo.isRich ? richInfo.bajada : richInfo.subtitle}
							</p>
						</motion.div>

						{/* Info extra solo en el estado inicial (sin destino rico seleccionado) */}
						{!richInfo.isRich && !richInfo.isSummary && richInfo.descripcion && (
							<motion.div 
								variants={itemVariants} 
								className="p-6 rounded-3xl bg-black/60 backdrop-blur-md border border-white/20 shadow-2xl space-y-6 overflow-hidden relative"
							>
								{/* Decoración sutil */}
								<div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full -mr-16 -mt-16 blur-3xl opacity-50" />
								
								<p className="text-white text-lg leading-relaxed font-medium relative z-10">
									{richInfo.descripcion}
								</p>
								
								{richInfo.beneficios && (
									<ul className="grid grid-cols-1 gap-5 relative z-10">
										{richInfo.beneficios.map((b, i) => (
											<li key={i} className="flex items-start gap-4 text-white group">
												<div className={cn(
													"p-2.5 rounded-xl bg-white/10 border border-white/20 shadow-lg backdrop-blur-sm transition-transform group-hover:scale-110 duration-300",
													"flex items-center justify-center relative overflow-hidden"
												)}>
													{/* Brillo interno */}
													<div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50" />
													<b.icon className={cn("w-5 h-5 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]", b.color)} />
												</div>
												<div className="flex flex-col">
													<span className="font-bold text-base tracking-tight" style={{textShadow: '0 1px 4px rgba(0,0,0,0.5)'}}>{b.text}</span>
												</div>
											</li>
										))}
									</ul>
								)}
								
								{/* Badge de confianza adicional */}
								<div className="flex items-center gap-4 pt-2 border-t border-white/10">
									<div className="flex -space-x-2">
										{[1,2,3].map(i => (
											<div key={i} className="w-8 h-8 rounded-full border-2 border-black bg-gray-200 overflow-hidden flex items-center justify-center">
												<Users className="w-4 h-4 text-gray-600" />
											</div>
										))}
									</div>
									<div className="text-sm text-white/80">
										<p className="font-bold text-white">+5,000 servicios realizados</p>
										<p>Con la confianza de toda la región</p>
									</div>
								</div>
							</motion.div>
						)}

						{/* Información de Viaje (Rich Data) */}
						{richInfo.isRich && !richInfo.isSummary && (
							<>
								<motion.div variants={itemVariants} className="flex gap-4">
									<div className="flex items-center gap-3 bg-[#2a4e25]/10 backdrop-blur-md rounded-xl p-4 border border-[#2a4e25]/10 flex-1">
										<div className="p-2 bg-[#2a4e25]/20 rounded-full">
											<Plane className="w-5 h-5 text-[#2a4e25]" />
										</div>
										<div>
											<p className="text-xs text-foreground/70 uppercase font-semibold">Distancia</p>
											<p className="text-foreground font-bold">{richInfo.distancia}</p>
										</div>
									</div>
									<div className="flex items-center gap-3 bg-[#2a4e25]/10 backdrop-blur-md rounded-xl p-4 border border-[#2a4e25]/10 flex-1">
										<div className="p-2 bg-[#2a4e25]/20 rounded-full">
											<Clock className="w-5 h-5 text-[#2a4e25]" />
										</div>
										<div>
											<p className="text-xs text-foreground/70 uppercase font-semibold">Tiempo Estimado</p>
											<p className="text-foreground font-bold">{richInfo.tiempo}</p>
										</div>
									</div>
								</motion.div>

								<motion.div variants={itemVariants} className="space-y-4">
									<div className="flex items-center gap-2">
										<Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
										<h3 className="text-lg font-bold text-foreground">Imperdibles</h3>
									</div>
									<ul className="grid gap-3">
										{richInfo.puntosInteres?.map((punto, i) => (
											<li key={i} className="flex items-center gap-3 text-foreground/90 font-medium">
												<CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
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
