// src/components/EstadisticasConductor.jsx
// Componente para visualizar estadísticas individuales de conductores
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Alert, AlertDescription } from "./ui/alert";
import {
	Star,
	TrendingUp,
	Clock,
	Sparkles,
	Shield,
	MessageCircle,
	Calendar,
	AlertCircle,
	Loader2,
	Award,
	FileText,
} from "lucide-react";
import { getBackendUrl } from "../lib/backend";
import { useAuthenticatedFetch } from "../hooks/useAuthenticatedFetch";

const API_BASE_URL = getBackendUrl() || "https://transportes-araucaria.onrender.com";

/**
 * Componente para mostrar estrellas de calificación
 */
const StarDisplay = ({ rating, size = "sm" }) => {
	const sizeClasses = {
		sm: "w-4 h-4",
		md: "w-5 h-5",
		lg: "w-6 h-6",
		xl: "w-8 h-8",
	};

	return (
		<div className="flex gap-0.5">
			{[1, 2, 3, 4, 5].map((star) => (
				<Star
					key={star}
					className={`${sizeClasses[size]} ${
						star <= rating
							? "fill-yellow-400 text-yellow-400"
							: "text-gray-300"
					}`}
				/>
			))}
		</div>
	);
};

/**
 * Obtiene el color según el promedio de calificación
 */
const obtenerColorPromedio = (promedio) => {
	if (promedio >= 4.5) return "text-green-600";
	if (promedio >= 3.5) return "text-yellow-600";
	return "text-red-600";
};

/**
 * Obtiene el color de fondo según el promedio de calificación
 */
const obtenerColorFondoPromedio = (promedio) => {
	if (promedio >= 4.5) return "bg-green-50 border-green-200";
	if (promedio >= 3.5) return "bg-yellow-50 border-yellow-200";
	return "bg-red-50 border-red-200";
};

/**
 * Componente para mostrar barra de progreso con valor numérico
 */
const BarraCategoria = ({ label, valor, icon: Icon }) => {
	const color = obtenerColorPromedio(valor);
	const porcentaje = (valor / 5) * 100;

	return (
		<div className="space-y-2">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Icon className="w-4 h-4 text-gray-500" />
					<span className="text-sm font-medium text-gray-700">{label}</span>
				</div>
				<span className={`text-sm font-bold ${color}`}>
					{valor.toFixed(1)}
				</span>
			</div>
			<Progress value={porcentaje} className="h-2" />
		</div>
	);
};

/**
 * Componente principal para visualizar estadísticas de un conductor
 */
function EstadisticasConductor({ conductorId }) {
	const { authenticatedFetch } = useAuthenticatedFetch();

	// Estados
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [conductor, setConductor] = useState(null);
	const [estadisticas, setEstadisticas] = useState(null);
	const [ultimasEvaluaciones, setUltimasEvaluaciones] = useState([]);

	/**
	 * Cargar estadísticas del conductor
	 */
	const cargarEstadisticas = async () => {
		if (!conductorId) {
			setError("No se proporcionó un ID de conductor");
			setLoading(false);
			return;
		}

		try {
			setLoading(true);
			setError(null);

			const response = await authenticatedFetch(
				`/api/conductores/${conductorId}/estadisticas`,
				{
					method: "GET",
				}
			);

			if (!response.ok) {
				throw new Error("Error al cargar las estadísticas del conductor");
			}

			const data = await response.json();

			// Validar estructura de datos
			if (!data.conductor || !data.estadisticas) {
				throw new Error("Datos incompletos recibidos del servidor");
			}

			setConductor(data.conductor);
			setEstadisticas(data.estadisticas);
			setUltimasEvaluaciones(data.ultimasEvaluaciones || []);
		} catch (err) {
			console.error("Error al cargar estadísticas:", err);
			setError(err.message || "Error al cargar las estadísticas");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		cargarEstadisticas();
	}, [conductorId]);

	/**
	 * Formatear fecha
	 */
	const formatearFecha = (fecha) => {
		return new Date(fecha).toLocaleDateString("es-CL", {
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
		});
	};

	/**
	 * Truncar texto largo
	 */
	const truncarTexto = (texto, maxLength = 80) => {
		if (!texto) return "-";
		if (texto.length <= maxLength) return texto;
		return texto.substring(0, maxLength) + "...";
	};

	/**
	 * Obtener la categoría mejor calificada
	 */
	const obtenerMejorCategoria = () => {
		if (!estadisticas) return null;

		const categorias = [
			{ nombre: "Puntualidad", valor: estadisticas.promedioPuntualidad, icon: Clock },
			{ nombre: "Limpieza", valor: estadisticas.promedioLimpieza, icon: Sparkles },
			{ nombre: "Seguridad", valor: estadisticas.promedioSeguridad, icon: Shield },
			{ nombre: "Comunicación", valor: estadisticas.promedioComunicacion, icon: MessageCircle },
		];

		return categorias.reduce((max, cat) =>
			cat.valor > max.valor ? cat : max
		);
	};

	// Estado de carga
	if (loading) {
		return (
			<div className="flex items-center justify-center p-12">
				<Loader2 className="w-8 h-8 animate-spin text-gray-400" />
				<span className="ml-3 text-gray-600">Cargando estadísticas...</span>
			</div>
		);
	}

	// Estado de error
	if (error) {
		return (
			<Alert variant="destructive">
				<AlertCircle className="h-4 w-4" />
				<AlertDescription>{error}</AlertDescription>
			</Alert>
		);
	}

	// Si no hay datos
	if (!conductor || !estadisticas) {
		return (
			<Alert>
				<AlertCircle className="h-4 w-4" />
				<AlertDescription>
					No se encontraron estadísticas para este conductor
				</AlertDescription>
			</Alert>
		);
	}

	const mejorCategoria = obtenerMejorCategoria();
	const colorPromedio = obtenerColorPromedio(estadisticas.promedioGeneral);
	const colorFondoPromedio = obtenerColorFondoPromedio(
		estadisticas.promedioGeneral
	);

	return (
		<div className="space-y-6 p-6">
			{/* Header con nombre del conductor */}
			<div className="flex items-center gap-4">
				<div className="flex-1">
					<h1 className="text-3xl font-bold text-gray-900">
						{conductor.nombre}
					</h1>
					<p className="text-gray-500 mt-1">
						Estadísticas de desempeño y evaluaciones
					</p>
				</div>
			</div>

			{/* Métricas principales */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
				{/* Promedio General - Destacado */}
				<Card className={`${colorFondoPromedio} border-2 col-span-1 md:col-span-2 lg:col-span-1`}>
					<CardHeader className="pb-3">
						<CardTitle className="text-sm font-medium text-gray-700">
							Promedio General
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex flex-col items-center justify-center space-y-2">
							<div className={`text-5xl font-bold ${colorPromedio}`}>
								{estadisticas.promedioGeneral.toFixed(1)}
							</div>
							<StarDisplay
								rating={Math.round(estadisticas.promedioGeneral)}
								size="lg"
							/>
							<p className="text-xs text-gray-600 text-center">
								de 5 estrellas
							</p>
						</div>
					</CardContent>
				</Card>

				{/* Total de Evaluaciones */}
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Evaluaciones
						</CardTitle>
						<TrendingUp className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold">
							{estadisticas.totalEvaluaciones}
						</div>
						<p className="text-xs text-muted-foreground mt-1">
							Total recibidas
						</p>
					</CardContent>
				</Card>

				{/* Total de Servicios */}
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Servicios
						</CardTitle>
						<FileText className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold">
							{estadisticas.totalServiciosCompletados}
						</div>
						<p className="text-xs text-muted-foreground mt-1">
							Completados
						</p>
					</CardContent>
				</Card>

				{/* Porcentaje Evaluado */}
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							% Evaluado
						</CardTitle>
						<Star className="h-4 w-4 text-yellow-400" />
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold text-blue-600">
							{estadisticas.porcentajeEvaluado.toFixed(1)}%
						</div>
						<p className="text-xs text-muted-foreground mt-1">
							De servicios
						</p>
					</CardContent>
				</Card>

				{/* Cantidad de 5 estrellas */}
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							5 Estrellas
						</CardTitle>
						<Award className="h-4 w-4 text-yellow-500" />
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold text-yellow-600">
							{estadisticas.cantidadCincoEstrellas}
						</div>
						<p className="text-xs text-muted-foreground mt-1">
							Excelentes
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Gráfico de promedios por categoría */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<TrendingUp className="w-5 h-5" />
						Promedios por Categoría
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<BarraCategoria
						label="Puntualidad"
						valor={estadisticas.promedioPuntualidad}
						icon={Clock}
					/>
					<BarraCategoria
						label="Limpieza"
						valor={estadisticas.promedioLimpieza}
						icon={Sparkles}
					/>
					<BarraCategoria
						label="Seguridad"
						valor={estadisticas.promedioSeguridad}
						icon={Shield}
					/>
					<BarraCategoria
						label="Comunicación"
						valor={estadisticas.promedioComunicacion}
						icon={MessageCircle}
					/>
				</CardContent>
			</Card>

			{/* Badge de categoría mejor calificada */}
			{mejorCategoria && (
				<Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
					<CardContent className="pt-6">
						<div className="flex items-center justify-center gap-3">
							<Award className="w-6 h-6 text-blue-600" />
							<span className="text-lg font-semibold text-gray-800">
								Destacado en:
							</span>
							<Badge
								variant="default"
								className="text-lg px-4 py-1 bg-blue-600"
							>
								{mejorCategoria.nombre} ({mejorCategoria.valor.toFixed(1)})
							</Badge>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Lista de últimas evaluaciones */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Calendar className="w-5 h-5" />
						Últimas 10 Evaluaciones
					</CardTitle>
				</CardHeader>
				<CardContent>
					{ultimasEvaluaciones.length === 0 ? (
						<div className="text-center py-8 text-gray-500">
							<AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
							<p>No hay evaluaciones registradas aún</p>
						</div>
					) : (
						<div className="space-y-3">
							{ultimasEvaluaciones.map((evaluacion) => (
								<div
									key={evaluacion.id}
									className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
								>
									<div className="flex-shrink-0 text-sm text-gray-600">
										<Calendar className="w-4 h-4 inline mr-1" />
										{formatearFecha(evaluacion.fecha_evaluacion)}
									</div>
									<div className="flex-shrink-0">
										<Badge variant="outline" className="font-mono">
											{evaluacion.codigo_reserva}
										</Badge>
									</div>
									<div className="flex items-center gap-2">
										<span className="text-sm font-semibold text-gray-700">
											{evaluacion.promedio.toFixed(1)}
										</span>
										<StarDisplay
											rating={Math.round(evaluacion.promedio)}
											size="sm"
										/>
									</div>
									{evaluacion.comentario && (
										<div className="flex-1 text-sm text-gray-600 italic">
											<MessageCircle className="w-4 h-4 inline mr-1" />
											{truncarTexto(evaluacion.comentario)}
										</div>
									)}
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>

			{/* Nota sobre privacidad */}
			<Alert className="bg-blue-50 border-blue-200">
				<AlertCircle className="h-4 w-4 text-blue-600" />
				<AlertDescription className="text-blue-800">
					<strong>Nota:</strong> La información de propinas es confidencial y
					solo está disponible para administradores.
				</AlertDescription>
			</Alert>
		</div>
	);
}

export default EstadisticasConductor;
