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
// Hero eliminado - solo flujo express disponible
import HeroExpress from "./components/HeroExpress";
import Servicios from "./components/Servicios";
import Destinos from "./components/Destinos";
import Destacados from "./components/Destacados";
import PorQueElegirnos from "./components/PorQueElegirnos";
import Testimonios from "./components/Testimonios";
import Contacto from "./components/Contacto";
import FletesLanding from "./components/FletesLanding";
import Footer from "./components/Footer";
import Fidelizacion from "./components/Fidelizacion";
import AdminDashboard from "./components/AdminDashboard";
import CodigoDescuento from "./components/CodigoDescuento";
import ConsultarReserva from "./components/ConsultarReserva";
import PagarConCodigo from "./components/PagarConCodigo";
import CompletarDetalles from "./components/CompletarDetalles"; // Importar componente
import { getBackendUrl } from "./lib/backend";

// --- Datos Iniciales y Lógica ---
import { destinosBase, destacadosData } from "./data/destinos";

// Descuentos ahora se cargan dinámicamente desde descuentosGlobales
const ROUND_TRIP_DISCOUNT = 0.05;

const parsePromotionMetadata = (promo) => {
	if (!promo || typeof promo.descripcion !== "string") return null;
	try {
		const parsed = JSON.parse(promo.descripcion);
		return parsed && typeof parsed === "object" && !Array.isArray(parsed)
			? parsed
			: null;
	} catch (error) {
		return null;
	}
};

const normalizePromotions = (promotions = []) => {
	if (!Array.isArray(promotions)) return [];
	return promotions.filter(Boolean).map((promo, index) => {
		const metadata = parsePromotionMetadata(promo);
		const id = metadata?.sourceId || promo.id || `promo-${index}`;
		const diasMetadata = Array.isArray(metadata?.dias)
			? metadata.dias.filter(Boolean)
			: [];
		const aplicaPorDias =
			metadata?.aplicaPorDias ?? Boolean(promo.aplicaPorDias);
		const dias = aplicaPorDias
			? diasMetadata.length > 0
				? diasMetadata
				: Array.isArray(promo.dias)
				? promo.dias.filter(Boolean)
				: metadata?.diaIndividual
				? [metadata.diaIndividual]
				: []
			: [];
		const porcentaje = Number(
			metadata?.porcentaje ?? promo.descuentoPorcentaje ?? 0
		);
		const aplicaTipoViajeMetadata = metadata?.aplicaTipoViaje || {};

		return {
			id,
			destino: metadata?.destino ?? promo.destino ?? "",
			descripcion: metadata?.descripcion ?? promo.descripcion ?? "",
			aplicaPorDias,
			dias,
			aplicaPorHorario:
				metadata?.aplicaPorHorario ?? Boolean(promo.aplicaPorHorario),
			horaInicio: metadata?.horaInicio ?? promo.horaInicio ?? "",
			horaFin: metadata?.horaFin ?? promo.horaFin ?? "",
			descuentoPorcentaje: Number.isFinite(porcentaje) ? porcentaje : 0,
			aplicaTipoViaje: {
				ida:
					metadata?.aplicaTipoViaje?.ida ?? promo.aplicaTipoViaje?.ida ?? false,
				vuelta:
					metadata?.aplicaTipoViaje?.vuelta ??
					promo.aplicaTipoViaje?.vuelta ??
					false,
				ambos:
					metadata?.aplicaTipoViaje?.ambos ??
					promo.aplicaTipoViaje?.ambos ??
					true,
			},
			activo: metadata?.activo ?? promo.activo ?? true,
		};
	});
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

const resolveIsFreightView = () => {
	if (typeof window === "undefined") return false;
	const pathname = window.location.pathname.toLowerCase();
	const hash = window.location.hash.toLowerCase();
	return (
		pathname === "/fletes" ||
		pathname.startsWith("/fletes/") ||
		hash === "#fletes"
	);
};

// Resolver si la URL es para consultar reserva
const resolveIsConsultaView = () => {
	const hash = window.location.hash;
	return hash === "#consultar-reserva" || hash === "#consulta";
};

// Resolver si la URL es para pagar con código
const resolveIsPayCodeView = () => {
	const hash = window.location.hash.toLowerCase();
	return hash === "#pagar-con-codigo" || hash === "#pago-codigo";
};

function App() {
	const [isFreightView, setIsFreightView] = useState(resolveIsFreightView);
	const [isAdminView, setIsAdminView] = useState(resolveIsAdminView);
	const [isConsultaView, setIsConsultaView] = useState(resolveIsConsultaView);
	const [isPayCodeView, setIsPayCodeView] = useState(resolveIsPayCodeView);
	const [destinosData, setDestinosData] = useState(destinosBase);
	const [promotions, setPromotions] = useState([]);
	const [descuentosGlobales, setDescuentosGlobales] = useState({
		descuentoOnline: { valor: 5, activo: true },
		descuentoRoundTrip: { valor: 10, activo: true },
		descuentosPersonalizados: [],
	});

	// Estado para vista de completar detalles post-pago
	const [vistaCompletarDetalles, setVistaCompletarDetalles] = useState({
		activo: false,
		reservaId: null,
	});

	// Estados para códigos de descuento
	const [codigoAplicado, setCodigoAplicado] = useState(null);
	const [codigoError, setCodigoError] = useState(null);
	const [validandoCodigo, setValidandoCodigo] = useState(false);
	const [loadingPrecios, setLoadingPrecios] = useState(false);

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
	const [codigoReservaCreada, setCodigoReservaCreada] = useState("");
	const [phoneError, setPhoneError] = useState("");
	const [reviewChecklist, setReviewChecklist] = useState({
		viaje: false,
		contacto: false,
	});
	const [loadingGateway, setLoadingGateway] = useState(null);

	// Sincronizar vista de Fletes cuando cambia el hash o el historial
	useEffect(() => {
		const syncFreight = () => setIsFreightView(resolveIsFreightView());
		window.addEventListener("hashchange", syncFreight);
		window.addEventListener("popstate", syncFreight);
		return () => {
			window.removeEventListener("hashchange", syncFreight);
			window.removeEventListener("popstate", syncFreight);
		};
	}, []);

	// Sincronizar vista de Consulta por Código cuando cambia el hash o el historial
	useEffect(() => {
		const syncConsulta = () => setIsConsultaView(resolveIsConsultaView());
		window.addEventListener("hashchange", syncConsulta);
		window.addEventListener("popstate", syncConsulta);
		return () => {
			window.removeEventListener("hashchange", syncConsulta);
			window.removeEventListener("popstate", syncConsulta);
		};
	}, []);

	// Sincronizar vista de pago con código
	useEffect(() => {
		const syncPayCode = () => setIsPayCodeView(resolveIsPayCodeView());
		window.addEventListener("hashchange", syncPayCode);
		window.addEventListener("popstate", syncPayCode);
		return () => {
			window.removeEventListener("hashchange", syncPayCode);
			window.removeEventListener("popstate", syncPayCode);
		};
	}, []);

	// --- LÓGICA PARA MANEJAR RETORNO DE PAGO ---
	useEffect(() => {
		const url = new URL(window.location.href);
		const flowSuccess = url.searchParams.get("flow_payment") === "success";
		const reservaId = url.searchParams.get("reserva_id");

		if (flowSuccess && reservaId) {
			console.log(
				`✅ Retorno de pago exitoso detectado para reserva ID: ${reservaId}`
			);
			setVistaCompletarDetalles({
				activo: true,
				reservaId: reservaId,
			});

			// Limpiar URL para evitar reactivación
			window.history.replaceState(null, "", window.location.pathname);
		}
	}, []);

	// ID de la reserva para asociar pagos (webhook)
	const [reservationId, setReservationId] = useState(null);

	// Solo flujo express disponible - flujo normal eliminado

	// --- FUNCION PARA APLICAR DATOS DE PRECIOS ---
	const applyPricingPayload = useCallback((data, { signal } = {}) => {
		if (!data || signal?.aborted) {
			return false;
		}

		const destinosNormalizados =
			Array.isArray(data.destinos) && data.destinos.length > 0
				? data.destinos
				: destinosBase;

		if (signal?.aborted) {
			return false;
		}
		setDestinosData(destinosNormalizados);

		if (signal?.aborted) {
			return false;
		}
		setPromotions(normalizePromotions(data.dayPromotions));

		if (signal?.aborted) {
			return true;
		}

		if (data.descuentosGlobales) {
			const nuevosDescuentos = {
				descuentoOnline: {
					valor:
						data.descuentosGlobales.descuentoOnline?.valor ??
						data.descuentosGlobales.descuentoOnline ??
						5,
					activo:
						data.descuentosGlobales.descuentoOnline?.activo !== undefined
							? data.descuentosGlobales.descuentoOnline.activo
							: true,
				},
				descuentoRoundTrip: {
					valor:
						data.descuentosGlobales.descuentoRoundTrip?.valor ??
						data.descuentosGlobales.descuentoRoundTrip ??
						10,
					activo:
						data.descuentosGlobales.descuentoRoundTrip?.activo !== undefined
							? data.descuentosGlobales.descuentoRoundTrip.activo
							: true,
				},
				descuentosPersonalizados:
					data.descuentosGlobales.descuentosPersonalizados || [],
			};
			if (signal?.aborted) {
				return true;
			}
			setDescuentosGlobales(nuevosDescuentos);
		}

		return true;
	}, []);

	// --- FUNCION PARA RECARGAR DATOS ---
	const recargarDatosPrecios = useCallback(
		async ({ signal, payload } = {}) => {
			console.log("?? INICIANDO recarga de datos de precios... v2.1");
			try {
				let data = payload;

				if (!data) {
					const apiUrl =
						getBackendUrl() || "https://transportes-araucaria.onrender.com";
					console.log("?? Fetching desde:", `${apiUrl}/pricing`);

					const response = await fetch(`${apiUrl}/pricing`, {
						signal,
					});
					if (!response.ok) {
						throw new Error("La respuesta de la red no fue exitosa.");
					}
					data = await response.json();
				} else {
					console.log("?? Aplicando payload de precios ya disponible");
				}

				if (signal?.aborted) {
					console.warn("?? Recarga abortada antes de aplicar los datos");
					return false;
				}

				const applied = applyPricingPayload(data, { signal });

				if (!applied && !payload) {
					console.warn(
						"?? No se pudieron aplicar los datos de precios recibidos"
					);
				}
				return applied;
			} catch (error) {
				if (error.name == "AbortError") {
					console.warn("Recarga de precios cancelada por cambio de vista");
					throw error;
				}
				console.error("Error al recargar precios:", error);
				return false;
			}
		},
		[applyPricingPayload]
	);

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
				getBackendUrl() || "https://transportes-araucaria.onrender.com";
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

	// --- CARGA DE DATOS DINAMICA ---
	useEffect(() => {
		if (typeof window === "undefined") return;

		const controller = new AbortController();
		let isActive = true;

		const cargarPrecios = async () => {
			setLoadingPrecios(true);
			try {
				const success = await recargarDatosPrecios({
					signal: controller.signal,
				});
				if (!success && isActive && !controller.signal.aborted) {
					setDestinosData(destinosBase);
					setPromotions([]);
				}
			} catch (error) {
				if (error.name == "AbortError") {
					return;
				}
				if (isActive) {
					setDestinosData(destinosBase);
					setPromotions([]);
				}
			} finally {
				if (isActive) {
					setLoadingPrecios(false);
				}
			}
		};

		cargarPrecios();

		return () => {
			isActive = false;
			controller.abort();
		};
	}, [recargarDatosPrecios]);

	// --- EFECTO PARA ESCUCHAR CAMBIOS DE CONFIGURACIÓN ---
	useEffect(() => {
		const handleStorageChange = (e) => {
			if (e.key === "pricing_updated_payload" && e.newValue) {
				try {
					const payload = JSON.parse(e.newValue);
					recargarDatosPrecios({ payload }).catch((error) => {
						if (error?.name !== "AbortError") {
							console.error(
								"Error aplicando payload de precios desde storage:",
								error
							);
						}
					});
					return;
				} catch (parseError) {
					console.warn(
						"No se pudo parsear payload de precios desde storage:",
						parseError
					);
				}
			}

			if (e.key === "pricing_updated") {
				console.log(
					"?? Detectado cambio en configuracion de precios, recargando..."
				);
				recargarDatosPrecios().catch((error) => {
					if (error?.name !== "AbortError") {
						console.error(
							"Error recargando precios tras cambio en storage:",
							error
						);
					}
				});
			}
		};

		window.addEventListener("storage", handleStorageChange);

		// Tambien escuchar eventos personalizados
		const handlePricingUpdate = (event) => {
			console.log("?? Recargando precios por evento personalizado...");
			const payload = event?.detail;
			if (payload) {
				recargarDatosPrecios({ payload }).catch((error) => {
					if (error?.name !== "AbortError") {
						console.error(
							"Error aplicando payload de precios desde evento:",
							error
						);
					}
				});
				return;
			}
			recargarDatosPrecios().catch((error) => {
				if (error?.name !== "AbortError") {
					console.error("Error recargando precios desde evento:", error);
				}
			});
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
		const safePromotions = Array.isArray(promotions) ? promotions : [];
		if (safePromotions.length === 0) return [];
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
		// 	promotions: safePromotions.length,
		// });

		return safePromotions.filter((promo) => {
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
				const diasPromo = Array.isArray(promo.dias) ? promo.dias : [];
				if (diasPromo.length === 0) return false;
				const hasMatch = tags.some((tag) => diasPromo.includes(tag));
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
		const promos = Array.isArray(applicablePromotions)
			? applicablePromotions
			: [];
		if (promos.length === 0) return null;
		return promos.reduce(
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
		const handleLocationChange = () => {
			setIsAdminView(resolveIsAdminView());
			setIsFreightView(resolveIsFreightView());
		};
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

	const handlePayment = async (gateway, type = "abono", identificadores = {}) => {
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

		const reservaIdParaPago = identificadores.reservaId ?? reservationId;
		const codigoReservaParaPago =
			identificadores.codigoReserva ?? codigoReservaCreada;

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
			getBackendUrl() || "https://transportes-araucaria.onrender.com";

		try {
			// CORRECCIÓN: Validar que tengamos los datos necesarios antes de crear el pago
			// Si no hay identificadores, significa que la reserva no se creó correctamente
			if (!reservaIdParaPago && !codigoReservaParaPago) {
				throw new Error(
					"No se pudo identificar la reserva. Por favor, intenta nuevamente."
				);
			}

			const response = await fetch(`${apiUrl}/create-payment`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					gateway,
					amount,
					description,
					email: formData.email,
					reservaId: reservaIdParaPago || null,
					codigoReserva: codigoReservaParaPago || null, // CORRECCIÓN: Incluir código de reserva
					tipoPago: type,
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

	// ELIMINADO - Solo flujo express disponible
	/* 
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

		// Enviar notificación por correo usando el archivo PHP de Hostinger
		try {
			// Usar endpoint absoluto para evitar problemas de CORS y ejecución PHP
			const emailResponse = await fetch(
				"https://www.transportesaraucaria.cl/enviar_correo_mejorado.php",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(dataToSend),
				}
			);

			if (emailResponse.ok) {
				const emailResult = await emailResponse.json();
				console.log("✅ Correo enviado exitosamente:", emailResult);
				// Guardar el ID de la reserva para asociar pagos posteriores
				if (emailResult && emailResult.id_reserva) {
					setReservationId(emailResult.id_reserva);
				}
			} else {
				console.warn("⚠️ Error al enviar correo:", await emailResponse.text());
			}
		} catch (emailError) {
			console.error("❌ Error al enviar notificación por correo:", emailError);
			// No interrumpimos el flujo si falla el correo
		}

		// Usar el servidor backend de Render para todas las peticiones
		const apiUrl = getBackendUrl() || "https://transportes-araucaria.onrender.com";
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
			
			// Guardar el código de reserva si existe en la respuesta
			if (result.codigoReserva) {
				setCodigoReservaCreada(result.codigoReserva);
			}
			
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
					const apiUrl = getBackendUrl() || "https://transportes-araucaria.onrender.com";
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
	*/

	const handleSubmit = async (e) => {
		e.preventDefault();
		// Cambio: ahora solo usa flujo express
		const result = await enviarReservaExpress("Formulario de Contacto Express");
		if (!result.success && result.message) alert(result.message);
	};

	// Función para enviar reserva express (flujo simplificado)
	const enviarReservaExpress = async (source) => {
		if (!validarTelefono(formData.telefono)) {
			setPhoneError(
				"Introduce un número de móvil chileno válido (ej: +56 9 1234 5678)."
			);
			return { success: false, error: "telefono" };
		}
		setPhoneError("");

		if (isSubmitting) return { success: false, error: "procesando" };
		setIsSubmitting(true);

		const destinoFinal =
			formData.destino === "Otro" ? formData.otroDestino : formData.destino;

		const dataToSend = {
			nombre: formData.nombre,
			email: formData.email,
			telefono: formData.telefono,
			origen: formData.origen,
			destino: destinoFinal,
			fecha: formData.fecha,
			pasajeros: formData.pasajeros,
			idaVuelta: formData.idaVuelta,
			fechaRegreso: formData.fechaRegreso,
			source,

			// Datos de pricing calculados
			precio: cotizacion.precio,
			vehiculo: cotizacion.vehiculo,
			abonoSugerido: pricing.abono,
			saldoPendiente: pricing.saldoPendiente,
			descuentoBase: pricing.descuentoBase,
			descuentoPromocion: pricing.descuentoPromocion,
			descuentoRoundTrip: pricing.descuentoRoundTrip,
			descuentoOnline: pricing.descuentoOnline,
			totalConDescuento: pricing.totalConDescuento,
			codigoDescuento: codigoAplicado?.codigo || "",
			// Estado inicial: marcar como pendiente hasta confirmar pago
			estado: "pendiente",
			estadoPago: "pendiente",
			pagoMonto: 0,
		};

		// Enviar hora solo si el usuario la proporcionó (evita que el backend asuma 08:00)
		if (formData.hora) {
			dataToSend.hora = formData.hora;
		}

		console.log("📦 Enviando reserva express:", dataToSend);

		// Ya NO llamamos al PHP aquí, el backend de Node.js lo hará automáticamente
		// después de guardar la reserva y generar el código

		/* COMENTADO - Ahora el backend llama al PHP automáticamente
		try {
			const emailResponse = await fetch(
				"https://www.transportesaraucaria.cl/enviar_correo_mejorado.php",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(dataToSend),
				}
			);

			if (emailResponse.ok) {
				const emailResult = await emailResponse.json();
				console.log(
					"✅ Correo de notificación enviado exitosamente:",
					emailResult
				);
				// Guardar el ID de la reserva del PHP si está disponible
				if (emailResult && emailResult.id_reserva) {
					setReservationId(emailResult.id_reserva);
				}
			} else {
				console.warn(
					"⚠️ Error al enviar correo de notificación:",
					await emailResponse.text()
				);
			}
		} catch (emailError) {
			console.error("❌ Error al enviar notificación por correo:", emailError);
			// No interrumpimos el flujo si falla el correo
		}
		FIN DEL COMENTARIO */

		try {
			const apiUrl =
				getBackendUrl() || "https://transportes-araucaria.onrender.com";
			const response = await fetch(`${apiUrl}/enviar-reserva-express`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(dataToSend),
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.message || "Error en el servidor.");
			}

			console.log("✅ Reserva express creada:", result);

			// Guardar ID de reserva para asociar pagos
			if (result.reservaId) {
				setReservationId(result.reservaId);
			}

			// Guardar código de reserva para mostrarlo al usuario
			if (result.codigoReserva) {
				setCodigoReservaCreada(result.codigoReserva);
				console.log("📋 Código de reserva generado:", result.codigoReserva);
			}

			// Registrar conversión
			if (typeof gtag === "function") {
				gtag("event", "conversion", {
					send_to: `AW-17529712870/8GVlCLP-05MbEObh6KZB`,
				});
			}

			// Registrar uso del código si hay uno aplicado
			if (codigoAplicado) {
				try {
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
				}
			}

			// CORRECCIÓN: Incluir codigoReserva en el resultado para una mejor trazabilidad
			return { 
				success: true, 
				reservaId: result.reservaId,
				codigoReserva: result.codigoReserva 
			};
		} catch (error) {
			console.error("Error al enviar reserva express:", error);
			return { success: false, error: "server", message: error.message };
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleWizardSubmit = () => {
		// Solo flujo express disponible
		return enviarReservaExpress("Reserva Express Web");
	};

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

	if (isFreightView) {
		return <FletesLanding />;
	}

	if (isAdminView) {
		return <AdminDashboard />;
	}

	if (isConsultaView) {
		return <ConsultarReserva />;
	}

	if (isPayCodeView) {
		return <PagarConCodigo />;
	}

	// Vista para completar detalles después del pago
	if (vistaCompletarDetalles.activo) {
		return (
			<CompletarDetalles
				reservaId={vistaCompletarDetalles.reservaId}
				onComplete={() => {
					console.log("✅ Detalles completados, volviendo al inicio.");
					setVistaCompletarDetalles({ activo: false, reservaId: null });
					// Opcional: Redirigir a una página de agradecimiento
					window.location.href = "/";
				}}
				onCancel={() => {
					console.log("🛑 Cancelado, volviendo al inicio.");
					setVistaCompletarDetalles({ activo: false, reservaId: null });
					window.location.href = "/";
				}}
			/>
		);
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
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle className="text-2xl text-green-600">
							✅ ¡Reserva Enviada Correctamente!
						</DialogTitle>
						<DialogDescription>
							Tu solicitud de reserva ha sido recibida con éxito.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-4">
						{codigoReservaCreada && (
							<div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
								<p className="text-sm font-medium text-blue-700 mb-1">
									Código de Reserva
								</p>
								<p className="text-2xl font-bold text-blue-900 tracking-wider font-mono">
									{codigoReservaCreada}
								</p>
								<p className="text-xs text-blue-600 mt-2">
									Guarda este código para consultar tu reserva
								</p>
							</div>
						)}
						<p className="text-sm text-muted-foreground">
							Te enviaremos una confirmación por correo electrónico con todos
							los detalles de tu viaje.
						</p>
						<p className="text-sm text-muted-foreground">
							Nuestro equipo revisará tu solicitud y te contactará pronto.
						</p>
					</div>
					<DialogFooter className="sm:justify-between gap-2">
						{codigoReservaCreada && (
							<Button
								variant="outline"
								onClick={() => (window.location.href = `#consultar-reserva`)}
							>
								Consultar Reserva
							</Button>
						)}
						<DialogClose asChild>
							<Button type="button">Entendido</Button>
						</DialogClose>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Header />

			<main>
				{/* Solo flujo express disponible */}
				<HeroExpress
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
					baseDiscountRate={onlineDiscountRate}
					promotionDiscountRate={promotionDiscountRate}
					handlePayment={handlePayment}
					loadingGateway={loadingGateway}
					onSubmitWizard={handleWizardSubmit}
					validarTelefono={validarTelefono}
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
