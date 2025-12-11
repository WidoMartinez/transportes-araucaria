import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { 
	Calendar,
	Clock,
	User,
	MapPin,
	Phone,
	Mail,
	DollarSign,
	GripVertical
} from "lucide-react";

/**
 * Tarjeta de Reserva para Kanban
 * Componente sortable con información resumida de la reserva
 */
function ReservaCard({ reserva, onClick, isDragging = false }) {
	// Configurar elemento sortable si no está siendo arrastrado como overlay
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging: isSortableDragging,
	} = useSortable({ 
		id: reserva.id,
		disabled: isDragging
	});

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isSortableDragging ? 0.5 : 1,
	};

	// Función auxiliar para formatear fecha
	const formatFecha = (fecha) => {
		if (!fecha) return "Sin fecha";
		try {
			const date = new Date(fecha);
			return date.toLocaleDateString("es-CL", {
				day: "2-digit",
				month: "short",
				year: "numeric"
			});
		} catch {
			return "Fecha inválida";
		}
	};

	// Función auxiliar para formatear hora
	const formatHora = (hora) => {
		if (!hora) return "";
		try {
			// Si viene como HH:MM:SS, tomar solo HH:MM
			return hora.substring(0, 5);
		} catch {
			return hora;
		}
	};

	// Función auxiliar para formatear moneda
	const formatCurrency = (amount) => {
		if (!amount) return "$0";
		return new Intl.NumberFormat("es-CL", {
			style: "currency",
			currency: "CLP"
		}).format(amount);
	};

	// Función auxiliar para obtener color según urgencia
	const getUrgencyColor = (fecha) => {
		if (!fecha) return null;
		
		try {
			const fechaReserva = new Date(fecha);
			const hoy = new Date();
			const diferenciaDias = Math.ceil((fechaReserva - hoy) / (1000 * 60 * 60 * 24));

			if (diferenciaDias < 0) {
				return "border-l-red-500"; // Ya pasó
			} else if (diferenciaDias === 0) {
				return "border-l-orange-500"; // Hoy
			} else if (diferenciaDias <= 1) {
				return "border-l-yellow-500"; // Mañana
			} else if (diferenciaDias <= 3) {
				return "border-l-blue-500"; // Próximos días
			}
		} catch {
			return null;
		}
		
		return null;
	};

	const urgencyClass = getUrgencyColor(reserva.fecha_servicio);

	return (
		<Card
			ref={setNodeRef}
			style={style}
			{...attributes}
			className={`cursor-pointer hover:shadow-md transition-all border-l-4 ${
				urgencyClass || "border-l-gray-300"
			} ${isDragging ? "shadow-lg" : ""}`}
			onClick={onClick}
		>
			<CardContent className="p-3">
				{/* Handle para arrastrar */}
				<div 
					{...listeners}
					className="flex items-start gap-2 mb-2 cursor-grab active:cursor-grabbing"
				>
					<GripVertical className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
					<div className="flex-1 min-w-0">
						{/* Código de reserva y estado de pago */}
						<div className="flex items-center justify-between mb-1">
							<span className="text-xs font-mono font-semibold text-gray-900">
								{reserva.codigo_reserva || `#${reserva.id}`}
							</span>
							{reserva.estado_pago && (
								<Badge 
									variant={reserva.estado_pago === "pagado" ? "success" : "outline"}
									className="text-xs"
								>
									{reserva.estado_pago}
								</Badge>
							)}
						</div>

						{/* Nombre del cliente */}
						<div className="flex items-center gap-1 mb-2">
							<User className="h-3 w-3 text-gray-500 flex-shrink-0" />
							<span className="text-sm font-medium text-gray-900 truncate">
								{reserva.nombre_cliente || "Sin nombre"}
							</span>
						</div>

						{/* Información de contacto */}
						<div className="space-y-1 mb-2">
							{reserva.email_cliente && (
								<div className="flex items-center gap-1 text-xs text-gray-600">
									<Mail className="h-3 w-3 flex-shrink-0" />
									<span className="truncate">{reserva.email_cliente}</span>
								</div>
							)}
							{reserva.telefono_cliente && (
								<div className="flex items-center gap-1 text-xs text-gray-600">
									<Phone className="h-3 w-3 flex-shrink-0" />
									<span>{reserva.telefono_cliente}</span>
								</div>
							)}
						</div>

						{/* Fecha y hora del servicio */}
						<div className="flex items-center gap-2 mb-2 text-xs text-gray-700">
							<div className="flex items-center gap-1">
								<Calendar className="h-3 w-3 flex-shrink-0" />
								<span>{formatFecha(reserva.fecha_servicio)}</span>
							</div>
							{reserva.hora_servicio && (
								<div className="flex items-center gap-1">
									<Clock className="h-3 w-3 flex-shrink-0" />
									<span>{formatHora(reserva.hora_servicio)}</span>
								</div>
							)}
						</div>

						{/* Ruta */}
						{(reserva.origen || reserva.destino) && (
							<div className="flex items-start gap-1 mb-2 text-xs text-gray-600">
								<MapPin className="h-3 w-3 flex-shrink-0 mt-0.5" />
								<div className="flex-1 min-w-0">
									<div className="truncate">
										<span className="font-medium">Origen:</span> {reserva.origen || "N/A"}
									</div>
									<div className="truncate">
										<span className="font-medium">Destino:</span> {reserva.destino || "N/A"}
									</div>
								</div>
							</div>
						)}

						{/* Monto */}
						{reserva.monto_total && (
							<div className="flex items-center gap-1 text-sm font-semibold text-green-600">
								<DollarSign className="h-3 w-3 flex-shrink-0" />
								<span>{formatCurrency(reserva.monto_total)}</span>
							</div>
						)}

						{/* Información adicional */}
						<div className="flex flex-wrap gap-1 mt-2">
							{reserva.tipo_servicio && (
								<Badge variant="outline" className="text-xs">
									{reserva.tipo_servicio}
								</Badge>
							)}
							{reserva.pasajeros && (
								<Badge variant="outline" className="text-xs">
									{reserva.pasajeros} pax
								</Badge>
							)}
							{reserva.vehiculo_asignado && (
								<Badge variant="secondary" className="text-xs">
									Vehículo asignado
								</Badge>
							)}
							{reserva.conductor_asignado && (
								<Badge variant="secondary" className="text-xs">
									Conductor asignado
								</Badge>
							)}
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

export default ReservaCard;
