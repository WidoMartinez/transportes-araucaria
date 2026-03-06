import React from "react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "../../ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { RefreshCw } from "lucide-react";

export function DialogoConfirmacionEliminar({
	open,
	onOpenChange,
	cantidadSeleccionada,
	onConfirm,
	processing
}) {
	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>¿Eliminar reservas seleccionadas?</AlertDialogTitle>
					<AlertDialogDescription>
						Esta acción eliminará permanentemente {cantidadSeleccionada}{" "}
						reserva(s). Esta acción no se puede deshacer.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={processing}>Cancelar</AlertDialogCancel>
					<AlertDialogAction
						onClick={onConfirm}
						disabled={processing}
						className="bg-red-600 hover:bg-red-700"
					>
						{processing ? (
							<>
								<RefreshCw className="w-4 h-4 mr-2 animate-spin" />
								Eliminando...
							</>
						) : (
							"Eliminar"
						)}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

export function DialogoCambioEstadoMasivo({
	open,
	onOpenChange,
	cantidadSeleccionada,
	bulkEstado,
	setBulkEstado,
	onConfirm,
	processing
}) {
	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Cambiar estado de reservas seleccionadas</AlertDialogTitle>
					<AlertDialogDescription>
						Selecciona el nuevo estado para {cantidadSeleccionada}{" "}
						reserva(s):
					</AlertDialogDescription>
				</AlertDialogHeader>
				<div className="py-4">
					<Select value={bulkEstado} onValueChange={setBulkEstado}>
						<SelectTrigger>
							<SelectValue placeholder="Selecciona un estado" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="pendiente">Pendiente</SelectItem>
							<SelectItem value="pendiente_detalles">Pendiente Detalles</SelectItem>
							<SelectItem value="confirmada">Confirmada</SelectItem>
							<SelectItem value="cancelada">Cancelada</SelectItem>
							<SelectItem value="completada">Completada</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={processing}>Cancelar</AlertDialogCancel>
					<AlertDialogAction
						onClick={onConfirm}
						disabled={processing || !bulkEstado}
					>
						{processing ? (
							<>
								<RefreshCw className="w-4 h-4 mr-2 animate-spin" />
								Actualizando...
							</>
						) : (
							"Actualizar Estado"
						)}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
