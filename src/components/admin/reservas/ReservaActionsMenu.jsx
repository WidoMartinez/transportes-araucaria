import React from "react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "../../ui/dropdown-menu";
import { Button } from "../../ui/button";
import {
	MoreVertical,
	Eye,
	Edit,
	Trash2,
	DollarSign,
	History,
	Car,
	CheckCircle2,
	XCircle,
	AlertCircle,
	Receipt,
} from "lucide-react";

/**
 * Menú unificado de acciones para cada reserva
 * Agrupa todas las operaciones posibles en un solo dropdown
 */

export function ReservaActionsMenu({
	reserva,
	onVer,
	onEditar,
	onEliminar,
	onAgregarGasto,
	onVerHistorial,
	onAsignar,
	onMarcarPagada,
	onCambiarEstado,
	onVerGastos,
	disabled = false,
}) {
	// Determinar qué acciones están disponibles según el estado de la reserva
	const puedeAsignar = reserva.estado === "confirmada";
	const puedeMarcarPagada = reserva.estadoPago !== "pagado";
	const tieneGastos = reserva.totalGastos > 0 || false;
	const estaCerrada = reserva.gastoCerrado === true;

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					size="sm"
					disabled={disabled}
					className="h-8 w-8 p-0"
				>
					<span className="sr-only">Abrir menú de acciones</span>
					<MoreVertical className="h-4 w-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-56">
				<DropdownMenuLabel>Acciones</DropdownMenuLabel>
				<DropdownMenuSeparator />

				{/* Visualización */}
				<DropdownMenuItem onClick={() => onVer && onVer(reserva)}>
					<Eye className="mr-2 h-4 w-4" />
					Ver Detalles
				</DropdownMenuItem>

				{onVerHistorial && (
					<DropdownMenuItem onClick={() => onVerHistorial(reserva)}>
						<History className="mr-2 h-4 w-4" />
						Ver Historial
					</DropdownMenuItem>
				)}

				<DropdownMenuSeparator />

				{/* Edición */}
				<DropdownMenuItem onClick={() => onEditar && onEditar(reserva)}>
					<Edit className="mr-2 h-4 w-4" />
					Editar Reserva
				</DropdownMenuItem>

				{/* Asignación */}
				{puedeAsignar && onAsignar && (
					<DropdownMenuItem onClick={() => onAsignar(reserva)}>
						<Car className="mr-2 h-4 w-4" />
						{reserva.vehiculoId ? "Reasignar Vehículo" : "Asignar Vehículo"}
					</DropdownMenuItem>
				)}

				<DropdownMenuSeparator />

				{/* Gestión de Pagos */}
				{puedeMarcarPagada && onMarcarPagada && (
					<DropdownMenuItem onClick={() => onMarcarPagada(reserva)}>
						<CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
						Marcar como Pagada
					</DropdownMenuItem>
				)}

				{/* Gestión de Gastos */}
				{onAgregarGasto && !estaCerrada && (
					<DropdownMenuItem onClick={() => onAgregarGasto(reserva)}>
						<DollarSign className="mr-2 h-4 w-4 text-orange-600" />
						Agregar Gasto
					</DropdownMenuItem>
				)}

				{tieneGastos && onVerGastos && (
					<DropdownMenuItem onClick={() => onVerGastos(reserva)}>
						<Receipt className="mr-2 h-4 w-4" />
						Ver Gastos ({reserva.totalGastos || 0})
					</DropdownMenuItem>
				)}

				<DropdownMenuSeparator />

				{/* Cambio de Estado */}
				{onCambiarEstado && (
					<>
						<DropdownMenuLabel className="text-xs text-muted-foreground">
							Cambiar Estado
						</DropdownMenuLabel>
						<DropdownMenuItem
							onClick={() => onCambiarEstado(reserva, "confirmada")}
							disabled={reserva.estado === "confirmada"}
						>
							<CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
							Confirmar
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={() => onCambiarEstado(reserva, "pendiente")}
							disabled={reserva.estado === "pendiente"}
						>
							<AlertCircle className="mr-2 h-4 w-4 text-yellow-600" />
							Pendiente
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={() => onCambiarEstado(reserva, "cancelada")}
							disabled={reserva.estado === "cancelada"}
							className="text-red-600"
						>
							<XCircle className="mr-2 h-4 w-4" />
							Cancelar
						</DropdownMenuItem>
						<DropdownMenuSeparator />
					</>
				)}

				{/* Eliminación */}
				{onEliminar && (
					<DropdownMenuItem
						onClick={() => onEliminar(reserva)}
						className="text-red-600 focus:text-red-600"
					>
						<Trash2 className="mr-2 h-4 w-4" />
						Eliminar Reserva
					</DropdownMenuItem>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

export default ReservaActionsMenu;
