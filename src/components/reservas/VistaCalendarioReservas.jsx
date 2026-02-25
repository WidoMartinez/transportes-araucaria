import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import DetalleReserva from "./DetalleReserva";
import EditarReserva from "./EditarReserva";

/**
 * Vista de Calendario para visualizar reservas por día
 * Permite navegar entre meses y ver reservas agrupadas por fecha
 */
function VistaCalendarioReservas({ reservas, onRecargar }) {
	const [mesActual, setMesActual] = useState(new Date());
	const [reservaSeleccionada, setReservaSeleccionada] = useState(null);
	const [modoVista, setModoVista] = useState(null);

	// Agrupar reservas por fecha
	const reservasPorFecha = useMemo(() => {
		const mapa = {};
		reservas.forEach((reserva) => {
			if (!reserva.fecha) return;
			const fechaKey = format(new Date(reserva.fecha), "yyyy-MM-dd");
			if (!mapa[fechaKey]) {
				mapa[fechaKey] = [];
			}
			mapa[fechaKey].push(reserva);
		});
		return mapa;
	}, [reservas]);

	// Generar días del mes
	const diasDelMes = useMemo(() => {
		const inicio = startOfMonth(mesActual);
		const fin = endOfMonth(mesActual);
		return eachDayOfInterval({ start: inicio, end: fin });
	}, [mesActual]);

	const mesAnterior = () => {
		setMesActual(subMonths(mesActual, 1));
	};

	const mesSiguiente = () => {
		setMesActual(addMonths(mesActual, 1));
	};

	const hoy = () => {
		setMesActual(new Date());
	};

	const getReservasDelDia = (dia) => {
		const fechaKey = format(dia, "yyyy-MM-dd");
		return reservasPorFecha[fechaKey] || [];
	};

	const getBadgeEstado = (estado) => {
		const colores = {
			pendiente: "bg-yellow-400",
			pendiente_detalles: "bg-orange-400",
			confirmada: "bg-blue-400",
			completada: "bg-green-400",
			cancelada: "bg-red-400",
		};
		return colores[estado] || "bg-gray-400";
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
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<CalendarIcon className="h-5 w-5" />
							<span>Calendario de Reservas</span>
						</div>
						<div className="flex items-center gap-2">
							<Button variant="outline" size="sm" onClick={mesAnterior}>
								<ChevronLeft className="h-4 w-4" />
							</Button>
							<Button variant="outline" size="sm" onClick={hoy}>
								Hoy
							</Button>
							<span className="text-lg font-semibold px-4">
								{format(mesActual, "MMMM yyyy", { locale: es })}
							</span>
							<Button variant="outline" size="sm" onClick={mesSiguiente}>
								<ChevronRight className="h-4 w-4" />
							</Button>
						</div>
					</CardTitle>
				</CardHeader>
				<CardContent>
					{/* Encabezado de días de la semana */}
					<div className="grid grid-cols-7 gap-2 mb-2">
						{["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((dia) => (
							<div key={dia} className="text-center font-semibold text-sm text-gray-600 p-2">
								{dia}
							</div>
						))}
					</div>

					{/* Días del mes */}
					<div className="grid grid-cols-7 gap-2">
						{diasDelMes.map((dia) => {
							const reservasDelDia = getReservasDelDia(dia);
							const esHoy = isSameDay(dia, new Date());
							const esMesActual = isSameMonth(dia, mesActual);

							return (
								<div
									key={dia.toString()}
									className={`
										min-h-[100px] p-2 border rounded-lg
										${esHoy ? "border-blue-500 border-2 bg-blue-50" : "border-gray-200"}
										${!esMesActual ? "bg-gray-50 opacity-50" : "bg-white"}
										hover:shadow-md transition-shadow
									`}
								>
									<div className="flex justify-between items-start mb-1">
										<span
											className={`text-sm font-semibold ${
												esHoy ? "text-blue-600" : "text-gray-700"
											}`}
										>
											{format(dia, "d")}
										</span>
										{reservasDelDia.length > 0 && (
											<Badge variant="secondary" className="text-xs">
												{reservasDelDia.length}
											</Badge>
										)}
									</div>

									{/* Reservas del día */}
									<div className="space-y-1">
										{reservasDelDia.slice(0, 3).map((reserva) => (
											<div
												key={reserva.id}
												onClick={() => handleVerDetalle(reserva)}
												className="cursor-pointer hover:opacity-80 transition-opacity"
											>
												<div
													className={`
														text-xs p-1 rounded truncate
														${getBadgeEstado(reserva.estado)}
														text-white
													`}
												>
													<div className="font-medium truncate">
														{reserva.nombre}
													</div>
													<div className="text-xs opacity-90">
														{reserva.hora?.substring(0, 5) || "-"}
													</div>
												</div>
											</div>
										))}
										{reservasDelDia.length > 3 && (
											<div className="text-xs text-gray-500 text-center">
												+{reservasDelDia.length - 3} más
											</div>
										)}
									</div>
								</div>
							);
						})}
					</div>

					{/* Leyenda */}
					<div className="mt-6 flex flex-wrap gap-4 justify-center text-sm">
						<div className="flex items-center gap-2">
							<div className="w-4 h-4 rounded bg-yellow-400"></div>
							<span>Pendiente</span>
						</div>
						<div className="flex items-center gap-2">
							<div className="w-4 h-4 rounded bg-blue-400"></div>
							<span>Confirmada</span>
						</div>
						<div className="flex items-center gap-2">
							<div className="w-4 h-4 rounded bg-green-400"></div>
							<span>Completada</span>
						</div>
						<div className="flex items-center gap-2">
							<div className="w-4 h-4 rounded bg-red-400"></div>
							<span>Cancelada</span>
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

export default VistaCalendarioReservas;
