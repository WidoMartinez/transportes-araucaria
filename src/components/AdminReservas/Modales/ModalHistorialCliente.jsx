import React from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "../../ui/dialog";
import { Badge } from "../../ui/badge";
import { Label } from "../../ui/label";
import { Card, CardContent } from "../../ui/card";
import { Star, MapPin, Calendar } from "lucide-react";

export function ModalHistorialCliente({
	open,
	onOpenChange,
	historialCliente,
	formatCurrency,
	handleViewDetails,
	getEstadoBadge,
	getEstadoPagoBadge,
	formatDate,
}) {
	if (!historialCliente) return null;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>
						Historial del Cliente
						{historialCliente && ` - ${historialCliente.cliente.nombre}`}
					</DialogTitle>
					<DialogDescription>
						Todas las reservas y estadísticas del cliente
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-6">
					{/* Información del Cliente */}
					<div className="bg-muted p-4 rounded-lg">
						<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
							<div>
								<Label className="text-muted-foreground">Email</Label>
								<p
									className="font-medium truncate max-w-[180px]"
									title={historialCliente.cliente.email}
									style={{
										overflow: "hidden",
										textOverflow: "ellipsis",
										whiteSpace: "nowrap",
										maxWidth: "180px",
									}}
								>
									{historialCliente.cliente.email}
								</p>
							</div>
							<div>
								<Label className="text-muted-foreground">Teléfono</Label>
								<p className="font-medium">
									{historialCliente.cliente.telefono}
								</p>
							</div>
							{historialCliente.cliente.rut && (
								<div>
									<Label className="text-muted-foreground">RUT</Label>
									<p className="font-medium">
										{historialCliente.cliente.rut}
									</p>
								</div>
							)}
							<div>
								<Label className="text-muted-foreground">Tipo</Label>
								<div>
									{historialCliente.cliente.esCliente ? (
										<Badge variant="default">
											<Star className="w-3 h-3 mr-1" />
											Cliente
										</Badge>
									) : (
										<Badge variant="secondary">Cotizador</Badge>
									)}
								</div>
							</div>
							{historialCliente.cliente.clasificacion &&
								historialCliente.cliente.clasificacion !==
									"Cliente Activo" && (
									<div>
										<Label className="text-muted-foreground">
											Clasificación
										</Label>
										<div>
											<Badge variant="outline">
												{historialCliente.cliente.clasificacion}
											</Badge>
										</div>
									</div>
								)}
						</div>
					</div>

					{/* Estadísticas */}
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
						<Card>
							<CardContent className="p-4">
								<p className="text-sm text-muted-foreground">
									Total Reservas
								</p>
								<p className="text-2xl font-bold">
									{historialCliente.estadisticas.totalReservas}
								</p>
							</CardContent>
						</Card>
						<Card>
							<CardContent className="p-4">
								<p className="text-sm text-muted-foreground">
									Reservas Pagadas
								</p>
								<p className="text-2xl font-bold text-green-600">
									{historialCliente.estadisticas.totalPagadas}
								</p>
							</CardContent>
						</Card>
						<Card>
							<CardContent className="p-4">
								<p className="text-sm text-muted-foreground">
									Reservas Pendientes
								</p>
								<p className="text-2xl font-bold text-orange-600">
									{historialCliente.estadisticas.totalPendientes}
								</p>
							</CardContent>
						</Card>
						<Card>
							<CardContent className="p-4">
								<p className="text-sm text-muted-foreground">
									Total Gastado
								</p>
								<p className="text-2xl font-bold text-chocolate-600">
									{formatCurrency(
										historialCliente.estadisticas.totalGastado
									)}
								</p>
							</CardContent>
						</Card>
					</div>

					{/* Lista de Reservas */}
					<div>
						<h3 className="font-semibold text-lg mb-3">
							Historial de Reservas ({">"}{" "}
							{historialCliente.reservas.length})
						</h3>
						<div className="space-y-2 max-h-96 overflow-y-auto">
							{historialCliente.reservas.map((reserva) => (
								<div
									key={reserva.id}
									className="border rounded-lg p-3 hover:bg-muted/50 cursor-pointer"
									onClick={() => {
										onOpenChange(false);
										handleViewDetails(reserva);
									}}
								>
									<div className="flex items-start justify-between">
										<div className="flex-1">
											<div className="flex items-center gap-2 mb-1">
												<span className="font-medium">#{reserva.id}</span>
												{getEstadoBadge(reserva.estado)}
												{getEstadoPagoBadge(reserva)}
											</div>
											<div className="text-sm text-muted-foreground">
												<div className="flex items-center gap-2">
													<MapPin className="w-3 h-3" />
													{reserva.origen} {"->"} {reserva.destino}
												</div>
												<div className="flex items-center gap-2 mt-1">
													<Calendar className="w-3 h-3" />
													{formatDate(reserva.fecha)} -{" "}
													{reserva.hora || "-"}
												</div>
											</div>
										</div>
										<div className="text-right">
											<p className="font-semibold">
												{formatCurrency(reserva.totalConDescuento)}
											</p>
											{reserva.saldoPendiente > 0 && (
												<p className="text-sm text-red-600">
													Saldo: {formatCurrency(reserva.saldoPendiente)}
												</p>
											)}
										</div>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
