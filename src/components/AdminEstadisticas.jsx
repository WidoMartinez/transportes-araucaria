import React, { useState, useEffect, useCallback } from "react";
import { getBackendUrl } from "../lib/backend";
import { useAuthenticatedFetch } from "../hooks/useAuthenticatedFetch";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "./ui/table";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	DialogDescription,
} from "./ui/dialog";
import {
	User,
	Car,
	DollarSign,
	TrendingUp,
	TrendingDown,
	Calendar as CalendarIcon,
	Receipt,
	Eye,
	BarChart3,
	MapPin,
	Clock,
	Calendar,
	Users,
	Archive,
	AlertCircle,
	AlertTriangle,
	CheckCircle,
	ArrowRight,
} from "lucide-react";
import {
	endOfDay,
	startOfDay,
	startOfMonth,
	endOfMonth,
	subDays,
	subMonths,
} from "date-fns";

const TIPOS_GASTO = [
	{ value: "todos", label: "Todos los tipos" },
	{ value: "combustible", label: "Combustible (Petróleo)" },
	{ value: "peaje", label: "Peajes" },
	{ value: "pago_conductor", label: "Pago a conductor" },
	{ value: "mantenimiento", label: "Mantenimiento" },
	{ value: "comision_flow", label: "Comisión Flow" },
	{ value: "estacionamiento", label: "Estacionamiento" },
	{ value: "otro", label: "Otros" },
];

function AdminEstadisticas() {
	const { authenticatedFetch } = useAuthenticatedFetch();
	const apiUrl = getBackendUrl() || "https://transportes-araucaria.onrender.com";

	const [vistaActual, setVistaActual] = useState("conductores");
	const [estadisticasConductores, setEstadisticasConductores] = useState([]);
	const [estadisticasVehiculos, setEstadisticasVehiculos] = useState([]);
	const [estadisticasGastos, setEstadisticasGastos] = useState({
		totalGeneral: 0,
		totalRegistros: 0,
		totalesPorTipo: {},
		resumenPorFecha: [],
	});
	const [filtrosReservas, setFiltrosReservas] = useState([]);
	const [reservasFiltradas, setReservasFiltradas] = useState([]);
	const [loadingReservas, setLoadingReservas] = useState(false);
	const [filtroFechas, setFiltroFechas] = useState("ultimos-30");
	const [tipoGasto, setTipoGasto] = useState("todos");
	const [rangoPersonalizado, setRangoPersonalizado] = useState({
		desde: "",
		hasta: "",
	});
	const construirRango = useCallback((tipo, personalizado = {}) => {
		const hoy = new Date();

		const formatearEtiqueta = (fechaInicio, fechaFin, fallback) => {
			if (!fechaInicio || !fechaFin) {
				return fallback;
			}
			return `Del ${fechaInicio.toLocaleDateString("es-CL")} al ${fechaFin.toLocaleDateString("es-CL")}`;
		};

		switch (tipo) {
			case "todos":
				return {
					tipo,
					fechaInicio: null,
					fechaFin: null,
					etiqueta: "Todo el historial",
				};
			case "ultimos-15": {
				const fechaFin = endOfDay(hoy);
				const fechaInicio = startOfDay(subDays(hoy, 14));
				return {
					tipo,
					fechaInicio,
					fechaFin,
					etiqueta: "Últimos 15 días",
				};
			}
			case "ultimos-30": {
				const fechaFin = endOfDay(hoy);
				const fechaInicio = startOfDay(subDays(hoy, 29));
				return {
					tipo,
					fechaInicio,
					fechaFin,
					etiqueta: "Últimos 30 días",
				};
			}
			case "mes-actual": {
				const fechaFin = endOfDay(endOfMonth(hoy));
				const fechaInicio = startOfDay(startOfMonth(hoy));
				return {
					tipo,
					fechaInicio,
					fechaFin,
					etiqueta: "Este mes",
				};
			}
			case "mes-pasado": {
				const mesAnterior = subMonths(hoy, 1);
				const fechaInicio = startOfDay(startOfMonth(mesAnterior));
				const fechaFin = endOfDay(endOfMonth(mesAnterior));
				return {
					tipo,
					fechaInicio,
					fechaFin,
					etiqueta: "Mes pasado",
				};
			}
			case "personalizado": {
				const { fechaInicio, fechaFin } = personalizado;
				return {
					tipo,
					fechaInicio: fechaInicio ? startOfDay(fechaInicio) : null,
					fechaFin: fechaFin ? endOfDay(fechaFin) : null,
					etiqueta: formatearEtiqueta(fechaInicio, fechaFin, "Rango personalizado"),
				};
			}
			default:
				return {
					tipo,
					fechaInicio: null,
					fechaFin: null,
					etiqueta: "Todo el historial",
				};
		}
	}, []);
	const [rangoAplicado, setRangoAplicado] = useState(() =>
		construirRango("ultimos-30")
	);
	const [loading, setLoading] = useState(false);
	const [conductorDetalle, setConductorDetalle] = useState(null);
	const [showDetalleDialog, setShowDetalleDialog] = useState(false);
	const [errorRango, setErrorRango] = useState("");
	
	// Estado para detalle de reserva individual
	const [showReservaDetailDialog, setShowReservaDetailDialog] = useState(false);
	const [selectedReservaDetail, setSelectedReservaDetail] = useState(null);

	const getEstadoBadge = (estado) => {
		switch (estado) {
			case "pendiente":
				return <Badge variant="secondary">Pendiente</Badge>;
			case "pendiente_detalles":
				return <Badge variant="warning">Pendiente Detalles</Badge>;
			case "confirmada":
				return <Badge className="bg-chocolate-600 hover:bg-chocolate-700">Confirmada</Badge>;
			case "completada":
				return <Badge className="bg-green-600 hover:bg-green-700">Completada</Badge>;
			case "cancelada":
				return <Badge variant="destructive">Cancelada</Badge>;
			default:
				return <Badge variant="outline">{estado}</Badge>;
		}
	};

	const getEstadoPagoBadge = (reserva) => {
		if (reserva.estadoPago === "pagado" || reserva.saldoPagado) {
			return <Badge className="bg-green-600 hover:bg-green-700">Pagado</Badge>;
		}
		if (reserva.abonoPagado) {
			return <Badge variant="outline" className="text-orange-600 border-orange-600">Abono pagado</Badge>;
		}
		if (reserva.estadoPago === "reembolsado") {
			return <Badge variant="destructive">Reembolsado</Badge>;
		}
		return <Badge variant="secondary">Pendiente</Badge>;
	};

	const handleViewReservaDetail = async (reserva) => {
		// Mostrar lo que tenemos mientras cargamos lo completo
		setSelectedReservaDetail(reserva);
		setShowReservaDetailDialog(true);
		
		try {
			const response = await authenticatedFetch(`/api/reservas/${reserva.id}`);
			if (response.ok) {
				const fullData = await response.json();
				// Combinar con la data que ya teníamos por si acaso
				const merged = { ...reserva, ...fullData };
				
				// Normalizar campos que podrían venir distintos
				if (merged.cliente) {
					merged.nombre = merged.cliente.nombre || merged.nombre;
					merged.email = merged.cliente.email || merged.email;
					merged.telefono = merged.cliente.telefono || merged.telefono;
				}
				
				setSelectedReservaDetail(merged);
			}
		} catch (error) {
			console.error("Error cargando detalle completo de reserva:", error);
		}
	};

	const construirQueryFechas = (parametrosAdicionales = {}) => {
		const params = new URLSearchParams();
		if (rangoAplicado.fechaInicio) {
			params.append("from", rangoAplicado.fechaInicio.toISOString());
		}
		if (rangoAplicado.fechaFin) {
			params.append("to", rangoAplicado.fechaFin.toISOString());
		}
		Object.entries(parametrosAdicionales).forEach(([clave, valor]) => {
			if (valor !== undefined && valor !== null && valor !== "") {
				params.append(clave, valor);
			}
		});
		const query = params.toString();
		return query ? `?${query}` : "";
	};

	const manejarCambioFiltroFechas = (valor) => {
		setFiltroFechas(valor);
		setErrorRango("");
		if (valor !== "personalizado") {
			setRangoAplicado(construirRango(valor));
		}
	};

	const actualizarFechaPersonalizada = (campo, valor) => {
		setRangoPersonalizado((prev) => ({
			...prev,
			[campo]: valor,
		}));
	};

	const aplicarRangoPersonalizado = () => {
		if (!rangoPersonalizado.desde || !rangoPersonalizado.hasta) {
			setErrorRango("Selecciona ambas fechas antes de aplicar.");
			return;
		}

		const fechaInicio = new Date(rangoPersonalizado.desde);
		const fechaFin = new Date(rangoPersonalizado.hasta);

		if (Number.isNaN(fechaInicio.getTime()) || Number.isNaN(fechaFin.getTime())) {
			setErrorRango("Las fechas seleccionadas no son válidas.");
			return;
		}

		if (fechaFin < fechaInicio) {
			setErrorRango("La fecha final debe ser posterior o igual a la fecha inicial.");
			return;
		}

		setErrorRango("");
		setRangoAplicado(
			construirRango("personalizado", { fechaInicio, fechaFin })
		);
	};

	const formatearMonto = (valor) => {
		const numero = Number(valor || 0);
		return `$${numero.toLocaleString("es-CL")}`;
	};

	const obtenerEtiquetaTipo = (valor) => {
		return (
			TIPOS_GASTO.find((tipo) => tipo.value === valor)?.label || valor
		);
	};

	const formatearFecha = (valor) => {
		if (!valor) {
			return "-";
		}
		const fecha = new Date(`${valor}T00:00:00`);
		if (Number.isNaN(fecha.getTime())) {
			return valor;
		}
		return fecha.toLocaleDateString("es-CL");
	};

	useEffect(() => {
		if (vistaActual === "conductores") {
			fetchEstadisticasConductores();
		} else if (vistaActual === "vehiculos") {
			fetchEstadisticasVehiculos();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [vistaActual, rangoAplicado]);

	useEffect(() => {
		if (vistaActual === "gastos") {
			fetchEstadisticasGastos();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [vistaActual, rangoAplicado, tipoGasto]);

	const fetchEstadisticasConductores = async () => {
		setLoading(true);
		try {
			const query = construirQueryFechas();
			const response = await authenticatedFetch(
				`/api/estadisticas/conductores${query}`,
				{
					method: "GET",
				}
			);
			if (response.ok) {
				const data = await response.json();
				setEstadisticasConductores(data.estadisticas || []);
			}
		} catch (error) {
			console.error("Error al cargar estadísticas de conductores:", error);
		} finally {
			setLoading(false);
		}
	};

	const fetchEstadisticasVehiculos = async () => {
		setLoading(true);
		try {
			const query = construirQueryFechas();
			const response = await authenticatedFetch(
				`/api/estadisticas/vehiculos${query}`,
				{
					method: "GET",
				}
			);
			if (response.ok) {
				const data = await response.json();
				setEstadisticasVehiculos(data.estadisticas || []);
			}
		} catch (error) {
			console.error("Error al cargar estadísticas de vehículos:", error);
		} finally {
			setLoading(false);
		}
	};

	const fetchEstadisticasGastos = async () => {
		setLoading(true);
		try {
			const parametros = tipoGasto !== "todos" ? { tipo: tipoGasto } : {};
			const query = construirQueryFechas(parametros);
			const response = await authenticatedFetch(
				`/api/estadisticas/gastos${query}`,
				{
					method: "GET",
				}
			);
			if (response.ok) {
				const data = await response.json();
				setEstadisticasGastos({
					totalGeneral: parseFloat(data.totalGeneral || 0),
					totalRegistros: data.totalRegistros || 0,
					totalesPorTipo: data.totalesPorTipo || {},
					resumenPorFecha: Array.isArray(data.resumenPorFecha)
						? data.resumenPorFecha
						: [],
				});
			}
		} catch (error) {
			console.error("Error al cargar resumen de gastos:", error);
		} finally {
			setLoading(false);
		}
	};


	const fetchDetalleConductor = async (conductorId) => {
		setLoading(true);
		try {
			const query = construirQueryFechas();
			const response = await authenticatedFetch(
				`/api/estadisticas/conductores/${conductorId}${query}`,
				{
					method: "GET",
				}
			);
			if (response.ok) {
				const data = await response.json();
				setConductorDetalle(data);
				setShowDetalleDialog(true);
			}
		} catch (error) {
			console.error("Error al cargar detalle del conductor:", error);
		} finally {
			setLoading(false);
		}
	};

	const fetchReservasEstadisticas = async () => {
		setLoadingReservas(true);
		try {
			const params = new URLSearchParams();
			if (rangoAplicado.fechaInicio) {
				params.append("fecha_desde", rangoAplicado.fechaInicio.toISOString());
			}
			if (rangoAplicado.fechaFin) {
				params.append("fecha_hasta", rangoAplicado.fechaFin.toISOString());
			}
			params.append("incluir_cerradas", "true");
			params.append("limit", "100");

			const response = await authenticatedFetch(
				`/api/reservas?${params.toString()}`,
				{ method: "GET" }
			);

			if (response.ok) {
				const data = await response.json();
				setReservasFiltradas(data.reservas || []);
			}
		} catch (error) {
			console.error("Error al cargar reservas:", error);
		} finally {
			setLoadingReservas(false);
		}
	};

	const handleCompletarReserva = async (reserva) => {
		if (!window.confirm(`¿Marcar reserva ${reserva.codigoReserva} como completada e ir a registrar gastos?`)) {
			return;
		}
		try {
			const response = await authenticatedFetch(`/api/reservas/${reserva.id}/estado`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ estado: "completada" }),
			});

			if (response.ok) {
				// Redirigir a panel de gastos
				window.location.href = "/admin?panel=gastos";
			} else {
				alert("Error al completar la reserva");
			}
		} catch (error) {
			console.error("Error completando reserva:", error);
			alert("Error de conexión");
		}
	};

	const handleArchivarReserva = async (reserva) => {
		if (!window.confirm(`¿${reserva.archivada ? "Desarchivar" : "Archivar"} reserva ${reserva.codigoReserva}?`)) {
			return;
		}
		try {
			const response = await authenticatedFetch(`/api/reservas/${reserva.id}/archivar`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ archivada: !reserva.archivada }),
			});

			if (response.ok) {
				fetchReservasEstadisticas();
			} else {
				alert("Error al cambiar estado de archivo");
			}
		} catch (error) {
			console.error("Error archivando:", error);
		}
	};

	useEffect(() => {
		if (vistaActual === "reservas") {
			fetchReservasEstadisticas();
		}
	}, [vistaActual, rangoAplicado]);

	const calcularTotales = (estadisticas) => {
		return estadisticas.reduce(
			(acc, item) => ({
				totalReservas: acc.totalReservas + item.totalReservas,
				totalIngresos: acc.totalIngresos + item.totalIngresos,
				totalGastos: acc.totalGastos + item.totalGastos,
				utilidad: acc.utilidad + item.utilidad,
			}),
			{ totalReservas: 0, totalIngresos: 0, totalGastos: 0, utilidad: 0 }
		);
	};

	const totalesConductores = calcularTotales(estadisticasConductores);
	const totalesVehiculos = calcularTotales(estadisticasVehiculos);

	return (
		<div className="space-y-6">
					<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
			<div className="flex flex-wrap items-center gap-3">
				<h2 className="text-2xl font-bold">Estadísticas</h2>
				<Badge variant="outline">{rangoAplicado.etiqueta}</Badge>
			</div>
			<div className="flex flex-wrap items-center gap-3">
				<Select value={vistaActual} onValueChange={setVistaActual}>
					<SelectTrigger className="w-[200px]">
						<SelectValue placeholder="Selecciona vista" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="conductores">
							<div className="flex items-center gap-2">
								<User className="w-4 h-4" />
								<span>Conductores</span>
							</div>
						</SelectItem>
						<SelectItem value="reservas">
							<div className="flex items-center gap-2">
								<Receipt className="w-4 h-4" />
								<span>Reservas</span>
							</div>
						</SelectItem>
						<SelectItem value="vehiculos">
							<div className="flex items-center gap-2">
								<Car className="w-4 h-4" />
								<span>Vehículos</span>
							</div>
						</SelectItem>
						<SelectItem value="gastos">
							<div className="flex items-center gap-2">
								<Receipt className="w-4 h-4" />
								<span>Gastos</span>
							</div>
						</SelectItem>
					</SelectContent>
				</Select>
				<Select value={filtroFechas} onValueChange={manejarCambioFiltroFechas}>
					<SelectTrigger className="w-[220px]">
						<SelectValue placeholder="Selecciona rango" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="ultimos-15">Últimos 15 días</SelectItem>
						<SelectItem value="ultimos-30">Últimos 30 días</SelectItem>
						<SelectItem value="mes-actual">Este mes</SelectItem>
						<SelectItem value="mes-pasado">Mes pasado</SelectItem>
						<SelectItem value="todos">Todo el historial</SelectItem>
						<SelectItem value="personalizado">Personalizado</SelectItem>
					</SelectContent>
				</Select>
				{vistaActual === "gastos" && (
					<Select value={tipoGasto} onValueChange={setTipoGasto}>
						<SelectTrigger className="w-[240px]">
							<SelectValue placeholder="Selecciona tipo de gasto" />
						</SelectTrigger>
						<SelectContent>
							{TIPOS_GASTO.map((tipo) => (
								<SelectItem key={tipo.value} value={tipo.value}>
									{tipo.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				)}
			</div>
		</div>

{filtroFechas === "personalizado" && (
			<div className="flex flex-col gap-2">
				<div className="flex flex-wrap items-end gap-3">
					<div className="flex flex-col gap-1">
						<label className="text-sm font-medium text-muted-foreground">
							Desde
						</label>
						<Input
							type="date"
							value={rangoPersonalizado.desde}
							onChange={(event) =>
								actualizarFechaPersonalizada("desde", event.target.value)
							}
							max={rangoPersonalizado.hasta || undefined}
						/>
					</div>
					<div className="flex flex-col gap-1">
						<label className="text-sm font-medium text-muted-foreground">
							Hasta
						</label>
						<Input
							type="date"
							value={rangoPersonalizado.hasta}
							onChange={(event) =>
								actualizarFechaPersonalizada("hasta", event.target.value)
							}
							min={rangoPersonalizado.desde || undefined}
						/>
					</div>
					<Button onClick={aplicarRangoPersonalizado}>
						Aplicar rango
					</Button>
				</div>
				{errorRango && (
					<p className="text-sm text-red-600">{errorRango}</p>
				)}
			</div>
		)}

		{vistaActual === "gastos" && (
			<>
				<div className="grid gap-4 md:grid-cols-3">
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium text-muted-foreground">
								Total del periodo
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="flex items-center gap-2">
								<DollarSign className="w-5 h-5 text-green-600" />
								<span className="text-2xl font-bold text-green-600">
									{loading
										? "..."
										: formatearMonto(estadisticasGastos.totalGeneral)}
								</span>
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium text-muted-foreground">
								Registros contabilizados
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="flex items-center gap-2">
								<Receipt className="w-5 h-5 text-chocolate-600" />
								<span className="text-2xl font-bold">
									{loading ? "..." : estadisticasGastos.totalRegistros}
								</span>
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium text-muted-foreground">
								Totales por tipo
							</CardTitle>
						</CardHeader>
						<CardContent>
							{Object.keys(estadisticasGastos.totalesPorTipo || {}).length === 0 ? (
								<p className="text-sm text-muted-foreground">
									Sin datos en el periodo.
								</p>
							) : (
								<div className="flex flex-wrap gap-2">
									{Object.entries(estadisticasGastos.totalesPorTipo || {})
										.sort(([, montoA], [, montoB]) => Number(montoB) - Number(montoA))
										.map(([tipoClave, montoTipo]) => (
											<Badge key={tipoClave} variant="secondary">
												{obtenerEtiquetaTipo(tipoClave)}:{" "}
												{formatearMonto(montoTipo)}
											</Badge>
										))}
								</div>
							)}
						</CardContent>
					</Card>
				</div>
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<CardTitle>Total por fecha</CardTitle>
							<Badge variant="outline">{obtenerEtiquetaTipo(tipoGasto)}</Badge>
						</div>
					</CardHeader>
					<CardContent>
						{loading ? (
							<p className="text-sm text-muted-foreground">
								Cargando resumen de gastos...
							</p>
						) : estadisticasGastos.resumenPorFecha.length === 0 ? (
							<p className="text-sm text-muted-foreground">
								No se registran gastos en el periodo seleccionado.
							</p>
						) : (
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Fecha</TableHead>
										<TableHead>Registros</TableHead>
										<TableHead>Total</TableHead>
										<TableHead>Detalle por tipo</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{estadisticasGastos.resumenPorFecha.map((item) => (
										<TableRow key={item.fecha}>
											<TableCell className="font-medium">
												{formatearFecha(item.fecha)}
											</TableCell>
											<TableCell>{item.registros || 0}</TableCell>
											<TableCell className="font-semibold">
												{formatearMonto(item.total)}
											</TableCell>
											<TableCell>
												<div className="flex flex-wrap gap-2">
													{Object.entries(item.porTipo || {}).map(
														([tipoClave, montoTipo]) => (
															<Badge
																key={`${item.fecha}-${tipoClave}`}
																variant="outline"
															>
																{obtenerEtiquetaTipo(tipoClave)}:{" "}
																{formatearMonto(montoTipo)}
															</Badge>
														)
													)}
												</div>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						)}
					</CardContent>
				</Card>
			</>
		)}

		{vistaActual === "conductores" && (
			<>
					<div className="grid grid-cols-4 gap-4">
						<Card>
							<CardHeader className="pb-2">
								<CardTitle className="text-sm font-medium text-muted-foreground">
									Total Reservas
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="flex items-center gap-2">
									<CalendarIcon className="w-5 h-5 text-chocolate-600" />
									<span className="text-2xl font-bold">
										{totalesConductores.totalReservas}
									</span>
								</div>
							</CardContent>
						</Card>
						<Card>
							<CardHeader className="pb-2">
								<CardTitle className="text-sm font-medium text-muted-foreground">
									Total Ingresos
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="flex items-center gap-2">
									<TrendingUp className="w-5 h-5 text-green-600" />
									<span className="text-2xl font-bold text-green-600">
										${totalesConductores.totalIngresos.toLocaleString("es-CL")}
									</span>
								</div>
							</CardContent>
						</Card>
						<Card>
							<CardHeader className="pb-2">
								<CardTitle className="text-sm font-medium text-muted-foreground">
									Total Gastos
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="flex items-center gap-2">
									<TrendingDown className="w-5 h-5 text-red-600" />
									<span className="text-2xl font-bold text-red-600">
										${totalesConductores.totalGastos.toLocaleString("es-CL")}
									</span>
								</div>
							</CardContent>
						</Card>
						<Card>
							<CardHeader className="pb-2">
								<CardTitle className="text-sm font-medium text-muted-foreground">
									Utilidad Total
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="flex items-center gap-2">
									<DollarSign className="w-5 h-5 text-chocolate-600" />
									<span className="text-2xl font-bold text-chocolate-600">
										${totalesConductores.utilidad.toLocaleString("es-CL")}
									</span>
								</div>
							</CardContent>
						</Card>
					</div>

					<Card>
						<CardHeader>
							<CardTitle>Estadísticas por Conductor</CardTitle>
						</CardHeader>
						<CardContent>
							{loading ? (
								<p>Cargando estadísticas...</p>
							) : estadisticasConductores.length === 0 ? (
								<p className="text-muted-foreground text-center py-8">
									No hay datos disponibles
								</p>
							) : (
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Conductor</TableHead>
											<TableHead>RUT</TableHead>
											<TableHead>Reservas</TableHead>
											<TableHead>Completadas</TableHead>
											<TableHead>Ingresos</TableHead>
											<TableHead>Gastos</TableHead>
											<TableHead>Pagos Recibidos</TableHead>
											<TableHead>Utilidad</TableHead>
											<TableHead>Acciones</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{estadisticasConductores.map((conductor) => (
											<TableRow key={conductor.id}>
												<TableCell className="font-medium">
													{conductor.nombre}
												</TableCell>
												<TableCell>{conductor.rut}</TableCell>
												<TableCell>{conductor.totalReservas}</TableCell>
												<TableCell>{conductor.reservasCompletadas}</TableCell>
												<TableCell className="text-green-600 font-semibold">
													${conductor.totalIngresos.toLocaleString("es-CL")}
												</TableCell>
												<TableCell className="text-red-600 font-semibold">
													${conductor.totalGastos.toLocaleString("es-CL")}
												</TableCell>
												<TableCell className="text-chocolate-600 font-semibold">
													${conductor.pagosConductor.toLocaleString("es-CL")}
												</TableCell>
												<TableCell>
													<Badge
														variant={
															conductor.utilidad >= 0 ? "default" : "destructive"
														}
													>
														${conductor.utilidad.toLocaleString("es-CL")}
													</Badge>
												</TableCell>
												<TableCell>
													<Button
														variant="ghost"
														size="sm"
														onClick={() => fetchDetalleConductor(conductor.id)}
													>
														<Eye className="w-4 h-4 mr-2" />
														Ver Detalle
													</Button>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							)}
						</CardContent>
					</Card>
				</>
			)}

			{vistaActual === "vehiculos" && (
				<>
					<div className="grid grid-cols-4 gap-4">
						<Card>
							<CardHeader className="pb-2">
								<CardTitle className="text-sm font-medium text-muted-foreground">
									Total Reservas
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="flex items-center gap-2">
									<CalendarIcon className="w-5 h-5 text-chocolate-600" />
									<span className="text-2xl font-bold">
										{totalesVehiculos.totalReservas}
									</span>
								</div>
							</CardContent>
						</Card>
						<Card>
							<CardHeader className="pb-2">
								<CardTitle className="text-sm font-medium text-muted-foreground">
									Total Ingresos
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="flex items-center gap-2">
									<TrendingUp className="w-5 h-5 text-green-600" />
									<span className="text-2xl font-bold text-green-600">
										${totalesVehiculos.totalIngresos.toLocaleString("es-CL")}
									</span>
								</div>
							</CardContent>
						</Card>
						<Card>
							<CardHeader className="pb-2">
								<CardTitle className="text-sm font-medium text-muted-foreground">
									Total Gastos
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="flex items-center gap-2">
									<TrendingDown className="w-5 h-5 text-red-600" />
									<span className="text-2xl font-bold text-red-600">
										${totalesVehiculos.totalGastos.toLocaleString("es-CL")}
									</span>
								</div>
							</CardContent>
						</Card>
						<Card>
							<CardHeader className="pb-2">
								<CardTitle className="text-sm font-medium text-muted-foreground">
									Utilidad Total
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="flex items-center gap-2">
									<DollarSign className="w-5 h-5 text-chocolate-600" />
									<span className="text-2xl font-bold text-chocolate-600">
										${totalesVehiculos.utilidad.toLocaleString("es-CL")}
									</span>
								</div>
							</CardContent>
						</Card>
					</div>

					<Card>
						<CardHeader>
							<CardTitle>Estadísticas por Vehículo</CardTitle>
						</CardHeader>
						<CardContent>
							{loading ? (
								<p>Cargando estadísticas...</p>
							) : estadisticasVehiculos.length === 0 ? (
								<p className="text-muted-foreground text-center py-8">
									No hay datos disponibles
								</p>
							) : (
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Patente</TableHead>
											<TableHead>Marca/Modelo</TableHead>
											<TableHead>Tipo</TableHead>
											<TableHead>Reservas</TableHead>
											<TableHead>Completadas</TableHead>
											<TableHead>Ingresos</TableHead>
											<TableHead>Gastos</TableHead>
											<TableHead>Combustible</TableHead>
											<TableHead>Mantenimiento</TableHead>
											<TableHead>Utilidad</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{estadisticasVehiculos.map((vehiculo) => (
											<TableRow key={vehiculo.id}>
												<TableCell className="font-medium">
													{vehiculo.patente}
												</TableCell>
												<TableCell>
													{vehiculo.marca} {vehiculo.modelo}
												</TableCell>
												<TableCell>
													<Badge variant="outline">{vehiculo.tipo}</Badge>
												</TableCell>
												<TableCell>{vehiculo.totalReservas}</TableCell>
												<TableCell>{vehiculo.reservasCompletadas}</TableCell>
												<TableCell className="text-green-600 font-semibold">
													${vehiculo.totalIngresos.toLocaleString("es-CL")}
												</TableCell>
												<TableCell className="text-red-600 font-semibold">
													${vehiculo.totalGastos.toLocaleString("es-CL")}
												</TableCell>
												<TableCell className="text-orange-600">
													${vehiculo.gastoCombustible.toLocaleString("es-CL")}
												</TableCell>
												<TableCell className="text-purple-600">
													${vehiculo.gastoMantenimiento.toLocaleString("es-CL")}
												</TableCell>
												<TableCell>
													<Badge
														variant={
															vehiculo.utilidad >= 0 ? "default" : "destructive"
														}
													>
														${vehiculo.utilidad.toLocaleString("es-CL")}
													</Badge>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							)}
						</CardContent>
					</Card>
				</>
			)}

			{vistaActual === "reservas" && (
				<Card>
					<CardHeader>
						<CardTitle>Listado de Reservas ({reservasFiltradas.length})</CardTitle>
					</CardHeader>
					<CardContent>
						{loadingReservas ? (
							<div className="flex justify-center p-8">
								<p>Cargando reservas...</p>
							</div>
						) : reservasFiltradas.length === 0 ? (
							<div className="text-center p-8 text-muted-foreground">
								No hay reservas en este periodo
							</div>
						) : (
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Fecha</TableHead>
										<TableHead>Código</TableHead>
										<TableHead>Cliente</TableHead>
										<TableHead>Estado</TableHead>
										<TableHead>Pagado</TableHead>
										<TableHead>Acciones</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{reservasFiltradas.map((reserva) => {
										// Lógica para determinar si faltan gastos
										// Asumimos que "faltan gastos" si es completada y totalGastos es 0
										// (Esto requiere que el endpoint devuelve gastos, verifiquemos si lo hace.
										// Si no, esta columna será informativa básica).
										// El endpoint GET /api/reservas NO parece devolver 'gastos' agregados.
										// Por ahora mostramos alerta básica si es completada.
										const esCompletada = reserva.estado === "completada";
										
										return (
											<TableRow key={reserva.id}>
												<TableCell>{formatearFecha(reserva.fecha)}</TableCell>
												<TableCell className="font-mono">{reserva.codigoReserva}</TableCell>
												<TableCell>{reserva.cliente?.nombre || reserva.nombre}</TableCell>
												<TableCell>{getEstadoBadge(reserva.estado)}</TableCell>
												<TableCell>{getEstadoPagoBadge(reserva)}</TableCell>
												<TableCell>
													<div className="flex items-center gap-2">
														<Button
															variant="ghost"
															size="sm"
															onClick={() => handleViewReservaDetail(reserva)}
														>
															<Eye className="w-4 h-4" />
														</Button>

														{reserva.estado === "confirmada" && (
															<Button
																variant="default"
																size="sm"
																className="bg-green-600 hover:bg-green-700 h-8 text-xs"
																onClick={() => handleCompletarReserva(reserva)}
															>
																Completar y Gastos
																<ArrowRight className="w-3 h-3 ml-1" />
															</Button>
														)}

														{(reserva.estado === "cancelada" || reserva.estado === "pendiente") && (
															<Button
																variant="outline"
																size="sm"
																className="text-red-600 border-red-200 hover:bg-red-50 h-8 text-xs"
																onClick={() => handleArchivarReserva(reserva)}
															>
																<Archive className="w-3 h-3 mr-1" />
																{reserva.archivada ? "Desarchivar" : "Archivar"}
															</Button>
														)}
														
														{esCompletada && (
															<div className="flex items-center text-xs text-orange-600 font-medium ml-2">
																<AlertCircle className="w-3 h-3 mr-1" />
																Revisar gastos
															</div>
														)}
													</div>
												</TableCell>
											</TableRow>
										);
									})}
								</TableBody>
							</Table>
						)}
					</CardContent>
				</Card>
			)}

			<Dialog open={showDetalleDialog} onOpenChange={setShowDetalleDialog}>
				<DialogContent className="sm:max-w-[95vw] h-[90vh] flex flex-col p-0 gap-0">
					<DialogHeader className="p-6 pb-2 shrink-0">
						<DialogTitle>
							Detalle del Conductor: {conductorDetalle?.conductor?.nombre}
						</DialogTitle>
					</DialogHeader>
					{conductorDetalle && (
						<div className="flex-1 overflow-y-auto p-6 pt-2 space-y-6">
							{/* Top Stats */}
							<div className="grid grid-cols-4 gap-4">
								<Card>
									<CardHeader className="pb-2">
										<CardTitle className="text-sm">Total Reservas</CardTitle>
									</CardHeader>
									<CardContent>
										<p className="text-2xl font-bold">
											{conductorDetalle.totalReservas}
										</p>
									</CardContent>
								</Card>
								<Card>
									<CardHeader className="pb-2">
										<CardTitle className="text-sm">Total Ingresos</CardTitle>
									</CardHeader>
									<CardContent>
										<p className="text-2xl font-bold text-green-600">
											${conductorDetalle.totalIngresos.toLocaleString("es-CL")}
										</p>
									</CardContent>
								</Card>
								<Card>
									<CardHeader className="pb-2">
										<CardTitle className="text-sm">Total Gastos</CardTitle>
									</CardHeader>
									<CardContent>
										<p className="text-2xl font-bold text-red-600">
											${conductorDetalle.totalGastos.toLocaleString("es-CL")}
										</p>
									</CardContent>
								</Card>
								<Card>
									<CardHeader className="pb-2">
										<CardTitle className="text-sm">Utilidad</CardTitle>
									</CardHeader>
									<CardContent>
										<p className="text-2xl font-bold text-chocolate-600">
											$
											{(
												conductorDetalle.totalIngresos -
												conductorDetalle.totalGastos
											).toLocaleString("es-CL")}
										</p>
									</CardContent>
								</Card>
							</div>

							<div className="grid grid-cols-12 gap-6">
								{/* Left Column: Expenses breakdown and Vehicles */}
								<div className="col-span-4 space-y-6">
									<Card className="h-fit">
										<CardHeader>
											<CardTitle>Gastos por Tipo</CardTitle>
										</CardHeader>
										<CardContent>
											<div className="space-y-3">
												{Object.entries(conductorDetalle.gastosPorTipo || {}).map(
													([tipo, datos]) => (
														<div
															key={tipo}
															className="p-3 border rounded-lg flex justify-between items-center"
														>
															<div>
																<p className="text-sm text-muted-foreground capitalize">
																	{tipo.replace("_", " ")}
																</p>
																<p className="text-base font-semibold">
																	${datos.total.toLocaleString("es-CL")}
																</p>
															</div>
															<Badge variant="secondary">{datos.cantidad}</Badge>
														</div>
													)
												)}
											</div>
										</CardContent>
									</Card>

									<Card className="h-fit">
										<CardHeader>
											<CardTitle>Vehículos Asociados</CardTitle>
										</CardHeader>
										<CardContent>
											<div className="space-y-3">
												{conductorDetalle.vehiculosAsociados?.map((vehiculo) => (
													<div
														key={vehiculo.id}
														className="p-3 border rounded-lg flex items-center gap-3"
													>
														<Car className="w-6 h-6 text-chocolate-600" />
														<div>
															<p className="font-semibold text-sm">{vehiculo.patente}</p>
															<p className="text-xs text-muted-foreground">
																{vehiculo.marca} {vehiculo.modelo}
															</p>
														</div>
													</div>
												))}
											</div>
										</CardContent>
									</Card>
								</div>

								{/* Right Column: Histories */}
								<div className="col-span-8 space-y-6">
									<Card className="flex flex-col h-[400px]">
										<CardHeader className="pb-2">
											<CardTitle>Historial de Reservas</CardTitle>
										</CardHeader>
										<CardContent className="flex-1 overflow-hidden p-0">
											<div className="h-full overflow-y-auto p-6 pt-0">
												<Table>
													<TableHeader className="sticky top-0 bg-background z-10">
														<TableRow>
															<TableHead>Código</TableHead>
															<TableHead>Fecha</TableHead>
															<TableHead>Ruta</TableHead>
															<TableHead>Estado</TableHead>
															<TableHead>Total</TableHead>
															<TableHead>Vehículo</TableHead>
														</TableRow>
													</TableHeader>
													<TableBody>
														{conductorDetalle.reservas?.map((reserva) => (
															<TableRow 
																key={reserva.id} 
																className="cursor-pointer hover:bg-muted/50 transition-colors"
																onClick={() => handleViewReservaDetail(reserva)}
															>
																<TableCell className="font-medium">
																	{reserva.codigoReserva}
																</TableCell>
																<TableCell>
																	{new Date(reserva.fecha).toLocaleDateString("es-CL")}
																</TableCell>
																<TableCell className="max-w-[200px] truncate" title={`${reserva.origen} → ${reserva.destino}`}>
																	{reserva.origen} → {reserva.destino}
																</TableCell>
																<TableCell>
																	<Badge variant="outline" className="text-xs">{reserva.estado}</Badge>
																</TableCell>
																<TableCell className="font-semibold">
																	$
																	{parseFloat(
																		reserva.totalConDescuento
																	).toLocaleString("es-CL")}
																</TableCell>
																<TableCell className="text-xs">
																	{reserva.vehiculo
																		? `${reserva.vehiculo.patente}`
																		: "-"}
																</TableCell>
															</TableRow>
														))}
													</TableBody>
												</Table>
											</div>
										</CardContent>
									</Card>

									<Card className="flex flex-col h-[300px]">
										<CardHeader className="pb-2">
											<CardTitle>Historial de Gastos</CardTitle>
										</CardHeader>
										<CardContent className="flex-1 overflow-hidden p-0">
											<div className="h-full overflow-y-auto p-6 pt-0">
												<Table>
													<TableHeader className="sticky top-0 bg-background z-10">
														<TableRow>
															<TableHead>Fecha</TableHead>
															<TableHead>Tipo</TableHead>
															<TableHead>Monto</TableHead>
															<TableHead>Reserva</TableHead>
															<TableHead>Descripción</TableHead>
														</TableRow>
													</TableHeader>
													<TableBody>
														{conductorDetalle.gastos?.map((gasto) => (
															<TableRow key={gasto.id}>
																<TableCell>
																	{new Date(gasto.fecha).toLocaleDateString("es-CL")}
																</TableCell>
																<TableCell>
																	<Badge variant="outline" className="text-xs">
																		{gasto.tipoGasto.replace("_", " ")}
																	</Badge>
																</TableCell>
																<TableCell className="font-semibold">
																	${parseFloat(gasto.monto).toLocaleString("es-CL")}
																</TableCell>
																<TableCell>
																	{gasto.reserva?.codigoReserva || "-"}
																</TableCell>
																<TableCell className="max-w-xs truncate text-xs" title={gasto.descripcion}>
																	{gasto.descripcion || "-"}
																</TableCell>
															</TableRow>
														))}
													</TableBody>
												</Table>
											</div>
										</CardContent>
									</Card>
								</div>
							</div>
						</div>
					)}
				</DialogContent>
			</Dialog>

			{/* Modal de Detalle de Reserva (Nivel 2) */}
			<Dialog open={showReservaDetailDialog} onOpenChange={setShowReservaDetailDialog}>
				<DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto z-[60]">
					<DialogHeader>
						<DialogTitle>Detalles de Reserva #{selectedReservaDetail?.id}</DialogTitle>
						<DialogDescription>
							Información completa del viaje y cliente
						</DialogDescription>
					</DialogHeader>

					{selectedReservaDetail && (
						<div className="space-y-6">
							{/* Encabezado con Código */}
							<div className="flex justify-between items-start bg-muted p-4 rounded-lg">
								<div>
									<Label className="text-muted-foreground text-xs uppercase tracking-wider">Código de Reserva</Label>
									<p className="text-2xl font-bold tracking-tight">{selectedReservaDetail.codigoReserva || "Sin código"}</p>
								</div>
								<div className="flex flex-col items-end gap-2">
									{getEstadoBadge(selectedReservaDetail.estado)}
									{getEstadoPagoBadge(selectedReservaDetail)}
									<Button 
										size="sm" 
										variant="outline"
										onClick={() => {
											// Si AdminReservas tuviera una forma de abrirse con ID, podríamos redirigir
											// Por ahora, solo notificaremos que se debe implementar la edición completa o 
											// redirigir a la vista de reservas.
											alert("Funcionalidad de edición rápida en construcción. Por favor ir a Reservas para editar.");
										}}
									>
										<Eye className="w-4 h-4 mr-2" />
										Editar
									</Button>
								</div>
							</div>

							<div className="grid md:grid-cols-2 gap-6">
								{/* Información del Cliente */}
								<div className="space-y-3">
									<h4 className="font-semibold flex items-center gap-2">
										<Users className="w-4 h-4" /> Cliente
									</h4>
									<div className="grid gap-2 text-sm border p-3 rounded-md">
										<div>
											<span className="text-muted-foreground mr-2">Nombre:</span>
											<span className="font-medium">{selectedReservaDetail.nombre}</span>
										</div>
										<div>
											<span className="text-muted-foreground mr-2">Email:</span>
											<span>{selectedReservaDetail.email}</span>
										</div>
										<div>
											<span className="text-muted-foreground mr-2">Teléfono:</span>
											<span>{selectedReservaDetail.telefono}</span>
										</div>
									</div>
								</div>

								{/* Detalles del Viaje */}
								<div className="space-y-3">
									<div className="flex items-center justify-between">
										<h4 className="font-semibold flex items-center gap-2">
											<MapPin className="w-4 h-4" /> Detalles del Viaje
										</h4>
										{selectedReservaDetail.idaVuelta ? (
											<Badge className="bg-blue-600 hover:bg-blue-700 text-white text-xs">
												🔄 Ida y Vuelta
											</Badge>
										) : (
											<Badge className="bg-green-600 hover:bg-green-700 text-white text-xs">
												➡️ Solo Ida
											</Badge>
										)}
									</div>

									{/* Tarjeta de VIAJE DE IDA */}
									<div className="border-2 border-blue-300 bg-blue-50 rounded-lg p-3">
										<h5 className="font-semibold text-blue-900 text-sm mb-2 flex items-center gap-2">
											🚗 VIAJE DE IDA
										</h5>
										<div className="grid gap-2 text-sm">
											<div className="grid grid-cols-[auto_1fr] gap-2">
												<Badge variant="outline" className="w-fit">Origen</Badge>
												<span>{selectedReservaDetail.origen}</span>
											</div>
											<div className="grid grid-cols-[auto_1fr] gap-2">
												<Badge variant="outline" className="w-fit">Destino</Badge>
												<span>{selectedReservaDetail.destino}</span>
											</div>
											<div className="grid grid-cols-[auto_1fr] gap-2">
												<Badge variant="outline" className="w-fit">Fecha</Badge>
												<span>{formatearFecha(selectedReservaDetail.fecha)}</span>
											</div>
											<div className="grid grid-cols-[auto_1fr] gap-2">
												<Badge variant="outline" className="w-fit">Hora</Badge>
												<span>{selectedReservaDetail.hora}</span>
											</div>
											<div className="grid grid-cols-[auto_1fr] gap-2">
												<Badge variant="outline" className="w-fit">Pasajeros</Badge>
												<span>{selectedReservaDetail.pasajeros}</span>
											</div>
										</div>
									</div>

									{/* Tarjeta de VIAJE DE VUELTA */}
									{selectedReservaDetail.idaVuelta && (
										<div className="border-2 border-green-300 bg-green-50 rounded-lg p-3">
											<h5 className="font-semibold text-green-900 text-sm mb-2 flex items-center gap-2">
												🚗 VIAJE DE VUELTA
											</h5>
											<div className="grid gap-2 text-sm">
												<div className="grid grid-cols-[auto_1fr] gap-2">
													<Badge variant="outline" className="w-fit">Origen</Badge>
													<span>{selectedReservaDetail.destino}</span>
												</div>
												<div className="grid grid-cols-[auto_1fr] gap-2">
													<Badge variant="outline" className="w-fit">Destino</Badge>
													<span>{selectedReservaDetail.origen}</span>
												</div>
												<div className="grid grid-cols-[auto_1fr] gap-2">
													<Badge variant="outline" className="w-fit">Fecha Regreso</Badge>
													<span>{selectedReservaDetail.fechaRegreso ? formatearFecha(selectedReservaDetail.fechaRegreso) : "-"}</span>
												</div>
												<div className="grid grid-cols-[auto_1fr] gap-2">
													<Badge variant="outline" className="w-fit">Hora Regreso</Badge>
													<span>{selectedReservaDetail.horaRegreso ? selectedReservaDetail.horaRegreso : "-"}</span>
												</div>
												<div className="grid grid-cols-[auto_1fr] gap-2">
													<Badge variant="outline" className="w-fit">Pasajeros</Badge>
													<span>{selectedReservaDetail.pasajeros}</span>
												</div>
											</div>
										</div>
									)}

									{/* Alerta de información faltante */}
									{selectedReservaDetail.idaVuelta && (!selectedReservaDetail.fechaRegreso || !selectedReservaDetail.horaRegreso) && (
										<div className="bg-yellow-50 border-l-4 border-yellow-400 p-3">
											<div className="flex items-start gap-2">
												<AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
												<div>
													<p className="font-semibold text-yellow-800 text-sm">
														⚠️ Información Incompleta del Viaje de Vuelta
													</p>
													<p className="text-xs text-yellow-700 mt-1">
														Esta reserva está marcada como "Ida y Vuelta" pero falta:
														{!selectedReservaDetail.fechaRegreso && " Fecha de Regreso"}
														{!selectedReservaDetail.fechaRegreso && !selectedReservaDetail.horaRegreso && " y"}
														{!selectedReservaDetail.horaRegreso && " Hora de Regreso"}
													</p>
												</div>
											</div>
										</div>
									)}
								</div>
							</div>

							<div className="grid md:grid-cols-2 gap-6">
								{/* Fecha y Hora */}
								<div className="space-y-3">
									<h4 className="font-semibold flex items-center gap-2">
										<Calendar className="w-4 h-4" /> Fecha y Hora
									</h4>
									<div className="grid gap-2 text-sm border p-3 rounded-md">
										<div className="flex justify-between">
											<span className="text-muted-foreground">Fecha:</span>
											<span className="font-medium">{formatearFecha(selectedReservaDetail.fecha)}</span>
										</div>
										<div className="flex justify-between">
											<span className="text-muted-foreground">Hora:</span>
											<span className="font-medium">{selectedReservaDetail.hora}</span>
										</div>
										<div className="flex justify-between">
											<span className="text-muted-foreground">Pasajeros:</span>
											<span>{selectedReservaDetail.pasajeros}</span>
										</div>
									</div>
								</div>

								{/* Finanzas */}
								<div className="space-y-3">
									<h4 className="font-semibold flex items-center gap-2">
										<DollarSign className="w-4 h-4" /> Finanzas
									</h4>
									<div className="grid gap-2 text-sm border p-3 rounded-md">
										<div className="flex justify-between">
											<span className="text-muted-foreground">Total:</span>
											<span className="font-bold">{formatearMonto(selectedReservaDetail.totalConDescuento)}</span>
										</div>
										<div className="flex justify-between text-muted-foreground">
											<span>Abono Sugerido:</span>
											<span>{formatearMonto(selectedReservaDetail.abonoSugerido)}</span>
										</div>
										<div className="flex justify-between border-t pt-2 mt-1">
											<span className="font-semibold">Saldo Pendiente:</span>
											<span className={`${selectedReservaDetail.saldoPendiente > 0 ? "text-red-600" : "text-green-600"} font-bold`}>
												{formatearMonto(selectedReservaDetail.saldoPendiente)}
											</span>
										</div>
									</div>
								</div>
							</div>
							
							{/* Información Adicional */}
							{(selectedReservaDetail.observaciones || selectedReservaDetail.mensaje) && (
								<div className="space-y-2">
									<Label className="text-muted-foreground">Notas / Observaciones</Label>
									<div className="bg-muted/50 p-3 rounded-md text-sm italic">
										{selectedReservaDetail.observaciones || selectedReservaDetail.mensaje}
									</div>
								</div>
							)}
						</div>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}

export default AdminEstadisticas;
