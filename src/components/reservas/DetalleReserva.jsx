import React from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import {
	User,
	Mail,
	Phone,
	MapPin,
	Calendar,
	Clock,
	Users,
	Car,
	DollarSign,
	FileText,
	Edit,
} from "lucide-react";

/**
 * Componente para mostrar todos los detalles de una reserva
 */
function DetalleReserva({ reserva, isOpen, onClose, onEditar }) {
	if (!reserva) return null;

	const formatearFecha = (fecha) => {
		if (!fecha) return "-";
		return new Date(fecha).toLocaleDateString("es-CL", {
			weekday: "long",
			day: "2-digit",
			month: "long",
			year: "numeric",
		});
	};

	const formatearHora = (hora) => {
		if (!hora) return "-";
		return hora.substring(0, 5);
	};

	const formatearMoneda = (valor) => {
		return new Intl.NumberFormat("es-CL", {
			style: "currency",
			currency: "CLP",
		}).format(valor || 0);
	};

	const getBadgeEstado = (estado) => {
		const estilos = {
			pendiente: "bg-yellow-100 text-yellow-800",
			pendiente_detalles: "bg-orange-100 text-orange-800",
			confirmada: "bg-blue-100 text-blue-800",
			completada: "bg-green-100 text-green-800",
			cancelada: "bg-red-100 text-red-800",
		};

		const textos = {
			pendiente: "Pendiente",
			pendiente_detalles: "Pendiente Detalles",
			confirmada: "Confirmada",
			completada: "Completada",
			cancelada: "Cancelada",
		};

		return (
			<Badge className={estilos[estado] || ""}>
				{textos[estado] || estado}
			</Badge>
		);
	};

	const getBadgePago = (estadoPago) => {
		const estilos = {
			pendiente: "bg-gray-100 text-gray-800",
			aprobado: "bg-blue-100 text-blue-800",
			parcial: "bg-yellow-100 text-yellow-800",
			pagado: "bg-green-100 text-green-800",
			fallido: "bg-red-100 text-red-800",
			reembolsado: "bg-purple-100 text-purple-800",
		};

		const textos = {
			pendiente: "Pendiente",
			aprobado: "Aprobado",
			parcial: "Parcial",
			pagado: "Pagado",
			fallido: "Fallido",
			reembolsado: "Reembolsado",
		};

		return (
			<Badge className={estilos[estadoPago] || ""}>
				{textos[estadoPago] || estadoPago}
			</Badge>
		);
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center justify-between">
						<span>Detalle de Reserva #{reserva.id}</span>
						<Button variant="outline" size="sm" onClick={onEditar}>
							<Edit className="h-4 w-4 mr-2" />
							Editar
						</Button>
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-6">
					{/* Estados */}
					<div className="flex gap-4">
						<div className="flex-1">
							<div className="text-sm text-gray-600 mb-1">Estado de Reserva</div>
							{getBadgeEstado(reserva.estado)}
						</div>
						<div className="flex-1">
							<div className="text-sm text-gray-600 mb-1">Estado de Pago</div>
							{getBadgePago(reserva.estadoPago)}
						</div>
						{reserva.codigoReserva && (
							<div className="flex-1">
								<div className="text-sm text-gray-600 mb-1">Código</div>
								<Badge variant="outline" className="font-mono">
									{reserva.codigoReserva}
								</Badge>
							</div>
						)}
					</div>

					<Separator />

					{/* Información del Cliente */}
					<div>
						<h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
							<User className="h-5 w-5" />
							Información del Cliente
						</h3>
						<div className="grid grid-cols-2 gap-4">
							<div>
								<div className="text-sm text-gray-600">Nombre Completo</div>
								<div className="font-medium">{reserva.nombre}</div>
							</div>
							{reserva.rut && (
								<div>
									<div className="text-sm text-gray-600">RUT</div>
									<div className="font-medium">{reserva.rut}</div>
								</div>
							)}
							<div>
								<div className="text-sm text-gray-600 flex items-center gap-1">
									<Mail className="h-4 w-4" />
									Email
								</div>
								<div className="font-medium">{reserva.email}</div>
							</div>
							<div>
								<div className="text-sm text-gray-600 flex items-center gap-1">
									<Phone className="h-4 w-4" />
									Teléfono
								</div>
								<div className="font-medium">{reserva.telefono}</div>
							</div>
						</div>
					</div>

					<Separator />

					{/* Detalles del Viaje */}
					<div>
						<h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
							<MapPin className="h-5 w-5" />
							Detalles del Viaje
						</h3>
						<div className="space-y-3">
							<div className="grid grid-cols-2 gap-4">
								<div>
									<div className="text-sm text-gray-600">Origen</div>
									<div className="font-medium">{reserva.origen}</div>
									{reserva.direccionOrigen && (
										<div className="text-sm text-gray-500 mt-1">
											{reserva.direccionOrigen}
										</div>
									)}
								</div>
								<div>
									<div className="text-sm text-gray-600">Destino</div>
									<div className="font-medium">{reserva.destino}</div>
									{reserva.direccionDestino && (
										<div className="text-sm text-gray-500 mt-1">
											{reserva.direccionDestino}
										</div>
									)}
								</div>
							</div>

							<div className="grid grid-cols-3 gap-4">
								<div>
									<div className="text-sm text-gray-600 flex items-center gap-1">
										<Calendar className="h-4 w-4" />
										Fecha de Ida
									</div>
									<div className="font-medium">{formatearFecha(reserva.fecha)}</div>
								</div>
								<div>
									<div className="text-sm text-gray-600 flex items-center gap-1">
										<Clock className="h-4 w-4" />
										Hora
									</div>
									<div className="font-medium">{formatearHora(reserva.hora)}</div>
								</div>
								<div>
									<div className="text-sm text-gray-600 flex items-center gap-1">
										<Users className="h-4 w-4" />
										Pasajeros
									</div>
									<div className="font-medium">{reserva.pasajeros}</div>
								</div>
							</div>

							{reserva.idaVuelta && (
								<div className="bg-blue-50 p-3 rounded-lg">
									<div className="text-sm font-semibold text-blue-900 mb-2">
										Viaje de Ida y Vuelta
									</div>
									<div className="grid grid-cols-2 gap-4 text-sm">
										<div>
											<span className="text-blue-700">Fecha de regreso:</span>{" "}
											<span className="font-medium">
												{formatearFecha(reserva.fechaRegreso)}
											</span>
										</div>
										{reserva.horaRegreso && (
											<div>
												<span className="text-blue-700">Hora de regreso:</span>{" "}
												<span className="font-medium">
													{formatearHora(reserva.horaRegreso)}
												</span>
											</div>
										)}
									</div>
								</div>
							)}

							{(reserva.numeroVuelo || reserva.hotel) && (
								<div className="grid grid-cols-2 gap-4">
									{reserva.numeroVuelo && (
										<div>
											<div className="text-sm text-gray-600">Número de Vuelo</div>
											<div className="font-medium">{reserva.numeroVuelo}</div>
										</div>
									)}
									{reserva.hotel && (
										<div>
											<div className="text-sm text-gray-600">Hotel</div>
											<div className="font-medium">{reserva.hotel}</div>
										</div>
									)}
								</div>
							)}

							{(reserva.equipajeEspecial || reserva.sillaInfantil) && (
								<div className="grid grid-cols-2 gap-4">
									{reserva.equipajeEspecial && (
										<div>
											<div className="text-sm text-gray-600">Equipaje Especial</div>
											<div className="font-medium">{reserva.equipajeEspecial}</div>
										</div>
									)}
									{reserva.sillaInfantil && (
										<div>
											<div className="text-sm text-gray-600">Silla Infantil</div>
											<Badge className="bg-blue-100 text-blue-800">Sí</Badge>
										</div>
									)}
								</div>
							)}

							{(reserva.vehiculoId || reserva.conductorId) && (
								<div className="bg-gray-50 p-3 rounded-lg">
									<div className="text-sm font-semibold mb-2 flex items-center gap-1">
										<Car className="h-4 w-4" />
										Asignación
									</div>
									<div className="grid grid-cols-2 gap-4 text-sm">
										{reserva.vehiculo && (
											<div>
												<span className="text-gray-600">Vehículo:</span>{" "}
												<span className="font-medium">{reserva.vehiculo}</span>
											</div>
										)}
										{reserva.conductorId && (
											<div>
												<span className="text-gray-600">Conductor asignado</span>
											</div>
										)}
									</div>
								</div>
							)}
						</div>
					</div>

					<Separator />

					{/* Información Financiera */}
					<div>
						<h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
							<DollarSign className="h-5 w-5" />
							Información Financiera
						</h3>
						<div className="space-y-3">
							<div className="grid grid-cols-2 gap-4">
								<div>
									<div className="text-sm text-gray-600">Precio Base</div>
									<div className="font-medium">{formatearMoneda(reserva.precio)}</div>
								</div>
								<div>
									<div className="text-sm text-gray-600">Total con Descuento</div>
									<div className="font-bold text-lg text-green-600">
										{formatearMoneda(reserva.totalConDescuento)}
									</div>
								</div>
							</div>

							{(reserva.descuentoBase > 0 ||
								reserva.descuentoPromocion > 0 ||
								reserva.descuentoRoundTrip > 0 ||
								reserva.descuentoOnline > 0) && (
								<div className="bg-green-50 p-3 rounded-lg">
									<div className="text-sm font-semibold text-green-900 mb-2">
										Descuentos Aplicados
									</div>
									<div className="space-y-1 text-sm">
										{reserva.descuentoBase > 0 && (
											<div className="flex justify-between">
												<span>Descuento Base:</span>
												<span className="font-medium">
													-{formatearMoneda(reserva.descuentoBase)}
												</span>
											</div>
										)}
										{reserva.descuentoPromocion > 0 && (
											<div className="flex justify-between">
												<span>Descuento Promoción:</span>
												<span className="font-medium">
													-{formatearMoneda(reserva.descuentoPromocion)}
												</span>
											</div>
										)}
										{reserva.descuentoRoundTrip > 0 && (
											<div className="flex justify-between">
												<span>Descuento Ida y Vuelta:</span>
												<span className="font-medium">
													-{formatearMoneda(reserva.descuentoRoundTrip)}
												</span>
											</div>
										)}
										{reserva.descuentoOnline > 0 && (
											<div className="flex justify-between">
												<span>Descuento Online:</span>
												<span className="font-medium">
													-{formatearMoneda(reserva.descuentoOnline)}
												</span>
											</div>
										)}
									</div>
								</div>
							)}

							<div className="grid grid-cols-2 gap-4">
								{reserva.abonoSugerido > 0 && (
									<div>
										<div className="text-sm text-gray-600">Abono Sugerido</div>
										<div className="font-medium">
											{formatearMoneda(reserva.abonoSugerido)}
										</div>
									</div>
								)}
								{reserva.saldoPendiente > 0 && (
									<div>
										<div className="text-sm text-gray-600">Saldo Pendiente</div>
										<div className="font-bold text-red-600">
											{formatearMoneda(reserva.saldoPendiente)}
										</div>
									</div>
								)}
							</div>

							{reserva.metodoPago && (
								<div className="grid grid-cols-2 gap-4">
									<div>
										<div className="text-sm text-gray-600">Método de Pago</div>
										<div className="font-medium">{reserva.metodoPago}</div>
									</div>
									{reserva.referenciaPago && (
										<div>
											<div className="text-sm text-gray-600">Referencia de Pago</div>
											<div className="font-medium font-mono text-sm">
												{reserva.referenciaPago}
											</div>
										</div>
									)}
								</div>
							)}
						</div>
					</div>

					{/* Notas y Observaciones */}
					{(reserva.mensaje || reserva.observaciones) && (
						<>
							<Separator />
							<div>
								<h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
									<FileText className="h-5 w-5" />
									Notas y Comentarios
								</h3>
								<div className="space-y-3">
									{reserva.mensaje && (
										<div>
											<div className="text-sm text-gray-600 mb-1">Mensaje del Cliente</div>
											<div className="bg-gray-50 p-3 rounded-lg text-sm">
												{reserva.mensaje}
											</div>
										</div>
									)}
									{reserva.observaciones && (
										<div>
											<div className="text-sm text-gray-600 mb-1">
												Observaciones Internas
											</div>
											<div className="bg-blue-50 p-3 rounded-lg text-sm">
												{reserva.observaciones}
											</div>
										</div>
									)}
								</div>
							</div>
						</>
					)}

					{/* Información Técnica */}
					<Separator />
					<div className="grid grid-cols-3 gap-4 text-xs text-gray-500">
						<div>
							<div className="font-semibold">Origen:</div>
							<div>{reserva.source || "web"}</div>
						</div>
						<div>
							<div className="font-semibold">Creado:</div>
							<div>{formatearFecha(reserva.createdAt)}</div>
						</div>
						<div>
							<div className="font-semibold">Actualizado:</div>
							<div>{formatearFecha(reserva.updatedAt)}</div>
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}

export default DetalleReserva;
