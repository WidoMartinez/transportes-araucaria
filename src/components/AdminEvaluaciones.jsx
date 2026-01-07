// src/components/AdminEvaluaciones.jsx
// Componente para administrar evaluaciones de servicio
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
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
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "./ui/tooltip";
import {
	Star,
	Eye,
	DollarSign,
	Lock,
	TrendingUp,
	Calendar,
	Search,
	RefreshCw,
	AlertCircle,
	ChevronLeft,
	ChevronRight,
	Clock,
	Sparkles,
	Shield,
	MessageCircle,
	User,
	Mail,
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
 * Componente principal de administración de evaluaciones
 */
function AdminEvaluaciones() {
	const { authenticatedFetch } = useAuthenticatedFetch();

	// Estados para datos
	const [evaluaciones, setEvaluaciones] = useState([]);
	const [conductores, setConductores] = useState([]);
	const [metricas, setMetricas] = useState({
		totalEvaluaciones: 0,
		promedioGlobal: 0,
		totalPropinas: 0,
	});

	// Estados de UI
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [selectedEvaluacion, setSelectedEvaluacion] = useState(null);
	const [showDetailDialog, setShowDetailDialog] = useState(false);

	// Estados de filtros
	const [filtros, setFiltros] = useState({
		conductorId: "",
		desde: "",
		hasta: "",
		calificacionMin: "",
	});

	// Estados de paginación
	const [paginaActual, setPaginaActual] = useState(1);
	const [totalPaginas, setTotalPaginas] = useState(1);
	const evaluacionesPorPagina = 10;

	// Cargar conductores al montar
	useEffect(() => {
		fetchConductores();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Cargar evaluaciones cuando cambien los filtros
	useEffect(() => {
		fetchEvaluaciones();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [filtros, paginaActual]);

	/**
	 * Obtener lista de conductores para filtro
	 */
	const fetchConductores = async () => {
		try {
			const response = await authenticatedFetch("/api/conductores", {
				method: "GET",
			});
			const data = await response.json();
			setConductores(data.conductores || []);
		} catch (err) {
			console.error("Error cargando conductores:", err);
		}
	};

	/**
	 * Obtener evaluaciones con filtros aplicados
	 */
	const fetchEvaluaciones = async () => {
		try {
			setLoading(true);
			setError(null);

			// Construir query params
			const params = new URLSearchParams();
			if (filtros.conductorId) params.append("conductorId", filtros.conductorId);
			if (filtros.desde) params.append("desde", filtros.desde);
			if (filtros.hasta) params.append("hasta", filtros.hasta);
			if (filtros.calificacionMin)
				params.append("calificacionMin", filtros.calificacionMin);
			params.append("pagina", paginaActual);
			params.append("limite", evaluacionesPorPagina);

			const response = await authenticatedFetch(
				`/api/admin/evaluaciones?${params.toString()}`,
				{
					method: "GET",
				}
			);

			if (!response.ok) {
				throw new Error("Error al cargar evaluaciones");
			}

			const data = await response.json();

			setEvaluaciones(data.evaluaciones || []);
			setMetricas(data.metricas || { totalEvaluaciones: 0, promedioGlobal: 0, totalPropinas: 0 });
			setTotalPaginas(Math.ceil((data.total || 0) / evaluacionesPorPagina));
		} catch (err) {
			console.error("Error:", err);
			setError("Error al cargar las evaluaciones. Por favor, intente nuevamente.");
		} finally {
			setLoading(false);
		}
	};

	/**
	 * Actualizar valor de un filtro
	 */
	const handleFiltroChange = (campo, valor) => {
		setFiltros((prev) => ({
			...prev,
			[campo]: valor,
		}));
		setPaginaActual(1); // Reset a primera página
	};

	/**
	 * Limpiar todos los filtros
	 */
	const limpiarFiltros = () => {
		setFiltros({
			conductorId: "",
			desde: "",
			hasta: "",
			calificacionMin: "",
		});
		setPaginaActual(1);
	};

	/**
	 * Abrir modal de detalle
	 */
	const verDetalle = (evaluacion) => {
		setSelectedEvaluacion(evaluacion);
		setShowDetailDialog(true);
	};

	/**
	 * Formatear monto a CLP
	 */
	const formatearMoneda = (monto) => {
		return new Intl.NumberFormat("es-CL", {
			style: "currency",
			currency: "CLP",
		}).format(monto);
	};

	/**
	 * Formatear fecha
	 */
	const formatearFecha = (fecha) => {
		return new Date(fecha).toLocaleDateString("es-CL", {
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	/**
	 * Truncar texto largo
	 */
	const truncarTexto = (texto, maxLength = 50) => {
		if (!texto) return "-";
		if (texto.length <= maxLength) return texto;
		return texto.substring(0, maxLength) + "...";
	};

	/**
	 * Calcular promedio de calificaciones
	 */
	const calcularPromedio = (evaluacion) => {
		const categorias = ["puntualidad", "limpieza", "seguridad", "comunicacion"];
		const sum = categorias.reduce(
			(acc, cat) => acc + (evaluacion[cat] || 0),
			0
		);
		return (sum / categorias.length).toFixed(1);
	};

	// Evaluaciones paginadas (ya vienen del servidor paginadas)
	const evaluacionesPaginadas = evaluaciones;

	return (
		<div className="space-y-6 p-6">
			{/* Header */}
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-3xl font-bold text-gray-900">
						Evaluaciones de Servicio
					</h1>
					<p className="text-gray-500 mt-1">
						Gestión completa de evaluaciones y propinas
					</p>
				</div>
				<Button
					onClick={fetchEvaluaciones}
					variant="outline"
					size="sm"
					disabled={loading}
				>
					<RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
					Actualizar
				</Button>
			</div>

			{/* Métricas generales */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Total Evaluaciones
						</CardTitle>
						<TrendingUp className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{metricas.totalEvaluaciones}
						</div>
						<p className="text-xs text-muted-foreground">
							Evaluaciones registradas
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Promedio Global
						</CardTitle>
						<Star className="h-4 w-4 text-yellow-400" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold flex items-center gap-2">
							{metricas.promedioGlobal.toFixed(1)}
							<StarDisplay rating={Math.round(metricas.promedioGlobal)} />
						</div>
						<p className="text-xs text-muted-foreground">
							Calificación promedio
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Total Propinas
						</CardTitle>
						<div className="flex items-center gap-1">
							<Lock className="h-3 w-3 text-red-500" />
							<DollarSign className="h-4 w-4 text-green-600" />
						</div>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-green-600">
							{formatearMoneda(metricas.totalPropinas)}
						</div>
						<p className="text-xs text-red-600 flex items-center gap-1">
							<Lock className="h-3 w-3" />
							Información confidencial
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Filtros */}
			<Card>
				<CardHeader>
					<CardTitle className="text-lg flex items-center gap-2">
						<Search className="w-5 h-5" />
						Filtros de búsqueda
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
						{/* Filtro por conductor */}
						<div className="space-y-2">
							<Label>Conductor</Label>
							<Select
								value={filtros.conductorId}
								onValueChange={(value) =>
									handleFiltroChange("conductorId", value)
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="Todos los conductores" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="">Todos</SelectItem>
									{conductores.map((conductor) => (
										<SelectItem
											key={conductor.id}
											value={conductor.id.toString()}
										>
											{conductor.nombre}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						{/* Filtro fecha desde */}
						<div className="space-y-2">
							<Label>Fecha desde</Label>
							<Input
								type="date"
								value={filtros.desde}
								onChange={(e) =>
									handleFiltroChange("desde", e.target.value)
								}
							/>
						</div>

						{/* Filtro fecha hasta */}
						<div className="space-y-2">
							<Label>Fecha hasta</Label>
							<Input
								type="date"
								value={filtros.hasta}
								onChange={(e) =>
									handleFiltroChange("hasta", e.target.value)
								}
							/>
						</div>

						{/* Filtro calificación mínima */}
						<div className="space-y-2">
							<Label>Calificación mínima</Label>
							<Select
								value={filtros.calificacionMin}
								onValueChange={(value) =>
									handleFiltroChange("calificacionMin", value)
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="Todas" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="">Todas</SelectItem>
									<SelectItem value="1">1 estrella</SelectItem>
									<SelectItem value="2">2 estrellas</SelectItem>
									<SelectItem value="3">3 estrellas</SelectItem>
									<SelectItem value="4">4 estrellas</SelectItem>
									<SelectItem value="5">5 estrellas</SelectItem>
								</SelectContent>
							</Select>
						</div>

						{/* Botón limpiar filtros */}
						<div className="space-y-2 flex items-end">
							<Button
								onClick={limpiarFiltros}
								variant="outline"
								className="w-full"
							>
								Limpiar filtros
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Tabla de evaluaciones */}
			<Card>
				<CardHeader>
					<CardTitle>Evaluaciones</CardTitle>
				</CardHeader>
				<CardContent>
					{loading ? (
						<div className="flex justify-center items-center py-12">
							<RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
						</div>
					) : error ? (
						<div className="flex flex-col items-center justify-center py-12 text-red-600">
							<AlertCircle className="w-12 h-12 mb-4" />
							<p>{error}</p>
						</div>
					) : evaluaciones.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-12 text-gray-500">
							<Star className="w-12 h-12 mb-4" />
							<p>No se encontraron evaluaciones con los filtros aplicados</p>
						</div>
					) : (
						<>
							<div className="overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Fecha</TableHead>
											<TableHead>Código Reserva</TableHead>
											<TableHead>Conductor</TableHead>
											<TableHead>Cliente</TableHead>
											<TableHead>Calificación</TableHead>
											<TableHead>Comentario</TableHead>
											<TableHead className="flex items-center gap-1">
												<Lock className="w-3 h-3 text-red-500" />
												Propina
											</TableHead>
											<TableHead>Acción</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{evaluacionesPaginadas.map((evaluacion) => {
											const promedio = calcularPromedio(evaluacion);
											return (
												<TableRow key={evaluacion.id}>
													{/* Fecha */}
													<TableCell>
														<div className="flex items-center gap-2">
															<Calendar className="w-4 h-4 text-gray-400" />
															<span className="text-sm">
																{formatearFecha(evaluacion.fechaCreacion)}
															</span>
														</div>
													</TableCell>

													{/* Código reserva */}
													<TableCell>
														<Badge variant="outline">
															{evaluacion.reservaCodigo || "N/A"}
														</Badge>
													</TableCell>

													{/* Conductor */}
													<TableCell>
														<div className="flex items-center gap-2">
															<User className="w-4 h-4 text-gray-400" />
															<span className="font-medium">
																{evaluacion.conductorNombre || "N/A"}
															</span>
														</div>
													</TableCell>

													{/* Cliente */}
													<TableCell>
														<div className="space-y-1">
															<div className="font-medium">
																{evaluacion.clienteNombre || "N/A"}
															</div>
															<div className="text-xs text-gray-500 flex items-center gap-1">
																<Mail className="w-3 h-3" />
																{evaluacion.clienteEmail || "N/A"}
															</div>
														</div>
													</TableCell>

													{/* Calificación */}
													<TableCell>
														<div className="flex flex-col gap-1">
															<StarDisplay
																rating={Math.round(promedio)}
																size="md"
															/>
															<span className="text-sm font-semibold">
																{promedio}
															</span>
														</div>
													</TableCell>

													{/* Comentario */}
													<TableCell>
														<TooltipProvider>
															<Tooltip>
																<TooltipTrigger asChild>
																	<div className="flex items-center gap-2 cursor-help">
																		<MessageCircle className="w-4 h-4 text-gray-400" />
																		<span className="text-sm">
																			{truncarTexto(evaluacion.comentario, 40)}
																		</span>
																	</div>
																</TooltipTrigger>
																{evaluacion.comentario &&
																	evaluacion.comentario.length > 40 && (
																		<TooltipContent className="max-w-xs">
																			<p>{evaluacion.comentario}</p>
																		</TooltipContent>
																	)}
															</Tooltip>
														</TooltipProvider>
													</TableCell>

													{/* Propina */}
													<TableCell>
														<div className="flex flex-col gap-1">
															<span className="font-semibold text-green-600">
																{formatearMoneda(evaluacion.propinaMonto || 0)}
															</span>
															{evaluacion.propinaMonto > 0 && (
																<Badge
																	variant={
																		evaluacion.propinaPagada
																			? "default"
																			: "secondary"
																	}
																	className={
																		evaluacion.propinaPagada
																			? "bg-green-500"
																			: "bg-yellow-500"
																	}
																>
																	{evaluacion.propinaPagada
																		? "Pagada"
																		: "Pendiente"}
																</Badge>
															)}
														</div>
													</TableCell>

													{/* Acción */}
													<TableCell>
														<Button
															onClick={() => verDetalle(evaluacion)}
															variant="outline"
															size="sm"
														>
															<Eye className="w-4 h-4 mr-1" />
															Ver detalle
														</Button>
													</TableCell>
												</TableRow>
											);
										})}
									</TableBody>
								</Table>
							</div>

							{/* Paginación */}
							{totalPaginas > 1 && (
								<div className="flex justify-between items-center mt-4">
									<p className="text-sm text-gray-500">
										Página {paginaActual} de {totalPaginas}
									</p>
									<div className="flex gap-2">
										<Button
											onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
											disabled={paginaActual === 1}
											variant="outline"
											size="sm"
										>
											<ChevronLeft className="w-4 h-4" />
											Anterior
										</Button>
										<Button
											onClick={() =>
												setPaginaActual((p) => Math.min(totalPaginas, p + 1))
											}
											disabled={paginaActual === totalPaginas}
											variant="outline"
											size="sm"
										>
											Siguiente
											<ChevronRight className="w-4 h-4" />
										</Button>
									</div>
								</div>
							)}
						</>
					)}
				</CardContent>
			</Card>

			{/* Modal de detalle */}
			<Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
				<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle className="text-xl">
							Detalle de Evaluación
						</DialogTitle>
						<DialogDescription>
							Información completa de la evaluación del servicio
						</DialogDescription>
					</DialogHeader>

					{selectedEvaluacion && (
						<div className="space-y-6 py-4">
							{/* Información de la reserva */}
							<Card>
								<CardHeader>
									<CardTitle className="text-base">
										Información de la Reserva
									</CardTitle>
								</CardHeader>
								<CardContent className="space-y-3">
									<div className="grid grid-cols-2 gap-4">
										<div>
											<Label className="text-gray-500">Código</Label>
											<p className="font-semibold">
												{selectedEvaluacion.reservaCodigo || "N/A"}
											</p>
										</div>
										<div>
											<Label className="text-gray-500">Fecha Evaluación</Label>
											<p className="font-semibold">
												{formatearFecha(selectedEvaluacion.fechaCreacion)}
											</p>
										</div>
									</div>
								</CardContent>
							</Card>

							{/* Información del conductor */}
							<Card>
								<CardHeader>
									<CardTitle className="text-base flex items-center gap-2">
										<User className="w-4 h-4" />
										Conductor
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="space-y-2">
										<div>
											<Label className="text-gray-500">Nombre</Label>
											<p className="font-semibold">
												{selectedEvaluacion.conductorNombre || "N/A"}
											</p>
										</div>
									</div>
								</CardContent>
							</Card>

							{/* Información del cliente */}
							<Card>
								<CardHeader>
									<CardTitle className="text-base flex items-center gap-2">
										<User className="w-4 h-4" />
										Cliente
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="space-y-2">
										<div>
											<Label className="text-gray-500">Nombre</Label>
											<p className="font-semibold">
												{selectedEvaluacion.clienteNombre || "N/A"}
											</p>
										</div>
										<div>
											<Label className="text-gray-500">Email</Label>
											<p className="font-semibold">
												{selectedEvaluacion.clienteEmail || "N/A"}
											</p>
										</div>
									</div>
								</CardContent>
							</Card>

							{/* Calificaciones por categoría */}
							<Card>
								<CardHeader>
									<CardTitle className="text-base">
										Calificaciones por Categoría
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="space-y-4">
										{/* Puntualidad */}
										<div className="flex justify-between items-center">
											<div className="flex items-center gap-2">
												<Clock className="w-5 h-5 text-blue-500" />
												<Label>Puntualidad</Label>
											</div>
											<div className="flex items-center gap-2">
												<StarDisplay
													rating={selectedEvaluacion.puntualidad}
													size="md"
												/>
												<span className="font-semibold">
													{selectedEvaluacion.puntualidad}
												</span>
											</div>
										</div>

										{/* Limpieza */}
										<div className="flex justify-between items-center">
											<div className="flex items-center gap-2">
												<Sparkles className="w-5 h-5 text-purple-500" />
												<Label>Limpieza</Label>
											</div>
											<div className="flex items-center gap-2">
												<StarDisplay
													rating={selectedEvaluacion.limpieza}
													size="md"
												/>
												<span className="font-semibold">
													{selectedEvaluacion.limpieza}
												</span>
											</div>
										</div>

										{/* Seguridad */}
										<div className="flex justify-between items-center">
											<div className="flex items-center gap-2">
												<Shield className="w-5 h-5 text-green-500" />
												<Label>Seguridad</Label>
											</div>
											<div className="flex items-center gap-2">
												<StarDisplay
													rating={selectedEvaluacion.seguridad}
													size="md"
												/>
												<span className="font-semibold">
													{selectedEvaluacion.seguridad}
												</span>
											</div>
										</div>

										{/* Comunicación */}
										<div className="flex justify-between items-center">
											<div className="flex items-center gap-2">
												<MessageCircle className="w-5 h-5 text-orange-500" />
												<Label>Comunicación</Label>
											</div>
											<div className="flex items-center gap-2">
												<StarDisplay
													rating={selectedEvaluacion.comunicacion}
													size="md"
												/>
												<span className="font-semibold">
													{selectedEvaluacion.comunicacion}
												</span>
											</div>
										</div>

										{/* Promedio */}
										<div className="border-t pt-4 mt-4">
											<div className="flex justify-between items-center">
												<Label className="text-lg font-bold">
													Promedio General
												</Label>
												<div className="flex items-center gap-2">
													<StarDisplay
														rating={Math.round(
															calcularPromedio(selectedEvaluacion)
														)}
														size="lg"
													/>
													<span className="font-bold text-xl">
														{calcularPromedio(selectedEvaluacion)}
													</span>
												</div>
											</div>
										</div>
									</div>
								</CardContent>
							</Card>

							{/* Comentario */}
							{selectedEvaluacion.comentario && (
								<Card>
									<CardHeader>
										<CardTitle className="text-base flex items-center gap-2">
											<MessageCircle className="w-4 h-4" />
											Comentario del Cliente
										</CardTitle>
									</CardHeader>
									<CardContent>
										<p className="text-gray-700 whitespace-pre-wrap">
											{selectedEvaluacion.comentario}
										</p>
									</CardContent>
								</Card>
							)}

							{/* Información de propina */}
							<Card className="border-red-200 bg-red-50">
								<CardHeader>
									<CardTitle className="text-base flex items-center gap-2 text-red-700">
										<Lock className="w-4 h-4" />
										Información Confidencial - Propina
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="space-y-3">
										<div className="flex justify-between items-center">
											<Label className="text-gray-700">Monto</Label>
											<p className="font-bold text-green-600 text-lg">
												{formatearMoneda(selectedEvaluacion.propinaMonto || 0)}
											</p>
										</div>
										<div className="flex justify-between items-center">
											<Label className="text-gray-700">Estado</Label>
											<Badge
												variant={
													selectedEvaluacion.propinaPagada
														? "default"
														: "secondary"
												}
												className={
													selectedEvaluacion.propinaPagada
														? "bg-green-500"
														: "bg-yellow-500"
												}
											>
												{selectedEvaluacion.propinaPagada
													? "✓ Pagada"
													: "⏳ Pendiente"}
											</Badge>
										</div>
										<div className="bg-red-100 border border-red-300 rounded p-3 mt-3">
											<p className="text-xs text-red-700 flex items-center gap-2">
												<Lock className="w-3 h-3" />
												Esta información es confidencial y solo debe ser
												compartida con personal autorizado.
											</p>
										</div>
									</div>
								</CardContent>
							</Card>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}

export default AdminEvaluaciones;
