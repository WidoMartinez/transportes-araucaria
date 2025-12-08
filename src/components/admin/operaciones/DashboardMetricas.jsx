import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { 
	TrendingUp, 
	TrendingDown,
	Clock,
	CheckCircle2,
	AlertCircle,
	Users,
	DollarSign,
	Calendar,
	Activity
} from "lucide-react";

/**
 * Dashboard de Métricas en Tiempo Real
 * Muestra KPIs principales, alertas y tendencias
 */
function DashboardMetricas({ metricas, alertas = [], onAlertaClick }) {
	// Función auxiliar para formatear números
	const formatNumber = (num) => {
		if (num === null || num === undefined) return "0";
		return new Intl.NumberFormat("es-CL").format(num);
	};

	// Función auxiliar para formatear moneda
	const formatCurrency = (amount) => {
		if (amount === null || amount === undefined) return "$0";
		return new Intl.NumberFormat("es-CL", {
			style: "currency",
			currency: "CLP"
		}).format(amount);
	};

	// Función auxiliar para obtener el color según la tendencia
	const getTrendColor = (trend) => {
		if (trend > 0) return "text-green-600";
		if (trend < 0) return "text-red-600";
		return "text-gray-600";
	};

	// Función auxiliar para obtener el icono según la tendencia
	const getTrendIcon = (trend) => {
		if (trend > 0) return <TrendingUp className="h-4 w-4" />;
		if (trend < 0) return <TrendingDown className="h-4 w-4" />;
		return null;
	};

	// Configuración de las tarjetas de métricas principales
	const metricCards = [
		{
			id: "reservas_hoy",
			titulo: "Reservas Hoy",
			valor: metricas?.reservas_hoy || 0,
			icono: Calendar,
			color: "blue",
			tendencia: metricas?.tendencia_reservas_hoy,
			descripcion: "Nuevas reservas registradas hoy"
		},
		{
			id: "pendientes",
			titulo: "Pendientes",
			valor: metricas?.pendientes || 0,
			icono: Clock,
			color: "orange",
			alerta: (metricas?.pendientes || 0) > 10,
			descripcion: "Reservas esperando confirmación"
		},
		{
			id: "confirmadas",
			titulo: "Confirmadas",
			valor: metricas?.confirmadas || 0,
			icono: CheckCircle2,
			color: "green",
			tendencia: metricas?.tendencia_confirmadas,
			descripcion: "Reservas confirmadas activas"
		},
		{
			id: "en_progreso",
			titulo: "En Progreso",
			valor: metricas?.en_progreso || 0,
			icono: Activity,
			color: "purple",
			descripcion: "Servicios en curso"
		},
		{
			id: "completadas_mes",
			titulo: "Completadas (Mes)",
			valor: metricas?.completadas_mes || 0,
			icono: CheckCircle2,
			color: "green",
			tendencia: metricas?.tendencia_completadas,
			descripcion: "Servicios finalizados este mes"
		},
		{
			id: "ingresos_mes",
			titulo: "Ingresos (Mes)",
			valor: formatCurrency(metricas?.ingresos_mes || 0),
			icono: DollarSign,
			color: "emerald",
			tendencia: metricas?.tendencia_ingresos,
			descripcion: "Ingresos totales del mes"
		},
		{
			id: "ocupacion",
			titulo: "Ocupación",
			valor: `${metricas?.ocupacion || 0}%`,
			icono: Users,
			color: "blue",
			alerta: (metricas?.ocupacion || 0) > 85,
			descripcion: "Tasa de ocupación de vehículos"
		},
		{
			id: "satisfaccion",
			titulo: "Satisfacción",
			valor: `${metricas?.satisfaccion || 0}%`,
			icono: TrendingUp,
			color: "green",
			descripcion: "Índice de satisfacción del cliente"
		}
	];

	// Obtener clase de color para el badge
	const getBadgeVariant = (color) => {
		const variants = {
			blue: "default",
			green: "success",
			orange: "warning",
			red: "destructive",
			purple: "secondary",
			emerald: "success"
		};
		return variants[color] || "default";
	};

	// Obtener clase de color para el ícono
	const getIconColor = (color) => {
		const colors = {
			blue: "text-blue-600 bg-blue-100",
			green: "text-green-600 bg-green-100",
			orange: "text-orange-600 bg-orange-100",
			red: "text-red-600 bg-red-100",
			purple: "text-purple-600 bg-purple-100",
			emerald: "text-emerald-600 bg-emerald-100"
		};
		return colors[color] || "text-gray-600 bg-gray-100";
	};

	return (
		<div className="space-y-6">
			{/* Alertas importantes */}
			{alertas && alertas.length > 0 && (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{alertas.slice(0, 3).map((alerta, index) => (
						<Card 
							key={index}
							className={`border-l-4 cursor-pointer transition-all hover:shadow-md ${
								alerta.tipo === "error" 
									? "border-l-red-500 bg-red-50" 
									: alerta.tipo === "warning"
									? "border-l-orange-500 bg-orange-50"
									: "border-l-blue-500 bg-blue-50"
							}`}
							onClick={() => onAlertaClick && onAlertaClick(alerta.tipo)}
						>
							<CardContent className="pt-6">
								<div className="flex items-start gap-3">
									<div className={`p-2 rounded-full ${
										alerta.tipo === "error" 
											? "bg-red-100" 
											: alerta.tipo === "warning"
											? "bg-orange-100"
											: "bg-blue-100"
									}`}>
										<AlertCircle className={`h-5 w-5 ${
											alerta.tipo === "error" 
												? "text-red-600" 
												: alerta.tipo === "warning"
												? "text-orange-600"
												: "text-blue-600"
										}`} />
									</div>
									<div className="flex-1">
										<h4 className="font-semibold text-sm text-gray-900 mb-1">
											{alerta.titulo}
										</h4>
										<p className="text-sm text-gray-600">
											{alerta.mensaje}
										</p>
									</div>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}

			{/* Tarjetas de métricas principales */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				{metricCards.map((metric) => {
					const IconComponent = metric.icono;
					const iconColor = getIconColor(metric.color);

					return (
						<Card key={metric.id} className="hover:shadow-md transition-shadow">
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium text-gray-600">
									{metric.titulo}
								</CardTitle>
								<div className={`p-2 rounded-full ${iconColor}`}>
									<IconComponent className="h-4 w-4" />
								</div>
							</CardHeader>
							<CardContent>
								<div className="space-y-2">
									{/* Valor principal */}
									<div className="flex items-baseline justify-between">
										<div className="text-2xl font-bold text-gray-900">
											{metric.valor}
										</div>
										
										{/* Alerta o tendencia */}
										{metric.alerta && (
											<Badge variant="destructive" className="text-xs">
												¡Atención!
											</Badge>
										)}
										
										{metric.tendencia !== undefined && metric.tendencia !== null && (
											<div className={`flex items-center gap-1 text-sm font-medium ${getTrendColor(metric.tendencia)}`}>
												{getTrendIcon(metric.tendencia)}
												<span>{Math.abs(metric.tendencia)}%</span>
											</div>
										)}
									</div>

									{/* Descripción */}
									<p className="text-xs text-gray-500">
										{metric.descripcion}
									</p>
								</div>
							</CardContent>
						</Card>
					);
				})}
			</div>

			{/* Métricas adicionales en formato compacto */}
			{metricas && (
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">Resumen de Operaciones</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
							{/* Tasa de conversión */}
							{metricas.tasa_conversion !== undefined && (
								<div className="text-center">
									<div className="text-2xl font-bold text-blue-600">
										{metricas.tasa_conversion}%
									</div>
									<div className="text-xs text-gray-500 mt-1">
										Tasa de Conversión
									</div>
								</div>
							)}

							{/* Tiempo promedio de respuesta */}
							{metricas.tiempo_respuesta_promedio !== undefined && (
								<div className="text-center">
									<div className="text-2xl font-bold text-purple-600">
										{metricas.tiempo_respuesta_promedio}h
									</div>
									<div className="text-xs text-gray-500 mt-1">
										Tiempo de Respuesta
									</div>
								</div>
							)}

							{/* Clientes nuevos */}
							{metricas.clientes_nuevos !== undefined && (
								<div className="text-center">
									<div className="text-2xl font-bold text-green-600">
										{formatNumber(metricas.clientes_nuevos)}
									</div>
									<div className="text-xs text-gray-500 mt-1">
										Clientes Nuevos
									</div>
								</div>
							)}

							{/* Clientes recurrentes */}
							{metricas.clientes_recurrentes !== undefined && (
								<div className="text-center">
									<div className="text-2xl font-bold text-emerald-600">
										{formatNumber(metricas.clientes_recurrentes)}
									</div>
									<div className="text-xs text-gray-500 mt-1">
										Clientes Recurrentes
									</div>
								</div>
							)}
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}

export default DashboardMetricas;
