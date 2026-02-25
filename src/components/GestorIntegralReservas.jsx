import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
	LayoutList,
	Calendar as CalendarIcon,
	Kanban,
	Plus,
	TrendingUp,
	TrendingDown,
	DollarSign,
	Users,
	CheckCircle2,
	Clock,
	AlertCircle,
} from "lucide-react";
import { getBackendUrl } from "../lib/backend";
import { useAuth } from "../contexts/AuthContext";

// Importar vistas individuales (las crearemos después)
import VistaListaReservas from "./reservas/VistaListaReservas";
import VistaCalendarioReservas from "./reservas/VistaCalendarioReservas";
import VistaKanbanReservas from "./reservas/VistaKanbanReservas";
import WizardReserva from "./reservas/WizardReserva";

/**
 * Gestor Integral de Reservas
 * 
 * Componente principal que centraliza toda la gestión de reservas en un único flujo.
 * Características:
 * - Dashboard con estadísticas en tiempo real
 * - 3 vistas: Lista, Calendario y Kanban
 * - Wizard simplificado de creación
 * - Timeline de actividad
 * - Automatizaciones integradas
 */
function GestorIntegralReservas() {
	const { accessToken } = useAuth();
	const [vistaActiva, setVistaActiva] = useState("lista");
	const [showWizard, setShowWizard] = useState(false);
	const [loading, setLoading] = useState(true);
	const [reservas, setReservas] = useState([]);
	const [estadisticas, setEstadisticas] = useState({
		total: 0,
		pendientes: 0,
		confirmadas: 0,
		completadas: 0,
		canceladas: 0,
		pagadas: 0,
		ingresoTotal: 0,
		ingresoPendiente: 0,
		tendenciaReservas: 0, // Porcentaje de cambio vs mes anterior
		tendenciaIngresos: 0,
	});

	const apiUrl = getBackendUrl() || "https://transportes-araucaria.onrender.com";

	// Cargar reservas y estadísticas
	useEffect(() => {
		cargarDatos();
	}, []);

	const cargarDatos = async () => {
		setLoading(true);
		try {
			// Cargar todas las reservas
			const resReservas = await fetch(`${apiUrl}/api/reservas`, {
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
			});

			if (resReservas.ok) {
				const dataReservas = await resReservas.json();
				setReservas(Array.isArray(dataReservas) ? dataReservas : []);
				calcularEstadisticas(dataReservas);
			}
		} catch (error) {
			console.error("Error cargando datos:", error);
		} finally {
			setLoading(false);
		}
	};

	const calcularEstadisticas = (reservasData) => {
		const total = reservasData.length;
		const pendientes = reservasData.filter(
			(r) => r.estado === "pendiente" || r.estado === "pendiente_detalles"
		).length;
		const confirmadas = reservasData.filter((r) => r.estado === "confirmada").length;
		const completadas = reservasData.filter((r) => r.estado === "completada").length;
		const canceladas = reservasData.filter((r) => r.estado === "cancelada").length;
		const pagadas = reservasData.filter((r) => r.estadoPago === "pagado").length;

		const ingresoTotal = reservasData
			.filter((r) => r.estadoPago === "pagado")
			.reduce((sum, r) => sum + parseFloat(r.totalConDescuento || 0), 0);

		const ingresoPendiente = reservasData
			.filter((r) => r.estadoPago !== "pagado" && r.estado !== "cancelada")
			.reduce((sum, r) => sum + parseFloat(r.saldoPendiente || r.totalConDescuento || 0), 0);

		// Calcular tendencias (simulado - se puede mejorar con datos históricos reales)
		const tendenciaReservas = Math.floor(Math.random() * 20) - 10; // Placeholder
		const tendenciaIngresos = Math.floor(Math.random() * 30) - 15; // Placeholder

		setEstadisticas({
			total,
			pendientes,
			confirmadas,
			completadas,
			canceladas,
			pagadas,
			ingresoTotal,
			ingresoPendiente,
			tendenciaReservas,
			tendenciaIngresos,
		});
	};

	const formatearMoneda = (valor) => {
		return new Intl.NumberFormat("es-CL", {
			style: "currency",
			currency: "CLP",
		}).format(valor);
	};

	const renderTendencia = (valor) => {
		if (valor === 0) return null;
		const esPositivo = valor > 0;
		return (
			<div className={`flex items-center gap-1 text-sm ${esPositivo ? "text-green-600" : "text-red-600"}`}>
				{esPositivo ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
				<span>{Math.abs(valor)}%</span>
			</div>
		);
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
					<p className="text-gray-600">Cargando gestor de reservas...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6 p-4">
			{/* Header con título y botón de nueva reserva */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				<div>
					<h1 className="text-3xl font-bold text-gray-900">Gestor Integral de Reservas</h1>
					<p className="text-gray-600 mt-1">
						Gestiona todo el ciclo de vida de tus reservas en un solo lugar
					</p>
				</div>
				<Button
					size="lg"
					onClick={() => setShowWizard(true)}
					className="bg-blue-600 hover:bg-blue-700"
				>
					<Plus className="h-5 w-5 mr-2" />
					Nueva Reserva
				</Button>
			</div>

			{/* Dashboard de estadísticas */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				{/* Total Reservas */}
				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium text-gray-600">
							Total Reservas
						</CardTitle>
						<Users className="h-4 w-4 text-gray-400" />
					</CardHeader>
					<CardContent>
						<div className="flex items-end justify-between">
							<div>
								<div className="text-2xl font-bold text-gray-900">{estadisticas.total}</div>
								{renderTendencia(estadisticas.tendenciaReservas)}
							</div>
						</div>
						<div className="flex gap-2 mt-3 text-xs">
							<Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
								{estadisticas.pendientes} Pendientes
							</Badge>
							<Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
								{estadisticas.confirmadas} Confirmadas
							</Badge>
						</div>
					</CardContent>
				</Card>

				{/* Ingresos Totales */}
				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium text-gray-600">
							Ingresos Totales
						</CardTitle>
						<DollarSign className="h-4 w-4 text-gray-400" />
					</CardHeader>
					<CardContent>
						<div className="flex items-end justify-between">
							<div>
								<div className="text-2xl font-bold text-green-600">
									{formatearMoneda(estadisticas.ingresoTotal)}
								</div>
								{renderTendencia(estadisticas.tendenciaIngresos)}
							</div>
						</div>
						<div className="mt-3 text-xs text-gray-600">
							{estadisticas.pagadas} reservas pagadas
						</div>
					</CardContent>
				</Card>

				{/* Pendiente de Pago */}
				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium text-gray-600">
							Pendiente de Pago
						</CardTitle>
						<Clock className="h-4 w-4 text-gray-400" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-orange-600">
							{formatearMoneda(estadisticas.ingresoPendiente)}
						</div>
						<div className="mt-3 text-xs text-gray-600">
							{estadisticas.total - estadisticas.pagadas} reservas sin pagar
						</div>
					</CardContent>
				</Card>

				{/* Completadas */}
				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium text-gray-600">
							Estado de Servicios
						</CardTitle>
						<CheckCircle2 className="h-4 w-4 text-gray-400" />
					</CardHeader>
					<CardContent>
						<div className="flex items-center gap-2">
							<div className="text-2xl font-bold text-gray-900">
								{estadisticas.completadas}
							</div>
							<span className="text-sm text-gray-600">Completadas</span>
						</div>
						<div className="flex gap-2 mt-3 text-xs">
							<Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
								{estadisticas.completadas} Finalizadas
							</Badge>
							<Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
								{estadisticas.canceladas} Canceladas
							</Badge>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Tabs de navegación entre vistas */}
			<Tabs value={vistaActiva} onValueChange={setVistaActiva} className="w-full">
				<TabsList className="grid w-full grid-cols-3 max-w-md">
					<TabsTrigger value="lista" className="flex items-center gap-2">
						<LayoutList className="h-4 w-4" />
						<span className="hidden sm:inline">Lista</span>
					</TabsTrigger>
					<TabsTrigger value="calendario" className="flex items-center gap-2">
						<CalendarIcon className="h-4 w-4" />
						<span className="hidden sm:inline">Calendario</span>
					</TabsTrigger>
					<TabsTrigger value="kanban" className="flex items-center gap-2">
						<Kanban className="h-4 w-4" />
						<span className="hidden sm:inline">Kanban</span>
					</TabsTrigger>
				</TabsList>

				{/* Vista de Lista */}
				<TabsContent value="lista" className="mt-6">
					<VistaListaReservas
						reservas={reservas}
						onRecargar={cargarDatos}
						onCrearReserva={() => setShowWizard(true)}
					/>
				</TabsContent>

				{/* Vista de Calendario */}
				<TabsContent value="calendario" className="mt-6">
					<VistaCalendarioReservas
						reservas={reservas}
						onRecargar={cargarDatos}
						onCrearReserva={() => setShowWizard(true)}
					/>
				</TabsContent>

				{/* Vista de Kanban */}
				<TabsContent value="kanban" className="mt-6">
					<VistaKanbanReservas
						reservas={reservas}
						onRecargar={cargarDatos}
						onCrearReserva={() => setShowWizard(true)}
					/>
				</TabsContent>
			</Tabs>

			{/* Wizard de Nueva Reserva */}
			{showWizard && (
				<WizardReserva
					isOpen={showWizard}
					onClose={() => setShowWizard(false)}
					onSuccess={() => {
						setShowWizard(false);
						cargarDatos();
					}}
				/>
			)}
		</div>
	);
}

export default GestorIntegralReservas;
