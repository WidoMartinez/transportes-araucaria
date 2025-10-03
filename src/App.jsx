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
// import AdminPricing from "./components/AdminPricing"; // Eliminado
// import AdminCodigos from "./components/AdminCodigos"; // Eliminado
// import CodigoDescuento from "./components/CodigoDescuento"; // Eliminado

// Nuevos componentes del dashboard
import DashboardReservas from "./components/DashboardReservas";
import AdminCodigosMejorado from "./components/AdminCodigosMejorado";
import HistorialCodigos from "./components/HistorialCodigos";

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
		pathname === "/admin" ||
		// Ruta: /dashboard
		pathname === "/dashboard"
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
	const [phoneError, setPhoneError] = useState("");
	const [reviewChecklist, setReviewChecklist] = useState({
		viaje: false,
		contacto: false,
	});
	const [loadingGateway, setLoadingGateway] = useState(null);

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
						import.meta.env.VITE_API_URL ||
						"https://transportes-araucaria.onrender.com";
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

	// --- LÓGICA DE CÁLCULO DE PRECIOS ---
	const cotizacion = useMemo(() => {
		const selectedDestino = destinosData.find(
			(d) => d.nombre === formData.destino
		);
		const precioBase = selectedDestino ? selectedDestino.precio : 0;
		const numPasajeros = parseInt(formData.pasajeros);
		const precioPorPasajero = selectedDestino
			? selectedDestino.precioPorPasajero
			: 0;

		let subtotal = precioBase + (numPasajeros - 1) * precioPorPasajero;

		// Aplicar descuentos globales
		if (descuentosGlobales.descuentoOnline.activo) {
			subtotal *= 1 - descuentosGlobales.descuentoOnline.valor / 100;
		}
		if (formData.idaVuelta && descuentosGlobales.descuentoRoundTrip.activo) {
			subtotal *= 1 - descuentosGlobales.descuentoRoundTrip.valor / 100;
		}

		// Aplicar promociones por día/horario
		const currentDayTags = getDayTagsFromDate(formData.fecha);
		const currentTime = formData.hora;

		let promocionAplicada = null;
		promotions.forEach((promo) => {
			if (
				promo.activo &&
				(promo.destino === "" ||
					promo.destino.toLowerCase() === formData.destino.toLowerCase() ||
					promo.destino.toLowerCase() === "todos") &&
				(promo.aplicaTipoViaje.ambos ||
					(promo.aplicaTipoViaje.ida && !formData.idaVuelta) ||
					(promo.aplicaTipoViaje.vuelta && formData.idaVuelta)) &&
				(promo.aplicaPorDias === false ||
					promo.dias.some((day) => currentDayTags.includes(day))) &&
				(promo.aplicaPorHorario === false ||
					isTimeWithinRange(currentTime, promo.horaInicio, promo.horaFin))
			) {
				if (promo.descuentoPorcentaje > (promocionAplicada?.descuentoPorcentaje || 0)) {
					promocionAplicada = promo;
				}
			}
		});

		if (promocionAplicada) {
			subtotal *= 1 - promocionAplicada.descuentoPorcentaje / 100;
		}

		// Aplicar código de descuento (si existe y es válido)
		let descuentoCodigo = 0;
		if (codigoAplicado) {
			if (codigoAplicado.tipo === "porcentaje") {
				descuentoCodigo = subtotal * (codigoAplicado.valor / 100);
			} else if (codigoAplicado.tipo === "monto") {
				descuentoCodigo = codigoAplicado.valor;
			}
			subtotal -= descuentoCodigo;
		}

		const precioFinal = Math.max(0, subtotal);

		return {
			precio: precioFinal,
			precioBase,
			numPasajeros,
			promocionAplicada,
			codigoAplicado,
			descuentoCodigo,
		};
	}, [formData, destinosData, promotions, descuentosGlobales, codigoAplicado]);

	// --- MANEJO DE ENVÍO DE FORMULARIO ---
	const handleSubmit = async (e) => {
		e.preventDefault();
		setIsSubmitting(true);
		setPhoneError("");

		// Validar número de teléfono
		const phoneRegex = /^\+569\d{8}$/;
		if (!phoneRegex.test(formData.telefono)) {
			setPhoneError("Formato de teléfono inválido. Debe ser +569XXXXXXXX.");
			setIsSubmitting(false);
			return;
		}

		// Validar checkboxes de revisión
		if (!reviewChecklist.viaje || !reviewChecklist.contacto) {
			alert("Por favor, confirma los detalles del viaje y contacto.");
			setIsSubmitting(false);
			return;
		}

		const dataToSend = {
			...formData,
			precioFinal: cotizacion.precio,
			promocionAplicada: cotizacion.promocionAplicada?.id || null,
			codigoDescuentoAplicado: cotizacion.codigoAplicado?.codigo || null,
		};

		console.log("Datos a enviar:", dataToSend);

		try {
			setLoadingGateway("Enviando solicitud...");
			const apiUrl =
				import.meta.env.VITE_API_URL ||
				"https://transportes-araucaria.onrender.com";
			const response = await fetch(`${apiUrl}/submit-form`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(dataToSend),
			});

			const result = await response.json();

			if (result.success) {
				console.log("Formulario enviado con éxito:", result);
				setShowConfirmationAlert(true);
				// Limpiar formulario o redirigir
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
				setCodigoAplicado(null);
				setReviewChecklist({ viaje: false, contacto: false });
			} else {
				console.error("Error al enviar formulario:", result.message);
				alert("Error al enviar el formulario: " + result.message);
			}
		} catch (error) {
			console.error("Error de red o del servidor:", error);
			alert("Ocurrió un error al conectar con el servidor.");
		} finally {
			setIsSubmitting(false);
			setLoadingGateway(null);
		}
	};

	// Determinar la vista actual (admin o cliente)
	const currentPath = typeof window !== "undefined" ? window.location.pathname.toLowerCase() : "/";

	const renderContent = () => {
		if (currentPath === "/dashboard") {
			return <DashboardReservas />;
		} else if (currentPath === "/admin/codigos") {
			return <AdminCodigosMejorado />;
		} else if (currentPath === "/admin/historial") {
			return <HistorialCodigos />;
		} else if (isAdminView) {
			return (
				<div className="min-h-screen bg-gray-100 p-8">
					<h1 className="text-4xl font-bold text-center mb-8">Panel de Administración</h1>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						<div className="bg-white p-6 rounded-lg shadow-md">
							<h2 className="text-2xl font-semibold mb-4">Administrar Precios</h2>
							<p className="text-gray-600 mb-4">Gestiona los precios de los destinos y las promociones.</p>
							<Button onClick={() => window.location.href = "/admin/precios"}>Ir a Precios</Button>
						</div>
						<div className="bg-white p-6 rounded-lg shadow-md">
							<h2 className="text-2xl font-semibold mb-4">Administrar Códigos</h2>
							<p className="text-gray-600 mb-4">Crea, edita y elimina códigos de descuento.</p>
							<Button onClick={() => window.location.href = "/admin/codigos"}>Ir a Códigos</Button>
						</div>
						<div className="bg-white p-6 rounded-lg shadow-md">
							<h2 className="text-2xl font-semibold mb-4">Historial de Códigos</h2>
							<p className="text-gray-600 mb-4">Visualiza el historial de uso de los códigos.</p>
							<Button onClick={() => window.location.href = "/admin/historial"}>Ver Historial</Button>
						</div>
						<div className="bg-white p-6 rounded-lg shadow-md">
							<h2 className="text-2xl font-semibold mb-4">Dashboard de Reservas</h2>
							<p className="text-gray-600 mb-4">Accede al nuevo dashboard de gestión de reservas.</p>
							<Button onClick={() => window.location.href = "/dashboard"}>Ver Dashboard</Button>
						</div>
					</div>
				</div>
			);
		} else {
			return (
				<>
					<Header />
					<Hero
						formData={formData}
						setFormData={setFormData}
						destinosData={destinosData}
						cotizacion={cotizacion}
						promotions={promotions}
						codigoAplicado={codigoAplicado}
						codigoError={codigoError}
						validandoCodigo={validandoCodigo}
						validarCodigo={validarCodigo}
						removerCodigo={removerCodigo}
						loadingPrecios={loadingPrecios}
						isSubmitting={isSubmitting}
						phoneError={phoneError}
						reviewChecklist={reviewChecklist}
						setReviewChecklist={setReviewChecklist}
						handleSubmit={handleSubmit}
						loadingGateway={loadingGateway}
					/>
					<Servicios />
					<Destinos destinosData={destinosData} />
					<Destacados destacadosData={destacadosData} />
					<PorQueElegirnos />
					<Testimonios />
					<Contacto />
					<Fidelizacion />
					<Footer />
					{showConfirmationAlert && (
						<Dialog
							open={showConfirmationAlert}
							onOpenChange={setShowConfirmationAlert}
						>
							<DialogContent>
								<DialogHeader>
									<DialogTitle>¡Reserva Enviada!</DialogTitle>
									<DialogDescription>
										Tu solicitud de reserva ha sido recibida. Te
										contactaremos pronto.
									</DialogDescription>
								</DialogHeader>
								<DialogFooter>
									<DialogClose asChild>
										<Button type="button">Cerrar</Button>
									</DialogClose>
								</DialogFooter>
							</DialogContent>
						</Dialog>
					)}
				</>
			);
		}
	};

	return <div className="App">{renderContent()}</div>;
}

export default App;

