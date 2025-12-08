import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "../ui/table";
import {
	Search,
	Eye,
	Edit,
	Calendar,
	MapPin,
	User,
	Phone,
	Mail,
	ChevronLeft,
	ChevronRight,
} from "lucide-react";
import DetalleReserva from "./DetalleReserva";
import EditarReserva from "./EditarReserva";

/**
 * Vista de Lista de Reservas
 * 
 * Muestra las reservas en formato de tabla con filtros y búsqueda.
 * Incluye paginación y acciones rápidas para cada reserva.
 */
function VistaListaReservas({ reservas, onRecargar, onCrearReserva }) {
	const [busqueda, setBusqueda] = useState("");
	const [filtroEstado, setFiltroEstado] = useState("todos");
	const [filtroPago, setFiltroPago] = useState("todos");
	const [paginaActual, setPaginaActual] = useState(1);
	const [reservaSeleccionada, setReservaSeleccionada] = useState(null);
	const [modoVista, setModoVista] = useState(null); // 'detalle' o 'editar'

	const ITEMS_POR_PAGINA = 20;

	// Filtrar y buscar reservas
	const reservasFiltradas = useMemo(() => {
		let resultado = [...reservas];

		// Aplicar búsqueda
		if (busqueda) {
			const termino = busqueda.toLowerCase();
			resultado = resultado.filter(
				(r) =>
					r.nombre?.toLowerCase().includes(termino) ||
					r.email?.toLowerCase().includes(termino) ||
					r.telefono?.includes(termino) ||
					r.codigoReserva?.toLowerCase().includes(termino) ||
					r.id?.toString().includes(termino)
			);
		}

		// Aplicar filtro de estado
		if (filtroEstado !== "todos") {
			resultado = resultado.filter((r) => r.estado === filtroEstado);
		}

		// Aplicar filtro de pago
		if (filtroPago !== "todos") {
			resultado = resultado.filter((r) => r.estadoPago === filtroPago);
		}

		// Ordenar por fecha más reciente primero
		resultado.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

		return resultado;
	}, [reservas, busqueda, filtroEstado, filtroPago]);

	// Paginación
	const totalPaginas = Math.ceil(reservasFiltradas.length / ITEMS_POR_PAGINA);
	const reservasPaginadas = reservasFiltradas.slice(
		(paginaActual - 1) * ITEMS_POR_PAGINA,
		paginaActual * ITEMS_POR_PAGINA
	);

	const limpiarFiltros = () => {
		setBusqueda("");
		setFiltroEstado("todos");
		setFiltroPago("todos");
		setPaginaActual(1);
	};

	const getBadgeEstado = (estado) => {
		const estilos = {
			pendiente: "bg-yellow-100 text-yellow-800 border-yellow-300",
			pendiente_detalles: "bg-orange-100 text-orange-800 border-orange-300",
			confirmada: "bg-blue-100 text-blue-800 border-blue-300",
			completada: "bg-green-100 text-green-800 border-green-300",
			cancelada: "bg-red-100 text-red-800 border-red-300",
		};

		const textos = {
			pendiente: "Pendiente",
			pendiente_detalles: "Pend. Detalles",
			confirmada: "Confirmada",
			completada: "Completada",
			cancelada: "Cancelada",
		};

		return (
			<Badge variant="outline" className={estilos[estado] || ""}>
				{textos[estado] || estado}
			</Badge>
		);
	};

	const getBadgePago = (estadoPago) => {
		const estilos = {
			pendiente: "bg-gray-100 text-gray-800 border-gray-300",
			aprobado: "bg-blue-100 text-blue-800 border-blue-300",
			parcial: "bg-yellow-100 text-yellow-800 border-yellow-300",
			pagado: "bg-green-100 text-green-800 border-green-300",
			fallido: "bg-red-100 text-red-800 border-red-300",
			reembolsado: "bg-purple-100 text-purple-800 border-purple-300",
		};

		const textos = {
			pendiente: "Pendiente",
			aprobado: "Aprobado",
			parcial: "Parcial",
			pagado: "Pagado",
			fallido: "Fallido",
			reembolsado: "Reembolsado",
		};

		return (
			<Badge variant="outline" className={estilos[estadoPago] || ""}>
				{textos[estadoPago] || estadoPago}
			</Badge>
		);
	};

	const formatearFecha = (fecha) => {
		if (!fecha) return "-";
		return new Date(fecha).toLocaleDateString("es-CL", {
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
		});
	};

	const formatearHora = (hora) => {
		if (!hora) return "-";
		return hora.substring(0, 5); // HH:MM
	};

	const formatearMoneda = (valor) => {
		return new Intl.NumberFormat("es-CL", {
			style: "currency",
			currency: "CLP",
		}).format(valor || 0);
	};

	const handleVerDetalle = (reserva) => {
		setReservaSeleccionada(reserva);
		setModoVista("detalle");
	};

	const handleEditar = (reserva) => {
		setReservaSeleccionada(reserva);
		setModoVista("editar");
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
						<span>Lista de Reservas</span>
						<Badge variant="secondary">{reservasFiltradas.length} resultados</Badge>
					</CardTitle>
				</CardHeader>
				<CardContent>
					{/* Filtros y búsqueda */}
					<div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
						{/* Búsqueda */}
						<div className="md:col-span-2">
							<div className="relative">
								<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
								<Input
									placeholder="Buscar por nombre, email, teléfono o código..."
									value={busqueda}
									onChange={(e) => setBusqueda(e.target.value)}
									className="pl-10"
								/>
							</div>
						</div>

						{/* Filtro de Estado */}
						<div>
							<Select value={filtroEstado} onValueChange={setFiltroEstado}>
								<SelectTrigger>
									<SelectValue placeholder="Estado" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="todos">Todos los estados</SelectItem>
									<SelectItem value="pendiente">Pendiente</SelectItem>
									<SelectItem value="pendiente_detalles">Pend. Detalles</SelectItem>
									<SelectItem value="confirmada">Confirmada</SelectItem>
									<SelectItem value="completada">Completada</SelectItem>
									<SelectItem value="cancelada">Cancelada</SelectItem>
								</SelectContent>
							</Select>
						</div>

						{/* Filtro de Pago */}
						<div>
							<Select value={filtroPago} onValueChange={setFiltroPago}>
								<SelectTrigger>
									<SelectValue placeholder="Estado de Pago" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="todos">Todos los pagos</SelectItem>
									<SelectItem value="pendiente">Pendiente</SelectItem>
									<SelectItem value="parcial">Parcial</SelectItem>
									<SelectItem value="pagado">Pagado</SelectItem>
									<SelectItem value="fallido">Fallido</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					{/* Botón limpiar filtros */}
					{(busqueda || filtroEstado !== "todos" || filtroPago !== "todos") && (
						<div className="mb-4">
							<Button variant="outline" size="sm" onClick={limpiarFiltros}>
								Limpiar Filtros
							</Button>
						</div>
					)}

					{/* Tabla de reservas */}
					<div className="border rounded-lg overflow-hidden">
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow className="bg-gray-50">
										<TableHead className="font-semibold">ID</TableHead>
										<TableHead className="font-semibold">Cliente</TableHead>
										<TableHead className="font-semibold">Contacto</TableHead>
										<TableHead className="font-semibold">Ruta</TableHead>
										<TableHead className="font-semibold">Fecha/Hora</TableHead>
										<TableHead className="font-semibold text-center">Pasajeros</TableHead>
										<TableHead className="font-semibold text-right">Total</TableHead>
										<TableHead className="font-semibold text-center">Estado</TableHead>
										<TableHead className="font-semibold text-center">Pago</TableHead>
										<TableHead className="font-semibold text-center">Acciones</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{reservasPaginadas.length === 0 ? (
										<TableRow>
											<TableCell colSpan={10} className="text-center py-8 text-gray-500">
												No se encontraron reservas
											</TableCell>
										</TableRow>
									) : (
										reservasPaginadas.map((reserva) => (
											<TableRow key={reserva.id} className="hover:bg-gray-50">
												<TableCell className="font-medium">
													<div className="flex flex-col">
														<span className="text-sm">#{reserva.id}</span>
														{reserva.codigoReserva && (
															<span className="text-xs text-gray-500">
																{reserva.codigoReserva}
															</span>
														)}
													</div>
												</TableCell>
												<TableCell>
													<div className="flex items-center gap-2">
														<User className="h-4 w-4 text-gray-400" />
														<span className="font-medium">{reserva.nombre}</span>
													</div>
												</TableCell>
												<TableCell>
													<div className="flex flex-col gap-1 text-sm">
														<div className="flex items-center gap-1">
															<Mail className="h-3 w-3 text-gray-400" />
															<span className="text-xs truncate max-w-[150px]">
																{reserva.email}
															</span>
														</div>
														<div className="flex items-center gap-1">
															<Phone className="h-3 w-3 text-gray-400" />
															<span className="text-xs">{reserva.telefono}</span>
														</div>
													</div>
												</TableCell>
												<TableCell>
													<div className="flex items-start gap-1 text-sm">
														<MapPin className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
														<div className="flex flex-col">
															<span className="font-medium text-xs">
																{reserva.origen}
															</span>
															<span className="text-gray-400 text-xs">→</span>
															<span className="font-medium text-xs">
																{reserva.destino}
															</span>
														</div>
													</div>
												</TableCell>
												<TableCell>
													<div className="flex items-start gap-1 text-sm">
														<Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
														<div className="flex flex-col">
															<span className="font-medium">
																{formatearFecha(reserva.fecha)}
															</span>
															<span className="text-xs text-gray-500">
																{formatearHora(reserva.hora)}
															</span>
														</div>
													</div>
												</TableCell>
												<TableCell className="text-center">
													{reserva.pasajeros}
												</TableCell>
												<TableCell className="text-right font-semibold">
													{formatearMoneda(reserva.totalConDescuento)}
												</TableCell>
												<TableCell className="text-center">
													{getBadgeEstado(reserva.estado)}
												</TableCell>
												<TableCell className="text-center">
													{getBadgePago(reserva.estadoPago)}
												</TableCell>
												<TableCell>
													<div className="flex gap-2 justify-center">
														<Button
															size="sm"
															variant="ghost"
															onClick={() => handleVerDetalle(reserva)}
														>
															<Eye className="h-4 w-4" />
														</Button>
														<Button
															size="sm"
															variant="ghost"
															onClick={() => handleEditar(reserva)}
														>
															<Edit className="h-4 w-4" />
														</Button>
													</div>
												</TableCell>
											</TableRow>
										))
									)}
								</TableBody>
							</Table>
						</div>
					</div>

					{/* Paginación */}
					{totalPaginas > 1 && (
						<div className="flex items-center justify-between mt-4">
							<div className="text-sm text-gray-600">
								Mostrando{" "}
								{(paginaActual - 1) * ITEMS_POR_PAGINA + 1} a{" "}
								{Math.min(paginaActual * ITEMS_POR_PAGINA, reservasFiltradas.length)}{" "}
								de {reservasFiltradas.length} reservas
							</div>
							<div className="flex gap-2">
								<Button
									variant="outline"
									size="sm"
									onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
									disabled={paginaActual === 1}
								>
									<ChevronLeft className="h-4 w-4" />
									Anterior
								</Button>
								<div className="flex items-center gap-2">
									<span className="text-sm text-gray-600">
										Página {paginaActual} de {totalPaginas}
									</span>
								</div>
								<Button
									variant="outline"
									size="sm"
									onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
									disabled={paginaActual === totalPaginas}
								>
									Siguiente
									<ChevronRight className="h-4 w-4" />
								</Button>
							</div>
						</div>
					)}
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

export default VistaListaReservas;
