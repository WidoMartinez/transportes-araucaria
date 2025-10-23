import React, { useState, useEffect } from "react";
import { getBackendUrl } from "../lib/backend";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "./ui/table";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "./ui/dialog";
import {
	User,
	Car,
	DollarSign,
	TrendingUp,
	TrendingDown,
	Calendar,
	Receipt,
	Eye,
	BarChart3,
} from "lucide-react";

function AdminEstadisticas() {
	const ADMIN_TOKEN =
		import.meta.env.VITE_ADMIN_TOKEN ||
		(typeof window !== "undefined"
			? localStorage.getItem("adminToken") || ""
			: "");

	const apiUrl = getBackendUrl() || "https://transportes-araucaria.onrender.com";

	const [vistaActual, setVistaActual] = useState("conductores");
	const [estadisticasConductores, setEstadisticasConductores] = useState([]);
	const [estadisticasVehiculos, setEstadisticasVehiculos] = useState([]);
	const [loading, setLoading] = useState(false);
	const [conductorDetalle, setConductorDetalle] = useState(null);
	const [showDetalleDialog, setShowDetalleDialog] = useState(false);

	useEffect(() => {
		if (vistaActual === "conductores") {
			fetchEstadisticasConductores();
		} else {
			fetchEstadisticasVehiculos();
		}
	}, [vistaActual]);

	const fetchEstadisticasConductores = async () => {
		setLoading(true);
		try {
			const response = await fetch(`${apiUrl}/api/estadisticas/conductores`, {
				headers: {
					Authorization: `Bearer ${ADMIN_TOKEN}`,
				},
			});
			if (response.ok) {
				const data = await response.json();
				setEstadisticasConductores(data.estadisticas || []);
			}
		} catch (error) {
			console.error("Error al cargar estadísticas de conductores:", error);
		} finally {
			setLoading(false);
		}
	};

	const fetchEstadisticasVehiculos = async () => {
		setLoading(true);
		try {
			const response = await fetch(`${apiUrl}/api/estadisticas/vehiculos`, {
				headers: {
					Authorization: `Bearer ${ADMIN_TOKEN}`,
				},
			});
			if (response.ok) {
				const data = await response.json();
				setEstadisticasVehiculos(data.estadisticas || []);
			}
		} catch (error) {
			console.error("Error al cargar estadísticas de vehículos:", error);
		} finally {
			setLoading(false);
		}
	};

	const fetchDetalleConductor = async (conductorId) => {
		setLoading(true);
		try {
			const response = await fetch(
				`${apiUrl}/api/estadisticas/conductores/${conductorId}`,
				{
					headers: {
						Authorization: `Bearer ${ADMIN_TOKEN}`,
					},
				}
			);
			if (response.ok) {
				const data = await response.json();
				setConductorDetalle(data);
				setShowDetalleDialog(true);
			}
		} catch (error) {
			console.error("Error al cargar detalle del conductor:", error);
		} finally {
			setLoading(false);
		}
	};

	const calcularTotales = (estadisticas) => {
		return estadisticas.reduce(
			(acc, item) => ({
				totalReservas: acc.totalReservas + item.totalReservas,
				totalIngresos: acc.totalIngresos + item.totalIngresos,
				totalGastos: acc.totalGastos + item.totalGastos,
				utilidad: acc.utilidad + item.utilidad,
			}),
			{ totalReservas: 0, totalIngresos: 0, totalGastos: 0, utilidad: 0 }
		);
	};

	const totalesConductores = calcularTotales(estadisticasConductores);
	const totalesVehiculos = calcularTotales(estadisticasVehiculos);

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<h2 className="text-2xl font-bold">Estadísticas</h2>
				<Select value={vistaActual} onValueChange={setVistaActual}>
					<SelectTrigger className="w-[200px]">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="conductores">
							<div className="flex items-center gap-2">
								<User className="w-4 h-4" />
								<span>Conductores</span>
							</div>
						</SelectItem>
						<SelectItem value="vehiculos">
							<div className="flex items-center gap-2">
								<Car className="w-4 h-4" />
								<span>Vehículos</span>
							</div>
						</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{vistaActual === "conductores" && (
				<>
					<div className="grid grid-cols-4 gap-4">
						<Card>
							<CardHeader className="pb-2">
								<CardTitle className="text-sm font-medium text-muted-foreground">
									Total Reservas
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="flex items-center gap-2">
									<Calendar className="w-5 h-5 text-blue-600" />
									<span className="text-2xl font-bold">
										{totalesConductores.totalReservas}
									</span>
								</div>
							</CardContent>
						</Card>
						<Card>
							<CardHeader className="pb-2">
								<CardTitle className="text-sm font-medium text-muted-foreground">
									Total Ingresos
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="flex items-center gap-2">
									<TrendingUp className="w-5 h-5 text-green-600" />
									<span className="text-2xl font-bold text-green-600">
										${totalesConductores.totalIngresos.toLocaleString("es-CL")}
									</span>
								</div>
							</CardContent>
						</Card>
						<Card>
							<CardHeader className="pb-2">
								<CardTitle className="text-sm font-medium text-muted-foreground">
									Total Gastos
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="flex items-center gap-2">
									<TrendingDown className="w-5 h-5 text-red-600" />
									<span className="text-2xl font-bold text-red-600">
										${totalesConductores.totalGastos.toLocaleString("es-CL")}
									</span>
								</div>
							</CardContent>
						</Card>
						<Card>
							<CardHeader className="pb-2">
								<CardTitle className="text-sm font-medium text-muted-foreground">
									Utilidad Total
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="flex items-center gap-2">
									<DollarSign className="w-5 h-5 text-blue-600" />
									<span className="text-2xl font-bold text-blue-600">
										${totalesConductores.utilidad.toLocaleString("es-CL")}
									</span>
								</div>
							</CardContent>
						</Card>
					</div>

					<Card>
						<CardHeader>
							<CardTitle>Estadísticas por Conductor</CardTitle>
						</CardHeader>
						<CardContent>
							{loading ? (
								<p>Cargando estadísticas...</p>
							) : estadisticasConductores.length === 0 ? (
								<p className="text-muted-foreground text-center py-8">
									No hay datos disponibles
								</p>
							) : (
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Conductor</TableHead>
											<TableHead>RUT</TableHead>
											<TableHead>Reservas</TableHead>
											<TableHead>Completadas</TableHead>
											<TableHead>Ingresos</TableHead>
											<TableHead>Gastos</TableHead>
											<TableHead>Pagos Recibidos</TableHead>
											<TableHead>Utilidad</TableHead>
											<TableHead>Acciones</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{estadisticasConductores.map((conductor) => (
											<TableRow key={conductor.id}>
												<TableCell className="font-medium">
													{conductor.nombre}
												</TableCell>
												<TableCell>{conductor.rut}</TableCell>
												<TableCell>{conductor.totalReservas}</TableCell>
												<TableCell>{conductor.reservasCompletadas}</TableCell>
												<TableCell className="text-green-600 font-semibold">
													${conductor.totalIngresos.toLocaleString("es-CL")}
												</TableCell>
												<TableCell className="text-red-600 font-semibold">
													${conductor.totalGastos.toLocaleString("es-CL")}
												</TableCell>
												<TableCell className="text-blue-600 font-semibold">
													${conductor.pagosConductor.toLocaleString("es-CL")}
												</TableCell>
												<TableCell>
													<Badge
														variant={
															conductor.utilidad >= 0 ? "default" : "destructive"
														}
													>
														${conductor.utilidad.toLocaleString("es-CL")}
													</Badge>
												</TableCell>
												<TableCell>
													<Button
														variant="ghost"
														size="sm"
														onClick={() => fetchDetalleConductor(conductor.id)}
													>
														<Eye className="w-4 h-4 mr-2" />
														Ver Detalle
													</Button>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							)}
						</CardContent>
					</Card>
				</>
			)}

			{vistaActual === "vehiculos" && (
				<>
					<div className="grid grid-cols-4 gap-4">
						<Card>
							<CardHeader className="pb-2">
								<CardTitle className="text-sm font-medium text-muted-foreground">
									Total Reservas
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="flex items-center gap-2">
									<Calendar className="w-5 h-5 text-blue-600" />
									<span className="text-2xl font-bold">
										{totalesVehiculos.totalReservas}
									</span>
								</div>
							</CardContent>
						</Card>
						<Card>
							<CardHeader className="pb-2">
								<CardTitle className="text-sm font-medium text-muted-foreground">
									Total Ingresos
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="flex items-center gap-2">
									<TrendingUp className="w-5 h-5 text-green-600" />
									<span className="text-2xl font-bold text-green-600">
										${totalesVehiculos.totalIngresos.toLocaleString("es-CL")}
									</span>
								</div>
							</CardContent>
						</Card>
						<Card>
							<CardHeader className="pb-2">
								<CardTitle className="text-sm font-medium text-muted-foreground">
									Total Gastos
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="flex items-center gap-2">
									<TrendingDown className="w-5 h-5 text-red-600" />
									<span className="text-2xl font-bold text-red-600">
										${totalesVehiculos.totalGastos.toLocaleString("es-CL")}
									</span>
								</div>
							</CardContent>
						</Card>
						<Card>
							<CardHeader className="pb-2">
								<CardTitle className="text-sm font-medium text-muted-foreground">
									Utilidad Total
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="flex items-center gap-2">
									<DollarSign className="w-5 h-5 text-blue-600" />
									<span className="text-2xl font-bold text-blue-600">
										${totalesVehiculos.utilidad.toLocaleString("es-CL")}
									</span>
								</div>
							</CardContent>
						</Card>
					</div>

					<Card>
						<CardHeader>
							<CardTitle>Estadísticas por Vehículo</CardTitle>
						</CardHeader>
						<CardContent>
							{loading ? (
								<p>Cargando estadísticas...</p>
							) : estadisticasVehiculos.length === 0 ? (
								<p className="text-muted-foreground text-center py-8">
									No hay datos disponibles
								</p>
							) : (
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Patente</TableHead>
											<TableHead>Marca/Modelo</TableHead>
											<TableHead>Tipo</TableHead>
											<TableHead>Reservas</TableHead>
											<TableHead>Completadas</TableHead>
											<TableHead>Ingresos</TableHead>
											<TableHead>Gastos</TableHead>
											<TableHead>Combustible</TableHead>
											<TableHead>Mantenimiento</TableHead>
											<TableHead>Utilidad</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{estadisticasVehiculos.map((vehiculo) => (
											<TableRow key={vehiculo.id}>
												<TableCell className="font-medium">
													{vehiculo.patente}
												</TableCell>
												<TableCell>
													{vehiculo.marca} {vehiculo.modelo}
												</TableCell>
												<TableCell>
													<Badge variant="outline">{vehiculo.tipo}</Badge>
												</TableCell>
												<TableCell>{vehiculo.totalReservas}</TableCell>
												<TableCell>{vehiculo.reservasCompletadas}</TableCell>
												<TableCell className="text-green-600 font-semibold">
													${vehiculo.totalIngresos.toLocaleString("es-CL")}
												</TableCell>
												<TableCell className="text-red-600 font-semibold">
													${vehiculo.totalGastos.toLocaleString("es-CL")}
												</TableCell>
												<TableCell className="text-orange-600">
													${vehiculo.gastoCombustible.toLocaleString("es-CL")}
												</TableCell>
												<TableCell className="text-purple-600">
													${vehiculo.gastoMantenimiento.toLocaleString("es-CL")}
												</TableCell>
												<TableCell>
													<Badge
														variant={
															vehiculo.utilidad >= 0 ? "default" : "destructive"
														}
													>
														${vehiculo.utilidad.toLocaleString("es-CL")}
													</Badge>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							)}
						</CardContent>
					</Card>
				</>
			)}

			<Dialog open={showDetalleDialog} onOpenChange={setShowDetalleDialog}>
				<DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>
							Detalle del Conductor: {conductorDetalle?.conductor?.nombre}
						</DialogTitle>
					</DialogHeader>
					{conductorDetalle && (
						<div className="space-y-6">
							<div className="grid grid-cols-4 gap-4">
								<Card>
									<CardHeader className="pb-2">
										<CardTitle className="text-sm">Total Reservas</CardTitle>
									</CardHeader>
									<CardContent>
										<p className="text-2xl font-bold">
											{conductorDetalle.totalReservas}
										</p>
									</CardContent>
								</Card>
								<Card>
									<CardHeader className="pb-2">
										<CardTitle className="text-sm">Total Ingresos</CardTitle>
									</CardHeader>
									<CardContent>
										<p className="text-2xl font-bold text-green-600">
											${conductorDetalle.totalIngresos.toLocaleString("es-CL")}
										</p>
									</CardContent>
								</Card>
								<Card>
									<CardHeader className="pb-2">
										<CardTitle className="text-sm">Total Gastos</CardTitle>
									</CardHeader>
									<CardContent>
										<p className="text-2xl font-bold text-red-600">
											${conductorDetalle.totalGastos.toLocaleString("es-CL")}
										</p>
									</CardContent>
								</Card>
								<Card>
									<CardHeader className="pb-2">
										<CardTitle className="text-sm">Utilidad</CardTitle>
									</CardHeader>
									<CardContent>
										<p className="text-2xl font-bold text-blue-600">
											$
											{(
												conductorDetalle.totalIngresos -
												conductorDetalle.totalGastos
											).toLocaleString("es-CL")}
										</p>
									</CardContent>
								</Card>
							</div>

							<Card>
								<CardHeader>
									<CardTitle>Gastos por Tipo</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="grid grid-cols-2 gap-4">
										{Object.entries(conductorDetalle.gastosPorTipo || {}).map(
											([tipo, datos]) => (
												<div
													key={tipo}
													className="p-4 border rounded-lg flex justify-between items-center"
												>
													<div>
														<p className="text-sm text-muted-foreground capitalize">
															{tipo.replace("_", " ")}
														</p>
														<p className="text-lg font-semibold">
															${datos.total.toLocaleString("es-CL")}
														</p>
													</div>
													<Badge>{datos.cantidad} registros</Badge>
												</div>
											)
										)}
									</div>
								</CardContent>
							</Card>

							<Card>
								<CardHeader>
									<CardTitle>Vehículos Asociados</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="grid grid-cols-3 gap-4">
										{conductorDetalle.vehiculosAsociados?.map((vehiculo) => (
											<div
												key={vehiculo.id}
												className="p-4 border rounded-lg flex items-center gap-3"
											>
												<Car className="w-8 h-8 text-blue-600" />
												<div>
													<p className="font-semibold">{vehiculo.patente}</p>
													<p className="text-sm text-muted-foreground">
														{vehiculo.marca} {vehiculo.modelo}
													</p>
												</div>
											</div>
										))}
									</div>
								</CardContent>
							</Card>

							<Card>
								<CardHeader>
									<CardTitle>Historial de Reservas</CardTitle>
								</CardHeader>
								<CardContent>
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>Código</TableHead>
												<TableHead>Fecha</TableHead>
												<TableHead>Ruta</TableHead>
												<TableHead>Estado</TableHead>
												<TableHead>Total</TableHead>
												<TableHead>Vehículo</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{conductorDetalle.reservas?.map((reserva) => (
												<TableRow key={reserva.id}>
													<TableCell className="font-medium">
														{reserva.codigoReserva}
													</TableCell>
													<TableCell>
														{new Date(reserva.fecha).toLocaleDateString("es-CL")}
													</TableCell>
													<TableCell>
														{reserva.origen} → {reserva.destino}
													</TableCell>
													<TableCell>
														<Badge>{reserva.estado}</Badge>
													</TableCell>
													<TableCell className="font-semibold">
														$
														{parseFloat(
															reserva.totalConDescuento
														).toLocaleString("es-CL")}
													</TableCell>
													<TableCell>
														{reserva.vehiculo
															? `${reserva.vehiculo.patente}`
															: "-"}
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</CardContent>
							</Card>

							<Card>
								<CardHeader>
									<CardTitle>Historial de Gastos</CardTitle>
								</CardHeader>
								<CardContent>
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>Fecha</TableHead>
												<TableHead>Tipo</TableHead>
												<TableHead>Monto</TableHead>
												<TableHead>Reserva</TableHead>
												<TableHead>Descripción</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{conductorDetalle.gastos?.map((gasto) => (
												<TableRow key={gasto.id}>
													<TableCell>
														{new Date(gasto.fecha).toLocaleDateString("es-CL")}
													</TableCell>
													<TableCell>
														<Badge variant="outline">
															{gasto.tipoGasto.replace("_", " ")}
														</Badge>
													</TableCell>
													<TableCell className="font-semibold">
														${parseFloat(gasto.monto).toLocaleString("es-CL")}
													</TableCell>
													<TableCell>
														{gasto.reserva?.codigoReserva || "-"}
													</TableCell>
													<TableCell className="max-w-xs truncate">
														{gasto.descripcion || "-"}
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</CardContent>
							</Card>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}

export default AdminEstadisticas;
