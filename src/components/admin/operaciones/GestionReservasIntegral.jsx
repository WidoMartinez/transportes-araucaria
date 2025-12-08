import React, { useState, useEffect, useCallback } from "react";
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { getBackendUrl } from "../../../lib/backend";
import { useAuthenticatedFetch } from "../../../hooks/useAuthenticatedFetch";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Card, CardContent } from "../../ui/card";
import { 
	Search, 
	RefreshCw, 
	Calendar,
	Filter,
	X,
	AlertCircle,
	CheckCircle2,
	Clock,
	TrendingUp
} from "lucide-react";
import DashboardMetricas from "./DashboardMetricas";
import ReservaCard from "./ReservaCard";
import DetallesReservaDrawer from "./DetallesReservaDrawer";
import KanbanColumn from "./KanbanColumn";

/**
 * Sistema Integral de Gestión de Reservas
 * Vista Kanban con drag & drop, métricas en tiempo real y panel de detalles
 */
function GestionReservasIntegral() {
	const { authenticatedFetch } = useAuthenticatedFetch();

	// Estados principales
	const [kanbanData, setKanbanData] = useState({
		pendiente: [],
		confirmada: [],
		asignada: [],
		en_progreso: [],
		completada: []
	});
	
	const [metricas, setMetricas] = useState(null);
	const [alertas, setAlertas] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	// Estados de búsqueda y filtros
	const [searchTerm, setSearchTerm] = useState("");
	const [fechaDesde, setFechaDesde] = useState("");
	const [fechaHasta, setFechaHasta] = useState("");
	const [showFilters, setShowFilters] = useState(false);

	// Estados del drawer de detalles
	const [selectedReserva, setSelectedReserva] = useState(null);
	const [drawerOpen, setDrawerOpen] = useState(false);

	// Estados de drag & drop
	const [activeId, setActiveId] = useState(null);
	const [activeReserva, setActiveReserva] = useState(null);

	// Configurar sensores para drag & drop
	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 8,
			},
		})
	);

	// Configuración de columnas Kanban
	const columnas = [
		{
			id: "pendiente",
			titulo: "Pendientes",
			color: "gray",
			icono: Clock,
			descripcion: "Reservas esperando confirmación"
		},
		{
			id: "confirmada",
			titulo: "Confirmadas",
			color: "blue",
			icono: CheckCircle2,
			descripcion: "Reservas confirmadas"
		},
		{
			id: "asignada",
			titulo: "Asignadas",
			color: "purple",
			icono: TrendingUp,
			descripcion: "Con vehículo/conductor asignado"
		},
		{
			id: "en_progreso",
			titulo: "En Progreso",
			color: "orange",
			icono: RefreshCw,
			descripcion: "Servicio en curso"
		},
		{
			id: "completada",
			titulo: "Completadas",
			color: "green",
			icono: CheckCircle2,
			descripcion: "Servicios finalizados"
		}
	];

	// Cargar datos de Kanban
	const cargarKanban = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);

			const params = new URLSearchParams();
			if (searchTerm) params.append("search", searchTerm);
			if (fechaDesde) params.append("fecha_desde", fechaDesde);
			if (fechaHasta) params.append("fecha_hasta", fechaHasta);

			const url = `${getBackendUrl()}/api/reservas/kanban${params.toString() ? `?${params.toString()}` : ""}`;
			
			const response = await authenticatedFetch(url);
			const data = await response.json();

			if (data.kanban) {
				setKanbanData(data.kanban);
			}
		} catch (err) {
			console.error("Error cargando Kanban:", err);
			setError("Error al cargar las reservas. Por favor, intente nuevamente.");
		} finally {
			setLoading(false);
		}
	}, [authenticatedFetch, searchTerm, fechaDesde, fechaHasta]);

	// Cargar métricas
	const cargarMetricas = useCallback(async () => {
		try {
			const url = `${getBackendUrl()}/api/reservas/metricas`;
			const response = await authenticatedFetch(url);
			const data = await response.json();

			if (data.metricas) {
				setMetricas(data.metricas);
			}
			if (data.alertas) {
				setAlertas(data.alertas);
			}
		} catch (err) {
			console.error("Error cargando métricas:", err);
		}
	}, [authenticatedFetch]);

	// Cargar datos iniciales
	useEffect(() => {
		cargarKanban();
		cargarMetricas();
	}, [cargarKanban, cargarMetricas]);

	// Manejar inicio de arrastre
	const handleDragStart = (event) => {
		const { active } = event;
		setActiveId(active.id);

		// Encontrar la reserva activa
		const reserva = Object.values(kanbanData)
			.flat()
			.find(r => r.id === active.id);
		
		setActiveReserva(reserva);
	};

	// Manejar fin de arrastre
	const handleDragEnd = async (event) => {
		const { active, over } = event;

		setActiveId(null);
		setActiveReserva(null);

		if (!over) return;

		const reservaId = active.id;
		const nuevoEstado = over.id;

		// Encontrar el estado actual de la reserva
		let estadoActual = null;
		for (const [estado, reservas] of Object.entries(kanbanData)) {
			if (reservas.some(r => r.id === reservaId)) {
				estadoActual = estado;
				break;
			}
		}

		// Si no cambió de estado, no hacer nada
		if (estadoActual === nuevoEstado) return;

		// Actualizar estado en el backend
		try {
			const url = `${getBackendUrl()}/api/reservas/${reservaId}/cambiar-estado`;
			const response = await authenticatedFetch(url, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					nuevoEstado,
					observaciones: `Movido desde ${estadoActual} mediante Kanban`
				})
			});

			if (response.ok) {
				// Actualizar estado local
				const reserva = kanbanData[estadoActual].find(r => r.id === reservaId);
				
				setKanbanData(prev => ({
					...prev,
					[estadoActual]: prev[estadoActual].filter(r => r.id !== reservaId),
					[nuevoEstado]: [...prev[nuevoEstado], { ...reserva, estado: nuevoEstado }]
				}));

				// Recargar métricas
				cargarMetricas();
			} else {
				const errorData = await response.json();
				alert(`Error al cambiar estado: ${errorData.error || "Error desconocido"}`);
				// Recargar datos si hay error
				cargarKanban();
			}
		} catch (err) {
			console.error("Error cambiando estado:", err);
			alert("Error al cambiar estado de la reserva");
			cargarKanban();
		}
	};

	// Manejar cancelación de arrastre
	const handleDragCancel = () => {
		setActiveId(null);
		setActiveReserva(null);
	};

	// Abrir drawer de detalles
	const abrirDetalles = (reserva) => {
		setSelectedReserva(reserva);
		setDrawerOpen(true);
	};

	// Cerrar drawer
	const cerrarDetalles = () => {
		setDrawerOpen(false);
		setSelectedReserva(null);
	};

	// Limpiar filtros
	const limpiarFiltros = () => {
		setSearchTerm("");
		setFechaDesde("");
		setFechaHasta("");
		setShowFilters(false);
	};

	// Refrescar datos
	const refrescar = () => {
		cargarKanban();
		cargarMetricas();
	};

	return (
		<div className="space-y-6">
			{/* Header con título y acciones */}
			<div className="flex justify-between items-start">
				<div>
					<h2 className="text-3xl font-bold text-gray-900">
						Gestión Integral de Reservas
					</h2>
					<p className="text-gray-500 mt-1">
						Vista Kanban con drag & drop para gestionar todas las reservas
					</p>
				</div>
				
				<div className="flex gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => setShowFilters(!showFilters)}
						className="gap-2"
					>
						<Filter className="h-4 w-4" />
						Filtros
					</Button>
					
					<Button
						variant="outline"
						size="sm"
						onClick={refrescar}
						disabled={loading}
						className="gap-2"
					>
						<RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
						Actualizar
					</Button>
				</div>
			</div>

			{/* Dashboard de métricas */}
			{metricas && (
				<DashboardMetricas 
					metricas={metricas} 
					alertas={alertas}
					onAlertaClick={(tipo) => {
						// Podríamos filtrar por el tipo de alerta
						console.log("Alerta clickeada:", tipo);
					}}
				/>
			)}

			{/* Barra de búsqueda y filtros */}
			<Card>
				<CardContent className="pt-6">
					<div className="space-y-4">
						{/* Búsqueda principal */}
						<div className="flex gap-2">
							<div className="relative flex-1">
								<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
								<Input
									type="text"
									placeholder="Buscar por nombre, email, teléfono o código de reserva..."
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									className="pl-10"
								/>
							</div>
							
							{(searchTerm || fechaDesde || fechaHasta) && (
								<Button
									variant="ghost"
									size="sm"
									onClick={limpiarFiltros}
									className="gap-2"
								>
									<X className="h-4 w-4" />
									Limpiar
								</Button>
							)}
						</div>

						{/* Filtros avanzados */}
						{showFilters && (
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
								<div>
									<label className="text-sm font-medium text-gray-700 mb-2 block">
										<Calendar className="h-4 w-4 inline mr-1" />
										Fecha Desde
									</label>
									<Input
										type="date"
										value={fechaDesde}
										onChange={(e) => setFechaDesde(e.target.value)}
									/>
								</div>
								
								<div>
									<label className="text-sm font-medium text-gray-700 mb-2 block">
										<Calendar className="h-4 w-4 inline mr-1" />
										Fecha Hasta
									</label>
									<Input
										type="date"
										value={fechaHasta}
										onChange={(e) => setFechaHasta(e.target.value)}
									/>
								</div>
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Mostrar errores */}
			{error && (
				<Card className="border-red-200 bg-red-50">
					<CardContent className="pt-6">
						<div className="flex items-center gap-2 text-red-800">
							<AlertCircle className="h-5 w-5" />
							<p>{error}</p>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Vista Kanban con Drag & Drop */}
			<DndContext
				sensors={sensors}
				collisionDetection={closestCorners}
				onDragStart={handleDragStart}
				onDragEnd={handleDragEnd}
				onDragCancel={handleDragCancel}
			>
				<div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
					{columnas.map((columna) => (
						<KanbanColumn
							key={columna.id}
							id={columna.id}
							titulo={columna.titulo}
							color={columna.color}
							icono={columna.icono}
							descripcion={columna.descripcion}
							reservas={kanbanData[columna.id] || []}
							onReservaClick={abrirDetalles}
							loading={loading}
						/>
					))}
				</div>

				{/* Overlay para mostrar la reserva mientras se arrastra */}
				<DragOverlay>
					{activeId && activeReserva ? (
						<div className="opacity-90">
							<ReservaCard 
								reserva={activeReserva} 
								onClick={() => {}}
								isDragging
							/>
						</div>
					) : null}
				</DragOverlay>
			</DndContext>

			{/* Drawer de detalles */}
			<DetallesReservaDrawer
				reserva={selectedReserva}
				open={drawerOpen}
				onClose={cerrarDetalles}
				onUpdate={refrescar}
			/>
		</div>
	);
}

export default GestionReservasIntegral;
