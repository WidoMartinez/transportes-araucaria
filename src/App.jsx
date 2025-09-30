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
import AdminCodigos from "./components/AdminCodigos";
import CodigoDescuento from "./components/CodigoDescuento";

// --- Datos Iniciales y Lógica ---
import { destinosBase, destacadosData } from "./data/destinos";

// Descuentos ahora se cargan dinámicamente desde descuentosGlobales
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
	const [descuentosGlobales, setDescuentosGlobales] = useState({
		descuentoOnline: { valor: 5, activo: true },
		descuentoRoundTrip: { valor: 10, activo: true },
		descuentosPersonalizados: [],
	});

	// Estados para códigos de descuento
	const [codigoAplicado, setCodigoAplicado] = useState(null);
	const [codigoError, setCodigoError] = useState(null);
	const [validandoCodigo, setValidandoCodigo] = useState(false);
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

	// --- FUNCIÓN PARA RECARGAR DATOS ---
	const recargarDatosPrecios = async () => {
		console.log("🔄 INICIANDO recarga de datos de precios...");
		try {
			const apiUrl =
				import.meta.env.VITE_API_URL ||
				"https://transportes-araucaria.onrender.com";
			console.log("📡 Fetching desde:", `${apiUrl}/pricing`);
			const response = await fetch(`${apiUrl}/pricing`);
			if (!response.ok)
				throw new Error("La respuesta de la red no fue exitosa.");

			const data = await response.json();
			console.log("📥 Datos recibidos:", data);

			if (data.destinos && data.destinos.length > 0) {
				setDestinosData(data.destinos);
			} else {
				setDestinosData(destinosBase);
			}
			setPromotions(normalizePromotions(data.dayPromotions));

			// Cargar descuentos globales
			console.log(
				"🏷️ Procesando descuentos globales:",
				data.descuentosGlobales
			);
			if (data.descuentosGlobales) {
				const nuevosDescuentos = {
					descuentoOnline: {
						valor:
							data.descuentosGlobales.descuentoOnline?.valor ||
							data.descuentosGlobales.descuentoOnline ||
							5,
						activo:
							data.descuentosGlobales.descuentoOnline?.activo !== undefined
								? data.descuentosGlobales.descuentoOnline.activo
								: true,
					},
					descuentoRoundTrip: {
						valor:
							data.descuentosGlobales.descuentoRoundTrip?.valor ||
							data.descuentosGlobales.descuentoRoundTrip ||
							10,
						activo:
							data.descuentosGlobales.descuentoRoundTrip?.activo !== undefined
								? data.descuentosGlobales.descuentoRoundTrip.activo
								: true,
					},
					descuentosPersonalizados:
						data.descuentosGlobales.descuentosPersonalizados || [],
				};
				console.log("🔄 Actualizando descuentos globales a:", nuevosDescuentos);
				setDescuentosGlobales(nuevosDescuentos);
			}

			console.log("✅ Datos de precios actualizados correctamente");
			return true;
		} catch (error) {
			console.error("Error al recargar precios:", error);
			return false;
		}
	};

	// Funciones para manejar códigos de descuento
	// Generar ID único del usuario basado en datos del navegador
	const generarUsuarioId = () => {
		// Intentar obtener un ID persistente del localStorage
		let usuarioId = localStorage.getItem("usuarioId");
		if (!usuarioId) {
			// Generar un ID único basado en características del navegador
			const timestamp = Date.now();
			const random = Math.random().toString(36).substring(2);
			const userAgent = navigator.userAgent.substring(0, 20);
			usuarioId = `user_${timestamp}_${random}_${btoa(userAgent).substring(
				0,
				8
			)}`;
			localStorage.setItem("usuarioId", usuarioId);
		}
		return usuarioId;
	};

	const validarCodigo = async (codigo) => {
		setValidandoCodigo(true);
		setCodigoError(null);

		try {
			const apiUrl =
				import.meta.env.VITE_API_URL ||
				"https://transportes-araucaria.onrender.com";
			const usuarioId = generarUsuarioId();

			const response = await fetch(`${apiUrl}/api/codigos/validar`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					codigo,
					destino: formData.destino,
					monto: cotizacion.precio || 0,
					usuarioId,
				}),
			});

			const result = await response.json();

			if (result.valido) {
				setCodigoAplicado(result.codigo);
				setCodigoError(null);
			} else {
				setCodigoError(result.error);
				setCodigoAplicado(null);
			}
		} catch (error) {
			setCodigoError("Error validando código");
			setCodigoAplicado(null);
		} finally {
			setValidandoCodigo(false);
		}
	};

	const removerCodigo = () => {
		setCodigoAplicado(null);
		setCodigoError(null);
	};

	// --- CARGA DE DATOS DINÁMICA ---
	useEffect(() => {
		const fetchPreciosDesdeAPI = async () => {
			setLoadingPrecios(true);
			const success = await recargarDatosPrecios();
			if (!success) {
				setDestinosData(destinosBase);
				setPromotions([]);
			}
			setLoadingPrecios(false);
		};
		fetchPreciosDesdeAPI();
	}, []);

	// --- EFECTO PARA ESCUCHAR CAMBIOS DE CONFIGURACIÓN ---
	useEffect(() => {
		const handleStorageChange = (e) => {
			if (e.key === "pricing_updated") {
				console.log(
					"🔄 Detectado cambio en configuración de precios, recargando..."
				);
				recargarDatosPrecios();
			}
		};

		window.addEventListener("storage", handleStorageChange);

		// También escuchar eventos personalizados
		const handlePricingUpdate = () => {
			console.log("🔄 Recargando precios por evento personalizado...");
			recargarDatosPrecios();
		};

		window.addEventListener("pricing_updated", handlePricingUpdate);

		// Polling cada 30 segundos para verificar cambios (como respaldo)
		const pollingInterval = setInterval(async () => {
			const lastUpdate = localStorage.getItem("pricing_updated");
			const lastCheck = localStorage.getItem("last_pricing_check") || "0";

			if (lastUpdate && parseInt(lastUpdate) > parseInt(lastCheck)) {
				console.log("🔄 Polling detectó cambios en precios, recargando...");
				await recargarDatosPrecios();
				localStorage.setItem("last_pricing_check", Date.now().toString());
			}
		}, 30000); // 30 segundos

		return () => {
			window.removeEventListener("storage", handleStorageChange);
			window.removeEventListener("pricing_updated", handlePricingUpdate);
			clearInterval(pollingInterval);
		};
	}, []);

	// Hacer la función de recarga disponible globalmente para el panel admin
	useEffect(() => {
		window.recargarDatosPrecios = recargarDatosPrecios;

		// Agregar atajo de teclado Ctrl+Shift+U para actualizar precios
		const handleKeyDown = (e) => {
			if (e.ctrlKey && e.shiftKey && e.key === "U") {
				e.preventDefault();
				console.log("🔄 Actualizando precios por atajo de teclado...");
				recargarDatosPrecios();
			}
		};

		document.addEventListener("keydown", handleKeyDown);

		return () => {
			delete window.recargarDatosPrecios;
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [recargarDatosPrecios]);

	// Código duplicado removido - ya está en recargarDatosPrecios

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

		// console.log("🔍 DEBUG FILTRO PROMOCIONES:", {
		// 	tramo,
		// 	isRoundTrip,
		// 	esViajeIda,
		// 	esViajeVuelta,
		// 	promotions: promotions.length,
		// });

		return promotions.filter((promo) => {
			// console.log("🔍 Evaluando promoción:", {
			// 	promo: promo.nombre,
			// 	destino: promo.destino,
			// 	tramo,
			// 	coincide: promo.destino === tramo,
			// 	descuento: promo.descuentoPorcentaje,
			// });

			if (!promo.destino || promo.destino !== tramo) return false;
			if (promo.descuentoPorcentaje <= 0) return false;

			// Filtro por tipo de viaje
			const tipoViaje = promo.aplicaTipoViaje;
			if (tipoViaje) {
				if (isRoundTrip) {
					// Para viajes de ida y vuelta, puede aplicar si:
					// 1. Está habilitado "ambos" (aplica a ambos tramos)
					// 2. Está habilitado "ida" y es viaje de ida (primer tramo)
					// 3. Está habilitado "vuelta" y es viaje de vuelta (segundo tramo)
					const aplicaAmbos = tipoViaje.ambos;
					const aplicaIda = tipoViaje.ida && esViajeIda;
					const aplicaVuelta = tipoViaje.vuelta && esViajeVuelta;

					if (!aplicaAmbos && !aplicaIda && !aplicaVuelta) return false;
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

	// Debug específico para promociones (comentado para reducir ruido)
	// console.log("🎯 DEBUG PROMOCIONES:", {
	// 	applicablePromotions,
	// 	activePromotion,
	// 	promotionDiscountRate,
	// 	destinoSeleccionado: destinoSeleccionado?.nombre,
	// 	origen: formData.origen,
	// 	destino: formData.destino,
	// 	idaVuelta: formData.idaVuelta,
	// });
	// Calcular descuentos dinámicos desde descuentosGlobales
	const onlineDiscountRate =
		descuentosGlobales?.descuentoOnline?.activo &&
		descuentosGlobales?.descuentoOnline?.valor
			? descuentosGlobales.descuentoOnline.valor / 100
			: 0;

	// Debug: mostrar descuentos actuales cuando cambien (comentado para reducir ruido)
	// useEffect(() => {
	// 	console.log("💰 DESCUENTOS ACTUALES:", {
	// 		descuentosGlobales,
	// 		onlineDiscountRate,
	// 		roundTripDiscountRate:
	// 			formData.idaVuelta &&
	// 			descuentosGlobales?.descuentoRoundTrip?.activo &&
	// 			descuentosGlobales?.descuentoRoundTrip?.valor
	// 				? descuentosGlobales.descuentoRoundTrip.valor / 100
	// 				: 0,
	// 	});
	// }, [descuentosGlobales, formData.idaVuelta]);

	const roundTripDiscountRate =
		formData.idaVuelta &&
		descuentosGlobales?.descuentoRoundTrip?.activo &&
		descuentosGlobales?.descuentoRoundTrip?.valor
			? descuentosGlobales.descuentoRoundTrip.valor / 100
			: 0;

	// Calcular descuentos personalizados activos
	const personalizedDiscountRate =
		descuentosGlobales?.descuentosPersonalizados
			?.filter((desc) => desc.activo && desc.valor > 0)
			.reduce((sum, desc) => sum + desc.valor / 100, 0) || 0;

	const effectiveDiscountRate = Math.min(
		onlineDiscountRate +
			promotionDiscountRate +
			roundTripDiscountRate +
			personalizedDiscountRate,
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

		// 1. DESCUENTOS GLOBALES (se aplican a cualquier tramo)
		// Descuento online por reservar (se aplica a cada tramo)
		const descuentoOnlinePorTramo = Math.round(precioIda * onlineDiscountRate);
		const descuentoOnline = formData.idaVuelta
			? descuentoOnlinePorTramo * 2
			: descuentoOnlinePorTramo;

		// Descuentos personalizados (se aplican a cada tramo)
		const descuentosPersonalizadosPorTramo = Math.round(
			precioIda * personalizedDiscountRate
		);
		const descuentosPersonalizados = formData.idaVuelta
			? descuentosPersonalizadosPorTramo * 2
			: descuentosPersonalizadosPorTramo;

		// 2. PROMOCIONES POR TRAMO (se aplican según configuración específica)
		// Estas se calculan por tramo individual, no sobre el total
		const descuentoPromocionPorTramo = Math.round(
			precioIda * (promotionDiscountRate || 0)
		);
		const descuentoPromocion = formData.idaVuelta
			? descuentoPromocionPorTramo * 2
			: descuentoPromocionPorTramo;

		// 3. DESCUENTO IDA Y VUELTA (solo cuando se selecciona ida y vuelta)
		const descuentoRoundTrip = formData.idaVuelta
			? Math.round(precioBase * (roundTripDiscountRate || 0))
			: 0;

		// 4. DESCUENTO POR CÓDIGO
		let descuentoCodigo = 0;
		if (codigoAplicado) {
			if (codigoAplicado.tipo === "porcentaje") {
				descuentoCodigo = Math.round(precioBase * (codigoAplicado.valor / 100));
			} else {
				descuentoCodigo = Math.min(codigoAplicado.valor, precioBase);
			}
			// console.log("🎟️ DEBUG CÓDIGO APLICADO:", {
			// 	codigoAplicado,
			// 	precioBase,
			// 	descuentoCodigo,
			// 	tipo: codigoAplicado.tipo,
			// 	valor: codigoAplicado.valor,
			// });
		}

		// Calcular descuento total
		const descuentoTotalSinLimite =
			descuentoOnline +
			descuentoPromocion +
			descuentoRoundTrip +
			descuentosPersonalizados +
			descuentoCodigo;

		// Aplicar límite del 75% al precio base
		const descuentoMaximo = Math.round(precioBase * 0.75);
		const descuentoOnlineTotal = Math.min(
			descuentoTotalSinLimite,
			descuentoMaximo
		);

		const totalConDescuento = Math.max(precioBase - descuentoOnlineTotal, 0);
		const abono = Math.round(totalConDescuento * 0.4);
		const saldoPendiente = Math.max(totalConDescuento - abono, 0);

		// Debug específico para verificar el total final (comentado para reducir ruido)
		// console.log("💰 TOTAL FINAL CALCULADO:", {
		// 	precioBase,
		// 	descuentoOnlineTotal,
		// 	totalConDescuento,
		// 	abono,
		// 	saldoPendiente,
		// 	descuentoCodigo,
		// 	codigoAplicado: codigoAplicado?.codigo,
		// });

		// Debug: mostrar información de descuentos (comentado para reducir ruido)
		// console.log("💰 DEBUG PRICING CORREGIDO:", {
		// 	precioIda,
		// 	precioBase,
		// 	idaVuelta: formData.idaVuelta,
		// 	onlineDiscountRate,
		// 	promotionDiscountRate,
		// 	roundTripDiscountRate,
		// 	personalizedDiscountRate,
		// 	descuentoOnlinePorTramo,
		// 	descuentoOnline,
		// 	descuentoPromocionPorTramo,
		// 	descuentoPromocion,
		// 	descuentoRoundTrip,
		// 	descuentosPersonalizados,
		// 	descuentoCodigo,
		// 	descuentoTotalSinLimite,
		// 	descuentoMaximo,
		// 	descuentoOnlineTotal,
		// 	effectiveDiscountRate,
		// 	activePromotion,
		// 	applicablePromotions,
		// 	codigoAplicado,
		// });

		return {
			precioBase,
			descuentoBase: descuentoOnline, // Para mantener compatibilidad
			descuentoPromocion,
			descuentoRoundTrip,
			descuentosPersonalizados,
			descuentoCodigo,
			descuentoOnline: descuentoOnlineTotal,
			totalConDescuento,
			abono,
			saldoPendiente,
		};
	}, [
		cotizacion.precio,
		promotionDiscountRate,
		roundTripDiscountRate,
		onlineDiscountRate,
		personalizedDiscountRate,
		formData.idaVuelta,
		codigoAplicado,
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
			descuentosPersonalizados: pricing.descuentosPersonalizados,
			descuentoOnline,
			totalConDescuento,
			abonoSugerido: abono,
			saldoPendiente,
			source,
		};
		if (!dataToSend.nombre?.trim()) {
			dataToSend.nombre = "Cliente Potencial (Cotización Rápida)";
		}
		// Usar el servidor backend de Render para todas las peticiones
		const apiUrl =
			import.meta.env.VITE_API_URL ||
			"https://transportes-araucaria.onrender.com";
		const emailApiUrl = `${apiUrl}/enviar-reserva`;
		const headers = { "Content-Type": "application/json" };

		try {
			const response = await fetch(emailApiUrl, {
				method: "POST",
				headers,
				body: JSON.stringify(dataToSend),
			});
			const result = await response.json();
			if (!response.ok)
				throw new Error(result.message || "Error en el servidor.");
			setReviewChecklist({ viaje: false, contacto: false });
			setShowConfirmationAlert(true);
			if (typeof gtag === "function") {
				gtag("event", "conversion", {
					send_to: `AW-17529712870/8GVlCLP-05MbEObh6KZB`,
				});
			}

			// Registrar el uso del código si hay uno aplicado
			if (codigoAplicado) {
				try {
					const apiUrl =
						import.meta.env.VITE_API_URL ||
						"https://transportes-araucaria.onrender.com";
					const usuarioId = generarUsuarioId();

					await fetch(`${apiUrl}/api/codigos/usar`, {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							codigo: codigoAplicado.codigo,
							usuarioId,
						}),
					});

					console.log("✅ Uso del código registrado exitosamente");
				} catch (error) {
					console.error("Error registrando uso del código:", error);
					// No mostramos error al usuario ya que la reserva ya se procesó
				}
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
		// Verificar si es panel de códigos
		const urlParams = new URLSearchParams(window.location.search);
		const panel = urlParams.get("panel");

		if (panel === "codigos") {
			return <AdminCodigos />;
		}

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
					baseDiscountRate={onlineDiscountRate}
					promotionDiscountRate={promotionDiscountRate}
					roundTripDiscountRate={roundTripDiscountRate}
					personalizedDiscountRate={personalizedDiscountRate}
					descuentosPersonalizados={
						descuentosGlobales?.descuentosPersonalizados || []
					}
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
					codigoAplicado={codigoAplicado}
					codigoError={codigoError}
					validandoCodigo={validandoCodigo}
					onAplicarCodigo={validarCodigo}
					onRemoverCodigo={removerCodigo}
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
