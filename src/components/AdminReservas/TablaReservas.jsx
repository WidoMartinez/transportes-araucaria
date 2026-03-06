import React from "react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "../ui/table";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
	Edit,
	Eye,
	Calendar,
	User,
	Phone,
	Mail,
	MapPin,
	Clock,
	Users,
	FileText,
	CheckCircle2,
	RefreshCw,
	Star,
	History,
	CheckSquare,
	ArrowUpDown,
	Baby,
} from "lucide-react";

export function TablaReservas({
	reservasFiltradas,
	selectedReservas,
	toggleSelectAll,
	toggleSelectReserva,
	columnasVisibles,
	handleSort,
	getEstadoBadge,
	getEstadoPagoBadge,
	formatDate,
	formatCurrency,
	toggleClienteManual,
	verHistorialCliente,
	handleViewDetails,
	handleEdit,
	handleAsignar,
	handleCompletar,
	handleArchivar,
	isAsignada,
}) {
	return (
		<div className="overflow-x-auto">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="w-12">
							<input
								type="checkbox"
								checked={
									reservasFiltradas.length > 0 &&
									selectedReservas.length === reservasFiltradas.length
								}
								onChange={toggleSelectAll}
								className="w-4 h-4 cursor-pointer"
							/>
						</TableHead>
						{columnasVisibles.id && <TableHead>ID</TableHead>}
						{columnasVisibles.cliente && <TableHead>Cliente</TableHead>}
						{columnasVisibles.contacto && <TableHead>Contacto</TableHead>}
						{columnasVisibles.rut && <TableHead>RUT</TableHead>}
						{columnasVisibles.esCliente && <TableHead>Tipo</TableHead>}
						{columnasVisibles.numViajes && <TableHead>Viajes</TableHead>}
						{columnasVisibles.ruta && <TableHead>Ruta</TableHead>}
						{columnasVisibles.fechaHora && (
							<TableHead>
								<Button
									variant="ghost"
									onClick={() => handleSort("fecha")}
									className="h-8 px-2 -ml-2 hover:bg-accent hover:text-accent-foreground font-bold"
								>
									Fecha/Hora Viaje
									<ArrowUpDown className="ml-2 h-4 w-4" />
								</Button>
							</TableHead>
						)}
						{columnasVisibles.fechaCreacion && (
							<TableHead>
								<Button
									variant="ghost"
									onClick={() => handleSort("created_at")}
									className="h-8 px-2 -ml-2 hover:bg-accent hover:text-accent-foreground font-bold"
								>
									Fecha Creación
									<ArrowUpDown className="ml-2 h-4 w-4" />
								</Button>
							</TableHead>
						)}
						{columnasVisibles.pasajeros && <TableHead>Pasajeros</TableHead>}
						{columnasVisibles.total && <TableHead>Total</TableHead>}
						{columnasVisibles.estado && <TableHead>Estado</TableHead>}
						{columnasVisibles.pago && <TableHead>Pago</TableHead>}
						{columnasVisibles.saldo && <TableHead>Saldo</TableHead>}
						{columnasVisibles.upgrade && <TableHead>Upgrade</TableHead>}
						{columnasVisibles.acciones && <TableHead>Acciones</TableHead>}
					</TableRow>
				</TableHeader>
				<TableBody>
					{reservasFiltradas.length === 0 ? (
						<TableRow>
							<TableCell
								colSpan={
									Object.values(columnasVisibles).filter(Boolean).length + 1
								}
								className="text-center py-8"
							>
								<div className="text-muted-foreground">
									<FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
									<p>No se encontraron reservas</p>
								</div>
							</TableCell>
						</TableRow>
					) : (
						reservasFiltradas.map((reserva) => (
							<TableRow key={reserva.id}>
								<TableCell className="w-12">
									<input
										type="checkbox"
										checked={selectedReservas.includes(reserva.id)}
										onChange={() => toggleSelectReserva(reserva.id)}
										className="w-4 h-4 cursor-pointer"
									/>
								</TableCell>
								{columnasVisibles.id && (
									<TableCell className="font-medium">
										<div className="space-y-1">
											<div>#{reserva.id}</div>
											{reserva.codigoReserva && (
												<div className="text-xs text-chocolate-600 font-mono">
													{reserva.codigoReserva}
												</div>
											)}
											{/* Badges de Tramos */}
											{reserva.tipoTramo === "ida" && reserva.tramoHijoId ? (
												<div className="mt-1 flex gap-1">
													<Badge
														variant="outline"
														className="text-[10px] px-1 py-0 h-4 bg-green-50 text-green-700 border-green-200"
													>
														IDA
													</Badge>
													<Badge
														variant="outline"
														className="text-[10px] px-1 py-0 h-4 bg-blue-50 text-blue-700 border-blue-200"
													>
														🔗 + VUELTA
													</Badge>
												</div>
											) : reserva.tipoTramo ? (
												<div className="mt-1">
													<Badge
														variant={
															reserva.tipoTramo === "vuelta"
																? "secondary"
																: "outline"
														}
														className={`text-[10px] px-1 py-0 h-4 ${
															reserva.tipoTramo === "vuelta"
																? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
																: "bg-green-50 text-green-700 border-green-200"
														}`}
													>
														{reserva.tipoTramo === "vuelta"
															? "RETORNO"
															: "IDA"}
													</Badge>
												</div>
											) : (
												reserva.idaVuelta && (
													<div className="mt-1">
														<Badge
															variant="outline"
															className="text-[10px] px-1 py-0 h-4 border-purple-200 text-purple-700 bg-purple-50"
														>
															IDA Y VUELTA
														</Badge>
													</div>
												)
											)}

											{/* Badge de Detalles Incompletos */}
											{!reserva.detallesCompletos && (
												<div className="mt-1">
													<Badge
														variant="destructive"
														className="text-[10px] px-1 py-0 h-4 animate-pulse"
													>
														⚠️ Detalles Incompletos
													</Badge>
												</div>
											)}
										</div>
									</TableCell>
								)}
								{columnasVisibles.cliente && (
									<TableCell>
										<div className="flex items-center gap-2">
											<User className="w-4 h-4 text-muted-foreground" />
											<span className="font-medium">
												{reserva.nombre}
											</span>
										</div>
									</TableCell>
								)}
								{columnasVisibles.contacto && (
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
								)}
								{columnasVisibles.rut && (
									<TableCell>
										<span className="text-sm">{reserva.rut || "-"}</span>
									</TableCell>
								)}
								{columnasVisibles.esCliente && (
									<TableCell>
										<Badge
											variant={reserva.esCliente ? "default" : "secondary"}
											className={
												reserva.clienteId ? "cursor-pointer" : "opacity-80"
											}
											onClick={
												reserva.clienteId
													? () =>
															toggleClienteManual(
																reserva.clienteId,
																reserva.esCliente
															)
													: undefined
											}
										>
											{/* Nueva lógica: Prioridad a "Cliente con código" */}
											{reserva?.source === "codigo_pago" ||
											(reserva?.referenciaPago &&
												String(reserva.referenciaPago).trim().length > 0) ||
											reserva?.metodoPago === "codigo" ? (
												"Cliente con código"
											) : reserva.esCliente ? (
												<>
													<Star className="w-3 h-3 mr-1" />
													Cliente
												</>
											) : (
												"Cotizador"
											)}
										</Badge>
										{reserva.clasificacionCliente &&
											reserva.clasificacionCliente !== "Cliente Activo" && (
												<div className="mt-1">
													<Badge variant="outline">
														{reserva.clasificacionCliente}
													</Badge>
												</div>
											)}
									</TableCell>
								)}
								{columnasVisibles.numViajes && (
									<TableCell>
										{reserva.clienteId ? (
											<Button
												variant="ghost"
												size="sm"
												onClick={() => verHistorialCliente(reserva.clienteId)}
											>
												<History className="w-3 h-3 mr-1" />
												{reserva.totalReservas || "Ver"}
											</Button>
										) : (
											<span className="text-xs text-muted-foreground">
												-
											</span>
										)}
									</TableCell>
								)}
								{columnasVisibles.ruta && (
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
								)}
								{columnasVisibles.fechaHora && (
									<TableCell>
										<div className="space-y-1 text-sm">
											<div className="flex items-center gap-1">
												<Calendar className="w-3 h-3 text-muted-foreground" />
												<span className="font-semibold">
													{formatDate(reserva.fecha)}
												</span>
											</div>
											<div className="flex items-center gap-1">
												<Clock className="w-3 h-3 text-muted-foreground" />
												<span>{reserva.hora || "-"}</span>
											</div>
											{/* Mostrar fecha de vuelta si existe y es roundtrip */}
											{reserva.idaVuelta &&
												(reserva.tramoHijo || reserva.fechaRegreso) && (
													<div className="mt-1 pt-1 border-t border-dashed border-gray-200">
														<div className="text-xs text-muted-foreground flex items-center gap-1">
															<span className="text-[10px] font-bold text-blue-600">
																VUELTA:
															</span>
														</div>
														<div className="flex items-center gap-1 text-xs">
															<Calendar className="w-3 h-3 text-blue-400" />
															<span>
																{formatDate(
																	reserva.tramoHijo?.fecha ||
																		reserva.fechaRegreso
																)}
															</span>
														</div>
														<div className="flex items-center gap-1 text-xs">
															<Clock className="w-3 h-3 text-blue-400" />
															<span>
																{reserva.tramoHijo?.hora ||
																	reserva.horaRegreso ||
																	"-"}
															</span>
														</div>
													</div>
												)}
										</div>
									</TableCell>
								)}
								{columnasVisibles.fechaCreacion && (
									<TableCell>
										<div className="text-xs text-muted-foreground">
											{reserva.createdAt
												? new Date(reserva.createdAt).toLocaleString(
														"es-CL",
														{
															year: "numeric",
															month: "2-digit",
															day: "2-digit",
															hour: "2-digit",
															minute: "2-digit",
															hour12: false,
														}
												  )
												: "-"}
										</div>
									</TableCell>
								)}
								{columnasVisibles.pasajeros && (
									<TableCell>
										<div className="flex flex-col gap-1">
											<div className="flex items-center gap-1">
												<Users className="w-4 h-4 text-muted-foreground" />
												<span className="font-medium">
													{reserva.pasajeros}
												</span>
											</div>
											{reserva.sillaInfantil && (
												<div className="flex items-center gap-1 text-amber-600 bg-amber-50 px-1 py-0.5 rounded border border-amber-200 w-fit">
													<Baby className="w-3 h-3" />
													<span className="text-[10px] font-medium">
														Silla
													</span>
												</div>
											)}
										</div>
									</TableCell>
								)}
								{columnasVisibles.total && (
									<TableCell className="font-semibold">
										{formatCurrency(
											Number(reserva.totalConDescuento || 0) +
												Number(reserva.tramoHijo?.totalConDescuento || 0)
										)}
									</TableCell>
								)}
								{columnasVisibles.estado && (
									<TableCell>{getEstadoBadge(reserva.estado)}</TableCell>
								)}
								{columnasVisibles.pago && (
									<TableCell>
										{/* Cuando hay tramo hijo, calculamos un badge de estado de pago agregado o mostramos el del padre con indicación */}
										{getEstadoPagoBadge({
											...reserva,
											pagoMonto:
												Number(reserva.pagoMonto || 0) +
												Number(reserva.tramoHijo?.pagoMonto || 0),
											totalConDescuento:
												Number(reserva.totalConDescuento || 0) +
												Number(reserva.tramoHijo?.totalConDescuento || 0),
											saldoPendiente:
												Number(reserva.saldoPendiente || 0) +
												Number(reserva.tramoHijo?.saldoPendiente || 0),
										})}
									</TableCell>
								)}
								{columnasVisibles.saldo && (
									<TableCell>
										{(() => {
											const saldoTotal =
												Number(reserva.saldoPendiente || 0) +
												Number(reserva.tramoHijo?.saldoPendiente || 0);
											return (
												<span
													className={
														saldoTotal > 0
															? "text-red-600 font-semibold"
															: "text-green-600 font-semibold"
													}
												>
													{formatCurrency(saldoTotal)}
												</span>
											);
										})()}
									</TableCell>
								)}
								{columnasVisibles.upgrade && (
									<TableCell>
										{reserva.upgradeVan ? (
											<Badge className="bg-chocolate-600 text-white hover:bg-chocolate-700 whitespace-nowrap">
												<Star className="w-3 h-3 mr-1 fill-white" />
												Van Upgrade
											</Badge>
										) : (
											<span className="text-muted-foreground text-xs">-</span>
										)}
									</TableCell>
								)}
								{columnasVisibles.acciones && (
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
											{/* Mostrar botón de asignar / reasignar cuando la reserva está confirmada */}
											{reserva?.estado === "confirmada" && (
												<Button
													variant={
														isAsignada(reserva) ? "outline" : "secondary"
													}
													size="sm"
													onClick={() => handleAsignar(reserva)}
													title={
														isAsignada(reserva)
															? "Reasignar vehículo y conductor"
															: "Asignar vehículo y conductor"
													}
												>
													<span role="img" aria-label="auto">
														🚗
													</span>
												</Button>
											)}
											{/* Botón para completar reserva y agregar gastos */}
											{reserva?.estado === "confirmada" && (
												<Button
													variant="default"
													size="sm"
													onClick={() => handleCompletar(reserva)}
													title="Completar reserva y agregar gastos"
													className="bg-green-600 hover:bg-green-700"
												>
													<CheckCircle2 className="w-4 h-4" />
												</Button>
											)}
											<Button
												variant="ghost"
												size="icon"
												onClick={() => handleArchivar(reserva)}
												title={
													reserva.archivada
														? "Desarchivar"
														: ["pendiente", "cancelada"].includes(
																reserva.estado
														  )
														? "Archivar"
														: "Solo se pueden archivar reservas pendientes o canceladas"
												}
												disabled={
													!reserva.archivada &&
													!["pendiente", "cancelada"].includes(reserva.estado)
												}
											>
												{reserva.archivada ? (
													<RefreshCw className="h-4 w-4" />
												) : (
													<CheckSquare className="h-4 w-4" />
												)}
											</Button>
										</div>
									</TableCell>
								)}
							</TableRow>
						))
					)}
				</TableBody>
			</Table>
		</div>
	);
}
