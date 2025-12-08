import React, { useState, useEffect } from "react";
import { getBackendUrl } from "../../../lib/backend";
import { useAuthenticatedFetch } from "../../../hooks/useAuthenticatedFetch";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "../../ui/sheet";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Separator } from "../../ui/separator";
import { ScrollArea } from "../../ui/scroll-area";
import {
	User,
	Mail,
	Phone,
	MapPin,
	Calendar,
	Clock,
	Users,
	DollarSign,
	CreditCard,
	Car,
	UserCircle,
	Package,
	Baby,
	Plane,
	Hotel,
	FileText,
	Edit,
	CheckCircle2,
	XCircle,
	AlertCircle,
	Activity,
	ArrowRight,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

/**
 * Drawer lateral para mostrar detalles completos de una reserva
 * Incluye información del cliente, viaje, vehículo, conductor, pagos, timeline y acciones
 */
function DetallesReservaDrawer({ reserva, open, onClose, onUpdate }) {
	const { authenticatedFetch } = useAuthenticatedFetch();

	// Estados locales
	const [timeline, setTimeline] = useState([]);
	const [loadingTimeline, setLoadingTimeline] = useState(false);

	// Cargar timeline cuando se abre el drawer
	useEffect(() => {
		if (open && reserva?.id) {
			cargarTimeline();
		}
	}, [open, reserva?.id]);

	// Cargar timeline de actividad
	const cargarTimeline = async () => {
		if (!reserva?.id) return;

		try {
			setLoadingTimeline(true);
			const url = `${getBackendUrl()}/api/reservas/${reserva.id}/timeline`;
			const response = await authenticatedFetch(url);
			const data = await response.json();

			if (data.timeline) {
				setTimeline(data.timeline);
			}
		} catch (err) {
			console.error("Error cargando timeline:", err);
		} finally {
			setLoadingTimeline(false);
		}
	};

	// Formatear fecha
	const formatearFecha = (fecha) => {
		if (!fecha) return "Sin fecha";
		try {
			return format(new Date(fecha), "dd 'de' MMMM 'de' yyyy", { locale: es });
		} catch {
			return fecha;
		}
	};

	// Formatear fecha y hora
	const formatearFechaHora = (fecha) => {
		if (!fecha) return "Sin fecha";
		try {
			return format(new Date(fecha), "dd/MM/yyyy HH:mm", { locale: es });
		} catch {
			return fecha;
		}
	};

	// Formatear moneda
	const formatearMoneda = (monto) => {
		return new Intl.NumberFormat("es-CL", {
			style: "currency",
			currency: "CLP",
			minimumFractionDigits: 0,
		}).format(monto || 0);
	};

	// Configuración de estados
	const estadoConfig = {
		pendiente: {
			variant: "outline",
			label: "Pendiente",
			icon: Clock,
			color: "text-gray-600",
		},
		confirmada: {
			variant: "default",
			label: "Confirmada",
			icon: CheckCircle2,
			color: "text-blue-600",
		},
		asignada: {
			variant: "secondary",
			label: "Asignada",
			icon: Car,
			color: "text-purple-600",
		},
		en_progreso: {
			variant: "secondary",
			label: "En Progreso",
			icon: Activity,
			color: "text-orange-600",
		},
		completada: {
			variant: "default",
			label: "Completada",
			icon: CheckCircle2,
			color: "text-green-600",
		},
		cancelada: {
			variant: "destructive",
			label: "Cancelada",
			icon: XCircle,
			color: "text-red-600",
		},
	};

	// Configuración de estados de pago
	const estadoPagoConfig = {
		pendiente: {
			variant: "outline",
			label: "Pago Pendiente",
			color: "text-gray-600",
		},
		pagado: {
			variant: "default",
			label: "Pagado",
			color: "text-green-600",
		},
		parcial: {
			variant: "secondary",
			label: "Pago Parcial",
			color: "text-orange-600",
		},
		fallido: {
			variant: "destructive",
			label: "Pago Fallido",
			color: "text-red-600",
		},
	};

	// Acciones rápidas
	const handleEditar = () => {
		// TODO: Implementar modal de edición
		console.log("Editar reserva:", reserva.id);
	};

	const handleAsignarVehiculo = () => {
		// TODO: Implementar modal de asignación de vehículo
		console.log("Asignar vehículo:", reserva.id);
	};

	const handleRegistrarPago = () => {
		// TODO: Implementar modal de registro de pago
		console.log("Registrar pago:", reserva.id);
	};

	if (!reserva) return null;

	const estadoInfo = estadoConfig[reserva.estado] || estadoConfig.pendiente;
	const estadoPagoInfo =
		estadoPagoConfig[reserva.estadoPago] || estadoPagoConfig.pendiente;
	const EstadoIcon = estadoInfo.icon;

	return (
		<Sheet open={open} onOpenChange={onClose}>
			<SheetContent className="w-full sm:max-w-2xl p-0">
				<ScrollArea className="h-full">
					<div className="p-6 space-y-6">
						{/* Header */}
						<SheetHeader>
							<div className="space-y-2">
								<div className="flex items-center justify-between">
									<SheetTitle className="text-2xl font-bold">
										Detalles de Reserva
									</SheetTitle>
									<Badge variant={estadoInfo.variant} className="text-sm">
										<EstadoIcon className="h-4 w-4 mr-1" />
										{estadoInfo.label}
									</Badge>
								</div>
								<SheetDescription>
									{reserva.codigoReserva || `#${reserva.id}`} • Creada el{" "}
									{formatearFechaHora(reserva.fechaCreacion || reserva.createdAt)}
								</SheetDescription>
							</div>
						</SheetHeader>

						{/* Acciones rápidas */}
						<Card className="bg-gradient-to-r from-blue-50 to-purple-50">
							<CardContent className="pt-4">
								<div className="flex flex-wrap gap-2">
									<Button
										size="sm"
										variant="outline"
										onClick={handleEditar}
										className="gap-2"
									>
										<Edit className="h-4 w-4" />
										Editar
									</Button>
									<Button
										size="sm"
										variant="outline"
										onClick={handleAsignarVehiculo}
										className="gap-2"
										disabled={!!reserva.vehiculoId}
									>
										<Car className="h-4 w-4" />
										{reserva.vehiculoId ? "Vehículo Asignado" : "Asignar Vehículo"}
									</Button>
									<Button
										size="sm"
										variant="outline"
										onClick={handleRegistrarPago}
										className="gap-2"
										disabled={reserva.estadoPago === "pagado"}
									>
										<CreditCard className="h-4 w-4" />
										Registrar Pago
									</Button>
								</div>
							</CardContent>
						</Card>

						{/* Información del Cliente */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2 text-lg">
									<User className="h-5 w-5 text-blue-600" />
									Información del Cliente
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3">
								<div className="flex items-center gap-3">
									<User className="h-4 w-4 text-gray-500" />
									<div>
										<p className="text-sm text-gray-500">Nombre</p>
										<p className="font-medium">{reserva.nombre}</p>
									</div>
								</div>

								{reserva.email && (
									<div className="flex items-center gap-3">
										<Mail className="h-4 w-4 text-gray-500" />
										<div>
											<p className="text-sm text-gray-500">Email</p>
											<p className="font-medium">{reserva.email}</p>
										</div>
									</div>
								)}

								<div className="flex items-center gap-3">
									<Phone className="h-4 w-4 text-gray-500" />
									<div>
										<p className="text-sm text-gray-500">Teléfono</p>
										<p className="font-medium">{reserva.telefono}</p>
									</div>
								</div>
							</CardContent>
						</Card>

						{/* Detalles del Viaje */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2 text-lg">
									<MapPin className="h-5 w-5 text-purple-600" />
									Detalles del Viaje
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="flex items-start gap-3">
									<MapPin className="h-4 w-4 text-gray-500 mt-1" />
									<div className="flex-1 space-y-2">
										<div>
											<p className="text-sm text-gray-500">Origen</p>
											<p className="font-medium">{reserva.origen}</p>
										</div>
										<div className="flex items-center gap-2 text-gray-400">
											<ArrowRight className="h-4 w-4" />
											<span className="text-xs">
												{reserva.idaVuelta ? "Ida y Vuelta" : "Solo Ida"}
											</span>
										</div>
										<div>
											<p className="text-sm text-gray-500">Destino</p>
											<p className="font-medium">{reserva.destino}</p>
										</div>
									</div>
								</div>

								<Separator />

								<div className="grid grid-cols-2 gap-4">
									<div className="flex items-center gap-3">
										<Calendar className="h-4 w-4 text-gray-500" />
										<div>
											<p className="text-sm text-gray-500">Fecha</p>
											<p className="font-medium">{formatearFecha(reserva.fecha)}</p>
										</div>
									</div>

									{reserva.hora && (
										<div className="flex items-center gap-3">
											<Clock className="h-4 w-4 text-gray-500" />
											<div>
												<p className="text-sm text-gray-500">Hora</p>
												<p className="font-medium">
													{reserva.hora.substring(0, 5)}
												</p>
											</div>
										</div>
									)}

									<div className="flex items-center gap-3">
										<Users className="h-4 w-4 text-gray-500" />
										<div>
											<p className="text-sm text-gray-500">Pasajeros</p>
											<p className="font-medium">{reserva.pasajeros}</p>
										</div>
									</div>
								</div>

								{/* Fecha de regreso si es ida y vuelta */}
								{reserva.idaVuelta && reserva.fechaRegreso && (
									<>
										<Separator />
										<div className="flex items-center gap-3 bg-blue-50 p-3 rounded-lg">
											<Calendar className="h-4 w-4 text-blue-600" />
											<div>
												<p className="text-sm text-blue-600 font-medium">
													Fecha de Regreso
												</p>
												<p className="font-medium text-gray-900">
													{formatearFecha(reserva.fechaRegreso)}
												</p>
											</div>
										</div>
									</>
								)}
							</CardContent>
						</Card>

						{/* Información Adicional */}
						{(reserva.numeroVuelo ||
							reserva.nombreHotel ||
							reserva.equipaje ||
							reserva.sillaInfantil) && (
							<Card>
								<CardHeader>
									<CardTitle className="flex items-center gap-2 text-lg">
										<Package className="h-5 w-5 text-orange-600" />
										Información Adicional
									</CardTitle>
								</CardHeader>
								<CardContent className="space-y-3">
									{reserva.numeroVuelo && (
										<div className="flex items-center gap-3">
											<Plane className="h-4 w-4 text-gray-500" />
											<div>
												<p className="text-sm text-gray-500">Número de Vuelo</p>
												<p className="font-medium">{reserva.numeroVuelo}</p>
											</div>
										</div>
									)}

									{reserva.nombreHotel && (
										<div className="flex items-center gap-3">
											<Hotel className="h-4 w-4 text-gray-500" />
											<div>
												<p className="text-sm text-gray-500">Hotel</p>
												<p className="font-medium">{reserva.nombreHotel}</p>
											</div>
										</div>
									)}

									{reserva.equipaje && (
										<div className="flex items-center gap-3">
											<Package className="h-4 w-4 text-gray-500" />
											<div>
												<p className="text-sm text-gray-500">Equipaje</p>
												<p className="font-medium">{reserva.equipaje}</p>
											</div>
										</div>
									)}

									{reserva.sillaInfantil && (
										<div className="flex items-center gap-3">
											<Baby className="h-4 w-4 text-gray-500" />
											<div>
												<p className="text-sm text-gray-500">Silla Infantil</p>
												<Badge variant="secondary">Requerida</Badge>
											</div>
										</div>
									)}
								</CardContent>
							</Card>
						)}

						{/* Información Financiera */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2 text-lg">
									<DollarSign className="h-5 w-5 text-green-600" />
									Información Financiera
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3">
								<div className="grid grid-cols-2 gap-4">
									<div>
										<p className="text-sm text-gray-500">Precio Base</p>
										<p className="font-medium">
											{formatearMoneda(reserva.precioBase || reserva.precio)}
										</p>
									</div>

									{reserva.descuento > 0 && (
										<div>
											<p className="text-sm text-gray-500">Descuento</p>
											<p className="font-medium text-green-600">
												-{formatearMoneda(reserva.descuento)}
											</p>
										</div>
									)}
								</div>

								<Separator />

								<div>
									<p className="text-sm text-gray-500">Total</p>
									<p className="text-2xl font-bold text-green-600">
										{formatearMoneda(reserva.totalConDescuento || reserva.total)}
									</p>
								</div>

								{reserva.saldoPendiente > 0 && (
									<div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
										<div className="flex items-center justify-between">
											<div>
												<p className="text-sm text-orange-600 font-medium">
													Saldo Pendiente
												</p>
												<p className="text-xl font-bold text-orange-700">
													{formatearMoneda(reserva.saldoPendiente)}
												</p>
											</div>
											<AlertCircle className="h-6 w-6 text-orange-600" />
										</div>
									</div>
								)}
							</CardContent>
						</Card>

						{/* Estado y Pago */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2 text-lg">
									<CreditCard className="h-5 w-5 text-blue-600" />
									Estado y Pago
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3">
								<div className="grid grid-cols-2 gap-4">
									<div>
										<p className="text-sm text-gray-500">Estado de Pago</p>
										<Badge
											variant={estadoPagoInfo.variant}
											className={`mt-1 ${estadoPagoInfo.color}`}
										>
											{estadoPagoInfo.label}
										</Badge>
									</div>

									{reserva.metodoPago && (
										<div>
											<p className="text-sm text-gray-500">Método de Pago</p>
											<p className="font-medium capitalize">
												{reserva.metodoPago.replace("_", " ")}
											</p>
										</div>
									)}
								</div>

								{reserva.codigoPago && (
									<div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
										<p className="text-sm text-blue-600 font-medium">
											Código de Pago
										</p>
										<p className="font-mono font-bold text-blue-700">
											{reserva.codigoPago}
										</p>
									</div>
								)}
							</CardContent>
						</Card>

						{/* Vehículo y Conductor */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2 text-lg">
									<Car className="h-5 w-5 text-purple-600" />
									Vehículo y Conductor
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3">
								{reserva.vehiculoId ? (
									<div className="space-y-3">
										<div className="flex items-center gap-3">
											<Car className="h-4 w-4 text-gray-500" />
											<div>
												<p className="text-sm text-gray-500">Vehículo Asignado</p>
												<p className="font-medium">
													{reserva.vehiculo?.marca} {reserva.vehiculo?.modelo} -{" "}
													{reserva.vehiculo?.patente}
												</p>
											</div>
										</div>

										{reserva.conductorId && (
											<div className="flex items-center gap-3">
												<UserCircle className="h-4 w-4 text-gray-500" />
												<div>
													<p className="text-sm text-gray-500">Conductor</p>
													<p className="font-medium">
														{reserva.conductor?.nombre}
													</p>
													{reserva.conductor?.telefono && (
														<p className="text-sm text-gray-500">
															{reserva.conductor.telefono}
														</p>
													)}
												</div>
											</div>
										)}
									</div>
								) : (
									<div className="flex items-center gap-3 text-gray-400 p-4 bg-gray-50 rounded-lg">
										<AlertCircle className="h-5 w-5" />
										<p className="text-sm">
											No hay vehículo ni conductor asignados aún
										</p>
									</div>
								)}
							</CardContent>
						</Card>

						{/* Timeline de Actividad */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2 text-lg">
									<Activity className="h-5 w-5 text-cyan-600" />
									Timeline de Actividad
								</CardTitle>
							</CardHeader>
							<CardContent>
								{loadingTimeline ? (
									<div className="flex items-center justify-center py-8">
										<Activity className="h-6 w-6 animate-spin text-gray-400" />
									</div>
								) : timeline.length === 0 ? (
									<div className="text-center py-8 text-gray-400">
										<p className="text-sm">No hay actividad registrada</p>
									</div>
								) : (
									<div className="space-y-4">
										{timeline.map((evento, index) => (
											<div
												key={index}
												className="flex gap-3 relative pb-4 last:pb-0"
											>
												{/* Línea conectora */}
												{index < timeline.length - 1 && (
													<div className="absolute left-2 top-6 bottom-0 w-px bg-gray-200" />
												)}

												{/* Icono */}
												<div className="flex-shrink-0 w-4 h-4 rounded-full bg-blue-100 border-2 border-blue-500 mt-1 z-10" />

												{/* Contenido */}
												<div className="flex-1 pt-0">
													<p className="font-medium text-sm">
														{evento.accion || evento.descripcion}
													</p>
													<p className="text-xs text-gray-500">
														{formatearFechaHora(evento.fecha || evento.createdAt)}
													</p>
													{evento.usuario && (
														<p className="text-xs text-gray-400 mt-1">
															Por: {evento.usuario}
														</p>
													)}
												</div>
											</div>
										))}
									</div>
								)}
							</CardContent>
						</Card>

						{/* Notas y Observaciones */}
						{reserva.notas && (
							<Card>
								<CardHeader>
									<CardTitle className="flex items-center gap-2 text-lg">
										<FileText className="h-5 w-5 text-gray-600" />
										Notas y Observaciones
									</CardTitle>
								</CardHeader>
								<CardContent>
									<p className="text-sm text-gray-700 whitespace-pre-wrap">
										{reserva.notas}
									</p>
								</CardContent>
							</Card>
						)}
					</div>
				</ScrollArea>
			</SheetContent>
		</Sheet>
	);
}

export default DetallesReservaDrawer;
