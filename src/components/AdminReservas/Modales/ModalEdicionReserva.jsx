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
import { Input } from "../../ui/input";
import { Textarea } from "../../ui/textarea";
import { Checkbox } from "../../ui/checkbox";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../ui/select";
import { RefreshCw, MapPin } from "lucide-react";
import AddressAutocomplete from "../../ui/AddressAutocomplete";

export function ModalEdicionReserva({
	open,
	onOpenChange,
	selectedReserva,
	formData,
	setFormData,
	destinosCatalog,
	formatCurrency,
	pagoHistorial,
	setShowRegisterPayment,
	saving,
	handleSave,
	hasConductorAsignado,
	enviarActualizacionConductor,
	setEnviarActualizacionConductor,
}) {
	if (!selectedReserva) return null;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-5xl md:max-w-5xl lg:max-w-5xl max-h-[85vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Editar Reserva #{selectedReserva?.id}</DialogTitle>
					<DialogDescription>
						Actualiza el estado, pago y detalles de la reserva
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					{/* Información del Cliente (editable) */}
					<div className="bg-muted p-4 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="space-y-1">
							<Label>Nombre</Label>
							<Input
								value={formData.nombre || ""}
								onChange={(e) =>
									setFormData({ ...formData, nombre: e.target.value })
								}
							/>
						</div>
						<div className="space-y-1">
							<Label>Email</Label>
							<Input
								type="email"
								value={formData.email || ""}
								onChange={(e) =>
									setFormData({ ...formData, email: e.target.value })
								}
							/>
						</div>
						<div className="space-y-1">
							<Label>Teléfono</Label>
							<Input
								value={formData.telefono || ""}
								onChange={(e) =>
									setFormData({ ...formData, telefono: e.target.value })
								}
							/>
						</div>
						<div className="space-y-1">
							<Label>Fecha</Label>
							<Input
								type="date"
								value={formData.fecha || ""}
								onChange={(e) =>
									setFormData({ ...formData, fecha: e.target.value })
								}
							/>
						</div>
						<div className="space-y-1">
							<Label>Hora</Label>
							<Input
								type="time"
								value={formData.hora || ""}
								onChange={(e) =>
									setFormData({ ...formData, hora: e.target.value })
								}
							/>
						</div>
						<div className="space-y-1">
							<Label>Pasajeros</Label>
							<Input
								type="number"
								min="1"
								value={formData.pasajeros || ""}
								onChange={(e) =>
									setFormData({ ...formData, pasajeros: e.target.value })
								}
							/>
						</div>
						<div className="space-y-1">
							<Label>Vehículo</Label>
							<Select
								value={formData.vehiculo || "auto"}
								onValueChange={(value) =>
									setFormData({ ...formData, vehiculo: value })
								}
							>
								<SelectTrigger className="bg-white">
									<SelectValue placeholder="Seleccionar..." />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="auto">Auto / Sedán</SelectItem>
									<SelectItem value="van">Van</SelectItem>
									<SelectItem value="suv">SUV</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					{/* Detalles del Trayecto */}
					<div className="bg-muted p-4 rounded-lg space-y-4">
						<h3 className="font-semibold border-b pb-2">Detalles del Trayecto</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-1">
								<Label>Origen General</Label>
								<Select
									value={formData.origen || ""}
									onValueChange={(value) =>
										setFormData({ ...formData, origen: value })
									}
								>
									<SelectTrigger className="bg-white">
										<SelectValue placeholder="Seleccionar origen" />
									</SelectTrigger>
									<SelectContent>
										{destinosCatalog.map((destino, index) => (
											<SelectItem key={`orig-${index}`} value={destino}>
												{destino}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-1">
								<Label>Destino General</Label>
								<Select
									value={formData.destino || ""}
									onValueChange={(value) =>
										setFormData({ ...formData, destino: value })
									}
								>
									<SelectTrigger className="bg-white">
										<SelectValue placeholder="Seleccionar destino" />
									</SelectTrigger>
									<SelectContent>
										{destinosCatalog.map((destino, index) => (
											<SelectItem key={`dest-${index}`} value={destino}>
												{destino}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-4 md:col-span-2">
								<div className="space-y-1">
									<Label className="flex items-center gap-2">
										<MapPin className="h-4 w-4" />
										Dirección Específica (Ubicación Google) *
									</Label>
									<AddressAutocomplete
										id="hotel-edit"
										name="hotel"
										value={
											formData.direccionOrigen ||
											formData.direccionDestino ||
											""
										}
										placeholder="Busca la dirección exacta en Google Maps..."
										onChange={(e) => {
											const newVal = e.target.value;
											const isFromAirport =
												formData.origen === "Aeropuerto La Araucanía";
											const isToAirport =
												formData.destino === "Aeropuerto La Araucanía";

											setFormData({
												...formData,
												// Sincronizar dirección específica según el sentido del viaje
												direccionDestino: isFromAirport
													? newVal
													: formData.direccionDestino,
												direccionOrigen: isToAirport
													? newVal
													: formData.direccionOrigen,
											});
										}}
										className="bg-white"
									/>
								</div>
								<div className="space-y-1">
									<Label>Referencia / Hotel (Opcional)</Label>
									<Input
										value={formData.hotel || ""}
										placeholder="Ej: Hotel Antumalal, Depto 201"
										onChange={(e) =>
											setFormData({ ...formData, hotel: e.target.value })
										}
										className="bg-white"
									/>
								</div>
							</div>
						</div>

						{/* SOLUCIÓN: Campos para editar viaje de vuelta cuando existe */}
						{formData.idaVuelta && (
							<div className="pt-4 border-t mt-4">
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
									Viaje de Vuelta
									{formData.tramoVueltaId && (
										<Badge variant="outline" className="text-xs">
											Reserva #{formData.tramoVueltaId}
										</Badge>
									)}
								</h4>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="space-y-1">
										<Label>Fecha de Regreso *</Label>
										<Input
											type="date"
											value={formData.fechaRegreso || ""}
											onChange={(e) =>
												setFormData({
													...formData,
													fechaRegreso: e.target.value,
												})
											}
											required
										/>
									</div>
									<div className="space-y-1">
										<Label>Hora de Recogida *</Label>
										<Input
											type="time"
											value={formData.horaRegreso || ""}
											onChange={(e) =>
												setFormData({
													...formData,
													horaRegreso: e.target.value,
												})
											}
											required
										/>
									</div>
								</div>
								{(!formData.fechaRegreso || !formData.horaRegreso) && (
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
												Información Requerida
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

						{/* Opción de notificar al conductor si hubo cambios importantes y ya tiene conductor */}
						{hasConductorAsignado && (
							<div className="pt-2 border-t mt-2">
								<div className="flex items-center gap-2">
									<Checkbox
										id="enviarActualizacionConductor"
										checked={enviarActualizacionConductor}
										onCheckedChange={setEnviarActualizacionConductor}
									/>
									<label
										htmlFor="enviarActualizacionConductor"
										className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
									>
										Notificar actualización al conductor (Reenviar correo con
										nueva dirección)
									</label>
								</div>
							</div>
						)}
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
								<SelectItem
									value="pendiente"
									disabled={(selectedReserva?.pagoMonto || 0) > 0}
								>
									Pendiente
								</SelectItem>
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
								setFormData((prev) => {
									let nextEstado = prev.estado;
									if (value === "reembolsado") {
										nextEstado = "cancelada";
									} else if (value === "fallido") {
										nextEstado =
											prev.estado === "pendiente_detalles"
												? "pendiente_detalles"
												: "pendiente";
									} else if (value === "pendiente") {
										if (
											["confirmada", "completada", "cancelada"].includes(
												prev.estado
											)
										) {
											nextEstado = "pendiente";
										}
									}
									return {
										...prev,
										estadoPago: value,
										estado: nextEstado,
									};
								})
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
								<SelectItem value="flow">Flow</SelectItem>
								<SelectItem value="transferencia">Transferencia</SelectItem>
								<SelectItem value="efectivo">Efectivo</SelectItem>
								<SelectItem value="otro">Otro</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{/* Referencia de Pago */}
					<div className="space-y-2">
						<Label htmlFor="referenciaPago">Referencia de Pago (opcional)</Label>
						<Input
							id="referenciaPago"
							placeholder="ID de transacción, número de transferencia, etc."
							value={formData.referenciaPago}
							onChange={(e) =>
								setFormData({ ...formData, referenciaPago: e.target.value })
							}
						/>
					</div>

					{/* Tipo de pago registrado */}
					<div className="space-y-2">
						<Label htmlFor="tipoPago">Tipo de Pago Registrado</Label>
						{/* Determinar si ya se registró el abono del 40% */}
						{(() => {
							const montoPagadoNum = parseFloat(formData.montoPagado || 0) || 0;
							const totalReservaNum =
								parseFloat(
									selectedReserva?.totalConDescuento ||
										selectedReserva?.precio ||
										0
								) || 0;
							const abonoSugeridoNum =
								parseFloat(selectedReserva?.abonoSugerido || 0) || 0;
							const umbralAbono = Math.max(
								totalReservaNum * 0.4,
								abonoSugeridoNum || 0
							);
							const yaAbono40 =
								Boolean(selectedReserva?.abonoPagado) ||
								montoPagadoNum >= umbralAbono;
							return (
								<Select
									value={formData.tipoPago}
									onValueChange={(value) =>
										setFormData((prev) => {
											// Recalcular montos para prefill
											const totalReservaNum =
												parseFloat(
													selectedReserva?.totalConDescuento ||
														selectedReserva?.precio ||
														0
												) || 0;
											const abonoSugeridoNum =
												parseFloat(selectedReserva?.abonoSugerido || 0) || 0;
											const pagoPrevioNum =
												parseFloat(selectedReserva?.pagoMonto || 0) || 0;
											const umbralAbono = Math.max(
												totalReservaNum * 0.4,
												abonoSugeridoNum || 0
											);

											let computedMonto = null;
											if (value === "saldo" || value === "total") {
												const restante = Math.max(
													totalReservaNum - pagoPrevioNum,
													0
												);
												computedMonto = restante > 0 ? restante : null;
											} else if (value === "abono") {
												const necesario = Math.max(
													umbralAbono - pagoPrevioNum,
													0
												);
												computedMonto = necesario > 0 ? necesario : null;
											}

											return {
												...prev,
												tipoPago: value,
												// Escritura segura: guardar número o cadena vacía
												montoPagado:
													computedMonto !== null
														? computedMonto
														: prev.montoPagado,
											};
										})
									}
								>
									<SelectTrigger id="tipoPago">
										<SelectValue placeholder="Selecciona el tipo de pago" />
									</SelectTrigger>
									<SelectContent>
										{yaAbono40 ? (
											// Si ya se pagó el abono del 40%, solo permitir completar el pago
											<SelectItem value="saldo">Completar pago</SelectItem>
										) : (
											// Opciones por defecto: Abono 40% y Abono total
											<>
												<SelectItem value="abono">Abono 40%</SelectItem>
												<SelectItem value="total">Abono total</SelectItem>
											</>
										)}
									</SelectContent>
								</Select>
							);
						})()}
					</div>

					{/* Monto del pago */}
					<div className="space-y-2">
						<div className="flex justify-between items-center">
							<Label htmlFor="montoPagado">Monto a registrar (CLP)</Label>
							{(selectedReserva?.pagoMonto || 0) > 0 && (
								<Button
									type="button"
									variant="ghost"
									size="sm"
									className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 gap-1"
									onClick={() => {
										if (
											window.confirm(
												"¿Estás seguro de que deseas resetear los pagos de esta reserva? Esto volverá el monto a $0 y el estado a pendiente."
											)
										) {
											setFormData({
												...formData,
												montoPagado: "0",
												estadoPago: "pendiente",
												estado: "pendiente",
											});
										}
									}}
								>
									<RefreshCw className="w-3 h-3" />
									Resetear Pago (Volver a $0)
								</Button>
							)}
						</div>
						<Input
							id="montoPagado"
							type="number"
							step="1"
							min="0"
							placeholder="Ingresa monto solo si deseas sumar un pago manual"
							value={
								formData.montoPagado !== undefined &&
								formData.montoPagado !== null
									? formData.montoPagado
									: ""
							}
							onChange={(e) =>
								setFormData({ ...formData, montoPagado: e.target.value })
							}
						/>
						<div className="text-xs text-muted-foreground mt-1">
							<p>
								Registrado en sistema:{" "}
								<span className="font-semibold">
									{selectedReserva.pagoMonto
										? new Intl.NumberFormat("es-CL", {
												style: "currency",
												currency: "CLP",
										  }).format(selectedReserva.pagoMonto)
										: "$0"}
								</span>
							</p>
							<p className="text-[10px] mt-0.5">
								* Solo ingresa un monto si deseas <strong>sumar</strong> un pago
								al total ya registrado.
							</p>
						</div>
					</div>

					{/* Historial de pagos de esta reserva */}
					<div className="space-y-2">
						<Label>Historial de pagos</Label>
						<div className="bg-white border rounded p-3 max-h-48 overflow-y-auto">
							{pagoHistorial && pagoHistorial.length > 0 ? (
								pagoHistorial.map((p) => (
									<div
										key={p.id}
										className="flex justify-between items-center py-2 border-b"
									>
										<div>
											<div className="font-medium">
												{p.source === "web" ? "Pago web" : "Pago manual"}
											</div>
											<div className="text-sm text-muted-foreground">
												{p.metodo || "-"} - {p.referencia || "-"}
											</div>
										</div>
										<div className="text-right text-sm">
											<div>
												{new Intl.NumberFormat("es-CL", {
													style: "currency",
													currency: "CLP",
												}).format(p.amount)}
											</div>
											<div className="text-xs text-muted-foreground">
												{new Date(p.createdAt).toLocaleString()}
											</div>
										</div>
									</div>
								))
							) : (
								<p className="text-sm text-muted-foreground">
									No hay pagos registrados.
								</p>
							)}
						</div>
					</div>

					{/* Botón y modal para registrar pago manual */}
					<div className="space-y-2">
						<Label>Registrar pago manual</Label>
						<div className="flex gap-2">
							<Button
								type="button"
								onClick={() => setShowRegisterPayment(true)}
							>
								Registrar pago
							</Button>
							<span className="text-sm text-muted-foreground self-center">
								Registra pagos manuales y guarda un historial (manual / web).
							</span>
						</div>
					</div>

					{/* Observaciones */}
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<Label htmlFor="observaciones">Observaciones Internas</Label>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => setFormData({ ...formData, observaciones: "" })}
								disabled={
									!formData.observaciones || formData.observaciones.length === 0
								}
							>
								Borrar todo
							</Button>
						</div>
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
					<div className="bg-chocolate-50 p-4 rounded-lg border border-chocolate-200">
						<h4 className="font-semibold mb-2 text-chocolate-900">
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
							<div className="flex justify-between border-t border-chocolate-300 pt-1">
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
							<div className="flex justify-between pt-1">
								<span>Estado del Abono:</span>
								<Badge
									variant={
										selectedReserva.abonoPagado ? "default" : "secondary"
									}
								>
									{selectedReserva.abonoPagado ? "Abono pagado" : "Pendiente"}
								</Badge>
							</div>
							<div className="flex justify-between">
								<span>Estado del Saldo:</span>
								<Badge
									variant={
										selectedReserva.saldoPagado ? "default" : "secondary"
									}
								>
									{selectedReserva.saldoPagado ? "Saldo pagado" : "Pendiente"}
								</Badge>
							</div>
						</div>
					</div>

					{/* Botones */}
					<div className="flex justify-end gap-2 pt-4">
						<Button
							variant="outline"
							onClick={() => onOpenChange(false)}
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
			</DialogContent>
		</Dialog>
	);
}
