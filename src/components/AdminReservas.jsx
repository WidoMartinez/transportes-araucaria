import React, { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { formatCurrency } from "../lib/utils";
import * as XLSX from "xlsx";
import { getBackendUrl } from "../lib/backend";
import { useAuth } from "../contexts/AuthContext";
import { useAuthenticatedFetch } from "../hooks/useAuthenticatedFetch";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";
import { Checkbox } from "./ui/checkbox";
import { AddressAutocomplete } from "./ui/address-autocomplete";
import { Alert, AlertTitle, AlertDescription } from "./ui/alert";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "./ui/dialog";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "./ui/table";
import {
	Search,
	ChevronLeft,
	ChevronRight,
	Edit,
	Eye,
	DollarSign,
	Calendar,
	User,
	Phone,
	Mail,
	MapPin,
	Clock,
	Users,
	FileText,
	TrendingUp,
	CheckCircle2,
	XCircle,
	AlertCircle,
	RefreshCw,
	Plus,
	Star,
	History,
	Settings2,
	Trash2,
	CheckSquare,
	Square,
	Printer,
	Car,
	Copy,
	ArrowUpDown,
	Baby,
	ClipboardList,
	Hash,
	Link2,
	Edit3,
	MessageSquare,
	Tag,
	CreditCard,
	RefreshCcw,
} from "lucide-react";

// Helper que detecta upgrade revisando el booleano upgradeVan Y el campo vehiculo
// (cubre reservas históricas donde upgradeVan=false pero vehiculo contiene 'Upgrade')
const esUpgrade = (reserva) =>
	Boolean(reserva?.upgradeVan) ||
	Boolean(reserva?.vehiculo?.includes("Upgrade"));

// Helper para generar texto formateado para conductor (WhatsApp)
const generarTextoConductor = (reserva) => {
	if (!reserva) return "";

	const AEROPUERTO_BUSQUEDA = "aeropuerto";

	// Formato de fecha y hora local
	const fechaStr = reserva.fecha
		? new Date(reserva.fecha + "T00:00:00").toLocaleDateString("es-CL")
		: "Sin fecha";

	const horaStr = reserva.hora || "Sin hora";

	// Referencia (Hotel, etc)
	const hotelRefStr = reserva.hotel ? ` [${reserva.hotel}]` : "";

	// Construir dirección de origem y destino con detalles si existen
	let origenStr = reserva.origen || "Sin origen";
	if (reserva.direccionOrigen) {
		origenStr += ` (${reserva.direccionOrigen})`;
	}
	// Si el origen NO es aeropuerto, añadir referencia
	if (!origenStr.toLowerCase().includes(AEROPUERTO_BUSQUEDA)) {
		origenStr += hotelRefStr;
	}

	let destinoStr = reserva.destino || "Sin destino";
	if (reserva.direccionDestino) {
		destinoStr += ` (${reserva.direccionDestino})`;
	}
	// Si el destino NO es aeropuerto, añadir referencia
	if (!destinoStr.toLowerCase().includes(AEROPUERTO_BUSQUEDA)) {
		destinoStr += hotelRefStr;
	}

	// Generar enlaces de Google Maps para el punto "específico" (el que no es aeropuerto)
	const esOrigenAero = (reserva.origen || "")
		.toLowerCase()
		.includes(AEROPUERTO_BUSQUEDA);

	const addressEspecifica = esOrigenAero
		? reserva.direccionDestino || reserva.destino || ""
		: reserva.direccionOrigen || reserva.origen || "";
	const mapsQuery = reserva.hotel
		? `${reserva.hotel}, ${addressEspecifica}`
		: addressEspecifica;

	const mapsLink = mapsQuery
		? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`
		: "";

	// info adicional
	const vueloStr = reserva.numeroVuelo
		? `\n✈️ *Vuelo:* ${reserva.numeroVuelo}`
		: "";
	const observacionesStr = reserva.observaciones
		? `\n📝 *Obs:* ${reserva.observaciones}`
		: "";

	const mapsStr = mapsLink ? `\n📍 *Maps:* ${mapsLink}` : "";

	return `*NUEVO SERVICIO ASIGNADO* 🚖

🗓 *Fecha:* ${fechaStr}
⏰ *Hora:* ${horaStr}
👤 *Pasajero:* ${reserva.nombre || "Sin nombre"}
📍 *Origen:* ${origenStr}
🏁 *Destino:* ${destinoStr}${mapsStr}
👥 *Pax:* ${reserva.pasajeros || 1}${vueloStr}${observacionesStr}`;
};

const copiarInfoCliente = (reserva) => {
	if (!reserva) return "";
	return `*DATOS DEL CLIENTE* 👤
👤 *Nombre:* ${reserva.nombre || "Sin nombre"}
📞 *Teléfono:* ${reserva.telefono || "Sin teléfono"}
📧 *Email:* ${reserva.email || "Sin email"}`;
};

const copiarInfoFinanzas = (reserva) => {
	if (!reserva) return "";
	return `*RESUMEN DE PAGO* 💰
💵 *Total:* ${formatCurrency(reserva.totalConDescuento)}
✅ *Pagado:* ${formatCurrency(reserva.pagoMonto || 0)}
⚠️ *Saldo Pendiente:* ${formatCurrency(reserva.saldoPendiente || 0)}
💳 *Metodo:* ${reserva.metodoPago || "No especificado"}`;
};

const copiarInfoItinerario = (reserva) => {
	if (!reserva) return "";
	const fechaStr = reserva.fecha
		? new Date(reserva.fecha + "T00:00:00").toLocaleDateString("es-CL")
		: "Sin fecha";

	let text = `*ITINERARIO DE VIAJE* 🗓️
🗓️ *Fecha:* ${fechaStr}
⏰ *Hora:* ${reserva.hora || "Sin hora"}
📍 *Origen:* ${reserva.origen}${reserva.direccionOrigen ? ` (${reserva.direccionOrigen})` : ""}
🏁 *Destino:* ${reserva.destino}${reserva.direccionDestino ? ` (${reserva.direccionDestino})` : ""}
👥 *Pax:* ${reserva.pasajeros || 1}`;

	if (reserva.tramoVuelta || (reserva.fechaRegreso && reserva.horaRegreso)) {
		const vuelta = reserva.tramoVuelta || {};
		const fVuelta = vuelta.fecha || reserva.fechaRegreso;
		const hVuelta = vuelta.hora || reserva.horaRegreso;
		const fVueltaStr = fVuelta
			? new Date(fVuelta + "T00:00:00").toLocaleDateString("es-CL")
			: "Sin fecha";

		text += `\n\n*REGRESO* 🔄
🗓️ *Fecha:* ${fVueltaStr}
⏰ *Hora:* ${hVuelta || "Sin hora"}`;
	}

	return text;
};

const copiarInfoComplementos = (reserva) => {
	if (!reserva) return "";
	let text = `*DETALLES ADICIONALES* ➕`;
	if (reserva.numeroVuelo) text += `\n✈️ *Vuelo:* ${reserva.numeroVuelo}`;
	if (reserva.hotel) text += `\n🏨 *Hotel/Ref:* ${reserva.hotel}`;
	if (reserva.equipajeEspecial)
		text += `\n🎒 *Equipaje:* ${reserva.equipajeEspecial}`;
	if (reserva.sillaInfantil) text += `\n👶 *Silla:* REQUERIDA`;
	return text;
};
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "./ui/alert-dialog";

const AEROPUERTO_LABEL = "Aeropuerto La Araucanía";
const normalizeDestino = (value) =>
	(value || "").toString().trim().toLowerCase();

// Opciones de hora en intervalos de 15 minutos (00:00 - 23:45)
const TIME_OPTIONS = (() => {
	const options = [];
	for (let hour = 0; hour <= 23; hour++) {
		for (let minute = 0; minute < 60; minute += 15) {
			const horaStr = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
			options.push(horaStr);
		}
	}
	return options;
})();

function AdminReservas() {
	// Sistema de autenticación moderno
	const { accessToken } = useAuth();
	const { authenticatedFetch } = useAuthenticatedFetch();

	// Detección de dispositivos móviles
	const isMobile = useMediaQuery("(max-width: 767px)");
	const isTablet = useMediaQuery("(min-width: 768px) and (max-width: 1023px)");

	const [reservas, setReservas] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [selectedReserva, setSelectedReserva] = useState(null);
	const [showEditDialog, setShowEditDialog] = useState(false);
	const [showDetailDialog, setShowDetailDialog] = useState(false);
	const [transacciones, setTransacciones] = useState([]);
	const [loadingTransacciones, setLoadingTransacciones] = useState(false);
	const [showNewDialog, setShowNewDialog] = useState(false);
	const [saving, setSaving] = useState(false);
	// Estados para editar ruta con 'otro'
	const [editOrigenEsOtro, setEditOrigenEsOtro] = useState(false);
	const [editDestinoEsOtro, setEditDestinoEsOtro] = useState(false);
	const [editOtroOrigen, setEditOtroOrigen] = useState("");
	const [editOtroDestino, setEditOtroDestino] = useState("");

	// Estados para Link de Pago
	const [showGenerarLinkDialog, setShowGenerarLinkDialog] = useState(false);
	const [linkGenerado, setLinkGenerado] = useState("");
	const [montoGenerarLink, setMontoGenerarLink] = useState(0);
	const [reservaParaLink, setReservaParaLink] = useState(null);
	const [generandoLink, setGenerandoLink] = useState(false);

	const handleGenerarLinkPago = async () => {
		if (!reservaParaLink) return;
		if (montoGenerarLink <= 0) {
			toast.error("El monto debe ser mayor a 0");
			return;
		}
		try {
			setGenerandoLink(true);
			const response = await authenticatedFetch(
				`/api/reservas/${reservaParaLink.id}/generar-link-pago`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ monto: montoGenerarLink }),
				},
			);

			const data = await response.json();
			if (data.success && data.url) {
				setLinkGenerado(data.url);
				toast.success("Link generado con éxito");
			} else {
				throw new Error(data.message || "Error al generar link");
			}
		} catch (error) {
			console.error("Error generando link:", error);
			toast.error(error.message || "No se pudo generar el link de pago");
		} finally {
			setGenerandoLink(false);
		}
	};

	// Estados para asignaciÃ³n de vehÃ­culo/conductor
	const [showAsignarDialog, setShowAsignarDialog] = useState(false);
	const [regPagoMonto, setRegPagoMonto] = useState("");
	// 'efectivo' como método por defecto para evitar enviar metodo vacío al backend
	const [regPagoMetodo, setRegPagoMetodo] = useState("efectivo");
	const [regPagoReferencia, setRegPagoReferencia] = useState("");
	const [pagoHistorial, setPagoHistorial] = useState([]);

	const apiUrl =
		getBackendUrl() || "https://transportes-araucaria.onrender.com";

	// Limpieza final para resolver errores persistentes

	// Corrección de dependencias en useEffect
	// Línea 94: Envolvemos fetchPagoHistorial en useCallback para evitar cambios en cada render
	const fetchPagoHistorial = useCallback(async () => {
		if (!selectedReserva) return;
		try {
			const resp = await fetch(
				`${apiUrl}/api/reservas/${selectedReserva.id}/pagos`,
			);
			if (resp.ok) {
				const data = await resp.json();
				setPagoHistorial(Array.isArray(data.pagos) ? data.pagos : []);
			} else {
				setPagoHistorial([]);
			}
		} catch (e) {
			console.error("Error al cargar historial de pagos:", e);
		}
	}, [selectedReserva, apiUrl]);

	const fetchTransaccionesHistorial = useCallback(async () => {
		if (!selectedReserva) return;
		setLoadingTransacciones(true);
		try {
			const resp = await authenticatedFetch(
				`/api/reservas/${selectedReserva.id}/transacciones`,
			);
			if (resp.ok) {
				const data = await resp.json();
				setTransacciones(Array.isArray(data.transacciones) ? data.transacciones : []);
			} else {
				setTransacciones([]);
			}
		} catch (error) {
			console.error("Error al cargar transacciones de reserva:", error);
			setTransacciones([]);
		} finally {
			setLoadingTransacciones(false);
		}
	}, [selectedReserva, authenticatedFetch]);

	// ELIMINAR PAGO INDIVIDUAL
	const handleDeletePago = async (pagoId) => {
		if (
			!confirm(
				"¿Estás seguro de que deseas eliminar este registro de pago? El saldo de la reserva se recalculará automáticamente.",
			)
		)
			return;

		try {
			const resp = await fetch(`${apiUrl}/api/pagos/${pagoId}`, {
				method: "DELETE",
				headers: { Authorization: `Bearer ${accessToken}` },
			});
			if (resp.ok) {
				toast.success("Pago eliminado correctamente");
				fetchPagoHistorial();
				// Recargar la reserva para ver el nuevo saldo
				if (selectedReserva) {
					const res = await authenticatedFetch(
						`/api/reservas/${selectedReserva.id}`,
					);
					if (res.ok) {
						const updated = await res.json();
						setSelectedReserva(updated);
						// Actualizar en el listado general
						setReservas((prev) =>
							prev.map((r) => (r.id === updated.id ? updated : r)),
						);
					}
				}
			} else {
				const err = await resp.json();
				toast.error(err.error || "Error al eliminar pago");
			}
		} catch (e) {
			console.error("Error eliminando pago:", e);
			toast.error("Error de conexión al eliminar pago");
		}
	};

	// EDITAR PAGO INDIVIDUAL (Simple prompt por ahora para no saturar con más diálogos)
	const handleEditPago = async (pago) => {
		const nuevoMonto = prompt("Ingresa el nuevo monto (CLP):", pago.amount);
		if (nuevoMonto === null) return;

		const montoNum = parseFloat(nuevoMonto);
		if (isNaN(montoNum) || montoNum < 0) {
			toast.error("Monto inválido");
			return;
		}

		try {
			const resp = await fetch(`${apiUrl}/api/pagos/${pago.id}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${accessToken}`,
				},
				body: JSON.stringify({
					amount: montoNum,
					metodo: pago.metodo,
					referencia: pago.referencia,
				}),
			});

			if (resp.ok) {
				toast.success("Pago actualizado");
				fetchPagoHistorial();
				if (selectedReserva) {
					const res = await authenticatedFetch(
						`/api/reservas/${selectedReserva.id}`,
					);
					if (res.ok) {
						const updated = await res.json();
						setSelectedReserva(updated);
						setReservas((prev) =>
							prev.map((r) => (r.id === updated.id ? updated : r)),
						);
					}
				}
			} else {
				const err = await resp.json();
				toast.error(err.error || "Error al actualizar pago");
			}
		} catch (e) {
			console.error("Error editando pago:", e);
			toast.error("Error de conexión");
		}
	};

	/**
	 * Consulta el estado real del pago en el gateway (Flow/MercadoPago)
	 * y actualiza el campo montoPagado con el monto confirmado.
	 * Útil para recuperar pagos cuyo webhook se perdió (cold start de Render).
	 */
	const handleRecuperarPagoGateway = async () => {
		if (!selectedReserva?.id) return;
		setLoadingRecuperarPago(true);
		try {
			const resp = await fetch(
				`${apiUrl}/api/payment-status?reserva_id=${selectedReserva.id}`,
			);
			if (!resp.ok) throw new Error(`Error ${resp.status}`);
			const data = await resp.json();

			if (data.pagado && data.monto > 0) {
				// Evitar doble acreditación: solo sugerir el monto pendiente por registrar
				const totalReserva =
					Number(
						selectedReserva?.totalConDescuento ?? selectedReserva?.total ?? 0,
					) || 0;
				const pagoPrevio = Number(montoPagadoVisual || 0) || 0;
				const pendiente = Math.max(totalReserva - pagoPrevio, 0);
				const montoGateway = Number(data.monto) || 0;
				const montoARegistrar =
					pendiente > 0 ? Math.min(montoGateway, pendiente) : 0;

				if (montoARegistrar <= 0) {
					toast.info(
						"El pago ya está acreditado en su totalidad. No se requiere registrar monto adicional.",
					);
					return;
				}

				setFormData((prev) => ({
					...prev,
					montoPagado: String(montoARegistrar),
					estadoPago:
						pagoPrevio + montoARegistrar >= totalReserva && totalReserva > 0
							? "pagado"
							: "parcial",
				}));
				const fuente =
					data.fuente === "flow_api_fallback"
						? " (recuperado desde Flow API)"
						: "";
				toast.success(
					`Pago recuperado: $${new Intl.NumberFormat("es-CL").format(montoGateway)}${fuente}. Se cargó $${new Intl.NumberFormat("es-CL").format(montoARegistrar)} para evitar doble contabilización. Guarda la reserva para confirmar.`,
				);
			} else {
				const estadoTexto = data.status || "pendiente";
				toast.info(
					`El gateway reporta estado "${estadoTexto}". No se encontró pago confirmado.`,
				);
			}
		} catch (err) {
			console.error("[RecuperarPago] Error consultando gateway:", err.message);
			toast.error(
				"No se pudo consultar el gateway de pago. Intenta nuevamente.",
			);
		} finally {
			setLoadingRecuperarPago(false);
		}
	};

	// Sincronizar saldos de tramos vinculados (resuelve saldos residuales por redondeo en split de pago)
	const handleSincronizarTramos = async () => {
		if (!selectedReserva?.id) return;
		if (
			!confirm(
				"¿Corregir los saldos de los tramos de esta reserva ida/vuelta? Esto recalculará saldoPendiente y estadoPago basándose en el pagoMonto actual.",
			)
		)
			return;
		setLoadingSincronizarTramos(true);
		try {
			const resp = await authenticatedFetch(
				`/api/reservas/${selectedReserva.id}/sincronizar-tramos`,
				{ method: "POST" },
			);
			if (!resp.ok) throw new Error(`Error ${resp.status}`);
			const data = await resp.json();
			// Recargar la reserva actualizada
			const respActualizada = await authenticatedFetch(
				`/api/reservas/${selectedReserva.id}?t=${Date.now()}`,
			);
			if (respActualizada.ok) {
				const reservaActualizada = await respActualizada.json();
				setSelectedReserva(reservaActualizada);
				setReservas((prev) =>
					prev.map((r) =>
						r.id === reservaActualizada.id ? reservaActualizada : r,
					),
				);
			}
			const tramos = data.tramos || [];
			const resumen = tramos
				.map(
					(tr) =>
						`#${tr.id}: saldo $${tr.saldoCorregido.toLocaleString("es-CL")}`,
				)
				.join(" | ");
			if (data.esDoblePago) {
				toast.success(
					`✔ Doble acreditación corregida. Los pagos fueron redistribuidos: ${resumen}`,
				);
			} else {
				toast.success(`✔ Saldos sincronizados. ${resumen}`);
			}
		} catch (err) {
			console.error("[SincronizarTramos] Error:", err.message);
			toast.error("No se pudo sincronizar los tramos. Intenta nuevamente.");
		} finally {
			setLoadingSincronizarTramos(false);
		}
	};

	// Recargar historial de pagos cuando cambie la reserva seleccionada o se cierre el modal de registro
	useEffect(() => {
		if (selectedReserva) {
			fetchPagoHistorial();
			fetchTransaccionesHistorial();
		} else {
			setPagoHistorial([]);
			setTransacciones([]);
		}
	}, [selectedReserva, fetchPagoHistorial, fetchTransaccionesHistorial]);
	const [vehiculos, setVehiculos] = useState([]);
	const [conductores, setConductores] = useState([]);
	const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState("");
	const [conductorSeleccionado, setConductorSeleccionado] = useState("");
	const [loadingAsignacion, setLoadingAsignacion] = useState(false);
	const [enviarNotificacion, setEnviarNotificacion] = useState(true);
	const [enviarNotificacionConductor, setEnviarNotificacionConductor] =
		useState(true);
	const [enviarActualizacionConductor, setEnviarActualizacionConductor] =
		useState(false);
	// Estados para pre-cargar y validar contra asignaciÃ³n actual
	const [assignedPatente, setAssignedPatente] = useState("");
	const [assignedConductorNombre, setAssignedConductorNombre] = useState("");
	const [assignedVehiculoId, setAssignedVehiculoId] = useState(null);
	const [assignedConductorId, setAssignedConductorId] = useState(null);
	// Estados para manejar reservas vinculadas (ida y vuelta)
	const [reservaVuelta, setReservaVuelta] = useState(null);
	const [asignarAmbas, setAsignarAmbas] = useState(true);
	const [vueltaVehiculoSeleccionado, setVueltaVehiculoSeleccionado] =
		useState("");
	const [vueltaConductorSeleccionado, setVueltaConductorSeleccionado] =
		useState("");
	const [historialAsignaciones, setHistorialAsignaciones] = useState([]);
	const [loadingHistorial, setLoadingHistorial] = useState(false);
	// Estados para diálogo de completar reservas vinculadas
	const [showDialogoCompletar, setShowDialogoCompletar] = useState(false);

	const montoFlowUnico = useMemo(() => {
		const lista = Array.isArray(transacciones) ? transacciones : [];
		const flowAprobadas = lista.filter(
			(t) =>
				String(t?.estado || "").toLowerCase() === "aprobado" &&
				String(t?.gateway || "").toLowerCase() === "flow",
		);

		if (flowAprobadas.length === 0) return 0;

		const unicas = new Map();
		for (const tx of flowAprobadas) {
			const clave = String(
				tx?.transaccionId || tx?.referencia || tx?.id || Math.random(),
			);
			if (!unicas.has(clave)) {
				unicas.set(clave, Number(tx?.monto || 0) || 0);
			}
		}

		let suma = 0;
		for (const monto of unicas.values()) suma += monto;
		return suma;
	}, [transacciones]);

		const montoPagadoVisual = useMemo(() => {
			const montoDB = Number(selectedReserva?.pagoMonto || 0) || 0;
			const esFlow =
				selectedReserva?.pagoGateway === "flow" ||
				selectedReserva?.metodoPago === "flow";
			if (esFlow && montoFlowUnico > 0) return montoFlowUnico;
			return montoDB;
		}, [selectedReserva, montoFlowUnico]);
	const [dialogoCompletarOpciones, setDialogoCompletarOpciones] =
		useState(null);

	// Filtros y bÃºsqueda
	const [searchTerm, setSearchTerm] = useState("");
	const [estadoFiltro, setEstadoFiltro] = useState("todos");
	const [estadoPagoFiltro, setEstadoPagoFiltro] = useState("todos");
	const [fechaDesde, setFechaDesde] = useState("");
	const [fechaHasta, setFechaHasta] = useState("");
	// Nuevo selector de rango y filtros inteligentes
	const [filtroInteligente, setFiltroInteligente] = useState("todos"); // 'sin_asignacion', 'incompletas', 'archivadas'
	const [rangoFecha, setRangoFecha] = useState("todos");

	// Estado de ordenamiento
	const [sortConfig, setSortConfig] = useState({
		key: "created_at",
		direction: "desc",
	});

	// Función para manejar el ordenamiento
	const handleSort = (key) => {
		let direction = "asc";
		if (sortConfig.key === key && sortConfig.direction === "asc") {
			direction = "desc";
		}
		setSortConfig({ key, direction });
	};

	// Manejar cambio de rango de fechas
	const handleRangoFechaChange = (valor) => {
		setRangoFecha(valor);
		const hoy = new Date();

		// Helper para formatear fecha localmente como YYYY-MM-DD
		const formatDateLocal = (date) => {
			const year = date.getFullYear();
			const month = String(date.getMonth() + 1).padStart(2, "0");
			const day = String(date.getDate()).padStart(2, "0");
			return `${year}-${month}-${day}`;
		};

		let desde = "";
		let hasta = "";

		if (valor === "hoy") {
			const hoyStr = formatDateLocal(hoy);
			desde = hoyStr;
			hasta = hoyStr;
		} else if (valor === "ayer") {
			const ayer = new Date(hoy);
			ayer.setDate(hoy.getDate() - 1);
			const ayerStr = formatDateLocal(ayer);
			desde = ayerStr;
			hasta = ayerStr;
		} else if (valor === "semana") {
			// Últimos 7 días
			const hace7 = new Date(hoy);
			hace7.setDate(hoy.getDate() - 7);
			desde = formatDateLocal(hace7);
			hasta = formatDateLocal(hoy);
		} else if (valor === "quincena") {
			// Últimos 15 días
			const hace15 = new Date(hoy);
			hace15.setDate(hoy.getDate() - 15);
			desde = formatDateLocal(hace15);
			hasta = formatDateLocal(hoy);
		} else if (valor === "mes") {
			// Mes actual
			// Primer día del mes actual
			const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
			desde = formatDateLocal(primerDia);
			// Último día del mes actual (día 0 del mes siguiente)
			const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
			hasta = formatDateLocal(ultimoDia);
		} else if (valor === "todos") {
			desde = "";
			hasta = "";
		}

		// Si es 'personalizado', no cambiamos las fechas automÃ¡ticamente
		if (valor !== "personalizado") {
			setFechaDesde(desde);
			setFechaHasta(hasta);
		}
	};

	// PaginaciÃ³n
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [totalReservas, setTotalReservas] = useState(0);
	const [itemsPerPage, setItemsPerPage] = useState(20);

	// EstadÃ­sticas
	const [estadisticas, setEstadisticas] = useState({
		totalReservas: 0,
		reservasPendientes: 0,
		reservasConfirmadas: 0,
		reservasPagadas: 0,
		totalIngresos: 0,
	});

	// Formulario de ediciÃ³n
	const [formData, setFormData] = useState({
		estado: "",
		estadoPago: "",
		metodoPago: "",
		referenciaPago: "",
		tipoPago: "",
		montoPagado: "",
		observaciones: "",
		numeroVuelo: "",
		hotel: "",
		equipajeEspecial: "",
		sillaInfantil: false,
		horaRegreso: "",
		direccionOrigen: "",
		direccionDestino: "",
	});

	// Formulario de nueva reserva
	const [newReservaForm, setNewReservaForm] = useState({
		nombre: "",
		rut: "",
		email: "",
		telefono: "",
		clienteId: null,
		origen: "",
		destino: "",
		fecha: "",
		hora: "08:00",
		pasajeros: 1,
		precio: 0,
		vehiculo: "sedan",
		numeroVuelo: "",
		hotel: "",
		equipajeEspecial: "",
		sillaInfantil: false,
		idaVuelta: false,
		fechaRegreso: "",
		horaRegreso: "",
		abonoSugerido: 0,
		saldoPendiente: 0,
		totalConDescuento: 0,
		mensaje: "",
		// Estado inicial debe ser pendiente, solo se confirma si el pago estÃ¡ realizado
		estado: "pendiente",
		estadoPago: "pendiente",
		metodoPago: "",
		observaciones: "",
		enviarCorreo: true,
		// Nuevos campos para pago inicial
		registrarPagoInicial: false,
		pagoMonto: "",
		pagoMetodo: "efectivo",
		pagoReferencia: "",
	});

	// Catálogo de destinos (para selects)
	const [destinosCatalog, setDestinosCatalog] = useState([]);
	const [origenEsOtro, setOrigenEsOtro] = useState(false);
	const [destinoEsOtro, setDestinoEsOtro] = useState(false);
	const [otroOrigen, setOtroOrigen] = useState("");
	const [otroDestino, setOtroDestino] = useState("");
	// Sentido del viaje para nueva reserva: 'hacia_aeropuerto' | 'desde_aeropuerto' | 'otro'
	const [sentidoViaje, setSentidoViaje] = useState("hacia_aeropuerto");

	const fetchDestinosCatalog = async () => {
		try {
			const resp = await fetch(`${apiUrl}/pricing`);
			if (resp.ok) {
				const data = await resp.json();
				const names = Array.isArray(data.destinos)
					? data.destinos
							.map((d) => (d && d.nombre ? String(d.nombre).trim() : ""))
							.filter(Boolean)
					: [];
				const uniqueNames = [...new Set(names)];
				const includesAeropuerto = uniqueNames.some(
					(n) => normalizeDestino(n) === normalizeDestino(AEROPUERTO_LABEL),
				);
				const merged = includesAeropuerto
					? uniqueNames
					: [AEROPUERTO_LABEL, ...uniqueNames];
				setDestinosCatalog(merged);
			}
		} catch {
			setDestinosCatalog([AEROPUERTO_LABEL]);
		}
	};

	const destinosOptions = useMemo(() => {
		const seen = new Set();
		const result = [];
		const pushValue = (value) => {
			const normalized = normalizeDestino(value);
			if (!normalized || seen.has(normalized)) return;
			seen.add(normalized);
			result.push(value.toString().trim());
		};
		pushValue(AEROPUERTO_LABEL);
		destinosCatalog.forEach(pushValue);
		return result;
	}, [destinosCatalog]);

	const destinosSet = useMemo(() => {
		const set = new Set();
		destinosOptions.forEach((value) => set.add(normalizeDestino(value)));
		return set;
	}, [destinosOptions]);

	const destinoExiste = useCallback(
		(valor) => destinosSet.has(normalizeDestino(valor)),
		[destinosSet],
	);

	// Estados para autocompletado de clientes
	const [clienteSugerencias, setClienteSugerencias] = useState([]);
	const [mostrandoSugerencias, setMostrandoSugerencias] = useState(false);
	const [clienteSeleccionado, setClienteSeleccionado] = useState(null);

	// Columnas (config centralizada + persistencia)
	const COLUMN_DEFINITIONS = [
		{ key: "id", label: "ID", defaultVisible: true },
		{ key: "cliente", label: "Cliente", defaultVisible: true },
		{ key: "contacto", label: "Contacto", defaultVisible: true },
		{ key: "rut", label: "RUT", defaultVisible: false },
		{ key: "ruta", label: "Ruta", defaultVisible: true },
		{
			key: "direccionOrigen",
			label: "Dir. Origen",
			defaultVisible: false,
		},
		{
			key: "direccionDestino",
			label: "Dir. Destino",
			defaultVisible: false,
		},
		{ key: "fechaHora", label: "Fecha/Hora Viaje", defaultVisible: true },
		{ key: "fechaCreacion", label: "Fecha Creación", defaultVisible: false },
		{ key: "pasajeros", label: "Pasajeros", defaultVisible: true },
		{ key: "total", label: "Total", defaultVisible: true },
		{ key: "estado", label: "Estado", defaultVisible: true },
		{ key: "pago", label: "Pago", defaultVisible: true },
		{ key: "saldo", label: "Saldo", defaultVisible: true },
		{ key: "esCliente", label: "Es Cliente", defaultVisible: false },
		{ key: "numViajes", label: "Núm. Viajes", defaultVisible: false },
		{ key: "upgrade", label: "Upgrade", defaultVisible: true },
		{ key: "acciones", label: "Acciones", defaultVisible: true },
	];

	const DEFAULT_COLUMNAS_VISIBLES = COLUMN_DEFINITIONS.reduce((acc, d) => {
		acc[d.key] = Boolean(d.defaultVisible);
		return acc;
	}, {});

	// Claves storage (v2 con fallback a v1)
	const COLUMNAS_STORAGE_KEY = "adminReservas_columnasVisibles_v2";
	const COLUMNAS_STORAGE_FALLBACK_KEYS = [
		"adminReservas_columnasVisibles_v2",
		"adminReservas_columnasVisibles_v1",
	];

	// InicializaciÃ³n perezosa desde storage para evitar reseteos al montar
	const [columnasVisibles, setColumnasVisibles] = useState(() => {
		try {
			let parsed = null;
			for (const k of COLUMNAS_STORAGE_FALLBACK_KEYS) {
				const raw = localStorage.getItem(k);
				if (!raw) continue;
				try {
					const obj = JSON.parse(raw);
					if (obj && typeof obj === "object") {
						parsed = obj;
						break;
					}
				} catch {
					// Ignorar errores de parseo de localStorage
				}
			}
			if (!parsed) return { ...DEFAULT_COLUMNAS_VISIBLES };
			const merged = { ...DEFAULT_COLUMNAS_VISIBLES };
			for (const k of Object.keys(DEFAULT_COLUMNAS_VISIBLES)) {
				if (typeof parsed[k] === "boolean") merged[k] = parsed[k];
			}
			return merged;
		} catch {
			return { ...DEFAULT_COLUMNAS_VISIBLES };
		}
	});

	// Guardar configuraciÃ³n de columnas cuando cambie
	useEffect(() => {
		try {
			localStorage.setItem(
				COLUMNAS_STORAGE_KEY,
				JSON.stringify(columnasVisibles),
			);
		} catch {
			// Ignorar errores de localStorage
		}
	}, [columnasVisibles]);

	// Estado para modal de historial de cliente
	const [showHistorialDialog, setShowHistorialDialog] = useState(false);
	const [historialCliente, setHistorialCliente] = useState(null);

	// Estados para acciones masivas
	const [selectedReservas, setSelectedReservas] = useState([]);

	// Función para exportar reservas seleccionadas a XLS
	const exportarSeleccionadosXLS = () => {
		// Definir las columnas a exportar (etiquetas visibles en el Excel)
		const columnasExportar = [
			{ key: "id", label: "ID Reserva" },
			{ key: "clienteId", label: "ID Cliente" },
			{ key: "cliente", label: "Nombre" },
			{ key: "email", label: "Correo" },
			{ key: "telefono", label: "Teléfono" },
			{ key: "rut", label: "RUT" },
			{ key: "fecha", label: "Fecha" },
			{ key: "hora", label: "Hora" },
			{ key: "origen", label: "Origen" },
			{ key: "destino", label: "Destino" },
			{ key: "totalConDescuento", label: "Total" },
			{ key: "estado", label: "Estado" },
			{ key: "pagoMonto", label: "Monto Pagado" },
			{ key: "saldoPendiente", label: "Saldo Pendiente" },
		];

		// Cabeceras (primera fila)
		const headers = columnasExportar.map((c) => c.label);

		// Si hay reservas seleccionadas, obtener los objetos desde el estado `reservas`
		const filas = [];
		if (selectedReservas && selectedReservas.length > 0) {
			// selectedReservas guarda ids (string o number). Mapear a objetos completos.
			const seleccionObjs = reservas.filter(
				(r) =>
					selectedReservas.includes(r.id) ||
					selectedReservas.includes(String(r.id)),
			);
			seleccionObjs.forEach((reserva) => {
				const fila = columnasExportar.map((col) => {
					let val = reserva[col.key];
					if (val === undefined || val === null) return "";
					// Si el valor es un objeto, intentar extraer campos comunes
					if (typeof val === "object") {
						if (val.nombre) return String(val.nombre);
						if (val.name) return String(val.name);
						if (val.email) return String(val.email);
						if (val.telefono)
							return String(val.telefono || val.phone || val.tel || "");
						// Si es un objeto más complejo, serializar de forma compacta
						try {
							return JSON.stringify(val);
						} catch {
							return String(val);
						}
					}
					// Formatear fechas simples
					if (col.key === "fecha") {
						try {
							const d = new Date(val);
							if (!isNaN(d)) return d.toLocaleString("es-CL");
						} catch {
							// ignore
						}
					}
					return String(val);
				});
				filas.push(fila);
			});
		}

		// Construir matriz de datos: primera fila = headers, luego filas (si existen)
		const aoa = [headers, ...filas];

		// Crear hoja y libro
		const ws = XLSX.utils.aoa_to_sheet(aoa);
		const wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, "Reservas");

		// Descargar archivo (si no hay filas, el archivo tendrá solo la cabecera)
		XLSX.writeFile(wb, "reservas_seleccionadas.xlsx");
	};
	const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
	const [showBulkStatusDialog, setShowBulkStatusDialog] = useState(false);
	const [bulkEstado, setBulkEstado] = useState("");
	const [processingBulk, setProcessingBulk] = useState(false);

	// Estado para mostrar el modal de registro de pago manual
	const [showRegisterPayment, setShowRegisterPayment] = useState(false);

	// Estado de carga para recuperar pago desde el gateway (Flow/MercadoPago)
	const [loadingRecuperarPago, setLoadingRecuperarPago] = useState(false);
	const [loadingSincronizarTramos, setLoadingSincronizarTramos] =
		useState(false);

	// Estado para evaluación de conductor post-viaje
	const [solicitudEvaluacion, setSolicitudEvaluacion] = useState({}); // { [reservaId]: { enviada, fecha, evaluada, promedio } }
	const [solicitandoEvaluacion, setSolicitandoEvaluacion] = useState(false);

	// Estado para mostrar la sección de ajustes manuales inline en el diálogo de edición
	const [showAdjustments, setShowAdjustments] = useState(false);

	// Estado para modal de exportación de calendario
	const [showCalendarDialog, setShowCalendarDialog] = useState(false);
	const [calendarStartDate, setCalendarStartDate] = useState("");
	const [calendarEndDate, setCalendarEndDate] = useState("");
	const [generatingCalendar, setGeneratingCalendar] = useState(false);

	const handleGenerarCalendario = async () => {
		if (!calendarStartDate || !calendarEndDate) {
			alert("Selecciona un rango de fechas válido");
			return;
		}

		setGeneratingCalendar(true);
		try {
			const query = new URLSearchParams({
				fechaInicio: calendarStartDate,
				fechaFin: calendarEndDate,
			});
			const resp = await fetch(`${apiUrl}/api/reservas/calendario?${query}`, {
				headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
			});

			if (resp.ok) {
				const data = await resp.json();
				const eventos = data.eventos || [];

				// Generar HTML para impresión
				const printWindow = window.open("", "_blank");
				if (!printWindow) {
					alert(
						"Permite las ventanas emergentes para imprimir la planificación",
					);
					return;
				}

				// Agrupar por fecha
				const eventosPorFecha = {};
				eventos.forEach((evt) => {
					const fechaStr = evt.fecha; // YYYY-MM-DD
					if (!eventosPorFecha[fechaStr]) eventosPorFecha[fechaStr] = [];
					eventosPorFecha[fechaStr].push(evt);
				});

				// Ordenar fechas
				const fechasOrdenadas = Object.keys(eventosPorFecha).sort();

				let htmlContent = `
					<html>
					<head>
						<title>Planificación de Viajes</title>
						<style>
						body { font-family: Arial, sans-serif; font-size: 12px; margin: 20px; }
						h1 { text-align: center; margin-bottom: 20px; font-size: 18px; }
						.dia-block { margin-bottom: 25px; page-break-inside: avoid; }
						.dia-header { 
							background-color: #f0f0f0; 
							padding: 8px; 
							font-weight: bold; 
							font-size: 14px;
							border-bottom: 2px solid #ccc;
							margin-bottom: 10px;
						}
						.direccion-header {
						padding: 6px 8px;
						font-weight: bold;
						font-size: 12px;
						margin-top: 10px;
						margin-bottom: 5px;
					}
					.direccion-header.hacia-aero {
						background-color: #d1f4e0;
						color: #0d5c2e;
						border-left: 4px solid #10b981;
					}
					.direccion-header.desde-aero {
						background-color: #dbeafe;
						color: #1e3a8a;
						border-left: 4px solid #3b82f6;
					}
					.direccion-header.otros {
						background-color: #f3f4f6;
						color: #374151;
						border-left: 4px solid #6b7280;
					}	
						table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
						th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
						th { background-color: #f9f9f9; width: 15%; }
						.reserva-row { page-break-inside: avoid; }
						.retorno-badge { 
							background-color: #e6f7ff; 
							color: #0050b3; 
							border: 1px solid #91d5ff; 
							padding: 2px 5px; 
							border-radius: 4px; 
							font-size: 10px; 
							font-weight: bold;
							display: inline-block;
							margin-left: 5px;
						}
						.ida-badge { 
							background-color: #f6ffed;
							color: #389e0d;
							border: 1px solid #b7eb8f;
							padding: 2px 5px;
							border-radius: 4px; 
							font-size: 10px; 
							font-weight: bold;
							display: inline-block;
							margin-left: 5px;
						}
						@media print {
							.no-print { display: none; }
							body { margin: 0; }
						}
					</style>
					</head>
					<body>
						<h1>Planificación de Viajes: ${new Date(calendarStartDate).toLocaleDateString("es-CL")} - ${new Date(calendarEndDate).toLocaleDateString("es-CL")}</h1>
				`;

				if (fechasOrdenadas.length === 0) {
					htmlContent +=
						"<p style='text-align:center;'>No hay viajes programados en este período.</p>";
				}

				fechasOrdenadas.forEach((fecha) => {
					// Formatear fecha amigable (e.g. Lunes 25 de Diciembre)
					const fechaObj = new Date(fecha + "T00:00:00");
					const fechaTexto = fechaObj.toLocaleDateString("es-CL", {
						weekday: "long",
						year: "numeric",
						month: "long",
						day: "numeric",
					});

					// Clasificar eventos por dirección
					const eventosDelDia = eventosPorFecha[fecha];
					const viajesHaciaAero = eventosDelDia.filter((ev) => {
						const destinoNorm = (ev.destino || "").toLowerCase();
						return (
							destinoNorm === "aeropuerto la araucanía" ||
							destinoNorm.includes("aeropuerto")
						);
					});
					const viajesDesdeAero = eventosDelDia.filter((ev) => {
						const origenNorm = (ev.origen || "").toLowerCase();
						return (
							origenNorm === "aeropuerto la araucanía" ||
							origenNorm.includes("aeropuerto")
						);
					});
					const otrosViajes = eventosDelDia.filter(
						(ev) =>
							!viajesHaciaAero.includes(ev) && !viajesDesdeAero.includes(ev),
					);

					htmlContent += `<div class="dia-block">
					<div class="dia-header">${fechaTexto.toUpperCase()}</div>`;

					// Función auxiliar para renderizar un grupo de viajes
					const renderGrupoViajes = (viajes, tituloGrupo, claseCSS) => {
						if (viajes.length === 0) return "";

						let html = "";
						if (tituloGrupo) {
							html += `<div class="direccion-header ${claseCSS}">${tituloGrupo}</div>`;
						}

						html += `<table>
						<thead>
							<tr>
								<th style="width: 80px;">Hora</th>
								<th style="width: 120px;">Número Reserva</th>
								<th>Cliente / Contacto</th>
								<th>Ruta / Detalles</th>
								<th style="width: 150px;">Vehículo / Conductor</th>
							</tr>
						</thead>
						<tbody>`;

						viajes.forEach((ev) => {
							const tipoBadge =
								ev.tipo === "RETORNO"
									? `<span class="retorno-badge">RETORNO</span>`
									: `<span class="ida-badge">IDA</span>`;

							const contacto = `
							<b>${ev.cliente}</b><br>
							${ev.telefono || "-"}<br>
							<small>${ev.email || ""}</small>
						`;

							const ruta = `
							<b>Origen:</b> ${ev.direccionOrigen || ev.origen}<br>
							<b>Destino:</b> ${ev.direccionDestino || ev.destino}<br>
							<div style="margin-top:4px;">
								<small>Pax: ${ev.pasajeros} | ${ev.numeroVuelo ? "Vuelo: " + ev.numeroVuelo : ""} ${ev.observaciones ? "<br>Obs: " + ev.observaciones : ""}</small>
							</div>
						`;

							let asignacion = `<span style="color:#999;">Sin asignar</span>`;
							if (ev.vehiculoPatente || ev.conductorNombre) {
								// Construir información del vehículo
								let vehiculoInfo = "";
								if (ev.vehiculoPatente) {
									vehiculoInfo = ev.vehiculoTipo
										? `${ev.vehiculoTipo} (${ev.vehiculoPatente})`
										: ev.vehiculoPatente;
								} else if (ev.vehiculo) {
									vehiculoInfo = ev.vehiculo;
								}

								// Construir información del conductor
								let conductorInfo = "";
								if (ev.conductorNombre) {
									conductorInfo = `👤 ${ev.conductorNombre}`;
								} else if (ev.conductorId) {
									conductorInfo = "(Conductor asignado)";
								}

								asignacion = `
							${vehiculoInfo ? `🚗 ${vehiculoInfo}` : ""}<br>
							${conductorInfo}
						`;
							} else if (ev.vehiculo || ev.conductorId) {
								// Fallback a información genérica si no hay datos específicos
								asignacion = `
							${ev.vehiculo || ""}<br>
							${ev.conductorId ? "(Conductor asignado)" : ""}
						`;
							}

							html += `
							<tr class="reserva-row">
								<td style="font-size:14px; font-weight:bold;">${ev.hora ? ev.hora.substring(0, 5) : "--:--"} ${tipoBadge}</td>
								<td style="font-size:11px; color:#666;">${ev.codigoReserva || "-"}</td>
								<td>${contacto}</td>
								<td>${ruta}</td>
								<td>${asignacion}</td>
							</tr>
						`;
						});

						html += `</tbody></table>`;
						return html;
					};

					// Renderizar grupos en orden: Hacia Aeropuerto, Desde Aeropuerto, Otros
					htmlContent += renderGrupoViajes(
						viajesHaciaAero,
						"✈️ HACIA EL AEROPUERTO",
						"hacia-aero",
					);
					htmlContent += renderGrupoViajes(
						viajesDesdeAero,
						"🏠 DESDE EL AEROPUERTO",
						"desde-aero",
					);
					htmlContent += renderGrupoViajes(
						otrosViajes,
						otrosViajes.length > 0 ? "🚗 OTROS VIAJES" : null,
						"otros",
					);

					htmlContent += `</div>`;
				});

				htmlContent += `
						<div class="no-print" style="margin-top:20px; text-align:center;">
							<button onclick="window.print()" style="padding:10px 20px; font-size:16px; cursor:pointer;">IMPRIMIR</button>
						</div>
					</body>
					</html>
				`;

				printWindow.document.write(htmlContent);
				printWindow.document.close();

				setShowCalendarDialog(false);
			} else {
				alert("Error al cargar la planificación");
			}
		} catch (error) {
			console.error(error);
			alert("Error generando calendario");
		} finally {
			setGeneratingCalendar(false);
		}
	};

	// Cargar estadÃ­sticas
	const fetchEstadisticas = async () => {
		try {
			const response = await fetch(`${apiUrl}/api/reservas/estadisticas`, {
				headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
			});
			if (response.ok) {
				const data = await response.json();
				setEstadisticas(data);
			} else {
				console.warn(
					`Error cargando estadÃ­sticas: ${response.status} ${response.statusText}`,
				);
				// Establecer estadÃ­sticas por defecto en caso de error
				setEstadisticas({
					totalReservas: 0,
					reservasPendientes: 0,
					reservasConfirmadas: 0,
					reservasPagadas: 0,
					totalIngresos: 0,
				});
			}
		} catch (error) {
			console.error("Error cargando estadísticas:", error);
			setEstadisticas({
				totalReservas: 0,
				reservasPendientes: 0,
				reservasConfirmadas: 0,
				reservasPagadas: 0,
				totalIngresos: 0,
			});
		}
	};

	// Cargar vehículos disponibles
	const fetchVehiculos = async () => {
		try {
			const response = await authenticatedFetch(`/api/vehiculos`);
			if (response.ok) {
				const data = await response.json();
				setVehiculos(data.vehiculos || []);
			}
		} catch (error) {
			console.error("Error cargando vehículos:", error);
		}
	};

	// Cargar conductores disponibles
	const fetchConductores = async () => {
		try {
			const response = await authenticatedFetch(`/api/conductores`);
			if (response.ok) {
				const data = await response.json();
				setConductores(data.conductores || []);
			}
		} catch (error) {
			console.error("Error cargando conductores:", error);
		}
	};

	// Abrir diálogo de asignación
	const handleAsignar = async (reserva) => {
		setSelectedReserva(reserva);

		// RESETEAR ESTADO VISUAL DE ASIGNACIÓN ANTERIOR
		// Esto es crucial para que no aparezcan deshabilitados vehículos/conductores
		// de la reserva que se vio anteriormente si la actual no tiene asignación.
		setAssignedPatente("");
		setAssignedVehiculoId(null);
		setAssignedConductorNombre("");
		setAssignedConductorId(null);

		// 1. Detectar si tiene reserva vinculada (VUELTA)
		let reservaVueltaData = null;
		if (reserva.tramoHijoId) {
			try {
				const response = await authenticatedFetch(
					`/api/reservas/${reserva.tramoHijoId}`,
				);
				if (response.ok) {
					reservaVueltaData = await response.json();
					setReservaVuelta(reservaVueltaData);

					// Verificar si ya tienen el mismo conductor y vehículo asignado
					const mismoConductor =
						reserva.conductorId &&
						reserva.conductorId === reservaVueltaData.conductorId;
					const mismoVehiculo =
						reserva.vehiculoId &&
						reserva.vehiculoId === reservaVueltaData.vehiculoId;
					setAsignarAmbas(mismoConductor && mismoVehiculo);
				}
			} catch (error) {
				console.error("Error cargando reserva de vuelta:", error);
				setReservaVuelta(null);
			}
		} else if (reserva.tramoPadreId) {
			// Se abrió desde la VUELTA → cargar la IDA como reserva principal del modal
			// para que la UI siempre muestre IDA arriba y VUELTA abajo.
			try {
				const responseIda = await authenticatedFetch(
					`/api/reservas/${reserva.tramoPadreId}`,
				);
				if (responseIda.ok) {
					const reservaIdaData = await responseIda.json();
					// Intercambiar: la IDA es la principal, la VUELTA (actual) es la secundaria
					setSelectedReserva(reservaIdaData);
					reservaVueltaData = reserva; // la reserva original (vuelta) pasa a ser la vuelta
					setReservaVuelta(reserva);

					// Verificar mismo conductor/vehículo
					const mismoConductor =
						reservaIdaData.conductorId &&
						reservaIdaData.conductorId === reserva.conductorId;
					const mismoVehiculo =
						reservaIdaData.vehiculoId &&
						reservaIdaData.vehiculoId === reserva.vehiculoId;
					setAsignarAmbas(mismoConductor && mismoVehiculo);

					// Pre-cargar selección para IDA (reservaIdaData)
					let preVehIda = "";
					if (vehiculos.length > 0 && reservaIdaData.vehiculoId) {
						const foundIda = vehiculos.find(
							(v) => v.id === reservaIdaData.vehiculoId,
						);
						if (foundIda) {
							preVehIda = foundIda.id.toString();
							setAssignedVehiculoId(foundIda.id);
						}
					}
					setVehiculoSeleccionado(preVehIda);

					let preConIda = "none";
					if (conductores.length > 0 && reservaIdaData.conductorId) {
						const foundConIda = conductores.find(
							(c) => c.id === reservaIdaData.conductorId,
						);
						if (foundConIda) {
							preConIda = foundConIda.id.toString();
							setAssignedConductorId(foundConIda.id);
						}
					}
					setConductorSeleccionado(preConIda);

					// Pre-cargar selección para VUELTA (reserva original)
					let preVehVuelta = "";
					if (vehiculos.length > 0 && reserva.vehiculoId) {
						const foundVuelta = vehiculos.find(
							(v) => v.id === reserva.vehiculoId,
						);
						if (foundVuelta) preVehVuelta = foundVuelta.id.toString();
					}
					setVueltaVehiculoSeleccionado(preVehVuelta);

					let preConVuelta = "none";
					if (conductores.length > 0 && reserva.conductorId) {
						const foundConVuelta = conductores.find(
							(c) => c.id === reserva.conductorId,
						);
						if (foundConVuelta) preConVuelta = foundConVuelta.id.toString();
					}
					setVueltaConductorSeleccionado(preConVuelta);

					setEnviarNotificacion(true);
					setEnviarNotificacionConductor(true);
					setShowAsignarDialog(true);
					if (vehiculos.length === 0) fetchVehiculos();
					if (conductores.length === 0) fetchConductores();
					return; // ya procesamos todo, salir temprano
				}
			} catch (error) {
				console.error("Error cargando reserva de ida vinculada:", error);
				setReservaVuelta(null);
			}
		} else {
			setReservaVuelta(null);
		}

		// 2. Derivar patente del label "TIPO PATENTE" o "TIPO (patente PATENTE)"
		const vehiculoStr = (reserva.vehiculo || "").trim();
		let pat = "";
		// Intentar extraer del formato nuevo: "TIPO (patente XXXX)"
		const matchNew = vehiculoStr.match(/\(patente\s+([^)]+)\)/i);
		if (matchNew) {
			pat = matchNew[1].toUpperCase();
		} else {
			// Formato antiguo: "TIPO PATENTE"
			pat = vehiculoStr.split(" ").pop().toUpperCase();
		}
		setAssignedPatente(pat || "");

		// 3. Intentar extraer nombre de conductor desde observaciones
		const obs = (reserva.observaciones || "").toString();
		const m = obs.match(/Conductor asignado:\s*([^(|\n]+?)(?:\s*\(|$)/i);
		const nombreCon = m ? m[1].trim() : "";
		setAssignedConductorNombre(nombreCon);

		// 4. Intentar preseleccionar si los catálogos ya existen
		let preVeh = "";
		if (vehiculos.length > 0 && pat) {
			const found = vehiculos.find(
				(v) => (v.patente || "").toUpperCase() === pat,
			);
			if (found) {
				preVeh = found.id.toString();
				setAssignedVehiculoId(found.id);
			}
		}
		// Si no encontró por patente, intentar por vehiculoId directo
		if (!preVeh && vehiculos.length > 0 && reserva.vehiculoId) {
			const foundById = vehiculos.find((v) => v.id === reserva.vehiculoId);
			if (foundById) {
				preVeh = foundById.id.toString();
				setAssignedVehiculoId(foundById.id);
			}
		}
		let preCon = "none";
		if (conductores.length > 0 && nombreCon) {
			const foundC = conductores.find(
				(c) => (c.nombre || "").toLowerCase() === nombreCon.toLowerCase(),
			);
			if (foundC) {
				preCon = foundC.id.toString();
				setAssignedConductorId(foundC.id);
			}
		}
		// Si no encontró por nombre, intentar por conductorId directo
		if (preCon === "none" && conductores.length > 0 && reserva.conductorId) {
			const foundCById = conductores.find((c) => c.id === reserva.conductorId);
			if (foundCById) {
				preCon = foundCById.id.toString();
				setAssignedConductorId(foundCById.id);
			}
		}
		setVehiculoSeleccionado(preVeh);
		setConductorSeleccionado(preCon);

		// 5. Si hay VUELTA, pre-cargar sus asignaciones también
		if (reservaVueltaData) {
			// Pre-seleccionar vehículo de VUELTA
			let preVehVuelta = "";
			if (vehiculos.length > 0 && reservaVueltaData.vehiculoId) {
				const foundVuelta = vehiculos.find(
					(v) => v.id === reservaVueltaData.vehiculoId,
				);
				if (foundVuelta) {
					preVehVuelta = foundVuelta.id.toString();
				}
			}
			setVueltaVehiculoSeleccionado(preVehVuelta);

			// Pre-seleccionar conductor de VUELTA
			let preConVuelta = "none";
			if (conductores.length > 0 && reservaVueltaData.conductorId) {
				const foundConVuelta = conductores.find(
					(c) => c.id === reservaVueltaData.conductorId,
				);
				if (foundConVuelta) {
					preConVuelta = foundConVuelta.id.toString();
				}
			}
			setVueltaConductorSeleccionado(preConVuelta);
		}

		setEnviarNotificacion(true);
		setEnviarNotificacionConductor(true);
		setShowAsignarDialog(true);
		// Cargar vehículos y conductores si aún no se han cargado
		if (vehiculos.length === 0) fetchVehiculos();
		if (conductores.length === 0) fetchConductores();
	};

	// Pre-cargar selecciÃ³n cuando se abren catÃ¡logos
	useEffect(() => {
		if (!showAsignarDialog) return;
		if (!vehiculoSeleccionado && assignedPatente && vehiculos.length > 0) {
			const found = vehiculos.find(
				(v) => (v.patente || "").toUpperCase() === assignedPatente,
			);
			if (found) {
				setVehiculoSeleccionado(found.id.toString());
				setAssignedVehiculoId(found.id);
			}
		}
		if (assignedConductorNombre && conductores.length > 0) {
			const foundC = conductores.find(
				(c) =>
					(c.nombre || "").toLowerCase() ===
					assignedConductorNombre.toLowerCase(),
			);
			if (foundC) {
				setConductorSeleccionado(foundC.id.toString());
				setAssignedConductorId(foundC.id);
			}
		}
	}, [
		showAsignarDialog,
		vehiculos,
		conductores,
		assignedPatente,
		assignedConductorNombre,
		vehiculoSeleccionado,
	]);

	// Guardar asignación de vehículo/conductor
	const handleGuardarAsignacion = async () => {
		if (!vehiculoSeleccionado) {
			alert("Debe seleccionar al menos un vehículo para la IDA");
			return;
		}

		// Validar que si hay VUELTA y NO está marcado "asignar ambas", debe tener vehículo seleccionado
		if (reservaVuelta && !asignarAmbas && !vueltaVehiculoSeleccionado) {
			alert("Debe seleccionar un vehículo para la VUELTA");
			return;
		}

		setLoadingAsignacion(true);
		try {
			// 1. Asignar IDA
			const responseIda = await fetch(
				`${apiUrl}/api/reservas/${selectedReserva.id}/asignar`,
				{
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${accessToken}`,
					},
					body: JSON.stringify({
						vehiculoId: parseInt(vehiculoSeleccionado),
						conductorId:
							conductorSeleccionado && conductorSeleccionado !== "none"
								? parseInt(conductorSeleccionado)
								: null,
						sendEmail: Boolean(enviarNotificacion),
						sendEmailDriver: Boolean(enviarNotificacionConductor),
					}),
				},
			);

			if (!responseIda.ok) {
				const data = await responseIda.json();
				throw new Error(
					data.error || "Error al asignar vehículo/conductor a la IDA",
				);
			}

			// 2. Asignar VUELTA (si existe)
			if (reservaVuelta) {
				const vueltaVehiculo = asignarAmbas
					? vehiculoSeleccionado
					: vueltaVehiculoSeleccionado;
				const vueltaConductor = asignarAmbas
					? conductorSeleccionado
					: vueltaConductorSeleccionado;

				const responseVuelta = await fetch(
					`${apiUrl}/api/reservas/${reservaVuelta.id}/asignar`,
					{
						method: "PUT",
						headers: {
							"Content-Type": "application/json",
							Authorization: `Bearer ${accessToken}`,
						},
						body: JSON.stringify({
							vehiculoId: parseInt(vueltaVehiculo),
							conductorId:
								vueltaConductor && vueltaConductor !== "none"
									? parseInt(vueltaConductor)
									: null,
							sendEmail: Boolean(enviarNotificacion),
							sendEmailDriver: Boolean(enviarNotificacionConductor),
						}),
					},
				);

				if (!responseVuelta.ok) {
					const data = await responseVuelta.json();
					throw new Error(
						data.error || "Error al asignar vehículo/conductor a la VUELTA",
					);
				}
			}

			await fetchReservas(); // Recargar reservas
			setShowAsignarDialog(false);

			// Mensaje de éxito
			const mensaje = reservaVuelta
				? "Vehículo y conductor asignados correctamente para IDA y VUELTA"
				: "Vehículo y conductor asignados correctamente";
			alert(mensaje);

			// Refrescar historial si estamos viendo detalles
			if (showDetailDialog && selectedReserva?.id) {
				setLoadingHistorial(true);
				try {
					// Usa el token de autenticación del contexto
					const resp = await fetch(
						`${apiUrl}/api/reservas/${selectedReserva.id}/asignaciones`,
						{
							headers: accessToken
								? { Authorization: `Bearer ${accessToken}` }
								: {},
						},
					);
					if (resp.ok) {
						const data = await resp.json();
						setHistorialAsignaciones(
							Array.isArray(data.historial) ? data.historial : [],
						);
					}
				} catch {
					// noop
				}
				setLoadingHistorial(false);
			}
		} catch (error) {
			console.error("Error asignando vehículo/conductor:", error);
			alert("Error al asignar vehículo/conductor");
		} finally {
			setLoadingAsignacion(false);
		}
	};

	// Cargar reservas
	const fetchReservas = async () => {
		setLoading(true);
		setError(null);
		try {
			const params = new URLSearchParams({
				page: currentPage,
				limit: itemsPerPage,
			});

			if (estadoFiltro !== "todos") {
				params.append("estado", estadoFiltro);
			}

			// Normalizar fechas para filtro
			if (fechaDesde && String(fechaDesde).trim() !== "") {
				params.append("fecha_desde", fechaDesde);
			}

			if (fechaHasta && String(fechaHasta).trim() !== "") {
				params.append("fecha_hasta", fechaHasta);
			}

			// Filtros Inteligentes
			if (filtroInteligente === "sin_asignacion") {
				params.append("sin_asignacion", "true");
			} else if (filtroInteligente === "incompletas") {
				params.append("estado_avanzado", "incompletas");
			} else if (filtroInteligente === "archivadas") {
				params.append("archivadas", "true");
			}

			params.append("incluir_cerradas", "true");

			// Agregar parámetros de ordenamiento
			if (sortConfig.key) {
				params.append("sort", sortConfig.key);
				params.append("order", sortConfig.direction);
			}

			const response = await fetch(`${apiUrl}/api/reservas?${params}`);

			if (!response.ok) {
				throw new Error(`Error ${response.status}: ${response.statusText}`);
			}

			const data = await response.json();
			const reservasNormalizadas = (data.reservas || []).map((reserva) => {
				const cliente = reserva.cliente || {};
				return {
					...reserva,
					esCliente: cliente.esCliente || false, // Respetar bandera de cliente existente
					nombre: cliente.nombre || reserva.nombre || "",
					rut: cliente.rut || reserva.rut || "",
					email: cliente.email || reserva.email || "",
					telefono: cliente.telefono || reserva.telefono || "",
					clienteId: cliente.id || reserva.clienteId || null,
					clasificacionCliente: cliente.clasificacion || null,
					totalReservas: cliente.totalReservas || 0,
					abonoPagado: Boolean(reserva.abonoPagado),
					saldoPagado: Boolean(reserva.saldoPagado),
				};
			});
			setReservas(reservasNormalizadas);
			const nuevasTotalPages = data.pagination?.totalPages || 1;
			setTotalPages(nuevasTotalPages);
			if (currentPage > nuevasTotalPages) {
				setCurrentPage(Math.max(1, nuevasTotalPages));
			}
			setTotalReservas(data.pagination?.total || 0);

			// Cargar estados de evaluaciones para reservas completadas en el lote actual
			const completadas = reservasNormalizadas.filter(
				(r) => r.estado === "completada",
			);
			if (completadas.length > 0) {
				try {
					const evalResp = await authenticatedFetch(
						`/api/admin/evaluaciones?soloEvaluadas=false&limit=100`,
					);
					if (evalResp.ok) {
						const evalData = await evalResp.json();
						const evalMap = {};
						(evalData.evaluaciones || []).forEach((ev) => {
							evalMap[ev.reservaId] = {
								enviada: ev.solicitudEnviada,
								fecha: ev.fechaSolicitud,
								evaluada: ev.evaluada,
								promedio: ev.calificacionPromedio,
								token: ev.tokenEvaluacion || null,
							};
						});
						setSolicitudEvaluacion(evalMap);
					}
				} catch (_err) {
					// No interrumpir el flujo si falla la carga de evaluaciones
				}
			}
		} catch (error) {
			console.error("Error cargando reservas:", error);
			setError(error.message || "Error al cargar las reservas");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchReservas();
		fetchEstadisticas();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		currentPage,
		estadoFiltro,
		fechaDesde,
		fechaHasta,
		itemsPerPage,
		filtroInteligente,
		sortConfig,
	]);

	// Filtrar reservas localmente por bÃºsqueda
	const reservasFiltradas = useMemo(() => {
		let filtered = reservas;

		// Filtro de bÃºsqueda
		if (searchTerm) {
			const term = searchTerm.toLowerCase();
			filtered = filtered.filter(
				(r) =>
					r.nombre?.toLowerCase().includes(term) ||
					r.email?.toLowerCase().includes(term) ||
					r.telefono?.toLowerCase().includes(term) ||
					r.id?.toString().includes(term),
			);
		}

		// Filtro de estado de pago
		if (estadoPagoFiltro !== "todos") {
			filtered = filtered.filter((r) => r.estadoPago === estadoPagoFiltro);
		}

		return filtered;
	}, [reservas, searchTerm, estadoPagoFiltro]);

	// Abrir modal de edición	// Acción rápida para marcar como completada y hacer scroll
	const handleMarcarCompletadaYScroll = () => {
		setFormData((prev) => ({ ...prev, estado: "completada" }));
		setTimeout(() => {
			const seccion = document.getElementById("seccion-estado-reserva");
			const boton = document.getElementById("boton-guardar-cambios");
			if (seccion) {
				seccion.scrollIntoView({ behavior: "smooth", block: "center" });
				seccion.classList.add(
					"ring-2",
					"ring-chocolate-500",
					"ring-offset-2",
					"transition-all",
					"rounded-lg",
				);
				setTimeout(() => {
					seccion.classList.remove(
						"ring-2",
						"ring-chocolate-500",
						"ring-offset-2",
					);
				}, 3000);
			}
			toast.info(
				"Estado cambiado a 'Completada'. No olvides guardar los cambios.",
			);
		}, 100);
	};

	const handleEdit = async (reserva) => {
		setSelectedReserva(reserva);

		// SOLUCIÓN: Cargar datos del tramo de vuelta si existe tramoHijoId
		let reservaVuelta = null;
		if (reserva.tramoHijoId) {
			try {
				const responseVuelta = await authenticatedFetch(
					`/api/reservas/${reserva.tramoHijoId}?t=${Date.now()}`,
				);
				if (responseVuelta.ok) {
					reservaVuelta = await responseVuelta.json();
				}
			} catch (errorVuelta) {
				console.warn(
					`No se pudo cargar la reserva de vuelta vinculada (ID: ${reserva.tramoHijoId}) para edición de la reserva #${reserva.id}:`,
					errorVuelta,
				);
			}
		}

		setFormData({
			nombre: reserva.nombre || "",
			email: reserva.email || "",
			telefono: reserva.telefono || "",
			origen: reserva.origen || "",
			destino: reserva.destino || "",
			fecha: (reserva.fecha || "").toString().substring(0, 10),
			hora: reserva.hora || "",
			pasajeros: String(reserva.pasajeros || ""),
			estado: reserva.estado || "",
			estadoPago: reserva.estadoPago || "",
			metodoPago: reserva.metodoPago || reserva.pagoGateway || "",
			referenciaPago: reserva.referenciaPago || "",
			tipoPago: reserva.tipoPago || "",
			montoPagado: "", // FIX: Iniciar siempre vacío para evitar duplicación accidental al guardar cambios generales
			observaciones: reserva.observaciones || "",
			numeroVuelo: reserva.numeroVuelo || "",
			hotel: reserva.hotel || "",
			equipajeEspecial: reserva.equipajeEspecial || "",
			sillaInfantil: reserva.sillaInfantil || false,
			// SOLUCIÓN: Si hay reservaVuelta, cargar sus datos; sino usar los de la reserva principal (legacy)
			horaRegreso: reservaVuelta
				? reservaVuelta.hora || ""
				: reserva.horaRegreso || "",
			idaVuelta: Boolean(reserva.idaVuelta || reservaVuelta),
			fechaRegreso: reservaVuelta
				? (reservaVuelta.fecha || "").toString().substring(0, 10)
				: (reserva.fechaRegreso || "").toString().substring(0, 10),
			direccionOrigen: reserva.direccionOrigen || "",
			direccionDestino: reserva.direccionDestino || "",
			// Guardar ID de la reserva de vuelta para actualizar después
			tramoVueltaId: reservaVuelta ? reservaVuelta.id : null,
		});
		// Reset edición de ruta
		setEditOrigenEsOtro(false);
		setEditDestinoEsOtro(false);
		setEditOtroOrigen("");
		setEditOtroDestino("");
		setEnviarActualizacionConductor(false);
		// Cargar catálogo de destinos para selects
		fetchDestinosCatalog();
		setShowEditDialog(true);
	};

	// Abrir modal de detalles
	const handleViewDetails = async (reserva) => {
		// Cargar versión fresca de la reserva desde el backend antes de abrir el modal
		try {
			const response = await authenticatedFetch(
				`/api/reservas/${reserva.id}?t=${Date.now()}`,
			);
			if (!response.ok) {
				throw new Error("Error al cargar la reserva");
			}
			const reservaActualizada = await response.json();

			// SOLUCIÓN C: Si esta reserva tiene un tramoHijoId, cargar también la reserva de vuelta
			let reservaVuelta = null;
			if (reservaActualizada.tramoHijoId) {
				try {
					const responseVuelta = await authenticatedFetch(
						`/api/reservas/${reservaActualizada.tramoHijoId}?t=${Date.now()}`,
					);
					if (responseVuelta.ok) {
						reservaVuelta = await responseVuelta.json();
					}
				} catch (errorVuelta) {
					console.warn(
						`No se pudo cargar la reserva de vuelta vinculada (ID: ${reservaActualizada.tramoHijoId}) para la reserva #${reservaActualizada.id}:`,
						errorVuelta,
					);
				}
			}

			// Agregar la reserva de vuelta al objeto principal para usarla en el modal
			setSelectedReserva({
				...reservaActualizada,
				tramoVuelta: reservaVuelta,
			});
			setShowDetailDialog(true);
		} catch (error) {
			console.error("Error al cargar detalles de la reserva:", error);
			alert(
				"No se pudieron cargar los detalles de la reserva. Inténtalo nuevamente.",
			);
			// No abrir el modal si falló la carga para evitar mostrar datos desactualizados
			return;
		}

		// Cargar historial de asignaciones (uso interno) usando token del contexto
		setLoadingHistorial(true);
		try {
			const resp = await authenticatedFetch(
				`/api/reservas/${reserva.id}/asignaciones`,
			);
			if (resp.ok) {
				const data = await resp.json();
				setHistorialAsignaciones(
					Array.isArray(data.historial) ? data.historial : [],
				);
			} else {
				setHistorialAsignaciones([]);
			}
		} catch (err) {
			console.error("Error cargando historial de asignaciones:", err);
			setHistorialAsignaciones([]);
		} finally {
			setLoadingHistorial(false);
		}

		// Cargar historial de transacciones
		setLoadingTransacciones(true);
		try {
			const respTrans = await authenticatedFetch(
				`/api/reservas/${reserva.id}/transacciones`,
			);
			if (respTrans.ok) {
				const dataTrans = await respTrans.json();
				setTransacciones(dataTrans.transacciones || []);
			} else {
				setTransacciones([]);
			}
		} catch (errTrans) {
			console.error("Error cargando transacciones:", errTrans);
			setTransacciones([]);
		} finally {
			setLoadingTransacciones(false);
		}
	};

	// Funciones auxiliares para completar reserva
	const getNombreConductor = (reserva) => {
		if (reserva.conductor_asignado) return reserva.conductor_asignado.nombre;
		if (reserva.conductor) return reserva.conductor;
		return "Sin asignar";
	};

	const getVehiculoInfo = (reserva) => {
		if (reserva.vehiculo_asignado)
			return `${reserva.vehiculo_asignado.tipo} (${reserva.vehiculo_asignado.patente})`;
		if (reserva.vehiculo) return reserva.vehiculo;
		return "Sin asignar";
	};

	const completarReserva = async (id) => {
		const response = await authenticatedFetch(`/api/reservas/${id}/estado`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ estado: "completada" }),
		});
		if (!response.ok) {
			throw new Error(`Error al completar la reserva #${id}`);
		}
		return true;
	};

	const completarAmbasReservas = async (ids) => {
		for (const id of ids) {
			await completarReserva(id);
		}
	};

	const redirigirAGastos = (ids) => {
		const url = new URL(window.location.href);
		url.searchParams.set("panel", "gastos");
		// Usamos reservaIds (plural) para el nuevo flujo, y reservaId (singular) para compatibilidad
		url.searchParams.set("reservaIds", ids.join(","));
		if (ids.length === 1) {
			url.searchParams.set("reservaId", ids[0].toString());
		}
		window.location.href = url.toString();
	};

	// Completar reserva y redirigir a gastos
	const handleCompletar = async (reserva) => {
		// 1. Detectar si tiene reserva vinculada (VUELTA)
		let reservaVueltaData = null;
		if (reserva.tramoHijoId) {
			try {
				const response = await authenticatedFetch(
					`/api/reservas/${reserva.tramoHijoId}`,
				);
				if (response.ok) {
					reservaVueltaData = await response.json();
				}
			} catch (error) {
				console.error("Error cargando reserva de vuelta:", error);
			}
		}

		if (!reservaVueltaData) {
			// Flujo normal para reservas simples
			if (
				!confirm(
					`¿Confirmar que deseas completar la reserva ${reserva.codigoReserva} y agregar gastos?`,
				)
			) {
				return;
			}
			try {
				await completarReserva(reserva.id);
				await fetchReservas();
				redirigirAGastos([reserva.id]);
			} catch (error) {
				console.error("Error al completar la reserva:", error);
				alert("No se pudo completar la reserva. Inténtalo nuevamente.");
			}
			return;
		}

		// 2. Verificar si tienen mismo conductor y vehículo
		const mismoConductor =
			reserva.conductorId &&
			reserva.conductorId === reservaVueltaData.conductorId;
		const mismoVehiculo =
			reserva.vehiculoId && reserva.vehiculoId === reservaVueltaData.vehiculoId;
		const esUnificado = mismoConductor && mismoVehiculo;

		// 3. Mostrar diálogo apropiado
		if (esUnificado) {
			// Flujo unificado: mismo conductor y vehículo
			if (
				confirm(
					`Este viaje de IDA y VUELTA fue realizado por el mismo conductor y vehículo.\n\n` +
						`¿Deseas completar ambos tramos juntos e ingresar gastos unificados?`,
				)
			) {
				try {
					await completarAmbasReservas([reserva.id, reservaVueltaData.id]);
					await fetchReservas();
					redirigirAGastos([reserva.id, reservaVueltaData.id]);
				} catch (error) {
					console.error("Error al completar las reservas:", error);
					alert("Hubo un error al completar las reservas.");
				}
			}
		} else {
			// Flujo separado: diferentes conductores/vehículos o sin asignar
			const mensaje =
				!reserva.conductorId || !reserva.vehiculoId
					? `Este viaje tiene IDA y VUELTA, pero aún no tienen conductor/vehículo asignados en ambos tramos.\n\n` +
						`¿Qué deseas hacer?`
					: `Este viaje tiene IDA y VUELTA con diferentes conductores o vehículos:\n\n` +
						`IDA: ${getNombreConductor(reserva)} - ${getVehiculoInfo(reserva)}\n` +
						`VUELTA: ${getNombreConductor(reservaVueltaData)} - ${getVehiculoInfo(reservaVueltaData)}\n\n` +
						`¿Qué deseas hacer?`;

			setDialogoCompletarOpciones({
				mensaje,
				reservaIda: reserva,
				reservaVuelta: reservaVueltaData,
			});
			setShowDialogoCompletar(true);
		}
	};

	// Guardar cambios
	// ✅ OPTIMIZACIÓN 1: Guardado Consolidado (Bulk Update)
	const handleSave = async () => {
		if (!selectedReserva) return;

		setSaving(true);
		try {
			// 1. Manejo de destinos "otros" (pueden ser múltiples llamadas externas)
			const origenFinalEdit = editOrigenEsOtro
				? editOtroOrigen || formData.origen
				: formData.origen;
			const destinoFinalEdit = editDestinoEsOtro
				? editOtroDestino || formData.destino
				: formData.destino;

			if (
				editDestinoEsOtro &&
				destinoFinalEdit &&
				!destinoExiste(destinoFinalEdit)
			) {
				await fetch(`${apiUrl}/api/destinos`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${accessToken}`,
					},
					body: JSON.stringify({
						nombre: destinoFinalEdit,
						activo: false,
						precioIda: 0,
						precioVuelta: 0,
						precioIdaVuelta: 0,
					}),
				}).catch(() => {});
			}
			if (
				editOrigenEsOtro &&
				origenFinalEdit &&
				!destinoExiste(origenFinalEdit)
			) {
				await fetch(`${apiUrl}/api/destinos`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${accessToken}`,
					},
					body: JSON.stringify({
						nombre: origenFinalEdit,
						activo: false,
						precioIda: 0,
						precioVuelta: 0,
						precioIdaVuelta: 0,
					}),
				}).catch(() => {});
			}

			// 2. Preparar lógica de negocio para el payload consolidado
			let estadoFinal =
				formData.estado || selectedReserva.estado || "pendiente";
			const estadoPagoActual =
				formData.estadoPago || selectedReserva.estadoPago || "pendiente";
			let estadoPagoSolicitado =
				estadoFinal === "completada" ? "pagado" : estadoPagoActual;

			let montoPagadoValue = null;
			const montoManual =
				formData.montoPagado !== undefined && formData.montoPagado !== null
					? Number(formData.montoPagado)
					: NaN;

			if (!Number.isNaN(montoManual) && montoManual > 0) {
				montoPagadoValue = montoManual;
			}

			const tipo = formData.tipoPago;
			const totalReserva =
				Number(
					selectedReserva?.totalConDescuento ?? selectedReserva?.total ?? 0,
				) || 0;
			const abonoSugerido = Number(selectedReserva?.abonoSugerido || 0) || 0;
			const pagoPrevio = Number(selectedReserva?.pagoMonto || 0) || 0;
			const umbralAbono = Math.max(totalReserva * 0.4, abonoSugerido || 0);

			// 🎯 FIX: No recalcular automáticamente montoPagadoValue basado en tipo o estado aquí,
			// ya que causa que reservas sin pagos se marquen como pagadas al editarlas (ej. cambiar email).
			// El monto ya viene en formData.montoPagado si el usuario lo cambió en el select de tipoPago
			// o lo ingresó manualmente.

			// 3. Payload UNIFICADO
			const bulkPayload = {
				datosGenerales: {
					nombre: formData.nombre,
					email: formData.email,
					telefono: formData.telefono,
					fecha: formData.fecha,
					hora: formData.hora,
					pasajeros: Number(formData.pasajeros) || selectedReserva.pasajeros,
					numeroVuelo: formData.numeroVuelo,
					hotel: formData.hotel,
					equipajeEspecial: formData.equipajeEspecial,
					sillaInfantil: Boolean(formData.sillaInfantil),
					idaVuelta: Boolean(formData.idaVuelta),
					fechaRegreso: formData.fechaRegreso || null,
					horaRegreso: formData.horaRegreso || null,
					direccionOrigen: formData.direccionOrigen,
					direccionDestino: formData.direccionDestino,
				},
				ruta:
					origenFinalEdit !== selectedReserva.origen ||
					destinoFinalEdit !== selectedReserva.destino
						? {
								origen: origenFinalEdit,
								destino: destinoFinalEdit,
							}
						: null,
				pago: {
					estadoPago: estadoPagoSolicitado,
					metodoPago: formData.metodoPago || selectedReserva.metodoPago || null,
					referenciaPago:
						formData.referenciaPago || selectedReserva.referenciaPago || null,
					tipoPago: formData.tipoPago || null,
					estadoReserva: estadoFinal,
					montoPagado: montoPagadoValue,
				},
				estado: estadoFinal,
				observaciones: formData.observaciones,
			};

			// 4. Llamada ÚNICA al endpoint de bulk-update
			const response = await fetch(
				`${apiUrl}/api/reservas/${selectedReserva.id}/bulk-update`,
				{
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${accessToken}`,
					},
					body: JSON.stringify(bulkPayload),
				},
			);

			if (!response.ok) {
				const errData = await response.json().catch(() => ({}));
				throw new Error(
					errData.error || "No se pudo realizar la actualización unificada",
				);
			}

			// 5. Notificación al conductor (se mantiene como llamada separada por su lógica de email)
			if (enviarActualizacionConductor && isAsignada(selectedReserva)) {
				await fetch(`${apiUrl}/api/reservas/${selectedReserva.id}/asignar`, {
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${accessToken}`,
					},
					body: JSON.stringify({
						vehiculoId: selectedReserva.vehiculoId,
						conductorId: selectedReserva.conductorId,
						sendEmail: false,
						sendEmailDriver: true,
					}),
				}).catch((e) => console.warn("Error enviando email al conductor:", e));
			}

			await fetchReservas();
			await fetchEstadisticas();

			// SOLUCIÓN: Si hay una reserva de vuelta vinculada, actualizar sus datos también
			if (
				formData.tramoVueltaId &&
				(formData.fechaRegreso || formData.horaRegreso)
			) {
				try {
					const vueltaPayload = {
						datosGenerales: {
							fecha: formData.fechaRegreso || null,
							hora: formData.horaRegreso || null,
							// Mantener otros datos sincronizados
							nombre: formData.nombre,
							email: formData.email,
							telefono: formData.telefono,
							pasajeros:
								Number(formData.pasajeros) || selectedReserva.pasajeros,
						},
						// No forzar estado en el tramo de vuelta: puede tener ciclo operativo independiente
						observaciones: formData.observaciones,
					};

					const responseVuelta = await fetch(
						`${apiUrl}/api/reservas/${formData.tramoVueltaId}/bulk-update`,
						{
							method: "PUT",
							headers: {
								"Content-Type": "application/json",
								Authorization: `Bearer ${accessToken}`,
							},
							body: JSON.stringify(vueltaPayload),
						},
					);

					if (!responseVuelta.ok) {
						console.warn(
							"⚠️ No se pudo actualizar la reserva de vuelta vinculada",
						);
					} else {
						console.log(
							`✅ Reserva de vuelta #${formData.tramoVueltaId} actualizada correctamente`,
						);
					}
				} catch (errorVuelta) {
					console.warn(
						"⚠️ Error al actualizar reserva de vuelta:",
						errorVuelta,
					);
				}
			}

			setShowEditDialog(false);
			setSelectedReserva(null);
			// Feedback de éxito
			console.log("✅ Reserva actualizada satisfactoriamente vía Bulk Update.");
		} catch (error) {
			console.error("❌ Error en handleSave (Bulk Update):", error);
			alert("Error al guardar los cambios: " + error.message);
		} finally {
			setSaving(false);
		}
	};

	// FunciÃ³n para obtener el badge del estado
	const getEstadoBadge = (estado) => {
		const estados = {
			pendiente: { variant: "secondary", label: "Pendiente", icon: Clock },
			pendiente_detalles: {
				variant: "outline",
				label: "Pendiente Detalles",
				icon: AlertCircle,
			},
			confirmada: {
				variant: "default",
				label: "Confirmada",
				icon: CheckCircle2,
			},
			cancelada: { variant: "destructive", label: "Cancelada", icon: XCircle },
			completada: {
				variant: "default",
				label: "Completada",
				icon: CheckCircle2,
			},
		};

		const config = estados[estado] || estados.pendiente;
		const Icon = config.icon;

		return (
			<Badge variant={config.variant} className="flex items-center gap-1">
				<Icon className="w-3 h-3" />
				{config.label}
			</Badge>
		);
	};

	// FunciÃ³n para obtener el badge del estado de pago
	// Ahora acepta el objeto `reserva` completo para derivar el estado
	// a partir de campos reales (monto pagado, total, saldoPendiente, estadoPago)
	const getEstadoPagoBadge = (reservaOrEstado) => {
		// Compatibilidad: si pasan solo el estado como string
		const reserva =
			typeof reservaOrEstado === "string"
				? { estadoPago: reservaOrEstado }
				: reservaOrEstado || {};

		// Extraer valores numÃ©ricos seguros
		const montoTotal =
			Number(reserva.totalConDescuento ?? reserva.total ?? 0) || 0;
		const montoPagado = Number(reserva.pagoMonto ?? 0) || 0;
		// Derivamos saldo cuando sea necesario, pero no lo requerimos explÃ­citamente aquÃ­

		// Normalizar estado comunicado por backend
		const estadoPagoRaw = (reserva.estadoPago || "").toString().toLowerCase();

		// Determinar estado derivado con reglas claras:
		// - reembolsado y fallido mantienen prioridad
		// - si montoPagado >= montoTotal && montoTotal > 0 => 'pagado'
		// - si montoPagado > 0 && montoPagado < montoTotal => 'parcial'
		// - si montoPagado == 0 => 'pendiente'
		// - si backend indica status destructivo (fallido) o similar, respetarlo

		let label = "Pendiente";
		let variant = "secondary";

		if (estadoPagoRaw === "reembolsado") {
			label = "Reembolsado";
			variant = "outline";
		} else if (estadoPagoRaw === "fallido" || estadoPagoRaw === "rechazado") {
			label = "Fallido";
			variant = "destructive";
		} else if (montoTotal > 0 && montoPagado >= montoTotal) {
			label = "Pagado";
			variant = "default";
		} else if (montoPagado > 0 && montoPagado < montoTotal) {
			label = "Pago parcial";
			variant = "outline";
		} else if (estadoPagoRaw === "pagado") {
			// respaldo por si backend marca 'pagado' pero montos no coinciden
			label = "Pagado";
			variant = "default";
		} else {
			label = "Pendiente";
			variant = "secondary";
		}

		return (
			<div className="flex flex-col text-sm">
				<Badge variant={variant}>{label}</Badge>
			</div>
		);
	};

	// Helper para detectar si ya fue asignado un vehÃ­culo previamente
	// Consideramos "asignada" si el campo `vehiculo` incluye tipo + patente
	// por ejemplo: "SUV ABCD12"; en cambio valores como "sedan", "Por asignar", "Auto Privado"
	// (sin patente real) indican que aÃºn no se ha asignado uno real.
	const isAsignada = (reserva) => {
		const v = (reserva?.vehiculo || "").trim().toLowerCase();
		if (!v || ["por asignar", "auto privado", "sedan", "sedán"].includes(v))
			return false;
		const parts = v.split(" ");
		if (parts.length < 2) return false;
		const last = parts[parts.length - 1];
		// Verificar si la Ãºltima parte parece una patente chilena (ej: ABCD12, abcd12)
		return /^[a-z]{2,4}\d{2,3}$/i.test(last) || /[A-Z0-9]{6,}/i.test(last);
	};

	const hasVehiculoAsignado = Boolean(
		selectedReserva &&
		(selectedReserva.vehiculo_asignado ||
			selectedReserva.vehiculoId ||
			isAsignada(selectedReserva)),
	);

	// Extraer nombre del conductor desde observaciones (formato legacy: "Conductor asignado: NOMBRE")
	const getConductorFromObs = (obs) => {
		if (!obs) return null;
		const match = obs.match(/Conductor asignado:\s*(.+)/i);
		return match ? match[1].trim() : null;
	};
	const conductorEnObsIda = getConductorFromObs(selectedReserva?.observaciones);

	const hasConductorAsignado = Boolean(
		selectedReserva &&
		(selectedReserva.conductor_asignado ||
			selectedReserva.conductorId ||
			(selectedReserva.conductor &&
				selectedReserva.conductor !== "Por asignar") ||
			conductorEnObsIda),
	);

	// Formatear moneda
	const formatCurrency = (amount) => {
		return new Intl.NumberFormat("es-CL", {
			style: "currency",
			currency: "CLP",
		}).format(amount || 0);
	};

	// Formatear fecha
	// Evitar que una fecha almacenada como 'YYYY-MM-DD' o 'YYYY-MM-DDT00:00:00Z'
	// sea interpretada como UTC y muestre el dÃ­a anterior en zonas horarias negativas.
	const formatDate = (date) => {
		if (!date) return "-";

		// Si el valor es una fecha solo 'YYYY-MM-DD', construir una fecha local
		if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
			return new Date(date + "T00:00:00").toLocaleDateString("es-CL");
		}

		// Si viene en formato ISO con tiempo y termina en Z o corresponde a medianoche UTC,
		// extraer la parte de fecha para evitar conversiones indeseadas.
		const isoMidnightZ = date.match(
			/^(\d{4}-\d{2}-\d{2})T00:00:00(?:\.000)?Z?$/,
		);
		if (isoMidnightZ) {
			return new Date(isoMidnightZ[1] + "T00:00:00").toLocaleDateString(
				"es-CL",
			);
		}

		// En otros casos, confiar en el Date constructor (cuando hay hora significativa)
		try {
			return new Date(date).toLocaleDateString("es-CL");
		} catch (err) {
			// Log en espaÃ±ol y fallback: mostrar la cadena original truncada (fecha parte)
			console.warn("Error formateando fecha:", err);
			const m = date.match(/^(\d{4}-\d{2}-\d{2})/);
			return m ? m[1] : String(date);
		}
	};

	// Reenviar correo de confirmación al cliente de una reserva
	const reenviarCorreoConfirmacion = async (reservaId) => {
		try {
			const response = await authenticatedFetch(
				`/api/reservas/${reservaId}/reenviar-confirmacion`,
				{
					method: "POST",
				},
			);
			if (response.ok) {
				alert("✅ Correo reenviado exitosamente");
			} else {
				const errData = await response.json().catch(() => ({}));
				throw new Error(errData.error || "Error al reenviar el correo");
			}
		} catch (error) {
			console.error("Error reenviando correo de confirmación:", error);
			alert("❌ No se pudo reenviar el correo: " + error.message);
		}
	};

	// Ver reserva vinculada (tramo de vuelta) en el modal de edición
	const verReservaVinculada = async (tramoHijoId) => {
		try {
			const response = await authenticatedFetch(`/api/reservas/${tramoHijoId}`);
			if (response.ok) {
				const reservaVinculada = await response.json();
				handleEdit(reservaVinculada);
			} else {
				throw new Error("No se pudo obtener la reserva vinculada");
			}
		} catch (error) {
			console.error("Error cargando reserva vinculada:", error);
			alert("❌ Error al cargar la reserva vinculada: " + error.message);
		}
	};

	// Copiar información de la reserva al portapapeles en formato WhatsApp
	const copiarInfoWhatsApp = (reserva) => {
		const texto = generarTextoConductor(reserva);
		navigator.clipboard
			.writeText(texto)
			.then(() => {
				alert("✅ Información copiada al portapapeles");
			})
			.catch(() => {
				alert("❌ No se pudo copiar al portapapeles");
			});
	};

	// Copiar mensaje de seguimiento para leads abandonados
	const copiarMensajeSeguimiento = (reserva) => {
		if (!reserva) return;

		const fechaStr = reserva.fecha
			? new Date(reserva.fecha + "T00:00:00").toLocaleDateString("es-CL", {
					day: "numeric",
					month: "long",
				})
			: "[Fecha]";

		const montoStr = formatCurrency(reserva.totalConDescuento);
		const nombreCliente =
			reserva.nombre && !reserva.nombre.includes("Cliente Potencial")
				? reserva.nombre
				: "cliente";

		const mensaje = `Hola ${nombreCliente}, te saluda el equipo de Transportes Araucaria. 👋

Vimos que estabas cotizando un traslado de *${reserva.origen}* a *${reserva.destino}* para el ${fechaStr} por un valor de *${montoStr}*. 🚐💨

¿Te gustaría que te ayudemos a concretar la reserva o tienes alguna duda con el servicio? Estamos atentos para asistirte. 😊`;

		navigator.clipboard
			.writeText(mensaje)
			.then(() => {
				alert("✅ Mensaje de seguimiento copiado");
			})
			.catch(() => {
				alert("❌ Error al copiar mensaje");
			});
	};

	// Buscar clientes para autocompletar
	const buscarClientes = async (query) => {
		if (!query || query.length < 2) {
			setClienteSugerencias([]);
			setMostrandoSugerencias(false);
			return;
		}

		try {
			const response = await fetch(
				`${apiUrl}/api/clientes/buscar?query=${encodeURIComponent(query)}`,
			);
			if (response.ok) {
				const data = await response.json();
				setClienteSugerencias(data.clientes || []);
				setMostrandoSugerencias(data.clientes && data.clientes.length > 0);
			}
		} catch (error) {
			console.error("Error buscando clientes:", error);
		}
	};

	// Seleccionar cliente desde autocompletado
	const seleccionarCliente = (cliente) => {
		setClienteSeleccionado(cliente);
		setNewReservaForm({
			...newReservaForm,
			nombre: cliente.nombre,
			rut: cliente.rut || "",
			email: cliente.email,
			telefono: cliente.telefono,
			clienteId: cliente.id,
			// Aseguramos que se respete la bandera de cliente existente
			esCliente: cliente.esCliente || false,
		});
		setMostrandoSugerencias(false);
		setClienteSugerencias([]);
	};

	// Ver historial de un cliente
	const verHistorialCliente = async (clienteId) => {
		try {
			const response = await fetch(
				`${apiUrl}/api/clientes/${clienteId}/historial`,
			);
			if (response.ok) {
				const data = await response.json();
				setHistorialCliente(data);
				setShowHistorialDialog(true);
			}
		} catch (error) {
			console.error("Error obteniendo historial del cliente:", error);
			alert("Error al cargar el historial del cliente");
		}
	};

	// Marcar/desmarcar cliente manualmente
	const toggleClienteManual = async (clienteId, esCliente) => {
		try {
			const response = await fetch(
				`${apiUrl}/api/clientes/${clienteId}/marcar-cliente`,
				{
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						esCliente: !esCliente,
						marcadoManualmente: true,
					}),
				},
			);

			if (response.ok) {
				await fetchReservas();
				alert(
					`Cliente ${
						!esCliente ? "marcado" : "desmarcado"
					} como cliente exitosamente`,
				);
			}
		} catch (error) {
			console.error("Error actualizando cliente:", error);
			alert("Error al actualizar el cliente");
		}
	};

	// Abrir modal de nueva reserva
	const handleNewReserva = () => {
		setClienteSeleccionado(null);
		setClienteSugerencias([]);
		setMostrandoSugerencias(false);
		setNewReservaForm({
			nombre: "",
			rut: "",
			email: "",
			telefono: "",
			clienteId: null,
			origen: "",
			destino: "",
			fecha: "",
			hora: "08:00",
			pasajeros: 1,
			precio: 0,
			vehiculo: "sedan",
			numeroVuelo: "",
			hotel: "",
			equipajeEspecial: "",
			sillaInfantil: false,
			idaVuelta: false,
			fechaRegreso: "",
			horaRegreso: "",
			abonoSugerido: 0,
			saldoPendiente: 0,
			totalConDescuento: 0,
			mensaje: "",
			estado: "pendiente",
			estadoPago: "pendiente",
			metodoPago: "",
			observaciones: "",
			enviarCorreo: true,
			// Nuevos campos para pago inicial
			registrarPagoInicial: false,
			pagoMonto: "",
			pagoMetodo: "efectivo",
			pagoReferencia: "",
		});
		setOrigenEsOtro(false);
		setDestinoEsOtro(false);
		setOtroOrigen("");
		setOtroDestino("");
		setSentidoViaje("hacia_aeropuerto");
		setShowNewDialog(true);
		fetchDestinosCatalog();
	};

	// Guardar nueva reserva
	const handleSaveNewReserva = async () => {
		// Validaciones bÃ¡sicas
		if (
			!newReservaForm.nombre ||
			!newReservaForm.email ||
			!newReservaForm.telefono
		) {
			alert(
				"Por favor completa los campos obligatorios: Nombre, Email y Teléfono",
			);
			return;
		}
		const origenFinal = newReservaForm.origen;
		const destinoFinal = newReservaForm.destino;

		if (!origenFinal || !destinoFinal) {
			alert("Por favor completa los campos obligatorios: Origen y Destino");
			return;
		}
		if (!newReservaForm.fecha) {
			alert("Por favor selecciona una fecha");
			return;
		}

		// Validaciones de pago inicial
		if (newReservaForm.registrarPagoInicial) {
			const monto = parseFloat(newReservaForm.pagoMonto);

			// Validar NaN además de <= 0
			if (isNaN(monto) || monto <= 0) {
				alert("⚠️ El monto del pago no es válido o debe ser mayor a 0");
				return;
			}

			console.log(`💰 [AdminReservas] Registrando pago inicial:`, {
				monto,
				reservaNombre: newReservaForm.nombre,
				estadoPago: newReservaForm.estadoPago,
				total: parseFloat(newReservaForm.precio) || 0,
			});

			// Validar coherencia con estado de pago
			const total = parseFloat(newReservaForm.precio) || 0;

			// Si marca como "Pagado Completo" pero el monto es menor al total
			if (newReservaForm.estadoPago === "pagado" && monto < total) {
				const confirmar = confirm(
					`⚠️ Advertencia:\n\nMarcaste como "Pagado Completo" pero el monto ($${monto.toLocaleString()}) es menor al total ($${total.toLocaleString()}).\n\n¿Deseas continuar de todas formas?`,
				);
				if (!confirmar) {
					return;
				}
			}

			// Si marca como "Pendiente" pero está registrando un pago, sugerir cambiar estado
			if (
				newReservaForm.estadoPago === "pendiente" &&
				monto > 0 &&
				!confirm(
					`Has marcado el estado como "Pendiente" pero estás registrando un pago de $${monto.toLocaleString()}.\n\n¿Deseas continuar o prefieres cambiar el estado a "Pagado Parcialmente"?`,
				)
			) {
				return;
			}
		}

		setSaving(true);
		try {
			// Primero, crear o actualizar el cliente
			let clienteId = newReservaForm.clienteId;

			if (!clienteId) {
				const clienteResponse = await fetch(
					`${apiUrl}/api/clientes/crear-o-actualizar`,
					{
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							rut: newReservaForm.rut || null,
							nombre: newReservaForm.nombre,
							email: newReservaForm.email,
							telefono: newReservaForm.telefono,
						}),
					},
				);

				if (clienteResponse.ok) {
					const clienteData = await clienteResponse.json();
					clienteId = clienteData.cliente.id;
				}
			}

			// Calcular saldo pendiente según el estado seleccionado
			// Nota: el campo `abonoSugerido` es solo una sugerencia y NO debe
			// asumirse como pago realizado al crear la reserva. Solo cuando el
			// estado de pago sea 'pagado' o se entregue un monto explícito
			// consideramos que existe un pago registrado.
			const total =
				parseFloat(newReservaForm.totalConDescuento) ||
				parseFloat(newReservaForm.precio) ||
				0;
			// Nota: abonoSugerido se mantiene en los datos pero no se asume como pago.

			let estadoSeleccionado = newReservaForm.estado || "pendiente";
			const estadoPagoSeleccionado = newReservaForm.estadoPago || "pendiente";

			// Determinar montoPagado y saldo de forma explícita
			let montoPagado = 0;
			let saldo = total;

			// Si el admin indicó explícitamente un monto pagado en el formulario
			// (campo opcional), respetarlo. Este proyecto no expone ese campo
			// en el formulario nuevo por defecto, pero mantenemos la verificación
			// por compatibilidad con futuras integraciones.
			const montoPagadoFormulario =
				newReservaForm.montoPagado !== undefined &&
				newReservaForm.montoPagado !== ""
					? parseFloat(newReservaForm.montoPagado) || 0
					: null;

			if (montoPagadoFormulario !== null) {
				montoPagado = Math.max(montoPagadoFormulario, 0);
				saldo = Math.max(total - montoPagado, 0);
			} else if (estadoPagoSeleccionado === "pagado") {
				// Si el estado indica pagado, asumimos pago total
				montoPagado = total;
				saldo = 0;
			} else if (estadoPagoSeleccionado === "reembolsado") {
				// Reembolsado -> sin saldo y sin pago activo
				montoPagado = 0;
				saldo = 0;
			} else if (estadoPagoSeleccionado === "fallido") {
				// Fallido -> no hay pago
				montoPagado = 0;
				saldo = total;
			} else {
				// Estado pendiente (por defecto): no considerar el abono sugerido
				// como pago realizado. Guardamos el abono sugerido por separado
				// y dejamos saldo = total.
				montoPagado = 0;
				saldo = total;
			}

			if (saldo < 0) saldo = 0;

			if (
				estadoPagoSeleccionado === "pagado" &&
				estadoSeleccionado === "pendiente"
			) {
				estadoSeleccionado = "confirmada";
			} else if (
				estadoPagoSeleccionado === "reembolsado" &&
				estadoSeleccionado === "pendiente"
			) {
				estadoSeleccionado = "cancelada";
			}

			// Crear destino si es 'otro' y no existe
			if (destinoEsOtro && destinoFinal && !destinoExiste(destinoFinal)) {
				try {
					// Usa el token de autenticación del contexto
					await fetch(`${apiUrl}/api/destinos`, {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							Authorization: `Bearer ${accessToken}`,
						},
						body: JSON.stringify({
							nombre: destinoFinal,
							activo: false,
							precioIda: 0,
							precioVuelta: 0,
							precioIdaVuelta: 0,
						}),
					});
				} catch (e) {
					console.warn(
						"No se pudo registrar destino nuevo (no crÃ­tico)",
						e.message,
					);
				}
			}

			const reservaData = {
				...newReservaForm,
				estado: estadoSeleccionado,
				estadoPago: estadoPagoSeleccionado,
				clienteId: clienteId,
				origen: origenFinal,
				destino: destinoFinal,
				totalConDescuento: total,
				saldoPendiente: saldo,
				pagoMonto: montoPagado > 0 ? montoPagado : undefined,
				source: "manual",
			};

			const response = await fetch(`${apiUrl}/enviar-reserva`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(reservaData),
			});

			if (!response.ok) {
				throw new Error("Error al crear la reserva");
			}

			const resultData = await response.json();
			const reservaId = resultData.reservaId;

			// NUEVO: Registrar pago inicial si corresponde
			if (newReservaForm.registrarPagoInicial && newReservaForm.pagoMonto) {
				// El monto ya fue validado anteriormente, simplemente parseamos
				const montoPago = parseFloat(newReservaForm.pagoMonto);

				try {
					console.log(
						`💰 Registrando pago inicial de $${montoPago} para reserva #${reservaId}`,
					);

					const pagoResp = await authenticatedFetch(
						`${apiUrl}/api/reservas/${reservaId}/pagos`,
						{
							method: "POST",
							headers: {
								"Content-Type": "application/json",
							},
							body: JSON.stringify({
								amount: montoPago,
								metodo: newReservaForm.pagoMetodo || "efectivo",
								referencia: newReservaForm.pagoReferencia || "",
								source: "manual",
							}),
						},
					);

					if (!pagoResp.ok) {
						console.warn(
							"⚠️ No se pudo registrar el pago inicial en el historial",
						);
					} else {
						console.log("✅ Pago inicial registrado exitosamente");
					}
				} catch (pagoError) {
					console.error("Error registrando pago inicial:", pagoError);
					// No bloquear la creación de la reserva por un error de pago
				}
			}
			alert("Reserva creada exitosamente");
		} catch (error) {
			console.error("Error creando reserva:", error);
			alert("Error al crear la reserva: " + error.message);
		} finally {
			setSaving(false);
		}
	};

	// Assuming handleUpdateReserva would be here, as implied by the instruction's snippet
	// If handleUpdateReserva is not present, this block should be removed or adjusted.
	// For now, I'll place the new function after the existing handleNewReserva.
	// The instruction's snippet seems to indicate the end of an `handleUpdateReserva` function.
	// Since that function is not in the provided content, I will insert the new function
	// directly after `handleNewReserva` and before `toggleSelectAll`.

	// Solicitar evaluación al pasajero (acción manual del admin)
	const handleSolicitarEvaluacion = async (reserva) => {
		if (!reserva) return;
		if (
			!window.confirm(
				`¿Enviar solicitud de evaluación al pasajero ${reserva.nombre} (${reserva.email})?`,
			)
		)
			return;
		setSolicitandoEvaluacion(true);
		try {
			const resp = await authenticatedFetch(
				`/api/admin/evaluaciones/solicitar/${reserva.id}`,
				{
					method: "POST",
				},
			);
			const data = await resp.json();
			if (!resp.ok && resp.status !== 409) {
				throw new Error(data.error || "Error al solicitar evaluación");
			}
			setSolicitudEvaluacion((prev) => ({
				...prev,
				[reserva.id]: {
					enviada: true,
					fecha: data.fechaSolicitud || new Date().toISOString(),
					evaluada: data.evaluada || false,
					token: data.tokenEvaluacion || null,
				},
			}));
			if (resp.status === 409) {
				alert(
					`Ya se había enviado una solicitud de evaluación el ${new Date(data.fechaSolicitud).toLocaleDateString("es-CL")}.`,
				);
			} else {
				alert("✅ Solicitud de evaluación enviada exitosamente al pasajero.");
			}
		} catch (err) {
			alert("Error al solicitar evaluación: " + err.message);
		} finally {
			setSolicitandoEvaluacion(false);
		}
	};

	const handleSolicitarDetalles = async (reserva) => {
		if (!reserva) return;

		if (
			!window.confirm(
				`¿Seguro que deseas enviar un recordatorio por correo a ${reserva.nombre} para que complete su dirección?`,
			)
		) {
			return;
		}

		try {
			const response = await authenticatedFetch(
				`/api/reservas/${reserva.id}/solicitar-detalles`,
				{
					method: "POST",
				},
			);

			const data = await response.json();

			if (response.ok) {
				alert("✅ Solicitud enviada correctamente al cliente.");
			} else {
				throw new Error(data.error || "Error al enviar la solicitud");
			}
		} catch (error) {
			console.error("Error enviando solicitud de detalles:", error);
			alert("❌ Error: " + error.message);
		}
	};

	// Seleccionar/deseleccionar todas las reservas
	const toggleSelectAll = () => {
		if (selectedReservas.length === reservasFiltradas.length) {
			setSelectedReservas([]);
		} else {
			setSelectedReservas(reservasFiltradas.map((r) => r.id));
		}
	};

	// Seleccionar/deseleccionar una reserva
	const toggleSelectReserva = (id) => {
		if (selectedReservas.includes(id)) {
			setSelectedReservas(selectedReservas.filter((rid) => rid !== id));
		} else {
			setSelectedReservas([...selectedReservas, id]);
		}
	};

	// Eliminar reservas seleccionadas
	const handleBulkDelete = async () => {
		// Validar si hay reservas confirmadas seleccionadas
		const reservasAVerificar = reservas.filter((r) =>
			selectedReservas.includes(r.id),
		);
		const confirmadas = reservasAVerificar.filter(
			(r) => r.estado === "confirmada",
		);

		if (confirmadas.length > 0) {
			const names = confirmadas.map((r) => `#${r.id}`).join(", ");
			alert(
				`No se pueden eliminar reservas con estado "Confirmada" (${names}).\n\nPor favor, cámbielas a "Cancelada" primero si realmente desea eliminarlas.`,
			);

			// Si solo había confirmadas, salir
			if (confirmadas.length === selectedReservas.length) {
				setShowBulkDeleteDialog(false);
				return;
			}

			// Si hay mezcla, preguntar si proceder con el resto
			if (
				!confirm(
					`Hay ${confirmadas.length} reservas confirmadas que NO se eliminarán. ¿Deseas proceder con la eliminación de las otras ${selectedReservas.length - confirmadas.length} reserva(s)?`,
				)
			) {
				return;
			}
		}

		// Filtrar solo las que NO están confirmadas para enviar al backend
		const idsAEliminar = reservasAVerificar
			.filter((r) => r.estado !== "confirmada")
			.map((r) => r.id);

		setProcessingBulk(true);
		try {
			// USAR authenticatedFetch para incluir cabeceras de seguridad
			const results = await Promise.all(
				idsAEliminar.map((id) =>
					authenticatedFetch(`/api/reservas/${id}`, {
						method: "DELETE",
					}),
				),
			);

			// Verificar si todas las peticiones fueron exitosas
			const failures = [];
			for (let i = 0; i < results.length; i++) {
				if (!results[i].ok) {
					const errorData = await results[i].json().catch(() => ({}));
					failures.push({
						id: idsAEliminar[i],
						status: results[i].status,
						error: errorData.error || "Error desconocido",
					});
				}
			}

			if (failures.length > 0) {
				console.error(
					`❌ Fallaron ${failures.length} eliminaciones:`,
					failures,
				);
				const errorMsgs = failures
					.map((f) => `Reserva #${f.id}: ${f.error}`)
					.join("\n");
				alert(`Hubo errores al eliminar algunas reservas:\n\n${errorMsgs}`);
			} else {
				alert(`${idsAEliminar.length} reserva(s) eliminada(s) exitosamente`);
			}

			await fetchReservas();
			await fetchEstadisticas();
			setSelectedReservas([]);
			setShowBulkDeleteDialog(false);
		} catch (error) {
			console.error("Error eliminando reservas:", error);
			alert("Error al eliminar algunas reservas: " + error.message);
		} finally {
			setProcessingBulk(false);
		}
	};

	// Cambiar estado de reservas seleccionadas
	const handleBulkChangeStatus = async () => {
		if (!bulkEstado) {
			alert("Por favor selecciona un estado");
			return;
		}

		setProcessingBulk(true);
		try {
			const promises = selectedReservas.map((id) =>
				fetch(`${apiUrl}/api/reservas/${id}/estado`, {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ estado: bulkEstado }),
				}),
			);

			await Promise.all(promises);

			await fetchReservas();
			await fetchEstadisticas();
			setSelectedReservas([]);
			setShowBulkStatusDialog(false);
			setBulkEstado("");
			alert(`Estado actualizado para ${selectedReservas.length} reserva(s)`);
		} catch (error) {
			console.error("Error actualizando estado:", error);
			alert("Error al actualizar el estado de algunas reservas");
		} finally {
			setProcessingBulk(false);
		}
	};

	// Eliminada función handleBulkChangePayment por no usarse

	// Función para archivar/desarchivar
	const handleArchivar = async (reserva) => {
		if (
			!window.confirm(
				`¿Estás seguro de que deseas ${
					reserva.archivada ? "desarchivar" : "archivar"
				} esta reserva?`,
			)
		) {
			return;
		}

		try {
			const response = await fetch(
				`${apiUrl}/api/reservas/${reserva.id}/archivar`,
				{
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${accessToken}`,
					},
					body: JSON.stringify({ archivada: !reserva.archivada }),
				},
			);

			if (response.ok) {
				fetchReservas();
			} else {
				alert("Error al cambiar estado de archivado");
			}
		} catch (error) {
			console.error("Error archivando reserva:", error);
			alert("Error al conectar con el servidor");
		}
	};

	if (loading && reservas.length === 0) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="text-center">
					<RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
					<p>Cargando reservas...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Encabezado y EstadÃ­sticas */}
			<div>
				<div className="flex justify-between items-center mb-4">
					<h2 className="text-3xl font-bold">Gestión de Reservas</h2>
					<Button onClick={handleNewReserva} className="gap-2 h-12">
						<Plus className="w-4 h-4" />
						Nueva Reserva
					</Button>
				</div>
				<div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium text-muted-foreground">
								Total Reservas
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="flex items-center gap-2">
								<FileText className="w-4 h-4 text-chocolate-500" />
								<span className="text-2xl font-bold">
									{estadisticas.totalReservas}
								</span>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium text-muted-foreground">
								Pendientes
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="flex items-center gap-2">
								<Clock className="w-4 h-4 text-yellow-500" />
								<span className="text-2xl font-bold">
									{estadisticas.reservasPendientes}
								</span>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium text-muted-foreground">
								Confirmadas
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="flex items-center gap-2">
								<CheckCircle2 className="w-4 h-4 text-green-500" />
								<span className="text-2xl font-bold">
									{estadisticas.reservasConfirmadas}
								</span>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium text-muted-foreground">
								Pagadas
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="flex items-center gap-2">
								<DollarSign className="w-4 h-4 text-green-600" />
								<span className="text-2xl font-bold">
									{estadisticas.reservasPagadas}
								</span>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium text-muted-foreground">
								Ingresos Totales
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="flex items-center gap-2">
								<TrendingUp className="w-4 h-4 text-green-600" />
								<span className="text-xl font-bold">
									{formatCurrency(estadisticas.totalIngresos)}
								</span>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>

			{/* Filtros y BÃºsqueda */}
			<Card>
				<CardHeader>
					<CardTitle>Filtros de Búsqueda</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col md:flex-row gap-4 mb-6">
						<div className="flex-1">
							<Label className="mb-2 block">Buscar</Label>
							<div className="relative">
								<Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
								<Input
									placeholder="Nombre, email, teléfono, ID..."
									className="pl-8 h-12 md:h-10 text-base"
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
								/>
							</div>
						</div>
						<div className="w-full md:w-[180px]">
							<Label className="mb-2 block">Rango Fechas</Label>
							<Select value={rangoFecha} onValueChange={handleRangoFechaChange}>
								<SelectTrigger className="h-12 md:h-10 text-base">
									<SelectValue placeholder="Seleccionar rango" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="todos">Todo el tiempo</SelectItem>
									<SelectItem value="hoy">Hoy</SelectItem>
									<SelectItem value="ayer">Ayer</SelectItem>
									<SelectItem value="semana">Últimos 7 días</SelectItem>
									<SelectItem value="quincena">Últimos 15 días</SelectItem>
									<SelectItem value="mes">Este Mes</SelectItem>
									<SelectItem value="personalizado">Personalizado</SelectItem>
								</SelectContent>
							</Select>
						</div>
						{rangoFecha === "personalizado" && (
							<>
								<div className="w-full md:w-[150px]">
									<Label className="mb-2 block">Fecha Desde</Label>
									<div className="relative">
										<Input
											type="date"
											value={fechaDesde}
											onChange={(e) => setFechaDesde(e.target.value)}
											className="pl-8 h-12 md:h-10 text-base"
										/>
										<Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
									</div>
								</div>
								<div className="w-full md:w-[150px]">
									<Label className="mb-2 block">Fecha Hasta</Label>
									<div className="relative">
										<Input
											type="date"
											value={fechaHasta}
											onChange={(e) => setFechaHasta(e.target.value)}
											className="pl-8 h-12 md:h-10 text-base"
										/>
										<Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
									</div>
								</div>
							</>
						)}
						<div className="w-full md:w-[200px]">
							<Label className="mb-2 block">Filtros Inteligentes</Label>
							<Select
								value={filtroInteligente}
								onValueChange={setFiltroInteligente}
							>
								<SelectTrigger className="h-12 md:h-10 text-base">
									<SelectValue placeholder="Aplicar filtro..." />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="todos">Ninguno</SelectItem>
									<SelectItem value="sin_asignacion">
										⚠️ Sin Asignación
									</SelectItem>
									<SelectItem value="incompletas">
										📋 Faltan Detalles
									</SelectItem>
									<SelectItem value="archivadas">📦 Ver Archivadas</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="w-full md:w-[150px]">
							<Label className="mb-2 block">Estado</Label>
							<Select value={estadoFiltro} onValueChange={setEstadoFiltro}>
								<SelectTrigger className="h-12 md:h-10 text-base">
									<SelectValue placeholder="Todos" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="todos">Todos</SelectItem>
									<SelectItem value="pendiente">Pendiente</SelectItem>
									<SelectItem value="confirmada">Confirmada</SelectItem>
									<SelectItem value="completada">Completada</SelectItem>
									<SelectItem value="cancelada">Cancelada</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="w-full md:w-[150px]">
							<Label className="mb-2 block">Estado de Pago</Label>
							<Select
								value={estadoPagoFiltro}
								onValueChange={setEstadoPagoFiltro}
							>
								<SelectTrigger className="h-12 md:h-10 text-base">
									<SelectValue placeholder="Todos" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="todos">Todos</SelectItem>
									<SelectItem value="pendiente">Pendiente</SelectItem>
									<SelectItem value="pagado">Pagado</SelectItem>
									<SelectItem value="parcial">Parcial</SelectItem>
									<SelectItem value="reembolsado">Reembolsado</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
					<div className="mt-4 flex justify-between items-center">
						<p className="text-sm text-muted-foreground">
							Mostrando {reservasFiltradas.length} de {totalReservas} reservas
						</p>
						<Button
							variant="outline"
							size="sm"
							onClick={() => {
								setSearchTerm("");
								setEstadoFiltro("todos");
								setEstadoPagoFiltro("todos");
								setFechaDesde("");
								setFechaHasta("");
								setCurrentPage(1);
							}}
						>
							<RefreshCw className="w-4 h-4 mr-2" />
							Limpiar Filtros
						</Button>
					</div>
				</CardContent>
			</Card>

			{/* Tabla de Reservas */}
			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<CardTitle>Lista de Reservas</CardTitle>
					<div className="flex gap-2">
						<Dialog
							open={showCalendarDialog}
							onOpenChange={setShowCalendarDialog}
						>
							<DialogTrigger asChild>
								<Button variant="outline" size="sm">
									<Printer className="w-4 h-4 mr-2" />
									Planificación
								</Button>
							</DialogTrigger>
							<DialogContent>
								<DialogHeader>
									<DialogTitle>Generar Planificación</DialogTitle>
									<DialogDescription>
										Selecciona el rango de fechas para generar la vista de
										impresión tipo calendario.
									</DialogDescription>
								</DialogHeader>
								<div className="space-y-4 py-4">
									<div className="flex flex-col gap-2">
										<Label>Fecha Inicio</Label>
										<Input
											type="date"
											value={calendarStartDate}
											onChange={(e) => setCalendarStartDate(e.target.value)}
										/>
									</div>
									<div className="flex flex-col gap-2">
										<Label>Fecha Término</Label>
										<Input
											type="date"
											value={calendarEndDate}
											onChange={(e) => setCalendarEndDate(e.target.value)}
										/>
									</div>
									<div className="flex gap-2 justify-center pt-2">
										<Button
											variant="ghost"
											size="sm"
											onClick={() => {
												const today = new Date();
												const str = today.toISOString().split("T")[0];
												setCalendarStartDate(str);
												setCalendarEndDate(str);
											}}
										>
											Hoy
										</Button>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => {
												const today = new Date();
												const tomorrow = new Date(today);
												tomorrow.setDate(tomorrow.getDate() + 1);
												setCalendarStartDate(today.toISOString().split("T")[0]);
												setCalendarEndDate(
													tomorrow.toISOString().split("T")[0],
												);
											}}
										>
											Mañana
										</Button>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => {
												const today = new Date();
												const nextWeek = new Date(today);
												nextWeek.setDate(nextWeek.getDate() + 7);
												setCalendarStartDate(today.toISOString().split("T")[0]);
												setCalendarEndDate(
													nextWeek.toISOString().split("T")[0],
												);
											}}
										>
											Próx. 7 días
										</Button>
									</div>
									<Button
										onClick={handleGenerarCalendario}
										disabled={generatingCalendar}
										className="w-full"
									>
										{generatingCalendar ? (
											<RefreshCw className="mr-2 h-4 w-4 animate-spin" />
										) : (
											<Printer className="mr-2 h-4 w-4" />
										)}
										Generar Vista de Impresión
									</Button>
								</div>
							</DialogContent>
						</Dialog>

						<Dialog>
							<DialogTrigger asChild>
								<Button variant="outline" size="sm">
									<Settings2 className="w-4 h-4 mr-2" />
									Columnas
								</Button>
							</DialogTrigger>
							<DialogContent>
								<DialogHeader>
									<DialogTitle>Configurar Columnas Visibles</DialogTitle>
									<DialogDescription>
										Selecciona las columnas que deseas ver en la tabla
									</DialogDescription>
								</DialogHeader>
								<div className="space-y-2">
									{COLUMN_DEFINITIONS.map(({ key, label }) => (
										<div key={key} className="flex items-center space-x-2">
											<input
												type="checkbox"
												id={`col-${key}`}
												checked={Boolean(columnasVisibles[key])}
												onChange={(e) =>
													setColumnasVisibles({
														...columnasVisibles,
														[key]: e.target.checked,
													})
												}
												className="w-4 h-4"
											/>
											<Label htmlFor={`col-${key}`} className="cursor-pointer">
												{label}
											</Label>
										</div>
									))}
								</div>
								<div className="flex justify-end gap-2 mt-4">
									<Button
										variant="outline"
										onClick={() => {
											setColumnasVisibles(DEFAULT_COLUMNAS_VISIBLES);
											try {
												localStorage.setItem(
													COLUMNAS_STORAGE_KEY,
													JSON.stringify(DEFAULT_COLUMNAS_VISIBLES),
												);
											} catch (e) {
												// Log en espaÃ±ol para facilitar debugging
												console.warn(
													"No se pudo restablecer columnas en localStorage:",
													e,
												);
											}
										}}
									>
										Restablecer columnas
									</Button>
									<Button
										onClick={() => {
											try {
												localStorage.setItem(
													COLUMNAS_STORAGE_KEY,
													JSON.stringify(columnasVisibles),
												);
												alert("Columnas guardadas");
											} catch {
												alert("No se pudo guardar la configuraciÃ³n");
											}
										}}
									>
										Guardar columnas
									</Button>
								</div>
							</DialogContent>
						</Dialog>
					</div>

					{/* Modal para registrar pago manual */}
					<Dialog
						open={showRegisterPayment}
						onOpenChange={setShowRegisterPayment}
					>
						<DialogContent className="max-w-md">
							<DialogHeader>
								<DialogTitle>Registrar pago manual</DialogTitle>
								<DialogDescription>
									Registra un pago y guarda un historial con origen manual/web.
								</DialogDescription>
							</DialogHeader>
							<div className="space-y-4 mt-2">
								<div className="space-y-2">
									<Label>Monto (CLP)</Label>
									<Input
										type="number"
										value={regPagoMonto}
										onChange={(e) => setRegPagoMonto(e.target.value)}
									/>
								</div>
								<div className="space-y-2">
									<Label>Método</Label>
									<Select
										value={regPagoMetodo}
										onValueChange={(v) => setRegPagoMetodo(v)}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="efectivo">Efectivo</SelectItem>
											<SelectItem value="transferencia">
												Transferencia
											</SelectItem>
											<SelectItem value="flow">Flow</SelectItem>
											<SelectItem value="otro">Otro</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-2">
									<Label>Referencia</Label>
									<Input
										value={regPagoReferencia}
										onChange={(e) => setRegPagoReferencia(e.target.value)}
									/>
								</div>
								<div className="flex justify-end gap-2 pt-4 border-t">
									<Button
										variant="outline"
										onClick={() => setShowRegisterPayment(false)}
									>
										Cancelar
									</Button>
									<Button
										onClick={async () => {
											if (!selectedReserva) return;
											try {
												// Usa el accessToken definido al inicio del componente
												const resp = await fetch(
													`${apiUrl}/api/reservas/${selectedReserva.id}/pagos`,
													{
														method: "POST",
														headers: {
															"Content-Type": "application/json",
															...(accessToken
																? { Authorization: `Bearer ${accessToken}` }
																: {}),
														},
														body: JSON.stringify({
															amount: Number(regPagoMonto) || 0,
															metodo: regPagoMetodo,
															referencia: regPagoReferencia,
														}),
													},
												);
												if (!resp.ok) {
													const errData = await resp.json().catch(() => ({}));
													throw new Error(
														errData.error || `Error ${resp.status}`,
													);
												}
												const montoRegistrado = Number(regPagoMonto);
												const data = await resp.json();

												// Limpiar y cerrar modal
												setShowRegisterPayment(false);
												setRegPagoMonto("");
												setRegPagoMetodo("efectivo");
												setRegPagoReferencia("");

												// Actualizar selectedReserva con la reserva sincronizada que devuelve el backend
												// Esto evita que el form de edicion quede con datos desactualizados (doble contabilizacion)
												if (data.reserva) {
													setSelectedReserva(data.reserva);
													setReservas((prev) =>
														prev.map((r) =>
															r.id === data.reserva.id ? data.reserva : r,
														),
													);
													// Limpiar montoPagado del formulario para evitar doble contabilizacion al guardar
													setFormData((prev) => ({ ...prev, montoPagado: "" }));
												}

												// Recargar historial de pagos
												await fetchPagoHistorial();

												const montoFormateado = new Intl.NumberFormat("es-CL", {
													style: "currency",
													currency: "CLP",
												}).format(montoRegistrado);
												toast.success(
													`Pago de ${montoFormateado} registrado correctamente.`,
												);
											} catch (e) {
												console.error("[RegistrarPago]", e);
												toast.error("Error registrando pago: " + e.message);
											}
										}}
									>
										Registrar
									</Button>
								</div>
							</div>
						</DialogContent>
					</Dialog>

					{/* Modal para Generar Link de Pago */}
					<Dialog
						open={showGenerarLinkDialog}
						onOpenChange={(open) => {
							setShowGenerarLinkDialog(open);
							if (!open) {
								setLinkGenerado("");
								setReservaParaLink(null);
							}
						}}
					>
						<DialogContent className="max-w-md">
							<DialogHeader>
								<DialogTitle>Generar Link de Pago</DialogTitle>
								<DialogDescription>
									Genera un enlace único para que el cliente pague su saldo
									pendiente. El cliente completará sus datos antes de pagar.
								</DialogDescription>
							</DialogHeader>

							{reservaParaLink && !linkGenerado && (
								<div className="space-y-4 mt-4">
									<div className="bg-slate-50 p-3 rounded border">
										<p className="text-sm font-semibold mb-1">
											Reserva #{reservaParaLink.id}
										</p>
										<p className="text-xs text-muted-foreground">
											{reservaParaLink.nombre} -{" "}
											{reservaParaLink.email || "Sin email"}
										</p>
									</div>
									<div className="space-y-2">
										<Label>Monto a cobrar (CLP)</Label>
										<Input
											type="number"
											value={montoGenerarLink}
											onChange={(e) =>
												setMontoGenerarLink(Number(e.target.value))
											}
											min="1"
										/>
										<p className="text-xs text-muted-foreground">
											Saldo actual de la reserva:{" "}
											{formatCurrency(reservaParaLink.saldoPendiente)}
										</p>
									</div>
									<div className="flex justify-end gap-2 pt-4">
										<Button
											variant="outline"
											onClick={() => setShowGenerarLinkDialog(false)}
										>
											Cancelar
										</Button>
										<Button
											onClick={handleGenerarLinkPago}
											disabled={generandoLink}
										>
											{generandoLink ? "Generando..." : "Generar Link"}
										</Button>
									</div>
								</div>
							)}

							{linkGenerado && (
								<div className="space-y-4 mt-4">
									<div className="bg-green-50 text-green-800 p-4 rounded-lg border border-green-200 space-y-2">
										<p className="font-semibold text-sm">¡Enlace listo!</p>
										<p className="text-xs mb-2">
											Envía este enlace al cliente por WhatsApp o email:
										</p>
										<div className="flex bg-white rounded border overflow-hidden">
											<input
												type="text"
												readOnly
												value={linkGenerado}
												className="flex-1 px-2 text-xs outline-none"
												onClick={(e) => e.target.select()}
											/>
											<Button
												className="rounded-none border-l h-auto py-2"
												onClick={() => {
													navigator.clipboard.writeText(linkGenerado);
													toast.success("Enlace copiado al portapapeles");
												}}
											>
												<Copy className="w-4 h-4" />
											</Button>
										</div>
									</div>
									<div className="flex justify-end pt-2">
										<Button onClick={() => setShowGenerarLinkDialog(false)}>
											Cerrar
										</Button>
									</div>
								</div>
							)}
						</DialogContent>
					</Dialog>
				</CardHeader>
				<CardContent>
					{error && (
						<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
							<p className="font-medium">Error:</p>
							<p>{error}</p>
						</div>
					)}

					{/* Barra de acciones masivas */}
					{selectedReservas.length > 0 && (
						<div className="bg-chocolate-50 border border-chocolate-200 px-4 py-3 rounded-md mb-4">
							<div className="flex items-center justify-between flex-wrap gap-2">
								<div className="flex items-center gap-2">
									<CheckSquare className="w-4 h-4 text-chocolate-600" />
									<span className="font-medium text-chocolate-900">
										{selectedReservas.length} reserva(s) seleccionada(s)
									</span>
								</div>
								<div className="flex gap-2 flex-wrap">
									<Button
										variant="outline"
										size="sm"
										onClick={exportarSeleccionadosXLS}
									>
										Exportar a Excel
									</Button>
									<Button
										variant="outline"
										size="sm"
										onClick={() => setShowBulkStatusDialog(true)}
									>
										Cambiar Estado
									</Button>
									{/* Botón Cambiar Estado Pago eliminado por limpieza de código */}
									<Button
										variant="destructive"
										size="sm"
										onClick={() => setShowBulkDeleteDialog(true)}
									>
										<Trash2 className="w-4 h-4 mr-1" />
										Eliminar
									</Button>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => setSelectedReservas([])}
									>
										Cancelar
									</Button>
								</div>
							</div>
						</div>
					)}

					<div className="overflow-x-auto">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className="w-12">
										<input
											type="checkbox"
											checked={
												reservasFiltradas.length > 0 &&
												selectedReservas.length === reservasFiltradas.length
											}
											onChange={toggleSelectAll}
											className="w-4 h-4 cursor-pointer"
										/>
									</TableHead>
									{columnasVisibles.id && <TableHead>ID</TableHead>}
									{columnasVisibles.cliente && <TableHead>Cliente</TableHead>}
									{columnasVisibles.contacto && <TableHead>Contacto</TableHead>}
									{columnasVisibles.rut && <TableHead>RUT</TableHead>}
									{columnasVisibles.esCliente && <TableHead>Tipo</TableHead>}
									{columnasVisibles.numViajes && <TableHead>Viajes</TableHead>}
									{columnasVisibles.ruta && <TableHead>Ruta</TableHead>}
									{columnasVisibles.fechaHora && (
										<TableHead>
											<Button
												variant="ghost"
												onClick={() => handleSort("fecha")}
												className="h-8 px-2 -ml-2 hover:bg-accent hover:text-accent-foreground font-bold"
											>
												Fecha/Hora Viaje
												<ArrowUpDown className="ml-2 h-4 w-4" />
											</Button>
										</TableHead>
									)}
									{columnasVisibles.fechaCreacion && (
										<TableHead>
											<Button
												variant="ghost"
												onClick={() => handleSort("created_at")}
												className="h-8 px-2 -ml-2 hover:bg-accent hover:text-accent-foreground font-bold"
											>
												Fecha Creación
												<ArrowUpDown className="ml-2 h-4 w-4" />
											</Button>
										</TableHead>
									)}
									{columnasVisibles.pasajeros && (
										<TableHead>Pasajeros</TableHead>
									)}
									{columnasVisibles.total && <TableHead>Total</TableHead>}
									{columnasVisibles.estado && <TableHead>Estado</TableHead>}
									{columnasVisibles.pago && <TableHead>Pago</TableHead>}
									{columnasVisibles.saldo && <TableHead>Saldo</TableHead>}
									{columnasVisibles.upgrade && <TableHead>Upgrade</TableHead>}
									{columnasVisibles.acciones && <TableHead>Acciones</TableHead>}
								</TableRow>
							</TableHeader>
							<TableBody>
								{reservasFiltradas.length === 0 ? (
									<TableRow>
										<TableCell
											colSpan={
												Object.values(columnasVisibles).filter(Boolean).length +
												1
											}
											className="text-center py-8"
										>
											<div className="text-muted-foreground">
												<FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
												<p>No se encontraron reservas</p>
											</div>
										</TableCell>
									</TableRow>
								) : (
									reservasFiltradas.map((reserva) => (
										<TableRow key={reserva.id}>
											<TableCell className="w-12">
												<input
													type="checkbox"
													checked={selectedReservas.includes(reserva.id)}
													onChange={() => toggleSelectReserva(reserva.id)}
													className="w-4 h-4 cursor-pointer"
												/>
											</TableCell>
											{columnasVisibles.id && (
												<TableCell className="font-medium">
													<div className="space-y-1">
														<div>#{reserva.id}</div>
														{reserva.codigoReserva && (
															<div className="text-xs text-chocolate-600 font-mono">
																{reserva.codigoReserva}
															</div>
														)}
														{/* Badges de Tramos */}
														{reserva.tipoTramo === "ida" &&
														reserva.tramoHijoId ? (
															<div className="mt-1 flex gap-1">
																<Badge
																	variant="outline"
																	className="text-[10px] px-1 py-0 h-4 bg-green-50 text-green-700 border-green-200"
																>
																	IDA
																</Badge>
																<Badge
																	variant="outline"
																	className="text-[10px] px-1 py-0 h-4 bg-blue-50 text-blue-700 border-blue-200"
																>
																	🔗 + VUELTA
																</Badge>
															</div>
														) : reserva.tipoTramo ? (
															<div className="mt-1">
																<Badge
																	variant={
																		reserva.tipoTramo === "vuelta"
																			? "secondary"
																			: "outline"
																	}
																	className={`text-[10px] px-1 py-0 h-4 ${reserva.tipoTramo === "vuelta" ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100" : "bg-green-50 text-green-700 border-green-200"}`}
																>
																	{reserva.tipoTramo === "vuelta"
																		? "RETORNO"
																		: "IDA"}
																</Badge>
															</div>
														) : (
															reserva.idaVuelta && (
																<div className="mt-1">
																	<Badge
																		variant="outline"
																		className="text-[10px] px-1 py-0 h-4 border-purple-200 text-purple-700 bg-purple-50"
																	>
																		IDA Y VUELTA
																	</Badge>
																</div>
															)
														)}

														{/* Badge de Detalles Incompletos */}
														{!reserva.detallesCompletos && (
															<div className="mt-1">
																<Badge
																	variant="destructive"
																	className="text-[10px] px-1 py-0 h-4 animate-pulse"
																>
																	⚠️ Detalles Incompletos
																</Badge>
															</div>
														)}

														{/* El botón de reasignar se muestra en el modal de detalle sólo si la reserva
															está confirmada y ya tiene vehículo y conductor asignados. Se movió
															aquí originalmente por error; la lógica real de visibilidad se
															maneja en el modal de 'Ver' (selectedReserva). */}
													</div>
												</TableCell>
											)}
											{columnasVisibles.cliente && (
												<TableCell>
													<div className="flex items-center gap-2">
														<User className="w-4 h-4 text-muted-foreground" />
														<span className="font-medium">
															{reserva.nombre}
														</span>
													</div>
												</TableCell>
											)}
											{columnasVisibles.contacto && (
												<TableCell>
													<div className="space-y-1 text-sm">
														<div className="flex items-center gap-1">
															<Mail className="w-3 h-3 text-muted-foreground" />
															<span className="truncate max-w-[150px]">
																{reserva.email}
															</span>
														</div>
														<div className="flex items-center gap-1">
															<Phone className="w-3 h-3 text-muted-foreground" />
															<span>{reserva.telefono}</span>
														</div>
													</div>
												</TableCell>
											)}
											{columnasVisibles.rut && (
												<TableCell>
													<span className="text-sm">{reserva.rut || "-"}</span>
												</TableCell>
											)}
											{columnasVisibles.esCliente && (
												<TableCell>
													<Badge
														variant={
															reserva.esCliente ? "default" : "secondary"
														}
														className={
															reserva.clienteId
																? "cursor-pointer"
																: "opacity-80"
														}
														onClick={
															reserva.clienteId
																? () =>
																		toggleClienteManual(
																			reserva.clienteId,
																			reserva.esCliente,
																		)
																: undefined
														}
													>
														{
															// Nueva lógica: Prioridad a "Cliente con código"
															reserva?.source === "codigo_pago" ||
															(reserva?.referenciaPago &&
																String(reserva.referenciaPago).trim().length >
																	0) ||
															reserva?.metodoPago === "codigo" ? (
																"Cliente con código"
															) : reserva.esCliente ? (
																<>
																	<Star className="w-3 h-3 mr-1" />
																	Cliente
																</>
															) : (
																"Cotizador"
															)
														}
													</Badge>
													{reserva.clasificacionCliente &&
														reserva.clasificacionCliente !==
															"Cliente Activo" && (
															<div className="mt-1">
																<Badge variant="outline">
																	{reserva.clasificacionCliente}
																</Badge>
															</div>
														)}
												</TableCell>
											)}
											{columnasVisibles.numViajes && (
												<TableCell>
													{reserva.clienteId ? (
														<Button
															variant="ghost"
															size="sm"
															onClick={() =>
																verHistorialCliente(reserva.clienteId)
															}
														>
															<History className="w-3 h-3 mr-1" />
															{reserva.totalReservas || "Ver"}
														</Button>
													) : (
														<span className="text-xs text-muted-foreground">
															-
														</span>
													)}
												</TableCell>
											)}
											{columnasVisibles.ruta && (
												<TableCell>
													<div className="space-y-1 text-sm">
														<div className="flex items-center gap-1">
															<MapPin className="w-3 h-3 text-green-500" />
															<span className="font-medium">
																{reserva.origen}
															</span>
														</div>
														<div className="flex items-center gap-1">
															<MapPin className="w-3 h-3 text-red-500" />
															<span className="font-medium">
																{reserva.destino}
															</span>
														</div>
													</div>
												</TableCell>
											)}
											{columnasVisibles.fechaHora && (
												<TableCell>
													<div className="space-y-1 text-sm">
														<div className="flex items-center gap-1">
															<Calendar className="w-3 h-3 text-muted-foreground" />
															<span className="font-semibold">
																{formatDate(reserva.fecha)}
															</span>
														</div>
														<div className="flex items-center gap-1">
															<Clock className="w-3 h-3 text-muted-foreground" />
															<span>{reserva.hora || "-"}</span>
														</div>
														{/* Mostrar fecha de vuelta si existe y es roundtrip */}
														{reserva.idaVuelta &&
															(reserva.tramoHijo || reserva.fechaRegreso) && (
																<div className="mt-1 pt-1 border-t border-dashed border-gray-200">
																	<div className="text-xs text-muted-foreground flex items-center gap-1">
																		<span className="text-[10px] font-bold text-blue-600">
																			VUELTA:
																		</span>
																	</div>
																	<div className="flex items-center gap-1 text-xs">
																		<Calendar className="w-3 h-3 text-blue-400" />
																		<span>
																			{formatDate(
																				reserva.tramoHijo?.fecha ||
																					reserva.fechaRegreso,
																			)}
																		</span>
																	</div>
																	<div className="flex items-center gap-1 text-xs">
																		<Clock className="w-3 h-3 text-blue-400" />
																		<span>
																			{reserva.tramoHijo?.hora ||
																				reserva.horaRegreso ||
																				"-"}
																		</span>
																	</div>
																</div>
															)}
													</div>
												</TableCell>
											)}
											{columnasVisibles.fechaCreacion && (
												<TableCell>
													<div className="text-xs text-muted-foreground">
														{reserva.createdAt
															? new Date(reserva.createdAt).toLocaleString(
																	"es-CL",
																	{
																		year: "numeric",
																		month: "2-digit",
																		day: "2-digit",
																		hour: "2-digit",
																		minute: "2-digit",
																		hour12: false,
																	},
																)
															: "-"}
													</div>
												</TableCell>
											)}
											{columnasVisibles.pasajeros && (
												<TableCell>
													<div className="flex flex-col gap-1">
														<div className="flex items-center gap-1">
															<Users className="w-4 h-4 text-muted-foreground" />
															<span className="font-medium">
																{reserva.pasajeros}
															</span>
														</div>
														{reserva.sillaInfantil && (
															<div className="flex items-center gap-1 text-amber-600 bg-amber-50 px-1 py-0.5 rounded border border-amber-200 w-fit">
																<Baby className="w-3 h-3" />
																<span className="text-[10px] font-medium">
																	Silla
																</span>
															</div>
														)}
														{/* Indicador de Upgrade visible en columna pasajeros */}
														{esUpgrade(reserva) && (
															<div className="flex items-center gap-1 text-purple-700 bg-purple-50 px-1 py-0.5 rounded border border-purple-200 w-fit">
																<Star className="w-3 h-3 fill-purple-600" />
																<span className="text-[10px] font-bold">
																	Upgrade
																</span>
															</div>
														)}
													</div>
												</TableCell>
											)}
											{columnasVisibles.total && (
												<TableCell className="font-semibold">
													{formatCurrency(
														Number(reserva.totalConDescuento || 0) +
															Number(reserva.tramoHijo?.totalConDescuento || 0),
													)}
												</TableCell>
											)}
											{columnasVisibles.estado && (
												<TableCell>{getEstadoBadge(reserva.estado)}</TableCell>
											)}
											{columnasVisibles.pago && (
												<TableCell>
													{/* Cuando hay tramo hijo, calculamos un badge de estado de pago agregado o mostramos el del padre con indicación */}
													{getEstadoPagoBadge({
														...reserva,
														pagoMonto:
															Number(reserva.pagoMonto || 0) +
															Number(reserva.tramoHijo?.pagoMonto || 0),
														totalConDescuento:
															Number(reserva.totalConDescuento || 0) +
															Number(reserva.tramoHijo?.totalConDescuento || 0),
														saldoPendiente:
															Number(reserva.saldoPendiente || 0) +
															Number(reserva.tramoHijo?.saldoPendiente || 0),
													})}
												</TableCell>
											)}
											{columnasVisibles.saldo && (
												<TableCell>
													{(() => {
														const saldoTotal =
															Number(reserva.saldoPendiente || 0) +
															Number(reserva.tramoHijo?.saldoPendiente || 0);
														return (
															<span
																className={
																	saldoTotal > 0
																		? "text-red-600 font-semibold"
																		: "text-green-600 font-semibold"
																}
															>
																{formatCurrency(saldoTotal)}
															</span>
														);
													})()}
												</TableCell>
											)}
											{columnasVisibles.upgrade && (
												<TableCell>
													{esUpgrade(reserva) ? (
														<Badge className="bg-chocolate-600 text-white hover:bg-chocolate-700 whitespace-nowrap">
															<Star className="w-3 h-3 mr-1 fill-white" />
															Van Upgrade
														</Badge>
													) : (
														<span className="text-muted-foreground text-xs">
															-
														</span>
													)}
												</TableCell>
											)}
											{columnasVisibles.acciones && (
												<TableCell>
													<div className="flex gap-2">
														<Button
															variant="outline"
															size="sm"
															onClick={() => handleViewDetails(reserva)}
														>
															<Eye className="w-4 h-4" />
														</Button>
														<Button
															variant="default"
															size="sm"
															onClick={() => handleEdit(reserva)}
														>
															<Edit className="w-4 h-4" />
														</Button>
														{/* Botón para generar Link de Pago */}
														{["pendiente", "confirmada"].includes(
															reserva.estado,
														) &&
															reserva.estadoPago !== "pagado" &&
															Number(reserva.totalConDescuento) > 0 &&
															Number(reserva.pagoMonto || 0) <
																Number(reserva.totalConDescuento) && (
																<Button
																	variant="outline"
																	size="sm"
																	onClick={() => {
																		setReservaParaLink(reserva);
																		const suggestedAmount =
																			Number(reserva.saldoPendiente) > 0
																				? Number(reserva.saldoPendiente)
																				: Number(
																						reserva.totalConDescuento || 0,
																					) - Number(reserva.pagoMonto || 0);
																		setMontoGenerarLink(
																			suggestedAmount > 0
																				? suggestedAmount
																				: Number(reserva.totalConDescuento),
																		);
																		setLinkGenerado("");
																		setShowGenerarLinkDialog(true);
																	}}
																	title="Generar Link de Pago"
																	className="border-blue-200 text-blue-700 hover:bg-blue-50"
																>
																	<Link2 className="w-4 h-4" />
																</Button>
															)}
														{/* Mostrar botón de asignar / reasignar cuando la reserva está confirmada */}
														{reserva?.estado === "confirmada" && (
															<Button
																variant={
																	isAsignada(reserva) ? "outline" : "secondary"
																}
																size="sm"
																onClick={() => handleAsignar(reserva)}
																title={
																	isAsignada(reserva)
																		? "Reasignar vehículo y conductor"
																		: "Asignar vehículo y conductor"
																}
															>
																<span role="img" aria-label="auto">
																	🚗
																</span>
															</Button>
														)}

														{/* Botón de Seguimiento WhatsApp para leads abandonados */}
														{reserva?.source === "lead_hero_abandonado" && (
															<Button
																variant="outline"
																size="sm"
																className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
																onClick={() =>
																	copiarMensajeSeguimiento(reserva)
																}
																title="Copiar mensaje de seguimiento para WhatsApp"
															>
																<MessageSquare className="w-4 h-4" />
															</Button>
														)}

														{/* Botón para completar reserva y agregar gastos */}
														{reserva?.estado === "confirmada" && (
															<Button
																variant="default"
																size="sm"
																onClick={() => handleCompletar(reserva)}
																title="Completar reserva y agregar gastos"
																className="bg-green-600 hover:bg-green-700"
															>
																<CheckCircle2 className="w-4 h-4" />
															</Button>
														)}
														<Button
															variant="ghost"
															size="icon"
															onClick={() => handleArchivar(reserva)}
															title={
																reserva.archivada
																	? "Desarchivar"
																	: ["pendiente", "cancelada"].includes(
																				reserva.estado,
																		  )
																		? "Archivar"
																		: "Solo se pueden archivar reservas pendientes o canceladas"
															}
															disabled={
																!reserva.archivada &&
																!["pendiente", "cancelada"].includes(
																	reserva.estado,
																)
															}
														>
															{reserva.archivada ? (
																<RefreshCw className="h-4 w-4" />
															) : (
																<CheckSquare className="h-4 w-4" />
															)}
														</Button>
													</div>
												</TableCell>
											)}
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</div>

					{/* PaginaciÃ³n */}
					<div className="flex items-center justify-between mt-4">
						<p className="text-sm text-muted-foreground mr-4">
							Página {currentPage} de {totalPages}
						</p>
						<p className="text-sm text-muted-foreground mr-4">
							Total: {totalReservas} registros
						</p>
						<div className="flex items-center gap-2 mr-4">
							<span className="text-sm text-muted-foreground">Filas:</span>
							<Select
								value={String(itemsPerPage)}
								onValueChange={(val) => {
									setItemsPerPage(Number(val));
									setCurrentPage(1);
								}}
							>
								<SelectTrigger className="w-[80px] h-8">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="20">20</SelectItem>
									<SelectItem value="50">50</SelectItem>
									<SelectItem value="100">100</SelectItem>
									<SelectItem value="-1">Todas</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="flex gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
								disabled={currentPage === 1}
							>
								<ChevronLeft className="w-4 h-4" />
								Anterior
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={() =>
									setCurrentPage((p) => Math.min(totalPages, p + 1))
								}
								disabled={currentPage === totalPages}
							>
								Siguiente
								<ChevronRight className="w-4 h-4" />
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Modal de Detalles */}
			<Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
				<DialogContent className="sm:max-w-6xl md:max-w-6xl lg:max-w-6xl max-h-[85vh] overflow-y-auto">
					<DialogHeader>
						<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
							<div className="flex items-center gap-3">
								<div className="bg-chocolate-600 p-2.5 rounded-xl shadow-lg shadow-chocolate-200">
									<ClipboardList className="w-6 h-6 text-white" />
								</div>
								<div>
									<DialogTitle className="text-xl font-bold text-chocolate-950 flex items-center gap-2">
										Reserva #{selectedReserva?.id}
										{selectedReserva?.estado && (
											<div className="scale-75 origin-left">
												{getEstadoBadge(selectedReserva.estado)}
											</div>
										)}
									</DialogTitle>
									<DialogDescription className="text-chocolate-700/70 font-medium">
										Gestión integral y detalles del servicio
									</DialogDescription>
								</div>
							</div>

							<div className="flex flex-wrap gap-2 w-full md:w-auto">
								<Button
									size="sm"
									variant="outline"
									className="gap-2 border-chocolate-200 text-chocolate-800 hover:bg-chocolate-50"
									onClick={() => {
										const link = `${window.location.origin}/#comprar-productos/${selectedReserva?.codigoReserva}`;
										navigator.clipboard.writeText(link);
										toast.success("Enlace de pago copiado");
									}}
								>
									<Link2 className="w-4 h-4" />
									Link de Pago
								</Button>

								<Button
									size="sm"
									variant="outline"
									className="gap-2 border-blue-200 text-blue-700 hover:bg-blue-50"
									onClick={() => handleEdit(selectedReserva)}
								>
									<Edit3 className="w-4 h-4" />
									Editar
								</Button>

								{selectedReserva?.tramoVuelta ? (
									<>
										<Button
											size="sm"
											variant="outline"
											className="gap-2 bg-green-50 hover:bg-green-100 border-green-200 text-green-700"
											onClick={() => {
												const text = generarTextoConductor(selectedReserva);
												navigator.clipboard.writeText(text);
												toast.success("Info IDA copiada");
											}}
										>
											<Copy className="w-4 h-4" />
											Copiar IDA
										</Button>
										<Button
											size="sm"
											variant="outline"
											className="gap-2 bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
											onClick={() => {
												const text = generarTextoConductor(
													selectedReserva?.tramoVuelta,
												);
												navigator.clipboard.writeText(text);
												toast.success("Info VUELTA copiada");
											}}
										>
											<Copy className="w-4 h-4" />
											Copiar VUELTA
										</Button>
									</>
								) : (
									<Button
										size="sm"
										variant="outline"
										className="gap-2 border-chocolate-200 text-chocolate-800 hover:bg-chocolate-50"
										onClick={() => {
											const text = generarTextoConductor(selectedReserva);
											navigator.clipboard.writeText(text);
											toast.success("Info copiada para conductor");
										}}
									>
										<Copy className="w-4 h-4" />
										Copiar Info
									</Button>
								)}
							</div>
						</div>
					</DialogHeader>

					{selectedReserva && (
						<div className="space-y-6 mt-4">
							<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
								{/* Columna Izquierda: Cliente y Código */}
								<div className="lg:col-span-1 space-y-6">
									{/* Tarjeta de Código de Reserva */}
									<div className="bg-gradient-to-br from-chocolate-600 to-chocolate-800 rounded-2xl p-5 text-white shadow-xl shadow-chocolate-100 relative overflow-hidden group">
										<div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-500"></div>
										<div className="relative z-10 flex justify-between items-start">
											<div>
												<p className="text-chocolate-100 text-xs font-bold uppercase tracking-widest mb-1">
													Código de Seguimiento
												</p>
												<h4 className="text-3xl font-black tracking-tighter">
													{selectedReserva.codigoReserva}
												</h4>
											</div>
											<div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
												<Hash className="w-5 h-5 text-white" />
											</div>
										</div>
									</div>

									{/* Tarjeta de Cliente */}
									<div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
										<div className="flex items-center justify-between">
											<h3 className="font-bold text-slate-800 flex items-center gap-2">
												<div className="p-1.5 bg-slate-100 rounded-lg">
													<User className="w-4 h-4 text-chocolate-600" />
												</div>
												Información del Cliente
											</h3>
											<div className="flex gap-2 items-center">
												<button
													onClick={() => {
														const text = copiarInfoCliente(selectedReserva);
														navigator.clipboard.writeText(text);
														toast.success("Info de cliente copiada");
													}}
													className="p-1 px-2.5 bg-chocolate-50 hover:bg-chocolate-100 border border-chocolate-200 rounded-lg text-chocolate-700 transition-all flex items-center gap-1.5 text-[10px] font-bold uppercase"
													title="Copiar para WhatsApp"
												>
													<MessageSquare className="w-3 h-3" />
													WhatsApp
												</button>
												{selectedReserva.clienteId && (
													<Badge
														variant="secondary"
														className="text-[10px] bg-slate-100 text-slate-600 font-mono"
													>
														ID: {selectedReserva.clienteId}
													</Badge>
												)}
											</div>
										</div>

										<div className="space-y-3">
											<div className="group relative bg-slate-50 p-3 rounded-xl border border-transparent hover:border-chocolate-200 hover:bg-white transition-all">
												<Label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1 block">
													Nombre Completo
												</Label>
												<p className="font-semibold text-slate-900 group-hover:text-chocolate-700 transition-colors uppercase">
													{selectedReserva.nombre}
												</p>
											</div>

											<div className="group relative bg-slate-50 p-3 rounded-xl border border-transparent hover:border-chocolate-200 hover:bg-white transition-all">
												<Label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1 block flex justify-between items-center">
													Correo Electrónico
													<button
														onClick={() => {
															navigator.clipboard.writeText(
																selectedReserva.email,
															);
															toast.success("Email copiado");
														}}
														className="opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-white border rounded shadow-sm text-chocolate-600"
													>
														<Copy className="w-3 h-3" />
													</button>
												</Label>
												<p className="font-medium text-slate-700 truncate">
													{selectedReserva.email}
												</p>
											</div>

											<div className="group relative bg-slate-50 p-3 rounded-xl border border-transparent hover:border-chocolate-200 hover:bg-white transition-all">
												<Label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1 block flex justify-between items-center">
													Teléfono de Contacto
													<div className="flex gap-1">
														<button
															onClick={() => {
																navigator.clipboard.writeText(
																	selectedReserva.telefono,
																);
																toast.success("Teléfono copiado");
															}}
															className="opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-white border rounded shadow-sm text-chocolate-600"
														>
															<Copy className="w-3 h-3" />
														</button>
														<button
															onClick={() => {
																const phone = selectedReserva.telefono.replace(
																	/\D/g,
																	"",
																);
																const text = encodeURIComponent(
																	`Hola ${selectedReserva.nombre}, te contacto de Transportes Araucaria para coordinar tu viaje con código ${selectedReserva.codigoReserva}.`,
																);
																window.open(
																	`https://wa.me/${phone}?text=${text}`,
																	"_blank",
																);
															}}
															className="opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-green-500 border border-green-600 rounded shadow-sm text-white"
														>
															<MessageSquare className="w-3 h-3" />
														</button>
													</div>
												</Label>
												<p className="font-bold text-slate-900">
													{selectedReserva.telefono}
												</p>
											</div>
										</div>
									</div>
								</div>

								<div className="lg:col-span-2 space-y-6">
									{/* Tarjeta de Trayectos */}
									<div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5">
										<div className="flex items-center justify-between">
											<h3 className="font-bold text-slate-800 flex items-center gap-2">
												<div className="p-1.5 bg-slate-100 rounded-lg">
													<MapPin className="w-4 h-4 text-chocolate-600" />
												</div>
												Itinerario del Servicio
											</h3>
											<div className="flex gap-2 items-center">
												<button
													onClick={() => {
														const text = copiarInfoItinerario(selectedReserva);
														navigator.clipboard.writeText(text);
														toast.success("Itinerario copiado");
													}}
													className="p-1 px-2.5 bg-chocolate-50 hover:bg-chocolate-100 border border-chocolate-200 rounded-lg text-chocolate-700 transition-all flex items-center gap-1.5 text-[10px] font-bold uppercase"
													title="Copiar para WhatsApp"
												>
													<MessageSquare className="w-3 h-3" />
													WhatsApp
												</button>
												{(selectedReserva.idaVuelta ||
													selectedReserva.tramoVuelta) && (
													<Badge
														variant="secondary"
														className="bg-blue-50 text-blue-700 border-blue-100 gap-1.5"
													>
														<RefreshCcw className="w-3 h-3" />
														Ida y Vuelta
													</Badge>
												)}
											</div>
										</div>

										<div className="space-y-4">
											{/* TRAMO IDA */}
											<div className="relative pl-8 border-l-2 border-slate-100 pb-2">
												<div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-green-500 border-4 border-white shadow-sm"></div>
												<div className="bg-green-50/50 border border-green-100 rounded-2xl p-4 transition-all hover:shadow-md hover:shadow-green-100/50">
													<div className="flex flex-col md:flex-row justify-between gap-4">
														<div className="flex-1 space-y-3">
															<div className="flex items-center justify-between">
																<span className="text-[10px] font-black uppercase text-green-700 tracking-wider">
																	Origen
																</span>
																<Badge
																	variant="outline"
																	className="text-[10px] bg-white text-green-700 border-green-200"
																>
																	IDA
																</Badge>
															</div>
															<p className="text-lg font-bold text-slate-900 leading-tight">
																{selectedReserva.origen}
															</p>
															{selectedReserva.direccionOrigen && (
																<div className="flex items-start gap-2 bg-white/60 p-2.5 rounded-xl border border-green-200/50 group/addr">
																	<MapPin className="w-4 h-4 text-green-600 mt-0.5" />
																	<div className="flex-1 min-w-0">
																		<p className="text-xs font-bold text-green-800 mb-0.5">
																			Dirección Específica
																		</p>
																		<p className="text-sm font-medium text-slate-700 truncate">
																			{selectedReserva.direccionOrigen}
																		</p>
																	</div>
																	<button
																		onClick={() => {
																			navigator.clipboard.writeText(
																				selectedReserva.direccionOrigen,
																			);
																			toast.success("Dirección copiada");
																		}}
																		className="opacity-0 group-hover/addr:opacity-100 p-1 hover:bg-green-100 rounded text-green-700 transition-all"
																	>
																		<Copy className="w-3 h-3" />
																	</button>
																</div>
															)}
														</div>

														<div className="w-px h-auto bg-green-200/50 hidden md:block"></div>

														<div className="flex-1 space-y-3">
															<span className="text-[10px] font-black uppercase text-green-700 tracking-wider">
																Destino
															</span>
															<p className="text-lg font-bold text-slate-900 leading-tight">
																{selectedReserva.destino}
															</p>
															{selectedReserva.direccionDestino && (
																<div className="flex items-start gap-2 bg-white/60 p-2.5 rounded-xl border border-green-200/50 group/addr">
																	<MapPin className="w-4 h-4 text-green-600 mt-0.5" />
																	<div className="flex-1 min-w-0">
																		<p className="text-xs font-bold text-green-800 mb-0.5">
																			Dirección Específica
																		</p>
																		<p className="text-sm font-medium text-slate-700 truncate">
																			{selectedReserva.direccionDestino}
																		</p>
																	</div>
																	<button
																		onClick={() => {
																			navigator.clipboard.writeText(
																				selectedReserva.direccionDestino,
																			);
																			toast.success("Dirección copiada");
																		}}
																		className="opacity-0 group-hover/addr:opacity-100 p-1 hover:bg-green-100 rounded text-green-700 transition-all"
																	>
																		<Copy className="w-3 h-3" />
																	</button>
																</div>
															)}
														</div>
													</div>

													<div className="mt-4 pt-3 border-t border-green-200 flex flex-wrap gap-4">
														<div className="flex items-center gap-2">
															<Calendar className="w-4 h-4 text-green-700" />
															<span className="text-sm font-bold text-slate-900">
																{formatDate(selectedReserva.fecha)}
															</span>
														</div>
														<div className="flex items-center gap-2">
															<Clock className="w-4 h-4 text-green-700" />
															<span className="text-sm font-bold text-slate-900">
																{selectedReserva.hora || "Sin hora"}
															</span>
														</div>
														<div className="flex items-center gap-2 ml-auto">
															<Users className="w-4 h-4 text-green-700" />
															<span className="text-sm font-bold text-slate-900">
																{selectedReserva.pasajeros} PAX
															</span>
														</div>
													</div>
												</div>
											</div>

											{/* TRAMO VUELTA (Si existe) */}
											{(selectedReserva.idaVuelta ||
												selectedReserva.tramoVuelta) && (
												<div className="relative pl-8 border-l-2 border-slate-100">
													<div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-500 border-4 border-white shadow-sm"></div>
													<div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 transition-all hover:shadow-md hover:shadow-blue-100/50">
														<div className="flex flex-col md:flex-row justify-between gap-4">
															<div className="flex-1 space-y-3">
																<div className="flex items-center justify-between">
																	<span className="text-[10px] font-black uppercase text-blue-700 tracking-wider">
																		Origen
																	</span>
																	<Badge
																		variant="outline"
																		className="text-[10px] bg-white text-blue-700 border-blue-200"
																	>
																		VUELTA
																	</Badge>
																</div>
																<p className="text-lg font-bold text-slate-900 leading-tight">
																	{selectedReserva.tramoVuelta
																		? selectedReserva.tramoVuelta.origen
																		: selectedReserva.destino}
																</p>
																{selectedReserva.tramoVuelta
																	?.direccionOrigen && (
																	<div className="flex items-start gap-2 bg-white/60 p-2.5 rounded-xl border border-blue-200/50">
																		<MapPin className="w-3.5 h-3.5 text-blue-600 mt-0.5" />
																		<p className="text-xs font-medium text-slate-700 truncate">
																			{
																				selectedReserva.tramoVuelta
																					.direccionOrigen
																			}
																		</p>
																	</div>
																)}
															</div>

															<div className="w-px h-auto bg-blue-200/50 hidden md:block"></div>

															<div className="flex-1 space-y-3">
																<span className="text-[10px] font-black uppercase text-blue-700 tracking-wider">
																	Destino
																</span>
																<p className="text-lg font-bold text-slate-900 leading-tight">
																	{selectedReserva.tramoVuelta
																		? selectedReserva.tramoVuelta.destino
																		: selectedReserva.origen}
																</p>
																{selectedReserva.tramoVuelta
																	?.direccionDestino && (
																	<div className="flex items-start gap-2 bg-white/60 p-2.5 rounded-xl border border-blue-200/50">
																		<MapPin className="w-3.5 h-3.5 text-blue-600 mt-0.5" />
																		<p className="text-xs font-medium text-slate-700 truncate">
																			{
																				selectedReserva.tramoVuelta
																					.direccionDestino
																			}
																		</p>
																	</div>
																)}
															</div>
														</div>

														<div className="mt-4 pt-3 border-t border-blue-200 flex flex-wrap gap-4">
															<div className="flex items-center gap-2">
																<Calendar className="w-4 h-4 text-blue-700" />
																<span className="text-sm font-bold text-slate-900">
																	{selectedReserva.tramoVuelta
																		? selectedReserva.tramoVuelta.fecha
																			? formatDate(
																					selectedReserva.tramoVuelta.fecha,
																				)
																			: "-"
																		: selectedReserva.fechaRegreso
																			? formatDate(selectedReserva.fechaRegreso)
																			: "-"}
																</span>
															</div>
															<div className="flex items-center gap-2">
																<Clock className="w-4 h-4 text-blue-700" />
																<span className="text-sm font-bold text-slate-900">
																	{selectedReserva.tramoVuelta
																		? selectedReserva.tramoVuelta.hora
																		: selectedReserva.horaRegreso || "-"}
																</span>
															</div>
														</div>
													</div>
												</div>
											)}
										</div>
									</div>

									{/* Tarjeta Financiera y Totales */}
									<div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col md:flex-row">
										<div className="flex-1 p-5 space-y-4">
											<h3 className="font-bold text-slate-800 flex items-center gap-2 font-bold">
												<div className="p-1.5 bg-slate-100 rounded-lg">
													<DollarSign className="w-4 h-4 text-chocolate-600" />
												</div>
												Detalles del Pago
											</h3>
											<button
												onClick={() => {
													const text = copiarInfoFinanzas(selectedReserva);
													navigator.clipboard.writeText(text);
													toast.success("Resumen de pago copiado");
												}}
												className="p-1 px-2.5 bg-chocolate-50 hover:bg-chocolate-100 border border-chocolate-200 rounded-lg text-chocolate-700 transition-all flex items-center gap-1.5 text-[10px] font-bold uppercase"
												title="Copiar para WhatsApp"
											>
												<MessageSquare className="w-3 h-3" />
												WhatsApp
											</button>

											<div className="space-y-2">
												<div className="flex justify-between text-sm">
													<span className="text-slate-500 font-medium">
														Precio por Servicio
													</span>
													<span className="font-semibold text-slate-900">
														{formatCurrency(selectedReserva.precio)}
													</span>
												</div>
												{/* Desglose detallado de descuentos cuando aplica */}
												{Number(selectedReserva.precio) -
													Number(selectedReserva.totalConDescuento) >
													0 && (
													<>
														{Number(selectedReserva.descuentoBase) > 0 && (
															<div className="flex justify-between text-sm">
																<span className="text-green-600 font-medium flex items-center gap-1">
																	<Tag className="w-3 h-3" />
																	Descuento base
																</span>
																<span className="font-bold text-green-600">
																	-
																	{formatCurrency(
																		selectedReserva.descuentoBase,
																	)}
																</span>
															</div>
														)}
														{Number(selectedReserva.descuentoOnline) > 0 && (
															<div className="flex justify-between text-sm">
																<span className="text-green-600 font-medium flex items-center gap-1">
																	<Tag className="w-3 h-3" />
																	Descuento online
																</span>
																<span className="font-bold text-green-600">
																	-
																	{formatCurrency(
																		selectedReserva.descuentoOnline,
																	)}
																</span>
															</div>
														)}
														{Number(selectedReserva.descuentoRoundTrip) > 0 && (
															<div className="flex justify-between text-sm">
																<span className="text-green-600 font-medium flex items-center gap-1">
																	<Tag className="w-3 h-3" />
																	Descuento ida y vuelta
																</span>
																<span className="font-bold text-green-600">
																	-
																	{formatCurrency(
																		selectedReserva.descuentoRoundTrip,
																	)}
																</span>
															</div>
														)}
														{Number(selectedReserva.descuentoPromocion) > 0 && (
															<div className="flex justify-between text-sm">
																<span className="text-green-600 font-medium flex items-center gap-1">
																	<Tag className="w-3 h-3" />
																	Promoción
																	{selectedReserva.codigoDescuento
																		? ` (${selectedReserva.codigoDescuento})`
																		: ""}
																</span>
																<span className="font-bold text-green-600">
																	-
																	{formatCurrency(
																		selectedReserva.descuentoPromocion,
																	)}
																</span>
															</div>
														)}
														{/* Si hay descuento pero ninguno de los campos individuales lo explica,
														    mostrar el total calculado como fallback */}
														{!(
															Number(selectedReserva.descuentoBase) > 0 ||
															Number(selectedReserva.descuentoOnline) > 0 ||
															Number(selectedReserva.descuentoRoundTrip) > 0 ||
															Number(selectedReserva.descuentoPromocion) > 0
														) && (
															<div className="flex justify-between text-sm">
																<span className="text-green-600 font-medium flex items-center gap-1">
																	<Tag className="w-3 h-3" />
																	Descuentos Aplicados
																</span>
																<span className="font-bold text-green-600">
																	-
																	{formatCurrency(
																		Number(selectedReserva.precio) -
																			Number(selectedReserva.totalConDescuento),
																	)}
																</span>
															</div>
														)}
													</>
												)}
												<div className="pt-2 border-t flex justify-between items-center text-lg">
													<span className="font-black text-slate-800">
														Total a Cobrar
													</span>
													<span className="font-black text-chocolate-700">
														{formatCurrency(selectedReserva.totalConDescuento)}
													</span>
												</div>
											</div>

											<div className="grid grid-cols-2 gap-3 pt-2">
												<div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
													<p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">
														Pagado hasta ahora
													</p>
													<p className="text-base font-black text-green-600">
														{formatCurrency(montoPagadoVisual || 0)}
													</p>
												</div>
												<div
													className={`p-2.5 rounded-xl border ${selectedReserva.saldoPendiente > 0 ? "bg-red-50 border-red-100" : "bg-green-50 border-green-100"}`}
												>
													<p
														className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${selectedReserva.saldoPendiente > 0 ? "text-red-500" : "text-green-500"}`}
													>
														Saldo Pendiente
													</p>
													<p
														className={`text-base font-black ${selectedReserva.saldoPendiente > 0 ? "text-red-600" : "text-green-600"}`}
													>
														{selectedReserva.saldoPendiente > 0
															? formatCurrency(selectedReserva.saldoPendiente)
															: "SIN DEUDA"}
													</p>
												</div>
											</div>
										</div>

										<div className="w-full md:w-64 bg-slate-50 border-l border-slate-100 p-5 space-y-4">
											<div className="space-y-3">
												<div>
													<Label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
														Estado del Abono
													</Label>
													<Badge
														variant={
															selectedReserva.abonoPagado
																? "default"
																: "secondary"
														}
														className={`w-full justify-center h-8 rounded-lg ${selectedReserva.abonoPagado ? "bg-green-600" : "bg-slate-200 text-slate-500 border-none"}`}
													>
														{selectedReserva.abonoPagado
															? "PAGADO"
															: "PENDIENTE"}
													</Badge>
												</div>
												<div>
													<Label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
														Estado del Saldo
													</Label>
													<Badge
														variant={
															selectedReserva.saldoPagado
																? "default"
																: "secondary"
														}
														className={`w-full justify-center h-8 rounded-lg ${selectedReserva.saldoPagado ? "bg-green-600" : "bg-slate-200 text-slate-500 border-none"}`}
													>
														{selectedReserva.saldoPagado
															? "PAGADO"
															: "PENDIENTE"}
													</Badge>
												</div>
												<div className="pt-2 border-t">
													<Label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
														Método Preferido
													</Label>
													<p className="text-sm font-bold text-slate-700 uppercase flex items-center gap-2">
														<CreditCard className="w-4 h-4 text-chocolate-600" />
														{selectedReserva.metodoPago || "No especificado"}
													</p>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
							{/* Fila Inferior: Información Adicional e Historial */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
								{/* Tarjeta de Información Adicional */}
								<div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
									<h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm uppercase tracking-wider">
										<div className="p-1 bg-slate-100 rounded">
											<Plus className="w-3.5 h-3.5 text-chocolate-600" />
										</div>
										Complementos
									</h3>
									<button
										onClick={() => {
											const text = copiarInfoComplementos(selectedReserva);
											navigator.clipboard.writeText(text);
											toast.success("Complementos copiados");
										}}
										className="p-1 px-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600 transition-all flex items-center gap-1.5 text-[10px] font-bold uppercase"
										title="Copiar para WhatsApp"
									>
										<MessageSquare className="w-3 h-3" />
										WhatsApp
									</button>
									<div className="grid grid-cols-2 gap-4">
										{selectedReserva.numeroVuelo && (
											<div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
												<p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">
													Nº Vuelo
												</p>
												<p className="text-sm font-black text-slate-900">
													{selectedReserva.numeroVuelo}
												</p>
											</div>
										)}
										{selectedReserva.hotel && (
											<div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
												<p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">
													Ref / Hotel
												</p>
												<p className="text-sm font-bold text-slate-700">
													{selectedReserva.hotel}
												</p>
											</div>
										)}
										{selectedReserva.equipajeEspecial && (
											<div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 col-span-2">
												<p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">
													Equipaje Especial
												</p>
												<p className="text-sm font-medium text-slate-700">
													{selectedReserva.equipajeEspecial}
												</p>
											</div>
										)}
										{selectedReserva.sillaInfantil && (
											<div className="bg-orange-50 p-2.5 rounded-xl border border-orange-100 col-span-2 flex items-center gap-2">
												<div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
												<p className="text-xs font-bold text-orange-700 tracking-tight">
													SILLA INFANTIL REQUERIDA
												</p>
											</div>
										)}
										{/* Upgrade a Van visible en modal de detalle */}
										{esUpgrade(selectedReserva) && (
											<div className="bg-purple-50 p-2.5 rounded-xl border border-purple-200 col-span-2 flex items-center gap-3">
												<div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
												<Star className="w-4 h-4 text-purple-600 fill-purple-500 flex-shrink-0" />
												<p className="text-xs font-bold text-purple-800 tracking-tight">
													✨ UPGRADE A VAN SOLICITADO — El pasajero pagó por
													vehículo tipo Van
												</p>
											</div>
										)}
									</div>
								</div>

								{/* Tarjeta de Historial Interno */}
								<div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
									<h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm uppercase tracking-wider">
										<div className="p-1 bg-slate-100 rounded">
											<History className="w-3.5 h-3.5 text-chocolate-600" />
										</div>
										Historial Interno
									</h3>
									<div className="max-h-[140px] overflow-y-auto pr-2 space-y-2 scrollbar-thin scrollbar-thumb-slate-200">
										{loadingHistorial ? (
											<p className="text-xs text-slate-400 italic">
												Cargando...
											</p>
										) : historialAsignaciones.length === 0 ? (
											<p className="text-xs text-slate-400 italic">
												Sin cambios de asignación previos
											</p>
										) : (
											historialAsignaciones.map((h) => (
												<div
													key={h.id}
													className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-[11px]"
												>
													<div className="flex justify-between items-start mb-1">
														<span className="font-bold text-chocolate-700 uppercase">
															{h.vehiculo || "Vehículo N/A"}
														</span>
														<span className="text-slate-400">
															{new Date(h.created_at).toLocaleString("es-CL", {
																day: "2-digit",
																month: "2-digit",
																hour: "2-digit",
																minute: "2-digit",
															})}
														</span>
													</div>
													<p className="text-slate-600 font-medium">
														Asignado a:{" "}
														<span className="text-slate-900">
															{h.conductor || "Sin conductor"}
														</span>
													</p>
												</div>
											))
										)}
									</div>
								</div>
							</div>

							{/* Observaciones y Notas */}
							{(selectedReserva.observaciones || selectedReserva.mensaje) && (
								<div className="bg-chocolate-50 p-5 rounded-2xl border border-chocolate-100 space-y-4 mt-6">
									<h3 className="font-bold text-chocolate-900 flex items-center gap-2 text-sm uppercase tracking-wider">
										<MessageSquare className="w-4 h-4" />
										Notas y Observaciones
									</h3>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										{selectedReserva.mensaje && (
											<div className="space-y-1">
												<Label className="text-[10px] text-chocolate-700 font-bold uppercase">
													Mensaje del Cliente
												</Label>
												<p className="text-sm p-3 bg-white rounded-xl border border-chocolate-200 text-slate-800 font-medium">
													{selectedReserva.mensaje}
												</p>
											</div>
										)}
										{selectedReserva.observaciones && (
											<div className="space-y-1">
												<Label className="text-[10px] text-chocolate-700 font-bold uppercase">
													Notas Administrativas
												</Label>
												<p className="text-sm p-3 bg-white rounded-xl border border-chocolate-200 text-slate-800 font-medium italic">
													{selectedReserva.observaciones}
												</p>
											</div>
										)}
									</div>
								</div>
							)}

							{/* Sección de Evaluación del Servicio (solo para reservas completadas) */}
							{selectedReserva.estado === "completada" && (
								<div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-4">
									<h4 className="text-sm font-bold text-amber-800 mb-3">
										⭐ Evaluación del Servicio
									</h4>
									{(() => {
										const infoEval = solicitudEvaluacion[selectedReserva.id];
										if (infoEval?.evaluada) {
											return (
												<div className="flex items-center gap-2">
													<span className="bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full">
														✅ Evaluada
													</span>
													<button
														className="text-xs text-amber-700 underline"
														onClick={() => {
															setShowDetailDialog(false);
														}}
													>
														Ver en Evaluaciones
													</button>
												</div>
											);
										}
										if (infoEval?.enviada) {
											// Construir mensaje predeterminado para copiar y enviar manualmente por WhatsApp
											const linkEval = infoEval.token
												? `https://www.transportesaraucaria.cl/#evaluar?token=${infoEval.token}`
												: null;
											const mensajePredeterminado = linkEval
												? `Hola ${selectedReserva.nombre || "pasajero"}, gracias por viajar con Transportes Araucanía 🙏. Tu opinión es muy importante para nosotros. ¿Podrías evaluar tu experiencia? Solo toma un momento: ${linkEval}`
												: null;
											return (
												<div className="flex flex-wrap items-center gap-2">
													<span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-3 py-1 rounded-full">
														⏳ Correo enviado el{" "}
														{new Date(infoEval.fecha).toLocaleDateString(
															"es-CL",
														)}
													</span>
													{/* Botón para copiar el mensaje predeterminado y pegarlo manualmente en WhatsApp */}
													{mensajePredeterminado && (
														<button
															onClick={() => {
																navigator.clipboard.writeText(
																	mensajePredeterminado,
																);
																toast.success(
																	"Mensaje copiado. Pégalo en WhatsApp.",
																);
															}}
															className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
														>
															📋 Copiar mensaje para WhatsApp
														</button>
													)}
												</div>
											);
										}
										return (
											<button
												onClick={() =>
													handleSolicitarEvaluacion(selectedReserva)
												}
												disabled={
													solicitandoEvaluacion || !selectedReserva.email
												}
												className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
											>
												{solicitandoEvaluacion
													? "⏳ Enviando..."
													: "📧 Solicitar evaluación al pasajero"}
											</button>
										);
									})()}
								</div>
							)}

							{/* Footer de Acciones Rápidas */}
							<div className="pt-6 border-t flex flex-wrap justify-between items-center gap-4 mt-6">
								<div className="flex gap-4 text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
									<div className="flex items-center gap-1.5">
										<div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
										Creado:{" "}
										{new Date(selectedReserva.created_at).toLocaleDateString()}
									</div>
									<div className="flex items-center gap-1.5">
										<div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
										IP: {selectedReserva.ipAddress || "Interna"}
									</div>
									<div className="flex items-center gap-1.5">
										<div className="w-1.5 h-1.5 rounded-full bg-chocolate-400"></div>
										Fuente: {selectedReserva.source || "WEB_APP"}
									</div>
								</div>

								<div className="flex gap-3">
									<Button
										variant="ghost"
										size="sm"
										className="text-slate-500 font-bold text-xs uppercase hover:bg-slate-100"
										onClick={() => setShowDetailDialog(false)}
									>
										Cerrar Vista
									</Button>

									{!isAsignada(selectedReserva) && (
										<Button
											size="sm"
											className="bg-chocolate-600 hover:bg-chocolate-700 text-white font-bold text-xs uppercase px-6"
											onClick={() => {
												setShowDetailDialog(false);
												setShowEditDialog(true);
											}}
										>
											Asignar Conductor
										</Button>
									)}
								</div>
							</div>
						</div>
					)}
				</DialogContent>
			</Dialog>

			{/* Modal de Edición */}
			<Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
				<DialogContent className="sm:max-w-5xl md:max-w-5xl lg:max-w-5xl max-h-[85vh] overflow-y-auto">
					<DialogHeader>
						<div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
							<div>
								<DialogTitle>Editar Reserva #{selectedReserva?.id}</DialogTitle>
								<DialogDescription>
									Actualiza el estado, pago y detalles de la reserva
								</DialogDescription>
							</div>
							{selectedReserva && (
								<div className="flex flex-wrap gap-2">
									<Button
										variant="outline"
										size="sm"
										onClick={() =>
											reenviarCorreoConfirmacion(selectedReserva.id)
										}
									>
										<Mail className="w-4 h-4 mr-2" />
										Reenviar Email
									</Button>
									{selectedReserva.tramoHijoId && (
										<Button
											variant="outline"
											size="sm"
											onClick={() =>
												verReservaVinculada(selectedReserva.tramoHijoId)
											}
										>
											Ver Tramo Vuelta →
										</Button>
									)}
									{/* Botón para corregir saldos residuales en tramos ida/vuelta */}
									{(selectedReserva?.tramoHijoId ||
										selectedReserva?.tramoPadreId) && (
										<Button
											variant="outline"
											size="sm"
											disabled={loadingSincronizarTramos}
											onClick={handleSincronizarTramos}
											title="Recalcula saldoPendiente y estadoPago de cada tramo según su pagoMonto actual"
										>
											<RefreshCw
												className={`w-4 h-4 mr-2 ${loadingSincronizarTramos ? "animate-spin" : ""}`}
											/>
											{loadingSincronizarTramos
												? "Sincronizando..."
												: "Sincronizar saldos"}
										</Button>
									)}
									<Button
										variant="outline"
										size="sm"
										onClick={() => copiarInfoWhatsApp(selectedReserva)}
									>
										<Copy className="w-4 h-4 mr-2" />
										WhatsApp
									</Button>
								</div>
							)}
						</div>
					</DialogHeader>

					{selectedReserva && (
						<div className="space-y-4">
							{/* Información del Cliente (EDITABLE) */}
							<div className="bg-muted p-4 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="space-y-1">
									<Label className="text-muted-foreground">
										Nombre del Cliente
									</Label>
									<Input
										value={formData.nombre || ""}
										onChange={(e) =>
											setFormData({ ...formData, nombre: e.target.value })
										}
										placeholder="Nombre completo"
									/>
								</div>
								<div className="space-y-1">
									<Label className="text-muted-foreground">Email</Label>
									<Input
										type="email"
										value={formData.email || ""}
										onChange={(e) =>
											setFormData({ ...formData, email: e.target.value })
										}
										placeholder="correo@ejemplo.com"
									/>
								</div>
								<div className="space-y-1">
									<Label className="text-muted-foreground">Teléfono</Label>
									<Input
										value={formData.telefono || ""}
										onChange={(e) =>
											setFormData({ ...formData, telefono: e.target.value })
										}
										placeholder="+56 9 ..."
									/>
								</div>
								<div className="space-y-1 flex items-end">
									{selectedReserva?.clienteId && (
										<Badge
											variant="outline"
											className="h-10 px-4 gap-2 bg-white"
										>
											<User className="w-4 h-4 text-chocolate-600" />
											ID Cliente: {selectedReserva.clienteId}
										</Badge>
									)}
								</div>
							</div>

							{/* Alertas inteligentes */}
							{(() => {
								// Parsear fecha de la reserva una sola vez para las alertas
								const fechaReserva = selectedReserva.fecha
									? new Date(
											selectedReserva.fecha +
												(selectedReserva.fecha.length === 10
													? "T00:00:00"
													: ""),
										)
									: null;
								const hoy = new Date();
								const dosDias = new Date(hoy);
								dosDias.setDate(dosDias.getDate() + 2);

								const esPasada = fechaReserva && fechaReserva < hoy;
								const esProxima =
									fechaReserva && fechaReserva < dosDias && fechaReserva > hoy;
								const noCompletada =
									selectedReserva.estado !== "completada" &&
									selectedReserva.estado !== "cancelada";
								const pagoPendiente =
									selectedReserva.estadoPago === "pendiente" ||
									selectedReserva.saldoPendiente > 0;

								return (
									<div className="space-y-2">
										{/* Reserva pasada sin completar */}
										{esPasada && noCompletada && (
											<Alert className="bg-yellow-50 border-yellow-200">
												<AlertCircle className="h-4 w-4 text-yellow-600" />
												<AlertTitle className="text-yellow-800">
													Reserva Vencida
												</AlertTitle>
												<AlertDescription className="text-yellow-700">
													Esta reserva pasó de fecha (
													{formatDate(selectedReserva.fecha)}) y no está marcada
													como completada.{" "}
													<Button
														variant="link"
														size="sm"
														className="text-yellow-800 underline p-0 h-auto"
														onClick={handleMarcarCompletadaYScroll}
													>
														Marcar como completada
													</Button>
												</AlertDescription>
											</Alert>
										)}

										{/* Pago pendiente próximo a la fecha */}
										{esProxima && pagoPendiente && (
											<Alert
												variant="destructive"
												className="bg-red-50 border-red-200"
											>
												<AlertCircle className="h-4 w-4 text-red-600" />
												<AlertTitle className="text-red-800">
													Urgente: Pago Pendiente
												</AlertTitle>
												<AlertDescription className="text-red-700">
													La reserva es en menos de 48 horas (
													{formatDate(selectedReserva.fecha)}) y tiene un saldo
													pendiente de{" "}
													{formatCurrency(selectedReserva.saldoPendiente)}.
												</AlertDescription>
											</Alert>
										)}

										{/* Falta dirección específica */}
										{!selectedReserva.direccionOrigen &&
											!selectedReserva.direccionDestino && (
												<Alert className="bg-blue-50 border-blue-200">
													<MapPin className="h-4 w-4 text-blue-600" />
													<AlertTitle className="text-blue-800">
														Dirección Incompleta
													</AlertTitle>
													<AlertDescription className="text-blue-700">
														Falta la dirección específica de recogida o entrega.
														Esto puede causar problemas al conductor.
													</AlertDescription>
												</Alert>
											)}

										{/* Reserva confirmada sin vehículo asignado */}
										{selectedReserva.estado === "confirmada" &&
											!isAsignada(selectedReserva) && (
												<Alert className="bg-orange-50 border-orange-200">
													<Car className="h-4 w-4 text-orange-600" />
													<AlertTitle className="text-orange-800">
														Sin Vehículo Asignado
													</AlertTitle>
													<AlertDescription className="text-orange-700">
														Esta reserva está confirmada pero no tiene vehículo
														ni conductor asignado.{" "}
														<Button
															variant="link"
															size="sm"
															className="text-orange-800 underline p-0 h-auto"
															onClick={() => {
																setShowEditDialog(false);
																handleAsignar(selectedReserva);
															}}
														>
															Asignar ahora
														</Button>
													</AlertDescription>
												</Alert>
											)}
									</div>
								);
							})()}

							{/* Datos generales de la reserva (fecha, hora, pasajeros, vehículo) */}
							<div className="bg-muted p-4 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="space-y-1">
									<Label>Fecha</Label>
									<Input
										type="date"
										value={formData.fecha || ""}
										onChange={(e) =>
											setFormData({ ...formData, fecha: e.target.value })
										}
									/>
								</div>
								<div className="space-y-1">
									<Label>Hora</Label>
									<Input
										type="time"
										value={formData.hora || ""}
										onChange={(e) =>
											setFormData({ ...formData, hora: e.target.value })
										}
									/>
								</div>
								<div className="space-y-1">
									<Label>Pasajeros</Label>
									<Input
										type="number"
										min="1"
										value={formData.pasajeros || ""}
										onChange={(e) =>
											setFormData({ ...formData, pasajeros: e.target.value })
										}
									/>
								</div>
								<div className="space-y-1">
									<Label>Vehículo</Label>
									<Select
										value={formData.vehiculo || "auto"}
										onValueChange={(value) =>
											setFormData({ ...formData, vehiculo: value })
										}
									>
										<SelectTrigger className="bg-white">
											<SelectValue placeholder="Seleccionar..." />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="auto">Sedán</SelectItem>
											<SelectItem value="van">Van</SelectItem>
											<SelectItem value="suv">SUV</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>

							{/* Detalles del Trayecto */}
							<div className="bg-muted p-4 rounded-lg space-y-4">
								<h3 className="font-semibold border-b pb-2">
									Detalles del Trayecto
								</h3>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="space-y-1">
										<Label>Origen General</Label>
										<Select
											value={formData.origen || ""}
											onValueChange={(value) =>
												setFormData({ ...formData, origen: value })
											}
										>
											<SelectTrigger className="bg-white">
												<SelectValue placeholder="Seleccionar origen" />
											</SelectTrigger>
											<SelectContent>
												{destinosCatalog.map((destino, index) => (
													<SelectItem key={`orig-${index}`} value={destino}>
														{destino}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
									<div className="space-y-1">
										<Label>Destino General</Label>
										<Select
											value={formData.destino || ""}
											onValueChange={(value) =>
												setFormData({ ...formData, destino: value })
											}
										>
											<SelectTrigger className="bg-white">
												<SelectValue placeholder="Seleccionar destino" />
											</SelectTrigger>
											<SelectContent>
												{destinosCatalog.map((destino, index) => (
													<SelectItem key={`dest-${index}`} value={destino}>
														{destino}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
									<>
										<div className="space-y-4 md:col-span-2">
											<div className="space-y-1">
												<Label className="flex items-center gap-2">
													<MapPin className="h-4 w-4" />
													Dirección Específica (Ubicación Google) *
												</Label>
												<AddressAutocomplete
													id="hotel-edit"
													name="hotel"
													value={
														formData.direccionOrigen ||
														formData.direccionDestino ||
														""
													}
													placeholder="Busca la dirección exacta en Google Maps..."
													onChange={(e) => {
														const newVal = e.target.value;
														const isFromAirport =
															formData.origen === "Aeropuerto La Araucanía";
														const isToAirport =
															formData.destino === "Aeropuerto La Araucanía";

														setFormData({
															...formData,
															// Sincronizar dirección específica según el sentido del viaje
															direccionDestino: isFromAirport
																? newVal
																: formData.direccionDestino,
															direccionOrigen: isToAirport
																? newVal
																: formData.direccionOrigen,
														});
													}}
													className="bg-white"
												/>
											</div>
											<div className="space-y-1">
												<Label>Referencia / Hotel (Opcional)</Label>
												<Input
													value={formData.hotel || ""}
													placeholder="Ej: Hotel Antumalal, Depto 201"
													onChange={(e) =>
														setFormData({ ...formData, hotel: e.target.value })
													}
													className="bg-white"
												/>
											</div>
										</div>
									</>
								</div>

								{/* SOLUCIÓN: Campos para editar viaje de vuelta cuando existe */}
								{formData.idaVuelta && (
									<div className="pt-4 border-t mt-4">
										<h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
											<svg
												className="w-5 h-5"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M7 16l-4-4m0 0l4-4m-4 4h18"
												/>
											</svg>
											Viaje de Vuelta
											{formData.tramoVueltaId && (
												<Badge variant="outline" className="text-xs">
													Reserva #{formData.tramoVueltaId}
												</Badge>
											)}
										</h4>
										<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
											<div className="space-y-1">
												<Label>Fecha de Regreso *</Label>
												<Input
													type="date"
													value={formData.fechaRegreso || ""}
													onChange={(e) =>
														setFormData({
															...formData,
															fechaRegreso: e.target.value,
														})
													}
													required
												/>
											</div>
											<div className="space-y-1">
												<Label>Hora de Recogida *</Label>
												<Input
													type="time"
													value={formData.horaRegreso || ""}
													onChange={(e) =>
														setFormData({
															...formData,
															horaRegreso: e.target.value,
														})
													}
													required
												/>
											</div>
										</div>
										{(!formData.fechaRegreso || !formData.horaRegreso) && (
											<div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
												<svg
													className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
												>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth={2}
														d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
													/>
												</svg>
												<div>
													<p className="text-sm font-semibold text-yellow-800">
														Información Requerida
													</p>
													<p className="text-xs text-yellow-700 mt-1">
														Es necesario completar la fecha y hora del regreso
														para coordinar el servicio.
													</p>
												</div>
											</div>
										)}
									</div>
								)}

								{/* Opción de notificar al conductor si hubo cambios importantes y ya tiene conductor */}
								{hasConductorAsignado && (
									<div className="pt-2 border-t mt-2">
										<div className="flex items-center gap-2">
											<Checkbox
												id="enviarActualizacionConductor"
												checked={enviarActualizacionConductor}
												onCheckedChange={setEnviarActualizacionConductor}
											/>
											<label
												htmlFor="enviarActualizacionConductor"
												className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
											>
												Notificar actualización al conductor (Reenviar correo
												con nueva dirección)
											</label>
										</div>
									</div>
								)}
							</div>

							{/* Estado */}
							<div id="seccion-estado-reserva" className="space-y-2 p-1">
								<Label htmlFor="estado">Estado de la Reserva</Label>
								<Select
									value={formData.estado}
									onValueChange={(value) =>
										setFormData({ ...formData, estado: value })
									}
								>
									<SelectTrigger id="estado">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem
											value="pendiente"
											disabled={(selectedReserva?.pagoMonto || 0) > 0}
										>
											Pendiente
										</SelectItem>
										<SelectItem value="pendiente_detalles">
											Pendiente Detalles
										</SelectItem>
										<SelectItem value="confirmada">Confirmada</SelectItem>
										<SelectItem value="cancelada">Cancelada</SelectItem>
										<SelectItem value="completada">Completada</SelectItem>
									</SelectContent>
								</Select>
							</div>

							{/* Estado de Pago */}
							<div className="space-y-2">
								<Label htmlFor="estadoPago">Estado de Pago</Label>
								<Select
									value={formData.estadoPago}
									onValueChange={(value) =>
										setFormData((prev) => {
											let nextEstado = prev.estado;
											if (value === "reembolsado") {
												nextEstado = "cancelada";
											} else if (value === "fallido") {
												nextEstado =
													prev.estado === "pendiente_detalles"
														? "pendiente_detalles"
														: "pendiente";
											} else if (value === "pendiente") {
												if (
													["confirmada", "completada", "cancelada"].includes(
														prev.estado,
													)
												) {
													nextEstado = "pendiente";
												}
											}
											return {
												...prev,
												estadoPago: value,
												estado: nextEstado,
											};
										})
									}
								>
									<SelectTrigger id="estadoPago">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="pendiente">Pendiente</SelectItem>
										<SelectItem value="pagado">Pagado</SelectItem>
										<SelectItem value="fallido">Fallido</SelectItem>
										<SelectItem value="reembolsado">Reembolsado</SelectItem>
									</SelectContent>
								</Select>
							</div>

							{/* Sección de Gestión de Pagos Manuales (Colapsable) */}
							<div className="space-y-4 border rounded-lg p-4 bg-slate-50/50">
								<div className="flex items-center justify-between">
									<h3 className="font-semibold text-chocolate-800 flex items-center gap-2">
										<DollarSign className="w-5 h-5" />
										Gestión de Pagos Manuales / Ajustes
									</h3>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => setShowAdjustments(!showAdjustments)}
										className="text-chocolate-600 hover:text-chocolate-700 hover:bg-chocolate-50"
									>
										{showAdjustments ? "Cerrar" : "Abrir"}
									</Button>
								</div>

								{showAdjustments && (
									<div className="space-y-4 pt-2 border-t mt-2 animate-in fade-in slide-in-from-top-2 duration-200">
										{/* Método de Pago */}
										<div className="space-y-2">
											<Label htmlFor="metodoPago">Método de Pago</Label>
											<Select
												value={formData.metodoPago}
												onValueChange={(value) =>
													setFormData({ ...formData, metodoPago: value })
												}
											>
												<SelectTrigger id="metodoPago">
													<SelectValue placeholder="Seleccionar método" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="flow">Flow</SelectItem>
													<SelectItem value="transferencia">
														Transferencia
													</SelectItem>
													<SelectItem value="efectivo">Efectivo</SelectItem>
													<SelectItem value="otro">Otro</SelectItem>
												</SelectContent>
											</Select>
										</div>

										{/* Referencia de Pago */}
										<div className="space-y-2">
											<Label htmlFor="referenciaPago">
												Referencia de Pago (opcional)
											</Label>
											<Input
												id="referenciaPago"
												placeholder="ID de transacción, número de transferencia, etc."
												value={formData.referenciaPago}
												onChange={(e) =>
													setFormData({
														...formData,
														referenciaPago: e.target.value,
													})
												}
											/>
										</div>

										{/* Tipo de pago registrado */}
										<div className="space-y-2">
											<Label htmlFor="tipoPago">Tipo de Pago Registrado</Label>
											{(() => {
												const montoPagadoNum =
													parseFloat(formData.montoPagado || 0) || 0;
												const totalReservaNum =
													parseFloat(
														selectedReserva?.totalConDescuento ||
															selectedReserva?.precio ||
															0,
													) || 0;
												const abonoSugeridoNum =
													parseFloat(selectedReserva?.abonoSugerido || 0) || 0;
												const umbralAbono = Math.max(
													totalReservaNum * 0.4,
													abonoSugeridoNum || 0,
												);
												const yaAbono40 =
													Boolean(selectedReserva?.abonoPagado) ||
													montoPagadoNum >= umbralAbono;
												return (
													<Select
														value={formData.tipoPago}
														onValueChange={(value) =>
															setFormData((prev) => {
																const totalReservaNum =
																	parseFloat(
																		selectedReserva?.totalConDescuento ||
																			selectedReserva?.precio ||
																			0,
																	) || 0;
																const abonoSugeridoNum =
																	parseFloat(
																		selectedReserva?.abonoSugerido || 0,
																	) || 0;
																const pagoPrevioNum =
																	parseFloat(montoPagadoVisual || 0) ||
																	0;
																const umbralAbono = Math.max(
																	totalReservaNum * 0.4,
																	abonoSugeridoNum || 0,
																);

																let computedMonto = null;
																if (value === "saldo" || value === "total") {
																	const restante = Math.max(
																		totalReservaNum - pagoPrevioNum,
																		0,
																	);
																	computedMonto =
																		restante > 0 ? restante : null;
																} else if (value === "abono") {
																	const necesario = Math.max(
																		umbralAbono - pagoPrevioNum,
																		0,
																	);
																	computedMonto =
																		necesario > 0 ? necesario : null;
																}

																return {
																	...prev,
																	tipoPago: value,
																	montoPagado:
																		computedMonto !== null
																			? computedMonto
																			: prev.montoPagado,
																};
															})
														}
													>
														<SelectTrigger id="tipoPago">
															<SelectValue placeholder="Selecciona el tipo de pago" />
														</SelectTrigger>
														<SelectContent>
															{yaAbono40 ? (
																<SelectItem value="saldo">
																	Completar pago
																</SelectItem>
															) : (
																<>
																	<SelectItem value="abono">
																		Abono 40%
																	</SelectItem>
																	<SelectItem value="total">
																		Abono total
																	</SelectItem>
																</>
															)}
														</SelectContent>
													</Select>
												);
											})()}
										</div>

										{/* Monto del pago */}
										<div className="space-y-2">
											<div className="flex justify-between items-center flex-wrap gap-1">
												<Label htmlFor="montoPagado">
													Monto a registrar (CLP)
												</Label>
												<div className="flex gap-1">
													{/* Botón para recuperar el pago real desde el gateway (Flow/MP) */}
													<Button
														type="button"
														variant="ghost"
														size="sm"
														className="h-7 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-1"
														disabled={loadingRecuperarPago}
														title="Consulta el estado real del pago en Flow o MercadoPago y recupera el monto confirmado"
														onClick={handleRecuperarPagoGateway}
													>
														<RefreshCw
															className={`w-3 h-3 ${loadingRecuperarPago ? "animate-spin" : ""}`}
														/>
														{loadingRecuperarPago
															? "Consultando..."
															: "Recuperar pago original"}
													</Button>
													{(montoPagadoVisual || 0) > 0 && (
														<Button
															type="button"
															variant="ghost"
															size="sm"
															className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 gap-1"
															onClick={() => {
																if (
																	confirm(
																		"¿Estás seguro de que deseas resetear los pagos de esta reserva? Esto volverá el monto a $0 y el estado a pendiente.",
																	)
																) {
																	setFormData({
																		...formData,
																		montoPagado: "0",
																		estadoPago: "pendiente",
																		estado: "pendiente",
																	});
																}
															}}
														>
															<RefreshCw className="w-3 h-3" />
															Resetear Pago (Volver a $0)
														</Button>
													)}
												</div>
											</div>
											<Input
												id="montoPagado"
												type="number"
												step="1"
												min="0"
												placeholder="Monto que deseas sumar"
												value={
													formData.montoPagado !== undefined &&
													formData.montoPagado !== null
														? formData.montoPagado
														: ""
												}
												onChange={(e) =>
													setFormData({
														...formData,
														montoPagado: e.target.value,
													})
												}
											/>
											<div className="text-xs text-muted-foreground mt-1 bg-amber-50 p-2 rounded border border-amber-100 italic">
												<p>
													<strong>Aviso:</strong> El monto ingresado se{" "}
													<strong>sumará</strong> al total ya registrado de{" "}
													<span className="font-semibold text-amber-700">
															{montoPagadoVisual
															? new Intl.NumberFormat("es-CL", {
																	style: "currency",
																	currency: "CLP",
																  }).format(montoPagadoVisual)
															: "$0"}
													</span>
													.
												</p>
											</div>
										</div>
									</div>
								)}
							</div>

							{/* Historial de pagos mejorado */}
							<div className="space-y-4 border rounded-lg p-4 bg-slate-50">
								<div className="flex justify-between items-center">
									<div>
										<Label className="text-base font-semibold">
											Historial de Pagos
										</Label>
										<p className="text-sm text-muted-foreground">
											Total registrado:{" "}
											<span className="font-medium">
												{(() => {
													const totalManual = (pagoHistorial || []).reduce(
														(sum, p) => sum + (Number(p?.amount || 0) || 0),
														0,
													);
													const usaFlowDeducido =
														montoFlowUnico > 0 &&
														(selectedReserva?.pagoGateway === "flow" ||
															selectedReserva?.metodoPago === "flow");
													const totalAutomatico = usaFlowDeducido
														? montoFlowUnico
														: 0;
													const totalVisual =
														totalManual +
														(totalAutomatico > 0
															? totalAutomatico
															: Number(montoPagadoVisual || 0) || 0);
													return formatCurrency(totalVisual);
												})()}
											</span>
										</p>
									</div>
									<Button
										type="button"
										onClick={() => {
											// Pre-rellenar con el saldo pendiente de la reserva
											const saldo = Math.max(
												(parseFloat(selectedReserva?.totalConDescuento || 0) ||
													0) -
													(parseFloat(montoPagadoVisual || 0) || 0),
												0,
											);
											if (saldo > 0) setRegPagoMonto(String(Math.round(saldo)));
											setShowRegisterPayment(true);
										}}
										className="gap-2"
									>
										<Plus className="w-4 h-4" />
										Registrar Pago
									</Button>
								</div>
								<div className="bg-white border rounded-lg p-3 max-h-64 overflow-y-auto">
									{(() => {
										// Combinar pagos del historial con el pago principal de Flow si no está en el historial
										const allPagos = [...(pagoHistorial || [])];
										const montoFlowVisual =
											montoFlowUnico > 0
												? montoFlowUnico
												: Number(montoPagadoVisual || 0) || 0;

										// Si la reserva tiene un pago de Flow pero no aparece en el historial detallado, agregarlo virtualmente
										const hasFlowInHistory = allPagos.some(
											(p) =>
												p.metodo?.toLowerCase() === "flow" ||
												p.source === "web",
										);
										if (
											!hasFlowInHistory &&
											montoFlowVisual > 0 &&
											(selectedReserva.pagoGateway === "flow" ||
												selectedReserva.metodoPago === "flow")
										) {
											allPagos.push({
												id: "virtual-flow",
												amount: montoFlowVisual,
												metodo: "Flow",
												referencia:
													selectedReserva.referenciaPago ||
													selectedReserva.pagoId,
												source: "web",
												isVirtual: true,
												createdAt:
													selectedReserva.pagoFecha ||
													selectedReserva.createdAt,
											});
										}

										if (allPagos.length > 0) {
											return (
												<div className="space-y-1">
													{allPagos
														.sort(
															(a, b) =>
																new Date(b.createdAt) - new Date(a.createdAt),
														)
														.map((p) => (
															<div
																key={p.id}
																className="flex justify-between items-center py-2 border-b last:border-0 hover:bg-slate-50 rounded px-2"
															>
																<div className="flex-1">
																	<div className="flex items-center gap-2">
																		<Badge
																			variant={
																				p.source === "web"
																					? "default"
																					: "secondary"
																			}
																			className="text-[10px] h-4 px-1"
																		>
																			{p.source === "web"
																				? "Automático"
																				: "Manual"}
																		</Badge>
																		<span className="font-semibold text-slate-800">
																			{formatCurrency(p.amount)}
																		</span>
																		<span className="text-[10px] text-muted-foreground bg-slate-100 px-1 rounded uppercase">
																			{p.metodo || "Sin método"}
																		</span>
																	</div>
																	<div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
																		<Calendar className="w-3 h-3" />
																		{new Date(p.createdAt).toLocaleString(
																			"es-CL",
																			{
																				day: "2-digit",
																				month: "2-digit",
																				year: "2-digit",
																				hour: "2-digit",
																				minute: "2-digit",
																			},
																		)}
																		{p.referencia && ` • Ref: ${p.referencia}`}
																	</div>
																</div>
																{!p.isVirtual && (
																	<div className="flex items-center gap-1 ml-2">
																		<Button
																			type="button"
																			variant="ghost"
																			size="icon"
																			className="h-7 w-7 text-slate-400 hover:text-indigo-600"
																			onClick={() => handleEditPago(p)}
																			title="Editar monto"
																		>
																			<Edit className="w-3.5 h-3.5" />
																		</Button>
																		<Button
																			type="button"
																			variant="ghost"
																			size="icon"
																			className="h-7 w-7 text-slate-400 hover:text-red-600"
																			onClick={() => handleDeletePago(p.id)}
																			title="Eliminar pago"
																		>
																			<Trash2 className="w-3.5 h-3.5" />
																		</Button>
																	</div>
																)}
															</div>
														))}
												</div>
											);
										}

										return (
											<div className="text-center py-6 text-muted-foreground">
												<DollarSign className="w-8 h-8 mx-auto mb-2 opacity-50" />
												<p className="text-sm">No hay pagos registrados</p>
												<Button
													variant="link"
													size="sm"
													onClick={() => {
														// Pre-rellenar con el total de la reserva (primer pago)
														const saldo = Math.max(
															(parseFloat(
																selectedReserva?.totalConDescuento || 0,
															) || 0) -
																(parseFloat(selectedReserva?.pagoMonto || 0) ||
																	0),
															0,
														);
														if (saldo > 0)
															setRegPagoMonto(String(Math.round(saldo)));
														setShowRegisterPayment(true);
													}}
													className="mt-2"
												>
													Registrar el primer pago
												</Button>
											</div>
										);
									})()}
								</div>
							</div>

							{/* Observaciones */}
							<div className="space-y-2">
								<div className="flex items-center justify-between">
									<Label htmlFor="observaciones">Observaciones Internas</Label>
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={() =>
											setFormData({ ...formData, observaciones: "" })
										}
										disabled={
											!formData.observaciones ||
											formData.observaciones.length === 0
										}
									>
										Borrar todo
									</Button>
								</div>
								<Textarea
									id="observaciones"
									placeholder="Notas internas sobre la reserva..."
									value={formData.observaciones}
									onChange={(e) =>
										setFormData({ ...formData, observaciones: e.target.value })
									}
									rows={4}
								/>
							</div>

							{/* Resumen Financiero Contextualizado */}
							<div className="bg-chocolate-50 p-4 rounded-lg border border-chocolate-200">
								<div className="flex items-center justify-between mb-3 pb-2 border-b border-chocolate-200/50">
									<h4 className="font-bold text-chocolate-900 flex items-center gap-2">
										<DollarSign className="w-4 h-4 text-chocolate-600" />
										Resumen Financiero
									</h4>
									<Badge
										variant="outline"
										className="text-[10px] uppercase font-bold text-chocolate-700 border-chocolate-200"
									>
										{selectedReserva.source?.toLowerCase().includes("express")
											? "Módulo Express"
											: selectedReserva.source === "codigo_pago"
												? "Pago con Código"
												: "Manual / Web"}
									</Badge>
								</div>

								<div className="space-y-2 text-sm">
									{/* BLOQUE 1: Desglose por HeroExpress */}
									{selectedReserva.source
										?.toLowerCase()
										.includes("express") && (
										<div className="space-y-1 pb-2 border-b border-chocolate-200/30">
											<div className="flex justify-between text-chocolate-700">
												<span className="text-xs">
													Precio Base ({selectedReserva.pasajeros} pax):
												</span>
												<span>{formatCurrency(selectedReserva.precio)}</span>
											</div>

											{/* Descuentos Individuales (no basados en el consolidado online) */}
											{Number(selectedReserva.descuentoBase || 0) > 0 && (
												<div className="flex justify-between text-green-700 text-xs italic">
													<span>Descuento Reserva Online:</span>
													<span>
														-{formatCurrency(selectedReserva.descuentoBase)}
													</span>
												</div>
											)}
											{Number(selectedReserva.descuentoPromocion || 0) > 0 && (
												<div className="flex justify-between text-green-700 text-xs italic">
													<span>Promoción Aplicada:</span>
													<span>
														-
														{formatCurrency(selectedReserva.descuentoPromocion)}
													</span>
												</div>
											)}
											{Number(selectedReserva.descuentoRoundTrip || 0) > 0 && (
												<div className="flex justify-between text-green-700 text-xs italic">
													<span>Descuento de Ida y Vuelta:</span>
													<span>
														-
														{formatCurrency(selectedReserva.descuentoRoundTrip)}
													</span>
												</div>
											)}
											{Number(selectedReserva.descuentosPersonalizados || 0) >
												0 && (
												<div className="flex justify-between text-green-700 text-xs italic">
													<span>Descuento Personalizado:</span>
													<span>
														-
														{formatCurrency(
															selectedReserva.descuentosPersonalizados,
														)}
													</span>
												</div>
											)}
											{selectedReserva.codigoDescuento && (
												<div className="flex justify-between text-indigo-700 text-xs font-semibold py-0.5 border-t border-chocolate-100/30 mt-1">
													<span>Cupón aplicado:</span>
													<span>{selectedReserva.codigoDescuento}</span>
												</div>
											)}
										</div>
									)}

									{/* BLOQUE 2: Detalles de Pago con Código */}
									{selectedReserva.source === "codigo_pago" && (
										<div className="space-y-1 pb-2 border-b border-chocolate-200/30">
											<div className="flex justify-between text-chocolate-700">
												<span className="text-xs">
													Código de Reserva usado:
												</span>
												<span className="font-mono font-bold text-indigo-700">
													{selectedReserva.referenciaPago}
												</span>
											</div>
											{selectedReserva.pagoFecha && (
												<div className="flex justify-between text-chocolate-700">
													<span className="text-xs">Fecha del Pago:</span>
													<span className="text-[11px]">
														{new Date(selectedReserva.pagoFecha).toLocaleString(
															"es-CL",
														)}
													</span>
												</div>
											)}
											{selectedReserva.pagoGateway && (
												<div className="flex justify-between text-chocolate-700">
													<span className="text-xs">Pasarela:</span>
													<span className="capitalize">
														{selectedReserva.pagoGateway}
													</span>
												</div>
											)}
										</div>
									)}

									{/* BLOQUE 3: Totales Finales (Común para todos) */}
									<div className="space-y-1.5 pt-1">
										<div className="flex justify-between items-center">
											<span className="font-medium text-chocolate-800">
												Total Final Cobrado:
											</span>
											<span className="text-base font-bold text-chocolate-950">
												{formatCurrency(selectedReserva.totalConDescuento)}
											</span>
										</div>

										<div className="flex justify-between items-center py-1 bg-white/40 px-2 rounded -mx-1 border border-chocolate-100/50">
											<span className="font-semibold text-chocolate-900">
												Saldo Pendiente:
											</span>
											<span
												className={`text-base font-black ${
													selectedReserva.saldoPendiente > 0
														? "text-red-600"
														: "text-green-600"
												}`}
											>
												{formatCurrency(selectedReserva.saldoPendiente)}
											</span>
										</div>

										<div className="grid grid-cols-2 gap-2 mt-2">
											<div className="flex flex-col gap-1">
												<span className="text-[10px] text-chocolate-600 font-bold uppercase tracking-wider">
													Estado Abono
												</span>
												<Badge
													variant={
														selectedReserva.abonoPagado
															? "default"
															: "secondary"
													}
													className="w-fit text-[10px] py-0 h-5"
												>
													{selectedReserva.abonoPagado ? "Pagado" : "Pendiente"}
												</Badge>
											</div>
											<div className="flex flex-col gap-1">
												<span className="text-[10px] text-chocolate-600 font-bold uppercase tracking-wider">
													Estado Saldo
												</span>
												<Badge
													variant={
														selectedReserva.saldoPagado
															? "default"
															: "secondary"
													}
													className="w-fit text-[10px] py-0 h-5"
												>
													{selectedReserva.saldoPagado ? "Pagado" : "Pendiente"}
												</Badge>
											</div>
										</div>
									</div>
								</div>
							</div>

							{/* Botones */}
							<div className="flex justify-end gap-2 pt-4">
								<Button
									variant="outline"
									onClick={() => setShowEditDialog(false)}
									disabled={saving}
								>
									Cancelar
								</Button>
								<Button
									id="boton-guardar-cambios"
									onClick={handleSave}
									disabled={saving}
								>
									{saving ? (
										<>
											<RefreshCw className="w-4 h-4 mr-2 animate-spin" />
											Guardando...
										</>
									) : (
										"Guardar Cambios"
									)}
								</Button>
							</div>
						</div>
					)}
				</DialogContent>
			</Dialog>

			{/* Modal de Nueva Reserva */}
			<Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
				<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Nueva Reserva Manual</DialogTitle>
						<DialogDescription>
							Crea una nueva reserva ingresando manualmente los datos del
							cliente y del viaje
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-6">
						{/* Información del Cliente */}
						<div className="space-y-4">
							<h3 className="font-semibold text-lg border-b pb-2">
								Información del Cliente
							</h3>

							{/* Indicador de cliente existente */}
							{clienteSeleccionado && (
								<div className="bg-chocolate-50 border border-chocolate-200 text-chocolate-700 px-4 py-3 rounded-md">
									<p className="font-medium">
										âœ“ Cliente existente seleccionado
									</p>
									<p className="text-sm">
										{clienteSeleccionado.esCliente && (
											<Badge variant="default" className="mr-2">
												Cliente
											</Badge>
										)}
										{clienteSeleccionado.clasificacion &&
											clienteSeleccionado.clasificacion !==
												"Cliente Activo" && (
												<Badge variant="outline" className="mr-2">
													{clienteSeleccionado.clasificacion}
												</Badge>
											)}
										{clienteSeleccionado.totalReservas > 0 && (
											<span className="text-xs">
												{clienteSeleccionado.totalReservas} reserva(s) previa(s)
											</span>
										)}
									</p>
								</div>
							)}

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="space-y-2 relative">
									<Label htmlFor="new-nombre">
										Nombre Completo <span className="text-red-500">*</span>
									</Label>
									<Input
										id="new-nombre"
										placeholder="Juan Pérez (escribe para buscar)"
										value={newReservaForm.nombre}
										onChange={(e) => {
											setNewReservaForm({
												...newReservaForm,
												nombre: e.target.value,
											});
											buscarClientes(e.target.value);
										}}
										onBlur={() =>
											setTimeout(() => setMostrandoSugerencias(false), 200)
										}
										onFocus={() => {
											if (
												newReservaForm.nombre.trim().length > 0 &&
												clienteSugerencias.length > 0
											) {
												setMostrandoSugerencias(true);
											}
										}}
									/>
									{/* Sugerencias de autocompletado */}
									{mostrandoSugerencias && clienteSugerencias.length > 0 && (
										<div className="absolute z-50 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto mt-1">
											{clienteSugerencias.map((cliente) => (
												<div
													key={cliente.id}
													className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
													onClick={() => seleccionarCliente(cliente)}
												>
													<div className="font-medium">{cliente.nombre}</div>
													<div className="text-sm text-gray-600">
														{cliente.email} - {cliente.telefono}
														{cliente.rut && ` - RUT: ${cliente.rut}`}
													</div>
													{cliente.esCliente && (
														<Badge variant="default" className="text-xs mt-1">
															Cliente - {cliente.totalReservas} reservas
														</Badge>
													)}
												</div>
											))}
										</div>
									)}
								</div>
								<div className="space-y-2">
									<Label htmlFor="new-rut">RUT (opcional)</Label>
									<Input
										id="new-rut"
										placeholder="12345678-9"
										value={newReservaForm.rut}
										onChange={(e) => {
											setNewReservaForm({
												...newReservaForm,
												rut: e.target.value,
											});
											buscarClientes(e.target.value);
										}}
										onBlur={() =>
											setTimeout(() => setMostrandoSugerencias(false), 200)
										}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="new-email">
										Email <span className="text-red-500">*</span>
									</Label>
									<Input
										id="new-email"
										type="email"
										placeholder="juan@example.com"
										value={newReservaForm.email}
										onChange={(e) =>
											setNewReservaForm({
												...newReservaForm,
												email: e.target.value,
											})
										}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="new-telefono">
										Teléfono <span className="text-red-500">*</span>
									</Label>
									<Input
										id="new-telefono"
										placeholder="+56912345678"
										value={newReservaForm.telefono}
										onChange={(e) =>
											setNewReservaForm({
												...newReservaForm,
												telefono: e.target.value,
											})
										}
									/>
								</div>
							</div>
						</div>

						{/* Detalles del Viaje */}
						<div className="space-y-4">
							<h3 className="font-semibold text-lg border-b pb-2">
								Detalles del Viaje
							</h3>
							{/* Selector de sentido del viaje */}
							<div className="space-y-3">
								<Label>Sentido del Viaje</Label>
								<div className="flex flex-wrap gap-4">
									<label className="inline-flex items-center gap-2 cursor-pointer text-sm">
										<input
											type="radio"
											name="sentido-viaje"
											value="hacia_aeropuerto"
											checked={sentidoViaje === "hacia_aeropuerto"}
											onChange={() => {
												setSentidoViaje("hacia_aeropuerto");
												setNewReservaForm({
													...newReservaForm,
													origen: "",
													destino: AEROPUERTO_LABEL,
												});
											}}
										/>
										Hacia Aeropuerto
									</label>
									<label className="inline-flex items-center gap-2 cursor-pointer text-sm">
										<input
											type="radio"
											name="sentido-viaje"
											value="desde_aeropuerto"
											checked={sentidoViaje === "desde_aeropuerto"}
											onChange={() => {
												setSentidoViaje("desde_aeropuerto");
												setNewReservaForm({
													...newReservaForm,
													origen: AEROPUERTO_LABEL,
													destino: "",
												});
											}}
										/>
										Desde Aeropuerto
									</label>
									<label className="inline-flex items-center gap-2 cursor-pointer text-sm">
										<input
											type="radio"
											name="sentido-viaje"
											value="otro"
											checked={sentidoViaje === "otro"}
											onChange={() => {
												setSentidoViaje("otro");
												setNewReservaForm({
													...newReservaForm,
													origen: "",
													destino: "",
												});
											}}
										/>
										Interurbano / Otro
									</label>
								</div>
							</div>

							{/* Origen y Destino */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="new-origen">
										Origen <span className="text-red-500">*</span>
									</Label>
									{sentidoViaje === "desde_aeropuerto" ? (
										<Input
											id="new-origen"
											value={AEROPUERTO_LABEL}
											disabled
											className="bg-muted text-muted-foreground"
										/>
									) : (
										<select
											id="new-origen"
											className="border rounded-md h-10 px-3 w-full"
											value={newReservaForm.origen}
											onChange={(e) =>
												setNewReservaForm({
													...newReservaForm,
													origen: e.target.value,
												})
											}
										>
											<option value="">Seleccionar origen</option>
											{destinosOptions
												.filter((n) => n !== AEROPUERTO_LABEL)
												.map((n) => (
													<option key={n} value={n}>
														{n}
													</option>
												))}
										</select>
									)}
								</div>
								<div className="space-y-2">
									<Label htmlFor="new-destino">
										Destino <span className="text-red-500">*</span>
									</Label>
									{sentidoViaje === "hacia_aeropuerto" ? (
										<Input
											id="new-destino"
											value={AEROPUERTO_LABEL}
											disabled
											className="bg-muted text-muted-foreground"
										/>
									) : (
										<select
											id="new-destino"
											className="border rounded-md h-10 px-3 w-full"
											value={newReservaForm.destino}
											onChange={(e) =>
												setNewReservaForm({
													...newReservaForm,
													destino: e.target.value,
												})
											}
										>
											<option value="">Seleccionar destino</option>
											{destinosOptions
												.filter((n) => n !== AEROPUERTO_LABEL)
												.map((n) => (
													<option key={n} value={n}>
														{n}
													</option>
												))}
										</select>
									)}
								</div>
								<div className="space-y-2">
									<Label htmlFor="new-fecha">
										Fecha <span className="text-red-500">*</span>
									</Label>
									<Input
										id="new-fecha"
										type="date"
										value={newReservaForm.fecha}
										onChange={(e) =>
											setNewReservaForm({
												...newReservaForm,
												fecha: e.target.value,
											})
										}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="new-hora">Hora</Label>
									<select
										id="new-hora"
										className="border rounded-md h-10 px-3 w-full"
										value={newReservaForm.hora}
										onChange={(e) =>
											setNewReservaForm({
												...newReservaForm,
												hora: e.target.value,
											})
										}
									>
										<option value="">Seleccionar...</option>
										{TIME_OPTIONS.map((h) => (
											<option key={h} value={h}>
												{h}
											</option>
										))}
									</select>
								</div>
								<div className="space-y-2">
									<Label htmlFor="new-pasajeros">Pasajeros</Label>
									<Input
										id="new-pasajeros"
										type="number"
										min="1"
										value={newReservaForm.pasajeros}
										onChange={(e) =>
											setNewReservaForm({
												...newReservaForm,
												pasajeros: parseInt(e.target.value) || 1,
											})
										}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="new-vehiculo">Vehículo</Label>
									<Select
										value={newReservaForm.vehiculo}
										onValueChange={(value) =>
											setNewReservaForm({ ...newReservaForm, vehiculo: value })
										}
									>
										<SelectTrigger id="new-vehiculo">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="sedan">Sedán</SelectItem>
											<SelectItem value="van">Van</SelectItem>
											<SelectItem value="suv">SUV</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>

							{/* Ida y Vuelta */}
							<div className="flex items-center space-x-2">
								<input
									type="checkbox"
									id="new-idavuelta"
									checked={newReservaForm.idaVuelta}
									onChange={(e) =>
										setNewReservaForm({
											...newReservaForm,
											idaVuelta: e.target.checked,
										})
									}
									className="w-4 h-4"
								/>
								<Label htmlFor="new-idavuelta">Incluir viaje de regreso</Label>
							</div>

							{newReservaForm.idaVuelta && (
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
									<div className="space-y-2">
										<Label htmlFor="new-fecharegreso">Fecha Regreso</Label>
										<Input
											id="new-fecharegreso"
											type="date"
											value={newReservaForm.fechaRegreso}
											onChange={(e) =>
												setNewReservaForm({
													...newReservaForm,
													fechaRegreso: e.target.value,
												})
											}
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="new-horaregreso">Hora Regreso</Label>
										<select
											id="new-horaregreso"
											className="border rounded-md h-10 px-3 w-full"
											value={newReservaForm.horaRegreso}
											onChange={(e) =>
												setNewReservaForm({
													...newReservaForm,
													horaRegreso: e.target.value,
												})
											}
										>
											<option value="">Seleccionar...</option>
											{TIME_OPTIONS.map((h) => (
												<option key={`regreso-${h}`} value={h}>
													{h}
												</option>
											))}
										</select>
									</div>
								</div>
							)}
						</div>

						{/* Información Adicional */}
						<div className="space-y-4">
							<h3 className="font-semibold text-lg border-b pb-2">
								Información Adicional (Opcional)
							</h3>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="new-vuelo">Número de Vuelo</Label>
									<Input
										id="new-vuelo"
										placeholder="LA123"
										value={newReservaForm.numeroVuelo}
										onChange={(e) =>
											setNewReservaForm({
												...newReservaForm,
												numeroVuelo: e.target.value,
											})
										}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="new-hotel">Hotel</Label>
									<Input
										id="new-hotel"
										placeholder="Hotel Gran Pucón"
										value={newReservaForm.hotel}
										onChange={(e) =>
											setNewReservaForm({
												...newReservaForm,
												hotel: e.target.value,
											})
										}
									/>
								</div>
								<div className="space-y-2 md:col-span-2">
									<Label htmlFor="new-equipaje">Equipaje Especial</Label>
									<Input
										id="new-equipaje"
										placeholder="Esquíes, bicicletas, etc."
										value={newReservaForm.equipajeEspecial}
										onChange={(e) =>
											setNewReservaForm({
												...newReservaForm,
												equipajeEspecial: e.target.value,
											})
										}
									/>
								</div>
								<div className="flex items-center space-x-2">
									<input
										type="checkbox"
										id="new-silla"
										checked={newReservaForm.sillaInfantil}
										onChange={(e) =>
											setNewReservaForm({
												...newReservaForm,
												sillaInfantil: e.target.checked,
											})
										}
										className="w-4 h-4"
									/>
									<Label htmlFor="new-silla">Requiere silla infantil</Label>
								</div>
							</div>
						</div>

						{/* Información Financiera */}
						<div className="space-y-4">
							<h3 className="font-semibold text-lg border-b pb-2">
								Información Financiera
							</h3>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="new-precio">Precio Total (CLP)</Label>
									<Input
										id="new-precio"
										type="number"
										min="0"
										placeholder="50000"
										value={newReservaForm.precio}
										onChange={(e) =>
											setNewReservaForm({
												...newReservaForm,
												precio: parseFloat(e.target.value) || 0,
												totalConDescuento: parseFloat(e.target.value) || 0,
											})
										}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="new-abono">Abono Sugerido (CLP)</Label>
									<Input
										id="new-abono"
										type="number"
										min="0"
										placeholder="25000"
										value={newReservaForm.abonoSugerido}
										onChange={(e) =>
											setNewReservaForm({
												...newReservaForm,
												abonoSugerido: parseFloat(e.target.value) || 0,
											})
										}
									/>
								</div>
							</div>
							<div className="bg-chocolate-50 p-4 rounded-lg border border-chocolate-200">
								<p className="text-sm">
									<strong>Saldo Pendiente:</strong>{" "}
									{formatCurrency(
										(parseFloat(newReservaForm.precio) || 0) -
											(parseFloat(newReservaForm.abonoSugerido) || 0),
									)}
								</p>
							</div>
						</div>

						{/* Sección de Pago Inicial */}
						<div className="space-y-4">
							<h3 className="font-semibold text-lg border-b pb-2">
								Pago Inicial (Opcional)
							</h3>
							<p className="text-sm text-muted-foreground">
								Si el cliente ya realizó un pago, regístralo aquí para que quede
								en el historial
							</p>

							{/* Checkbox para activar registro de pago */}
							<div className="flex items-center space-x-2">
								<Checkbox
									id="registrar-pago-inicial"
									checked={newReservaForm.registrarPagoInicial}
									onCheckedChange={(checked) =>
										setNewReservaForm({
											...newReservaForm,
											registrarPagoInicial: checked,
										})
									}
								/>
								<Label htmlFor="registrar-pago-inicial">
									Registrar pago inicial
								</Label>
							</div>

							{/* Campos de pago (solo si checkbox está marcado) */}
							{newReservaForm.registrarPagoInicial && (
								<div className="space-y-4 pl-6 border-l-2 border-chocolate-200">
									{/* Monto */}
									<div className="space-y-2">
										<Label htmlFor="new-pago-monto">Monto del Pago (CLP)</Label>
										<Input
											id="new-pago-monto"
											type="number"
											min="0"
											step="100"
											placeholder="Ej: 30000"
											value={newReservaForm.pagoMonto || ""}
											onChange={(e) =>
												setNewReservaForm({
													...newReservaForm,
													pagoMonto: e.target.value,
												})
											}
										/>
									</div>

									{/* Método de pago */}
									<div className="space-y-2">
										<Label htmlFor="new-pago-metodo">Método de Pago</Label>
										<Select
											value={newReservaForm.pagoMetodo || "efectivo"}
											onValueChange={(value) =>
												setNewReservaForm({
													...newReservaForm,
													pagoMetodo: value,
												})
											}
										>
											<SelectTrigger id="new-pago-metodo">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="efectivo">Efectivo</SelectItem>
												<SelectItem value="transferencia">
													Transferencia
												</SelectItem>
												<SelectItem value="flow">Flow</SelectItem>
												<SelectItem value="otro">Otro</SelectItem>
											</SelectContent>
										</Select>
									</div>

									{/* Referencia */}
									<div className="space-y-2">
										<Label htmlFor="new-pago-referencia">
											Referencia/Comprobante (Opcional)
										</Label>
										<Input
											id="new-pago-referencia"
											type="text"
											placeholder="Ej: N° de transferencia, boleta, etc."
											value={newReservaForm.pagoReferencia || ""}
											onChange={(e) =>
												setNewReservaForm({
													...newReservaForm,
													pagoReferencia: e.target.value,
												})
											}
										/>
									</div>
								</div>
							)}
						</div>

						{/* Estado y Pago */}
						<div className="space-y-4">
							<h3 className="font-semibold text-lg border-b pb-2">
								Estado y Pago
							</h3>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="new-estado">Estado de la Reserva</Label>
									<Select
										value={newReservaForm.estado}
										onValueChange={(value) =>
											setNewReservaForm({ ...newReservaForm, estado: value })
										}
									>
										<SelectTrigger id="new-estado">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="pendiente">Pendiente</SelectItem>
											<SelectItem value="confirmada">Confirmada</SelectItem>
											<SelectItem value="completada">Completada</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-2">
									<Label htmlFor="new-estadopago">Estado de Pago</Label>
									<Select
										value={newReservaForm.estadoPago}
										onValueChange={(value) =>
											setNewReservaForm({
												...newReservaForm,
												estadoPago: value,
											})
										}
									>
										<SelectTrigger id="new-estadopago">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="pendiente">Pendiente</SelectItem>
											<SelectItem value="parcial">
												Pagado Parcialmente
											</SelectItem>
											<SelectItem value="pagado">Pagado Completo</SelectItem>
										</SelectContent>
									</Select>
									<p className="text-xs text-muted-foreground">
										Si registras un pago inicial arriba, selecciona "Pagado
										Parcialmente" o "Pagado Completo"
									</p>
								</div>
							</div>
						</div>

						{/* Notificaciones */}
						<div className="space-y-2">
							<h3 className="font-semibold text-lg border-b pb-2">
								Notificaciones
							</h3>
							<div className="flex items-center space-x-2">
								<input
									type="checkbox"
									id="new-enviarcorreo"
									checked={Boolean(newReservaForm.enviarCorreo)}
									onChange={(e) =>
										setNewReservaForm({
											...newReservaForm,
											enviarCorreo: e.target.checked,
										})
									}
									className="w-4 h-4"
								/>
								<Label htmlFor="new-enviarcorreo">
									Enviar correo de confirmación al cliente
								</Label>
							</div>
							<p className="text-xs text-muted-foreground">
								Desmarca esta opción si no deseas notificar por email en este
								momento.
							</p>
						</div>

						{/* Observaciones */}
						<div className="space-y-4">
							<h3 className="font-semibold text-lg border-b pb-2">
								Observaciones Internas
							</h3>
							<Textarea
								placeholder="Notas adicionales sobre esta reserva..."
								value={newReservaForm.observaciones}
								onChange={(e) =>
									setNewReservaForm({
										...newReservaForm,
										observaciones: e.target.value,
									})
								}
								rows={3}
							/>
						</div>

						{/* Botones */}
						<div className="flex justify-end gap-2 pt-4 border-t">
							<Button
								variant="outline"
								onClick={() => setShowNewDialog(false)}
								disabled={saving}
							>
								Cancelar
							</Button>
							<Button onClick={handleSaveNewReserva} disabled={saving}>
								{saving ? (
									<>
										<RefreshCw className="w-4 h-4 mr-2 animate-spin" />
										Guardando...
									</>
								) : (
									<>
										<Plus className="w-4 h-4 mr-2" />
										Crear Reserva
									</>
								)}
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			{/* Modal de Historial de Cliente */}
			<Dialog open={showHistorialDialog} onOpenChange={setShowHistorialDialog}>
				<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>
							Historial del Cliente
							{historialCliente && ` - ${historialCliente.cliente.nombre}`}
						</DialogTitle>
						<DialogDescription>
							Todas las reservas y estadísticas del cliente
						</DialogDescription>
					</DialogHeader>

					{historialCliente && (
						<div className="space-y-6">
							{/* Información del Cliente */}
							<div className="bg-muted p-4 rounded-lg">
								<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
									<div>
										<Label className="text-muted-foreground">Email</Label>
										<p
											className="font-medium truncate max-w-[180px]"
											title={historialCliente.cliente.email}
											style={{
												overflow: "hidden",
												textOverflow: "ellipsis",
												whiteSpace: "nowrap",
												maxWidth: "180px",
											}}
										>
											{historialCliente.cliente.email}
										</p>
									</div>
									<div>
										<Label className="text-muted-foreground">Teléfono</Label>
										<p className="font-medium">
											{historialCliente.cliente.telefono}
										</p>
									</div>
									{historialCliente.cliente.rut && (
										<div>
											<Label className="text-muted-foreground">RUT</Label>
											<p className="font-medium">
												{historialCliente.cliente.rut}
											</p>
										</div>
									)}
									<div>
										<Label className="text-muted-foreground">Tipo</Label>
										<div>
											{historialCliente.cliente.esCliente ? (
												<Badge variant="default">
													<Star className="w-3 h-3 mr-1" />
													Cliente
												</Badge>
											) : (
												<Badge variant="secondary">Cotizador</Badge>
											)}
										</div>
									</div>
									{historialCliente.cliente.clasificacion &&
										historialCliente.cliente.clasificacion !==
											"Cliente Activo" && (
											<div>
												<Label className="text-muted-foreground">
													Clasificación
												</Label>
												<div>
													<Badge variant="outline">
														{historialCliente.cliente.clasificacion}
													</Badge>
												</div>
											</div>
										)}
								</div>
							</div>

							{/* Estadísticas */}
							<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
								<Card>
									<CardContent className="p-4">
										<p className="text-sm text-muted-foreground">
											Total Reservas
										</p>
										<p className="text-2xl font-bold">
											{historialCliente.estadisticas.totalReservas}
										</p>
									</CardContent>
								</Card>
								<Card>
									<CardContent className="p-4">
										<p className="text-sm text-muted-foreground">
											Reservas Pagadas
										</p>
										<p className="text-2xl font-bold text-green-600">
											{historialCliente.estadisticas.totalPagadas}
										</p>
									</CardContent>
								</Card>
								<Card>
									<CardContent className="p-4">
										<p className="text-sm text-muted-foreground">
											Reservas Pendientes
										</p>
										<p className="text-2xl font-bold text-orange-600">
											{historialCliente.estadisticas.totalPendientes}
										</p>
									</CardContent>
								</Card>
								<Card>
									<CardContent className="p-4">
										<p className="text-sm text-muted-foreground">
											Total Gastado
										</p>
										<p className="text-2xl font-bold text-chocolate-600">
											{formatCurrency(
												historialCliente.estadisticas.totalGastado,
											)}
										</p>
									</CardContent>
								</Card>
							</div>

							{/* Lista de Reservas */}
							<div>
								<h3 className="font-semibold text-lg mb-3">
									Historial de Reservas ({">"}{" "}
									{historialCliente.reservas.length})
								</h3>
								<div className="space-y-2 max-h-96 overflow-y-auto">
									{historialCliente.reservas.map((reserva) => (
										<div
											key={reserva.id}
											className="border rounded-lg p-3 hover:bg-muted/50 cursor-pointer"
											onClick={() => {
												setShowHistorialDialog(false);
												handleViewDetails(reserva);
											}}
										>
											<div className="flex items-start justify-between">
												<div className="flex-1">
													<div className="flex items-center gap-2 mb-1">
														<span className="font-medium">#{reserva.id}</span>
														{getEstadoBadge(reserva.estado)}
														{getEstadoPagoBadge(reserva)}
													</div>
													<div className="text-sm text-muted-foreground">
														<div className="flex items-center gap-2">
															<MapPin className="w-3 h-3" />
															{reserva.origen} {"->"} {reserva.destino}
														</div>
														<div className="flex items-center gap-2 mt-1">
															<Calendar className="w-3 h-3" />
															{formatDate(reserva.fecha)} -{" "}
															{reserva.hora || "-"}
														</div>
													</div>
												</div>
												<div className="text-right">
													<p className="font-semibold">
														{formatCurrency(reserva.totalConDescuento)}
													</p>
													{reserva.saldoPendiente > 0 && (
														<p className="text-sm text-red-600">
															Saldo: {formatCurrency(reserva.saldoPendiente)}
														</p>
													)}
												</div>
											</div>
										</div>
									))}
								</div>
							</div>
						</div>
					)}
				</DialogContent>
			</Dialog>

			{/* Dialog de confirmaciÃ³n para eliminar masivamente */}
			<AlertDialog
				open={showBulkDeleteDialog}
				onOpenChange={setShowBulkDeleteDialog}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							Â¿Eliminar reservas seleccionadas?
						</AlertDialogTitle>
						<AlertDialogDescription>
							Esta acción eliminará permanentemente {selectedReservas.length}{" "}
							reserva(s). Esta acción no se puede deshacer.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={processingBulk}>
							Cancelar
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleBulkDelete}
							disabled={processingBulk}
							className="bg-red-600 hover:bg-red-700"
						>
							{processingBulk ? (
								<>
									<RefreshCw className="w-4 h-4 mr-2 animate-spin" />
									Eliminando...
								</>
							) : (
								"Eliminar"
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Dialog para cambio masivo de estado */}
			<AlertDialog
				open={showBulkStatusDialog}
				onOpenChange={setShowBulkStatusDialog}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							Cambiar estado de reservas seleccionadas
						</AlertDialogTitle>
						<AlertDialogDescription>
							Selecciona el nuevo estado para {selectedReservas.length}{" "}
							reserva(s):
						</AlertDialogDescription>
					</AlertDialogHeader>
					<div className="py-4">
						<Select value={bulkEstado} onValueChange={setBulkEstado}>
							<SelectTrigger>
								<SelectValue placeholder="Selecciona un estado" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="pendiente">Pendiente</SelectItem>
								<SelectItem value="pendiente_detalles">
									Pendiente Detalles
								</SelectItem>
								<SelectItem value="confirmada">Confirmada</SelectItem>
								<SelectItem value="cancelada">Cancelada</SelectItem>
								<SelectItem value="completada">Completada</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={processingBulk}>
							Cancelar
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleBulkChangeStatus}
							disabled={processingBulk || !bulkEstado}
						>
							{processingBulk ? (
								<>
									<RefreshCw className="w-4 h-4 mr-2 animate-spin" />
									Actualizando...
								</>
							) : (
								"Actualizar Estado"
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Dialog para asignar vehÃ­culo y conductor */}
			<Dialog open={showAsignarDialog} onOpenChange={setShowAsignarDialog}>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle>
							Asignar Vehículo y Conductor - Reserva #{selectedReserva?.id}
						</DialogTitle>
						<DialogDescription>
							Asigna un vehículo y opcionalmente un conductor a esta reserva
							pagada
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-4">
						{/* InformaciÃ³n de la reserva */}
						<div className="bg-muted p-3 rounded-lg space-y-1 text-sm">
							<p>
								<strong>Cliente:</strong> {selectedReserva?.nombre}
							</p>
							<div className="flex items-center justify-between gap-3">
								<p className="m-0">
									<strong>Ruta:</strong> {selectedReserva?.origen} {"->"}{" "}
									{selectedReserva?.destino}
								</p>
								<Button
									variant="outline"
									size="sm"
									onClick={() => {
										setShowAsignarDialog(false);
										handleEdit(selectedReserva);
									}}
								>
									Editar ruta
								</Button>
							</div>
							<p>
								<strong>Fecha:</strong>{" "}
								{selectedReserva?.fecha
									? new Date(selectedReserva.fecha).toLocaleDateString("es-CL")
									: ""}
							</p>
							<p>
								<strong>Pasajeros:</strong> {selectedReserva?.pasajeros}
							</p>
						</div>

						{/* Alerta de viaje de IDA y VUELTA */}
						{reservaVuelta && (
							<div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
								<div className="flex items-center gap-2 mb-2">
									<AlertCircle className="h-4 w-4 text-blue-600" />
									<span className="font-medium text-blue-900">
										Este viaje tiene IDA y VUELTA
									</span>
								</div>
								<p className="text-sm text-blue-700 mb-3">
									Vuelta: {reservaVuelta.origen} → {reservaVuelta.destino} el{" "}
									{reservaVuelta.fecha
										? new Date(reservaVuelta.fecha).toLocaleDateString("es-CL")
										: ""}
								</p>
								<div className="flex items-center gap-2">
									<Checkbox
										id="asignar-ambas"
										checked={asignarAmbas}
										onCheckedChange={(checked) =>
											setAsignarAmbas(Boolean(checked))
										}
									/>
									<label
										htmlFor="asignar-ambas"
										className="text-sm cursor-pointer text-blue-900"
									>
										Asignar el mismo conductor y vehículo para ambos tramos
									</label>
								</div>
							</div>
						)}

						{/* Sección IDA */}
						<div className="space-y-4">
							{reservaVuelta && (
								<div className="font-medium flex items-center gap-2">
									<Badge
										variant="outline"
										className="bg-green-50 text-green-700 border-green-200"
									>
										IDA
									</Badge>
									{selectedReserva?.origen} → {selectedReserva?.destino}
								</div>
							)}

							{/* Selector de vehículo */}
							<div className="space-y-2">
								<Label htmlFor="vehiculo">
									Vehículo <span className="text-red-500">*</span>
								</Label>
								<Select
									value={vehiculoSeleccionado}
									onValueChange={setVehiculoSeleccionado}
								>
									<SelectTrigger id="vehiculo">
										<SelectValue placeholder="Selecciona un vehículo" />
									</SelectTrigger>
									<SelectContent>
										{vehiculos
											.filter(
												(v) => v.capacidad >= (selectedReserva?.pasajeros || 1),
											)
											.map((v) => (
												<SelectItem
													key={v.id}
													value={v.id.toString()}
													disabled={
														assignedVehiculoId !== null &&
														assignedVehiculoId === v.id
													}
												>
													{v.patente} - {v.tipo} ({v.marca} {v.modelo}) -{" "}
													{v.capacidad} pasajeros
												</SelectItem>
											))}
									</SelectContent>
								</Select>
							</div>

							{/* Selector de conductor (opcional) */}
							<div className="space-y-2">
								<Label htmlFor="conductor">Conductor (opcional)</Label>
								<Select
									value={conductorSeleccionado}
									onValueChange={setConductorSeleccionado}
								>
									<SelectTrigger id="conductor">
										<SelectValue placeholder="Selecciona un conductor (opcional)" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="none">Sin asignar</SelectItem>
										{conductores.map((c) => (
											<SelectItem
												key={c.id}
												value={c.id.toString()}
												disabled={
													assignedConductorId !== null &&
													assignedConductorId === c.id
												}
											>
												{c.nombre} - {c.rut}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>

						{/* Sección VUELTA (solo si existe y NO está marcado "asignar ambas") */}
						{reservaVuelta && !asignarAmbas && (
							<div className="space-y-4 pt-4 border-t">
								<div className="font-medium flex items-center gap-2">
									<Badge
										variant="outline"
										className="bg-blue-50 text-blue-700 border-blue-200"
									>
										VUELTA
									</Badge>
									{reservaVuelta.origen} → {reservaVuelta.destino}
								</div>

								{/* Selector de vehículo VUELTA */}
								<div className="space-y-2">
									<Label htmlFor="vehiculo-vuelta">
										Vehículo <span className="text-red-500">*</span>
									</Label>
									<Select
										value={vueltaVehiculoSeleccionado}
										onValueChange={setVueltaVehiculoSeleccionado}
									>
										<SelectTrigger id="vehiculo-vuelta">
											<SelectValue placeholder="Selecciona un vehículo" />
										</SelectTrigger>
										<SelectContent>
											{vehiculos
												.filter(
													(v) =>
														v.capacidad >=
														(reservaVuelta?.pasajeros ||
															selectedReserva?.pasajeros ||
															1),
												)
												.map((v) => (
													<SelectItem key={v.id} value={v.id.toString()}>
														{v.patente} - {v.tipo} ({v.marca} {v.modelo}) -{" "}
														{v.capacidad} pasajeros
													</SelectItem>
												))}
										</SelectContent>
									</Select>
								</div>

								{/* Selector de conductor VUELTA (opcional) */}
								<div className="space-y-2">
									<Label htmlFor="conductor-vuelta">Conductor (opcional)</Label>
									<Select
										value={vueltaConductorSeleccionado}
										onValueChange={setVueltaConductorSeleccionado}
									>
										<SelectTrigger id="conductor-vuelta">
											<SelectValue placeholder="Selecciona un conductor (opcional)" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="none">Sin asignar</SelectItem>
											{conductores.map((c) => (
												<SelectItem key={c.id} value={c.id.toString()}>
													{c.nombre} - {c.rut}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							</div>
						)}

						{/* Sin ediciÃ³n de ruta en reasignaciÃ³n */}

						{/* Enviar notificación */}
						<div className="flex items-center gap-2 pt-2">
							<Checkbox
								id="enviar-notificacion"
								checked={enviarNotificacion}
								onCheckedChange={(v) => setEnviarNotificacion(Boolean(v))}
							/>
							<label
								htmlFor="enviar-notificacion"
								className="text-sm text-muted-foreground cursor-pointer"
							>
								Enviar notificación por correo al cliente
							</label>
						</div>

						{/* Enviar notificación al conductor */}
						<div className="flex items-center gap-2">
							<Checkbox
								id="enviar-notificacion-conductor"
								checked={enviarNotificacionConductor}
								onCheckedChange={(v) =>
									setEnviarNotificacionConductor(Boolean(v))
								}
							/>
							<label
								htmlFor="enviar-notificacion-conductor"
								className="text-sm text-muted-foreground cursor-pointer"
							>
								Enviar notificación por correo al conductor
							</label>
						</div>

						{/* Mostrar info de asignación solo si la reserva confirmada ya tiene vehículo */}
						{selectedReserva?.estado === "confirmada" &&
							hasVehiculoAsignado && (
								<div className="bg-chocolate-50 p-3 rounded-lg space-y-2 text-sm">
									<p className="font-semibold">Asignación actual:</p>

									{/* IDA */}
									<div className={reservaVuelta ? "border-b pb-2" : ""}>
										{reservaVuelta && (
											<p className="text-xs font-medium text-green-700 mb-1">
												↗ IDA
											</p>
										)}
										{selectedReserva.vehiculo_asignado ? (
											<p>
												🚗 Vehículo: {selectedReserva.vehiculo_asignado.tipo} (
												{selectedReserva.vehiculo_asignado.patente})
											</p>
										) : selectedReserva?.vehiculo ? (
											<p>🚗 Vehículo: {selectedReserva.vehiculo}</p>
										) : null}
										{hasConductorAsignado ? (
											selectedReserva.conductor_asignado ? (
												<p>
													👤 Conductor:{" "}
													{selectedReserva.conductor_asignado.nombre}
												</p>
											) : selectedReserva?.conductor &&
											  selectedReserva.conductor !== "Por asignar" ? (
												<p>👤 Conductor: {selectedReserva.conductor}</p>
											) : conductorEnObsIda ? (
												<p>👤 Conductor: {conductorEnObsIda}</p>
											) : null
										) : (
											<p className="text-muted-foreground">
												No hay conductor asignado actualmente.
											</p>
										)}
									</div>

									{/* VUELTA (si existe y tiene algo asignado) */}
									{reservaVuelta &&
										(reservaVuelta.vehiculo || reservaVuelta.vehiculoId) && (
											<div className="pt-1">
												<p className="text-xs font-medium text-blue-700 mb-1">
													↩ VUELTA
												</p>
												{reservaVuelta.vehiculo ? (
													<p>🚗 Vehículo: {reservaVuelta.vehiculo}</p>
												) : null}
												{(() => {
													const conductorEnObsVuelta = getConductorFromObs(
														reservaVuelta?.observaciones,
													);
													const nombreConductorVuelta =
														conductores.find(
															(c) => c.id === reservaVuelta?.conductorId,
														)?.nombre ||
														reservaVuelta?.conductor ||
														conductorEnObsVuelta;
													return nombreConductorVuelta ? (
														<p>👤 Conductor: {nombreConductorVuelta}</p>
													) : (
														<p className="text-muted-foreground">
															No hay conductor asignado actualmente.
														</p>
													);
												})()}
											</div>
										)}
								</div>
							)}

						<div className="flex justify-end gap-2">
							<Button
								variant="outline"
								onClick={() => setShowAsignarDialog(false)}
								disabled={loadingAsignacion}
							>
								Cancelar
							</Button>
							{(() => {
								const sameAssignment =
									assignedVehiculoId !== null &&
									vehiculoSeleccionado &&
									Number(vehiculoSeleccionado) === Number(assignedVehiculoId) &&
									String(assignedConductorId ?? "none") ===
										String(conductorSeleccionado || "none");

								// Permitir guardar si faltan los IDs internos aunque visualmente sea igual
								const missingIds =
									!selectedReserva?.vehiculoId ||
									(selectedReserva?.conductor && !selectedReserva?.conductorId);

								return (
									<Button
										onClick={handleGuardarAsignacion}
										disabled={
											loadingAsignacion ||
											!vehiculoSeleccionado ||
											// Permitir si hay ids faltantes O si se quiere notificar (checkboxes activos)
											(sameAssignment &&
												!missingIds &&
												!enviarNotificacion &&
												!enviarNotificacionConductor)
										}
									>
										{loadingAsignacion ? (
											<>
												<RefreshCw className="w-4 h-4 mr-2 animate-spin" />
												Guardando...
											</>
										) : sameAssignment ? (
											"Sin cambios"
										) : (
											"Asignar"
										)}
									</Button>
								);
							})()}
						</div>
					</div>
				</DialogContent>
			</Dialog>
			{/* Dialog para completar reservas vinculadas */}
			<Dialog
				open={showDialogoCompletar}
				onOpenChange={setShowDialogoCompletar}
			>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>Completar Viaje de Ida y Vuelta</DialogTitle>
						<DialogDescription>
							Selecciona cómo deseas completar este servicio vinculado.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-4">
						<div className="p-3 bg-muted rounded-md text-sm whitespace-pre-line">
							{dialogoCompletarOpciones?.mensaje}
						</div>

						<div className="space-y-2">
							<Button
								className="w-full justify-start h-auto py-3 text-left items-start"
								variant="outline"
								onClick={async () => {
									if (
										!confirm(
											"¿Confirmas que deseas completar AMBOS tramos y agregar gastos?",
										)
									)
										return;
									try {
										await completarAmbasReservas([
											dialogoCompletarOpciones.reservaIda.id,
											dialogoCompletarOpciones.reservaVuelta.id,
										]);
										await fetchReservas();
										redirigirAGastos([
											dialogoCompletarOpciones.reservaIda.id,
											dialogoCompletarOpciones.reservaVuelta.id,
										]);
										setShowDialogoCompletar(false);
									} catch (error) {
										alert("Error al completar las reservas");
									}
								}}
							>
								<div className="flex flex-col">
									<span className="font-semibold flex items-center gap-2">
										<CheckCircle2 className="h-4 w-4 text-green-600" />
										Completar ambas juntas
									</span>
									<span className="text-xs text-muted-foreground mt-1">
										Marca IDA y VUELTA como completadas y permite ingresar
										gastos unificados.
									</span>
								</div>
							</Button>

							<Button
								className="w-full justify-start h-auto py-3 text-left items-start"
								variant="outline"
								onClick={async () => {
									if (
										!confirm(
											"¿Confirmas que deseas completar solo la IDA y agregar gastos?",
										)
									)
										return;
									try {
										await completarReserva(
											dialogoCompletarOpciones.reservaIda.id,
										);
										await fetchReservas();
										redirigirAGastos([dialogoCompletarOpciones.reservaIda.id]);
										setShowDialogoCompletar(false);
									} catch (error) {
										alert("Error al completar la reserva de ida");
									}
								}}
							>
								<div className="flex flex-col">
									<span className="font-semibold flex items-center gap-2">
										<div className="w-4 h-4 rounded-full border border-chocolate-600 flex items-center justify-center text-[10px] font-bold text-chocolate-600">
											1
										</div>
										Solo completar IDA
									</span>
									<span className="text-xs text-muted-foreground mt-1">
										Solo marca el tramo de ida como completado.
									</span>
								</div>
							</Button>

							<Button
								className="w-full justify-start h-auto py-3 text-left items-start"
								variant="outline"
								onClick={async () => {
									if (
										!confirm(
											"¿Confirmas que deseas completar solo la VUELTA y agregar gastos?",
										)
									)
										return;
									try {
										await completarReserva(
											dialogoCompletarOpciones.reservaVuelta.id,
										);
										await fetchReservas();
										redirigirAGastos([
											dialogoCompletarOpciones.reservaVuelta.id,
										]);
										setShowDialogoCompletar(false);
									} catch (error) {
										alert("Error al completar la reserva de vuelta");
									}
								}}
							>
								<div className="flex flex-col">
									<span className="font-semibold flex items-center gap-2">
										<div className="w-4 h-4 rounded-full border border-chocolate-600 flex items-center justify-center text-[10px] font-bold text-chocolate-600">
											2
										</div>
										Solo completar VUELTA
									</span>
									<span className="text-xs text-muted-foreground mt-1">
										Solo marca el tramo de vuelta como completado.
									</span>
								</div>
							</Button>
						</div>
					</div>

					<DialogFooter>
						<Button
							variant="ghost"
							onClick={() => setShowDialogoCompletar(false)}
						>
							Cancelar
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

export default AdminReservas;
