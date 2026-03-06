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
import { Checkbox } from "../../ui/checkbox";
import { Label } from "../../ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../ui/select";
import { RefreshCw, AlertCircle } from "lucide-react";

export function DialogoAsignacion({
	open,
	onOpenChange,
	selectedReserva,
	reservaVuelta,
	vehiculos,
	conductores,
	// Hook states pass them as object "asignacion"
	asignacion,
	handleEdit
}) {
	if (!selectedReserva) return null;

	const {
		vehiculoSeleccionado, setVehiculoSeleccionado,
		conductorSeleccionado, setConductorSeleccionado,
		loadingAsignacion,
		enviarNotificacion, setEnviarNotificacion,
		enviarNotificacionConductor, setEnviarNotificacionConductor,
		assignedVehiculoId, assignedConductorId,
		asignarAmbas, setAsignarAmbas,
		vueltaVehiculoSeleccionado, setVueltaVehiculoSeleccionado,
		vueltaConductorSeleccionado, setVueltaConductorSeleccionado,
		handleGuardarAsignacion,
		getConductorFromObs
	} = asignacion;

	// Helpers
	const hasVehiculoAsignado = Boolean(selectedReserva?.vehiculoId || selectedReserva?.vehiculo);
	const hasConductorAsignado = Boolean(selectedReserva?.conductorId || selectedReserva?.conductor || getConductorFromObs(selectedReserva?.observaciones));
	const conductorEnObsIda = getConductorFromObs(selectedReserva?.observaciones);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle>
						Asignar Vehículo y Conductor - Reserva #{selectedReserva?.id}
					</DialogTitle>
					<DialogDescription>
						Asigna un vehículo y opcionalmente un conductor a esta reserva
						pagada
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-4">
					{/* Información de la reserva */}
					<div className="bg-muted p-3 rounded-lg space-y-1 text-sm">
						<p>
							<strong>Cliente:</strong> {selectedReserva?.nombre}
						</p>
						<div className="flex items-center justify-between gap-3">
							<p className="m-0">
								<strong>Ruta:</strong> {selectedReserva?.origen} {"->"}{" "}
								{selectedReserva?.destino}
							</p>
							<Button
								variant="outline"
								size="sm"
								onClick={() => {
									onOpenChange(false);
									if (handleEdit) handleEdit(selectedReserva);
								}}
							>
								Editar ruta
							</Button>
						</div>
						<p>
							<strong>Fecha:</strong>{" "}
							{selectedReserva?.fecha
								? new Date(selectedReserva.fecha).toLocaleDateString("es-CL")
								: ""}
						</p>
						<p>
							<strong>Pasajeros:</strong> {selectedReserva?.pasajeros}
						</p>
					</div>
				
					{/* Alerta de viaje de IDA y VUELTA */}
					{reservaVuelta && (
						<div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
							<div className="flex items-center gap-2 mb-2">
								<AlertCircle className="h-4 w-4 text-blue-600" />
								<span className="font-medium text-blue-900">
									Este viaje tiene IDA y VUELTA
								</span>
							</div>
							<p className="text-sm text-blue-700 mb-3">
								Vuelta: {reservaVuelta.origen} → {reservaVuelta.destino} el{" "}
								{reservaVuelta.fecha ? new Date(reservaVuelta.fecha).toLocaleDateString("es-CL") : ""}
							</p>
							<div className="flex items-center gap-2">
								<Checkbox
									id="asignar-ambas"
									checked={asignarAmbas}
									onCheckedChange={(checked) => setAsignarAmbas(Boolean(checked))}
								/>
								<label 
									htmlFor="asignar-ambas" 
									className="text-sm cursor-pointer text-blue-900"
								>
									Asignar el mismo conductor y vehículo para ambos tramos
								</label>
							</div>
						</div>
					)}

					{/* Sección IDA */}
					<div className="space-y-4">
					{reservaVuelta && (
						<div className="font-medium flex items-center gap-2">
							<Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
								IDA
							</Badge>
							{selectedReserva?.origen} → {selectedReserva?.destino}
						</div>
					)}
					
					{/* Selector de vehículo */}
					<div className="space-y-2">
						<Label htmlFor="vehiculo">
							Vehículo <span className="text-red-500">*</span>
						</Label>
						<Select
							value={vehiculoSeleccionado}
							onValueChange={setVehiculoSeleccionado}
						>
							<SelectTrigger id="vehiculo">
								<SelectValue placeholder="Selecciona un vehículo" />
							</SelectTrigger>
							<SelectContent>
								{vehiculos
									.filter((v) => v.capacidad >= (selectedReserva?.pasajeros || 1))
									.map((v) => (
										<SelectItem
											key={v.id}
											value={v.id.toString()}
											disabled={
												assignedVehiculoId !== null &&
												assignedVehiculoId === v.id
											}
										>
											{v.patente} - {v.tipo} ({v.marca} {v.modelo}) -{" "}
											{v.capacidad} pasajeros
										</SelectItem>
									))}
							</SelectContent>
						</Select>
					</div>

					{/* Selector de conductor (opcional) */}
					<div className="space-y-2">
						<Label htmlFor="conductor">Conductor (opcional)</Label>
						<Select
							value={conductorSeleccionado}
							onValueChange={setConductorSeleccionado}
						>
							<SelectTrigger id="conductor">
								<SelectValue placeholder="Selecciona un conductor (opcional)" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="none">Sin asignar</SelectItem>
								{conductores.map((c) => (
									<SelectItem
										key={c.id}
										value={c.id.toString()}
										disabled={
											assignedConductorId !== null &&
											assignedConductorId === c.id
										}
									>
										{c.nombre} - {c.rut}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>
				
				{/* Sección VUELTA (solo si existe y NO está marcado "asignar ambas") */}
				{reservaVuelta && !asignarAmbas && (
					<div className="space-y-4 pt-4 border-t">
						<div className="font-medium flex items-center gap-2">
							<Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
								VUELTA
							</Badge>
							{reservaVuelta.origen} → {reservaVuelta.destino}
						</div>
						
						{/* Selector de vehículo VUELTA */}
						<div className="space-y-2">
							<Label htmlFor="vehiculo-vuelta">
								Vehículo <span className="text-red-500">*</span>
							</Label>
							<Select
								value={vueltaVehiculoSeleccionado}
								onValueChange={setVueltaVehiculoSeleccionado}
							>
								<SelectTrigger id="vehiculo-vuelta">
									<SelectValue placeholder="Selecciona un vehículo" />
								</SelectTrigger>
								<SelectContent>
									{vehiculos
										.filter((v) => v.capacidad >= (reservaVuelta?.pasajeros || selectedReserva?.pasajeros || 1))
										.map((v) => (
											<SelectItem
												key={v.id}
												value={v.id.toString()}
											>
												{v.patente} - {v.tipo} ({v.marca} {v.modelo}) -{" "}
												{v.capacidad} pasajeros
											</SelectItem>
										))}
								</SelectContent>
							</Select>
						</div>

						{/* Selector de conductor VUELTA (opcional) */}
						<div className="space-y-2">
							<Label htmlFor="conductor-vuelta">Conductor (opcional)</Label>
							<Select
								value={vueltaConductorSeleccionado}
								onValueChange={setVueltaConductorSeleccionado}
							>
								<SelectTrigger id="conductor-vuelta">
									<SelectValue placeholder="Selecciona un conductor (opcional)" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="none">Sin asignar</SelectItem>
									{conductores.map((c) => (
										<SelectItem
											key={c.id}
											value={c.id.toString()}
										>
											{c.nombre} - {c.rut}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>
				)}

					{/* Enviar notificación al cliente */}
					<div className="flex items-center gap-2 pt-2">
						<Checkbox
							id="enviar-notificacion"
							checked={enviarNotificacion}
							onCheckedChange={(v) => setEnviarNotificacion(Boolean(v))}
						/>
						<label
							htmlFor="enviar-notificacion"
							className="text-sm text-muted-foreground cursor-pointer"
						>
							Enviar notificación por correo al cliente
						</label>
					</div>

					{/* Enviar notificación al conductor */}
					<div className="flex items-center gap-2">
						<Checkbox
							id="enviar-notificacion-conductor"
							checked={enviarNotificacionConductor}
							onCheckedChange={(v) => setEnviarNotificacionConductor(Boolean(v))}
						/>
						<label
							htmlFor="enviar-notificacion-conductor"
							className="text-sm text-muted-foreground cursor-pointer"
						>
							Enviar notificación por correo al conductor
						</label>
					</div>

					{/* Mostrar info de asignación solo si la reserva confirmada ya tiene vehículo */}
					{selectedReserva?.estado === "confirmada" && hasVehiculoAsignado && (
						<div className="bg-chocolate-50 p-3 rounded-lg space-y-2 text-sm">
						<p className="font-semibold">Asignación actual:</p>

						{/* IDA */}
						<div className={reservaVuelta ? "border-b pb-2" : ""}>
							{reservaVuelta && (
								<p className="text-xs font-medium text-green-700 mb-1">↗ IDA</p>
							)}
							{selectedReserva.vehiculo_asignado ? (
								<p>
									🚗 Vehículo: {selectedReserva.vehiculo_asignado.tipo} (
									{selectedReserva.vehiculo_asignado.patente})
								</p>
							) : selectedReserva?.vehiculo ? (
								<p>🚗 Vehículo: {selectedReserva.vehiculo}</p>
							) : null}
							
							{hasConductorAsignado ? (
								selectedReserva.conductor_asignado ? (
									<p>
										👤 Conductor:{" "}
										{selectedReserva.conductor_asignado.nombre}
									</p>
								) : selectedReserva?.conductor && selectedReserva.conductor !== "Por asignar" ? (
									<p>👤 Conductor: {selectedReserva.conductor}</p>
								) : conductorEnObsIda ? (
									<p>👤 Conductor: {conductorEnObsIda}</p>
								) : null
							) : (
								<p className="text-muted-foreground">
									No hay conductor asignado actualmente.
								</p>
							)}
						</div>

						{/* VUELTA (si existe y tiene algo asignado) */}
						{reservaVuelta && (reservaVuelta.vehiculo || reservaVuelta.vehiculoId) && (
							<div className="pt-1">
								<p className="text-xs font-medium text-blue-700 mb-1">↩ VUELTA</p>
								{reservaVuelta.vehiculo ? (
									<p>🚗 Vehículo: {reservaVuelta.vehiculo}</p>
								) : null}
								{(() => {
								const conductorEnObsVuelta = getConductorFromObs(reservaVuelta?.observaciones);
								const nombreConductorVuelta = conductores.find(c => c.id === reservaVuelta?.conductorId)?.nombre ||
									reservaVuelta?.conductor ||
									conductorEnObsVuelta;
								return nombreConductorVuelta ? (
									<p>👤 Conductor: {nombreConductorVuelta}</p>
								) : (
									<p className="text-muted-foreground">
										No hay conductor asignado actualmente.
									</p>
								);
							})()}
							</div>
						)}

					</div>
				)}

					<div className="flex justify-end gap-2">
						<Button
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={loadingAsignacion}
						>
							Cancelar
						</Button>
						{(() => {
							const sameAssignment =
								assignedVehiculoId !== null &&
								vehiculoSeleccionado &&
								Number(vehiculoSeleccionado) === Number(assignedVehiculoId) &&
								String(assignedConductorId ?? "none") ===
									String(conductorSeleccionado || "none");
							
							// Permitir guardar si faltan los IDs internos aunque visualmente sea igual
							const missingIds = !selectedReserva?.vehiculoId || (selectedReserva?.conductor && !selectedReserva?.conductorId);
							
							return (
								<Button
									onClick={handleGuardarAsignacion}
									disabled={
										loadingAsignacion ||
										!vehiculoSeleccionado ||
										// Permitir si hay ids faltantes O si se quiere notificar (checkboxes activos)
										(sameAssignment && !missingIds && !enviarNotificacion && !enviarNotificacionConductor)
									}
								>
									{loadingAsignacion ? (
										<>
											<RefreshCw className="w-4 h-4 mr-2 animate-spin" />
											Guardando...
										</>
									) : sameAssignment ? (
										"Sin cambios"
									) : (
										"Asignar"
									)}
								</Button>
							);
						})()}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
