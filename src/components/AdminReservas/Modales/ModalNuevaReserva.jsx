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
import { RefreshCw, Plus, Star } from "lucide-react";

export function ModalNuevaReserva({
	open,
	onOpenChange,
	newReservaForm,
	setNewReservaForm,
	clienteSeleccionado,
	buscarClientes,
	mostrandoSugerencias,
	setMostrandoSugerencias,
	clienteSugerencias,
	seleccionarCliente,
	sentidoViaje,
	setSentidoViaje,
	destinosOptions,
	TIME_OPTIONS,
	AEROPUERTO_LABEL,
	formatCurrency,
	saving,
	handleSaveNewReserva,
}) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Nueva Reserva Manual</DialogTitle>
					<DialogDescription>
						Crea una nueva reserva ingresando manualmente los datos del cliente
						y del viaje
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-6">
					{/* Información del Cliente */}
					<div className="space-y-4">
						<h3 className="font-semibold text-lg border-b pb-2">
							Información del Cliente
						</h3>

						{/* Indicador de cliente existente */}
						{clienteSeleccionado && (
							<div className="bg-chocolate-50 border border-chocolate-200 text-chocolate-700 px-4 py-3 rounded-md">
								<p className="font-medium">✓ Cliente existente seleccionado</p>
								<p className="text-sm">
									{clienteSeleccionado.esCliente && (
										<Badge variant="default" className="mr-2">
											Cliente
										</Badge>
									)}
									{clienteSeleccionado.clasificacion &&
										clienteSeleccionado.clasificacion !==
											"Cliente Activo" && (
											<Badge variant="outline" className="mr-2">
												{clienteSeleccionado.clasificacion}
											</Badge>
										)}
									{clienteSeleccionado.totalReservas > 0 && (
										<span className="text-xs">
											{clienteSeleccionado.totalReservas} reserva(s) previa(s)
										</span>
									)}
								</p>
							</div>
						)}

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2 relative">
								<Label htmlFor="new-nombre">
									Nombre Completo <span className="text-red-500">*</span>
								</Label>
								<Input
									id="new-nombre"
									placeholder="Juan Pérez (escribe para buscar)"
									value={newReservaForm.nombre}
									onChange={(e) => {
										setNewReservaForm({
											...newReservaForm,
											nombre: e.target.value,
										});
										buscarClientes(e.target.value);
									}}
									onBlur={() =>
										setTimeout(() => setMostrandoSugerencias(false), 200)
									}
									onFocus={() => {
										if (
											newReservaForm.nombre.trim().length > 0 &&
											clienteSugerencias && clienteSugerencias.length > 0
										) {
											setMostrandoSugerencias(true);
										}
									}}
								/>
								{/* Sugerencias de autocompletado */}
								{mostrandoSugerencias && clienteSugerencias && clienteSugerencias.length > 0 && (
									<div className="absolute z-50 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto mt-1">
										{clienteSugerencias.map((cliente) => (
											<div
												key={cliente.id}
												className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
												onClick={() => seleccionarCliente(cliente)}
											>
												<div className="font-medium">{cliente.nombre}</div>
												<div className="text-sm text-gray-600">
													{cliente.email} - {cliente.telefono}
													{cliente.rut && ` - RUT: ${cliente.rut}`}
												</div>
												{cliente.esCliente && (
													<Badge variant="default" className="text-xs mt-1">
														Cliente - {cliente.totalReservas} reservas
													</Badge>
												)}
											</div>
										))}
									</div>
								)}
							</div>
							<div className="space-y-2">
								<Label htmlFor="new-rut">RUT (opcional)</Label>
								<Input
									id="new-rut"
									placeholder="12345678-9"
									value={newReservaForm.rut}
									onChange={(e) => {
										setNewReservaForm({
											...newReservaForm,
											rut: e.target.value,
										});
										buscarClientes(e.target.value);
									}}
									onBlur={() =>
										setTimeout(() => setMostrandoSugerencias(false), 200)
									}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="new-email">
									Email <span className="text-red-500">*</span>
								</Label>
								<Input
									id="new-email"
									type="email"
									placeholder="juan@example.com"
									value={newReservaForm.email}
									onChange={(e) =>
										setNewReservaForm({
											...newReservaForm,
											email: e.target.value,
										})
									}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="new-telefono">
									Teléfono <span className="text-red-500">*</span>
								</Label>
								<Input
									id="new-telefono"
									placeholder="+56912345678"
									value={newReservaForm.telefono}
									onChange={(e) =>
										setNewReservaForm({
											...newReservaForm,
											telefono: e.target.value,
										})
									}
								/>
							</div>
						</div>
					</div>

					{/* Detalles del Viaje */}
					<div className="space-y-4">
						<h3 className="font-semibold text-lg border-b pb-2">
							Detalles del Viaje
						</h3>
						{/* Selector de sentido del viaje */}
						<div className="space-y-3">
							<Label>Sentido del Viaje</Label>
							<div className="flex flex-wrap gap-4">
								<label className="inline-flex items-center gap-2 cursor-pointer text-sm">
									<input
										type="radio"
										name="sentido-viaje"
										value="hacia_aeropuerto"
										checked={sentidoViaje === "hacia_aeropuerto"}
										onChange={() => {
											setSentidoViaje("hacia_aeropuerto");
											setNewReservaForm({
												...newReservaForm,
												origen: "",
												destino: AEROPUERTO_LABEL,
											});
										}}
									/>
									Hacia Aeropuerto
								</label>
								<label className="inline-flex items-center gap-2 cursor-pointer text-sm">
									<input
										type="radio"
										name="sentido-viaje"
										value="desde_aeropuerto"
										checked={sentidoViaje === "desde_aeropuerto"}
										onChange={() => {
											setSentidoViaje("desde_aeropuerto");
											setNewReservaForm({
												...newReservaForm,
												origen: AEROPUERTO_LABEL,
												destino: "",
											});
										}}
									/>
									Desde Aeropuerto
								</label>
								<label className="inline-flex items-center gap-2 cursor-pointer text-sm">
									<input
										type="radio"
										name="sentido-viaje"
										value="otro"
										checked={sentidoViaje === "otro"}
										onChange={() => {
											setSentidoViaje("otro");
											setNewReservaForm({
												...newReservaForm,
												origen: "",
												destino: "",
											});
										}}
									/>
									Interurbano / Otro
								</label>
							</div>
						</div>

						{/* Origen y Destino */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="new-origen">
									Origen <span className="text-red-500">*</span>
								</Label>
								{sentidoViaje === "desde_aeropuerto" ? (
									<Input
										id="new-origen"
										value={AEROPUERTO_LABEL}
										disabled
										className="bg-muted text-muted-foreground"
									/>
								) : (
									<select
										id="new-origen"
										className="border rounded-md h-10 px-3 w-full"
										value={newReservaForm.origen}
										onChange={(e) =>
											setNewReservaForm({
												...newReservaForm,
												origen: e.target.value,
											})
										}
									>
										<option value="">Seleccionar origen</option>
										{destinosOptions && destinosOptions
											.filter((n) => n !== AEROPUERTO_LABEL)
											.map((n) => (
												<option key={n} value={n}>
													{n}
												</option>
											))}
									</select>
								)}
							</div>
							<div className="space-y-2">
								<Label htmlFor="new-destino">
									Destino <span className="text-red-500">*</span>
								</Label>
								{sentidoViaje === "hacia_aeropuerto" ? (
									<Input
										id="new-destino"
										value={AEROPUERTO_LABEL}
										disabled
										className="bg-muted text-muted-foreground"
									/>
								) : (
									<select
										id="new-destino"
										className="border rounded-md h-10 px-3 w-full"
										value={newReservaForm.destino}
										onChange={(e) =>
											setNewReservaForm({
												...newReservaForm,
												destino: e.target.value,
											})
										}
									>
										<option value="">Seleccionar destino</option>
										{destinosOptions && destinosOptions
											.filter((n) => n !== AEROPUERTO_LABEL)
											.map((n) => (
												<option key={n} value={n}>
													{n}
												</option>
											))}
									</select>
								)}
							</div>
							<div className="space-y-2">
								<Label htmlFor="new-fecha">
									Fecha <span className="text-red-500">*</span>
								</Label>
								<Input
									id="new-fecha"
									type="date"
									value={newReservaForm.fecha}
									onChange={(e) =>
										setNewReservaForm({
											...newReservaForm,
											fecha: e.target.value,
										})
									}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="new-hora">Hora</Label>
								<select
									id="new-hora"
									className="border rounded-md h-10 px-3 w-full"
									value={newReservaForm.hora}
									onChange={(e) =>
										setNewReservaForm({
											...newReservaForm,
											hora: e.target.value,
										})
									}
								>
									<option value="">Seleccionar...</option>
									{TIME_OPTIONS.map((h) => (
										<option key={h} value={h}>
											{h}
										</option>
									))}
								</select>
							</div>
							<div className="space-y-2">
								<Label htmlFor="new-pasajeros">Pasajeros</Label>
								<Input
									id="new-pasajeros"
									type="number"
									min="1"
									value={newReservaForm.pasajeros}
									onChange={(e) =>
										setNewReservaForm({
											...newReservaForm,
											pasajeros: parseInt(e.target.value) || 1,
										})
									}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="new-vehiculo">Vehículo</Label>
								<Select
									value={newReservaForm.vehiculo}
									onValueChange={(value) =>
										setNewReservaForm({ ...newReservaForm, vehiculo: value })
									}
								>
									<SelectTrigger id="new-vehiculo">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="sedan">Sedan</SelectItem>
										<SelectItem value="van">Van</SelectItem>
										<SelectItem value="suv">SUV</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>

						{/* Ida y Vuelta */}
						<div className="flex items-center space-x-2">
							<input
								type="checkbox"
								id="new-idavuelta"
								checked={newReservaForm.idaVuelta}
								onChange={(e) =>
									setNewReservaForm({
										...newReservaForm,
										idaVuelta: e.target.checked,
									})
								}
								className="w-4 h-4"
							/>
							<Label htmlFor="new-idavuelta">Incluir viaje de regreso</Label>
						</div>

						{newReservaForm.idaVuelta && (
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
								<div className="space-y-2">
									<Label htmlFor="new-fecharegreso">Fecha Regreso</Label>
									<Input
										id="new-fecharegreso"
										type="date"
										value={newReservaForm.fechaRegreso}
										onChange={(e) =>
											setNewReservaForm({
												...newReservaForm,
												fechaRegreso: e.target.value,
											})
										}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="new-horaregreso">Hora Regreso</Label>
									<select
										id="new-horaregreso"
										className="border rounded-md h-10 px-3 w-full"
										value={newReservaForm.horaRegreso}
										onChange={(e) =>
											setNewReservaForm({
												...newReservaForm,
												horaRegreso: e.target.value,
											})
										}
									>
										<option value="">Seleccionar...</option>
										{TIME_OPTIONS.map((h) => (
											<option key={`regreso-${h}`} value={h}>
												{h}
											</option>
										))}
									</select>
								</div>
							</div>
						)}
					</div>

					{/* Información Adicional */}
					<div className="space-y-4">
						<h3 className="font-semibold text-lg border-b pb-2">
							Información Adicional (Opcional)
						</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="new-vuelo">Número de Vuelo</Label>
								<Input
									id="new-vuelo"
									placeholder="LA123"
									value={newReservaForm.numeroVuelo}
									onChange={(e) =>
										setNewReservaForm({
											...newReservaForm,
											numeroVuelo: e.target.value,
										})
									}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="new-hotel">Hotel</Label>
								<Input
									id="new-hotel"
									placeholder="Hotel Gran Pucón"
									value={newReservaForm.hotel}
									onChange={(e) =>
										setNewReservaForm({
											...newReservaForm,
											hotel: e.target.value,
										})
									}
								/>
							</div>
							<div className="space-y-2 md:col-span-2">
								<Label htmlFor="new-equipaje">Equipaje Especial</Label>
								<Input
									id="new-equipaje"
									placeholder="Esquíes, bicicletas, etc."
									value={newReservaForm.equipajeEspecial}
									onChange={(e) =>
										setNewReservaForm({
											...newReservaForm,
											equipajeEspecial: e.target.value,
										})
									}
								/>
							</div>
							<div className="flex items-center space-x-2">
								<input
									type="checkbox"
									id="new-silla"
									checked={newReservaForm.sillaInfantil}
									onChange={(e) =>
										setNewReservaForm({
											...newReservaForm,
											sillaInfantil: e.target.checked,
										})
									}
									className="w-4 h-4"
								/>
								<Label htmlFor="new-silla">Requiere silla infantil</Label>
							</div>
						</div>
					</div>

					{/* Información Financiera */}
					<div className="space-y-4">
						<h3 className="font-semibold text-lg border-b pb-2">
							Información Financiera
						</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="new-precio">Precio Total (CLP)</Label>
								<Input
									id="new-precio"
									type="number"
									min="0"
									placeholder="50000"
									value={newReservaForm.precio}
									onChange={(e) =>
										setNewReservaForm({
											...newReservaForm,
											precio: parseFloat(e.target.value) || 0,
											totalConDescuento: parseFloat(e.target.value) || 0,
										})
									}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="new-abono">Abono Sugerido (CLP)</Label>
								<Input
									id="new-abono"
									type="number"
									min="0"
									placeholder="25000"
									value={newReservaForm.abonoSugerido}
									onChange={(e) =>
										setNewReservaForm({
											...newReservaForm,
											abonoSugerido: parseFloat(e.target.value) || 0,
										})
									}
								/>
							</div>
						</div>
						<div className="bg-chocolate-50 p-4 rounded-lg border border-chocolate-200">
							<p className="text-sm">
								<strong>Saldo Pendiente:</strong>{" "}
								{formatCurrency(
									(parseFloat(newReservaForm.precio) || 0) -
										(parseFloat(newReservaForm.abonoSugerido) || 0)
								)}
							</p>
						</div>
					</div>

					{/* Sección de Pago Inicial */}
					<div className="space-y-4">
						<h3 className="font-semibold text-lg border-b pb-2">
							Pago Inicial (Opcional)
						</h3>
						<p className="text-sm text-muted-foreground">
							Si el cliente ya realizó un pago, regístralo aquí para que
							quede en el historial
						</p>

						{/* Checkbox para activar registro de pago */}
						<div className="flex items-center space-x-2">
							<Checkbox
								id="registrar-pago-inicial"
								checked={newReservaForm.registrarPagoInicial}
								onCheckedChange={(checked) =>
									setNewReservaForm({
										...newReservaForm,
										registrarPagoInicial: checked,
									})
								}
							/>
							<Label htmlFor="registrar-pago-inicial">
								Registrar pago inicial
							</Label>
						</div>

						{/* Campos de pago (solo si checkbox está marcado) */}
						{newReservaForm.registrarPagoInicial && (
							<div className="space-y-4 pl-6 border-l-2 border-chocolate-200">
								{/* Monto */}
								<div className="space-y-2">
									<Label htmlFor="new-pago-monto">Monto del Pago (CLP)</Label>
									<Input
										id="new-pago-monto"
										type="number"
										min="0"
										step="100"
										placeholder="Ej: 30000"
										value={newReservaForm.pagoMonto || ""}
										onChange={(e) =>
											setNewReservaForm({
												...newReservaForm,
												pagoMonto: e.target.value,
											})
										}
									/>
								</div>

								{/* Método de pago */}
								<div className="space-y-2">
									<Label htmlFor="new-pago-metodo">Método de Pago</Label>
									<Select
										value={newReservaForm.pagoMetodo || "efectivo"}
										onValueChange={(value) =>
											setNewReservaForm({
												...newReservaForm,
												pagoMetodo: value,
											})
										}
									>
										<SelectTrigger id="new-pago-metodo">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="efectivo">Efectivo</SelectItem>
											<SelectItem value="transferencia">
												Transferencia
											</SelectItem>
											<SelectItem value="flow">Flow</SelectItem>
											<SelectItem value="otro">Otro</SelectItem>
										</SelectContent>
									</Select>
								</div>

								{/* Referencia */}
								<div className="space-y-2">
									<Label htmlFor="new-pago-referencia">
										Referencia/Comprobante (Opcional)
									</Label>
									<Input
										id="new-pago-referencia"
										type="text"
										placeholder="Ej: N° de transferencia, boleta, etc."
										value={newReservaForm.pagoReferencia || ""}
										onChange={(e) =>
											setNewReservaForm({
												...newReservaForm,
												pagoReferencia: e.target.value,
											})
										}
									/>
								</div>
							</div>
						)}
					</div>

					{/* Estado y Pago */}
					<div className="space-y-4">
						<h3 className="font-semibold text-lg border-b pb-2">
							Estado y Pago
						</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="new-estado">Estado de la Reserva</Label>
								<Select
									value={newReservaForm.estado}
									onValueChange={(value) =>
										setNewReservaForm({ ...newReservaForm, estado: value })
									}
								>
									<SelectTrigger id="new-estado">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="pendiente">Pendiente</SelectItem>
										<SelectItem value="confirmada">Confirmada</SelectItem>
										<SelectItem value="completada">Completada</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<Label htmlFor="new-estadopago">Estado de Pago</Label>
								<Select
									value={newReservaForm.estadoPago}
									onValueChange={(value) =>
										setNewReservaForm({
											...newReservaForm,
											estadoPago: value,
										})
									}
								>
									<SelectTrigger id="new-estadopago">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="pendiente">Pendiente</SelectItem>
										<SelectItem value="parcial">
											Pagado Parcialmente
										</SelectItem>
										<SelectItem value="pagado">Pagado Completo</SelectItem>
									</SelectContent>
								</Select>
								<p className="text-xs text-muted-foreground">
									Si registras un pago inicial arriba, selecciona "Pagado
									Parcialmente" o "Pagado Completo"
								</p>
							</div>
						</div>
					</div>

					{/* Notificaciones */}
					<div className="space-y-2">
						<h3 className="font-semibold text-lg border-b pb-2">
							Notificaciones
						</h3>
						<div className="flex items-center space-x-2">
							<input
								type="checkbox"
								id="new-enviarcorreo"
								checked={Boolean(newReservaForm.enviarCorreo)}
								onChange={(e) =>
									setNewReservaForm({
										...newReservaForm,
										enviarCorreo: e.target.checked,
									})
								}
								className="w-4 h-4"
							/>
							<Label htmlFor="new-enviarcorreo">
								Enviar correo de confirmación al cliente
							</Label>
						</div>
						<p className="text-xs text-muted-foreground">
							Desmarca esta opción si no deseas notificar por email en este
							momento.
						</p>
					</div>

					{/* Observaciones */}
					<div className="space-y-4">
						<h3 className="font-semibold text-lg border-b pb-2">
							Observaciones Internas
						</h3>
						<Textarea
							placeholder="Notas adicionales sobre esta reserva..."
							value={newReservaForm.observaciones}
							onChange={(e) =>
								setNewReservaForm({
									...newReservaForm,
									observaciones: e.target.value,
								})
							}
							rows={3}
						/>
					</div>

					{/* Botones */}
					<div className="flex justify-end gap-2 pt-4 border-t">
						<Button
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={saving}
						>
							Cancelar
						</Button>
						<Button onClick={handleSaveNewReserva} disabled={saving}>
							{saving ? (
								<>
									<RefreshCw className="w-4 h-4 mr-2 animate-spin" />
									Guardando...
								</>
							) : (
								<>
									<Plus className="w-4 h-4 mr-2" />
									Crear Reserva
								</>
							)}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
