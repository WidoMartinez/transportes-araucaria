import React, { useState, useEffect, useMemo, useCallback } from "react";
import * as XLSX from "xlsx";
import { formatCurrency } from "../lib/utils";
import { getBackendUrl } from "../lib/backend";
import { useAuth } from "../contexts/AuthContext";
import { useAuthenticatedFetch } from "../hooks/useAuthenticatedFetch";
import { useMediaQuery } from "../hooks/useMediaQuery";

// Hooks
import { useReservas } from "../hooks/useReservas";
import { useCatalogos } from "../hooks/useCatalogos";
import { useAsignacionReserva } from "../hooks/useAsignacionReserva";

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
	FileText,
	Clock,
	CheckCircle2,
	DollarSign,
	TrendingUp,
	Plus,
	RefreshCw,
} from "lucide-react";

// Subcomponents
import { FiltrosReservas } from "./AdminReservas/FiltrosReservas";
import { TablaReservas } from "./AdminReservas/TablaReservas";
import { PaginacionReservas } from "./AdminReservas/PaginacionReservas";

// Modales
import { ModalDetallesReserva } from "./AdminReservas/Modales/ModalDetallesReserva";
import { ModalEdicionReserva } from "./AdminReservas/Modales/ModalEdicionReserva";
import { ModalNuevaReserva } from "./AdminReservas/Modales/ModalNuevaReserva";
import { DialogoAsignacion } from "./AdminReservas/Modales/DialogoAsignacion";
import { DialogoCompletarViaje } from "./AdminReservas/Modales/DialogoCompletarViaje";
import { DialogosAlertas } from "./AdminReservas/Modales/DialogosAlertas";
import { ModalHistorialCliente } from "./AdminReservas/Modales/ModalHistorialCliente";
import { ModalRegistrarPago } from "./AdminReservas/Modales/ModalRegistrarPago";
import { DialogoColumnas } from "./AdminReservas/Modales/DialogoColumnas";
import { DialogoPlanificacion } from "./AdminReservas/Modales/DialogoPlanificacion";

const COLUMN_DEFINITIONS = [
	{ key: "id", label: "ID", defaultVisible: true },
	{ key: "cliente", label: "Cliente", defaultVisible: true },
	{ key: "contacto", label: "Contacto", defaultVisible: true },
	{ key: "rut", label: "RUT", defaultVisible: false },
	{ key: "ruta", label: "Ruta", defaultVisible: true },
	{ key: "direccionOrigen", label: "Dir. Origen", defaultVisible: false },
	{ key: "direccionDestino", label: "Dir. Destino", defaultVisible: false },
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

const COLUMNAS_STORAGE_KEY = "adminReservas_columnasVisibles_v2";

function AdminReservas() {
	const { accessToken } = useAuth();
	const isMobile = useMediaQuery("(max-width: 767px)");
	const apiUrl = getBackendUrl() || "https://transportes-araucaria.onrender.com";

	// --- Hooks de Datos ---
	const hookReservas = useReservas();
	const hookCatalogos = useCatalogos();
	const {
		handleGuardarAsignacion,
		loadingAsignacion,
	} = useAsignacionReserva();

	const {
		reservas,
		reservasFiltradas,
		loading,
		fetchReservas,
		currentPage,
		setCurrentPage,
		totalPages,
		totalReservas,
		itemsPerPage,
		setItemsPerPage,
		searchTerm,
		setSearchTerm,
		estadoFiltro,
		setEstadoFiltro,
		estadoPagoFiltro,
		setEstadoPagoFiltro,
		fechaDesde,
		setFechaDesde,
		fechaHasta,
		setFechaHasta,
		rangoFecha,
		handleRangoFechaChange,
		filtroInteligente,
		setFiltroInteligente,
		sortConfig,
		handleSort,
		isSaving,
		handleSave,
		handleSaveNewReserva,
		handleArchivar,
		handleBulkChangeStatus,
		handleBulkDelete,
		toggleClienteManual,
	} = hookReservas;

	const {
		conductores,
		vehiculos,
		estadisticas,
		destinosCatalog,
	} = hookCatalogos;

	// --- Estados Locales UI ---
	const [selectedReserva, setSelectedReserva] = useState(null);
	const [showEditDialog, setShowEditDialog] = useState(false);
	const [showDetailDialog, setShowDetailDialog] = useState(false);
	const [showNewDialog, setShowNewDialog] = useState(false);
	const [showAsignarDialog, setShowAsignarDialog] = useState(false);
	const [showHistorialDialog, setShowHistorialDialog] = useState(false);
	const [showRegisterPayment, setShowRegisterPayment] = useState(false);
	const [showCalendarDialog, setShowCalendarDialog] = useState(false);
	const [showCompletarDialog, setShowCompletarDialog] = useState(false);
	
	const [historialCliente, setHistorialCliente] = useState(null);
	const [selectedReservas, setSelectedReservas] = useState([]);
	
	// Pago Manual
	const [regPagoMonto, setRegPagoMonto] = useState("");
	const [regPagoMetodo, setRegPagoMetodo] = useState("efectivo");
	const [regPagoReferencia, setRegPagoReferencia] = useState("");
	
	// Planificación
	const [calendarStartDate, setCalendarStartDate] = useState("");
	const [calendarEndDate, setCalendarEndDate] = useState("");
	const [generatingCalendar, setGeneratingCalendar] = useState(false);

	// Columnas
	const [columnasVisibles, setColumnasVisibles] = useState(() => {
		try {
			const raw = localStorage.getItem(COLUMNAS_STORAGE_KEY);
			if (!raw) return { ...DEFAULT_COLUMNAS_VISIBLES };
			const parsed = JSON.parse(raw);
			return { ...DEFAULT_COLUMNAS_VISIBLES, ...parsed };
		} catch {
			return { ...DEFAULT_COLUMNAS_VISIBLES };
		}
	});

	// --- Handlers Locales ---
	const handleViewDetails = useCallback((reserva) => {
		setSelectedReserva(reserva);
		setShowDetailDialog(true);
	}, []);

	const handleEdit = useCallback((reserva) => {
		setSelectedReserva(reserva);
		setShowEditDialog(true);
	}, []);

	const handleAsignar = useCallback((reserva) => {
		setSelectedReserva(reserva);
		setShowAsignarDialog(true);
	}, []);

	const handleCompletar = useCallback((reserva) => {
		setSelectedReserva(reserva);
		setShowCompletarDialog(true);
	}, []);

	const verHistorialCliente = useCallback(async (clienteId) => {
		try {
			const resp = await fetch(`${apiUrl}/api/clientes/${clienteId}/historial`);
			if (resp.ok) {
				const data = await resp.json();
				setHistorialCliente(data);
				setShowHistorialDialog(true);
			}
		} catch (error) {
			console.error("Error al cargar historial:", error);
		}
	}, [apiUrl]);

	const handleRegistrarPago = async () => {
		if (!selectedReserva) return;
		try {
			const resp = await fetch(`${apiUrl}/api/reservas/${selectedReserva.id}/pagos`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${accessToken}`,
				},
				body: JSON.stringify({
					amount: Number(regPagoMonto) || 0,
					metodo: regPagoMetodo,
					referencia: regPagoReferencia,
				}),
			});
			if (!resp.ok) throw new Error("Error registrando pago");
			setShowRegisterPayment(false);
			setRegPagoMonto("");
			setRegPagoMetodo("efectivo");
			setRegPagoReferencia("");
			await fetchReservas();
		} catch (e) {
			alert("Error registrando pago: " + e.message);
		}
	};

	const handleGenerarCalendario = async () => {
		if (!calendarStartDate || !calendarEndDate) {
			alert("Selecciona un rango de fechas");
			return;
		}
		setGeneratingCalendar(true);
		try {
			const url = `${apiUrl}/api/planificacion-print?fecha_inicio=${calendarStartDate}&fecha_termino=${calendarEndDate}`;
			window.open(url, "_blank");
			setShowCalendarDialog(false);
		} catch (error) {
			console.error("Error al generar planificación:", error);
		} finally {
			setGeneratingCalendar(false);
		}
	};

	const exportarSeleccionadosXLS = () => {
		const columnasExportar = [
			{ key: "id", label: "ID Reserva" },
			{ key: "nombre", label: "Nombre" },
			{ key: "email", label: "Correo" },
			{ key: "telefono", label: "Teléfono" },
			{ key: "rut", label: "RUT" },
			{ key: "fecha", label: "Fecha" },
			{ key: "hora", label: "Hora" },
			{ key: "origen", label: "Origen" },
			{ key: "destino", label: "Destino" },
			{ key: "totalConDescuento", label: "Total" },
			{ key: "estado", label: "Estado" },
		];

		const seleccionObjs = reservas.filter((r) => selectedReservas.includes(r.id));
		const data = seleccionObjs.map((reserva) => {
			const item = {};
			columnasExportar.forEach((col) => {
				item[col.label] = reserva[col.key] || "";
			});
			return item;
		});

		const ws = XLSX.utils.json_to_sheet(data);
		const wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, "Reservas");
		XLSX.writeFile(wb, `reservas_seleccionadas_${new Date().toISOString().split("T")[0]}.xlsx`);
	};

	// --- Helpers de Renderizado ---
	const getEstadoBadge = (estado) => {
		const colors = {
			pendiente: "bg-yellow-100 text-yellow-800",
			confirmada: "bg-green-100 text-green-800",
			completada: "bg-blue-100 text-blue-800",
			cancelada: "bg-red-100 text-red-800",
		};
		return <Badge className={colors[estado] || "bg-gray-100"}>{estado}</Badge>;
	};

	const getEstadoPagoBadge = (reserva) => {
		const saldo = reserva.saldoPendiente || 0;
		if (saldo <= 0) return <Badge className="bg-green-100 text-green-800">Pagado</Badge>;
		if (reserva.pagoMonto > 0) return <Badge className="bg-orange-100 text-orange-800">Parcial</Badge>;
		return <Badge className="bg-red-100 text-red-800">Pendiente</Badge>;
	};

	const formatDate = (date) => (date ? new Date(date + "T00:00:00").toLocaleDateString("es-CL") : "-");

	if (loading && reservas.length === 0) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="text-center">
					<RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-chocolate-600" />
					<p className="text-muted-foreground">Cargando reservas...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Encabezado */}
			<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
				<div>
					<h2 className="text-3xl font-bold text-chocolate-950">Gestión de Reservas</h2>
					<p className="text-muted-foreground">Administra viajes, asignaciones y pagos centralizados.</p>
				</div>
				<Button onClick={() => setShowNewDialog(true)} className="gap-2 h-12 bg-chocolate-600 hover:bg-chocolate-700 shadow-lg">
					<Plus className="w-5 h-5" />
					Nueva Reserva
				</Button>
			</div>

			{/* Estadísticas */}
			<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 mb-6">
				<CardStats label="Total Reservas" value={estadisticas.totalReservas} icon={<FileText className="w-5 h-5 text-chocolate-500" />} />
				<CardStats label="Pendientes" value={estadisticas.reservasPendientes} icon={<Clock className="w-5 h-5 text-yellow-500" />} />
				<CardStats label="Confirmadas" value={estadisticas.reservasConfirmadas} icon={<CheckCircle2 className="w-5 h-5 text-green-500" />} />
				<CardStats label="Pagadas" value={estadisticas.reservasPagadas} icon={<DollarSign className="w-5 h-5 text-emerald-600" />} />
				<CardStats label="Ingresos Totales" value={formatCurrency(estadisticas.totalIngresos)} icon={<TrendingUp className="w-5 h-5 text-emerald-600" />} />
			</div>

			{/* Filtros */}
			<FiltrosReservas
				searchTerm={searchTerm}
				setSearchTerm={setSearchTerm}
				rangoFecha={rangoFecha}
				handleRangoFechaChange={handleRangoFechaChange}
				fechaDesde={fechaDesde}
				setFechaDesde={setFechaDesde}
				fechaHasta={fechaHasta}
				setFechaHasta={setFechaHasta}
				filtroInteligente={filtroInteligente}
				setFiltroInteligente={setFiltroInteligente}
				estadoFiltro={estadoFiltro}
				setEstadoFiltro={setEstadoFiltro}
				estadoPagoFiltro={estadoPagoFiltro}
				setEstadoPagoFiltro={setEstadoPagoFiltro}
				reservasFiltradasLength={reservasFiltradas.length}
				totalReservas={totalReservas}
				setCurrentPage={setCurrentPage}
			/>

			{/* Listado */}
			<Card className="border-none shadow-xl bg-white/50 backdrop-blur-sm overflow-hidden">
				<CardHeader className="flex flex-row items-center justify-between border-b bg-gray-50/50">
					<div>
						<CardTitle className="text-xl">Lista de Reservas</CardTitle>
						<p className="text-sm text-muted-foreground">Visualiza y gestiona el flujo de trabajo diario.</p>
					</div>
					<div className="flex gap-2">
						<Button variant="outline" size="sm" onClick={() => setShowCalendarDialog(true)} className="border-chocolate-200 hover:bg-chocolate-50">
							Planificación
						</Button>
						<DialogoColumnas
							columnasVisibles={columnasVisibles}
							setColumnasVisibles={setColumnasVisibles}
							COLUMN_DEFINITIONS={COLUMN_DEFINITIONS}
							DEFAULT_COLUMNAS_VISIBLES={DEFAULT_COLUMNAS_VISIBLES}
							COLUMNAS_STORAGE_KEY={COLUMNAS_STORAGE_KEY}
						/>
					</div>
				</CardHeader>
				<CardContent className="p-0">
					{/* Acciones Masivas */}
					{selectedReservas.length > 0 && (
						<div className="bg-chocolate-50 px-6 py-3 border-b flex justify-between items-center animate-in fade-in slide-in-from-top-2">
							<span className="text-sm font-medium text-chocolate-800">{selectedReservas.length} reservas seleccionadas</span>
							<div className="flex gap-2">
								<Button size="sm" variant="outline" onClick={exportarSeleccionadosXLS}>Exportar Excel</Button>
								<Button size="sm" variant="destructive" onClick={() => handleBulkDelete(selectedReservas)}>Eliminar</Button>
							</div>
						</div>
					)}

					<TablaReservas
						reservasFiltradas={reservasFiltradas}
						selectedReservas={selectedReservas}
						toggleSelectAll={() => setSelectedReservas(selectedReservas.length ? [] : reservasFiltradas.map(r => r.id))}
						toggleSelectReserva={(id) => setSelectedReservas(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])}
						columnasVisibles={columnasVisibles}
						handleSort={handleSort}
						getEstadoBadge={getEstadoBadge}
						getEstadoPagoBadge={getEstadoPagoBadge}
						formatDate={formatDate}
						formatCurrency={formatCurrency}
						verHistorialCliente={verHistorialCliente}
						handleViewDetails={handleViewDetails}
						handleEdit={handleEdit}
						handleAsignar={handleAsignar}
						handleCompletar={handleCompletar}
						handleArchivar={handleArchivar}
						toggleClienteManual={toggleClienteManual}
						isAsignada={(r) => !!r.vehiculoId || !!r.conductorId}
					/>

					<div className="px-6 py-4 border-t bg-gray-50/30">
						<PaginacionReservas
							currentPage={currentPage}
							setCurrentPage={setCurrentPage}
							totalPages={totalPages}
							totalReservas={totalReservas}
							itemsPerPage={itemsPerPage}
							setItemsPerPage={setItemsPerPage}
						/>
					</div>
				</CardContent>
			</Card>

			{/* Modales */}
			<ModalDetallesReserva
				open={showDetailDialog}
				onOpenChange={setShowDetailDialog}
				selectedReserva={selectedReserva}
				formatDate={formatDate}
				formatCurrency={formatCurrency}
			/>
			
			<ModalEdicionReserva
				open={showEditDialog}
				onOpenChange={setShowEditDialog}
				selectedReserva={selectedReserva}
				isSaving={isSaving}
				handleSave={handleSave}
			/>

			<ModalNuevaReserva
				open={showNewDialog}
				onOpenChange={setShowNewDialog}
				handleSave={handleSaveNewReserva}
				isSaving={isSaving}
				destinosCatalog={destinosCatalog}
			/>

			<DialogoAsignacion
				open={showAsignarDialog}
				onOpenChange={setShowAsignarDialog}
				selectedReserva={selectedReserva}
				conductores={conductores}
				vehiculos={vehiculos}
				onSave={handleGuardarAsignacion}
				loading={loadingAsignacion}
			/>

			<DialogoCompletarViaje
				open={showCompletarDialog}
				onOpenChange={setShowCompletarDialog}
				reserva={selectedReserva}
				onSuccess={fetchReservas}
			/>

			<DialogoPlanificacion
				open={showCalendarDialog}
				onOpenChange={setShowCalendarDialog}
				calendarStartDate={calendarStartDate}
				setCalendarStartDate={setCalendarStartDate}
				calendarEndDate={calendarEndDate}
				setCalendarEndDate={setCalendarEndDate}
				handleGenerarCalendario={handleGenerarCalendario}
				generatingCalendar={generatingCalendar}
			/>

			<ModalHistorialCliente
				open={showHistorialDialog}
				onOpenChange={setShowHistorialDialog}
				historialCliente={historialCliente}
				formatCurrency={formatCurrency}
				handleViewDetails={handleViewDetails}
				getEstadoBadge={getEstadoBadge}
				getEstadoPagoBadge={getEstadoPagoBadge}
				formatDate={formatDate}
			/>

			<ModalRegistrarPago
				open={showRegisterPayment}
				onOpenChange={setShowRegisterPayment}
				regPagoMonto={regPagoMonto}
				setRegPagoMonto={setRegPagoMonto}
				regPagoMetodo={regPagoMetodo}
				setRegPagoMetodo={setRegPagoMetodo}
				regPagoReferencia={regPagoReferencia}
				setRegPagoReferencia={setRegPagoReferencia}
				handleRegistrarPago={handleRegistrarPago}
			/>
		</div>
	);
}

function CardStats({ label, value, icon }) {
	return (
		<Card className="hover:shadow-md transition-shadow border-chocolate-50">
			<CardHeader className="pb-2">
				<CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="flex items-center justify-between">
					<span className="text-2xl font-bold text-chocolate-900">{value}</span>
					<div className="p-2 bg-chocolate-50 rounded-lg">
						{icon}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

export default AdminReservas;
