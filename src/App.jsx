// src/App.jsx

/* global gtag */
import "./App.css";
import { useState, useEffect, useMemo, useCallback } from "react";

// --- Componentes UI ---
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "./components/ui/dialog";
import { Button } from "./components/ui/button";
import { Checkbox } from "./components/ui/checkbox";
import { LoaderCircle } from "lucide-react";

// --- Componentes de Sección ---
import Header from "./components/Header";
import Hero from "./components/Hero";
import Servicios from "./components/Servicios";
import Destinos from "./components/Destinos";
import Destacados from "./components/Destacados";
import PorQueElegirnos from "./components/PorQueElegirnos";
import Testimonios from "./components/Testimonios";
import Contacto from "./components/Contacto";
import Footer from "./components/Footer";
import Fidelizacion from "./components/Fidelizacion";
import AdminPricing from "./components/AdminPricing";

// --- Datos Iniciales y Lógica ---
import { destinosBase, destacadosData } from "./data/destinos";

const DESCUENTO_ONLINE = 0.1;
const ROUND_TRIP_DISCOUNT = 0.05;

const normalizePromotions = (promotions = []) => {
	if (!Array.isArray(promotions)) return [];
	return promotions.filter(Boolean).map((promo, index) => ({
		id: promo.id || `promo-${index}`,
		destino: promo.destino || "",
		descripcion: promo.descripcion || "",
		dias: Array.isArray(promo.dias) ? promo.dias : [],
		aplicaPorDias: Boolean(promo.aplicaPorDias),
		aplicaPorHorario: Boolean(promo.aplicaPorHorario),
		horaInicio: promo.horaInicio || "",
		horaFin: promo.horaFin || "",
		descuentoPorcentaje: Number(promo.descuentoPorcentaje) || 0,
		aplicaTipoViaje: {
			ida:
				promo.aplicaTipoViaje?.ida !== undefined
					? Boolean(promo.aplicaTipoViaje.ida)
					: false,
			vuelta:
				promo.aplicaTipoViaje?.vuelta !== undefined
					? Boolean(promo.aplicaTipoViaje.vuelta)
					: false,
			ambos:
				promo.aplicaTipoViaje?.ambos !== undefined
					? Boolean(promo.aplicaTipoViaje.ambos)
					: true,
		},
	}));
};

const getDayTagsFromDate = (dateString) => {
	if (!dateString) return [];
	const parsed = new Date(`${dateString}T00:00:00`);
	if (Number.isNaN(parsed.getTime())) return [];
	const formatter = new Intl.DateTimeFormat("es-CL", {
		weekday: "long",
		timeZone: "America/Santiago",
	});
	const dayName = formatter.format(parsed);
	const capitalized = dayName
		? dayName.charAt(0).toUpperCase() + dayName.slice(1)
		: "";
	if (!capitalized) return [];
	const tags = [capitalized];
	const normalized = capitalized
		.normalize("NFD")
		.replace(/\p{Diacritic}/gu, "")
		.toLowerCase();
	if (normalized === "sabado" || normalized === "domingo") {
		tags.push("Fin de semana");
	}
	return tags;
};

const isTimeWithinRange = (time, start, end) => {
	if (!time || !start || !end) return false;
	if (start <= end) return time >= start && time <= end;
	return time >= start || time <= end;
};

const resolveIsAdminView = () => {
	if (typeof window === "undefined") return false;

	// Verificar múltiples formas de acceso al admin
	const url = new URL(window.location.href);
	const params = url.searchParams;
	const pathname = url.pathname.toLowerCase();
	const hash = url.hash.toLowerCase();

	return (
		// Parámetro URL: ?admin=true
		params.get("admin") === "true" ||
		// Parámetro URL: ?panel=admin
		params.get("panel") === "admin" ||
		// Parámetro URL: ?view=admin
		params.get("view") === "admin" ||
		// Hash: #admin
		hash === "#admin" ||
		// Ruta: /admin/precios (original)
		pathname.startsWith("/admin/precios") ||
		// Ruta: /admin
		pathname === "/admin"
	);
};

function App() {
	const [isAdminView, setIsAdminView] = useState(resolveIsAdminView);
	const [destinosData, setDestinosData] = useState(destinosBase);
	const [promotions, setPromotions] = useState([]);
	const [loadingPrecios, setLoadingPrecios] = useState(true);

	// --- ESTADO Y LÓGICA DEL FORMULARIO ---
	const [formData, setFormData] = useState({
		nombre: "",
		telefono: "",
		email: "",
		origen: "Aeropuerto La Araucanía",
		otroOrigen: "",
		destino: "",
		otroDestino: "",
		fecha: "",
		hora: "",
		pasajeros: "1",
		numeroVuelo: "",
		hotel: "",
		equipajeEspecial: "",
		sillaInfantil: "no",
		mensaje: "",
		idaVuelta: false,
		fechaRegreso: "",
		horaRegreso: "",
	});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [showConfirmationAlert, setShowConfirmationAlert] = useState(false);
	const [phoneError, setPhoneError] = useState("");
	const [reviewChecklist, setReviewChecklist] = useState({
		viaje: false,
		contacto: false,
	});
	const [loadingGateway, setLoadingGateway] = useState(null);

	// --- CARGA DE DATOS DINÁMICA ---
	useEffect(() => {
		const fetchPreciosDesdeAPI = async () => {
			try {
				const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";
				const response = await fetch(`${apiUrl}/pricing`);
				if (!response.ok)
					throw new Error("La respuesta de la red no fue exitosa.");

				const data = await response.json();

				if (data.destinos && data.destinos.length > 0) {
					setDestinosData(data.destinos);
				} else {
					setDestinosData(destinosBase);
				}
				setPromotions(normalizePromotions(data.dayPromotions));
			} catch (error) {
				console.error(
					"Error al cargar precios desde la API, usando valores por defecto.",
					error
				);
				setDestinosData(destinosBase);
				setPromotions([]);
			} finally {
				setLoadingPrecios(false);
			}
		};
		fetchPreciosDesdeAPI();
	}, []);

	// --- LÓGICA DE RUTAS Y PASAJEROS DINÁMICOS ---
	const todosLosTramos = useMemo(
		() => ["Aeropuerto La Araucanía", ...destinosData.map((d) => d.nombre)],
		[destinosData]
	);

	const destinosDisponibles = useMemo(() => {
		return todosLosTramos.filter((d) => d !== formData.origen);
	}, [formData.origen, todosLosTramos]);

	const origenesContacto = useMemo(
		() => [
			"Aeropuerto La Araucanía",
			...destinosData.map((d) => d.nombre),
			"Otro",
		],
		[destinosData]
	);

	// ==================================================================
	// LÓGICA CORREGIDA PARA ACTUALIZACIÓN DINÁMICA DE PASAJEROS
	// ==================================================================
	const destinoSeleccionado = useMemo(() => {
		const tramo = [formData.origen, formData.destino].find(
			(lugar) =>
				lugar && lugar !== "Aeropuerto La Araucanía" && lugar !== "Otro"
		);
		if (!tramo) return null;
		return destinosData.find((d) => d.nombre === tramo) || null;
	}, [formData.origen, formData.destino, destinosData]);

	const maxPasajeros = destinoSeleccionado?.maxPasajeros ?? 7;

	const applicablePromotions = useMemo(() => {
		if (!destinoSeleccionado) return [];
		if (!promotions.length) return [];
		const tramo = destinoSeleccionado.nombre;
		const isRoundTrip = formData.idaVuelta;

		// Determinar la dirección del viaje basado en dónde está el aeropuerto
		const aeropuertoEnOrigen = formData.origen === "Aeropuerto La Araucanía";
		const aeropuertoEnDestino = formData.destino === "Aeropuerto La Araucanía";

		// Ida: de ciudad al aeropuerto (aeropuerto está en destino)
		// Vuelta: del aeropuerto a ciudad (aeropuerto está en origen)
		const esViajeIda = aeropuertoEnDestino;
		const esViajeVuelta = aeropuertoEnOrigen;

		return promotions.filter((promo) => {
			if (!promo.destino || promo.destino !== tramo) return false;
			if (promo.descuentoPorcentaje <= 0) return false;

			// Filtro por tipo de viaje
			const tipoViaje = promo.aplicaTipoViaje;
			if (tipoViaje) {
				if (isRoundTrip) {
					// Para viajes de ida y vuelta, debe estar habilitado "ambos"
					if (!tipoViaje.ambos) return false;
				} else {
					// Para viajes de una sola dirección
					if (esViajeIda) {
						// Viaje de ida (ciudad → aeropuerto): debe permitir "ida" o "ambos"
						if (!tipoViaje.ida && !tipoViaje.ambos) return false;
					} else if (esViajeVuelta) {
						// Viaje de vuelta (aeropuerto → ciudad): debe permitir "vuelta" o "ambos"
						if (!tipoViaje.vuelta && !tipoViaje.ambos) return false;
					}
				}
			}

			if (promo.aplicaPorDias) {
				const tags = getDayTagsFromDate(formData.fecha);
				if (!tags.length) return false;
				const hasMatch = tags.some((tag) => promo.dias.includes(tag));
				if (!hasMatch) return false;
			}
			if (promo.aplicaPorHorario) {
				const horaSeleccionada = formData.hora;
				if (!horaSeleccionada) return false;
				if (!promo.horaInicio || !promo.horaFin) return false;
				if (
					!isTimeWithinRange(horaSeleccionada, promo.horaInicio, promo.horaFin)
				)
					return false;
			}
			return true;
		});
	}, [
		promotions,
		destinoSeleccionado,
		formData.fecha,
		formData.hora,
		formData.idaVuelta,
		formData.origen,
		formData.destino,
	]);

	const activePromotion = useMemo(() => {
		if (!applicablePromotions.length) return null;
		return applicablePromotions.reduce(
			(best, promo) =>
				promo.descuentoPorcentaje > (best?.descuentoPorcentaje ?? 0)
					? promo
					: best,
			null
		);
	}, [applicablePromotions]);

	const promotionDiscountRate = activePromotion
		? activePromotion.descuentoPorcentaje / 100
		: 0;
	const roundTripDiscountRate = formData.idaVuelta ? ROUND_TRIP_DISCOUNT : 0;

	const effectiveDiscountRate = Math.min(
		DESCUENTO_ONLINE + promotionDiscountRate + roundTripDiscountRate,
		0.75
	);

	useEffect(() => {
		if (!destinoSeleccionado) return;
		const limite = destinoSeleccionado.maxPasajeros;
		const pasajerosSeleccionados = parseInt(formData.pasajeros, 10);
		if (
			Number.isFinite(pasajerosSeleccionados) &&
			pasajerosSeleccionados > limite
		) {
			setFormData((prev) => ({
				...prev,
				pasajeros: limite.toString(),
			}));
		}
	}, [destinoSeleccionado, formData.pasajeros]);

	useEffect(() => {
		setFormData((prev) => {
			if (!prev.idaVuelta) return prev;
			if (!prev.fecha || !prev.fechaRegreso) return prev;
			if (prev.fechaRegreso < prev.fecha) {
				return { ...prev, fechaRegreso: prev.fecha };
			}
			return prev;
		});
	}, [formData.fecha, formData.fechaRegreso, formData.idaVuelta]);

	const calcularCotizacion = useCallback(
		(origen, destino, pasajeros) => {
			const tramo = [origen, destino].find(
				(lugar) => lugar !== "Aeropuerto La Araucanía"
			);
			const destinoInfo = destinosData.find((d) => d.nombre === tramo);

			if (!origen || !destinoInfo || !pasajeros || destino === "Otro") {
				return { precio: null, vehiculo: null };
			}

			const numPasajeros = parseInt(pasajeros);
			let vehiculoAsignado;
			let precioFinal;

			if (numPasajeros > 0 && numPasajeros <= 4) {
				vehiculoAsignado = "Auto Privado";
				const precios = destinoInfo.precios.auto;
				if (!precios) return { precio: null, vehiculo: vehiculoAsignado };

				const pasajerosAdicionales = numPasajeros - 1;
				const costoAdicional = precios.base * precios.porcentajeAdicional;
				precioFinal = precios.base + pasajerosAdicionales * costoAdicional;
			} else if (
				numPasajeros >= 5 &&
				numPasajeros <= destinoInfo.maxPasajeros
			) {
				vehiculoAsignado = "Van de Pasajeros";
				const precios = destinoInfo.precios.van;
				if (!precios) return { precio: null, vehiculo: "Van (Consultar)" };

				const pasajerosAdicionales = numPasajeros - 5;
				const costoAdicional = precios.base * precios.porcentajeAdicional;
				precioFinal = precios.base + pasajerosAdicionales * costoAdicional;
			} else {
				vehiculoAsignado = "Consultar disponibilidad";
				precioFinal = null;
			}
			return {
				precio: precioFinal !== null ? Math.round(precioFinal) : null,
				vehiculo: vehiculoAsignado,
			};
		},
		[destinosData]
	);

	useEffect(() => {
		const handleLocationChange = () => setIsAdminView(resolveIsAdminView());
		window.addEventListener("popstate", handleLocationChange);
		return () => window.removeEventListener("popstate", handleLocationChange);
	}, []);

	const cotizacion = useMemo(() => {
		return calcularCotizacion(
			formData.origen,
			formData.destino,
			formData.pasajeros
		);
	}, [
		formData.origen,
		formData.destino,
		formData.pasajeros,
		calcularCotizacion,
	]);

	const validarTelefono = (telefono) =>
		/^(\+?56)?(\s?9)\s?(\d{4})\s?(\d{4})$/.test(telefono);

	const validarHorarioReserva = () => {
		if (!destinoSeleccionado || !formData.fecha || !formData.hora) {
			return {
				esValido: false,
				mensaje: "Por favor, completa la fecha y hora.",
			};
		}
		const ahora = new Date();
		const fechaReserva = new Date(`${formData.fecha}T${formData.hora}`);
		const horasDeDiferencia = (fechaReserva - ahora) / 3600000;
		const { minHorasAnticipacion } = destinoSeleccionado;
		if (horasDeDiferencia < minHorasAnticipacion) {
			return {
				esValido: false,
				mensaje: `Para ${destinoSeleccionado.nombre}, reserva con al menos ${minHorasAnticipacion} horas de anticipación.`,
			};
		}
		return { esValido: true, mensaje: "" };
	};

	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => {
			const newFormData = { ...prev, [name]: value };
			if (name === "origen" && value !== "Aeropuerto La Araucanía")
				newFormData.destino = "Aeropuerto La Araucanía";
			else if (name === "destino" && value !== "Aeropuerto La Araucanía")
				newFormData.origen = "Aeropuerto La Araucanía";
			return newFormData;
		});
		if (name === "telefono") setPhoneError("");
	};

	const resetForm = () => {
		setFormData({
			nombre: "",
			telefono: "",
			email: "",
			origen: "Aeropuerto La Araucanía",
			otroOrigen: "",
			destino: "",
			otroDestino: "",
			fecha: "",
			hora: "",
			pasajeros: "1",
			numeroVuelo: "",
			hotel: "",
			equipajeEspecial: "",
			sillaInfantil: "no",
			mensaje: "",
			idaVuelta: false,
			fechaRegreso: "",
			horaRegreso: "",
		});
	};

	const handleCloseAlert = () => {
		setShowConfirmationAlert(false);
		setReviewChecklist({ viaje: false, contacto: false });
		resetForm();
	};

	const pricing = useMemo(() => {
		const precioIda = cotizacion.precio || 0;
		const precioBase = formData.idaVuelta ? precioIda * 2 : precioIda;
		const descuentoBase = Math.round(precioBase * DESCUENTO_ONLINE);
		const descuentoPromocion = Math.round(
			precioBase * (promotionDiscountRate || 0)
		);
		const descuentoRoundTrip = Math.round(
			precioBase * (roundTripDiscountRate || 0)
		);
		const descuentoOnline =
			descuentoBase + descuentoPromocion + descuentoRoundTrip;
		const totalConDescuento = Math.max(precioBase - descuentoOnline, 0);
		const abono = Math.round(totalConDescuento * 0.4);
		const saldoPendiente = Math.max(totalConDescuento - abono, 0);
		return {
			precioBase,
			descuentoBase,
			descuentoPromocion,
			descuentoRoundTrip,
			descuentoOnline,
			totalConDescuento,
			abono,
			saldoPendiente,
		};
	}, [
		cotizacion.precio,
		promotionDiscountRate,
		roundTripDiscountRate,
		formData.idaVuelta,
	]);

	const {
		precioBase,
		descuentoOnline,
		totalConDescuento,
		abono,
		saldoPendiente,
	} = pricing;

	const handlePayment = async (gateway, type = "abono") => {
		// Prevenir múltiples peticiones
		if (loadingGateway) {
			console.log("Ya hay una petición de pago en proceso");
			return;
		}

		setLoadingGateway(`${gateway}-${type}`);
		const destinoFinal =
			formData.destino === "Otro" ? formData.otroDestino : formData.destino;
		const { vehiculo } = cotizacion;
		const amount = type === "total" ? totalConDescuento : abono;

		if (!amount) {
			alert("Aún no tenemos un valor para generar el enlace de pago.");
			setLoadingGateway(null);
			return;
		}

		const description =
			type === "total"
				? `Pago total con descuento para ${destinoFinal} (${
						vehiculo || "A confirmar"
				  })`
				: `Abono reserva (40%) para ${destinoFinal} (${
						vehiculo || "A confirmar"
				  })`;

		const apiUrl =
			import.meta.env.VITE_API_URL ||
			"https://transportes-araucaria.onrender.com";

		try {
			const response = await fetch(`${apiUrl}/create-payment`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					gateway,
					amount,
					description,
					email: formData.email,
				}),
			});

			if (!response.ok) {
				throw new Error(`Error del servidor: ${response.status}`);
			}

			const data = await response.json();
			if (data.url) {
				window.open(data.url, "_blank");
			} else {
				throw new Error(
					data.message || "No se pudo generar el enlace de pago."
				);
			}
		} catch (error) {
			console.error("Error al crear el pago:", error);
			alert(`Hubo un problema: ${error.message}`);
		} finally {
			// Asegurar que siempre se resetee el estado de carga
			setLoadingGateway(null);
		}
	};

	const enviarReserva = async (source) => {
		if (!validarTelefono(formData.telefono)) {
			setPhoneError(
				"Introduce un número de móvil chileno válido (ej: +56 9 1234 5678)."
			);
			return { success: false, error: "telefono" };
		}
		setPhoneError("");
		const validacion = validarHorarioReserva();
		if (!validacion.esValido && formData.destino !== "Otro") {
			return { success: false, error: "horario", message: validacion.mensaje };
		}
		if (isSubmitting) return { success: false, error: "procesando" };
		setIsSubmitting(true);
		const destinoFinal =
			formData.destino === "Otro" ? formData.otroDestino : formData.destino;
		const origenFinal =
			formData.origen === "Otro" ? formData.otroOrigen : formData.origen;
		const dataToSend = {
			...formData,
			origen: origenFinal,
			destino: destinoFinal,
			precio: cotizacion.precio,
			vehiculo: cotizacion.vehiculo,
			descuentoBase: pricing.descuentoBase,
			descuentoPromocion: pricing.descuentoPromocion,
			descuentoRoundTrip: pricing.descuentoRoundTrip,
			descuentoOnline,
			totalConDescuento,
			abonoSugerido: abono,
			saldoPendiente,
			source,
		};
		if (!dataToSend.nombre?.trim()) {
			dataToSend.nombre = "Cliente Potencial (Cotización Rápida)";
		}
		const emailApiUrl =
			"https://www.transportesaraucaria.cl/enviar_correo_mejorado.php";
		try {
			const response = await fetch(emailApiUrl, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(dataToSend),
			});
			const result = await response.json();
			if (!response.ok)
				throw new Error(result.message || "Error en el servidor PHP.");
			setReviewChecklist({ viaje: false, contacto: false });
			setShowConfirmationAlert(true);
			if (typeof gtag === "function") {
				gtag("event", "conversion", {
					send_to: `AW-17529712870/8GVlCLP-05MbEObh6KZB`,
				});
			}
			return { success: true };
		} catch (error) {
			console.error("Error al enviar el formulario a PHP:", error);
			return { success: false, error: "server", message: error.message };
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		const result = await enviarReserva("Formulario de Contacto");
		if (!result.success && result.message) alert(result.message);
	};

	const handleWizardSubmit = () => enviarReserva("Reserva Web Autogestionada");

	const minDateTime = useMemo(() => {
		const horasAnticipacion = destinoSeleccionado?.minHorasAnticipacion || 5;
		const fechaMinima = new Date();
		fechaMinima.setHours(fechaMinima.getHours() + horasAnticipacion);
		return fechaMinima.toISOString().split("T")[0];
	}, [destinoSeleccionado]);

	const currencyFormatter = useMemo(
		() =>
			new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }),
		[]
	);
	const formatCurrency = (value) => currencyFormatter.format(value || 0);

	const canPay = reviewChecklist.viaje && reviewChecklist.contacto;
	const destinoFinal =
		formData.destino === "Otro" ? formData.otroDestino : formData.destino;

	if (isAdminView) {
		return <AdminPricing />;
	}

	return (
		<div className="min-h-screen bg-background text-foreground">
			{loadingPrecios && (
				<div className="fixed top-0 left-0 w-full h-full bg-black/50 z-[100] flex items-center justify-center text-white">
					<LoaderCircle className="animate-spin mr-2" />
					Cargando tarifas actualizadas...
				</div>
			)}
			<Dialog
				open={showConfirmationAlert}
				onOpenChange={setShowConfirmationAlert}
			>
				{/* El contenido del Dialog no requiere cambios */}
			</Dialog>

			<Header />

			<main>
				<Hero
					formData={formData}
					handleInputChange={handleInputChange}
					origenes={todosLosTramos}
					destinos={destinosDisponibles}
					maxPasajeros={maxPasajeros}
					minDateTime={minDateTime}
					phoneError={phoneError}
					setPhoneError={setPhoneError}
					isSubmitting={isSubmitting}
					cotizacion={cotizacion}
					pricing={pricing}
					descuentoRate={effectiveDiscountRate}
					baseDiscountRate={DESCUENTO_ONLINE}
					promotionDiscountRate={promotionDiscountRate}
					roundTripDiscountRate={roundTripDiscountRate}
					activePromotion={activePromotion}
					reviewChecklist={reviewChecklist}
					setReviewChecklist={setReviewChecklist}
					setFormData={setFormData}
					canPay={canPay}
					handlePayment={handlePayment}
					loadingGateway={loadingGateway}
					onSubmitWizard={handleWizardSubmit}
					validarTelefono={validarTelefono}
					validarHorarioReserva={validarHorarioReserva}
					showSummary={showConfirmationAlert}
				/>
				<Servicios />
				<Destinos />
				<Destacados destinos={destacadosData} />
				<Fidelizacion />
				<PorQueElegirnos />
				<Testimonios />
				<Contacto
					formData={formData}
					handleInputChange={handleInputChange}
					handleSubmit={handleSubmit}
					origenes={origenesContacto}
					maxPasajeros={maxPasajeros}
					minDateTime={minDateTime}
					phoneError={phoneError}
					isSubmitting={isSubmitting}
					setFormData={setFormData}
				/>
			</main>

			<Footer />
		</div>
	);
}

export default App;
