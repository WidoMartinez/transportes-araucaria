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
import { LoaderCircle } from "lucide-react";

// --- Componentes de Sección ---
import Header from "./components/Header";
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
import ConsultarReserva from "./components/ConsultarReserva";
import PagarConCodigo from "./components/PagarConCodigo";
import { getBackendUrl } from "./lib/backend";

// --- Datos Iniciales y Lógica ---
import { destinosBase, destacadosData } from "./data/destinos";

// ... (El resto de las funciones de ayuda como parsePromotionMetadata, normalizePromotions, etc., se mantienen igual)
const parsePromotionMetadata = (promo) => {
	if (!promo || typeof promo.descripcion !== "string") return null;
	try {
		const parsed = JSON.parse(promo.descripcion);
		return parsed && typeof parsed === "object" && !Array.isArray(parsed)
			? parsed
			: null;
	} catch {
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
	// ... (Estados se mantienen igual)
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

	// Estados para códigos de descuento
	const [codigoAplicado] = useState(null);
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
	// ID de la reserva para asociar pagos (webhook)
	const [reservationId, setReservationId] = useState(null);
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
	}, [recargarDatosPrecios]);

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

		return safePromotions.filter((promo) => {
			if (!promo.destino || promo.destino !== tramo) return false;
			if (promo.descuentoPorcentaje <= 0) return false;

			// Filtro por tipo de viaje
			const tipoViaje = promo.aplicaTipoViaje;
			if (tipoViaje) {
				if (isRoundTrip) {
					const aplicaAmbos = tipoViaje.ambos;
					const aplicaIda = tipoViaje.ida && esViajeIda;
					const aplicaVuelta = tipoViaje.vuelta && esViajeVuelta;

					if (!aplicaAmbos && !aplicaIda && !aplicaVuelta) return false;
				} else {
					// Para viajes de una sola dirección
					if (esViajeIda) {
						if (!tipoViaje.ida && !tipoViaje.ambos) return false;
					} else if (esViajeVuelta) {
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
	const onlineDiscountRate =
		descuentosGlobales?.descuentoOnline?.activo &&
		descuentosGlobales?.descuentoOnline?.valor
			? descuentosGlobales.descuentoOnline.valor / 100
			: 0;

	const roundTripDiscountRate =
		formData.idaVuelta &&
		descuentosGlobales?.descuentoRoundTrip?.activo &&
		descuentosGlobales?.descuentoRoundTrip?.valor
			? descuentosGlobales.descuentoRoundTrip.valor / 100
			: 0;

	const personalizedDiscountRate =
		descuentosGlobales?.descuentosPersonalizados
			?.filter((desc) => desc.activo && desc.valor > 0)
			.reduce((sum, desc) => sum + desc.valor / 100, 0) || 0;

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

	const pricing = useMemo(() => {
		const precioIda = cotizacion.precio || 0;
		const precioBase = formData.idaVuelta ? precioIda * 2 : precioIda;

		const descuentoOnlinePorTramo = Math.round(precioIda * onlineDiscountRate);
		const descuentoOnline = formData.idaVuelta
			? descuentoOnlinePorTramo * 2
			: descuentoOnlinePorTramo;

		const descuentosPersonalizadosPorTramo = Math.round(
			precioIda * personalizedDiscountRate
		);
		const descuentosPersonalizados = formData.idaVuelta
			? descuentosPersonalizadosPorTramo * 2
			: descuentosPersonalizadosPorTramo;

		const descuentoPromocionPorTramo = Math.round(
			precioIda * (promotionDiscountRate || 0)
		);
		const descuentoPromocion = formData.idaVuelta
			? descuentoPromocionPorTramo * 2
			: descuentoPromocionPorTramo;

		const descuentoRoundTrip = formData.idaVuelta
			? Math.round(precioBase * (roundTripDiscountRate || 0))
			: 0;
		const isSameDayTrip =
			formData.idaVuelta && formData.fecha === formData.fechaRegreso;
		const sameDayDiscountRate = isSameDayTrip ? 0.25 : 0; // 25% de descuento para viajes el mismo día
		const descuentoSameDay = isSameDayTrip
			? Math.round(precioBase * sameDayDiscountRate)
			: 0;
		let descuentoCodigo = 0;
		if (codigoAplicado) {
			if (codigoAplicado.tipo === "porcentaje") {
				descuentoCodigo = Math.round(precioBase * (codigoAplicado.valor / 100));
			} else {
				descuentoCodigo = Math.min(codigoAplicado.valor, precioBase);
			}
		}

		const descuentoTotalSinLimite =
			descuentoOnline +
			descuentoPromocion +
			(descuentoSameDay > 0 ? descuentoSameDay : descuentoRoundTrip) +
			descuentosPersonalizados +
			descuentoCodigo;

		const descuentoMaximo = Math.round(precioBase * 0.75);
		const totalAhorrado = Math.min(
			descuentoTotalSinLimite,
			descuentoMaximo
		);

		const totalConDescuento = Math.max(precioBase - totalAhorrado, 0);
		const abono = Math.round(totalConDescuento * 0.4);
		const saldoPendiente = Math.max(totalConDescuento - abono, 0);

		return {
			precioBase,
			descuentoBase: descuentoOnline,
			descuentoPromocion,
			descuentoRoundTrip,
			descuentoSameDay,
			descuentosPersonalizados,
			descuentoCodigo,
			totalAhorrado,
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

	const { totalConDescuento } = pricing;

	const handlePayment = useCallback(async () => {
		if (loadingGateway) return;
		setLoadingGateway("flow-total");

		const { vehiculo } = cotizacion;
		const amount = totalConDescuento;

		if (!amount) {
			alert("No hay un monto válido para el pago.");
			setLoadingGateway(null);
			return;
		}

		const description = `Pago total con descuento para ${formData.destino} (${
			vehiculo || "A confirmar"
		})`;
		const apiUrl =
			getBackendUrl() || "https://transportes-araucaria.onrender.com";

		try {
			const response = await fetch(`${apiUrl}/create-payment`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					gateway: "flow", // Hardcoded a Flow
					amount,
					description,
					email: formData.email,
					reservationId,
				}),
			});

			if (!response.ok) throw new Error(`Error: ${response.status}`);
			const data = await response.json();
			if (data.url) {
				window.open(data.url, "_blank");
			} else {
				throw new Error(data.message || "No se pudo generar el enlace de pago.");
			}
		} catch (error) {
			console.error("Error al crear el pago:", error);
			alert(`Hubo un problema: ${error.message}`);
		} finally {
			setLoadingGateway(null);
		}
	}, [
		loadingGateway,
		totalConDescuento,
		cotizacion,
		formData.destino,
		formData.email,
		reservationId,
	]);

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
			...formData,
			destino: destinoFinal,
			source,
			precio: cotizacion.precio,
			vehiculo: cotizacion.vehiculo,
			abonoSugerido: pricing.abono,
			saldoPendiente: pricing.saldoPendiente,
			descuentoBase: pricing.descuentoBase,
			descuentoPromocion: pricing.descuentoPromocion,
			descuentoRoundTrip: pricing.descuentoRoundTrip,
			descuentoOnline: pricing.totalAhorrado,
			totalConDescuento: pricing.totalConDescuento,
			codigoDescuento: codigoAplicado?.codigo || "",
			estado: "pendiente",
			estadoPago: "pendiente",
			pagoMonto: 0,
		};
		if (formData.hora) dataToSend.hora = formData.hora;

		try {
			const apiUrl =
				getBackendUrl() || "https://transportes-araucaria.onrender.com";
			const response = await fetch(`${apiUrl}/enviar-reserva-express`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(dataToSend),
			});
			const result = await response.json();
			if (!response.ok)
				throw new Error(result.message || "Error en el servidor.");

			if (result.reservaId) setReservationId(result.reservaId);
			if (result.codigoReserva) setCodigoReservaCreada(result.codigoReserva);
			if (typeof gtag === "function") {
				gtag("event", "conversion", {
					send_to: `AW-17529712870/8GVlCLP-05MbEObh6KZB`,
				});
			}

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
				} catch (error) {
					console.error("Error registrando uso del código:", error);
				}
			}
			return { success: true, reservaId: result.reservaId };
		} catch (error) {
			console.error("Error al enviar reserva express:", error);
			return { success: false, error: "server", message: error.message };
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleWizardSubmit = async () => {
		const result = await enviarReservaExpress("Reserva Express Web");
		if (result.success) {
			// Si la reserva se creó, iniciar el pago
			await handlePayment();
			setShowConfirmationAlert(true); // Mostrar confirmación después de intentar el pago
		} else if (result.message) {
			alert(result.message);
		}
	};

	const minDateTime = useMemo(() => {
		const horasAnticipacion = destinoSeleccionado?.minHorasAnticipacion || 5;
		const fechaMinima = new Date();
		fechaMinima.setHours(fechaMinima.getHours() + horasAnticipacion);
		return fechaMinima.toISOString().split("T")[0];
	}, [destinoSeleccionado]);

	if (isFreightView) return <FletesLanding />;
	if (isAdminView) return <AdminDashboard />;
	if (isConsultaView) return <ConsultarReserva />;
	if (isPayCodeView) return <PagarConCodigo />;

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
				<DialogContent>
					<DialogHeader>
						<DialogTitle className="text-2xl text-green-600">
							✅ ¡Reserva Creada!
						</DialogTitle>
						<DialogDescription>
							Tu reserva ha sido guardada. Serás redirigido para completar el
							pago.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-4">
						{codigoReservaCreada && (
							<div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
								<p className="font-medium text-blue-800">
									Tu código de reserva es:{" "}
									<span className="font-mono font-bold">
										{codigoReservaCreada}
									</span>
								</p>
							</div>
						)}
						<p className="text-sm text-muted-foreground">
							Si no eres redirigido, haz clic en el enlace que te enviamos a
							tu correo.
						</p>
					</div>
					<DialogFooter>
						<DialogClose asChild>
							<Button type="button">Entendido</Button>
						</DialogClose>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Header />

			<main>
				<HeroExpress
					formData={formData}
					handleInputChange={handleInputChange}
					origenes={todosLosTramos}
					destinos={destinosDisponibles}
					maxPasajeros={maxPasajeros}
					minDateTime={minDateTime}
					phoneError={phoneError}
					isSubmitting={isSubmitting}
					cotizacion={cotizacion}
					pricing={pricing}
					onSubmitWizard={handleWizardSubmit}
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
					handleSubmit={() => {
						/* No hacer nada, el formulario de contacto se maneja por separado */
					}}
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
