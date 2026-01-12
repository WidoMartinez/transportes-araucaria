import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
	CheckCircle2,
	XCircle,
	Printer,
	Mail,
	Copy,
	Trash2,
	AlertCircle,
	ArrowRight
} from 'lucide-react';
import {
	ESTADOS_RESERVA,
	ETIQUETAS_ESTADO,
	obtenerEstadosSiguientes,
	esTransicionValida
} from '../../types/reservas';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '../ui/alert-dialog';

/**
 * Panel de acciones contextuales según el estado de la reserva
 * 
 * Muestra las acciones disponibles para una reserva según su estado actual,
 * validando las transiciones permitidas y mostrando acciones rápidas.
 * 
 * @param {Object} props
 * @param {Object} props.reserva - Reserva actual
 * @param {string} props.reserva.estado - Estado actual de la reserva
 * @param {string} props.reserva.codigo - Código de la reserva
 * @param {Function} [props.onCambiarEstado] - Callback al cambiar estado
 * @param {Function} [props.onNotificar] - Callback al enviar notificación
 * @param {Function} [props.onImprimir] - Callback al imprimir
 * @param {Function} [props.onDuplicar] - Callback al duplicar
 * @param {Function} [props.onEliminar] - Callback al eliminar
 * @param {boolean} [props.deshabilitado] - Si todas las acciones están deshabilitadas
 */
const ActionPanel = ({
	reserva,
	onCambiarEstado,
	onNotificar,
	onImprimir,
	onDuplicar,
	onEliminar,
	deshabilitado = false
}) => {
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [estadoSeleccionado, setEstadoSeleccionado] = useState(null);

	if (!reserva) {
		return (
			<Card className="w-full">
				<CardContent className="py-8">
					<div className="text-center text-muted-foreground">
						<AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
						<p className="text-sm">Selecciona una reserva para ver las acciones disponibles</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	const estadoActual = reserva.estado || ESTADOS_RESERVA.BORRADOR;
	const estadosSiguientes = obtenerEstadosSiguientes(estadoActual);
	const esEstadoFinal = estadosSiguientes.length === 0;

	/**
	 * Maneja el cambio de estado
	 * @param {string} nuevoEstado - Nuevo estado
	 */
	const handleCambiarEstado = (nuevoEstado) => {
		if (!esTransicionValida(estadoActual, nuevoEstado)) {
			console.error('Transición no válida');
			return;
		}

		setEstadoSeleccionado(nuevoEstado);
		
		if (onCambiarEstado) {
			onCambiarEstado(nuevoEstado);
		}
	};

	/**
	 * Maneja la confirmación de eliminación
	 */
	const handleConfirmarEliminar = () => {
		if (onEliminar) {
			onEliminar();
		}
		setShowDeleteDialog(false);
	};

	/**
	 * Obtiene el color del badge del estado
	 */
	const getColorEstado = (estado) => {
		switch (estado) {
			case ESTADOS_RESERVA.COMPLETADA:
				return 'default';
			case ESTADOS_RESERVA.CANCELADA:
				return 'destructive';
			case ESTADOS_RESERVA.EN_PROGRESO:
				return 'secondary';
			default:
				return 'outline';
		}
	};

	return (
		<Card className="w-full">
			<CardHeader>
				<div className="flex items-center justify-between">
					<CardTitle className="text-lg">Acciones</CardTitle>
					<Badge variant={getColorEstado(estadoActual)}>
						{ETIQUETAS_ESTADO[estadoActual] || estadoActual}
					</Badge>
				</div>
			</CardHeader>
			<CardContent className="space-y-6">
				{/* Transiciones de estado */}
				{!esEstadoFinal && estadosSiguientes.length > 0 && (
					<div className="space-y-3">
						<h4 className="text-sm font-medium text-muted-foreground">
							Cambiar Estado
						</h4>
						<div className="space-y-2">
							{estadosSiguientes.map((estado) => {
								const esCancelacion = estado === ESTADOS_RESERVA.CANCELADA;
								
								return (
									<Button
										key={estado}
										onClick={() => handleCambiarEstado(estado)}
										disabled={deshabilitado}
										variant={esCancelacion ? 'destructive' : 'default'}
										className="w-full justify-between"
									>
										<span className="flex items-center gap-2">
											{esCancelacion ? (
												<XCircle className="h-4 w-4" />
											) : (
												<CheckCircle2 className="h-4 w-4" />
											)}
											{ETIQUETAS_ESTADO[estado] || estado}
										</span>
										<ArrowRight className="h-4 w-4" />
									</Button>
								);
							})}
						</div>
					</div>
				)}

				{/* Mensaje de estado final */}
				{esEstadoFinal && (
					<div className="text-center py-4 space-y-2">
						{estadoActual === ESTADOS_RESERVA.COMPLETADA ? (
							<>
								<CheckCircle2 className="h-12 w-12 mx-auto text-green-600" />
								<p className="text-sm font-medium">Reserva Completada</p>
								<p className="text-xs text-muted-foreground">
									Esta reserva ha sido finalizada exitosamente
								</p>
							</>
						) : (
							<>
								<XCircle className="h-12 w-12 mx-auto text-red-600" />
								<p className="text-sm font-medium">Reserva Cancelada</p>
								<p className="text-xs text-muted-foreground">
									Esta reserva fue cancelada y no permite más cambios de estado
								</p>
							</>
						)}
					</div>
				)}

				{/* Acciones rápidas */}
				<div className="space-y-3 pt-4 border-t">
					<h4 className="text-sm font-medium text-muted-foreground">
						Acciones Rápidas
					</h4>
					<div className="grid grid-cols-2 gap-2">
						{/* Notificar */}
						{onNotificar && (
							<Button
								onClick={onNotificar}
								disabled={deshabilitado}
								variant="outline"
								size="sm"
							>
								<Mail className="h-4 w-4 mr-2" />
								Notificar
							</Button>
						)}

						{/* Imprimir */}
						{onImprimir && (
							<Button
								onClick={onImprimir}
								disabled={deshabilitado}
								variant="outline"
								size="sm"
							>
								<Printer className="h-4 w-4 mr-2" />
								Imprimir
							</Button>
						)}

						{/* Duplicar */}
						{onDuplicar && (
							<Button
								onClick={onDuplicar}
								disabled={deshabilitado}
								variant="outline"
								size="sm"
							>
								<Copy className="h-4 w-4 mr-2" />
								Duplicar
							</Button>
						)}
					</div>
				</div>

				{/* Zona de peligro */}
				{onEliminar && !esEstadoFinal && (
					<div className="space-y-3 pt-4 border-t border-destructive/20">
						<h4 className="text-sm font-medium text-destructive">
							Zona de Peligro
						</h4>
						<Button
							onClick={() => setShowDeleteDialog(true)}
							disabled={deshabilitado}
							variant="destructive"
							size="sm"
							className="w-full"
						>
							<Trash2 className="h-4 w-4 mr-2" />
							Eliminar Reserva
						</Button>
						<p className="text-xs text-muted-foreground text-center">
							Esta acción no se puede deshacer
						</p>
					</div>
				)}

				{/* Información del código */}
				<div className="pt-4 border-t">
					<div className="flex items-center justify-between text-xs text-muted-foreground">
						<span>Código de Reserva</span>
						<code className="px-2 py-1 bg-muted rounded font-mono">
							{reserva.codigo || 'N/A'}
						</code>
					</div>
				</div>
			</CardContent>

			{/* Dialog de confirmación de eliminación */}
			<AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
						<AlertDialogDescription>
							Esta acción eliminará permanentemente la reserva{' '}
							<strong>{reserva.codigo}</strong> y no se podrá recuperar.
							Todos los datos asociados se perderán.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancelar</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleConfirmarEliminar}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							Eliminar
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</Card>
	);
};

export default ActionPanel;
