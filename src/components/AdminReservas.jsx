import React, { useState, useEffect, useMemo } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
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
	DialogTrigger,
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
	Search,
	ChevronLeft,
	ChevronRight,
	Edit,
	Eye,
	DollarSign,
	Calendar,
	User,
	Phone,
	Mail,
	MapPin,
	Clock,
	Users,
	FileText,
	TrendingUp,
	CheckCircle2,
	XCircle,
	AlertCircle,
	RefreshCw,
} from "lucide-react";

function AdminReservas() {
	const [reservas, setReservas] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [selectedReserva, setSelectedReserva] = useState(null);
	const [showEditDialog, setShowEditDialog] = useState(false);
	const [showDetailDialog, setShowDetailDialog] = useState(false);
	const [saving, setSaving] = useState(false);

	// Filtros y búsqueda
	const [searchTerm, setSearchTerm] = useState("");
	const [estadoFiltro, setEstadoFiltro] = useState("todos");
	const [estadoPagoFiltro, setEstadoPagoFiltro] = useState("todos");
	const [fechaDesde, setFechaDesde] = useState("");
	const [fechaHasta, setFechaHasta] = useState("");

	// Paginación
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [totalReservas, setTotalReservas] = useState(0);
	const itemsPerPage = 20;

	// Estadísticas
	const [estadisticas, setEstadisticas] = useState({
		totalReservas: 0,
		reservasPendientes: 0,
		reservasConfirmadas: 0,
		reservasPagadas: 0,
		totalIngresos: 0,
	});

	// Formulario de edición
	const [formData, setFormData] = useState({
		estado: "",
		estadoPago: "",
		metodoPago: "",
		referenciaPago: "",
		observaciones: "",
		numeroVuelo: "",
		hotel: "",
		equipajeEspecial: "",
		sillaInfantil: false,
		horaRegreso: "",
	});

	const apiUrl =
		import.meta.env.VITE_API_URL ||
		"https://transportes-araucaria.onrender.com";

	// Cargar estadísticas
	const fetchEstadisticas = async () => {
		try {
			const response = await fetch(`${apiUrl}/api/reservas/estadisticas`);
			if (response.ok) {
				const data = await response.json();
				setEstadisticas(data);
			}
		} catch (error) {
			console.error("Error cargando estadísticas:", error);
		}
	};

	// Cargar reservas
	const fetchReservas = async () => {
		setLoading(true);
		setError(null);
		try {
			const params = new URLSearchParams({
				page: currentPage,
				limit: itemsPerPage,
			});

			if (estadoFiltro !== "todos") {
				params.append("estado", estadoFiltro);
			}

			if (fechaDesde) {
				params.append("fecha_desde", fechaDesde);
			}

			if (fechaHasta) {
				params.append("fecha_hasta", fechaHasta);
			}

			const response = await fetch(`${apiUrl}/api/reservas?${params}`);

			if (!response.ok) {
				throw new Error(`Error ${response.status}: ${response.statusText}`);
			}

			const data = await response.json();
			setReservas(data.reservas || []);
			setTotalPages(data.pagination?.totalPages || 1);
			setTotalReservas(data.pagination?.total || 0);
		} catch (error) {
			console.error("Error cargando reservas:", error);
			setError(error.message || "Error al cargar las reservas");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchReservas();
		fetchEstadisticas();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentPage, estadoFiltro, fechaDesde, fechaHasta]);

	// Filtrar reservas localmente por búsqueda
	const reservasFiltradas = useMemo(() => {
		let filtered = reservas;

		// Filtro de búsqueda
		if (searchTerm) {
			const term = searchTerm.toLowerCase();
			filtered = filtered.filter(
				(r) =>
					r.nombre?.toLowerCase().includes(term) ||
					r.email?.toLowerCase().includes(term) ||
					r.telefono?.toLowerCase().includes(term) ||
					r.id?.toString().includes(term)
			);
		}

		// Filtro de estado de pago
		if (estadoPagoFiltro !== "todos") {
			filtered = filtered.filter((r) => r.estadoPago === estadoPagoFiltro);
		}

		return filtered;
	}, [reservas, searchTerm, estadoPagoFiltro]);

	// Abrir modal de edición
	const handleEdit = (reserva) => {
		setSelectedReserva(reserva);
		setFormData({
			estado: reserva.estado || "",
			estadoPago: reserva.estadoPago || "",
			metodoPago: reserva.metodoPago || "",
			referenciaPago: reserva.referenciaPago || "",
			observaciones: reserva.observaciones || "",
			numeroVuelo: reserva.numeroVuelo || "",
			hotel: reserva.hotel || "",
			equipajeEspecial: reserva.equipajeEspecial || "",
			sillaInfantil: reserva.sillaInfantil || false,
			horaRegreso: reserva.horaRegreso || "",
		});
		setShowEditDialog(true);
	};

	// Abrir modal de detalles
	const handleViewDetails = (reserva) => {
		setSelectedReserva(reserva);
		setShowDetailDialog(true);
	};

	// Guardar cambios
	const handleSave = async () => {
		if (!selectedReserva) return;

		setSaving(true);
		try {
			// Actualizar estado
			const estadoResponse = await fetch(
				`${apiUrl}/api/reservas/${selectedReserva.id}/estado`,
				{
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						estado: formData.estado,
						observaciones: formData.observaciones,
					}),
				}
			);

			if (!estadoResponse.ok) {
				throw new Error("Error al actualizar el estado");
			}

			// Actualizar pago
			const pagoResponse = await fetch(
				`${apiUrl}/api/reservas/${selectedReserva.id}/pago`,
				{
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						estadoPago: formData.estadoPago,
						metodoPago: formData.metodoPago,
						referenciaPago: formData.referenciaPago,
					}),
				}
			);

			if (!pagoResponse.ok) {
				throw new Error("Error al actualizar el pago");
			}

			// Recargar datos
			await fetchReservas();
			await fetchEstadisticas();
			setShowEditDialog(false);
			setSelectedReserva(null);
		} catch (error) {
			console.error("Error guardando cambios:", error);
			alert("Error al guardar los cambios: " + error.message);
		} finally {
			setSaving(false);
		}
	};

	// Función para obtener el badge del estado
	const getEstadoBadge = (estado) => {
		const estados = {
			pendiente: { variant: "secondary", label: "Pendiente", icon: Clock },
			pendiente_detalles: {
				variant: "outline",
				label: "Pendiente Detalles",
				icon: AlertCircle,
			},
			confirmada: { variant: "default", label: "Confirmada", icon: CheckCircle2 },
			cancelada: { variant: "destructive", label: "Cancelada", icon: XCircle },
			completada: { variant: "default", label: "Completada", icon: CheckCircle2 },
		};

		const config = estados[estado] || estados.pendiente;
		const Icon = config.icon;

		return (
			<Badge variant={config.variant} className="flex items-center gap-1">
				<Icon className="w-3 h-3" />
				{config.label}
			</Badge>
		);
	};

	// Función para obtener el badge del estado de pago
	const getEstadoPagoBadge = (estadoPago) => {
		const estados = {
			pendiente: { variant: "secondary", label: "Pendiente" },
			pagado: { variant: "default", label: "Pagado" },
			fallido: { variant: "destructive", label: "Fallido" },
			reembolsado: { variant: "outline", label: "Reembolsado" },
		};

		const config = estados[estadoPago] || estados.pendiente;

		return <Badge variant={config.variant}>{config.label}</Badge>;
	};

	// Formatear moneda
	const formatCurrency = (amount) => {
		return new Intl.NumberFormat("es-CL", {
			style: "currency",
			currency: "CLP",
		}).format(amount || 0);
	};

	// Formatear fecha
	const formatDate = (date) => {
		if (!date) return "-";
		return new Date(date).toLocaleDateString("es-CL");
	};

	if (loading && reservas.length === 0) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="text-center">
					<RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
					<p>Cargando reservas...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Encabezado y Estadísticas */}
			<div>
				<h2 className="text-3xl font-bold mb-4">Gestión de Reservas</h2>
				<div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium text-muted-foreground">
								Total Reservas
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="flex items-center gap-2">
								<FileText className="w-4 h-4 text-blue-500" />
								<span className="text-2xl font-bold">
									{estadisticas.totalReservas}
								</span>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium text-muted-foreground">
								Pendientes
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="flex items-center gap-2">
								<Clock className="w-4 h-4 text-yellow-500" />
								<span className="text-2xl font-bold">
									{estadisticas.reservasPendientes}
								</span>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium text-muted-foreground">
								Confirmadas
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="flex items-center gap-2">
								<CheckCircle2 className="w-4 h-4 text-green-500" />
								<span className="text-2xl font-bold">
									{estadisticas.reservasConfirmadas}
								</span>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium text-muted-foreground">
								Pagadas
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="flex items-center gap-2">
								<DollarSign className="w-4 h-4 text-green-600" />
								<span className="text-2xl font-bold">
									{estadisticas.reservasPagadas}
								</span>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium text-muted-foreground">
								Ingresos Totales
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="flex items-center gap-2">
								<TrendingUp className="w-4 h-4 text-green-600" />
								<span className="text-xl font-bold">
									{formatCurrency(estadisticas.totalIngresos)}
								</span>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>

			{/* Filtros y Búsqueda */}
			<Card>
				<CardHeader>
					<CardTitle>Filtros de Búsqueda</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
						<div className="space-y-2">
							<Label>Buscar</Label>
							<div className="relative">
								<Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
								<Input
									placeholder="Nombre, email, teléfono, ID..."
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									className="pl-8"
								/>
							</div>
						</div>

						<div className="space-y-2">
							<Label>Estado</Label>
							<Select value={estadoFiltro} onValueChange={setEstadoFiltro}>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="todos">Todos</SelectItem>
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
							<Label>Estado de Pago</Label>
							<Select
								value={estadoPagoFiltro}
								onValueChange={setEstadoPagoFiltro}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="todos">Todos</SelectItem>
									<SelectItem value="pendiente">Pendiente</SelectItem>
									<SelectItem value="pagado">Pagado</SelectItem>
									<SelectItem value="fallido">Fallido</SelectItem>
									<SelectItem value="reembolsado">Reembolsado</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label>Fecha Desde</Label>
							<Input
								type="date"
								value={fechaDesde}
								onChange={(e) => setFechaDesde(e.target.value)}
							/>
						</div>

						<div className="space-y-2">
							<Label>Fecha Hasta</Label>
							<Input
								type="date"
								value={fechaHasta}
								onChange={(e) => setFechaHasta(e.target.value)}
							/>
						</div>
					</div>

					<div className="mt-4 flex justify-between items-center">
						<p className="text-sm text-muted-foreground">
							Mostrando {reservasFiltradas.length} de {totalReservas} reservas
						</p>
						<Button
							variant="outline"
							size="sm"
							onClick={() => {
								setSearchTerm("");
								setEstadoFiltro("todos");
								setEstadoPagoFiltro("todos");
								setFechaDesde("");
								setFechaHasta("");
								setCurrentPage(1);
							}}
						>
							<RefreshCw className="w-4 h-4 mr-2" />
							Limpiar Filtros
						</Button>
					</div>
				</CardContent>
			</Card>

			{/* Tabla de Reservas */}
			<Card>
				<CardHeader>
					<CardTitle>Lista de Reservas</CardTitle>
				</CardHeader>
				<CardContent>
					{error && (
						<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
							<p className="font-medium">Error:</p>
							<p>{error}</p>
						</div>
					)}

					<div className="overflow-x-auto">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>ID</TableHead>
									<TableHead>Cliente</TableHead>
									<TableHead>Contacto</TableHead>
									<TableHead>Ruta</TableHead>
									<TableHead>Fecha/Hora</TableHead>
									<TableHead>Pasajeros</TableHead>
									<TableHead>Total</TableHead>
									<TableHead>Estado</TableHead>
									<TableHead>Pago</TableHead>
									<TableHead>Saldo</TableHead>
									<TableHead>Acciones</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{reservasFiltradas.length === 0 ? (
									<TableRow>
										<TableCell colSpan={11} className="text-center py-8">
											<div className="text-muted-foreground">
												<FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
												<p>No se encontraron reservas</p>
											</div>
										</TableCell>
									</TableRow>
								) : (
									reservasFiltradas.map((reserva) => (
										<TableRow key={reserva.id}>
											<TableCell className="font-medium">#{reserva.id}</TableCell>
											<TableCell>
												<div className="flex items-center gap-2">
													<User className="w-4 h-4 text-muted-foreground" />
													<span className="font-medium">{reserva.nombre}</span>
												</div>
											</TableCell>
											<TableCell>
												<div className="space-y-1 text-sm">
													<div className="flex items-center gap-1">
														<Mail className="w-3 h-3 text-muted-foreground" />
														<span className="truncate max-w-[150px]">
															{reserva.email}
														</span>
													</div>
													<div className="flex items-center gap-1">
														<Phone className="w-3 h-3 text-muted-foreground" />
														<span>{reserva.telefono}</span>
													</div>
												</div>
											</TableCell>
											<TableCell>
												<div className="space-y-1 text-sm">
													<div className="flex items-center gap-1">
														<MapPin className="w-3 h-3 text-green-500" />
														<span className="font-medium">{reserva.origen}</span>
													</div>
													<div className="flex items-center gap-1">
														<MapPin className="w-3 h-3 text-red-500" />
														<span className="font-medium">{reserva.destino}</span>
													</div>
												</div>
											</TableCell>
											<TableCell>
												<div className="space-y-1 text-sm">
													<div className="flex items-center gap-1">
														<Calendar className="w-3 h-3 text-muted-foreground" />
														<span>{formatDate(reserva.fecha)}</span>
													</div>
													<div className="flex items-center gap-1">
														<Clock className="w-3 h-3 text-muted-foreground" />
														<span>{reserva.hora || "-"}</span>
													</div>
												</div>
											</TableCell>
											<TableCell>
												<div className="flex items-center gap-1">
													<Users className="w-4 h-4 text-muted-foreground" />
													<span className="font-medium">{reserva.pasajeros}</span>
												</div>
											</TableCell>
											<TableCell className="font-semibold">
												{formatCurrency(reserva.totalConDescuento)}
											</TableCell>
											<TableCell>{getEstadoBadge(reserva.estado)}</TableCell>
											<TableCell>
												{getEstadoPagoBadge(reserva.estadoPago)}
											</TableCell>
											<TableCell>
												<span
													className={
														reserva.saldoPendiente > 0
															? "text-red-600 font-semibold"
															: "text-green-600 font-semibold"
													}
												>
													{formatCurrency(reserva.saldoPendiente)}
												</span>
											</TableCell>
											<TableCell>
												<div className="flex gap-2">
													<Button
														variant="outline"
														size="sm"
														onClick={() => handleViewDetails(reserva)}
													>
														<Eye className="w-4 h-4" />
													</Button>
													<Button
														variant="default"
														size="sm"
														onClick={() => handleEdit(reserva)}
													>
														<Edit className="w-4 h-4" />
													</Button>
												</div>
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</div>

					{/* Paginación */}
					<div className="flex items-center justify-between mt-4">
						<p className="text-sm text-muted-foreground">
							Página {currentPage} de {totalPages}
						</p>
						<div className="flex gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
								disabled={currentPage === 1}
							>
								<ChevronLeft className="w-4 h-4" />
								Anterior
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
								disabled={currentPage === totalPages}
							>
								Siguiente
								<ChevronRight className="w-4 h-4" />
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Modal de Detalles */}
			<Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
				<DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Detalles de Reserva #{selectedReserva?.id}</DialogTitle>
						<DialogDescription>
							Información completa de la reserva
						</DialogDescription>
					</DialogHeader>

					{selectedReserva && (
						<div className="space-y-6">
							{/* Información del Cliente */}
							<div>
								<h3 className="font-semibold text-lg mb-3">
									Información del Cliente
								</h3>
								<div className="grid grid-cols-2 gap-4">
									<div>
										<Label className="text-muted-foreground">Nombre</Label>
										<p className="font-medium">{selectedReserva.nombre}</p>
									</div>
									<div>
										<Label className="text-muted-foreground">Email</Label>
										<p className="font-medium">{selectedReserva.email}</p>
									</div>
									<div>
										<Label className="text-muted-foreground">Teléfono</Label>
										<p className="font-medium">{selectedReserva.telefono}</p>
									</div>
								</div>
							</div>

							{/* Detalles del Viaje */}
							<div>
								<h3 className="font-semibold text-lg mb-3">Detalles del Viaje</h3>
								<div className="grid grid-cols-2 gap-4">
									<div>
										<Label className="text-muted-foreground">Origen</Label>
										<p className="font-medium">{selectedReserva.origen}</p>
									</div>
									<div>
										<Label className="text-muted-foreground">Destino</Label>
										<p className="font-medium">{selectedReserva.destino}</p>
									</div>
									<div>
										<Label className="text-muted-foreground">Fecha</Label>
										<p className="font-medium">
											{formatDate(selectedReserva.fecha)}
										</p>
									</div>
									<div>
										<Label className="text-muted-foreground">Hora</Label>
										<p className="font-medium">{selectedReserva.hora || "-"}</p>
									</div>
									<div>
										<Label className="text-muted-foreground">Pasajeros</Label>
										<p className="font-medium">{selectedReserva.pasajeros}</p>
									</div>
									<div>
										<Label className="text-muted-foreground">Vehículo</Label>
										<p className="font-medium">
											{selectedReserva.vehiculo || "-"}
										</p>
									</div>
									{selectedReserva.idaVuelta && (
										<>
											<div>
												<Label className="text-muted-foreground">
													Fecha Regreso
												</Label>
												<p className="font-medium">
													{formatDate(selectedReserva.fechaRegreso)}
												</p>
											</div>
											<div>
												<Label className="text-muted-foreground">
													Hora Regreso
												</Label>
												<p className="font-medium">
													{selectedReserva.horaRegreso || "-"}
												</p>
											</div>
										</>
									)}
								</div>
							</div>

							{/* Información Adicional */}
							<div>
								<h3 className="font-semibold text-lg mb-3">
									Información Adicional
								</h3>
								<div className="grid grid-cols-2 gap-4">
									<div>
										<Label className="text-muted-foreground">
											Número de Vuelo
										</Label>
										<p className="font-medium">
											{selectedReserva.numeroVuelo || "-"}
										</p>
									</div>
									<div>
										<Label className="text-muted-foreground">Hotel</Label>
										<p className="font-medium">{selectedReserva.hotel || "-"}</p>
									</div>
									<div>
										<Label className="text-muted-foreground">
											Equipaje Especial
										</Label>
										<p className="font-medium">
											{selectedReserva.equipajeEspecial || "-"}
										</p>
									</div>
									<div>
										<Label className="text-muted-foreground">
											Silla Infantil
										</Label>
										<p className="font-medium">
											{selectedReserva.sillaInfantil ? "Sí" : "No"}
										</p>
									</div>
								</div>
							</div>

							{/* Información Financiera */}
							<div>
								<h3 className="font-semibold text-lg mb-3">
									Información Financiera
								</h3>
								<div className="grid grid-cols-2 gap-4">
									<div>
										<Label className="text-muted-foreground">Precio Base</Label>
										<p className="font-medium">
											{formatCurrency(selectedReserva.precio)}
										</p>
									</div>
									<div>
										<Label className="text-muted-foreground">
											Descuento Base
										</Label>
										<p className="font-medium">
											{formatCurrency(selectedReserva.descuentoBase)}
										</p>
									</div>
									<div>
										<Label className="text-muted-foreground">
											Descuento Promoción
										</Label>
										<p className="font-medium">
											{formatCurrency(selectedReserva.descuentoPromocion)}
										</p>
									</div>
									<div>
										<Label className="text-muted-foreground">
											Descuento Round Trip
										</Label>
										<p className="font-medium">
											{formatCurrency(selectedReserva.descuentoRoundTrip)}
										</p>
									</div>
									<div>
										<Label className="text-muted-foreground">
											Descuento Online
										</Label>
										<p className="font-medium">
											{formatCurrency(selectedReserva.descuentoOnline)}
										</p>
									</div>
									<div>
										<Label className="text-muted-foreground">
											Total con Descuento
										</Label>
										<p className="font-bold text-lg">
											{formatCurrency(selectedReserva.totalConDescuento)}
										</p>
									</div>
									<div>
										<Label className="text-muted-foreground">
											Abono Sugerido
										</Label>
										<p className="font-medium">
											{formatCurrency(selectedReserva.abonoSugerido)}
										</p>
									</div>
									<div>
										<Label className="text-muted-foreground">
											Saldo Pendiente
										</Label>
										<p
											className={`font-bold ${
												selectedReserva.saldoPendiente > 0
													? "text-red-600"
													: "text-green-600"
											}`}
										>
											{formatCurrency(selectedReserva.saldoPendiente)}
										</p>
									</div>
									<div>
										<Label className="text-muted-foreground">
											Código de Descuento
										</Label>
										<p className="font-medium">
											{selectedReserva.codigoDescuento || "-"}
										</p>
									</div>
								</div>
							</div>

							{/* Estado y Pago */}
							<div>
								<h3 className="font-semibold text-lg mb-3">Estado y Pago</h3>
								<div className="grid grid-cols-2 gap-4">
									<div>
										<Label className="text-muted-foreground">Estado</Label>
										<div className="mt-1">
											{getEstadoBadge(selectedReserva.estado)}
										</div>
									</div>
									<div>
										<Label className="text-muted-foreground">
											Estado de Pago
										</Label>
										<div className="mt-1">
											{getEstadoPagoBadge(selectedReserva.estadoPago)}
										</div>
									</div>
									<div>
										<Label className="text-muted-foreground">
											Método de Pago
										</Label>
										<p className="font-medium">
											{selectedReserva.metodoPago || "-"}
										</p>
									</div>
									<div>
										<Label className="text-muted-foreground">
											Referencia de Pago
										</Label>
										<p className="font-medium">
											{selectedReserva.referenciaPago || "-"}
										</p>
									</div>
								</div>
							</div>

							{/* Observaciones y Mensaje */}
							{(selectedReserva.observaciones || selectedReserva.mensaje) && (
								<div>
									<h3 className="font-semibold text-lg mb-3">
										Notas y Comentarios
									</h3>
									{selectedReserva.mensaje && (
										<div className="mb-3">
											<Label className="text-muted-foreground">
												Mensaje del Cliente
											</Label>
											<p className="mt-1 p-3 bg-muted rounded-md">
												{selectedReserva.mensaje}
											</p>
										</div>
									)}
									{selectedReserva.observaciones && (
										<div>
											<Label className="text-muted-foreground">
												Observaciones Internas
											</Label>
											<p className="mt-1 p-3 bg-muted rounded-md">
												{selectedReserva.observaciones}
											</p>
										</div>
									)}
								</div>
							)}

							{/* Información Técnica */}
							<div>
								<h3 className="font-semibold text-lg mb-3">
									Información Técnica
								</h3>
								<div className="grid grid-cols-2 gap-4 text-sm">
									<div>
										<Label className="text-muted-foreground">Origen</Label>
										<p>{selectedReserva.source || "web"}</p>
									</div>
									<div>
										<Label className="text-muted-foreground">IP</Label>
										<p>{selectedReserva.ipAddress || "-"}</p>
									</div>
									<div>
										<Label className="text-muted-foreground">
											Fecha de Creación
										</Label>
										<p>{formatDate(selectedReserva.created_at)}</p>
									</div>
									<div>
										<Label className="text-muted-foreground">
											Última Actualización
										</Label>
										<p>{formatDate(selectedReserva.updated_at)}</p>
									</div>
								</div>
							</div>
						</div>
					)}
				</DialogContent>
			</Dialog>

			{/* Modal de Edición */}
			<Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
				<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Editar Reserva #{selectedReserva?.id}</DialogTitle>
						<DialogDescription>
							Actualiza el estado, pago y detalles de la reserva
						</DialogDescription>
					</DialogHeader>

					{selectedReserva && (
						<div className="space-y-4">
							{/* Información del Cliente (solo lectura) */}
							<div className="bg-muted p-4 rounded-lg">
								<h4 className="font-semibold mb-2">Cliente</h4>
								<p className="text-sm">
									<strong>Nombre:</strong> {selectedReserva.nombre}
								</p>
								<p className="text-sm">
									<strong>Email:</strong> {selectedReserva.email}
								</p>
								<p className="text-sm">
									<strong>Teléfono:</strong> {selectedReserva.telefono}
								</p>
								<p className="text-sm">
									<strong>Ruta:</strong> {selectedReserva.origen} →{" "}
									{selectedReserva.destino}
								</p>
								<p className="text-sm">
									<strong>Fecha:</strong> {formatDate(selectedReserva.fecha)} a
									las {selectedReserva.hora}
								</p>
							</div>

							{/* Estado */}
							<div className="space-y-2">
								<Label htmlFor="estado">Estado de la Reserva</Label>
								<Select
									value={formData.estado}
									onValueChange={(value) =>
										setFormData({ ...formData, estado: value })
									}
								>
									<SelectTrigger id="estado">
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

							{/* Estado de Pago */}
							<div className="space-y-2">
								<Label htmlFor="estadoPago">Estado de Pago</Label>
								<Select
									value={formData.estadoPago}
									onValueChange={(value) =>
										setFormData({ ...formData, estadoPago: value })
									}
								>
									<SelectTrigger id="estadoPago">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="pendiente">Pendiente</SelectItem>
										<SelectItem value="pagado">Pagado</SelectItem>
										<SelectItem value="fallido">Fallido</SelectItem>
										<SelectItem value="reembolsado">Reembolsado</SelectItem>
									</SelectContent>
								</Select>
							</div>

							{/* Método de Pago */}
							<div className="space-y-2">
								<Label htmlFor="metodoPago">Método de Pago</Label>
								<Select
									value={formData.metodoPago}
									onValueChange={(value) =>
										setFormData({ ...formData, metodoPago: value })
									}
								>
									<SelectTrigger id="metodoPago">
										<SelectValue placeholder="Seleccionar método" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="mercadopago">MercadoPago</SelectItem>
										<SelectItem value="flow">Flow</SelectItem>
										<SelectItem value="transferencia">Transferencia</SelectItem>
										<SelectItem value="efectivo">Efectivo</SelectItem>
										<SelectItem value="otro">Otro</SelectItem>
									</SelectContent>
								</Select>
							</div>

							{/* Referencia de Pago */}
							<div className="space-y-2">
								<Label htmlFor="referenciaPago">
									Referencia de Pago (opcional)
								</Label>
								<Input
									id="referenciaPago"
									placeholder="ID de transacción, número de transferencia, etc."
									value={formData.referenciaPago}
									onChange={(e) =>
										setFormData({ ...formData, referenciaPago: e.target.value })
									}
								/>
							</div>

							{/* Observaciones */}
							<div className="space-y-2">
								<Label htmlFor="observaciones">Observaciones Internas</Label>
								<Textarea
									id="observaciones"
									placeholder="Notas internas sobre la reserva..."
									value={formData.observaciones}
									onChange={(e) =>
										setFormData({ ...formData, observaciones: e.target.value })
									}
									rows={4}
								/>
							</div>

							{/* Resumen Financiero */}
							<div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
								<h4 className="font-semibold mb-2 text-blue-900">
									Resumen Financiero
								</h4>
								<div className="space-y-1 text-sm">
									<div className="flex justify-between">
										<span>Total:</span>
										<span className="font-semibold">
											{formatCurrency(selectedReserva.totalConDescuento)}
										</span>
									</div>
									<div className="flex justify-between">
										<span>Abono Sugerido:</span>
										<span className="font-semibold">
											{formatCurrency(selectedReserva.abonoSugerido)}
										</span>
									</div>
									<div className="flex justify-between border-t border-blue-300 pt-1">
										<span className="font-semibold">Saldo Pendiente:</span>
										<span
											className={`font-bold ${
												selectedReserva.saldoPendiente > 0
													? "text-red-600"
													: "text-green-600"
											}`}
										>
											{formatCurrency(selectedReserva.saldoPendiente)}
										</span>
									</div>
								</div>
							</div>

							{/* Botones */}
							<div className="flex justify-end gap-2 pt-4">
								<Button
									variant="outline"
									onClick={() => setShowEditDialog(false)}
									disabled={saving}
								>
									Cancelar
								</Button>
								<Button onClick={handleSave} disabled={saving}>
									{saving ? (
										<>
											<RefreshCw className="w-4 h-4 mr-2 animate-spin" />
											Guardando...
										</>
									) : (
										"Guardar Cambios"
									)}
								</Button>
							</div>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}

export default AdminReservas;
