// src/App.jsx

import "./App.css";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useCotizacion } from "./hooks/useCotizacion";

// --- UTILIDADES ---
function normalizePhoneToE164(phone) {
	if (!phone) return "";
	let cleaned = phone.replace(/[\s\-()]/g, "");
	if (cleaned.startsWith("+56")) return cleaned;
	if (cleaned.startsWith("56")) return "+" + cleaned;
	if (cleaned.startsWith("9") && cleaned.length >= 9) return "+56" + cleaned;
	return "+56" + cleaned;
}

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
import PromocionBanners from "./components/PromocionBanners";
// Hero eliminado - solo flujo express disponible
import HeroExpress from "./components/HeroExpress";
import Servicios from "./components/Servicios";
import Destinos from "./components/Destinos";
import Destacados from "./components/Destacados";
import PorQueElegirnos from "./components/PorQueElegirnos";
import Testimonios from "./components/Testimonios";
import PaginaEvaluar from "./components/Evaluar/PaginaEvaluar";
import SeccionTestimonios from "./components/Testimonios/SeccionTestimonios";
import Contacto from "./components/Contacto";
import FletesLanding from "./components/FletesLanding";
import Footer from "./components/Footer";
import Fidelizacion from "./components/Fidelizacion";
import AdminDashboard from "./components/AdminDashboard";
import CodigoDescuento from "./components/CodigoDescuento";
import ConsultarReserva from "./components/ConsultarReserva";
import PagarConCodigo from "./components/PagarConCodigo";
import CompraProductos from "./components/CompraProductos";
import CompletarDetalles from "./components/CompletarDetalles"; // Importar componente
import FlowReturn from "./components/FlowReturn"; // Página de retorno de pago Flow
import TestGoogleAds from "./components/TestGoogleAds"; // Página de prueba para Google Ads
import OportunidadesTraslado from "./pages/OportunidadesTraslado"; // Página de oportunidades de traslado
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { getBackendUrl } from "./lib/backend";

// --- Datos Iniciales y Lógica ---
import { destinosBase, destacadosData } from "./data/destinos";

// Descuentos ahora se cargan dinámicamente desde descuentosGlobales
// Eliminado: variable ROUND_TRIP_DISCOUNT no utilizada

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
			metadata?.porcentaje ?? promo.descuentoPorcentaje ?? 0,
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
	return (
		hash.startsWith("#pagar-con-codigo") || hash.startsWith("#pago-codigo")
	);
};

// Resolver si la URL es para comprar productos
const resolveIsCompraProductosView = () => {
	const hash = window.location.hash;
	return hash.startsWith("#comprar-productos/");
};

// Resolver si la URL es la página de retorno de Flow (confirmación de pago)
// Soporta tanto path-based routing (/flow-return) como hash-based (#flow-return)
const resolveIsFlowReturnView = () => {
	const pathname = window.location.pathname.toLowerCase();
	const hash = window.location.hash.toLowerCase();
	return (
		pathname === "/flow-return" ||
		pathname.startsWith("/flow-return/") ||
		hash === "#flow-return"
	);
};

// Resolver si la URL es la página de prueba de Google Ads
// Resolver si la URL es la página de oportunidades
const resolveIsOportunidadesView = () => {
	const pathname = window.location.pathname.toLowerCase();
	const hash = window.location.hash.toLowerCase();
	return (
		pathname === "/oportunidades" ||
		pathname.startsWith("/oportunidades/") ||
		hash === "#oportunidades"
	);
};

const resolveIsTestGoogleAdsView = () => {
	const pathname = window.location.pathname.toLowerCase();
	const hash = window.location.hash.toLowerCase();
	return (
		pathname === "/test-google-ads" ||
		pathname.startsWith("/test-google-ads/") ||
		hash === "#test-google-ads"
	);
};

// Resolver si la URL es para la página de evaluación post-viaje
const resolveIsEvaluarView = () => {
	const hash = window.location.hash;
	return hash.startsWith("#evaluar");
};

function App() {
	const [isFreightView, setIsFreightView] = useState(resolveIsFreightView);
	const [isAdminView, setIsAdminView] = useState(resolveIsAdminView);
	const [isConsultaView, setIsConsultaView] = useState(resolveIsConsultaView);
	const [isPayCodeView, setIsPayCodeView] = useState(resolveIsPayCodeView);
	const [isCompraProductosView, setIsCompraProductosView] = useState(
		resolveIsCompraProductosView,
	);
	const [isFlowReturnView, setIsFlowReturnView] = useState(
		resolveIsFlowReturnView,
	);
	const [isOportunidadesView, setIsOportunidadesView] = useState(
		resolveIsOportunidadesView,
	);
	const [isTestGoogleAdsView, setIsTestGoogleAdsView] = useState(
		resolveIsTestGoogleAdsView,
	);
	const [isEvaluarView, setIsEvaluarView] = useState(resolveIsEvaluarView);
	const [destinosData, setDestinosData] = useState(destinosBase);
	const [promotions, setPromotions] = useState([]);
	const [descuentosGlobales, setDescuentosGlobales] = useState({
		descuentoOnline: { valor: 0, activo: false },
		descuentoRoundTrip: { valor: 0, activo: false },
		descuentosPersonalizados: [],
	});

	// Estado para vista de completar detalles post-pago
	const [vistaCompletarDetalles, setVistaCompletarDetalles] = useState({
		activo: false,
		reservaId: null,
	});

	const [configSillas, setConfigSillas] = useState({
		habilitado: false,
		maxSillas: 2,
		precioPorSilla: 5000,
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
		sillaInfantil: false,
		cantidadSillasInfantiles: 0,
		mensaje: "",
		idaVuelta: false,
		fechaRegreso: "",
		horaRegreso: "",
		upgradeVan: false, // NUEVO CAMPO para upgrade voluntario a Van
		codigoOportunidad: null, // Código de oportunidad si la reserva viene de una oportunidad
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
	const [oportunidadesRetornoUniversal, setOportunidadesRetornoUniversal] =
		useState(null);
	const [buscandoRetornos, setBuscandoRetornos] = useState(false);

	// --- LÓGICA DE RETORNOS UNIVERSALES (CENTRALIZADA) ---
	const buscarRetornosUniversal = async (origen, destino, fecha) => {
		if (!origen || !destino || !fecha) {
			setOportunidadesRetornoUniversal(null);
			return;
		}

		// Evitar búsquedas innecesarias si faltan datos
		if (origen === "Aeropuerto La Araucanía" && !destino) return;
		if (destino === "Aeropuerto La Araucanía" && !origen) return;

		setBuscandoRetornos(true);
		try {
			const apiUrl =
				getBackendUrl() || "https://transportes-araucaria.onrender.com";
			const response = await fetch(
				`${apiUrl}/api/disponibilidad/buscar-retornos-disponibles`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ origen, destino, fecha }),
				},
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

	// Efecto para buscar retornos cuando cambian los datos del formulario
	useEffect(() => {
		// Debounce pequeño para evitar muchas peticiones mientras se escribe/selecciona
		const timer = setTimeout(() => {
			buscarRetornosUniversal(
				formData.origen,
				formData.destino,
				formData.fecha,
			);
		}, 500);
		return () => clearTimeout(timer);
	}, [formData.origen, formData.destino, formData.fecha]);

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

	// Sincronizar vista de compra de productos
	useEffect(() => {
		const syncCompraProductos = () =>
			setIsCompraProductosView(resolveIsCompraProductosView());
		window.addEventListener("hashchange", syncCompraProductos);
		window.addEventListener("popstate", syncCompraProductos);
		return () => {
			window.removeEventListener("hashchange", syncCompraProductos);
			window.removeEventListener("popstate", syncCompraProductos);
		};
	}, []);

	// Sincronizar vista de retorno de Flow (confirmación de pago)
	useEffect(() => {
		const syncFlowReturn = () => setIsFlowReturnView(resolveIsFlowReturnView());
		window.addEventListener("hashchange", syncFlowReturn);
		window.addEventListener("popstate", syncFlowReturn);
		return () => {
			window.removeEventListener("hashchange", syncFlowReturn);
			window.removeEventListener("popstate", syncFlowReturn);
		};
	}, []);

	// Sincronizar vista de prueba de Google Ads
	useEffect(() => {
		const syncTestGoogleAds = () =>
			setIsTestGoogleAdsView(resolveIsTestGoogleAdsView());
		window.addEventListener("hashchange", syncTestGoogleAds);
		window.addEventListener("popstate", syncTestGoogleAds);
		return () => {
			window.removeEventListener("hashchange", syncTestGoogleAds);
			window.removeEventListener("popstate", syncTestGoogleAds);
		};
	}, []);

	// Sincronizar vista de evaluación post-viaje
	useEffect(() => {
		const syncEvaluar = () => setIsEvaluarView(resolveIsEvaluarView());
		window.addEventListener("hashchange", syncEvaluar);
		window.addEventListener("popstate", syncEvaluar);
		return () => {
			window.removeEventListener("hashchange", syncEvaluar);
			window.removeEventListener("popstate", syncEvaluar);
		};
	}, []);

	// Sincronizar vista de COMPLETAR DETALLES vía HASH (para el flujo de recuperación)
	useEffect(() => {
		const handleHashParams = () => {
			const hash = window.location.hash;
			if (hash.startsWith("#completar-detalles")) {
				const params = new URLSearchParams(hash.split("?")[1]);
				const id = params.get("id");
				if (id) {
					setVistaCompletarDetalles({
						activo: true,
						reservaId: id,
						initialAmount: 0,
					});
				}
			}
		};
		window.addEventListener("hashchange", handleHashParams);
		handleHashParams(); // Verificar al montar
		return () => window.removeEventListener("hashchange", handleHashParams);
	}, []);

	// --- LÓGICA PARA MANEJAR RETORNO DE PAGO ---
	useEffect(() => {
		const url = new URL(window.location.href);
		const flowSuccess = url.searchParams.get("flow_payment") === "success";
		const flowPending = url.searchParams.get("flow_payment") === "pending";
		const reservaId = url.searchParams.get("reserva_id");
		const amount = url.searchParams.get("amount");
		const encodedData = url.searchParams.get("d");
		// Extraer token de Flow si viene (puede venir de pasarela o ser nulo)
		const flowToken = url.searchParams.get("token");
		// Capturar warning si existe (e.g. no_reserva_id)
		const warning = url.searchParams.get("warning");

		// FLUJO PENDIENTE (reserva_express): Flow confirmó el pago solo vía webhook (status=2),
		// pero el navegador recibió status=1 primero. Hacer polling hasta que la DB refleje el pago.
		if (flowPending && reservaId) {
			console.warn(
				`⏳ [App.jsx] Pago Express PENDIENTE para reserva ${reservaId}. Iniciando polling...`,
			);

			const apiBase =
				import.meta.env.VITE_API_URL ||
				"https://transportes-araucaria.onrender.com";
			const MAX_INTENTOS = 24; // 24 × 5s = 2 minutos
			let intentos = 0;
			let cancelado = false;

			const pollingInterval = setInterval(async () => {
				if (cancelado) return;
				intentos++;
				try {
					const resp = await fetch(
						`${apiBase}/api/payment-status?reserva_id=${encodeURIComponent(reservaId)}`,
					);
					if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
					const data = await resp.json();

					console.log(
						`🔄 [App.jsx] Polling intento ${intentos}/${MAX_INTENTOS}: pagado=${data.pagado}, status=${data.status}`,
					);

					if (data.pagado) {
						clearInterval(pollingInterval);
						cancelado = true;
						// Redirigir a la misma URL pero con status=success y monto desde DB
						const montoConfirmado = data.monto || amount || "";
						const nuevaUrl = new URL(window.location.href);
						nuevaUrl.searchParams.set("flow_payment", "success");
						if (montoConfirmado)
							nuevaUrl.searchParams.set("amount", montoConfirmado);
						// Reemplazar la URL para que el useEffect se active con success
						window.location.replace(nuevaUrl.toString());
					}
				} catch (e) {
					console.warn(
						`⚠️ [App.jsx] Error en polling (intento ${intentos}):`,
						e.message,
					);
				}

				if (intentos >= MAX_INTENTOS && !cancelado) {
					clearInterval(pollingInterval);
					cancelado = true;
					console.log(
						"⏲️ [App.jsx] Polling finalizado sin confirmación (timeout 2 min).",
					);
				}
			}, 5000);

			return () => {
				cancelado = true;
				clearInterval(pollingInterval);
			};
		}

		if (flowSuccess) {
			console.log(`🔍 [App.jsx] Datos de conversión recibidos:`, {
				amount,
				reservaId,
				warning,
				flowToken: flowToken ? "presente" : "ausente",
				encodedData: encodedData ? "presente" : "ausente",
			});

			// DISPARAR CONVERSIÓN DE GOOGLE ADS (con polling para evitar race condition con gtag.js)
			// gtag.js se carga de forma asíncrona; si aún no está disponible, esperamos hasta 5 segundos.
			const waitForGtag = () =>
				new Promise((resolve) => {
					if (typeof window.gtag === "function") {
						resolve(true);
						return;
					}
					const startTime = Date.now();
					const interval = setInterval(() => {
						if (typeof window.gtag === "function") {
							clearInterval(interval);
							console.log(
								`✅ [App.jsx] gtag disponible tras ${Date.now() - startTime}ms`,
							);
							resolve(true);
						} else if (Date.now() - startTime >= 5000) {
							clearInterval(interval);
							console.warn(
								"⚠️ [App.jsx] Timeout esperando gtag (5s). No se pudo disparar la conversión.",
							);
							resolve(false);
						}
					}, 100);
				});

			const dispararConversionExpress = async () => {
				try {
					const uniqueSuffix = flowToken
						? flowToken.substring(0, 8)
						: Date.now().toString().substring(7);
					const transactionId = reservaId
						? `${reservaId}_${uniqueSuffix}`
						: `exp_${Date.now()}`;
					const conversionKey = `flow_conversion_express_${transactionId}`;

					if (sessionStorage.getItem(conversionKey)) {
						console.log(
							"ℹ️ [App.jsx] Conversión ya registrada previamente en esta sesión.",
						);
						return;
					}

					// Lógica de monto robusta
					let conversionValue = 0;
					if (amount !== null && amount !== undefined && amount !== "") {
						const parsed = Number(amount);
						if (!isNaN(parsed) && parsed > 0) {
							conversionValue = parsed;
							console.log(
								`✅ [App.jsx] Valor de conversión parseado: ${conversionValue}`,
							);
						} else {
							console.warn(
								`⚠️ [App.jsx] Parseo falló. amount="${amount}", parsed=${parsed}`,
							);
						}
					} else {
						console.warn(
							`⚠️ [App.jsx] Amount no presente en URL. amount=${amount}`,
						);
					}

					if (conversionValue <= 0) {
						console.warn(
							"⚠️ [App.jsx] Monto inválido o no encontrado. Usando valor por defecto 1.0 para conversión.",
						);
						// ALERTA: si este log aparece en producción, el backend no está pasando 'amount' en la URL de retorno Express
						// Esto distorsiona el valor promedio de conversión en Google Ads → revisar /api/payment-result en Render
						console.error(
							"❌ [GA-ALERTA] Conversión Express disparada con value=1.0 (fallback). Verificar que backend pase amount en URL.",
						);
						conversionValue = 1.0;
					}

					let userEmail = "";
					let userName = "";
					let userPhone = "";

					// Decodificar datos de usuario de Base64 (si vienen en el parámetro 'd')
					if (encodedData) {
						try {
							// ✅ Decodificar Base64 con soporte UTF-8 usando TextDecoder (sin escape() deprecated)
							const decodedFromUrl = decodeURIComponent(encodedData);
							const base64Decoded = atob(decodedFromUrl);
							const bytes = Uint8Array.from(base64Decoded, (c) =>
								c.charCodeAt(0),
							);
							const utf8Decoded = new TextDecoder("utf-8").decode(bytes);
							const userData = JSON.parse(utf8Decoded);
							if (userData && typeof userData === "object") {
								userEmail = userData.email || "";
								userName = userData.nombre || "";
								userPhone = userData.telefono || "";
								console.log(
									"✅ [App.jsx] Datos de usuario recuperados para Enhanced Conversions",
								);
							}
						} catch (e) {
							console.warn(
								"⚠️ [App.jsx] Error decodificando datos de usuario:",
								e.message,
							);
						}
					}

					const conversionData = {
						send_to: "AW-17529712870/yZz-CJqiicUbEObh6KZB", // Etiqueta conversión compra
						value: conversionValue,
						currency: "CLP",
						transaction_id: transactionId,
					};

					// ✅ Enhanced Conversions: usar gtag('set', 'user_data', ...) para máxima compatibilidad
					const userData = {};
					if (userEmail) userData.email = userEmail.toLowerCase().trim();
					if (userPhone)
						userData.phone_number = normalizePhoneToE164(userPhone);
					if (userName) {
						const nameParts = userName.trim().split(" ");
						userData.address = {
							first_name: nameParts[0]?.toLowerCase() || "",
							last_name: nameParts.slice(1).join(" ")?.toLowerCase() || "",
							country: "CL",
						};
					}

					if (Object.keys(userData).length > 0) {
						console.log("👤 [App.jsx] Set user_data para Enhanced Conversions");
						window.gtag("set", "user_data", userData);
					}

					// Esperar a que gtag esté listo antes de disparar
					const gtagListo = await waitForGtag();
					if (!gtagListo) return;

					console.log(
						`🚀 [App.jsx] Disparando conversión Google Ads:`,
						conversionData,
					);
					window.gtag("event", "conversion", conversionData);

					// Marcar como enviada para evitar duplicados
					sessionStorage.setItem(conversionKey, "true");
					// ✅ PREVENCIÓN DE DUPLICADOS: Marcar también por ID de reserva
					if (reservaId) {
						sessionStorage.setItem(
							`flow_conversion_express_${reservaId}`,
							"true",
						);
					}
					// Limpiar el pending de localStorage al disparar exitosamente
					localStorage.removeItem("ga_pending_conversion_express");
				} catch (conversionError) {
					console.error(
						"❌ [App.jsx] Error crítico disparando conversión:",
						conversionError,
					);
				}
			};

			dispararConversionExpress();

			// Solo mostrar detalles si hay reservaId válido
			if (reservaId) {
				setVistaCompletarDetalles({
					activo: true,
					reservaId: reservaId,
					initialAmount: amount,
				});
			}

			// Limpiar URL para evitar reactivación al recargar, pero mantener estado interno
			// window.history.replaceState(null, "", window.location.pathname);
			return; // Evita ejecutar el recovery check abajo
		}

		// RECOVERY: Si no hay flow_payment en URL, verificar si hay una conversión pendiente
		// (cubre el caso donde el pago se completó en otra pestaña y esta no recibió el retorno)
		if (!flowPending) {
			const pendingRaw = localStorage.getItem("ga_pending_conversion_express");
			if (pendingRaw) {
				try {
					const pending = JSON.parse(pendingRaw);
					const edadMs = Date.now() - (pending.timestamp || 0);
					// Verificar solo si el pending tiene menos de 2 horas
					if (pending.reservaId && edadMs < 2 * 60 * 60 * 1000) {
						const apiBase =
							import.meta.env.VITE_API_URL ||
							"https://transportes-araucaria.onrender.com";
						fetch(
							`${apiBase}/api/payment-status?reserva_id=${encodeURIComponent(pending.reservaId)}`,
						)
							.then((r) => (r.ok ? r.json() : null))
							.then((data) => {
								if (data?.pagado) {
									console.log(
										`✅ [App.jsx Recovery] Pago detectado para reserva ${pending.reservaId}. Activando CompletarDetalles.`,
									);
									localStorage.removeItem("ga_pending_conversion_express");
									// CompletarDetalles disparará la conversión de respaldo (sessionStorage no tiene la clave)
									setVistaCompletarDetalles({
										activo: true,
										reservaId: pending.reservaId,
										initialAmount: pending.amount,
									});
								}
							})
							.catch(() => {}); // Ignorar errores de red silenciosamente
					}
				} catch (e) {
					localStorage.removeItem("ga_pending_conversion_express"); // limpiar dato corrupto
				}
			}
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

		if (data.configSillas) {
			setConfigSillas(data.configSillas);
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
		} else {
			// Si no vienen descuentos globales, resetear a valores seguros
			setDescuentosGlobales({
				descuentoOnline: { valor: 0, activo: false },
				descuentoRoundTrip: { valor: 0, activo: false },
				descuentosPersonalizados: [],
			});
		}

		return true;
	}, []);

	// --- FUNCION PARA RECARGAR DATOS ---
	const recargarDatosPrecios = useCallback(
		async ({ signal, payload } = {}) => {
			try {
				let data = payload;

				if (!data) {
					const apiUrl =
						getBackendUrl() || "https://transportes-araucaria.onrender.com";

					const response = await fetch(`${apiUrl}/pricing`, {
						signal,
					});
					if (!response.ok) {
						throw new Error("La respuesta de la red no fue exitosa.");
					}
					data = await response.json();
				} else {
				}

				if (signal?.aborted) {
					return false;
				}

				const applied = applyPricingPayload(data, { signal });

				return applied;
			} catch (error) {
				if (error.name == "AbortError") {
					throw error;
				}
				console.error("Error al recargar precios:", error);
				return false;
			}
		},
		[applyPricingPayload],
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
				8,
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
								error,
							);
						}
					});
					return;
				} catch (parseError) {
					console.warn(
						"No se pudo parsear payload de precios desde storage:",
						parseError,
					);
				}
			}

			if (e.key === "pricing_updated") {
				recargarDatosPrecios().catch((error) => {
					if (error?.name !== "AbortError") {
						console.error(
							"Error recargando precios tras cambio en storage:",
							error,
						);
					}
				});
			}
		};

		window.addEventListener("storage", handleStorageChange);

		// Tambien escuchar eventos personalizados
		const handlePricingUpdate = (event) => {
			const payload = event?.detail;
			if (payload) {
				recargarDatosPrecios({ payload }).catch((error) => {
					if (error?.name !== "AbortError") {
						console.error(
							"Error aplicando payload de precios desde evento:",
							error,
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
		[destinosData],
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
		[destinosData],
	);

	// ==================================================================
	// LÓGICA CORREGIDA PARA ACTUALIZACIÓN DINÁMICA DE PASAJEROS
	// ==================================================================
	const destinoSeleccionado = useMemo(() => {
		const tramo = [formData.origen, formData.destino].find(
			(lugar) =>
				lugar && lugar !== "Aeropuerto La Araucanía" && lugar !== "Otro",
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
			null,
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
		0.75,
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
		(origen, destino, pasajeros, upgradeVan = false) => {
			const tramo = [origen, destino].find(
				(lugar) => lugar !== "Aeropuerto La Araucanía",
			);
			const destinoInfo = destinosData.find((d) => d.nombre === tramo);

			if (!origen || !destinoInfo || !pasajeros || destino === "Otro") {
				return {
					precio: null,
					vehiculo: null,
					esUpgradeVanSinAdicionales: false,
				};
			}

			const numPasajeros = parseInt(pasajeros);

			let vehiculoAsignado;
			let precioFinal = null;
			let esUpgradeVanSinAdicionales = false;

			if (numPasajeros > 0 && numPasajeros <= 3) {
				if (upgradeVan) {
					// UPGRADE VOLUNTARIO: 1-3 pasajeros eligieron Van
					vehiculoAsignado = "Van de Pasajeros (Upgrade)";
					const precios = destinoInfo.precios.van;
					if (!precios)
						return {
							precio: null,
							vehiculo: vehiculoAsignado,
							esUpgradeVanSinAdicionales: false,
						};

					precioFinal = Number(precios.base);
					esUpgradeVanSinAdicionales = true; // Activar protección de precio mínimo
				} else {
					// SEDÁN: Flujo normal para 1-3 pasajeros (Antes: Auto Privado)
					vehiculoAsignado = "Sedán";
					const precios = destinoInfo.precios.auto;
					if (!precios)
						return {
							precio: null,
							vehiculo: vehiculoAsignado,
							esUpgradeVanSinAdicionales: false,
						};

					const precioBase = Number(precios.base);
					const pasajerosAdicionales = numPasajeros - 1;
					const costoAdicional = precioBase * precios.porcentajeAdicional;
					precioFinal = precioBase + pasajerosAdicionales * costoAdicional;
				}
			} else if (
				numPasajeros >= 4 &&
				numPasajeros <= destinoInfo.maxPasajeros
			) {
				// VAN OBLIGATORIA: 4+ pasajeros (FLUJO ORIGINAL adaptado)
				vehiculoAsignado = "Van de Pasajeros";
				const precios = destinoInfo.precios.van;
				if (!precios)
					return {
						precio: null,
						vehiculo: "Van (Consultar)",
						esUpgradeVanSinAdicionales: false,
					};

				const precioBase = Number(precios.base);
				const pasajerosAdicionales = numPasajeros - 4;
				const costoAdicional = precioBase * precios.porcentajeAdicional;
				precioFinal = precioBase + pasajerosAdicionales * costoAdicional;
				esUpgradeVanSinAdicionales = false; // NO proteger (flujo original)
			} else {
				vehiculoAsignado = "Consultar disponibilidad";
				precioFinal = null;
			}

			return {
				precio: precioFinal !== null ? Math.round(precioFinal) : null,
				vehiculo: vehiculoAsignado,
				esUpgradeVanSinAdicionales,
			};
		},
		[destinosData],
	);

	useEffect(() => {
		const handleLocationChange = () => {
			setIsAdminView(resolveIsAdminView());
			setIsFreightView(resolveIsFreightView());
		};
		window.addEventListener("popstate", handleLocationChange);
		return () => window.removeEventListener("popstate", handleLocationChange);
	}, []);

	// Parámetros para el hook de cotización centralizada en el backend
	const paramsCotizacion = useMemo(
		() => ({
			origen: formData.origen,
			destino:
				formData.destino === "Otro" ? formData.otroDestino : formData.destino,
			pasajeros: Number(formData.pasajeros),
			fecha: formData.fecha,
			hora: formData.hora || undefined,
			idaVuelta: formData.idaVuelta,
			fechaRegreso: formData.fechaRegreso || undefined,
			horaRegreso: formData.horaRegreso || undefined,
			upgradeVan: formData.upgradeVan,
			codigoDescuento: codigoAplicado?.codigo || undefined,
			sillaInfantil: formData.sillaInfantil,
			cantidadSillas: formData.cantidadSillasInfantiles || 0,
		}),
		[
			formData.origen,
			formData.destino,
			formData.otroDestino,
			formData.pasajeros,
			formData.fecha,
			formData.hora,
			formData.idaVuelta,
			formData.fechaRegreso,
			formData.horaRegreso,
			formData.upgradeVan,
			codigoAplicado,
			formData.sillaInfantil,
			formData.cantidadSillasInfantiles,
		],
	);

	// El backend calcula tarifa dinámica + todos los descuentos en una sola llamada
	const { cotizacion: cotizacionHook, cargando: cotizacionCargando } =
		useCotizacion(paramsCotizacion);

	// Cotización local: usada para vehiculo (display) y validación de código
	const cotizacion = useMemo(() => {
		return calcularCotizacion(
			formData.origen,
			formData.destino,
			formData.pasajeros,
			formData.upgradeVan,
		);
	}, [
		formData.origen,
		formData.destino,
		formData.pasajeros,
		formData.upgradeVan,
		calcularCotizacion,
	]);

	const validarTelefono = (telefono) =>
		/^(\+?56)?(\s?9)\s?(\d{4})\s?(\d{4})$/.test(telefono);

	// Helper para generar observaciones con nota de upgrade
	const generarObservaciones = (mensaje, upgradeVan) => {
		if (upgradeVan) {
			return (
				(mensaje || "") + " [Cliente solicitó upgrade a Van para mayor confort]"
			);
		}
		return mensaje;
	};

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
			sillaInfantil: false,
			cantidadSillasInfantiles: 0,
			mensaje: "",
			idaVuelta: false,
			fechaRegreso: "",
			horaRegreso: "",
			upgradeVan: false, // NUEVO CAMPO
			codigoOportunidad: null, // Código de oportunidad si la reserva viene de una oportunidad
		});
	};

	const handleCloseAlert = () => {
		setShowConfirmationAlert(false);
		setReviewChecklist({ viaje: false, contacto: false });
		resetForm();
	};

	const pricing = useMemo(() => {
		// Mapeo desde cotizacionHook (fuente de verdad: backend) al formato legacy
		const d = cotizacionHook?.descuentos ?? {};
		return {
			precioBase: cotizacionHook?.precioBase ?? 0,
			precioOriginal: cotizacionHook?.precioBase ?? 0,
			totalNormal: cotizacionHook?.precioBase ?? 0,
			descuentoBase: d.online ?? 0,
			descuentoPromocion: d.promocion ?? 0,
			descuentoRoundTrip: d.roundTrip ?? 0,
			descuentosPersonalizados: d.personalizados ?? 0,
			descuentoCodigo: d.codigo ?? 0,
			descuentoOnline: d.total ?? 0,
			descuentoRetornoUniversal: 0,
			totalConDescuento: cotizacionHook?.totalConDescuento ?? 0,
			abono: cotizacionHook?.abono ?? 0,
			saldoPendiente: cotizacionHook?.saldoPendiente ?? 0,
		};
	}, [cotizacionHook]);

	const { descuentoOnline, totalConDescuento, abono, saldoPendiente } = pricing;

	const handlePayment = async (
		gateway,
		type = "abono",
		identificadores = {},
	) => {
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

		const reservaIdParaPago = identificadores.reservaId ?? reservationId;
		const codigoReservaParaPago =
			identificadores.codigoReserva ?? codigoReservaCreada;

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
			// Validar que tengamos los datos necesarios antes de crear el pago
			// Si no hay identificadores, significa que la reserva no se creó correctamente
			if (!reservaIdParaPago && !codigoReservaParaPago) {
				throw new Error(
					"No se pudo identificar la reserva. Por favor, intenta nuevamente.",
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
					codigoReserva: codigoReservaParaPago || null,
					tipoPago: type,
					paymentOrigin: "reserva_express", // Identificador para fallback robusto y conversiones GA
				}),
			});

			if (!response.ok) {
				throw new Error(`Error del servidor: ${response.status}`);
			}

			const data = await response.json();
			if (data.url) {
				// Guardar intención de conversión en localStorage ANTES de abrir Flow
				// Permite recuperar la conversión si la nueva pestaña se cierra antes del redirect
				if (reservaIdParaPago) {
					localStorage.setItem(
						"ga_pending_conversion_express",
						JSON.stringify({
							reservaId: String(reservaIdParaPago),
							amount: String(amount),
							timestamp: Date.now(),
						}),
					);
				}
				window.open(data.url, "_blank");
			} else {
				throw new Error(
					data.message || "No se pudo generar el enlace de pago.",
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
			upgradeVan: formData.upgradeVan || false,
			observaciones: generarObservaciones(formData.mensaje, formData.upgradeVan),
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
			if (typeof window !== "undefined" && typeof window.gtag === "function") {
				// Lead: valor potencial de la reserva para que Google Ads tenga datos incluso si el usuario no regresa tras pagar
				window.gtag("event", "conversion", {
					send_to: `AW-17529712870/8GVlCLP-05MbEObh6KZB`,
					value: Number(totalConDescuento) || Number(cotizacion?.precio) || 0,
					currency: "CLP",
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
				"Introduce un número de móvil chileno válido (ej: +56 9 1234 5678).",
			);
			return { success: false, error: "telefono" };
		}
		setPhoneError("");

		// Validar horario mínimo de anticipación
		const validacionHorario = validarHorarioReserva();
		if (!validacionHorario.esValido && formData.destino !== "Otro") {
			return {
				success: false,
				error: "horario",
				message: validacionHorario.mensaje,
			};
		}

		if (isSubmitting) return { success: false, error: "procesando" };

		// Validar que el precio esté disponible antes de enviar (evita race condition con useCotizacion)
		const esRutaEstandar =
			formData.origen !== "Otro" && formData.destino !== "Otro";
		if (
			esRutaEstandar &&
			(!pricing.totalConDescuento || pricing.totalConDescuento <= 0)
		) {
			if (cotizacionCargando) {
				return {
					success: false,
					error: "cotizacion_cargando",
					message:
						"El precio se está calculando, por favor espera un momento e intenta nuevamente.",
				};
			} else {
				return {
					success: false,
					error: "sin_precio",
					message:
						"No se pudo obtener el precio para este trayecto. Verifica el origen y destino seleccionados.",
				};
			}
		}

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
			horaRegreso: formData.horaRegreso,
			direccionOrigen:
				formData.origen === "Otro"
					? formData.otroOrigen
					: formData.direccionOrigen || "",
			direccionDestino:
				formData.destino === "Otro"
					? formData.otroDestino
					: formData.direccionDestino || "",
			source,

			// Datos de pricing calculados
			// El backend divide los precios en 2 tramos cuando idaVuelta=true
			// Por lo tanto debemos enviar el precio base YA multiplicado (si es ida y vuelta)
			precio: pricing.precioBase,
			vehiculo: cotizacion.vehiculo,
			abonoSugerido: pricing.abono,
			saldoPendiente: pricing.saldoPendiente,
			descuentoBase: pricing.descuentoBase,
			descuentoPromocion: pricing.descuentoPromocion,
			descuentoRoundTrip: pricing.descuentoRoundTrip,
			descuentoOnline: pricing.descuentoOnline,
			totalConDescuento: pricing.totalConDescuento,
			codigoDescuento: codigoAplicado?.codigo || "",
			upgradeVan: formData.upgradeVan || false,
			sillaInfantil: formData.sillaInfantil || false,
			cantidadSillasInfantiles: formData.cantidadSillasInfantiles || 0,
			observaciones: generarObservaciones(
				formData.mensaje,
				formData.upgradeVan,
			),
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
				// Si la respuesta indica que está bloqueado, mostrar mensaje específico
				if (result.bloqueado || result.message === "Agenda completada") {
					throw new Error(
						"Agenda completada. " +
							(result.error ||
								"Esta fecha/hora no está disponible para reservas."),
					);
				}
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

			// NOTA: La conversión de Google Ads se dispara en FlowReturn.jsx cuando el pago es confirmado
			// NO disparar conversión aquí para evitar conversiones prematuras de reservas no pagadas
			// Referencia: docs/legacy/CONVERSIONES_AVANZADAS_GOOGLE_ADS.md

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

			// Incluir codigoReserva en el resultado para mejor trazabilidad
			return {
				success: true,
				reservaId: result.reservaId,
				codigoReserva: result.codigoReserva,
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

		// Obtener "ahora" en Chile
		const ahoraChile = new Date(
			new Date().toLocaleString("en-US", { timeZone: "America/Santiago" }),
		);

		// Calcular fecha mínima sumando anticipación
		const fechaMinima = new Date(ahoraChile.getTime());
		fechaMinima.setHours(fechaMinima.getHours() + horasAnticipacion);

		// Formatear como YYYY-MM-DD usando la zona horaria de Chile
		return new Intl.DateTimeFormat("fr-CA", {
			timeZone: "America/Santiago",
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
		}).format(fechaMinima);
	}, [destinoSeleccionado]);

	const currencyFormatter = useMemo(
		() =>
			new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }),
		[],
	);
	const formatCurrency = (value) => currencyFormatter.format(value || 0);

	const canPay = reviewChecklist.viaje && reviewChecklist.contacto;
	const destinoFinal =
		formData.destino === "Otro" ? formData.otroDestino : formData.destino;

	if (isFreightView) {
		return <FletesLanding />;
	}

	if (isAdminView) {
		return (
			<AuthProvider>
				<ProtectedRoute>
					<AdminDashboard />
				</ProtectedRoute>
			</AuthProvider>
		);
	}

	if (isConsultaView) {
		return <ConsultarReserva />;
	}

	if (isPayCodeView) {
		return <PagarConCodigo />;
	}

	if (isCompraProductosView) {
		return <CompraProductos />;
	}

	if (isFlowReturnView) {
		return <FlowReturn />;
	}

	if (isOportunidadesView) {
		return <OportunidadesTraslado />;
	}

	if (isTestGoogleAdsView) {
		return <TestGoogleAds />;
	}

	// Vista de evaluación post-viaje (accedida por enlace en el correo del pasajero)
	if (isEvaluarView) {
		return <PaginaEvaluar />;
	}

	// Vista para completar detalles después del pago
	if (vistaCompletarDetalles.activo) {
		return (
			<CompletarDetalles
				reservaId={vistaCompletarDetalles.reservaId}
				initialAmount={vistaCompletarDetalles.initialAmount}
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
							<div className="bg-chocolate-50 border-2 border-chocolate-200 rounded-lg p-4">
								<p className="text-sm font-medium text-chocolate-700 mb-1">
									Código de Reserva
								</p>
								<p className="text-2xl font-bold text-chocolate-900 tracking-wider font-mono">
									{codigoReservaCreada}
								</p>
								<p className="text-xs text-chocolate-600 mt-2">
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
					setFormData={setFormData}
					origenes={todosLosTramos}
					destinos={destinosDisponibles}
					destinosData={destinosData}
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
					oportunidadesRetornoUniversal={oportunidadesRetornoUniversal}
					onAplicarCodigo={validarCodigo}
					onRemoverCodigo={removerCodigo}
					configSillas={configSillas}
				/>

				<PromocionBanners />

				<Servicios />
				<Destinos />
				<Destacados destinos={destacadosData} />
				<Fidelizacion />
				<PorQueElegirnos />
				<SeccionTestimonios />
				<Testimonios />
				<Contacto />
			</main>

			<Footer />
		</div>
	);
}

export default App;
