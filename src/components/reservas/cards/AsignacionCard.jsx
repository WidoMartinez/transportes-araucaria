import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Car, User, CheckCircle2, XCircle, RefreshCw, History } from 'lucide-react';

/**
 * Card para gestión de asignación de recursos
 * 
 * Muestra y permite gestionar la asignación de vehículo y conductor
 * a una reserva, incluyendo el estado de asignación e historial.
 * 
 * @param {Object} props
 * @param {Object} [props.asignacion] - Datos de asignación
 * @param {number} [props.asignacion.vehiculo_id] - ID del vehículo asignado
 * @param {string} [props.asignacion.vehiculo_nombre] - Nombre/placa del vehículo
 * @param {string} [props.asignacion.vehiculo_tipo] - Tipo de vehículo
 * @param {number} [props.asignacion.conductor_id] - ID del conductor asignado
 * @param {string} [props.asignacion.conductor_nombre] - Nombre del conductor
 * @param {string} [props.asignacion.conductor_telefono] - Teléfono del conductor
 * @param {string} [props.asignacion.estado] - Estado de la asignación
 * @param {Array} [props.asignacion.historial] - Historial de asignaciones
 * @param {boolean} [props.editable] - Si permite reasignación
 * @param {Function} [props.onAsignar] - Callback al asignar recursos
 * @param {Function} [props.onReasignar] - Callback al reasignar
 */
const AsignacionCard = ({
	asignacion,
	editable = false,
	onAsignar,
	onReasignar
}) => {
	// Estado de asignación
	const tieneAsignacion = asignacion?.vehiculo_id && asignacion?.conductor_id;
	const historial = asignacion?.historial || [];

	return (
		<Card className="w-full">
			<CardHeader>
				<div className="flex items-center justify-between">
					<CardTitle className="text-lg flex items-center gap-2">
						<RefreshCw className="h-5 w-5" />
						Asignación de Recursos
					</CardTitle>
					{tieneAsignacion ? (
						<Badge variant="default" className="flex items-center gap-1">
							<CheckCircle2 className="h-3 w-3" />
							Asignado
						</Badge>
					) : (
						<Badge variant="secondary" className="flex items-center gap-1">
							<XCircle className="h-3 w-3" />
							Sin Asignar
						</Badge>
					)}
				</div>
			</CardHeader>
			<CardContent className="space-y-4">
				{tieneAsignacion ? (
					<>
						{/* Vehículo asignado */}
						<div className="space-y-2">
							<div className="flex items-center gap-2 text-sm text-muted-foreground">
								<Car className="h-4 w-4" />
								<span>Vehículo Asignado</span>
							</div>
							<div className="pl-6 space-y-1">
								<p className="font-medium">{asignacion.vehiculo_nombre || 'Sin nombre'}</p>
								{asignacion.vehiculo_tipo && (
									<Badge variant="outline" className="text-xs">
										{asignacion.vehiculo_tipo}
									</Badge>
								)}
							</div>
						</div>

						{/* Conductor asignado */}
						<div className="space-y-2 pt-2 border-t">
							<div className="flex items-center gap-2 text-sm text-muted-foreground">
								<User className="h-4 w-4" />
								<span>Conductor Asignado</span>
							</div>
							<div className="pl-6 space-y-1">
								<p className="font-medium">{asignacion.conductor_nombre || 'Sin nombre'}</p>
								{asignacion.conductor_telefono && (
									<a
										href={`tel:${asignacion.conductor_telefono}`}
										className="text-sm text-blue-600 hover:underline block"
									>
										{asignacion.conductor_telefono}
									</a>
								)}
							</div>
						</div>

						{/* Botón de reasignación */}
						{editable && onReasignar && (
							<div className="pt-4 border-t">
								<Button
									variant="outline"
									size="sm"
									onClick={onReasignar}
									className="w-full"
								>
									<RefreshCw className="h-4 w-4 mr-2" />
									Reasignar Recursos
								</Button>
							</div>
						)}
					</>
				) : (
					<>
						{/* Sin asignación */}
						<div className="text-center py-8 space-y-4">
							<div className="flex justify-center">
								<div className="rounded-full bg-muted p-4">
									<XCircle className="h-8 w-8 text-muted-foreground" />
								</div>
							</div>
							<div className="space-y-2">
								<p className="text-sm font-medium">
									No hay recursos asignados
								</p>
								<p className="text-xs text-muted-foreground">
									Asigna un vehículo y conductor para completar esta reserva
								</p>
							</div>

							{/* Botón de asignación */}
							{editable && onAsignar && (
								<Button
									onClick={onAsignar}
									className="w-full"
								>
									<Car className="h-4 w-4 mr-2" />
									Asignar Recursos
								</Button>
							)}
						</div>
					</>
				)}

				{/* Historial de asignaciones */}
				{historial.length > 0 && (
					<div className="pt-4 border-t space-y-3">
						<div className="flex items-center gap-2 text-sm text-muted-foreground">
							<History className="h-4 w-4" />
							<span>Historial de Asignaciones</span>
						</div>
						<div className="pl-6 space-y-2">
							{historial.map((item, index) => (
								<div
									key={index}
									className="text-xs space-y-1 pb-2 border-b last:border-0"
								>
									<p className="font-medium">
										{item.vehiculo_nombre} / {item.conductor_nombre}
									</p>
									<p className="text-muted-foreground">
										{new Date(item.fecha).toLocaleString('es-CL')}
									</p>
									{item.motivo && (
										<p className="text-muted-foreground italic">
											Motivo: {item.motivo}
										</p>
									)}
								</div>
							))}
						</div>
					</div>
				)}

				{/* Información adicional */}
				{asignacion?.estado && (
					<div className="pt-2 border-t">
						<div className="flex items-center justify-between text-sm">
							<span className="text-muted-foreground">Estado</span>
							<Badge variant="outline">{asignacion.estado}</Badge>
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
};

export default AsignacionCard;
