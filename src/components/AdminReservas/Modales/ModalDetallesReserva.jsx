import React from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "../../ui/dialog";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { Label } from "../../ui/label";
import { Mail, Copy, Star, DollarSign, Car } from "lucide-react";

export function ModalDetallesReserva({
	open,
	onOpenChange,
	selectedReserva,
	formatDate,
	formatCurrency,
	handleSolicitarDetalles,
	generarTextoConductor,
	getEstadoBadge,
	getEstadoPagoBadge,
	isAsignada,
	handleAsignar,
	loadingTransacciones,
	transacciones,
	loadingHistorial,
	historialAsignaciones,
}) {
	if (!selectedReserva) return null;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-6xl md:max-w-6xl lg:max-w-6xl max-h-[85vh] overflow-y-auto">
				<DialogHeader>
					<div className="flex justify-between items-center flex-wrap gap-2">
						<div>
							<DialogTitle>
								Detalles de Reserva #{selectedReserva?.id}
							</DialogTitle>
							<DialogDescription>
								Información completa de la reserva
							</DialogDescription>
						</div>
						<div className="flex gap-2 items-center flex-wrap">
							<Button
								size="sm"
								variant="outline"
								onClick={() => {
									const link = `${window.location.origin}/#comprar-productos/${selectedReserva?.codigoReserva}`;
									navigator.clipboard.writeText(link);
									alert(`Enlace copiado al portapapeles: ${link}`);
								}}
							>
								Generar Link de Compra
							</Button>

							{!selectedReserva?.detallesCompletos && (
								<div className="flex flex-col items-end gap-1">
									<Button
										size="sm"
										variant="destructive"
										className="gap-2"
										onClick={() => handleSolicitarDetalles(selectedReserva)}
									>
										<Mail className="w-4 h-4" />
										Solicitar Datos Faltantes
									</Button>
									{selectedReserva?.ultimaSolicitudDetalles && (
										<span className="text-[10px] text-muted-foreground italic">
											Último envío:{" "}
											{new Date(
												selectedReserva.ultimaSolicitudDetalles
											).toLocaleString()}
										</span>
									)}
								</div>
							)}

							{/* Botones de copiar info conductor - separados para IDA y VUELTA */}
							{selectedReserva?.tramoVuelta ? (
								<>
									<Button
										size="sm"
										variant="outline"
										className="gap-2 ml-2 bg-green-50 hover:bg-green-100 border-green-200"
										onClick={() => {
											const text = generarTextoConductor(selectedReserva);
											navigator.clipboard.writeText(text);
											alert("✅ Info IDA copiada al portapapeles");
										}}
									>
										<Copy className="w-4 h-4" />
										Copiar Info IDA
									</Button>
									<Button
										size="sm"
										variant="outline"
										className="gap-2 ml-2 bg-blue-50 hover:bg-blue-100 border-blue-200"
										onClick={() => {
											const text = generarTextoConductor(
												selectedReserva?.tramoVuelta
											);
											navigator.clipboard.writeText(text);
											alert("✅ Info VUELTA copiada al portapapeles");
										}}
									>
										<Copy className="w-4 h-4" />
										Copiar Info VUELTA
									</Button>
								</>
							) : (
								<Button
									size="sm"
									variant="outline"
									className="gap-2 ml-2"
									onClick={() => {
										const text = generarTextoConductor(selectedReserva);
										navigator.clipboard.writeText(text);
										alert("✅ Info para conductor copiada al portapapeles");
									}}
								>
									<Copy className="w-4 h-4" />
									Copiar Info Conductor
								</Button>
							)}
						</div>
					</div>
				</DialogHeader>

				<div className="space-y-6 mt-4">
					{/* Código de Reserva */}
					{selectedReserva.codigoReserva && (
						<div className="bg-chocolate-50 border-2 border-chocolate-200 rounded-lg p-4">
							<div className="flex items-center justify-between">
								<div>
									<Label className="text-chocolate-700 text-sm font-medium">
										Código de Reserva
									</Label>
									<p className="text-2xl font-bold text-chocolate-900 tracking-wider">
										{selectedReserva.codigoReserva}
									</p>
								</div>
								<div className="bg-chocolate-100 p-2 rounded">
									<svg
										className="w-6 h-6 text-chocolate-700"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
										/>
									</svg>
								</div>
							</div>
						</div>
					)}

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
							{((selectedReserva.cliente?.clasificacion &&
								selectedReserva.cliente?.clasificacion !== "Cliente Activo") ||
								(selectedReserva.clasificacionCliente &&
									selectedReserva.clasificacionCliente !==
										"Cliente Activo")) && (
								<div>
									<Label className="text-muted-foreground">Clasificación</Label>
									<div className="mt-1">
										<Badge variant="outline">
											{selectedReserva.cliente?.clasificacion !==
												"Cliente Activo" &&
											selectedReserva.cliente?.clasificacion
												? selectedReserva.cliente.clasificacion
												: selectedReserva.clasificacionCliente}
										</Badge>
									</div>
								</div>
							)}
						</div>
					</div>

					{/* Detalles del Viaje */}
					<div>
						<h3 className="font-semibold text-lg mb-3">Detalles del Viaje</h3>

						{/* Indicador del tipo de viaje - actualizado para SOLUCIÓN C */}
						{(selectedReserva.idaVuelta || selectedReserva.tramoVuelta) && (
							<div className="mb-4 inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full border border-blue-200">
								<svg
									className="w-4 h-4"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
									/>
								</svg>
								<span className="font-semibold text-sm">
									{selectedReserva.tramoVuelta
										? "Reservas Vinculadas: Ida y Vuelta"
										: "Viaje Ida y Vuelta"}
								</span>
							</div>
						)}

						{/* Viaje de Ida */}
						<div className="bg-gradient-to-r from-green-50 to-green-100 border-l-4 border-green-500 rounded-lg p-4 mb-4">
							<h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
								<svg
									className="w-5 h-5"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M17 8l4 4m0 0l-4 4m4-4H3"
									/>
								</svg>
								VIAJE DE IDA
							</h4>
							<div className="grid grid-cols-2 gap-4">
								<div>
									<Label className="text-green-700 font-medium">Origen</Label>
									<p className="font-semibold text-gray-900">
										{selectedReserva.origen}
									</p>
								</div>
								<div>
									<Label className="text-green-700 font-medium">Destino</Label>
									<p className="font-semibold text-gray-900">
										{selectedReserva.destino}
									</p>
								</div>
								{selectedReserva.direccionOrigen && (
									<div className="col-span-2 bg-yellow-50 p-2 rounded border border-yellow-200">
										<Label className="text-yellow-800 font-semibold">
											📍 Dirección de Origen (Específica)
										</Label>
										<p className="font-medium text-gray-900 mt-1">
											{selectedReserva.direccionOrigen}
										</p>
									</div>
								)}
								{selectedReserva.direccionDestino && (
									<div className="col-span-2 bg-yellow-50 p-2 rounded border border-yellow-200">
										<Label className="text-yellow-800 font-semibold">
											📍 Dirección de Destino (Específica)
										</Label>
										<p className="font-medium text-gray-900 mt-1">
											{selectedReserva.direccionDestino}
										</p>
									</div>
								)}
								<div>
									<Label className="text-green-700 font-medium">📅 Fecha</Label>
									<p className="font-semibold text-gray-900">
										{formatDate(selectedReserva.fecha)}
									</p>
								</div>
								<div>
									<Label className="text-green-700 font-medium">
										🕐 Hora de Recogida
									</Label>
									<p className="font-semibold text-gray-900">
										{selectedReserva.hora || "-"}
									</p>
								</div>
							</div>
						</div>

						{/* Viaje de Vuelta - Actualizado para SOLUCIÓN C */}
						{(selectedReserva.idaVuelta || selectedReserva.tramoVuelta) && (
							<div className="bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-500 rounded-lg p-4 mb-4">
								<h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
									<svg
										className="w-5 h-5"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M7 16l-4-4m0 0l4-4m-4 4h18"
										/>
									</svg>
									VIAJE DE VUELTA
									{selectedReserva.tramoVuelta && (
										<Badge
											variant="outline"
											className="ml-2 text-xs bg-white"
											aria-label={`Datos del viaje de vuelta desde la reserva número ${selectedReserva.tramoVuelta.id}`}
										>
											Reserva #{selectedReserva.tramoVuelta.id}
										</Badge>
									)}
								</h4>
								<div className="grid grid-cols-2 gap-4">
									<div>
										<Label className="text-blue-700 font-medium">Origen</Label>
										<p className="font-semibold text-gray-900">
											{selectedReserva.tramoVuelta
												? selectedReserva.tramoVuelta.origen
												: selectedReserva.destino}
										</p>
									</div>
									<div>
										<Label className="text-blue-700 font-medium">Destino</Label>
										<p className="font-semibold text-gray-900">
											{selectedReserva.tramoVuelta
												? selectedReserva.tramoVuelta.destino
												: selectedReserva.origen}
										</p>
									</div>
									{selectedReserva.tramoVuelta?.direccionOrigen && (
										<div className="col-span-2 bg-yellow-50 p-2 rounded border border-yellow-200">
											<Label className="text-yellow-800 font-semibold">
												📍 Dirección de Origen (Específica)
											</Label>
											<p className="font-medium text-gray-900 mt-1">
												{selectedReserva.tramoVuelta.direccionOrigen}
											</p>
										</div>
									)}
									{selectedReserva.tramoVuelta?.direccionDestino && (
										<div className="col-span-2 bg-yellow-50 p-2 rounded border border-yellow-200">
											<Label className="text-yellow-800 font-semibold">
												📍 Dirección de Destino (Específica)
											</Label>
											<p className="font-medium text-gray-900 mt-1">
												{selectedReserva.tramoVuelta.direccionDestino}
											</p>
										</div>
									)}
									<div>
										<Label className="text-blue-700 font-medium">
											📅 Fecha de Regreso
										</Label>
										<p className="font-semibold text-gray-900">
											{selectedReserva.tramoVuelta
												? selectedReserva.tramoVuelta.fecha
													? formatDate(selectedReserva.tramoVuelta.fecha)
													: "⚠️ No especificada"
												: selectedReserva.fechaRegreso
												? formatDate(selectedReserva.fechaRegreso)
												: "⚠️ No especificada"}
										</p>
									</div>
									<div>
										<Label className="text-blue-700 font-medium">
											🕐 Hora de Recogida
										</Label>
										<p className="font-semibold text-gray-900">
											{selectedReserva.tramoVuelta
												? selectedReserva.tramoVuelta.hora ||
												  "⚠️ No especificada"
												: selectedReserva.horaRegreso || "⚠️ No especificada"}
										</p>
									</div>
								</div>

								{/* Advertencia si falta información */}
								{((selectedReserva.tramoVuelta &&
									(!selectedReserva.tramoVuelta.fecha ||
										!selectedReserva.tramoVuelta.hora)) ||
									(!selectedReserva.tramoVuelta &&
										(!selectedReserva.fechaRegreso ||
											!selectedReserva.horaRegreso))) && (
									<div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
										<svg
											className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
											/>
										</svg>
										<div>
											<p className="text-sm font-semibold text-yellow-800">
												Información Incompleta del Viaje de Vuelta
											</p>
											<p className="text-xs text-yellow-700 mt-1">
												Es necesario completar la fecha y hora del regreso para
												coordinar el servicio.
											</p>
										</div>
									</div>
								)}
							</div>
						)}

						{/* Información de pasajeros y vehículo */}
						<div className="grid grid-cols-2 gap-4 pt-4 border-t">
							<div>
								<Label className="text-muted-foreground">👥 Pasajeros</Label>
								<p className="font-medium">{selectedReserva.pasajeros}</p>
							</div>
							{selectedReserva.vehiculo && (
								<div>
									<Label className="text-muted-foreground">🚙 Vehículo</Label>
									<p className="font-medium">{selectedReserva.vehiculo}</p>
								</div>
							)}
							{selectedReserva.upgradeVan && (
								<div>
									<Label className="text-muted-foreground italic">
										✨ Opción Premium
									</Label>
									<p className="font-semibold text-chocolate-700 flex items-center gap-1">
										<Star className="w-4 h-4 fill-chocolate-700" />
										Upgrade a Van
									</p>
								</div>
							)}
						</div>
					</div>

					{/* Información de la Reserva */}
					<div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
						<h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
							<svg
								className="w-5 h-5 text-slate-600"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
							Registro de la Reserva
						</h3>
						<div className="grid grid-cols-2 gap-4">
							<div>
								<Label className="text-muted-foreground">Fecha de Creación</Label>
								<p className="font-medium">
									{selectedReserva.createdAt
										? new Date(selectedReserva.createdAt).toLocaleString("es-CL", {
												year: "numeric",
												month: "2-digit",
												day: "2-digit",
												hour: "2-digit",
												minute: "2-digit",
												second: "2-digit",
												hour12: false,
										  })
										: "-"}
								</p>
							</div>
							<div>
								<Label className="text-muted-foreground">Última Modificación</Label>
								<p className="font-medium">
									{selectedReserva.updatedAt
										? new Date(selectedReserva.updatedAt).toLocaleString("es-CL", {
												year: "numeric",
												month: "2-digit",
												day: "2-digit",
												hour: "2-digit",
												minute: "2-digit",
												second: "2-digit",
												hour12: false,
										  })
										: "-"}
								</p>
							</div>
						</div>
					</div>

					{/* Historial de Transacciones */}
					{(loadingTransacciones ||
						transacciones.length > 0 ||
						(selectedReserva && Number(selectedReserva.pagoMonto) > 0)) && (
						<div className="border-t pt-6">
							<h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
								<DollarSign className="h-5 w-5" />
								Historial de Transacciones
							</h3>

							{loadingTransacciones ? (
								<p className="text-sm text-gray-500 italic flex items-center gap-2">
									<span className="animate-spin h-3 w-3 border-2 border-gray-300 border-t-gray-600 rounded-full"></span>
									Consultando registros...
								</p>
							) : transacciones.length > 0 ? (
								<div className="overflow-x-auto">
									<table className="w-full text-sm">
										<thead className="bg-gray-50">
											<tr>
												<th className="px-4 py-2 text-left">Fecha</th>
												<th className="px-4 py-2 text-left">Monto</th>
												<th className="px-4 py-2 text-left">Tipo</th>
												<th className="px-4 py-2 text-left">Gateway</th>
												<th className="px-4 py-2 text-left">Estado</th>
												<th className="px-4 py-2 text-left">Referencia</th>
											</tr>
										</thead>
										<tbody className="divide-y">
											{transacciones.map((trans) => (
												<tr key={trans.id} className="hover:bg-gray-50">
													<td className="px-4 py-2">
														{trans.createdAt
															? (() => {
																	try {
																		const d = new Date(trans.createdAt);
																		return isNaN(d.getTime())
																			? "-"
																			: d.toLocaleString("es-CL", {
																					day: "2-digit",
																					month: "2-digit",
																					year: "numeric",
																					hour: "2-digit",
																					minute: "2-digit",
																			  });
																	} catch {
																		return "-";
																	}
															  })()
															: "-"}
													</td>
													<td className="px-4 py-2 font-medium">
														{formatCurrency(trans.monto)}
													</td>
													<td className="px-4 py-2">
														<Badge variant="outline">
															{trans.tipoPago || "N/A"}
														</Badge>
													</td>
													<td className="px-4 py-2 capitalize">
														{trans.gateway}
													</td>
													<td className="px-4 py-2">
														{trans.estado === "aprobado" && (
															<Badge variant="default" className="bg-green-500">
																✓ Aprobado
															</Badge>
														)}
														{trans.estado === "pendiente" && (
															<Badge variant="secondary">⏳ Pendiente</Badge>
														)}
														{trans.estado === "fallido" && (
															<Badge variant="destructive">✗ Fallido</Badge>
														)}
													</td>
													<td className="px-4 py-2 text-xs text-gray-600">
														{trans.referencia || trans.codigoPago?.codigo || "-"}
													</td>
												</tr>
											))}
										</tbody>
										<tfoot className="bg-gray-50 font-semibold">
											<tr>
												<td className="px-4 py-2">Total</td>
												<td className="px-4 py-2">
													{formatCurrency(
														transacciones.reduce(
															(sum, t) => sum + parseFloat(t.monto || 0),
															0
														)
													)}
												</td>
												<td colSpan="4" className="px-4 py-2 text-xs text-gray-600">
													{transacciones.length} transacción(es)
												</td>
											</tr>
										</tfoot>
									</table>
								</div>
							) : (
								<div className="bg-blue-50 border-l-4 border-blue-400 p-3">
									<p className="text-sm text-blue-700 italic">
										Esta reserva tiene pagos registrados (
										{selectedReserva ? formatCurrency(selectedReserva.pagoMonto) : "$0"}
										), pero no existen detalles históricos porque el pago se realizó
										antes de la actualización del sistema.
									</p>
								</div>
							)}
						</div>
					)}

					{/* Historial de Asignaciones (interno) */}
					<div>
						<h3 className="font-semibold text-lg mb-3">
							Historial de Asignaciones
						</h3>
						{loadingHistorial ? (
							<p className="text-sm text-muted-foreground">
								Cargando historial...
							</p>
						) : historialAsignaciones.length === 0 ? (
							<p className="text-sm text-muted-foreground">
								Sin cambios de asignación
							</p>
						) : (
							<div className="space-y-2">
								{historialAsignaciones.map((h) => (
									<div key={h.id} className="p-2 border rounded-md text-sm">
										<div className="flex justify-between">
											<span>
												Vehículo: <strong>{h.vehiculo || "-"}</strong>
												{h.conductor && (
													<>
														{" "}
														- Conductor: <strong>{h.conductor}</strong>
													</>
												)}
											</span>
											<span className="text-muted-foreground">
												{h.created_at
													? (() => {
															try {
																const d = new Date(h.created_at);
																return isNaN(d.getTime())
																	? "-"
																	: d.toLocaleString("es-CL");
															} catch {
																return "-";
															}
													  })()
													: "-"}
											</span>
										</div>
									</div>
								))}
							</div>
						)}
					</div>

					{/* Información Adicional */}
					{(selectedReserva.numeroVuelo ||
						selectedReserva.hotel ||
						selectedReserva.equipajeEspecial ||
						selectedReserva.sillaInfantil) && (
						<div>
							<h3 className="font-semibold text-lg mb-3">Información Adicional</h3>
							<div className="grid grid-cols-2 gap-4">
								{selectedReserva.numeroVuelo && (
									<div>
										<Label className="text-muted-foreground">Número de Vuelo</Label>
										<p className="font-medium">{selectedReserva.numeroVuelo}</p>
									</div>
								)}
								{selectedReserva.hotel && (
									<div>
										<Label className="text-muted-foreground">Referencia / Hotel</Label>
										<p className="font-medium">{selectedReserva.hotel}</p>
									</div>
								)}
								{selectedReserva.equipajeEspecial && (
									<div>
										<Label className="text-muted-foreground">
											Equipaje Especial
										</Label>
										<p className="font-medium">{selectedReserva.equipajeEspecial}</p>
									</div>
								)}
								{selectedReserva.sillaInfantil && (
									<div>
										<Label className="text-muted-foreground">Silla Infantil</Label>
										<p className="font-medium">Sí</p>
									</div>
								)}
							</div>
						</div>
					)}

					{/* Información Financiera */}
					<div>
						<h3 className="font-semibold text-lg mb-3">Información Financiera</h3>
						<div className="grid grid-cols-2 gap-4">
							<div>
								<Label className="text-muted-foreground">Precio Base</Label>
								<p className="font-medium">
									{formatCurrency(selectedReserva.precio)}
								</p>
							</div>
							{selectedReserva.descuentoBase > 0 && (
								<div>
									<Label className="text-muted-foreground">Descuento Base</Label>
									<p className="font-medium">
										{formatCurrency(selectedReserva.descuentoBase)}
									</p>
								</div>
							)}
							{selectedReserva.descuentoPromocion > 0 && (
								<div>
									<Label className="text-muted-foreground">
										Descuento Promoción
									</Label>
									<p className="font-medium">
										{formatCurrency(selectedReserva.descuentoPromocion)}
									</p>
								</div>
							)}
							{selectedReserva.descuentoRoundTrip > 0 && (
								<div>
									<Label className="text-muted-foreground">
										Descuento Round Trip
									</Label>
									<p className="font-medium">
										{formatCurrency(selectedReserva.descuentoRoundTrip)}
									</p>
								</div>
							)}
							{selectedReserva.descuentoOnline > 0 && (
								<div>
									<Label className="text-muted-foreground">Descuento Online</Label>
									<p className="font-medium">
										{formatCurrency(selectedReserva.descuentoOnline)}
									</p>
								</div>
							)}
							<div>
								<Label className="text-muted-foreground">Total con Descuento</Label>
								<p className="font-bold text-lg">
									{formatCurrency(selectedReserva.totalConDescuento)}
								</p>
							</div>
							<div>
								<Label className="text-muted-foreground">Abono Sugerido</Label>
								<p className="font-medium">
									{formatCurrency(selectedReserva.abonoSugerido)}
								</p>
							</div>
							<div>
								<Label className="text-muted-foreground">Saldo Pendiente</Label>
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
								<Label className="text-muted-foreground">Estado del Abono</Label>
								<div className="mt-1">
									<Badge
										variant={selectedReserva.abonoPagado ? "default" : "secondary"}
									>
										{selectedReserva.abonoPagado ? "Abono pagado" : "Pendiente"}
									</Badge>
								</div>
							</div>
							<div>
								<Label className="text-muted-foreground">Estado del Saldo</Label>
								<div className="mt-1">
									<Badge
										variant={selectedReserva.saldoPagado ? "default" : "secondary"}
									>
										{selectedReserva.saldoPagado ? "Saldo pagado" : "Pendiente"}
									</Badge>
								</div>
							</div>
							{selectedReserva.codigoDescuento && (
								<div>
									<Label className="text-muted-foreground">Código de Descuento</Label>
									<p className="font-medium">{selectedReserva.codigoDescuento}</p>
								</div>
							)}
						</div>
					</div>

					{/* Estado y Pago */}
					<div>
						<h3 className="font-semibold text-lg mb-3">Estado y Pago</h3>
						<div className="grid grid-cols-2 gap-4">
							<div>
								<Label className="text-muted-foreground">Estado</Label>
								<div className="mt-1">{getEstadoBadge(selectedReserva.estado)}</div>
							</div>
							<div>
								<Label className="text-muted-foreground">Estado de Pago</Label>
								<div className="mt-1">{getEstadoPagoBadge(selectedReserva)}</div>
							</div>
							{selectedReserva.metodoPago && (
								<div>
									<Label className="text-muted-foreground">Método de Pago</Label>
									<p className="font-medium">{selectedReserva.metodoPago}</p>
								</div>
							)}
							{selectedReserva.referenciaPago && (
								<div>
									<Label className="text-muted-foreground">Referencia de Pago</Label>
									<p className="font-medium">{selectedReserva.referenciaPago}</p>
								</div>
							)}
						</div>
					</div>

					{/* Observaciones y Mensaje */}
					{(selectedReserva.observaciones || selectedReserva.mensaje) && (
						<div>
							<h3 className="font-semibold text-lg mb-3">Notas y Comentarios</h3>
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
						<h3 className="font-semibold text-lg mb-3">Información Técnica</h3>
						<div className="grid grid-cols-2 gap-4 text-sm">
							<div>
								<Label className="text-muted-foreground">Origen</Label>
								<p>{selectedReserva.source || "web"}</p>
							</div>
							{selectedReserva.ipAddress && (
								<div>
									<Label className="text-muted-foreground">IP</Label>
									<p>{selectedReserva.ipAddress}</p>
								</div>
							)}
							<div>
								<Label className="text-muted-foreground">Fecha de Creación</Label>
								<p>{formatDate(selectedReserva.created_at)}</p>
							</div>
							<div>
								<Label className="text-muted-foreground">Última Actualización</Label>
								<p>{formatDate(selectedReserva.updated_at)}</p>
							</div>
						</div>
					</div>

					{/* Botón para asignar vehículo y conductor si no están asignados o faltan datos internos */}
					{(!isAsignada(selectedReserva) ||
						!selectedReserva.conductorId ||
						!selectedReserva.vehiculoId) && (
						<div className="mt-6 pt-4 border-t">
							<Button
								onClick={() => {
									onOpenChange(false);
									handleAsignar(selectedReserva);
								}}
								className="w-full bg-chocolate-600 hover:bg-chocolate-700"
								size="lg"
							>
								<Car className="w-4 h-4 mr-2" />
								{isAsignada(selectedReserva)
									? "Corregir Asignación (Actualizar Datos)"
									: "Asignar Vehículo y Conductor"}
							</Button>
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
