// src/components/AdminCalificaciones.jsx
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Star, TrendingUp, Award, AlertTriangle, Loader2, MessageSquare } from "lucide-react";
import { getBackendUrl } from "../lib/backend";

const AdminCalificaciones = () => {
	const [loading, setLoading] = useState(true);
	const [estadisticas, setEstadisticas] = useState(null);
	const [calificaciones, setCalificaciones] = useState([]);
	const [paginacion, setPaginacion] = useState({
		page: 1,
		limit: 20,
		total: 0,
		totalPages: 0,
	});

	// Cargar estadísticas y calificaciones
	useEffect(() => {
		cargarDatos();
	}, [paginacion.page]);

	const cargarDatos = async () => {
		setLoading(true);
		try {
			const token = localStorage.getItem("token");
			
			// Cargar estadísticas
			const statsResponse = await fetch(
				`${getBackendUrl()}/api/admin/calificaciones/estadisticas`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			);

			if (statsResponse.ok) {
				const statsData = await statsResponse.json();
				setEstadisticas(statsData.estadisticas);
			}

			// Cargar calificaciones
			const calificacionesResponse = await fetch(
				`${getBackendUrl()}/api/admin/calificaciones?page=${paginacion.page}&limit=${paginacion.limit}`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			);

			if (calificacionesResponse.ok) {
				const calificacionesData = await calificacionesResponse.json();
				setCalificaciones(calificacionesData.calificaciones);
				setPaginacion({
					...paginacion,
					total: calificacionesData.pagination.total,
					totalPages: calificacionesData.pagination.totalPages,
				});
			}
		} catch (error) {
			console.error("Error al cargar datos:", error);
		} finally {
			setLoading(false);
		}
	};

	// Renderizar estrellas
	const renderEstrellas = (puntuacion, size = "h-5 w-5") => {
		const stars = [];
		for (let i = 1; i <= 5; i++) {
			stars.push(
				<Star
					key={i}
					className={`${size} ${
						i <= puntuacion
							? "fill-yellow-400 text-yellow-400"
							: "text-gray-300"
					}`}
				/>
			);
		}
		return <div className="flex gap-1">{stars}</div>;
	};

	// Formatear fecha
	const formatearFecha = (fecha) => {
		const date = new Date(fecha);
		return new Intl.DateTimeFormat("es-CL", {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		}).format(date);
	};

	if (loading && !estadisticas) {
		return (
			<div className="flex items-center justify-center h-64">
				<Loader2 className="h-8 w-8 animate-spin text-blue-600" />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div>
				<h1 className="text-2xl font-bold text-gray-900">Calificaciones del Servicio</h1>
				<p className="text-gray-600 mt-1">
					Feedback y opiniones de los pasajeros sobre nuestro servicio
				</p>
			</div>

			{/* Estadísticas */}
			{estadisticas && (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
					{/* Total de calificaciones */}
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">
								Total Calificaciones
							</CardTitle>
							<MessageSquare className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">
								{estadisticas.total_calificaciones}
							</div>
						</CardContent>
					</Card>

					{/* Promedio general */}
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">
								Promedio General
							</CardTitle>
							<Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">
								{estadisticas.promedio_general.toFixed(2)}
							</div>
							<p className="text-xs text-muted-foreground">
								de 5.00 estrellas
							</p>
						</CardContent>
					</Card>

					{/* 5 Estrellas */}
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">
								5 Estrellas
							</CardTitle>
							<Award className="h-4 w-4 text-green-600" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold text-green-600">
								{estadisticas.cinco_estrellas}
							</div>
							<p className="text-xs text-muted-foreground">
								{estadisticas.total_calificaciones > 0
									? Math.round(
											(estadisticas.cinco_estrellas /
												estadisticas.total_calificaciones) *
												100
									  )
									: 0}
								% del total
							</p>
						</CardContent>
					</Card>

					{/* Bajo 3 estrellas */}
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">
								Bajo 3 Estrellas
							</CardTitle>
							<AlertTriangle className="h-4 w-4 text-red-600" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold text-red-600">
								{estadisticas.bajo_dos_estrellas}
							</div>
							<p className="text-xs text-muted-foreground">
								Requieren atención
							</p>
						</CardContent>
					</Card>
				</div>
			)}

			{/* Promedios de aspectos */}
			{estadisticas && estadisticas.conteo_aspectos.puntualidad > 0 && (
				<Card>
					<CardHeader>
						<CardTitle>Promedios por Aspecto</CardTitle>
						<CardDescription>
							Basado en calificaciones detalladas de los pasajeros
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
							{Object.entries(estadisticas.promedios_aspectos).map(
								([aspecto, promedio]) => {
									const conteo = estadisticas.conteo_aspectos[aspecto];
									if (conteo === 0) return null;

									const nombres = {
										puntualidad: "Puntualidad",
										limpieza: "Limpieza",
										amabilidad: "Amabilidad",
										conduccion: "Conducción",
									};

									return (
										<div key={aspecto} className="space-y-2">
											<div className="flex justify-between items-center">
												<span className="text-sm font-medium">
													{nombres[aspecto]}
												</span>
												<span className="text-sm text-gray-600">
													{promedio.toFixed(2)}
												</span>
											</div>
											<div className="flex gap-1">
												{[1, 2, 3, 4, 5].map((i) => (
													<Star
														key={i}
														className={`h-4 w-4 ${
															i <= Math.round(promedio)
																? "fill-yellow-400 text-yellow-400"
																: "text-gray-300"
														}`}
													/>
												))}
											</div>
											<p className="text-xs text-gray-500">
												{conteo} calificaciones
											</p>
										</div>
									);
								}
							)}
						</div>
					</CardContent>
				</Card>
			)}

			{/* Lista de calificaciones */}
			<Card>
				<CardHeader>
					<CardTitle>Calificaciones Recientes</CardTitle>
					<CardDescription>
						Últimas opiniones de los pasajeros
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						{calificaciones.length === 0 ? (
							<p className="text-center text-gray-500 py-8">
								No hay calificaciones registradas
							</p>
						) : (
							calificaciones.map((cal) => (
								<div
									key={cal.id}
									className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
								>
									<div className="flex justify-between items-start mb-3">
										<div>
											<h3 className="font-semibold text-gray-900">
												{cal.reserva?.codigoReserva || `Reserva #${cal.reserva_id}`}
											</h3>
											<p className="text-sm text-gray-600">
												{cal.reserva?.origen} → {cal.reserva?.destino}
											</p>
											<p className="text-xs text-gray-500 mt-1">
												{formatearFecha(cal.fecha_calificacion)}
											</p>
										</div>
										<div className="flex items-center gap-2">
											{renderEstrellas(cal.puntuacion, "h-5 w-5")}
											<span className="text-lg font-bold text-gray-900">
												{cal.puntuacion}.0
											</span>
										</div>
									</div>

									{/* Comentario */}
									{cal.comentario && (
										<div className="bg-blue-50 rounded-lg p-3 mb-3">
											<p className="text-sm text-gray-700 italic">
												&quot;{cal.comentario}&quot;
											</p>
										</div>
									)}

									{/* Aspectos detallados */}
									{cal.aspectos && Object.keys(cal.aspectos).length > 0 && (
										<div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t">
											{cal.aspectos.puntualidad && (
												<div>
													<p className="text-xs text-gray-600 mb-1">
														Puntualidad
													</p>
													{renderEstrellas(
														cal.aspectos.puntualidad,
														"h-4 w-4"
													)}
												</div>
											)}
											{cal.aspectos.limpieza && (
												<div>
													<p className="text-xs text-gray-600 mb-1">
														Limpieza
													</p>
													{renderEstrellas(
														cal.aspectos.limpieza,
														"h-4 w-4"
													)}
												</div>
											)}
											{cal.aspectos.amabilidad && (
												<div>
													<p className="text-xs text-gray-600 mb-1">
														Amabilidad
													</p>
													{renderEstrellas(
														cal.aspectos.amabilidad,
														"h-4 w-4"
													)}
												</div>
											)}
											{cal.aspectos.conduccion && (
												<div>
													<p className="text-xs text-gray-600 mb-1">
														Conducción
													</p>
													{renderEstrellas(
														cal.aspectos.conduccion,
														"h-4 w-4"
													)}
												</div>
											)}
										</div>
									)}
								</div>
							))
						)}
					</div>

					{/* Paginación */}
					{paginacion.totalPages > 1 && (
						<div className="flex justify-center gap-2 mt-6">
							<Button
								variant="outline"
								size="sm"
								disabled={paginacion.page === 1}
								onClick={() =>
									setPaginacion({ ...paginacion, page: paginacion.page - 1 })
								}
							>
								Anterior
							</Button>
							<span className="flex items-center px-4 text-sm text-gray-600">
								Página {paginacion.page} de {paginacion.totalPages}
							</span>
							<Button
								variant="outline"
								size="sm"
								disabled={paginacion.page === paginacion.totalPages}
								onClick={() =>
									setPaginacion({ ...paginacion, page: paginacion.page + 1 })
								}
							>
								Siguiente
							</Button>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
};

export default AdminCalificaciones;
