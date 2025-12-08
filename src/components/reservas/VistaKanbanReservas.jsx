import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
	Clock,
	AlertCircle,
	CheckCircle,
	XCircle,
	Calendar,
	User,
	MapPin,
	DollarSign,
} from "lucide-react";
import DetalleReserva from "./DetalleReserva";
import EditarReserva from "./EditarReserva";

/**
 * Vista Kanban para gestionar reservas por estado
 * Permite visualizar el flujo de trabajo de las reservas
 */
function VistaKanbanReservas({ reservas, onRecargar }) {
	const [reservaSeleccionada, setReservaSeleccionada] = useState(null);
	const [modoVista, setModoVista] = useState(null);

	// Definir columnas del Kanban
	const columnas = [
		{
			id: "pendiente",
			titulo: "Pendientes",
			estados: ["pendiente", "pendiente_detalles"],
			icono: Clock,
			color: "yellow",
			bgColor: "bg-yellow-50",
			borderColor: "border-yellow-200",
		},
		{
			id: "confirmada",
			titulo: "Confirmadas",
			estados: ["confirmada"],
			icono: CheckCircle,
			color: "blue",
			bgColor: "bg-blue-50",
			borderColor: "border-blue-200",
		},
		{
			id: "completada",
			titulo: "Completadas",
			estados: ["completada"],
			icono: CheckCircle,
			color: "green",
			bgColor: "bg-green-50",
			borderColor: "border-green-200",
		},
		{
			id: "cancelada",
			titulo: "Canceladas",
			estados: ["cancelada"],
			icono: XCircle,
			color: "red",
			bgColor: "bg-red-50",
			borderColor: "border-red-200",
		},
	];

	// Agrupar reservas por columna
	const reservasPorColumna = useMemo(() => {
		const grupos = {};
		columnas.forEach((col) => {
			grupos[col.id] = reservas.filter((r) => col.estados.includes(r.estado));
		});
		return grupos;
	}, [reservas]);

	const formatearFecha = (fecha) => {
		if (!fecha) return "-";
		return new Date(fecha).toLocaleDateString("es-CL", {
			day: "2-digit",
			month: "short",
		});
	};

	const formatearMoneda = (valor) => {
		return new Intl.NumberFormat("es-CL", {
			style: "currency",
			currency: "CLP",
			minimumFractionDigits: 0,
		}).format(valor || 0);
	};

	const getBadgePago = (estadoPago) => {
		const estilos = {
			pendiente: "bg-gray-100 text-gray-700",
			parcial: "bg-yellow-100 text-yellow-700",
			pagado: "bg-green-100 text-green-700",
			fallido: "bg-red-100 text-red-700",
		};
		return estilos[estadoPago] || "bg-gray-100 text-gray-700";
	};

	const handleVerDetalle = (reserva) => {
		setReservaSeleccionada(reserva);
		setModoVista("detalle");
	};

	const handleCerrarModal = () => {
		setReservaSeleccionada(null);
		setModoVista(null);
	};

	const handleActualizado = () => {
		onRecargar();
		handleCerrarModal();
	};

	return (
		<div className="space-y-4">
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				{columnas.map((columna) => {
					const Icono = columna.icono;
					const reservasColumna = reservasPorColumna[columna.id] || [];

					return (
						<Card key={columna.id} className={columna.borderColor}>
							<CardHeader className={`${columna.bgColor} border-b ${columna.borderColor}`}>
								<CardTitle className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<Icono className={`h-5 w-5 text-${columna.color}-600`} />
										<span className="text-lg">{columna.titulo}</span>
									</div>
									<Badge variant="secondary" className="font-bold">
										{reservasColumna.length}
									</Badge>
								</CardTitle>
							</CardHeader>
							<CardContent className="p-2 space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
								{reservasColumna.length === 0 ? (
									<div className="text-center text-gray-400 py-8 text-sm">
										No hay reservas en este estado
									</div>
								) : (
									reservasColumna.map((reserva) => (
										<div
											key={reserva.id}
											onClick={() => handleVerDetalle(reserva)}
											className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md 
												hover:border-gray-300 transition-all cursor-pointer"
										>
											{/* Header de la tarjeta */}
											<div className="flex items-start justify-between mb-2">
												<div className="flex-1">
													<div className="font-semibold text-sm text-gray-900 truncate">
														{reserva.nombre}
													</div>
													<div className="text-xs text-gray-500">
														ID: #{reserva.id}
													</div>
												</div>
												<Badge
													variant="outline"
													className={`text-xs ${getBadgePago(reserva.estadoPago)}`}
												>
													{reserva.estadoPago === "pagado" ? "💰" : "⏳"}
												</Badge>
											</div>

											{/* Ruta */}
											<div className="flex items-start gap-1 mb-2 text-xs">
												<MapPin className="h-3 w-3 text-gray-400 flex-shrink-0 mt-0.5" />
												<div className="flex-1 min-w-0">
													<div className="truncate text-gray-700">
														{reserva.origen}
													</div>
													<div className="text-gray-400 text-xs">→</div>
													<div className="truncate text-gray-700">
														{reserva.destino}
													</div>
												</div>
											</div>

											{/* Fecha y Hora */}
											<div className="flex items-center gap-2 mb-2 text-xs text-gray-600">
												<Calendar className="h-3 w-3" />
												<span>{formatearFecha(reserva.fecha)}</span>
												{reserva.hora && (
													<>
														<Clock className="h-3 w-3 ml-1" />
														<span>{reserva.hora.substring(0, 5)}</span>
													</>
												)}
											</div>

											{/* Monto */}
											<div className="flex items-center justify-between pt-2 border-t border-gray-100">
												<div className="flex items-center gap-1 text-xs text-gray-600">
													<User className="h-3 w-3" />
													<span>{reserva.pasajeros} pax</span>
												</div>
												<div className="flex items-center gap-1 text-sm font-semibold text-gray-900">
													<DollarSign className="h-4 w-4 text-green-600" />
													<span className="text-green-600">
														{formatearMoneda(reserva.totalConDescuento)}
													</span>
												</div>
											</div>

											{/* Alertas */}
											{reserva.saldoPendiente > 0 && (
												<div className="mt-2 flex items-center gap-1 text-xs text-orange-600 bg-orange-50 p-1 rounded">
													<AlertCircle className="h-3 w-3" />
													<span>Saldo pendiente</span>
												</div>
											)}
										</div>
									))
								)}
							</CardContent>
						</Card>
					);
				})}
			</div>

			{/* Estadísticas rápidas */}
			<Card>
				<CardContent className="p-4">
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
						<div>
							<div className="text-2xl font-bold text-gray-900">{reservas.length}</div>
							<div className="text-sm text-gray-600">Total Reservas</div>
						</div>
						<div>
							<div className="text-2xl font-bold text-yellow-600">
								{reservasPorColumna.pendiente?.length || 0}
							</div>
							<div className="text-sm text-gray-600">Pendientes</div>
						</div>
						<div>
							<div className="text-2xl font-bold text-blue-600">
								{reservasPorColumna.confirmada?.length || 0}
							</div>
							<div className="text-sm text-gray-600">Confirmadas</div>
						</div>
						<div>
							<div className="text-2xl font-bold text-green-600">
								{reservasPorColumna.completada?.length || 0}
							</div>
							<div className="text-sm text-gray-600">Completadas</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Modales */}
			{reservaSeleccionada && modoVista === "detalle" && (
				<DetalleReserva
					reserva={reservaSeleccionada}
					isOpen={true}
					onClose={handleCerrarModal}
					onEditar={() => setModoVista("editar")}
				/>
			)}

			{reservaSeleccionada && modoVista === "editar" && (
				<EditarReserva
					reserva={reservaSeleccionada}
					isOpen={true}
					onClose={handleCerrarModal}
					onActualizado={handleActualizado}
				/>
			)}
		</div>
	);
}

export default VistaKanbanReservas;
