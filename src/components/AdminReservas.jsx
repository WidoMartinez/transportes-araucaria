import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "./ui/table";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	DialogFooter,
} from "./ui/dialog";
import {
	Calendar,
	Download,
	Filter,
	Search,
	TrendingUp,
	Users,
	DollarSign,
	Plus,
	Edit,
	CheckCircle,
	XCircle,
	Clock,
	FileText,
} from "lucide-react";
import { Textarea } from "./ui/textarea";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export default function AdminReservas() {
	const [reservas, setReservas] = useState([]);
	const [estadisticas, setEstadisticas] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [isDialogOpen, setIsDialogOpen] = useState(false);

	// Estado del formulario de nueva reserva
	const [formData, setFormData] = useState({
		nombre: "",
		email: "",
		telefono: "",
		origen: "",
		destino: "",
		fecha: "",
		hora: "08:00",
		pasajeros: 1,
		precio: 0,
		totalConDescuento: 0,
		vehiculo: "",
		observaciones: "",
		estado: "pendiente",
		estadoPago: "pendiente",
	});

	// Filtros
	const [filtros, setFiltros] = useState({
		busqueda: "",
		fechaDesde: "",
		fechaHasta: "",
		estado: "",
		estadoPago: "",
		ordenar: "created_at",
		direccion: "DESC",
	});

	// Paginación
	const [paginacion, setPaginacion] = useState({
		page: 1,
		limit: 20,
		total: 0,
		totalPages: 0,
	});

	// Cargar reservas
	const cargarReservas = async () => {
		try {
			setLoading(true);
			const params = new URLSearchParams({
				page: paginacion.page,
				limit: paginacion.limit,
				...(filtros.estado && { estado: filtros.estado }),
				...(filtros.fechaDesde && { fecha_desde: filtros.fechaDesde }),
				...(filtros.fechaHasta && { fecha_hasta: filtros.fechaHasta }),
			});

			const response = await fetch(`${API_BASE_URL}/api/reservas?${params}`);

			if (!response.ok) throw new Error("Error al cargar reservas");

			const data = await response.json();
			let reservasData = data.reservas || [];

			// Aplicar filtros adicionales en el cliente
			if (filtros.busqueda) {
				const busqueda = filtros.busqueda.toLowerCase();
				reservasData = reservasData.filter(
					(r) =>
						r.nombre?.toLowerCase().includes(busqueda) ||
						r.email?.toLowerCase().includes(busqueda) ||
						r.telefono?.includes(busqueda)
				);
			}

			if (filtros.estadoPago) {
				reservasData = reservasData.filter(
					(r) => r.estadoPago === filtros.estadoPago
				);
			}

			setReservas(reservasData);
			setPaginacion({
				...paginacion,
				total: data.pagination?.total || reservasData.length,
				totalPages: data.pagination?.totalPages || 1,
			});

			// Cargar estadísticas
			cargarEstadisticas();
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	// Cargar estadísticas
	const cargarEstadisticas = async () => {
		try {
			const response = await fetch(`${API_BASE_URL}/api/reservas/estadisticas`);
			if (response.ok) {
				const data = await response.json();
				setEstadisticas(data);
			}
		} catch (err) {
			console.error("Error al cargar estadísticas:", err);
		}
	};

	// Crear nueva reserva
	const crearReserva = async () => {
		try {
			const response = await fetch(`${API_BASE_URL}/api/reservas`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(formData),
			});

			if (!response.ok) throw new Error("Error al crear reserva");

			setIsDialogOpen(false);
			resetForm();
			cargarReservas();
		} catch (err) {
			alert(`Error: ${err.message}`);
		}
	};

	// Actualizar estado de reserva
	const actualizarEstado = async (id, estado, observaciones = "") => {
		try {
			const response = await fetch(
				`${API_BASE_URL}/api/reservas/${id}/estado`,
				{
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ estado, observaciones }),
				}
			);

			if (!response.ok) throw new Error("Error al actualizar estado");

			cargarReservas();
		} catch (err) {
			alert(`Error: ${err.message}`);
		}
	};

	// Actualizar estado de pago
	const actualizarEstadoPago = async (
		id,
		estadoPago,
		metodoPago = "",
		referenciaPago = ""
	) => {
		try {
			const response = await fetch(`${API_BASE_URL}/api/reservas/${id}/pago`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ estadoPago, metodoPago, referenciaPago }),
			});

			if (!response.ok) throw new Error("Error al actualizar estado de pago");

			cargarReservas();
		} catch (err) {
			alert(`Error: ${err.message}`);
		}
	};

	// Exportar a CSV
	const exportarCSV = () => {
		const headers = [
			"ID",
			"Nombre",
			"Email",
			"Teléfono",
			"Origen",
			"Destino",
			"Fecha",
			"Hora",
			"Pasajeros",
			"Precio",
			"Total con Descuento",
			"Estado",
			"Estado Pago",
			"Método Pago",
			"Observaciones",
			"Fecha Creación",
		];

		const csvContent = [
			headers.join(","),
			...reservas.map((r) =>
				[
					r.id,
					`"${r.nombre}"`,
					r.email,
					r.telefono,
					`"${r.origen}"`,
					`"${r.destino}"`,
					r.fecha,
					r.hora || "",
					r.pasajeros,
					r.precio,
					r.totalConDescuento,
					r.estado,
					r.estadoPago,
					r.metodoPago || "",
					`"${r.observaciones || ""}"`,
					new Date(r.createdAt).toISOString().split("T")[0],
				].join(",")
			),
		].join("\n");

		const blob = new Blob(["\ufeff" + csvContent], {
			type: "text/csv;charset=utf-8;",
		});
		const link = document.createElement("a");
		const url = URL.createObjectURL(blob);
		link.setAttribute("href", url);
		link.setAttribute(
			"download",
			`reservas_${new Date().toISOString().split("T")[0]}.csv`
		);
		link.style.visibility = "hidden";
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	// Limpiar filtros
	const limpiarFiltros = () => {
		setFiltros({
			busqueda: "",
			fechaDesde: "",
			fechaHasta: "",
			estado: "",
			estadoPago: "",
			ordenar: "created_at",
			direccion: "DESC",
		});
		setPaginacion({ ...paginacion, page: 1 });
	};

	// Reset form
	const resetForm = () => {
		setFormData({
			nombre: "",
			email: "",
			telefono: "",
			origen: "",
			destino: "",
			fecha: "",
			hora: "08:00",
			pasajeros: 1,
			precio: 0,
			totalConDescuento: 0,
			vehiculo: "",
			observaciones: "",
			estado: "pendiente",
			estadoPago: "pendiente",
		});
	};

	useEffect(() => {
		cargarReservas();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [paginacion.page, filtros.estado, filtros.fechaDesde, filtros.fechaHasta]);

	const formatearFecha = (fecha) => {
		if (!fecha) return "-";
		return new Date(fecha).toLocaleDateString("es-CL", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
		});
	};

	const formatearMonto = (monto) => {
		return new Intl.NumberFormat("es-CL", {
			style: "currency",
			currency: "CLP",
		}).format(monto || 0);
	};

	const getBadgeEstado = (estado) => {
		const colores = {
			pendiente: "bg-yellow-500",
			pendiente_detalles: "bg-orange-500",
			confirmada: "bg-green-500",
			cancelada: "bg-red-500",
			completada: "bg-blue-500",
		};
		return colores[estado] || "bg-gray-500";
	};

	const getBadgeEstadoPago = (estado) => {
		const colores = {
			pendiente: "bg-yellow-500",
			pagado: "bg-green-500",
			fallido: "bg-red-500",
			reembolsado: "bg-purple-500",
		};
		return colores[estado] || "bg-gray-500";
	};

	if (loading && reservas.length === 0) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
					<p className="mt-4 text-muted-foreground">Cargando reservas...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex justify-between items-center">
				<h1 className="text-3xl font-bold">Gestión de Reservas</h1>
				<div className="flex space-x-2">
					<Button onClick={cargarReservas} variant="outline">
						<Calendar className="w-4 h-4 mr-2" />
						Actualizar
					</Button>
					<Button onClick={exportarCSV}>
						<Download className="w-4 h-4 mr-2" />
						Exportar CSV
					</Button>
					<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
						<DialogTrigger asChild>
							<Button onClick={resetForm}>
								<Plus className="w-4 h-4 mr-2" />
								Nueva Reserva
							</Button>
						</DialogTrigger>
						<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
							<DialogHeader>
								<DialogTitle>Crear Nueva Reserva</DialogTitle>
								<DialogDescription>
									Introduce los datos de la reserva manualmente
								</DialogDescription>
							</DialogHeader>
							<div className="grid grid-cols-2 gap-4 py-4">
								<div className="space-y-2">
									<Label htmlFor="nombre">Nombre *</Label>
									<Input
										id="nombre"
										value={formData.nombre}
										onChange={(e) =>
											setFormData({ ...formData, nombre: e.target.value })
										}
										required
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="email">Email *</Label>
									<Input
										id="email"
										type="email"
										value={formData.email}
										onChange={(e) =>
											setFormData({ ...formData, email: e.target.value })
										}
										required
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="telefono">Teléfono *</Label>
									<Input
										id="telefono"
										value={formData.telefono}
										onChange={(e) =>
											setFormData({ ...formData, telefono: e.target.value })
										}
										required
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="pasajeros">Pasajeros *</Label>
									<Input
										id="pasajeros"
										type="number"
										min="1"
										value={formData.pasajeros}
										onChange={(e) =>
											setFormData({
												...formData,
												pasajeros: parseInt(e.target.value) || 1,
											})
										}
										required
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="origen">Origen *</Label>
									<Input
										id="origen"
										value={formData.origen}
										onChange={(e) =>
											setFormData({ ...formData, origen: e.target.value })
										}
										required
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="destino">Destino *</Label>
									<Input
										id="destino"
										value={formData.destino}
										onChange={(e) =>
											setFormData({ ...formData, destino: e.target.value })
										}
										required
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="fecha">Fecha *</Label>
									<Input
										id="fecha"
										type="date"
										value={formData.fecha}
										onChange={(e) =>
											setFormData({ ...formData, fecha: e.target.value })
										}
										required
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="hora">Hora</Label>
									<Input
										id="hora"
										type="time"
										value={formData.hora}
										onChange={(e) =>
											setFormData({ ...formData, hora: e.target.value })
										}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="precio">Precio (CLP) *</Label>
									<Input
										id="precio"
										type="number"
										min="0"
										value={formData.precio}
										onChange={(e) =>
											setFormData({
												...formData,
												precio: parseFloat(e.target.value) || 0,
											})
										}
										required
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="totalConDescuento">
										Total con Descuento (CLP) *
									</Label>
									<Input
										id="totalConDescuento"
										type="number"
										min="0"
										value={formData.totalConDescuento}
										onChange={(e) =>
											setFormData({
												...formData,
												totalConDescuento: parseFloat(e.target.value) || 0,
											})
										}
										required
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="vehiculo">Vehículo</Label>
									<Input
										id="vehiculo"
										value={formData.vehiculo}
										onChange={(e) =>
											setFormData({ ...formData, vehiculo: e.target.value })
										}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="estado">Estado</Label>
									<Select
										value={formData.estado}
										onValueChange={(value) =>
											setFormData({ ...formData, estado: value })
										}
									>
										<SelectTrigger>
											<SelectValue />
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
								<div className="space-y-2 col-span-2">
									<Label htmlFor="observaciones">Observaciones</Label>
									<Textarea
										id="observaciones"
										value={formData.observaciones}
										onChange={(e) =>
											setFormData({
												...formData,
												observaciones: e.target.value,
											})
										}
										rows={3}
									/>
								</div>
							</div>
							<DialogFooter>
								<Button
									variant="outline"
									onClick={() => setIsDialogOpen(false)}
								>
									Cancelar
								</Button>
								<Button onClick={crearReserva}>Crear Reserva</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				</div>
			</div>

			{/* Estadísticas */}
			{estadisticas && (
				<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">
								Total Reservas
							</CardTitle>
							<Users className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">
								{estadisticas.totalReservas}
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">Pendientes</CardTitle>
							<Clock className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">
								{estadisticas.reservasPendientes}
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">Confirmadas</CardTitle>
							<CheckCircle className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">
								{estadisticas.reservasConfirmadas}
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">
								Ingresos Totales
							</CardTitle>
							<DollarSign className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">
								{formatearMonto(estadisticas.ingresosTotales)}
							</div>
						</CardContent>
					</Card>
				</div>
			)}

			{/* Filtros */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center">
						<Filter className="w-4 h-4 mr-2" />
						Filtros
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
						<div className="space-y-2">
							<Label htmlFor="busqueda">Buscar</Label>
							<div className="relative">
								<Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
								<Input
									id="busqueda"
									placeholder="Nombre, email, teléfono..."
									className="pl-8"
									value={filtros.busqueda}
									onChange={(e) =>
										setFiltros({ ...filtros, busqueda: e.target.value })
									}
								/>
							</div>
						</div>
						<div className="space-y-2">
							<Label htmlFor="fechaDesde">Fecha Desde</Label>
							<Input
								id="fechaDesde"
								type="date"
								value={filtros.fechaDesde}
								onChange={(e) =>
									setFiltros({ ...filtros, fechaDesde: e.target.value })
								}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="fechaHasta">Fecha Hasta</Label>
							<Input
								id="fechaHasta"
								type="date"
								value={filtros.fechaHasta}
								onChange={(e) =>
									setFiltros({ ...filtros, fechaHasta: e.target.value })
								}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="estado">Estado</Label>
							<Select
								value={filtros.estado}
								onValueChange={(value) =>
									setFiltros({ ...filtros, estado: value })
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="Todos" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="">Todos</SelectItem>
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
						<div className="space-y-2">
							<Label htmlFor="estadoPago">Estado Pago</Label>
							<Select
								value={filtros.estadoPago}
								onValueChange={(value) =>
									setFiltros({ ...filtros, estadoPago: value })
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="Todos" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="">Todos</SelectItem>
									<SelectItem value="pendiente">Pendiente</SelectItem>
									<SelectItem value="pagado">Pagado</SelectItem>
									<SelectItem value="fallido">Fallido</SelectItem>
									<SelectItem value="reembolsado">Reembolsado</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
					<div className="flex gap-2 mt-4">
						<Button onClick={cargarReservas}>Aplicar Filtros</Button>
						<Button variant="outline" onClick={limpiarFiltros}>
							Limpiar
						</Button>
					</div>
				</CardContent>
			</Card>

			{/* Tabla de Reservas */}
			<Card>
				<CardHeader>
					<CardTitle>
						Reservas ({paginacion.total} total
						{filtros.busqueda || filtros.estado || filtros.estadoPago
							? " - filtradas"
							: ""}
						)
					</CardTitle>
				</CardHeader>
				<CardContent>
					{error && (
						<div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4">
							{error}
						</div>
					)}
					<div className="overflow-x-auto">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>ID</TableHead>
									<TableHead>Nombre</TableHead>
									<TableHead>Contacto</TableHead>
									<TableHead>Ruta</TableHead>
									<TableHead>Fecha/Hora</TableHead>
									<TableHead>Pasajeros</TableHead>
									<TableHead>Monto</TableHead>
									<TableHead>Estado</TableHead>
									<TableHead>Pago</TableHead>
									<TableHead>Acciones</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{reservas.length === 0 ? (
									<TableRow>
										<TableCell colSpan={10} className="text-center py-8">
											No se encontraron reservas
										</TableCell>
									</TableRow>
								) : (
									reservas.map((reserva) => (
										<TableRow key={reserva.id}>
											<TableCell className="font-medium">
												{reserva.id}
											</TableCell>
											<TableCell>{reserva.nombre}</TableCell>
											<TableCell>
												<div className="text-sm">
													<div>{reserva.email}</div>
													<div className="text-muted-foreground">
														{reserva.telefono}
													</div>
												</div>
											</TableCell>
											<TableCell>
												<div className="text-sm">
													<div className="font-medium">{reserva.origen}</div>
													<div className="text-muted-foreground">
														→ {reserva.destino}
													</div>
												</div>
											</TableCell>
											<TableCell>
												<div className="text-sm">
													<div>{formatearFecha(reserva.fecha)}</div>
													<div className="text-muted-foreground">
														{reserva.hora || "-"}
													</div>
												</div>
											</TableCell>
											<TableCell>{reserva.pasajeros}</TableCell>
											<TableCell>
												<div className="text-sm">
													<div className="font-medium">
														{formatearMonto(reserva.totalConDescuento)}
													</div>
													{reserva.precio !== reserva.totalConDescuento && (
														<div className="text-muted-foreground line-through">
															{formatearMonto(reserva.precio)}
														</div>
													)}
												</div>
											</TableCell>
											<TableCell>
												<Select
													value={reserva.estado}
													onValueChange={(value) =>
														actualizarEstado(reserva.id, value)
													}
												>
													<SelectTrigger className="w-[140px]">
														<Badge className={getBadgeEstado(reserva.estado)}>
															{reserva.estado}
														</Badge>
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="pendiente">Pendiente</SelectItem>
														<SelectItem value="pendiente_detalles">
															Pendiente Detalles
														</SelectItem>
														<SelectItem value="confirmada">
															Confirmada
														</SelectItem>
														<SelectItem value="cancelada">Cancelada</SelectItem>
														<SelectItem value="completada">
															Completada
														</SelectItem>
													</SelectContent>
												</Select>
											</TableCell>
											<TableCell>
												<Select
													value={reserva.estadoPago}
													onValueChange={(value) =>
														actualizarEstadoPago(reserva.id, value)
													}
												>
													<SelectTrigger className="w-[120px]">
														<Badge
															className={getBadgeEstadoPago(reserva.estadoPago)}
														>
															{reserva.estadoPago}
														</Badge>
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="pendiente">
															Pendiente
														</SelectItem>
														<SelectItem value="pagado">Pagado</SelectItem>
														<SelectItem value="fallido">Fallido</SelectItem>
														<SelectItem value="reembolsado">
															Reembolsado
														</SelectItem>
													</SelectContent>
												</Select>
											</TableCell>
											<TableCell>
												<Button
													variant="ghost"
													size="sm"
													onClick={() => {
														// Aquí se podría agregar funcionalidad para ver detalles
														console.log("Ver detalles:", reserva);
													}}
												>
													<FileText className="w-4 h-4" />
												</Button>
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</div>

					{/* Paginación */}
					{paginacion.totalPages > 1 && (
						<div className="flex items-center justify-between mt-4">
							<div className="text-sm text-muted-foreground">
								Página {paginacion.page} de {paginacion.totalPages}
							</div>
							<div className="flex gap-2">
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
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
