import { useCallback, useEffect, useMemo, useState } from "react";
import {
	RefreshCw, Plane, Hotel, CircleDollarSign, Users, Plus, Pencil,
	Eye, CheckCircle, XCircle, Download, MessageCircle, Clock, CreditCard,
	TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import {
	Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from "../ui/dialog";
import {
	Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../ui/select";
import {
	Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "../ui/table";
import { Switch } from "../ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Textarea } from "../ui/textarea";
import { Separator } from "../ui/separator";
import { useAuthenticatedFetch } from "../../hooks/useAuthenticatedFetch";

// ─── Constantes ─────────────────────────────────────────────────────────────
const ESTADOS = ["pendiente", "confirmada", "completada", "cancelada"];
const ESTADOS_PAGO = ["pendiente", "aprobado", "pagado", "fallido", "reembolsado"];
const SOURCES = [
	{ value: "cotizador", label: "Cotizadores (sin pago)" },
	{ value: "web_hoteles", label: "Reservas confirmadas (web)" },
	{ value: "admin", label: "Creadas por admin" },
];

const CLASES_ESTADO = {
	pendiente: "bg-amber-100 text-amber-800 border-amber-300",
	confirmada: "bg-blue-100 text-blue-800 border-blue-300",
	completada: "bg-emerald-100 text-emerald-800 border-emerald-300",
	cancelada: "bg-rose-100 text-rose-800 border-rose-300",
};

const CLASES_PAGO = {
	pendiente: "bg-gray-100 text-gray-700 border-gray-300",
	aprobado: "bg-sky-100 text-sky-700 border-sky-300",
	pagado: "bg-emerald-100 text-emerald-800 border-emerald-300",
	fallido: "bg-rose-100 text-rose-800 border-rose-300",
	reembolsado: "bg-purple-100 text-purple-700 border-purple-300",
};

const HOTEL_INICIAL = {
	nombre: "", comuna: "", codigo: "",
	tarifaSoloIda: "", tarifaIdaVuelta: "", orden: "0", activo: true,
};

const RESERVA_FORM_INICIAL = {
	nombre: "", email: "", telefono: "",
	hotelCodigo: "", origenTipo: "aeropuerto", tipoServicio: "solo_ida",
	fechaIda: "", horaIda: "", fechaVuelta: "", horaVuelta: "",
	pasajeros: "1", sillaInfantil: false, cantidadSillasInfantiles: "0",
	observaciones: "", montoTotal: "",
};

// ─── Helpers ────────────────────────────────────────────────────────────────
const formatearCLP = (monto) =>
	new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(Number(monto || 0));

const formatearFecha = (fecha) => {
	if (!fecha) return "—";
	const date = new Date(`${fecha}T00:00:00`);
	return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("es-CL");
};

const formatearHora = (hora) => {
	if (!hora) return "";
	return String(hora).slice(0, 5);
};

const labelOrigen = (tipo) => tipo === "aeropuerto" ? "Aeropuerto" : "Hotel";

// ─── Sub-componentes ─────────────────────────────────────────────────────────
function TarjetaResumen({ titulo, valor, icon: Icon, color = "text-primary" }) {
	return (
		<Card>
			<CardContent className="pt-6">
				<div className="flex items-center justify-between">
					<div>
						<p className="text-xs uppercase tracking-wide text-muted-foreground">{titulo}</p>
						<p className="text-2xl font-semibold mt-1">{valor}</p>
					</div>
					<div className={`rounded-full p-2 bg-muted ${color}`}>
						<Icon className="h-5 w-5" />
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

function CampoDetalle({ label, children }) {
	return (
		<div className="space-y-0.5">
			<p className="text-xs text-muted-foreground">{label}</p>
			<p className="text-sm font-medium">{children || "—"}</p>
		</div>
	);
}

// ─── Componente principal ────────────────────────────────────────────────────
function AdminTrasladosHoteles() {
	const { authenticatedFetch } = useAuthenticatedFetch();

	// Estado de reservas
	const [loading, setLoading] = useState(true);
	const [reservas, setReservas] = useState([]);
	const [hotelesFiltroFallback, setHotelesFiltroFallback] = useState([]);
	const [resumen, setResumen] = useState({ total: 0, pendiente: 0, confirmada: 0, completada: 0, cancelada: 0 });
	const [total, setTotal] = useState(0);
	const [totalPages, setTotalPages] = useState(1);
	const [totalCotizadores, setTotalCotizadores] = useState(0);
	const [totalReservasConfirmadas, setTotalReservasConfirmadas] = useState(0);
	const [filtros, setFiltros] = useState({
		q: "", estado: "todos", estadoPago: "todos", hotelCodigo: "todos",
		source: "todos", fechaDesde: "", fechaHasta: "", page: 1,
	});

	// Estado de hoteles catálogo
	const [catalogoHoteles, setCatalogoHoteles] = useState([]);
	const [loadingHoteles, setLoadingHoteles] = useState(false);

	// Operaciones en curso
	const [updatingId, setUpdatingId] = useState(null);

	// Modal de detalle / edición de reserva
	const [reservaDetalle, setReservaDetalle] = useState(null);
	const [showDetalle, setShowDetalle] = useState(false);
	const [modoEdicion, setModoEdicion] = useState(false);
	const [editForm, setEditForm] = useState({});
	const [guardandoEdicion, setGuardandoEdicion] = useState(false);

	// Modal de creación de reserva
	const [showCrear, setShowCrear] = useState(false);
	const [crearForm, setCrearForm] = useState(RESERVA_FORM_INICIAL);
	const [guardandoCrear, setGuardandoCrear] = useState(false);

	// Modal de pago
	const [showPago, setShowPago] = useState(false);
	const [pagoForm, setPagoForm] = useState({ estadoPago: "", metodoPago: "", pagoId: "", pagoMonto: "" });
	const [guardandoPago, setGuardandoPago] = useState(false);

	// Modal de hotel
	const [showHotelDialog, setShowHotelDialog] = useState(false);
	const [hotelEditando, setHotelEditando] = useState(null);
	const [hotelForm, setHotelForm] = useState(HOTEL_INICIAL);
	const [guardandoHotel, setGuardandoHotel] = useState(false);

	const hotelesFiltro = useMemo(
		() => catalogoHoteles.length > 0 ? catalogoHoteles : hotelesFiltroFallback || [],
		[catalogoHoteles, hotelesFiltroFallback],
	);

	// ── API calls ──────────────────────────────────────────────────────────
	const fetchReservas = useCallback(async () => {
		try {
			setLoading(true);
			const params = new URLSearchParams({ page: String(filtros.page || 1), limit: "20" });
			if (filtros.q?.trim()) params.set("q", filtros.q.trim());
			if (filtros.estado !== "todos") params.set("estado", filtros.estado);
			if (filtros.estadoPago !== "todos") params.set("estadoPago", filtros.estadoPago);
			if (filtros.hotelCodigo !== "todos") params.set("hotelCodigo", filtros.hotelCodigo);
			if (filtros.source !== "todos") params.set("source", filtros.source);
			if (filtros.fechaDesde) params.set("fechaDesde", filtros.fechaDesde);
			if (filtros.fechaHasta) params.set("fechaHasta", filtros.fechaHasta);

			const response = await authenticatedFetch(`/api/admin/traslados-hoteles/reservas?${params}`, { method: "GET" });
			const data = await response.json();
			if (!response.ok) throw new Error(data.error || "No se pudo cargar el módulo.");

			setReservas(data.reservas || []);
			setResumen(data.resumen || { total: 0, pendiente: 0, confirmada: 0, completada: 0, cancelada: 0 });
			setHotelesFiltroFallback(data.hoteles || []);
			setTotal(data.total || 0);
			setTotalPages(data.totalPages || 1);
			if (data.totalCotizadores !== undefined) setTotalCotizadores(data.totalCotizadores);
			if (data.totalReservasConfirmadas !== undefined) setTotalReservasConfirmadas(data.totalReservasConfirmadas);
		} catch (error) {
			toast.error(error.message || "No se pudo cargar el módulo Aeropuerto-Hoteles.");
		} finally {
			setLoading(false);
		}
	}, [authenticatedFetch, filtros]);

	const fetchHoteles = useCallback(async () => {
		try {
			setLoadingHoteles(true);
			const response = await authenticatedFetch("/api/admin/traslados-hoteles/hoteles", { method: "GET" });
			const data = await response.json();
			if (!response.ok) throw new Error(data.error || "Error cargando hoteles.");
			setCatalogoHoteles(data.hoteles || []);
		} catch (error) {
			toast.error(error.message || "No se pudo cargar el catálogo de hoteles.");
		} finally {
			setLoadingHoteles(false);
		}
	}, [authenticatedFetch]);

	const fetchDetalle = useCallback(async (id) => {
		try {
			const response = await authenticatedFetch(`/api/admin/traslados-hoteles/reservas/${id}`, { method: "GET" });
			const data = await response.json();
			if (!response.ok) throw new Error(data.error || "No se pudo cargar la reserva.");
			setReservaDetalle(data.reserva);
		} catch (error) {
			toast.error(error.message || "Error cargando detalle.");
		}
	}, [authenticatedFetch]);

	useEffect(() => { fetchReservas(); }, [fetchReservas]);
	useEffect(() => { fetchHoteles(); }, [fetchHoteles]);

	const totalFacturado = useMemo(
		() => reservas.reduce((acc, r) => acc + Number(r.montoTotal || 0), 0),
		[reservas],
	);

	// ── Filtros ─────────────────────────────────────────────────────────────
	const actualizarFiltro = (campo, valor) =>
		setFiltros((prev) => ({ ...prev, [campo]: valor, page: campo === "page" ? valor : 1 }));

	const limpiarFiltros = () =>
		setFiltros({ q: "", estado: "todos", estadoPago: "todos", hotelCodigo: "todos", source: "todos", fechaDesde: "", fechaHasta: "", page: 1 });

	// ── Handlers reserva ────────────────────────────────────────────────────
	const cambiarEstado = async (reservaId, nuevoEstado) => {
		try {
			setUpdatingId(reservaId);
			const response = await authenticatedFetch(
				`/api/admin/traslados-hoteles/reservas/${reservaId}/estado`,
				{ method: "PATCH", body: JSON.stringify({ estado: nuevoEstado }) },
			);
			const data = await response.json();
			if (!response.ok) throw new Error(data.error || "Error actualizando estado.");
			toast.success(`Estado → ${nuevoEstado}`);
			await fetchReservas();
			if (reservaDetalle?.id === reservaId) {
				setReservaDetalle((prev) => ({ ...prev, estado: nuevoEstado }));
			}
		} catch (error) {
			toast.error(error.message || "Error al actualizar estado.");
		} finally {
			setUpdatingId(null);
		}
	};

	const abrirDetalle = async (reserva) => {
		setReservaDetalle(reserva);
		setModoEdicion(false);
		setShowDetalle(true);
		await fetchDetalle(reserva.id);
	};

	const iniciarEdicion = () => {
		if (!reservaDetalle) return;
		setEditForm({
			nombre: reservaDetalle.nombre || "",
			email: reservaDetalle.email || "",
			telefono: reservaDetalle.telefono || "",
			hotelCodigo: reservaDetalle.hotelCodigo || "",
			origenTipo: reservaDetalle.origenTipo || "aeropuerto",
			tipoServicio: reservaDetalle.tipoServicio || "solo_ida",
			fechaIda: reservaDetalle.fechaIda || "",
			horaIda: formatearHora(reservaDetalle.horaIda),
			fechaVuelta: reservaDetalle.fechaVuelta || "",
			horaVuelta: formatearHora(reservaDetalle.horaVuelta),
			pasajeros: String(reservaDetalle.pasajeros || 1),
			sillaInfantil: Boolean(reservaDetalle.sillaInfantil),
			cantidadSillasInfantiles: String(reservaDetalle.cantidadSillasInfantiles || 0),
			observaciones: reservaDetalle.observaciones || "",
			montoTotal: String(reservaDetalle.montoTotal || ""),
		});
		setModoEdicion(true);
	};

	const guardarEdicion = async () => {
		if (!reservaDetalle) return;
		try {
			setGuardandoEdicion(true);
			const payload = {
				nombre: editForm.nombre,
				email: editForm.email,
				telefono: editForm.telefono,
				hotelCodigo: editForm.hotelCodigo,
				origenTipo: editForm.origenTipo,
				tipoServicio: editForm.tipoServicio,
				fechaIda: editForm.fechaIda,
				horaIda: editForm.horaIda,
				fechaVuelta: editForm.fechaVuelta || null,
				horaVuelta: editForm.horaVuelta || null,
				pasajeros: Number(editForm.pasajeros) || 1,
				sillaInfantil: editForm.sillaInfantil,
				cantidadSillasInfantiles: Number(editForm.cantidadSillasInfantiles) || 0,
				observaciones: editForm.observaciones,
				montoTotal: Number(editForm.montoTotal) || undefined,
			};
			const response = await authenticatedFetch(
				`/api/admin/traslados-hoteles/reservas/${reservaDetalle.id}`,
				{ method: "PUT", body: JSON.stringify(payload) },
			);
			const data = await response.json();
			if (!response.ok) throw new Error(data.error || "Error guardando cambios.");
			toast.success("Reserva actualizada.");
			setModoEdicion(false);
			await fetchDetalle(reservaDetalle.id);
			await fetchReservas();
		} catch (error) {
			toast.error(error.message || "Error guardando cambios.");
		} finally {
			setGuardandoEdicion(false);
		}
	};

	const abrirPago = () => {
		if (!reservaDetalle) return;
		setPagoForm({
			estadoPago: reservaDetalle.estadoPago || "pendiente",
			metodoPago: reservaDetalle.metodoPago || "",
			pagoId: reservaDetalle.pagoId || "",
			pagoMonto: String(reservaDetalle.pagoMonto || reservaDetalle.montoTotal || ""),
		});
		setShowPago(true);
	};

	const guardarPago = async () => {
		if (!reservaDetalle) return;
		try {
			setGuardandoPago(true);
			const response = await authenticatedFetch(
				`/api/admin/traslados-hoteles/reservas/${reservaDetalle.id}/pago`,
				{ method: "PATCH", body: JSON.stringify({
					estadoPago: pagoForm.estadoPago,
					metodoPago: pagoForm.metodoPago || null,
					pagoId: pagoForm.pagoId || null,
					pagoMonto: Number(pagoForm.pagoMonto) || null,
				}) },
			);
			const data = await response.json();
			if (!response.ok) throw new Error(data.error || "Error actualizando pago.");
			toast.success("Pago actualizado.");
			setShowPago(false);
			await fetchDetalle(reservaDetalle.id);
			await fetchReservas();
		} catch (error) {
			toast.error(error.message || "Error actualizando pago.");
		} finally {
			setGuardandoPago(false);
		}
	};

	// ── Crear reserva desde admin ────────────────────────────────────────────
	const abrirCrear = () => {
		setCrearForm({ ...RESERVA_FORM_INICIAL, hotelCodigo: hotelesFiltro[0]?.codigo || "" });
		setShowCrear(true);
	};

	const guardarCrear = async () => {
		try {
			setGuardandoCrear(true);
			const f = crearForm;
			const payload = {
				nombre: f.nombre, email: f.email, telefono: f.telefono,
				hotelCodigo: f.hotelCodigo, origenTipo: f.origenTipo, tipoServicio: f.tipoServicio,
				fechaIda: f.fechaIda, horaIda: f.horaIda,
				fechaVuelta: f.tipoServicio === "ida_vuelta" ? f.fechaVuelta : null,
				horaVuelta: f.tipoServicio === "ida_vuelta" ? f.horaVuelta : null,
				pasajeros: Number(f.pasajeros) || 1,
				sillaInfantil: f.sillaInfantil,
				cantidadSillasInfantiles: f.sillaInfantil ? Number(f.cantidadSillasInfantiles) || 0 : 0,
				observaciones: f.observaciones,
				montoTotal: Number(f.montoTotal) || undefined,
			};
			const response = await authenticatedFetch(
				"/api/admin/traslados-hoteles/reservas",
				{ method: "POST", body: JSON.stringify(payload) },
			);
			const data = await response.json();
			if (!response.ok) throw new Error(data.error || "Error creando reserva.");
			toast.success(`Reserva creada: ${data.reserva?.codigoReserva}`);
			setShowCrear(false);
			await fetchReservas();
		} catch (error) {
			toast.error(error.message || "Error creando reserva.");
		} finally {
			setGuardandoCrear(false);
		}
	};

	// ── Exportar CSV ─────────────────────────────────────────────────────────
	const exportarCSV = () => {
		if (reservas.length === 0) { toast.error("No hay reservas para exportar."); return; }
		const encabezado = ["Código", "Cliente", "Email", "Teléfono", "Hotel", "Origen", "Destino",
			"Tipo", "Fecha Ida", "Hora Ida", "Fecha Vuelta", "Hora Vuelta",
			"Pasajeros", "Monto", "Estado", "Estado Pago", "Fuente", "Creada"].join(";");
		const filas = reservas.map((r) => [
			r.codigoReserva, r.nombre, r.email, r.telefono, r.hotelNombre,
			r.origen, r.destino, r.tipoServicio, r.fechaIda, formatearHora(r.horaIda),
			r.fechaVuelta || "", formatearHora(r.horaVuelta),
			r.pasajeros, r.montoTotal, r.estado, r.estadoPago, r.source,
			new Date(r.created_at || r.createdAt).toLocaleDateString("es-CL"),
		].join(";"));
		const csv = [encabezado, ...filas].join("\n");
		const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `reservas-hoteles-${new Date().toISOString().slice(0, 10)}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	};

	// ── Handlers hoteles catálogo ────────────────────────────────────────────
	const abrirCrearHotel = () => { setHotelEditando(null); setHotelForm(HOTEL_INICIAL); setShowHotelDialog(true); };
	const abrirEditarHotel = (hotel) => {
		setHotelEditando(hotel);
		setHotelForm({
			nombre: hotel.nombre || "", comuna: hotel.comuna || "", codigo: hotel.codigo || "",
			tarifaSoloIda: String(hotel.tarifaSoloIda ?? ""),
			tarifaIdaVuelta: String(hotel.tarifaIdaVuelta ?? ""),
			orden: String(hotel.orden ?? 0), activo: Boolean(hotel.activo),
		});
		setShowHotelDialog(true);
	};

	const guardarHotel = async () => {
		const payload = {
			nombre: hotelForm.nombre?.trim(), comuna: hotelForm.comuna?.trim(), codigo: hotelForm.codigo?.trim(),
			tarifaSoloIda: Number(hotelForm.tarifaSoloIda), tarifaIdaVuelta: Number(hotelForm.tarifaIdaVuelta),
			orden: Number.parseInt(hotelForm.orden, 10) || 0, activo: Boolean(hotelForm.activo),
		};
		if (!payload.nombre || !payload.comuna) { toast.error("Nombre y comuna son obligatorios."); return; }
		if (!payload.tarifaSoloIda || !payload.tarifaIdaVuelta || payload.tarifaSoloIda <= 0 || payload.tarifaIdaVuelta <= 0) {
			toast.error("Las tarifas deben ser mayores a 0."); return;
		}
		if (payload.tarifaIdaVuelta < payload.tarifaSoloIda) {
			toast.error("La tarifa ida y vuelta no puede ser menor que la tarifa solo ida."); return;
		}
		try {
			setGuardandoHotel(true);
			const url = hotelEditando ? `/api/admin/traslados-hoteles/hoteles/${hotelEditando.id}` : "/api/admin/traslados-hoteles/hoteles";
			const response = await authenticatedFetch(url, { method: hotelEditando ? "PUT" : "POST", body: JSON.stringify(payload) });
			const data = await response.json();
			if (!response.ok) throw new Error(data.error || "No se pudo guardar el hotel.");
			toast.success(hotelEditando ? "Hotel actualizado." : "Hotel creado.");
			setShowHotelDialog(false);
			await Promise.all([fetchHoteles(), fetchReservas()]);
		} catch (error) {
			toast.error(error.message || "No se pudo guardar el hotel.");
		} finally {
			setGuardandoHotel(false);
		}
	};

	const alternarActivoHotel = async (hotel) => {
		try {
			const response = await authenticatedFetch(`/api/admin/traslados-hoteles/hoteles/${hotel.id}`, {
				method: "PUT",
				body: JSON.stringify({ nombre: hotel.nombre, comuna: hotel.comuna, codigo: hotel.codigo,
					tarifaSoloIda: Number(hotel.tarifaSoloIda), tarifaIdaVuelta: Number(hotel.tarifaIdaVuelta),
					orden: Number(hotel.orden || 0), activo: !hotel.activo }),
			});
			const data = await response.json();
			if (!response.ok) throw new Error(data.error || "Error actualizando hotel.");
			toast.success(`Hotel ${hotel.activo ? "desactivado" : "activado"}.`);
			await Promise.all([fetchHoteles(), fetchReservas()]);
		} catch (error) {
			toast.error(error.message || "No se pudo actualizar el hotel.");
		}
	};

	// ── Render ───────────────────────────────────────────────────────────────
	return (
		<div className="space-y-6">
			{/* Encabezado */}
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h2 className="text-2xl font-bold text-gray-900">Traslados Aeropuerto-Hoteles</h2>
					<p className="text-sm text-muted-foreground">Gestión de reservas, catálogo de hoteles y tarifas.</p>
				</div>
				<Button variant="outline" onClick={() => { fetchReservas(); fetchHoteles(); }} disabled={loading || loadingHoteles}>
					<RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
					Actualizar
				</Button>
			</div>

			{/* Cards resumen — Cotizadores clickeables como filtro rápido */}
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
				{/* Cotizadores */}
				<button
					type="button"
					className="sm:col-span-2 xl:col-span-2 text-left w-full"
					onClick={() => actualizarFiltro("source", filtros.source === "cotizador" ? "todos" : "cotizador")}
				>
					<Card className={`cursor-pointer border-2 transition-colors h-full ${filtros.source === "cotizador" ? "border-orange-400 bg-orange-50" : "border-transparent hover:border-orange-200"}`}>
						<CardContent className="pt-6">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-xs uppercase tracking-wide text-muted-foreground">Cotizadores</p>
									<p className="text-2xl font-semibold mt-1 text-orange-600">{totalCotizadores}</p>
									<p className="text-xs text-muted-foreground mt-0.5">sin pago aún</p>
								</div>
								<div className="rounded-full p-2 bg-orange-100 text-orange-600"><TrendingUp className="h-5 w-5" /></div>
							</div>
						</CardContent>
					</Card>
				</button>
				{/* Reservas confirmadas */}
				<button
					type="button"
					className="sm:col-span-2 xl:col-span-2 text-left w-full"
					onClick={() => actualizarFiltro("source", filtros.source === "web_hoteles" ? "todos" : "web_hoteles")}
				>
					<Card className={`cursor-pointer border-2 transition-colors h-full ${filtros.source === "web_hoteles" ? "border-emerald-400 bg-emerald-50" : "border-transparent hover:border-emerald-200"}`}>
						<CardContent className="pt-6">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-xs uppercase tracking-wide text-muted-foreground">Con pago</p>
									<p className="text-2xl font-semibold mt-1 text-emerald-600">{totalReservasConfirmadas}</p>
									<p className="text-xs text-muted-foreground mt-0.5">pago recibido</p>
								</div>
								<div className="rounded-full p-2 bg-emerald-100 text-emerald-600"><CheckCircle className="h-5 w-5" /></div>
							</div>
						</CardContent>
					</Card>
				</button>
				<TarjetaResumen titulo="Pendientes" valor={resumen.pendiente} icon={Clock} color="text-amber-600" />
				<TarjetaResumen titulo="Confirmadas" valor={resumen.confirmada} icon={CheckCircle} color="text-blue-600" />
				<TarjetaResumen titulo="Completadas" valor={resumen.completada} icon={CheckCircle} color="text-emerald-600" />
				<TarjetaResumen titulo="Canceladas" valor={resumen.cancelada} icon={XCircle} color="text-rose-600" />
				<TarjetaResumen titulo="Total" valor={resumen.total} icon={Plane} color="text-primary" />
				<TarjetaResumen titulo="Monto (página)" valor={formatearCLP(totalFacturado)} icon={CircleDollarSign} color="text-violet-600" />
			</div>

			{/* Tabs */}
			<Tabs defaultValue="reservas">
				<TabsList>
					<TabsTrigger value="reservas">Reservas</TabsTrigger>
					<TabsTrigger value="hoteles">Catálogo de Hoteles</TabsTrigger>
				</TabsList>

				{/* ── Tab Reservas ── */}
				<TabsContent value="reservas" className="space-y-4 mt-4">
					{/* Filtros */}
					<Card>
						<CardContent className="pt-4">
							<div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
								<div className="xl:col-span-2 space-y-1">
									<Label>Buscar</Label>
									<Input value={filtros.q} onChange={(e) => actualizarFiltro("q", e.target.value)} placeholder="Código, nombre, email, teléfono" />
								</div>
								<div className="space-y-1">
									<Label>Estado reserva</Label>
									<Select value={filtros.estado} onValueChange={(v) => actualizarFiltro("estado", v)}>
										<SelectTrigger><SelectValue /></SelectTrigger>
										<SelectContent>
											<SelectItem value="todos">Todos los estados</SelectItem>
											{ESTADOS.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-1">
									<Label>Estado pago</Label>
									<Select value={filtros.estadoPago} onValueChange={(v) => actualizarFiltro("estadoPago", v)}>
										<SelectTrigger><SelectValue /></SelectTrigger>
										<SelectContent>
											<SelectItem value="todos">Todos</SelectItem>
											{ESTADOS_PAGO.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-1">
									<Label>Tipo</Label>
									<Select value={filtros.source} onValueChange={(v) => actualizarFiltro("source", v)}>
										<SelectTrigger><SelectValue /></SelectTrigger>
										<SelectContent>
											<SelectItem value="todos">Todos</SelectItem>
											{SOURCES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-1">
									<Label>Hotel</Label>
									<Select value={filtros.hotelCodigo} onValueChange={(v) => actualizarFiltro("hotelCodigo", v)}>
										<SelectTrigger><SelectValue /></SelectTrigger>
										<SelectContent>
											<SelectItem value="todos">Todos</SelectItem>
											{hotelesFiltro.map((h) => <SelectItem key={h.codigo} value={h.codigo}>{h.nombre}</SelectItem>)}
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-1">
									<Label>Desde</Label>
									<Input type="date" value={filtros.fechaDesde} onChange={(e) => actualizarFiltro("fechaDesde", e.target.value)} />
								</div>
								<div className="space-y-1">
									<Label>Hasta</Label>
									<Input type="date" value={filtros.fechaHasta} onChange={(e) => actualizarFiltro("fechaHasta", e.target.value)} />
								</div>
							</div>
							<div className="flex justify-end mt-3 gap-2">
								<Button variant="ghost" size="sm" onClick={limpiarFiltros}>Limpiar filtros</Button>
							</div>
						</CardContent>
					</Card>

					{/* Acciones */}
					<div className="flex justify-between items-center gap-2 flex-wrap">
						<p className="text-sm text-muted-foreground">
							{total} reserva{total !== 1 ? "s" : ""} · Página {filtros.page} de {totalPages}
						</p>
						<div className="flex gap-2">
							<Button variant="outline" size="sm" onClick={exportarCSV} disabled={reservas.length === 0}>
								<Download className="h-4 w-4 mr-1" /> Exportar CSV
							</Button>
							<Button size="sm" onClick={abrirCrear}>
								<Plus className="h-4 w-4 mr-1" /> Nueva reserva
							</Button>
						</div>
					</div>

					{/* Tabla */}
					<Card>
						<CardContent className="p-0">
							<div className="overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Código / Hotel</TableHead>
											<TableHead>Cliente</TableHead>
											<TableHead>Trayecto</TableHead>
											<TableHead>Ida</TableHead>
											<TableHead>Vuelta</TableHead>
											<TableHead>Pax</TableHead>
											<TableHead>Monto</TableHead>
											<TableHead>Estado</TableHead>
											<TableHead>Pago</TableHead>
											<TableHead>Acciones</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{loading ? (
											<TableRow><TableCell colSpan={10} className="py-10 text-center text-muted-foreground">Cargando reservas...</TableCell></TableRow>
										) : reservas.length === 0 ? (
											<TableRow><TableCell colSpan={10} className="py-10 text-center text-muted-foreground">No hay reservas para los filtros seleccionados.</TableCell></TableRow>
										) : reservas.map((r) => (
											<TableRow
												key={r.id}
												className={`cursor-pointer hover:bg-muted/50 ${r.source === "cotizador" ? "bg-orange-50/40" : ""}`}
												onClick={() => abrirDetalle(r)}
											>
												<TableCell>
													<div className="font-medium text-xs">{r.codigoReserva}</div>
													<div className="text-xs text-muted-foreground">{r.hotelNombre}</div>
													{r.source === "cotizador" && (
														<Badge variant="outline" className="text-[10px] mt-0.5 border-orange-400 text-orange-700 bg-orange-50">
															cotizador
														</Badge>
													)}
													{r.source === "admin" && (
														<Badge variant="outline" className="text-[10px] mt-0.5">admin</Badge>
													)}
												</TableCell>
												<TableCell>
													<div className="font-medium text-sm">{r.nombre}</div>
													<div className="text-xs text-muted-foreground">{r.email}</div>
													<div className="text-xs text-muted-foreground">{r.telefono}</div>
												</TableCell>
												<TableCell>
													<div className="text-xs">{r.origen}</div>
													<div className="text-xs text-muted-foreground">→ {r.destino}</div>
													<Badge variant="outline" className="mt-1 text-[10px]">
														{r.tipoServicio === "ida_vuelta" ? "Ida y vuelta" : "Solo ida"}
													</Badge>
												</TableCell>
												<TableCell className="text-sm">
													<div>{formatearFecha(r.fechaIda)}</div>
													<div className="text-xs text-muted-foreground">{formatearHora(r.horaIda)}</div>
												</TableCell>
												<TableCell className="text-sm">
													{r.fechaVuelta ? (
														<>
															<div>{formatearFecha(r.fechaVuelta)}</div>
															<div className="text-xs text-muted-foreground">{formatearHora(r.horaVuelta)}</div>
														</>
													) : <span className="text-muted-foreground">—</span>}
												</TableCell>
												<TableCell>
													<div>{r.pasajeros}</div>
													{r.sillaInfantil && <div className="text-[10px] text-muted-foreground">+{r.cantidadSillasInfantiles} silla{r.cantidadSillasInfantiles !== 1 ? "s" : ""}</div>}
												</TableCell>
												<TableCell className="font-medium text-sm">{formatearCLP(r.montoTotal)}</TableCell>
												<TableCell>
													<Badge variant="outline" className={`text-xs ${CLASES_ESTADO[r.estado] || ""}`}>
														{r.estado}
													</Badge>
												</TableCell>
												<TableCell>
													<Badge variant="outline" className={`text-xs ${CLASES_PAGO[r.estadoPago] || ""}`}>
														{r.estadoPago || "pendiente"}
													</Badge>
												</TableCell>
												<TableCell onClick={(e) => e.stopPropagation()}>
													<div className="flex gap-1">
														<Button variant="outline" size="icon" className="h-7 w-7" onClick={() => abrirDetalle(r)} title="Ver detalle">
															<Eye className="h-3.5 w-3.5" />
														</Button>
														<a href={`https://wa.me/${String(r.telefono).replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">
															<Button variant="outline" size="icon" className="h-7 w-7 text-emerald-600" title="WhatsApp">
																<MessageCircle className="h-3.5 w-3.5" />
															</Button>
														</a>
													</div>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
						</CardContent>
					</Card>

					{/* Paginación */}
					<div className="flex items-center justify-end gap-2">
						<Button variant="outline" size="sm" disabled={filtros.page <= 1 || loading} onClick={() => actualizarFiltro("page", filtros.page - 1)}>Anterior</Button>
						<span className="text-sm text-muted-foreground px-2">{filtros.page} / {totalPages}</span>
						<Button variant="outline" size="sm" disabled={filtros.page >= totalPages || loading} onClick={() => actualizarFiltro("page", filtros.page + 1)}>Siguiente</Button>
					</div>
				</TabsContent>

				{/* ── Tab Hoteles ── */}
				<TabsContent value="hoteles" className="mt-4">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between">
							<CardTitle className="text-base">Catálogo de hoteles y tarifas</CardTitle>
							<Button size="sm" onClick={abrirCrearHotel}>
								<Plus className="h-4 w-4 mr-1" /> Nuevo hotel
							</Button>
						</CardHeader>
						<CardContent>
							<div className="overflow-x-auto rounded-md border">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Orden</TableHead>
											<TableHead>Hotel</TableHead>
											<TableHead>Comuna</TableHead>
											<TableHead>Código</TableHead>
											<TableHead>Solo ida</TableHead>
											<TableHead>Ida y vuelta</TableHead>
											<TableHead>Activo</TableHead>
											<TableHead>Acciones</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{loadingHoteles ? (
											<TableRow><TableCell colSpan={8} className="py-8 text-center text-muted-foreground">Cargando catálogo...</TableCell></TableRow>
										) : catalogoHoteles.length === 0 ? (
											<TableRow><TableCell colSpan={8} className="py-8 text-center text-muted-foreground">No hay hoteles en el catálogo.</TableCell></TableRow>
										) : catalogoHoteles.map((hotel) => (
											<TableRow key={hotel.id}>
												<TableCell>{hotel.orden}</TableCell>
												<TableCell className="font-medium">{hotel.nombre}</TableCell>
												<TableCell>{hotel.comuna}</TableCell>
												<TableCell className="text-xs text-muted-foreground">{hotel.codigo}</TableCell>
												<TableCell>{formatearCLP(hotel.tarifaSoloIda)}</TableCell>
												<TableCell>{formatearCLP(hotel.tarifaIdaVuelta)}</TableCell>
												<TableCell>
													<div className="flex items-center gap-2">
														<Switch checked={Boolean(hotel.activo)} onCheckedChange={() => alternarActivoHotel(hotel)} />
														<Badge variant="outline">{hotel.activo ? "Activo" : "Inactivo"}</Badge>
													</div>
												</TableCell>
												<TableCell>
													<Button variant="outline" size="sm" onClick={() => abrirEditarHotel(hotel)}>
														<Pencil className="h-3.5 w-3.5 mr-1" /> Editar
													</Button>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>

			{/* ── Modal: Detalle de reserva ── */}
			<Dialog open={showDetalle} onOpenChange={(open) => { setShowDetalle(open); if (!open) { setModoEdicion(false); setReservaDetalle(null); } }}>
				<DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<Plane className="h-5 w-5" />
							{reservaDetalle?.codigoReserva || "Detalle de reserva"}
						</DialogTitle>
						<DialogDescription>
							Revisa la información completa del traslado, actualiza su estado y gestiona el pago desde este panel.
						</DialogDescription>
					</DialogHeader>

					{reservaDetalle && !modoEdicion && (
						<div className="space-y-5">
							{/* Banner de cotizador */}
							{reservaDetalle.source === "cotizador" && (
								<div className="flex items-center justify-between rounded-lg border border-orange-300 bg-orange-50 px-4 py-3">
									<div className="flex items-center gap-2">
										<TrendingUp className="h-4 w-4 text-orange-600 shrink-0" />
										<div>
											<p className="text-sm font-semibold text-orange-800">Lead / Cotizador</p>
											<p className="text-xs text-orange-600">Formulario web sin pago confirmado</p>
										</div>
									</div>
									<Button
										size="sm"
										variant="outline"
										className="border-emerald-400 text-emerald-700 hover:bg-emerald-50 ml-3 shrink-0"
										disabled={updatingId === reservaDetalle.id}
										onClick={async () => {
											try {
												setUpdatingId(reservaDetalle.id);
												const resp = await authenticatedFetch(
													`/api/admin/traslados-hoteles/reservas/${reservaDetalle.id}`,
													{ method: "PUT", body: JSON.stringify({ source: "web_hoteles" }) },
												);
												const d = await resp.json();
												if (!resp.ok) throw new Error(d.error);
												toast.success("Convertido a reserva confirmada.");
												setReservaDetalle((prev) => ({ ...prev, source: "web_hoteles" }));
												await fetchReservas();
											} catch (e) {
												toast.error(e.message || "Error al convertir.");
											} finally {
												setUpdatingId(null);
											}
										}}
									>
										<CheckCircle className="h-3.5 w-3.5 mr-1" />
										Confirmar
									</Button>
								</div>
							)}

							{/* Badges de estado */}
							<div className="flex flex-wrap gap-2">
								<Badge variant="outline" className={`${CLASES_ESTADO[reservaDetalle.estado] || ""}`}>
									{reservaDetalle.estado}
								</Badge>
								<Badge variant="outline" className={`${CLASES_PAGO[reservaDetalle.estadoPago] || ""}`}>
									Pago: {reservaDetalle.estadoPago || "pendiente"}
								</Badge>
								{reservaDetalle.source === "admin" && <Badge variant="secondary">Creada por admin</Badge>}
							</div>

							<Separator />

							{/* Cliente */}
							<div>
								<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Cliente</p>
								<div className="grid grid-cols-2 md:grid-cols-3 gap-3">
									<CampoDetalle label="Nombre">{reservaDetalle.nombre}</CampoDetalle>
									<CampoDetalle label="Email">{reservaDetalle.email}</CampoDetalle>
									<CampoDetalle label="Teléfono">{reservaDetalle.telefono}</CampoDetalle>
								</div>
							</div>

							<Separator />

							{/* Viaje */}
							<div>
								<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Viaje</p>
								<div className="grid grid-cols-2 md:grid-cols-3 gap-3">
									<CampoDetalle label="Hotel">{reservaDetalle.hotelNombre}</CampoDetalle>
									<CampoDetalle label="Tipo">{reservaDetalle.tipoServicio === "ida_vuelta" ? "Ida y vuelta" : "Solo ida"}</CampoDetalle>
									<CampoDetalle label="Origen">{labelOrigen(reservaDetalle.origenTipo)}</CampoDetalle>
									<CampoDetalle label="Desde">{reservaDetalle.origen}</CampoDetalle>
									<CampoDetalle label="Hacia">{reservaDetalle.destino}</CampoDetalle>
									<CampoDetalle label="Pasajeros">{reservaDetalle.pasajeros}</CampoDetalle>
									<CampoDetalle label="Fecha ida">{formatearFecha(reservaDetalle.fechaIda)}</CampoDetalle>
									<CampoDetalle label="Hora ida">{formatearHora(reservaDetalle.horaIda)}</CampoDetalle>
									{reservaDetalle.tipoServicio === "ida_vuelta" && (
										<>
											<CampoDetalle label="Fecha vuelta">{formatearFecha(reservaDetalle.fechaVuelta)}</CampoDetalle>
											<CampoDetalle label="Hora vuelta">{formatearHora(reservaDetalle.horaVuelta)}</CampoDetalle>
										</>
									)}
									{reservaDetalle.sillaInfantil && (
										<CampoDetalle label="Sillas infantiles">{reservaDetalle.cantidadSillasInfantiles}</CampoDetalle>
									)}
								</div>
							</div>

							<Separator />

							{/* Pago */}
							<div>
								<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Pago</p>
								<div className="grid grid-cols-2 md:grid-cols-3 gap-3">
									<CampoDetalle label="Monto total">{formatearCLP(reservaDetalle.montoTotal)}</CampoDetalle>
									<CampoDetalle label="Estado pago">{reservaDetalle.estadoPago || "pendiente"}</CampoDetalle>
									<CampoDetalle label="Método">{reservaDetalle.metodoPago}</CampoDetalle>
									<CampoDetalle label="Gateway">{reservaDetalle.pagoGateway}</CampoDetalle>
									<CampoDetalle label="ID pago">{reservaDetalle.pagoId}</CampoDetalle>
									<CampoDetalle label="Monto pagado">{reservaDetalle.pagoMonto ? formatearCLP(reservaDetalle.pagoMonto) : "—"}</CampoDetalle>
								</div>
							</div>

							{reservaDetalle.observaciones && (
								<>
									<Separator />
									<div>
										<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Observaciones</p>
										<p className="text-sm whitespace-pre-wrap">{reservaDetalle.observaciones}</p>
									</div>
								</>
							)}

							{/* Cambiar estado */}
							<Separator />
							<div>
								<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Cambiar estado de reserva</p>
								<div className="flex flex-wrap gap-2">
									{ESTADOS.map((e) => (
										<Button key={e} size="sm" variant={reservaDetalle.estado === e ? "default" : "outline"}
											disabled={updatingId === reservaDetalle.id || reservaDetalle.estado === e}
											onClick={() => cambiarEstado(reservaDetalle.id, e)}>
											{e}
										</Button>
									))}
								</div>
							</div>
						</div>
					)}

					{/* Modo edición */}
					{reservaDetalle && modoEdicion && (
						<div className="space-y-4">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
								<div className="space-y-1"><Label>Nombre</Label><Input value={editForm.nombre} onChange={(e) => setEditForm((p) => ({ ...p, nombre: e.target.value }))} /></div>
								<div className="space-y-1"><Label>Email</Label><Input value={editForm.email} onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))} /></div>
								<div className="space-y-1"><Label>Teléfono</Label><Input value={editForm.telefono} onChange={(e) => setEditForm((p) => ({ ...p, telefono: e.target.value }))} /></div>
								<div className="space-y-1">
									<Label>Hotel</Label>
									<Select value={editForm.hotelCodigo} onValueChange={(v) => setEditForm((p) => ({ ...p, hotelCodigo: v }))}>
										<SelectTrigger><SelectValue /></SelectTrigger>
										<SelectContent>{hotelesFiltro.map((h) => <SelectItem key={h.codigo} value={h.codigo}>{h.nombre}</SelectItem>)}</SelectContent>
									</Select>
								</div>
								<div className="space-y-1">
									<Label>Tipo de servicio</Label>
									<Select value={editForm.tipoServicio} onValueChange={(v) => setEditForm((p) => ({ ...p, tipoServicio: v }))}>
										<SelectTrigger><SelectValue /></SelectTrigger>
										<SelectContent>
											<SelectItem value="solo_ida">Solo ida</SelectItem>
											<SelectItem value="ida_vuelta">Ida y vuelta</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-1">
									<Label>Origen</Label>
									<Select value={editForm.origenTipo} onValueChange={(v) => setEditForm((p) => ({ ...p, origenTipo: v }))}>
										<SelectTrigger><SelectValue /></SelectTrigger>
										<SelectContent>
											<SelectItem value="aeropuerto">Aeropuerto</SelectItem>
											<SelectItem value="hotel">Hotel</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-1"><Label>Fecha ida</Label><Input type="date" value={editForm.fechaIda} onChange={(e) => setEditForm((p) => ({ ...p, fechaIda: e.target.value }))} /></div>
								<div className="space-y-1"><Label>Hora ida</Label><Input type="time" value={editForm.horaIda} onChange={(e) => setEditForm((p) => ({ ...p, horaIda: e.target.value }))} /></div>
								{editForm.tipoServicio === "ida_vuelta" && (
									<>
										<div className="space-y-1"><Label>Fecha vuelta</Label><Input type="date" value={editForm.fechaVuelta} onChange={(e) => setEditForm((p) => ({ ...p, fechaVuelta: e.target.value }))} /></div>
										<div className="space-y-1"><Label>Hora vuelta</Label><Input type="time" value={editForm.horaVuelta} onChange={(e) => setEditForm((p) => ({ ...p, horaVuelta: e.target.value }))} /></div>
									</>
								)}
								<div className="space-y-1"><Label>Pasajeros</Label><Input type="number" min="1" max="20" value={editForm.pasajeros} onChange={(e) => setEditForm((p) => ({ ...p, pasajeros: e.target.value }))} /></div>
								<div className="space-y-1"><Label>Monto total (CLP)</Label><Input type="number" value={editForm.montoTotal} onChange={(e) => setEditForm((p) => ({ ...p, montoTotal: e.target.value }))} /></div>
							</div>
							<div className="flex items-center gap-3 p-3 border rounded-lg">
								<Switch checked={editForm.sillaInfantil} onCheckedChange={(v) => setEditForm((p) => ({ ...p, sillaInfantil: v }))} />
								<Label>Silla infantil</Label>
								{editForm.sillaInfantil && (
									<Input type="number" min="0" max="4" className="w-24 ml-2" value={editForm.cantidadSillasInfantiles} onChange={(e) => setEditForm((p) => ({ ...p, cantidadSillasInfantiles: e.target.value }))} placeholder="Cantidad" />
								)}
							</div>
							<div className="space-y-1">
								<Label>Observaciones</Label>
								<Textarea value={editForm.observaciones} onChange={(e) => setEditForm((p) => ({ ...p, observaciones: e.target.value }))} rows={3} placeholder="Notas internas..." />
							</div>
						</div>
					)}

					<DialogFooter className="flex flex-wrap gap-2 justify-between">
						<div className="flex gap-2">
							{!modoEdicion && (
								<>
									<Button variant="outline" size="sm" onClick={iniciarEdicion}><Pencil className="h-3.5 w-3.5 mr-1" />Editar</Button>
									<Button variant="outline" size="sm" onClick={abrirPago}>
										<CreditCard className="h-3.5 w-3.5 mr-1" />Gestionar pago
									</Button>
									{reservaDetalle?.telefono && (
										<a href={`https://wa.me/${String(reservaDetalle.telefono).replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">
											<Button variant="outline" size="sm" className="text-emerald-600">
												<MessageCircle className="h-3.5 w-3.5 mr-1" />WhatsApp
											</Button>
										</a>
									)}
								</>
							)}
							{modoEdicion && (
								<>
									<Button variant="outline" size="sm" onClick={() => setModoEdicion(false)} disabled={guardandoEdicion}>Cancelar</Button>
									<Button size="sm" onClick={guardarEdicion} disabled={guardandoEdicion}>{guardandoEdicion ? "Guardando..." : "Guardar cambios"}</Button>
								</>
							)}
						</div>
						<Button variant="ghost" size="sm" onClick={() => setShowDetalle(false)}>Cerrar</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* ── Modal: Gestión de pago ── */}
			<Dialog open={showPago} onOpenChange={setShowPago}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle><CreditCard className="inline h-4 w-4 mr-1" />Gestionar pago — {reservaDetalle?.codigoReserva}</DialogTitle>
						<DialogDescription>
							Actualiza el estado del pago, el método utilizado y la referencia asociada a esta reserva.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-2">
						<div className="space-y-1">
							<Label>Estado de pago</Label>
							<Select value={pagoForm.estadoPago} onValueChange={(v) => setPagoForm((p) => ({ ...p, estadoPago: v }))}>
								<SelectTrigger><SelectValue /></SelectTrigger>
								<SelectContent>{ESTADOS_PAGO.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
							</Select>
						</div>
						<div className="space-y-1">
							<Label>Método de pago</Label>
							<Input value={pagoForm.metodoPago} onChange={(e) => setPagoForm((p) => ({ ...p, metodoPago: e.target.value }))} placeholder="Ej: transferencia, efectivo, Flow" />
						</div>
						<div className="space-y-1">
							<Label>ID / Referencia de pago</Label>
							<Input value={pagoForm.pagoId} onChange={(e) => setPagoForm((p) => ({ ...p, pagoId: e.target.value }))} placeholder="Número de transacción" />
						</div>
						<div className="space-y-1">
							<Label>Monto recibido (CLP)</Label>
							<Input type="number" value={pagoForm.pagoMonto} onChange={(e) => setPagoForm((p) => ({ ...p, pagoMonto: e.target.value }))} />
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setShowPago(false)} disabled={guardandoPago}>Cancelar</Button>
						<Button onClick={guardarPago} disabled={guardandoPago}>{guardandoPago ? "Guardando..." : "Guardar pago"}</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* ── Modal: Crear reserva (admin) ── */}
			<Dialog open={showCrear} onOpenChange={setShowCrear}>
				<DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle><Plus className="inline h-4 w-4 mr-1" />Nueva reserva (admin)</DialogTitle>
						<DialogDescription>
							Crea manualmente una reserva Aeropuerto-Hoteles con tarifas del catálogo y datos operativos completos.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-2">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
							<div className="space-y-1"><Label>Nombre *</Label><Input value={crearForm.nombre} onChange={(e) => setCrearForm((p) => ({ ...p, nombre: e.target.value }))} /></div>
							<div className="space-y-1"><Label>Email *</Label><Input type="email" value={crearForm.email} onChange={(e) => setCrearForm((p) => ({ ...p, email: e.target.value }))} /></div>
							<div className="space-y-1"><Label>Teléfono *</Label><Input value={crearForm.telefono} onChange={(e) => setCrearForm((p) => ({ ...p, telefono: e.target.value }))} /></div>
							<div className="space-y-1">
								<Label>Hotel *</Label>
								<Select value={crearForm.hotelCodigo} onValueChange={(v) => setCrearForm((p) => ({ ...p, hotelCodigo: v }))}>
									<SelectTrigger><SelectValue placeholder="Selecciona hotel" /></SelectTrigger>
									<SelectContent>{hotelesFiltro.map((h) => <SelectItem key={h.codigo} value={h.codigo}>{h.nombre} — {h.comuna}</SelectItem>)}</SelectContent>
								</Select>
							</div>
							<div className="space-y-1">
								<Label>Origen *</Label>
								<Select value={crearForm.origenTipo} onValueChange={(v) => setCrearForm((p) => ({ ...p, origenTipo: v, tipoServicio: v === "hotel" ? "solo_ida" : p.tipoServicio }))}>
									<SelectTrigger><SelectValue /></SelectTrigger>
									<SelectContent>
										<SelectItem value="aeropuerto">Aeropuerto → Hotel</SelectItem>
										<SelectItem value="hotel">Hotel → Aeropuerto</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-1">
								<Label>Tipo de servicio *</Label>
								<Select value={crearForm.tipoServicio} disabled={crearForm.origenTipo === "hotel"} onValueChange={(v) => setCrearForm((p) => ({ ...p, tipoServicio: v }))}>
									<SelectTrigger><SelectValue /></SelectTrigger>
									<SelectContent>
										<SelectItem value="solo_ida">Solo ida</SelectItem>
										<SelectItem value="ida_vuelta" disabled={crearForm.origenTipo === "hotel"}>Ida y vuelta</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-1"><Label>Fecha ida *</Label><Input type="date" value={crearForm.fechaIda} onChange={(e) => setCrearForm((p) => ({ ...p, fechaIda: e.target.value }))} /></div>
							<div className="space-y-1"><Label>Hora ida *</Label><Input type="time" value={crearForm.horaIda} onChange={(e) => setCrearForm((p) => ({ ...p, horaIda: e.target.value }))} /></div>
							{crearForm.tipoServicio === "ida_vuelta" && (
								<>
									<div className="space-y-1"><Label>Fecha vuelta *</Label><Input type="date" value={crearForm.fechaVuelta} onChange={(e) => setCrearForm((p) => ({ ...p, fechaVuelta: e.target.value }))} /></div>
									<div className="space-y-1"><Label>Hora vuelta *</Label><Input type="time" value={crearForm.horaVuelta} onChange={(e) => setCrearForm((p) => ({ ...p, horaVuelta: e.target.value }))} /></div>
								</>
							)}
							<div className="space-y-1"><Label>Pasajeros</Label><Input type="number" min="1" max="20" value={crearForm.pasajeros} onChange={(e) => setCrearForm((p) => ({ ...p, pasajeros: e.target.value }))} /></div>
							<div className="space-y-1"><Label>Monto total (CLP, opcional)</Label><Input type="number" value={crearForm.montoTotal} onChange={(e) => setCrearForm((p) => ({ ...p, montoTotal: e.target.value }))} placeholder="Automático si se deja vacío" /></div>
						</div>
						<div className="flex items-center gap-3 p-3 border rounded-lg">
							<Switch checked={crearForm.sillaInfantil} onCheckedChange={(v) => setCrearForm((p) => ({ ...p, sillaInfantil: v }))} />
							<Label>Silla infantil</Label>
							{crearForm.sillaInfantil && (
								<Input type="number" min="0" max="4" className="w-24 ml-2" value={crearForm.cantidadSillasInfantiles} onChange={(e) => setCrearForm((p) => ({ ...p, cantidadSillasInfantiles: e.target.value }))} placeholder="Cantidad" />
							)}
						</div>
						<div className="space-y-1">
							<Label>Observaciones</Label>
							<Textarea value={crearForm.observaciones} onChange={(e) => setCrearForm((p) => ({ ...p, observaciones: e.target.value }))} rows={3} placeholder="Notas adicionales..." />
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setShowCrear(false)} disabled={guardandoCrear}>Cancelar</Button>
						<Button onClick={guardarCrear} disabled={guardandoCrear}>{guardandoCrear ? "Creando..." : "Crear reserva"}</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* ── Modal: Hotel ── */}
			<Dialog open={showHotelDialog} onOpenChange={setShowHotelDialog}>
				<DialogContent className="sm:max-w-lg">
					<DialogHeader>
						<DialogTitle>{hotelEditando ? "Editar hotel y tarifas" : "Nuevo hotel y tarifas"}</DialogTitle>
						<DialogDescription>
							Administra el catálogo operativo de hoteles, incluyendo tarifas, orden de visualización y estado de venta.
						</DialogDescription>
					</DialogHeader>
					<div className="grid gap-4 py-2">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
							<div className="space-y-2"><Label>Nombre</Label><Input value={hotelForm.nombre} onChange={(e) => setHotelForm((p) => ({ ...p, nombre: e.target.value }))} placeholder="Ej: Hotel Dreams Araucanía" /></div>
							<div className="space-y-2"><Label>Comuna</Label><Input value={hotelForm.comuna} onChange={(e) => setHotelForm((p) => ({ ...p, comuna: e.target.value }))} placeholder="Ej: Temuco" /></div>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
							<div className="space-y-2"><Label>Código (slug)</Label><Input value={hotelForm.codigo} onChange={(e) => setHotelForm((p) => ({ ...p, codigo: e.target.value }))} placeholder="Ej: dreams-temuco" /></div>
							<div className="space-y-2"><Label>Orden</Label><Input type="number" value={hotelForm.orden} onChange={(e) => setHotelForm((p) => ({ ...p, orden: e.target.value }))} /></div>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
							<div className="space-y-2"><Label>Tarifa solo ida (CLP)</Label><Input type="number" min="1" value={hotelForm.tarifaSoloIda} onChange={(e) => setHotelForm((p) => ({ ...p, tarifaSoloIda: e.target.value }))} /></div>
							<div className="space-y-2"><Label>Tarifa ida y vuelta (CLP)</Label><Input type="number" min="1" value={hotelForm.tarifaIdaVuelta} onChange={(e) => setHotelForm((p) => ({ ...p, tarifaIdaVuelta: e.target.value }))} /></div>
						</div>
						<div className="flex items-center justify-between rounded-lg border p-3">
							<div>
								<p className="text-sm font-medium">Hotel activo en venta</p>
								<p className="text-xs text-muted-foreground">Si está desactivado, no aparece en el formulario público.</p>
							</div>
							<Switch checked={hotelForm.activo} onCheckedChange={(v) => setHotelForm((p) => ({ ...p, activo: v }))} />
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setShowHotelDialog(false)} disabled={guardandoHotel}>Cancelar</Button>
						<Button onClick={guardarHotel} disabled={guardandoHotel}>{guardandoHotel ? "Guardando..." : "Guardar hotel"}</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

export default AdminTrasladosHoteles;
