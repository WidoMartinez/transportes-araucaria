import React from "react";
import { Card, CardContent } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { Separator } from "../../ui/separator";
import {
	CheckCircle2,
	XCircle,
	AlertCircle,
	DollarSign,
	Car,
	User,
	Clock,
	Edit,
	Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

/**
 * Componente Timeline para visualizar el historial completo de una reserva
 * Muestra cambios de estado, pagos, asignaciones y gastos en orden cronológico
 */

const EventIcon = ({ type }) => {
	switch (type) {
		case "estado_confirmada":
			return <CheckCircle2 className="w-5 h-5 text-green-600" />;
		case "estado_cancelada":
			return <XCircle className="w-5 h-5 text-red-600" />;
		case "estado_pendiente":
			return <AlertCircle className="w-5 h-5 text-yellow-600" />;
		case "pago":
			return <DollarSign className="w-5 h-5 text-green-600" />;
		case "gasto":
			return <DollarSign className="w-5 h-5 text-orange-600" />;
		case "asignacion":
			return <Car className="w-5 h-5 text-blue-600" />;
		case "conductor":
			return <User className="w-5 h-5 text-purple-600" />;
		case "edicion":
			return <Edit className="w-5 h-5 text-gray-600" />;
		case "eliminacion":
			return <Trash2 className="w-5 h-5 text-red-600" />;
		default:
			return <Clock className="w-5 h-5 text-gray-600" />;
	}
};

const EventItem = ({ event }) => {
	const formatDate = (date) => {
		if (!date) return "";
		try {
			return format(new Date(date), "d 'de' MMMM, yyyy 'a las' HH:mm", {
				locale: es,
			});
		} catch (e) {
			return new Date(date).toLocaleString("es-CL");
		}
	};

	return (
		<div className="flex gap-4 pb-4">
			<div className="flex flex-col items-center">
				<div className="rounded-full bg-background border-2 border-border p-2">
					<EventIcon type={event.type} />
				</div>
				{!event.isLast && (
					<div className="w-0.5 h-full bg-border mt-2" />
				)}
			</div>
			<div className="flex-1 pb-4">
				<div className="flex items-start justify-between">
					<div>
						<p className="font-medium text-sm">{event.title}</p>
						<p className="text-sm text-muted-foreground mt-1">
							{event.description}
						</p>
						{event.details && (
							<div className="mt-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded">
								{event.details}
							</div>
						)}
					</div>
					{event.badge && (
						<Badge variant={event.badgeVariant || "secondary"} className="ml-2">
							{event.badge}
						</Badge>
					)}
				</div>
				<p className="text-xs text-muted-foreground mt-2">
					{formatDate(event.date)}
				</p>
			</div>
		</div>
	);
};

export function ReservaTimeline({ eventos = [] }) {
	if (!eventos || eventos.length === 0) {
		return (
			<Card>
				<CardContent className="py-8 text-center text-muted-foreground">
					<Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
					<p>No hay eventos registrados para esta reserva</p>
				</CardContent>
			</Card>
		);
	}

	// Ordenar eventos por fecha (más reciente primero)
	const sortedEventos = [...eventos].sort(
		(a, b) => new Date(b.date) - new Date(a.date)
	);

	// Marcar el último evento
	const eventosWithLast = sortedEventos.map((evento, index) => ({
		...evento,
		isLast: index === sortedEventos.length - 1,
	}));

	return (
		<Card>
			<CardContent className="pt-6">
				<div className="space-y-2">
					{eventosWithLast.map((evento, index) => (
						<EventItem key={`${evento.type}-${evento.date}-${index}`} event={evento} />
					))}
				</div>
			</CardContent>
		</Card>
	);
}

/**
 * Helper para convertir datos de reserva en eventos de timeline
 */
export function buildReservaTimeline(reserva, pagos = [], gastos = [], asignaciones = []) {
	const eventos = [];

	// Evento de creación
	if (reserva.createdAt) {
		eventos.push({
			type: "creacion",
			title: "Reserva Creada",
			description: `Reserva #${reserva.codigoReserva} creada por ${reserva.nombreCompleto}`,
			details: `${reserva.origen} → ${reserva.destino} | ${reserva.pasajeros} pasajeros | $${reserva.totalConDescuento?.toLocaleString("es-CL")}`,
			date: reserva.createdAt,
		});
	}

	// Eventos de cambio de estado
	if (reserva.estado === "confirmada" && reserva.updatedAt) {
		eventos.push({
			type: "estado_confirmada",
			title: "Reserva Confirmada",
			description: "La reserva fue confirmada",
			badge: "Confirmada",
			badgeVariant: "default",
			date: reserva.updatedAt,
		});
	}

	if (reserva.estado === "cancelada") {
		eventos.push({
			type: "estado_cancelada",
			title: "Reserva Cancelada",
			description: reserva.observaciones || "La reserva fue cancelada",
			badge: "Cancelada",
			badgeVariant: "destructive",
			date: reserva.updatedAt || reserva.createdAt,
		});
	}

	// Eventos de pago
	pagos.forEach((pago) => {
		eventos.push({
			type: "pago",
			title: "Pago Registrado",
			description: `Pago de $${pago.monto?.toLocaleString("es-CL")} via ${pago.metodo}`,
			details: pago.referencia ? `Referencia: ${pago.referencia}` : null,
			badge: `$${pago.monto?.toLocaleString("es-CL")}`,
			badgeVariant: "default",
			date: pago.fecha || pago.createdAt,
		});
	});

	// Eventos de gastos
	gastos.forEach((gasto) => {
		eventos.push({
			type: "gasto",
			title: "Gasto Registrado",
			description: `${gasto.tipoGasto}: $${gasto.monto?.toLocaleString("es-CL")}`,
			details: gasto.descripcion || null,
			badge: `-$${gasto.monto?.toLocaleString("es-CL")}`,
			badgeVariant: "secondary",
			date: gasto.fecha || gasto.createdAt,
		});
	});

	// Eventos de asignación
	asignaciones.forEach((asignacion) => {
		eventos.push({
			type: "asignacion",
			title: "Vehículo/Conductor Asignado",
			description: `${asignacion.vehiculo?.patente || "Vehículo"} ${asignacion.conductor ? `- ${asignacion.conductor.nombre}` : ""}`,
			date: asignacion.createdAt,
		});
	});

	// Si tiene vehículo asignado actual
	if (reserva.vehiculoId && !asignaciones.length) {
		eventos.push({
			type: "asignacion",
			title: "Vehículo Asignado",
			description: reserva.vehiculo_asignado
				? `${reserva.vehiculo_asignado.patente} - ${reserva.vehiculo_asignado.tipo}`
				: reserva.vehiculo || "Vehículo asignado",
			date: reserva.updatedAt,
		});
	}

	// Si tiene conductor asignado actual
	if (reserva.conductorId && !asignaciones.length) {
		eventos.push({
			type: "conductor",
			title: "Conductor Asignado",
			description: reserva.conductor_asignado
				? reserva.conductor_asignado.nombre
				: reserva.conductor || "Conductor asignado",
			date: reserva.updatedAt,
		});
	}

	return eventos;
}

export default ReservaTimeline;
