import React, { useState, useEffect, useMemo, useCallback } from "react";
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
import {
	Dialog,
	DialogContent,
	DialogDescription,
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
} from "lucide-react";

// Helper para generar texto formateado para conductor (WhatsApp)
const generarTextoConductor = (reserva) => {
	if (!reserva) return "";

	// Formato de fecha y hora local
	const fechaStr = reserva.fecha 
		? new Date(reserva.fecha + "T00:00:00").toLocaleDateString("es-CL") 
		: "Sin fecha";
	
	const horaStr = reserva.hora || "Sin hora";
	
	// Construir dirección de origem y destino con detalles si existen
	let origenStr = reserva.origen || "Sin origen";
	if (reserva.direccionOrigen) origenStr += ` (${reserva.direccionOrigen})`;

	let destinoStr = reserva.destino || "Sin destino";
	if (reserva.direccionDestino) destinoStr += ` (${reserva.direccionDestino})`;

	// Generar link de Google Maps (Prioridad: Dirección Destino > Destino > Origen si es ida)
	// Asumimos que lo más útil para el conductor es navegar al DESTINO si es un viaje de ida, 
	// o al ORIGEN si es una recogida.
	// Por defecto usamos el Destino para el link de Maps.
	const addressForMaps = reserva.direccionDestino || reserva.destino || "";
	const mapsLink = addressForMaps 
		? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressForMaps)}` 
		: "";

	// Calcular saldo por pagar si corresponde
	const saldo = Number(reserva.saldoPendiente) || 0;
	const saldoStr = saldo > 0 
		? `\n💰 *Por pagar:* ${new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(saldo)}` 
		: "";

	// Observaciones
	const obsStr = reserva.observaciones ? `\n📝 *Obs:* ${reserva.observaciones}` : "";

	// info adicional
	const vueloStr = reserva.numeroVuelo ? `\n✈️ *Vuelo:* ${reserva.numeroVuelo}` : "";
	const mapsLine = mapsLink ? `\n🗺 *Maps:* ${mapsLink}` : "";
	
	return `*NUEVO SERVICIO ASIGNADO* 🚖

🗓 *Fecha:* ${fechaStr}
⏰ *Hora:* ${horaStr}
👤 *Pasajero:* ${reserva.nombre || "Sin nombre"}
📍 *Origen:* ${origenStr}
🏁 *Destino:* ${destinoStr}${mapsLine}
👥 *Pax:* ${reserva.pasajeros || 1}${vueloStr}${obsStr}${saldoStr}`;
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

function AdminReservas() {
	// Sistema de autenticación moderno
	const { accessToken } = useAuth();
	const { authenticatedFetch } = useAuthenticatedFetch();
	
	// Detección de dispositivos móviles
	const isMobile = useMediaQuery('(max-width: 767px)');
	const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');

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

	// Estados para asignaciÃ³n de vehÃ­culo/conductor
	const [showAsignarDialog, setShowAsignarDialog] = useState(false);
	const [regPagoMonto, setRegPagoMonto] = useState("");
	const [regPagoMetodo, setRegPagoMetodo] = useState("");
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
				`${apiUrl}/api/reservas/${selectedReserva.id}/pagos`
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

	// Recargar historial de pagos cuando cambie la reserva seleccionada o se cierre el modal de registro
	useEffect(() => {
		if (selectedReserva) {
			fetchPagoHistorial();
		} else {
			setPagoHistorial([]);
		}
	}, [selectedReserva, fetchPagoHistorial]);
	const [vehiculos, setVehiculos] = useState([]);
	const [conductores, setConductores] = useState([]);
	const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState("");
	const [conductorSeleccionado, setConductorSeleccionado] = useState("");
	const [loadingAsignacion, setLoadingAsignacion] = useState(false);
	const [enviarNotificacion, setEnviarNotificacion] = useState(true);
	const [enviarNotificacionConductor, setEnviarNotificacionConductor] = useState(true);
	const [enviarActualizacionConductor, setEnviarActualizacionConductor] = useState(false);
	// Estados para pre-cargar y validar contra asignaciÃ³n actual
	const [assignedPatente, setAssignedPatente] = useState("");
	const [assignedConductorNombre, setAssignedConductorNombre] = useState("");
	const [assignedVehiculoId, setAssignedVehiculoId] = useState(null);
	const [assignedConductorId, setAssignedConductorId] = useState(null);
	const [historialAsignaciones, setHistorialAsignaciones] = useState([]);
	const [loadingHistorial, setLoadingHistorial] = useState(false);

	// Filtros y bÃºsqueda
	const [searchTerm, setSearchTerm] = useState("");
	const [estadoFiltro, setEstadoFiltro] = useState("todos");
	const [estadoPagoFiltro, setEstadoPagoFiltro] = useState("todos");
	const [fechaDesde, setFechaDesde] = useState("");
	const [fechaHasta, setFechaHasta] = useState("");
	// Nuevo selector de rango y filtros inteligentes
	const [rangoFecha, setRangoFecha] = useState("todos"); // 'hoy', 'ayer', 'semana', 'mes', 'personalizado', 'todos'
	const [filtroInteligente, setFiltroInteligente] = useState("todos"); // 'sin_asignacion', 'incompletas', 'archivadas'

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
		} else if (valor === "semana") { // Últimos 7 días
			const hace7 = new Date(hoy);
			hace7.setDate(hoy.getDate() - 7);
			desde = formatDateLocal(hace7);
			hasta = formatDateLocal(hoy);
		} else if (valor === "quincena") { // Últimos 15 días
			const hace15 = new Date(hoy);
			hace15.setDate(hoy.getDate() - 15);
			desde = formatDateLocal(hace15);
			hasta = formatDateLocal(hoy);
		} else if (valor === "mes") { // Mes actual
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

	// CatÃ¡logo de destinos (para selects)
	const [destinosCatalog, setDestinosCatalog] = useState([]);
	const [origenEsOtro, setOrigenEsOtro] = useState(false);
	const [destinoEsOtro, setDestinoEsOtro] = useState(false);
	const [otroOrigen, setOtroOrigen] = useState("");
	const [otroDestino, setOtroDestino] = useState("");

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
					(n) => normalizeDestino(n) === normalizeDestino(AEROPUERTO_LABEL)
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
		[destinosSet]
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
				JSON.stringify(columnasVisibles)
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
					selectedReservas.includes(String(r.id))
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
					alert("Permite las ventanas emergentes para imprimir la planificación");
					return;
				}

				// Agrupar por fecha
				const eventosPorFecha = {};
				eventos.forEach(evt => {
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
					htmlContent += "<p style='text-align:center;'>No hay viajes programados en este período.</p>";
				}

				fechasOrdenadas.forEach(fecha => {
					// Formatear fecha amigable (e.g. Lunes 25 de Diciembre)
					const fechaObj = new Date(fecha + "T00:00:00");
					const fechaTexto = fechaObj.toLocaleDateString("es-CL", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
					
					htmlContent += `<div class="dia-block">
						<div class="dia-header">${fechaTexto.toUpperCase()}</div>
						<table>
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
					
					eventosPorFecha[fecha].forEach(ev => {
						const tipoBadge = ev.tipo === "RETORNO" 
							? `<span class="retorno-badge">RETORNO</span>` 
							: `<span class="ida-badge">IDA</span>`;
						
						const contacto = `
							<b>${ev.cliente}</b><br>
							${ev.telefono || '-'}<br>
							<small>${ev.email || ''}</small>
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
						let vehiculoInfo = '';
						if (ev.vehiculoPatente) {
							vehiculoInfo = ev.vehiculoTipo 
								? `${ev.vehiculoTipo} (${ev.vehiculoPatente})`
								: ev.vehiculoPatente;
						} else if (ev.vehiculo) {
							vehiculoInfo = ev.vehiculo;
						}
						
						// Construir información del conductor
						let conductorInfo = '';
						if (ev.conductorNombre) {
							conductorInfo = `👤 ${ev.conductorNombre}`;
						} else if (ev.conductorId) {
							conductorInfo = '(Conductor asignado)';
						}
						
						asignacion = `
							${vehiculoInfo ? `🚗 ${vehiculoInfo}` : ''}<br>
							${conductorInfo}
						`;
					} else if (ev.vehiculo || ev.conductorId) {
						// Fallback a información genérica si no hay datos específicos
						asignacion = `
							${ev.vehiculo || ''}<br>
							${ev.conductorId ? '(Conductor asignado)' : ''}
						`;
					}
	

						htmlContent += `
							<tr class="reserva-row">
								<td style="font-size:14px; font-weight:bold;">${ev.hora ? ev.hora.substring(0,5) : "--:--"} ${tipoBadge}</td>
								<td style="font-size:11px; color:#666;">${ev.codigoReserva || '-'}</td>
								<td>${contacto}</td>
								<td>${ruta}</td>
								<td>${asignacion}</td>
							</tr>
						`;
					});

					htmlContent += `</tbody></table></div>`;
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
				headers: accessToken
					? { Authorization: `Bearer ${accessToken}` }
					: {},
			});
			if (response.ok) {
				const data = await response.json();
				setEstadisticas(data);
			} else {
				console.warn(
					`Error cargando estadÃ­sticas: ${response.status} ${response.statusText}`
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
			console.error("Error cargando estadÃ­sticas:", error);
			// Establecer estadÃ­sticas por defecto en caso de error
			setEstadisticas({
				totalReservas: 0,
				reservasPendientes: 0,
				reservasConfirmadas: 0,
				reservasPagadas: 0,
				totalIngresos: 0,
			});
		}
	};

	// Cargar vehÃ­culos disponibles
	const fetchVehiculos = async () => {
		try {
			const response = await authenticatedFetch(`/api/vehiculos`);
			if (response.ok) {
				const data = await response.json();
				setVehiculos(data.vehiculos || []);
			}
		} catch (error) {
			console.error("Error cargando vehÃ­culos:", error);
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

	// Abrir diÃ¡logo de asignaciÃ³n
	const handleAsignar = (reserva) => {
		setSelectedReserva(reserva);
		// Derivar patente del label "TIPO PATENTE" o "TIPO (patente PATENTE)"
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
		// Intentar extraer nombre de conductor desde observaciones
		const obs = (reserva.observaciones || "").toString();
		const m = obs.match(/Conductor asignado:\s*([^(|\n]+?)(?:\s*\(|$)/i);
		const nombreCon = m ? m[1].trim() : "";
		setAssignedConductorNombre(nombreCon);
		// Intentar preseleccionar si los catÃ¡logos ya existen
		let preVeh = "";
		if (vehiculos.length > 0 && pat) {
			const found = vehiculos.find(
				(v) => (v.patente || "").toUpperCase() === pat
			);
			if (found) {
				preVeh = found.id.toString();
				setAssignedVehiculoId(found.id);
			}
		}
		let preCon = "none";
		if (conductores.length > 0 && nombreCon) {
			const foundC = conductores.find(
				(c) => (c.nombre || "").toLowerCase() === nombreCon.toLowerCase()
			);
			if (foundC) {
				preCon = foundC.id.toString();
				setAssignedConductorId(foundC.id);
			}
		}
		setVehiculoSeleccionado(preVeh);
		setConductorSeleccionado(preCon);
		setEnviarNotificacion(true);
		setEnviarNotificacionConductor(true);
		setShowAsignarDialog(true);
		// Cargar vehÃ­culos y conductores si aÃºn no se han cargado
		if (vehiculos.length === 0) fetchVehiculos();
		if (conductores.length === 0) fetchConductores();
	};

	// Pre-cargar selecciÃ³n cuando se abren catÃ¡logos
	useEffect(() => {
		if (!showAsignarDialog) return;
		if (!vehiculoSeleccionado && assignedPatente && vehiculos.length > 0) {
			const found = vehiculos.find(
				(v) => (v.patente || "").toUpperCase() === assignedPatente
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
					assignedConductorNombre.toLowerCase()
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

	// Guardar asignaciÃ³n de vehÃ­culo/conductor
	const handleGuardarAsignacion = async () => {
		if (!vehiculoSeleccionado) {
			alert("Debe seleccionar al menos un vehículo");
			return;
		}

		setLoadingAsignacion(true);
		try {
			// Usa el token de autenticación del contexto
			const response = await fetch(
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
				}
			);

			if (response.ok) {
				await fetchReservas(); // Recargar reservas
				setShowAsignarDialog(false);
				alert("Vehículo y conductor asignados correctamente");
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
							}
						);
						if (resp.ok) {
							const data = await resp.json();
							setHistorialAsignaciones(
								Array.isArray(data.historial) ? data.historial : []
							);
						}
					} catch {
						// noop
					}
					setLoadingHistorial(false);
				}
			} else {
				const data = await response.json();
				alert(data.error || "Error al asignar vehículo/conductor");
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
	}, [currentPage, estadoFiltro, fechaDesde, fechaHasta, itemsPerPage, filtroInteligente]);

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
					r.id?.toString().includes(term)
			);
		}

		// Filtro de estado de pago
		if (estadoPagoFiltro !== "todos") {
			filtered = filtered.filter((r) => r.estadoPago === estadoPagoFiltro);
		}

		return filtered;
	}, [reservas, searchTerm, estadoPagoFiltro]);

	// Abrir modal de ediciÃ³n
	const handleEdit = (reserva) => {
		setSelectedReserva(reserva);
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
			metodoPago: reserva.metodoPago || "",
			referenciaPago: reserva.referenciaPago || "",
			tipoPago: reserva.tipoPago || "",
			montoPagado:
				reserva.pagoMonto !== undefined && reserva.pagoMonto !== null
					? String(reserva.pagoMonto)
					: "",
			observaciones: reserva.observaciones || "",
			numeroVuelo: reserva.numeroVuelo || "",
			hotel: reserva.hotel || "",
			equipajeEspecial: reserva.equipajeEspecial || "",
			sillaInfantil: reserva.sillaInfantil || false,
			horaRegreso: reserva.horaRegreso || "",
			idaVuelta: Boolean(reserva.idaVuelta),
			fechaRegreso: (reserva.fechaRegreso || "").toString().substring(0, 10),
			direccionOrigen: reserva.direccionOrigen || "",
			direccionDestino: reserva.direccionDestino || "",
		});
		// Reset ediciÃ³n de ruta
		setEditOrigenEsOtro(false);
		setEditDestinoEsOtro(false);
		setEditOtroOrigen("");
		setEditOtroDestino("");
		setEnviarActualizacionConductor(false);
		// Cargar catÃ¡logo de destinos para selects
		fetchDestinosCatalog();
		setShowEditDialog(true);
	};

	// Abrir modal de detalles
	const handleViewDetails = async (reserva) => {
		// Cargar versión fresca de la reserva desde el backend antes de abrir el modal
		try {
			const response = await authenticatedFetch(
				`/api/reservas/${reserva.id}?t=${Date.now()}`
			);
			if (!response.ok) {
				throw new Error("Error al cargar la reserva");
			}
			const reservaActualizada = await response.json();
			setSelectedReserva(reservaActualizada);
			setShowDetailDialog(true);
		} catch (error) {
			console.error("Error al cargar detalles de la reserva:", error);
			alert(
				"No se pudieron cargar los detalles de la reserva. Inténtalo nuevamente."
			);
			// No abrir el modal si falló la carga para evitar mostrar datos desactualizados
			return;
		}

		// Cargar historial de asignaciones (uso interno) usando token del contexto
		setLoadingHistorial(true);
		try {
			const resp = await authenticatedFetch(
				`/api/reservas/${reserva.id}/asignaciones`
			);
			if (resp.ok) {
				const data = await resp.json();
				setHistorialAsignaciones(
					Array.isArray(data.historial) ? data.historial : []
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
				`/api/reservas/${reserva.id}/transacciones`
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

	// Completar reserva y redirigir a gastos
	const handleCompletar = async (reserva) => {
		if (!confirm(`¿Confirmar que deseas completar la reserva ${reserva.codigoReserva} y agregar gastos?`)) {
			return;
		}

		try {
			const response = await authenticatedFetch(
				`/api/reservas/${reserva.id}/estado`,
				{
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ estado: "completada" }),
				}
			);

			if (!response.ok) {
				throw new Error("Error al completar la reserva");
			}

			// Actualizar la lista de reservas
			await fetchReservas();

			// Redirigir al panel de gastos con el ID de la reserva
			const url = new URL(window.location.href);
			url.searchParams.set("panel", "gastos");
			url.searchParams.set("reservaId", reserva.id.toString());
			window.location.href = url.toString();
		} catch (error) {
			console.error("Error al completar la reserva:", error);
			alert("No se pudo completar la reserva. Inténtalo nuevamente.");
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

			if (editDestinoEsOtro && destinoFinalEdit && !destinoExiste(destinoFinalEdit)) {
				await fetch(`${apiUrl}/api/destinos`, {
					method: "POST",
					headers: { 
						"Content-Type": "application/json", 
						Authorization: `Bearer ${accessToken}` 
					},
					body: JSON.stringify({ 
						nombre: destinoFinalEdit, 
						activo: false, 
						precioIda: 0, 
						precioVuelta: 0, 
						precioIdaVuelta: 0 
					}),
				}).catch(() => {});
			}
			if (editOrigenEsOtro && origenFinalEdit && !destinoExiste(origenFinalEdit)) {
				await fetch(`${apiUrl}/api/destinos`, {
					method: "POST",
					headers: { 
						"Content-Type": "application/json", 
						Authorization: `Bearer ${accessToken}` 
					},
					body: JSON.stringify({ 
						nombre: origenFinalEdit, 
						activo: false, 
						precioIda: 0, 
						precioVuelta: 0, 
						precioIdaVuelta: 0 
					}),
				}).catch(() => {});
			}

			// 2. Preparar lógica de negocio para el payload consolidado
			let estadoFinal = formData.estado || selectedReserva.estado || "pendiente";
			const estadoPagoActual = formData.estadoPago || selectedReserva.estadoPago || "pendiente";
			let estadoPagoSolicitado = estadoFinal === "completada" ? "pagado" : estadoPagoActual;

			let montoPagadoValue = null;
			const montoManual = formData.montoPagado !== undefined && formData.montoPagado !== null 
				? Number(formData.montoPagado) 
				: NaN;
			
			if (!Number.isNaN(montoManual) && montoManual > 0) {
				montoPagadoValue = montoManual;
			}
			
			const tipo = formData.tipoPago;
			const totalReserva = Number(selectedReserva?.totalConDescuento ?? selectedReserva?.total ?? 0) || 0;
			const abonoSugerido = Number(selectedReserva?.abonoSugerido || 0) || 0;
			const pagoPrevio = Number(selectedReserva?.pagoMonto || 0) || 0;
			const umbralAbono = Math.max(totalReserva * 0.4, abonoSugerido || 0);

			if (tipo === "saldo" || tipo === "total") {
				const restante = Math.max(totalReserva - pagoPrevio, 0);
				montoPagadoValue = restante > 0 ? restante : null;
			} else if (tipo === "abono") {
				const necesario = Math.max(umbralAbono - pagoPrevio, 0);
				montoPagadoValue = necesario > 0 ? necesario : null;
				if (estadoFinal === "pendiente" || estadoFinal === "pendiente_detalles") {
					estadoFinal = "confirmada";
				}
				if (estadoPagoSolicitado === "pendiente") {
					estadoPagoSolicitado = "parcial";
				}
			}

			if (estadoFinal === "completada") {
				const restante = Math.max(totalReserva - pagoPrevio, 0);
				if (restante > 0) montoPagadoValue = restante;
			}

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
				ruta: (origenFinalEdit !== selectedReserva.origen || destinoFinalEdit !== selectedReserva.destino) ? {
					origen: origenFinalEdit,
					destino: destinoFinalEdit
				} : null,
				pago: {
					estadoPago: estadoPagoSolicitado,
					metodoPago: formData.metodoPago || selectedReserva.metodoPago || null,
					referenciaPago: formData.referenciaPago || selectedReserva.referenciaPago || null,
					tipoPago: formData.tipoPago || null,
					estadoReserva: estadoFinal,
					montoPagado: montoPagadoValue
				},
				estado: estadoFinal,
				observaciones: formData.observaciones
			};

			// 4. Llamada ÚNICA al endpoint de bulk-update
			const response = await fetch(`${apiUrl}/api/reservas/${selectedReserva.id}/bulk-update`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${accessToken}`,
				},
				body: JSON.stringify(bulkPayload),
			});

			if (!response.ok) {
				const errData = await response.json().catch(() => ({}));
				throw new Error(errData.error || "No se pudo realizar la actualización unificada");
			}

			// 5. Notificación al conductor (se mantiene como llamada separada por su lógica de email)
			if (enviarActualizacionConductor && isAsignada(selectedReserva)) {
				await fetch(`${apiUrl}/api/reservas/${selectedReserva.id}/asignar`, {
					method: "PUT",
					headers: { 
						"Content-Type": "application/json", 
						Authorization: `Bearer ${accessToken}` 
					},
					body: JSON.stringify({
						vehiculoId: selectedReserva.vehiculoId,
						conductorId: selectedReserva.conductorId,
						sendEmail: false,
						sendEmailDriver: true,
					}),
				}).catch(e => console.warn("Error enviando email al conductor:", e));
			}

			await fetchReservas();
			await fetchEstadisticas();
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

		// Mostrar badge con etiqueta y, opcionalmente, info de montos en texto pequeÃ±o
		const montoInfo =
			montoPagado > 0
				? ` (${new Intl.NumberFormat("es-CL", {
						style: "currency",
						currency: "CLP",
				  }).format(montoPagado)})`
				: "";

		return (
			<div className="flex flex-col text-sm">
				<Badge variant={variant}>{label}</Badge>
				{montoInfo ? (
					<span className="text-xs text-muted-foreground mt-1">
						Pagó: {montoInfo}
					</span>
				) : null}
			</div>
		);
	};

	// Helper para detectar si ya fue asignado un vehÃ­culo previamente
	// Consideramos "asignada" si el campo `vehiculo` incluye tipo + patente
	// por ejemplo: "SUV ABCD12"; en cambio valores como "sedan", "Por asignar", "Auto Privado"
	// (sin patente real) indican que aÃºn no se ha asignado uno real.
	const isAsignada = (reserva) => {
		const v = (reserva?.vehiculo || "").trim().toLowerCase();
		if (!v || v === "por asignar" || v === "auto privado") return false;
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
				isAsignada(selectedReserva))
	);

	const hasConductorAsignado = Boolean(
		selectedReserva &&
			(selectedReserva.conductor_asignado ||
				selectedReserva.conductorId ||
				(selectedReserva.conductor &&
					selectedReserva.conductor !== "Por asignar"))
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
			/^(\d{4}-\d{2}-\d{2})T00:00:00(?:\.000)?Z?$/
		);
		if (isoMidnightZ) {
			return new Date(isoMidnightZ[1] + "T00:00:00").toLocaleDateString(
				"es-CL"
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

	// Buscar clientes para autocompletar
	const buscarClientes = async (query) => {
		if (!query || query.length < 2) {
			setClienteSugerencias([]);
			setMostrandoSugerencias(false);
			return;
		}

		try {
			const response = await fetch(
				`${apiUrl}/api/clientes/buscar?query=${encodeURIComponent(query)}`
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
				`${apiUrl}/api/clientes/${clienteId}/historial`
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
				}
			);

			if (response.ok) {
				await fetchReservas();
				alert(
					`Cliente ${
						!esCliente ? "marcado" : "desmarcado"
					} como cliente exitosamente`
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
				"Por favor completa los campos obligatorios: Nombre, Email y Teléfono"
			);
			return;
		}
		const origenFinal = origenEsOtro
			? otroOrigen || newReservaForm.origen
			: newReservaForm.origen;
		const destinoFinal = destinoEsOtro
			? otroDestino || newReservaForm.destino
			: newReservaForm.destino;

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
			const monto = parseFloat(newReservaForm.pagoMonto) || 0;

			if (monto <= 0) {
				alert("⚠️ El monto del pago debe ser mayor a 0");
				return;
			}

			// Validar coherencia con estado de pago
			const total = parseFloat(newReservaForm.precio) || 0;

			// Si marca como "Pagado Completo" pero el monto es menor al total
			if (newReservaForm.estadoPago === "pagado" && monto < total) {
				const confirmar = confirm(
					`El monto pagado ($${monto.toLocaleString()}) es menor al total ($${total.toLocaleString()}).\n\n¿Continuar de todos modos?`
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
					`Has marcado el estado como "Pendiente" pero estás registrando un pago de $${monto.toLocaleString()}.\n\n¿Deseas continuar o prefieres cambiar el estado a "Pagado Parcialmente"?`
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
					}
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
						e.message
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
						`💰 Registrando pago inicial de $${montoPago} para reserva #${reservaId}`
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
						}
					);

					if (!pagoResp.ok) {
						console.warn(
							"⚠️ No se pudo registrar el pago inicial en el historial"
						);
					} else {
						console.log("✅ Pago inicial registrado exitosamente");
					}
				} catch (pagoError) {
					console.error("Error registrando pago inicial:", pagoError);
					// No bloquear la creación de la reserva por un error de pago
				}
			}

			// Recargar datos
			await fetchReservas();
			await fetchEstadisticas();
			setShowNewDialog(false);
			alert("Reserva creada exitosamente");
		} catch (error) {
			console.error("Error creando reserva:", error);
			alert("Error al crear la reserva: " + error.message);
		} finally {
			setSaving(false);
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
		setProcessingBulk(true);
		try {
			const promises = selectedReservas.map((id) =>
				fetch(`${apiUrl}/api/reservas/${id}`, {
					method: "DELETE",
				})
			);

			await Promise.all(promises);

			await fetchReservas();
			await fetchEstadisticas();
			setSelectedReservas([]);
			setShowBulkDeleteDialog(false);
			alert(`${selectedReservas.length} reserva(s) eliminada(s) exitosamente`);
		} catch (error) {
			console.error("Error eliminando reservas:", error);
			alert("Error al eliminar algunas reservas");
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
				})
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
				} esta reserva?`
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
				}
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
							<SelectItem value="archivadas">
								📦 Ver Archivadas
							</SelectItem>
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
						<Dialog open={showCalendarDialog} onOpenChange={setShowCalendarDialog}>
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
										Selecciona el rango de fechas para generar la vista de impresión tipo calendario.
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
										<Button variant="ghost" size="sm" onClick={() => {
											const today = new Date();
											const str = today.toISOString().split('T')[0];
											setCalendarStartDate(str);
											setCalendarEndDate(str);
										}}>Hoy</Button>
										<Button variant="ghost" size="sm" onClick={() => {
											const today = new Date();
											const tomorrow = new Date(today);
											tomorrow.setDate(tomorrow.getDate() + 1);
											setCalendarStartDate(today.toISOString().split('T')[0]);
											setCalendarEndDate(tomorrow.toISOString().split('T')[0]);
										}}>Mañana</Button>
										<Button variant="ghost" size="sm" onClick={() => {
											const today = new Date();
											const nextWeek = new Date(today);
											nextWeek.setDate(nextWeek.getDate() + 7);
											setCalendarStartDate(today.toISOString().split('T')[0]);
											setCalendarEndDate(nextWeek.toISOString().split('T')[0]);
										}}>Próx. 7 días</Button>
									</div>
									<Button onClick={handleGenerarCalendario} disabled={generatingCalendar} className="w-full">
										{generatingCalendar ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Printer className="mr-2 h-4 w-4" />}
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
												JSON.stringify(DEFAULT_COLUMNAS_VISIBLES)
											);
										} catch (e) {
											// Log en espaÃ±ol para facilitar debugging
											console.warn(
												"No se pudo restablecer columnas en localStorage:",
												e
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
												JSON.stringify(columnasVisibles)
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
													}
												);
												if (!resp.ok) throw new Error("Error registrando pago");
												setShowRegisterPayment(false);
												setRegPagoMonto("");
												setRegPagoMetodo("");
												setRegPagoReferencia("");
												// recargar reserva y pagos
												await fetchReservas();
												await fetchPagoHistorial();
											} catch (e) {
												console.error(e);
												alert("Error registrando pago: " + e.message);
											}
										}}
									>
										Registrar
									</Button>
								</div>
							</div>
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
										<TableHead>Fecha/Hora Viaje</TableHead>
									)}
									{columnasVisibles.fechaCreacion && (
										<TableHead>Fecha Creación</TableHead>
									)}
									{columnasVisibles.pasajeros && (
										<TableHead>Pasajeros</TableHead>
									)}
									{columnasVisibles.total && <TableHead>Total</TableHead>}
									{columnasVisibles.estado && <TableHead>Estado</TableHead>}
									{columnasVisibles.pago && <TableHead>Pago</TableHead>}
									{columnasVisibles.saldo && <TableHead>Saldo</TableHead>}
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
														{reserva.tipoTramo ? (
															<div className="mt-1">
																<Badge 
																	variant={reserva.tipoTramo === 'vuelta' ? 'secondary' : 'outline'} 
																	className={`text-[10px] px-1 py-0 h-4 ${reserva.tipoTramo === 'vuelta' ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' : 'bg-green-50 text-green-700 border-green-200'}`}
																>
																	{reserva.tipoTramo === 'vuelta' ? 'RETORNO' : 'IDA'}
																</Badge>
															</div>
														) : reserva.idaVuelta && (
															<div className="mt-1">
																<Badge variant="outline" className="text-[10px] px-1 py-0 h-4 border-purple-200 text-purple-700 bg-purple-50">
																	IDA Y VUELTA
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
																			reserva.esCliente
																		)
																: undefined
														}
													>
														{
															// Nueva lógica: Prioridad a "Cliente con código"
															(reserva?.source === "codigo_pago" || 
															(reserva?.referenciaPago && String(reserva.referenciaPago).trim().length > 0) ||
															reserva?.metodoPago === "codigo") ? (
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
															<span>{formatDate(reserva.fecha)}</span>
														</div>
														<div className="flex items-center gap-1">
															<Clock className="w-3 h-3 text-muted-foreground" />
															<span>{reserva.hora || "-"}</span>
														</div>
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
																	}
															  )
															: "-"}
													</div>
												</TableCell>
											)}
											{columnasVisibles.pasajeros && (
												<TableCell>
													<div className="flex items-center gap-1">
														<Users className="w-4 h-4 text-muted-foreground" />
														<span className="font-medium">
															{reserva.pasajeros}
														</span>
													</div>
												</TableCell>
											)}
											{columnasVisibles.total && (
												<TableCell className="font-semibold">
													{formatCurrency(reserva.totalConDescuento)}
												</TableCell>
											)}
											{columnasVisibles.estado && (
												<TableCell>{getEstadoBadge(reserva.estado)}</TableCell>
											)}
											{columnasVisibles.pago && (
												<TableCell>{getEstadoPagoBadge(reserva)}</TableCell>
											)}
											{columnasVisibles.saldo && (
												<TableCell>
													<span
														className={
															reserva.saldoPendiente > 0
																? "text-red-600 font-semibold"
																: "text-green-600 font-semibold"
														}
													>
														{formatCurrency(reserva.saldoPendiente)}
													</span>
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
																	: ["pendiente", "cancelada"].includes(reserva.estado)
																	? "Archivar"
																	: "Solo se pueden archivar reservas pendientes o canceladas"
															}
															disabled={
																!reserva.archivada &&
																!["pendiente", "cancelada"].includes(reserva.estado)
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
				<DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<div className="flex justify-between items-center">
							<div>
								<DialogTitle>
									Detalles de Reserva #{selectedReserva?.id}
								</DialogTitle>
								<DialogDescription>
									Información completa de la reserva
								</DialogDescription>
							</div>
							<Button
								size="sm"
								variant="outline"
								onClick={() => {
									const link = `${window.location.origin}/#comprar-productos/${selectedReserva.codigoReserva}`;
									navigator.clipboard.writeText(link);
									alert(`Enlace copiado al portapapeles: ${link}`);
								}}
							>
								Generar Link de Compra
							</Button>
							<Button
								size="sm"
								variant="outline"
								className="gap-2 ml-2"
								onClick={() => {
									const text = generarTextoConductor(selectedReserva);
									navigator.clipboard.writeText(text);
									alert("✅ Info para conductor copiada al portapapeles");
								}}
							>
								<Copy className="w-4 h-4" />
								Copiar Info Conductor
							</Button>
						</div>
					</DialogHeader>

					{selectedReserva && (
						<div className="space-y-6">
							{/* Código de Reserva */}
							{selectedReserva.codigoReserva && (
								<div className="bg-chocolate-50 border-2 border-chocolate-200 rounded-lg p-4">
									<div className="flex items-center justify-between">
										<div>
											<Label className="text-chocolate-700 text-sm font-medium">
												Código de Reserva
											</Label>
											<p className="text-2xl font-bold text-chocolate-900 tracking-wider">
												{selectedReserva.codigoReserva}
											</p>
										</div>
										<div className="bg-chocolate-100 p-2 rounded">
											<svg
												className="w-6 h-6 text-chocolate-700"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
												/>
											</svg>
										</div>
									</div>
								</div>
							)}

							{/* Información del Cliente */}
							<div>
								<h3 className="font-semibold text-lg mb-3">
									Información del Cliente
								</h3>
								<div className="grid grid-cols-2 gap-4">
									<div>
										<Label className="text-muted-foreground">Nombre</Label>
										<p className="font-medium">{selectedReserva.nombre}</p>
									</div>
									<div>
										<Label className="text-muted-foreground">Email</Label>
										<p className="font-medium">{selectedReserva.email}</p>
									</div>
									<div>
										<Label className="text-muted-foreground">Teléfono</Label>
										<p className="font-medium">{selectedReserva.telefono}</p>
									</div>
									{((selectedReserva.cliente?.clasificacion &&
										selectedReserva.cliente?.clasificacion !==
											"Cliente Activo") ||
										(selectedReserva.clasificacionCliente &&
											selectedReserva.clasificacionCliente !==
												"Cliente Activo")) && (
										<div>
											<Label className="text-muted-foreground">
												Clasificación
											</Label>
											<div className="mt-1">
												<Badge variant="outline">
													{selectedReserva.cliente?.clasificacion !==
														"Cliente Activo" &&
													selectedReserva.cliente?.clasificacion
														? selectedReserva.cliente.clasificacion
														: selectedReserva.clasificacionCliente}
												</Badge>
											</div>
										</div>
									)}
								</div>
							</div>

							{/* Detalles del Viaje */}
							<div>
								<h3 className="font-semibold text-lg mb-3">
									Detalles del Viaje
								</h3>
								
								{/* Indicador del tipo de viaje */}
								{selectedReserva.idaVuelta && (
									<div className="mb-4 inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full border border-blue-200">
										<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
										</svg>
										<span className="font-semibold text-sm">Viaje Ida y Vuelta</span>
									</div>
								)}

								{/* Viaje de Ida */}
								<div className="bg-gradient-to-r from-green-50 to-green-100 border-l-4 border-green-500 rounded-lg p-4 mb-4">
									<h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
										<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
										</svg>
										VIAJE DE IDA
									</h4>
									<div className="grid grid-cols-2 gap-4">
										<div>
											<Label className="text-green-700 font-medium">Origen</Label>
											<p className="font-semibold text-gray-900">{selectedReserva.origen}</p>
										</div>
										<div>
											<Label className="text-green-700 font-medium">Destino</Label>
											<p className="font-semibold text-gray-900">{selectedReserva.destino}</p>
										</div>
										{selectedReserva.direccionOrigen && (
											<div className="col-span-2 bg-yellow-50 p-2 rounded border border-yellow-200">
												<Label className="text-yellow-800 font-semibold">
													📍 Dirección de Origen (Específica)
												</Label>
												<p className="font-medium text-gray-900 mt-1">
													{selectedReserva.direccionOrigen}
												</p>
											</div>
										)}
										{selectedReserva.direccionDestino && (
											<div className="col-span-2 bg-yellow-50 p-2 rounded border border-yellow-200">
												<Label className="text-yellow-800 font-semibold">
													📍 Dirección de Destino (Específica)
												</Label>
												<p className="font-medium text-gray-900 mt-1">
													{selectedReserva.direccionDestino}
												</p>
											</div>
										)}
										<div>
											<Label className="text-green-700 font-medium">📅 Fecha</Label>
											<p className="font-semibold text-gray-900">{formatDate(selectedReserva.fecha)}</p>
										</div>
										<div>
											<Label className="text-green-700 font-medium">🕐 Hora de Recogida</Label>
											<p className="font-semibold text-gray-900">{selectedReserva.hora || "-"}</p>
										</div>
									</div>
								</div>

								{/* Viaje de Vuelta - SOLO si es ida y vuelta */}
								{selectedReserva.idaVuelta && (
									<div className="bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-500 rounded-lg p-4 mb-4">
										<h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
											<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
											</svg>
											VIAJE DE VUELTA
										</h4>
										<div className="grid grid-cols-2 gap-4">
											<div>
												<Label className="text-blue-700 font-medium">Origen</Label>
												<p className="font-semibold text-gray-900">{selectedReserva.destino}</p>
											</div>
											<div>
												<Label className="text-blue-700 font-medium">Destino</Label>
												<p className="font-semibold text-gray-900">{selectedReserva.origen}</p>
											</div>
											<div>
												<Label className="text-blue-700 font-medium">📅 Fecha de Regreso</Label>
												<p className="font-semibold text-gray-900">
													{selectedReserva.fechaRegreso ? formatDate(selectedReserva.fechaRegreso) : "⚠️ No especificada"}
												</p>
											</div>
											<div>
												<Label className="text-blue-700 font-medium">🕐 Hora de Recogida</Label>
												<p className="font-semibold text-gray-900">
													{selectedReserva.horaRegreso || "⚠️ No especificada"}
												</p>
											</div>
										</div>
										
										{/* Advertencia si falta información */}
										{(!selectedReserva.fechaRegreso || !selectedReserva.horaRegreso) && (
											<div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
												<svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
												</svg>
												<div>
													<p className="text-sm font-semibold text-yellow-800">Información Incompleta del Viaje de Vuelta</p>
													<p className="text-xs text-yellow-700 mt-1">Es necesario completar la fecha y hora del regreso para coordinar el servicio.</p>
												</div>
											</div>
										)}
									</div>
								)}

								{/* Información de pasajeros y vehículo */}
								<div className="grid grid-cols-2 gap-4 pt-4 border-t">
									<div>
										<Label className="text-muted-foreground">👥 Pasajeros</Label>
										<p className="font-medium">{selectedReserva.pasajeros}</p>
									</div>
									{selectedReserva.vehiculo && (
										<div>
											<Label className="text-muted-foreground">🚙 Vehículo</Label>
											<p className="font-medium">{selectedReserva.vehiculo}</p>
										</div>
									)}
								</div>
							</div>

							{/* Información de la Reserva */}
							<div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
								<h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
									<svg
										className="w-5 h-5 text-slate-600"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
										/>
									</svg>
									Registro de la Reserva
								</h3>
								<div className="grid grid-cols-2 gap-4">
									<div>
										<Label className="text-muted-foreground">
											Fecha de Creación
										</Label>
										<p className="font-medium">
											{selectedReserva.createdAt
												? new Date(selectedReserva.createdAt).toLocaleString(
														"es-CL",
														{
															year: "numeric",
															month: "2-digit",
															day: "2-digit",
															hour: "2-digit",
															minute: "2-digit",
															second: "2-digit",
															hour12: false,
														}
												  )
												: "-"}
										</p>
									</div>
									<div>
										<Label className="text-muted-foreground">
											Última Modificación
										</Label>
										<p className="font-medium">
											{selectedReserva.updatedAt
												? new Date(selectedReserva.updatedAt).toLocaleString(
														"es-CL",
														{
															year: "numeric",
															month: "2-digit",
															day: "2-digit",
															hour: "2-digit",
															minute: "2-digit",
															second: "2-digit",
															hour12: false,
														}
												  )
												: "-"}
										</p>
									</div>
								</div>
							</div>

							{/* Historial de Transacciones */}
							{(loadingTransacciones || transacciones.length > 0 || (selectedReserva && Number(selectedReserva.pagoMonto) > 0)) && (
								<div className="border-t pt-6">
									<h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
										<DollarSign className="h-5 w-5" />
										Historial de Transacciones
									</h3>
									
									{loadingTransacciones ? (
										<p className="text-sm text-gray-500 italic flex items-center gap-2">
											<span className="animate-spin h-3 w-3 border-2 border-gray-300 border-t-gray-600 rounded-full"></span>
											Consultando registros...
										</p>
									) : transacciones.length > 0 ? (
										<div className="overflow-x-auto">
											<table className="w-full text-sm">
												<thead className="bg-gray-50">
													<tr>
														<th className="px-4 py-2 text-left">Fecha</th>
														<th className="px-4 py-2 text-left">Monto</th>
														<th className="px-4 py-2 text-left">Tipo</th>
														<th className="px-4 py-2 text-left">Gateway</th>
														<th className="px-4 py-2 text-left">Estado</th>
														<th className="px-4 py-2 text-left">Referencia</th>
													</tr>
												</thead>
												<tbody className="divide-y">
													{transacciones.map((trans) => (
														<tr key={trans.id} className="hover:bg-gray-50">
															<td className="px-4 py-2">
																{new Date(trans.createdAt).toLocaleString('es-CL', {
																	day: '2-digit',
																	month: '2-digit',
																	year: 'numeric',
																	hour: '2-digit',
																	minute: '2-digit'
																})}
															</td>
															<td className="px-4 py-2 font-medium">
																{formatCurrency(trans.monto)}
															</td>
															<td className="px-4 py-2">
																<Badge variant="outline">
																	{trans.tipoPago || 'N/A'}
																</Badge>
															</td>
															<td className="px-4 py-2 capitalize">
																{trans.gateway}
															</td>
															<td className="px-4 py-2">
																{trans.estado === 'aprobado' && (
																	<Badge variant="default" className="bg-green-500">
																		✓ Aprobado
																	</Badge>
																)}
																{trans.estado === 'pendiente' && (
																	<Badge variant="secondary">
																		⏳ Pendiente
																	</Badge>
																)}
																{trans.estado === 'fallido' && (
																	<Badge variant="destructive">
																		✗ Fallido
																	</Badge>
																)}
															</td>
															<td className="px-4 py-2 text-xs text-gray-600">
																{trans.referencia || trans.codigoPago?.codigo || '-'}
															</td>
														</tr>
													))}
												</tbody>
												<tfoot className="bg-gray-50 font-semibold">
													<tr>
														<td className="px-4 py-2">Total</td>
														<td className="px-4 py-2">
															{formatCurrency(
																transacciones.reduce((sum, t) => sum + parseFloat(t.monto || 0), 0)
															)}
														</td>
														<td colSpan="4" className="px-4 py-2 text-xs text-gray-600">
															{transacciones.length} transacción(es)
														</td>
													</tr>
												</tfoot>
											</table>
										</div>
									) : (
										<div className="bg-blue-50 border-l-4 border-blue-400 p-3">
											<p className="text-sm text-blue-700 italic">
												Esta reserva tiene pagos registrados ({selectedReserva ? formatCurrency(selectedReserva.pagoMonto) : '$0'}), 
												pero no existen detalles históricos porque el pago se realizó antes de la actualización del sistema.
											</p>
										</div>
									)}
								</div>
							)}

							{/* Historial de Asignaciones (interno) */}
							<div>
								<h3 className="font-semibold text-lg mb-3">
									Historial de Asignaciones
								</h3>
								{loadingHistorial ? (
									<p className="text-sm text-muted-foreground">
										Cargando historial...
									</p>
								) : historialAsignaciones.length === 0 ? (
									<p className="text-sm text-muted-foreground">
										Sin cambios de asignaciÃ³n
									</p>
								) : (
									<div className="space-y-2">
										{historialAsignaciones.map((h) => (
											<div key={h.id} className="p-2 border rounded-md text-sm">
												<div className="flex justify-between">
													<span>
														Vehículo: <strong>{h.vehiculo || "-"}</strong>
														{h.conductor && (
															<>
																{" "}
																- Conductor: <strong>{h.conductor}</strong>
															</>
														)}
													</span>
													<span className="text-muted-foreground">
														{new Date(h.created_at).toLocaleString("es-CL")}
													</span>
												</div>
											</div>
										))}
									</div>
								)}
							</div>

							{/* Información Adicional */}
							{(selectedReserva.numeroVuelo || selectedReserva.hotel || selectedReserva.equipajeEspecial || selectedReserva.sillaInfantil) && (
								<div>
									<h3 className="font-semibold text-lg mb-3">
										Información Adicional
									</h3>
									<div className="grid grid-cols-2 gap-4">
										{selectedReserva.numeroVuelo && (
											<div>
												<Label className="text-muted-foreground">
													Número de Vuelo
												</Label>
												<p className="font-medium">
													{selectedReserva.numeroVuelo}
												</p>
											</div>
										)}
										{selectedReserva.hotel && (
											<div>
												<Label className="text-muted-foreground">Hotel</Label>
												<p className="font-medium">
													{selectedReserva.hotel}
												</p>
											</div>
										)}
										{selectedReserva.equipajeEspecial && (
											<div>
												<Label className="text-muted-foreground">
													Equipaje Especial
												</Label>
												<p className="font-medium">
													{selectedReserva.equipajeEspecial}
												</p>
											</div>
										)}
										{selectedReserva.sillaInfantil && (
											<div>
												<Label className="text-muted-foreground">
													Silla Infantil
												</Label>
												<p className="font-medium">Sí</p>
											</div>
										)}
									</div>
								</div>
							)}

							{/* Información Financiera */}
							<div>
								<h3 className="font-semibold text-lg mb-3">
									Información Financiera
								</h3>
								<div className="grid grid-cols-2 gap-4">
									<div>
										<Label className="text-muted-foreground">Precio Base</Label>
										<p className="font-medium">
											{formatCurrency(selectedReserva.precio)}
										</p>
									</div>
									{selectedReserva.descuentoBase > 0 && (
										<div>
											<Label className="text-muted-foreground">
												Descuento Base
											</Label>
											<p className="font-medium">
												{formatCurrency(selectedReserva.descuentoBase)}
											</p>
										</div>
									)}
									{selectedReserva.descuentoPromocion > 0 && (
										<div>
											<Label className="text-muted-foreground">
												Descuento Promoción
											</Label>
											<p className="font-medium">
												{formatCurrency(selectedReserva.descuentoPromocion)}
											</p>
										</div>
									)}
									{selectedReserva.descuentoRoundTrip > 0 && (
										<div>
											<Label className="text-muted-foreground">
												Descuento Round Trip
											</Label>
											<p className="font-medium">
												{formatCurrency(selectedReserva.descuentoRoundTrip)}
											</p>
										</div>
									)}
									{selectedReserva.descuentoOnline > 0 && (
										<div>
											<Label className="text-muted-foreground">
												Descuento Online
											</Label>
											<p className="font-medium">
												{formatCurrency(selectedReserva.descuentoOnline)}
											</p>
										</div>
									)}
									<div>
										<Label className="text-muted-foreground">
											Total con Descuento
										</Label>
										<p className="font-bold text-lg">
											{formatCurrency(selectedReserva.totalConDescuento)}
										</p>
									</div>
									<div>
										<Label className="text-muted-foreground">
											Abono Sugerido
										</Label>
										<p className="font-medium">
											{formatCurrency(selectedReserva.abonoSugerido)}
										</p>
									</div>
									<div>
										<Label className="text-muted-foreground">
											Saldo Pendiente
										</Label>
										<p
											className={`font-bold ${
												selectedReserva.saldoPendiente > 0
													? "text-red-600"
													: "text-green-600"
											}`}
										>
											{formatCurrency(selectedReserva.saldoPendiente)}
										</p>
									</div>
									<div>
										<Label className="text-muted-foreground">
											Estado del Abono
										</Label>
										<div className="mt-1">
											<Badge
												variant={
													selectedReserva.abonoPagado ? "default" : "secondary"
												}
											>
												{selectedReserva.abonoPagado
													? "Abono pagado"
													: "Pendiente"}
											</Badge>
										</div>
									</div>
									<div>
										<Label className="text-muted-foreground">
											Estado del Saldo
										</Label>
										<div className="mt-1">
											<Badge
												variant={
													selectedReserva.saldoPagado ? "default" : "secondary"
												}
											>
												{selectedReserva.saldoPagado
													? "Saldo pagado"
													: "Pendiente"}
											</Badge>
										</div>
									</div>
									{selectedReserva.codigoDescuento && (
										<div>
											<Label className="text-muted-foreground">
												Código de Descuento
											</Label>
											<p className="font-medium">
												{selectedReserva.codigoDescuento}
											</p>
										</div>
									)}
								</div>
							</div>

							{/* Estado y Pago */}
							<div>
								<h3 className="font-semibold text-lg mb-3">Estado y Pago</h3>
								<div className="grid grid-cols-2 gap-4">
									<div>
										<Label className="text-muted-foreground">Estado</Label>
										<div className="mt-1">
											{getEstadoBadge(selectedReserva.estado)}
										</div>
									</div>
									<div>
										<Label className="text-muted-foreground">
											Estado de Pago
										</Label>
										<div className="mt-1">
											{getEstadoPagoBadge(selectedReserva)}
										</div>
									</div>
									{selectedReserva.metodoPago && (
										<div>
											<Label className="text-muted-foreground">
												Método de Pago
											</Label>
											<p className="font-medium">
												{selectedReserva.metodoPago}
											</p>
										</div>
									)}
									{selectedReserva.referenciaPago && (
										<div>
											<Label className="text-muted-foreground">
												Referencia de Pago
											</Label>
											<p className="font-medium">
												{selectedReserva.referenciaPago}
											</p>
										</div>
									)}
								</div>
							</div>

							{/* Observaciones y Mensaje */}
							{(selectedReserva.observaciones || selectedReserva.mensaje) && (
								<div>
									<h3 className="font-semibold text-lg mb-3">
										Notas y Comentarios
									</h3>
									{selectedReserva.mensaje && (
										<div className="mb-3">
											<Label className="text-muted-foreground">
												Mensaje del Cliente
											</Label>
											<p className="mt-1 p-3 bg-muted rounded-md">
												{selectedReserva.mensaje}
											</p>
										</div>
									)}
									{selectedReserva.observaciones && (
										<div>
											<Label className="text-muted-foreground">
												Observaciones Internas
											</Label>
											<p className="mt-1 p-3 bg-muted rounded-md">
												{selectedReserva.observaciones}
											</p>
										</div>
									)}
								</div>
							)}

							{/* Información Técnica */}
							<div>
								<h3 className="font-semibold text-lg mb-3">
									Información Técnica
								</h3>
								<div className="grid grid-cols-2 gap-4 text-sm">
									<div>
										<Label className="text-muted-foreground">Origen</Label>
										<p>{selectedReserva.source || "web"}</p>
									</div>
									{selectedReserva.ipAddress && (
										<div>
											<Label className="text-muted-foreground">IP</Label>
											<p>{selectedReserva.ipAddress}</p>
										</div>
									)}
									<div>
										<Label className="text-muted-foreground">
											Fecha de Creación
										</Label>
										<p>{formatDate(selectedReserva.created_at)}</p>
									</div>
									<div>
										<Label className="text-muted-foreground">
											Última Actualización
										</Label>
										<p>{formatDate(selectedReserva.updated_at)}</p>
									</div>
								</div>
							</div>
						{/* Botón para asignar vehículo y conductor si no están asignados o faltan datos internos */}
						{(!isAsignada(selectedReserva) || !selectedReserva.conductorId || !selectedReserva.vehiculoId) && (
							<div className="mt-6 pt-4 border-t">
								<Button
									onClick={() => {
										setShowDetailDialog(false);
										handleAsignar(selectedReserva);
									}}
									className="w-full bg-chocolate-600 hover:bg-chocolate-700"
									size="lg"
								>
									<Car className="w-4 h-4 mr-2" />
									{isAsignada(selectedReserva) 
										? "Corregir Asignación (Actualizar Datos)" 
										: "Asignar Vehículo y Conductor"}
								</Button>
							</div>
						)}
					</div>
				)}
				</DialogContent>
			</Dialog>

			{/* Modal de EdiciÃ³n */}
			<Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
				<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Editar Reserva #{selectedReserva?.id}</DialogTitle>
						<DialogDescription>
							Actualiza el estado, pago y detalles de la reserva
						</DialogDescription>
					</DialogHeader>

					{selectedReserva && (
						<div className="space-y-4">
							{/* InformaciÃ³n del Cliente (editable) */}
							<div className="bg-muted p-4 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="space-y-1">
									<Label>Nombre</Label>
									<Input
										value={formData.nombre || ""}
										onChange={(e) =>
											setFormData({ ...formData, nombre: e.target.value })
										}
									/>
								</div>
								<div className="space-y-1">
									<Label>Email</Label>
									<Input
										type="email"
										value={formData.email || ""}
										onChange={(e) =>
											setFormData({ ...formData, email: e.target.value })
										}
									/>
								</div>
								<div className="space-y-1">
									<Label>Teléfono</Label>
									<Input
										value={formData.telefono || ""}
										onChange={(e) =>
											setFormData({ ...formData, telefono: e.target.value })
										}
									/>
								</div>
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
							</div>

							{/* Detalles del Trayecto */}
							<div className="bg-muted p-4 rounded-lg space-y-4">
								<h3 className="font-semibold border-b pb-2">Detalles del Trayecto</h3>
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
												<div className="space-y-1 md:col-span-2">
													<Label className="flex items-center gap-2">
														<MapPin className="h-4 w-4" />
														Dirección Específica (Recogida o Llegada)
													</Label>
													<AddressAutocomplete
														name="hotel"
														value={formData.hotel || ""}
														placeholder="Ej: Condominio Los Ríos, Loteo 21, Malalcahuello"
														onChange={(e) => {
															const newVal = e.target.value;
															const isFromAirport =
																formData.origen === "Aeropuerto La Araucanía";
															const isToAirport =
																formData.destino === "Aeropuerto La Araucanía";

															setFormData({
																...formData,
																hotel: newVal,
																// Sincronizar direcciÃ³n especÃ­fica segÃºn el sentido del viaje
																// para que coincida con lo que se muestra en el modal de detalles
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
													<p className="text-xs text-muted-foreground mt-1">
														Esta es la dirección única que verá el conductor para llegar al punto exacto.
													</p>
												</div>
											</>

								</div>
								
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
												Notificar actualización al conductor (Reenviar correo con nueva dirección)
											</label>
										</div>
									</div>
								)}
							</div>

							{/* Estado */}
							<div className="space-y-2">
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
														prev.estado
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
										<SelectItem value="transferencia">Transferencia</SelectItem>
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
										setFormData({ ...formData, referenciaPago: e.target.value })
									}
								/>
							</div>

							{/* Tipo de pago registrado */}
							<div className="space-y-2">
								<Label htmlFor="tipoPago">Tipo de Pago Registrado</Label>
								{/* Determinar si ya se registrÃ³ el abono del 40% */}
								{(() => {
									const montoPagadoNum =
										parseFloat(formData.montoPagado || 0) || 0;
									const totalReservaNum =
										parseFloat(
											selectedReserva?.totalConDescuento ||
												selectedReserva?.precio ||
												0
										) || 0;
									const abonoSugeridoNum =
										parseFloat(selectedReserva?.abonoSugerido || 0) || 0;
									const umbralAbono = Math.max(
										totalReservaNum * 0.4,
										abonoSugeridoNum || 0
									);
									const yaAbono40 =
										Boolean(selectedReserva?.abonoPagado) ||
										montoPagadoNum >= umbralAbono;
									return (
										<Select
											value={formData.tipoPago}
											onValueChange={(value) =>
												setFormData((prev) => {
													// Recalcular montos para prefill
													const totalReservaNum =
														parseFloat(
															selectedReserva?.totalConDescuento ||
																selectedReserva?.precio ||
																0
														) || 0;
													const abonoSugeridoNum =
														parseFloat(selectedReserva?.abonoSugerido || 0) ||
														0;
													const pagoPrevioNum =
														parseFloat(selectedReserva?.pagoMonto || 0) || 0;
													const umbralAbono = Math.max(
														totalReservaNum * 0.4,
														abonoSugeridoNum || 0
													);

													let computedMonto = null;
													if (value === "saldo" || value === "total") {
														const restante = Math.max(
															totalReservaNum - pagoPrevioNum,
															0
														);
														computedMonto = restante > 0 ? restante : null;
													} else if (value === "abono") {
														const necesario = Math.max(
															umbralAbono - pagoPrevioNum,
															0
														);
														computedMonto = necesario > 0 ? necesario : null;
													}

													return {
														...prev,
														tipoPago: value,
														// Escritura segura: guardar número o cadena vacía
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
													// Si ya se pagÃ³ el abono del 40%, solo permitir completar el pago
													<SelectItem value="saldo">Completar pago</SelectItem>
												) : (
													// Opciones por defecto: Abono 40% y Abono total
													<>
														<SelectItem value="abono">Abono 40%</SelectItem>
														<SelectItem value="total">Abono total</SelectItem>
													</>
												)}
											</SelectContent>
										</Select>
									);
								})()}
							</div>

							{/* Monto del pago */}
							<div className="space-y-2">
								{/* Mostrar monto registrado actual (solo informativo). Los pagos manuales se registran en el apartado 'Registrar pago'. */}
								<Label htmlFor="montoPagado">Monto a registrar (CLP)</Label>
								<Input
									id="montoPagado"
									type="number"
									step="1"
									min="0"
									value={
										formData.montoPagado !== undefined &&
										formData.montoPagado !== null
											? formData.montoPagado
											: ""
									}
									onChange={(e) =>
										setFormData({ ...formData, montoPagado: e.target.value })
									}
								/>
								<div className="text-xs text-muted-foreground mt-1">
									<div>
										Registrado en sistema:{" "}
										{selectedReserva.pagoMonto
											? new Intl.NumberFormat("es-CL", {
													style: "currency",
													currency: "CLP",
											  }).format(selectedReserva.pagoMonto)
											: "-"}
									</div>
								</div>
							</div>

							{/* Historial de pagos de esta reserva */}
							<div className="space-y-2">
								<Label>Historial de pagos</Label>
								<div className="bg-white border rounded p-3 max-h-48 overflow-y-auto">
									{pagoHistorial &&
										pagoHistorial.length > 0 &&
										pagoHistorial.map((p) => (
											<div
												key={p.id}
												className="flex justify-between items-center py-2 border-b"
											>
												<div>
													<div className="font-medium">
														{p.source === "web" ? "Pago web" : "Pago manual"}
													</div>
													<div className="text-sm text-muted-foreground">
														{p.metodo || "-"} - {p.referencia || "-"}
													</div>
												</div>
												<div className="text-right text-sm">
													<div>
														{new Intl.NumberFormat("es-CL", {
															style: "currency",
															currency: "CLP",
														}).format(p.amount)}
													</div>
													<div className="text-xs text-muted-foreground">
														{new Date(p.createdAt).toLocaleString()}
													</div>
												</div>
											</div>
										))}
									{(!pagoHistorial || pagoHistorial.length === 0) && (
										<p className="text-sm text-muted-foreground">
											No hay pagos registrados.
										</p>
									)}
								</div>
							</div>

							{/* BotÃ³n y modal para registrar pago manual */}
							<div className="space-y-2">
								<Label>Registrar pago manual</Label>
								<div className="flex gap-2">
									<Button
										type="button"
										onClick={() => setShowRegisterPayment(true)}
									>
										Registrar pago
									</Button>
									<span className="text-sm text-muted-foreground self-center">
										Registra pagos manuales y guarda un historial (manual /
										web).
									</span>
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

							{/* Resumen Financiero */}
							<div className="bg-chocolate-50 p-4 rounded-lg border border-chocolate-200">
								<h4 className="font-semibold mb-2 text-chocolate-900">
									Resumen Financiero
								</h4>
								<div className="space-y-1 text-sm">
									<div className="flex justify-between">
										<span>Total:</span>
										<span className="font-semibold">
											{formatCurrency(selectedReserva.totalConDescuento)}
										</span>
									</div>
									<div className="flex justify-between">
										<span>Abono Sugerido:</span>
										<span className="font-semibold">
											{formatCurrency(selectedReserva.abonoSugerido)}
										</span>
									</div>
									<div className="flex justify-between border-t border-chocolate-300 pt-1">
										<span className="font-semibold">Saldo Pendiente:</span>
										<span
											className={`font-bold ${
												selectedReserva.saldoPendiente > 0
													? "text-red-600"
													: "text-green-600"
											}`}
										>
											{formatCurrency(selectedReserva.saldoPendiente)}
										</span>
									</div>
									<div className="flex justify-between pt-1">
										<span>Estado del Abono:</span>
										<Badge
											variant={
												selectedReserva.abonoPagado ? "default" : "secondary"
											}
										>
											{selectedReserva.abonoPagado
												? "Abono pagado"
												: "Pendiente"}
										</Badge>
									</div>
									<div className="flex justify-between">
										<span>Estado del Saldo:</span>
										<Badge
											variant={
												selectedReserva.saldoPagado ? "default" : "secondary"
											}
										>
											{selectedReserva.saldoPagado
												? "Saldo pagado"
												: "Pendiente"}
										</Badge>
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
								<Button onClick={handleSave} disabled={saving}>
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
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="new-origen">
										Origen <span className="text-red-500">*</span>
									</Label>
									{!origenEsOtro ? (
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
											{destinosOptions.map((n) => (
												<option key={n} value={n}>
													{n}
												</option>
											))}
										</select>
									) : (
										<Input
											id="new-origen-otro"
											placeholder="Especificar origen"
											value={otroOrigen}
											onChange={(e) => setOtroOrigen(e.target.value)}
										/>
									)}
									<div className="text-xs text-muted-foreground">
										<label className="inline-flex items-center gap-2 cursor-pointer">
											<input
												type="checkbox"
												checked={origenEsOtro}
												onChange={(e) => setOrigenEsOtro(e.target.checked)}
											/>
											Origen no está en la lista
										</label>
									</div>
								</div>
								<div className="space-y-2">
									<Label htmlFor="new-destino">
										Destino <span className="text-red-500">*</span>
									</Label>
									{!destinoEsOtro ? (
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
											{destinosOptions.map((n) => (
												<option key={n} value={n}>
													{n}
												</option>
											))}
										</select>
									) : (
										<Input
											id="new-destino-otro"
											placeholder="Especificar destino"
											value={otroDestino}
											onChange={(e) => setOtroDestino(e.target.value)}
										/>
									)}
									<div className="text-xs text-muted-foreground">
										<label className="inline-flex items-center gap-2 cursor-pointer">
											<input
												type="checkbox"
												checked={destinoEsOtro}
												onChange={(e) => setDestinoEsOtro(e.target.checked)}
											/>
											Destino no está en la lista (se agregará a la base de
											datos como inactivo)
										</label>
									</div>
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
									<Input
										id="new-hora"
										type="time"
										value={newReservaForm.hora}
										onChange={(e) =>
											setNewReservaForm({
												...newReservaForm,
												hora: e.target.value,
											})
										}
									/>
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
											<SelectItem value="sedan">Sedan</SelectItem>
											<SelectItem value="van">Van</SelectItem>
											<SelectItem value="minibus">Minibus</SelectItem>
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
										<Input
											id="new-horaregreso"
											type="time"
											value={newReservaForm.horaRegreso}
											onChange={(e) =>
												setNewReservaForm({
													...newReservaForm,
													horaRegreso: e.target.value,
												})
											}
										/>
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
											(parseFloat(newReservaForm.abonoSugerido) || 0)
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
								Si el cliente ya realizó un pago, regístralo aquí para que
								quede en el historial
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
												historialCliente.estadisticas.totalGastado
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

						{/* Selector de vehÃ­culo */}
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
										.filter((v) => v.capacidad >= (selectedReserva?.pasajeros || 1))
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
								onCheckedChange={(v) => setEnviarNotificacionConductor(Boolean(v))}
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
								<div className="bg-chocolate-50 p-3 rounded-lg space-y-1 text-sm">
									<p className="font-semibold">Asignación actual:</p>
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
										) : selectedReserva?.conductor ? (
											<p>👤 Conductor: {selectedReserva.conductor}</p>
										) : null
									) : (
										<p className="text-muted-foreground">
											No hay conductor asignado actualmente.
										</p>
									)}
									<div className="mt-2">
										<Button
											size="sm"
											variant="outline"
											onClick={() => handleAsignar(selectedReserva)}
										>
											Reasignar vehículo / conductor
										</Button>
									</div>
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
								const missingIds = !selectedReserva?.vehiculoId || (selectedReserva?.conductor && !selectedReserva?.conductorId);
								
								return (
									<Button
										onClick={handleGuardarAsignacion}
										disabled={
											loadingAsignacion ||
											!vehiculoSeleccionado ||
											// Permitir si hay ids faltantes O si se quiere notificar (checkboxes activos)
											(sameAssignment && !missingIds && !enviarNotificacion && !enviarNotificacionConductor)
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
		</div>
	);
}

export default AdminReservas;
