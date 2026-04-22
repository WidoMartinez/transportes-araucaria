import { useCallback, useEffect, useMemo, useState } from "react";
import {
	RefreshCw,
	Plane,
	Hotel,
	CircleDollarSign,
	Users,
	Plus,
	Pencil,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "../ui/dialog";
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
import { Switch } from "../ui/switch";
import { useAuthenticatedFetch } from "../../hooks/useAuthenticatedFetch";

const ESTADOS = ["pendiente", "confirmada", "completada", "cancelada"];

const CLASES_ESTADO = {
	pendiente: "bg-amber-100 text-amber-800 border-amber-300",
	confirmada: "bg-blue-100 text-blue-800 border-blue-300",
	completada: "bg-emerald-100 text-emerald-800 border-emerald-300",
	cancelada: "bg-rose-100 text-rose-800 border-rose-300",
};

const HOTEL_INICIAL = {
	nombre: "",
	comuna: "",
	codigo: "",
	tarifaSoloIda: "",
	tarifaIdaVuelta: "",
	orden: "0",
	activo: true,
};

const formatearCLP = (monto) =>
	new Intl.NumberFormat("es-CL", {
		style: "currency",
		currency: "CLP",
		maximumFractionDigits: 0,
	}).format(Number(monto || 0));

const formatearFecha = (fecha) => {
	if (!fecha) return "—";
	const date = new Date(`${fecha}T00:00:00`);
	if (Number.isNaN(date.getTime())) return "—";
	return date.toLocaleDateString("es-CL");
};

function TarjetaResumen({ titulo, valor, icon: Icon, color = "text-primary" }) {
	return (
		<Card>
			<CardContent className="pt-6">
				<div className="flex items-center justify-between">
					<div>
						<p className="text-xs uppercase tracking-wide text-muted-foreground">
							{titulo}
						</p>
						<p className="text-2xl font-semibold mt-1">{valor}</p>
					</div>
					<div className={`rounded-full p-2 bg-muted ${color}`}>
						<Icon className="h-5 w-5" />
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

function AdminTrasladosHoteles() {
	const { authenticatedFetch } = useAuthenticatedFetch();
	const [loading, setLoading] = useState(true);
	const [reservas, setReservas] = useState([]);
	const [hotelesFiltroFallback, setHotelesFiltroFallback] = useState([]);
	const [catalogoHoteles, setCatalogoHoteles] = useState([]);
	const [loadingHoteles, setLoadingHoteles] = useState(false);
	const [resumen, setResumen] = useState({
		total: 0,
		pendiente: 0,
		confirmada: 0,
		completada: 0,
		cancelada: 0,
	});
	const [filtros, setFiltros] = useState({
		q: "",
		estado: "todos",
		hotelCodigo: "todos",
		page: 1,
	});
	const [total, setTotal] = useState(0);
	const [totalPages, setTotalPages] = useState(1);
	const [updatingId, setUpdatingId] = useState(null);

	const [showHotelDialog, setShowHotelDialog] = useState(false);
	const [hotelEditando, setHotelEditando] = useState(null);
	const [hotelForm, setHotelForm] = useState(HOTEL_INICIAL);
	const [guardandoHotel, setGuardandoHotel] = useState(false);

	const hotelesFiltro = useMemo(
		() =>
			catalogoHoteles.length > 0 ? catalogoHoteles : hotelesFiltroFallback || [],
		[catalogoHoteles, hotelesFiltroFallback],
	);

	const fetchReservas = useCallback(async () => {
		try {
			setLoading(true);
			const params = new URLSearchParams({
				page: String(filtros.page || 1),
				limit: "20",
			});

			if (filtros.q?.trim()) params.set("q", filtros.q.trim());
			if (filtros.estado !== "todos") params.set("estado", filtros.estado);
			if (filtros.hotelCodigo !== "todos")
				params.set("hotelCodigo", filtros.hotelCodigo);

			const response = await authenticatedFetch(
				`/api/admin/traslados-hoteles/reservas?${params.toString()}`,
				{ method: "GET" },
			);
			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "No se pudo cargar el módulo.");
			}

			setReservas(data.reservas || []);
			setResumen(
				data.resumen || {
					total: 0,
					pendiente: 0,
					confirmada: 0,
					completada: 0,
					cancelada: 0,
				},
			);
			setHotelesFiltroFallback(data.hoteles || []);
			setTotal(data.total || 0);
			setTotalPages(data.totalPages || 1);
		} catch (error) {
			console.error("Error cargando admin Aeropuerto-Hoteles:", error);
			toast.error(error.message || "No se pudo cargar el módulo Aeropuerto-Hoteles.");
		} finally {
			setLoading(false);
		}
	}, [authenticatedFetch, filtros]);

	const fetchHoteles = useCallback(async () => {
		try {
			setLoadingHoteles(true);
			const response = await authenticatedFetch(
				"/api/admin/traslados-hoteles/hoteles",
				{
					method: "GET",
				},
			);
			const data = await response.json();
			if (!response.ok) {
				throw new Error(data.error || "No se pudo cargar el catálogo de hoteles.");
			}
			setCatalogoHoteles(data.hoteles || []);
		} catch (error) {
			console.error("Error cargando hoteles Aeropuerto-Hoteles:", error);
			toast.error(error.message || "No se pudo cargar el catálogo de hoteles.");
		} finally {
			setLoadingHoteles(false);
		}
	}, [authenticatedFetch]);

	useEffect(() => {
		fetchReservas();
	}, [fetchReservas]);

	useEffect(() => {
		fetchHoteles();
	}, [fetchHoteles]);

	const totalFacturado = useMemo(
		() =>
			reservas.reduce(
				(acumulado, reserva) => acumulado + Number(reserva.montoTotal || 0),
				0,
			),
		[reservas],
	);

	const actualizarFiltro = (campo, valor) => {
		setFiltros((prev) => ({
			...prev,
			[campo]: valor,
			page: campo === "page" ? valor : 1,
		}));
	};

	const cambiarEstado = async (reservaId, nuevoEstado) => {
		try {
			setUpdatingId(reservaId);
			const response = await authenticatedFetch(
				`/api/admin/traslados-hoteles/reservas/${reservaId}/estado`,
				{
					method: "PATCH",
					body: JSON.stringify({ estado: nuevoEstado }),
				},
			);
			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "No se pudo actualizar el estado.");
			}

			toast.success(`Estado actualizado a ${nuevoEstado}.`);
			await fetchReservas();
		} catch (error) {
			console.error("Error actualizando estado Aeropuerto-Hoteles:", error);
			toast.error(error.message || "Error al actualizar estado.");
		} finally {
			setUpdatingId(null);
		}
	};

	const abrirCrearHotel = () => {
		setHotelEditando(null);
		setHotelForm(HOTEL_INICIAL);
		setShowHotelDialog(true);
	};

	const abrirEditarHotel = (hotel) => {
		setHotelEditando(hotel);
		setHotelForm({
			nombre: hotel.nombre || "",
			comuna: hotel.comuna || "",
			codigo: hotel.codigo || "",
			tarifaSoloIda: String(hotel.tarifaSoloIda ?? ""),
			tarifaIdaVuelta: String(hotel.tarifaIdaVuelta ?? ""),
			orden: String(hotel.orden ?? 0),
			activo: Boolean(hotel.activo),
		});
		setShowHotelDialog(true);
	};

	const setHotelCampo = (campo, valor) => {
		setHotelForm((prev) => ({ ...prev, [campo]: valor }));
	};

	const guardarHotel = async () => {
		try {
			const payload = {
				nombre: hotelForm.nombre?.trim(),
				comuna: hotelForm.comuna?.trim(),
				codigo: hotelForm.codigo?.trim(),
				tarifaSoloIda: Number(hotelForm.tarifaSoloIda),
				tarifaIdaVuelta: Number(hotelForm.tarifaIdaVuelta),
				orden: Number.parseInt(hotelForm.orden, 10) || 0,
				activo: Boolean(hotelForm.activo),
			};

			if (!payload.nombre || !payload.comuna) {
				toast.error("Nombre y comuna son obligatorios.");
				return;
			}
			if (
				!Number.isFinite(payload.tarifaSoloIda) ||
				!Number.isFinite(payload.tarifaIdaVuelta) ||
				payload.tarifaSoloIda <= 0 ||
				payload.tarifaIdaVuelta <= 0
			) {
				toast.error("Las tarifas deben ser números mayores a 0.");
				return;
			}

			setGuardandoHotel(true);

			const url = hotelEditando
				? `/api/admin/traslados-hoteles/hoteles/${hotelEditando.id}`
				: "/api/admin/traslados-hoteles/hoteles";
			const method = hotelEditando ? "PUT" : "POST";

			const response = await authenticatedFetch(url, {
				method,
				body: JSON.stringify(payload),
			});
			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "No se pudo guardar el hotel.");
			}

			toast.success(hotelEditando ? "Hotel actualizado." : "Hotel creado.");
			setShowHotelDialog(false);
			setHotelEditando(null);
			setHotelForm(HOTEL_INICIAL);
			await Promise.all([fetchHoteles(), fetchReservas()]);
		} catch (error) {
			console.error("Error guardando hotel:", error);
			toast.error(error.message || "No se pudo guardar el hotel.");
		} finally {
			setGuardandoHotel(false);
		}
	};

	const alternarActivoHotel = async (hotel) => {
		try {
			const response = await authenticatedFetch(
				`/api/admin/traslados-hoteles/hoteles/${hotel.id}`,
				{
					method: "PUT",
					body: JSON.stringify({
						nombre: hotel.nombre,
						comuna: hotel.comuna,
						codigo: hotel.codigo,
						tarifaSoloIda: Number(hotel.tarifaSoloIda),
						tarifaIdaVuelta: Number(hotel.tarifaIdaVuelta),
						orden: Number(hotel.orden || 0),
						activo: !hotel.activo,
					}),
				},
			);
			const data = await response.json();
			if (!response.ok) {
				throw new Error(data.error || "No se pudo actualizar el estado del hotel.");
			}
			toast.success(`Hotel ${hotel.activo ? "desactivado" : "activado"}.`);
			await Promise.all([fetchHoteles(), fetchReservas()]);
		} catch (error) {
			console.error("Error alternando hotel:", error);
			toast.error(error.message || "No se pudo actualizar el hotel.");
		}
	};

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h2 className="text-2xl font-bold text-gray-900">
						Admin Traslados Aeropuerto-Hoteles
					</h2>
					<p className="text-sm text-muted-foreground">
						Aquí gestionas reservas, hoteles y precios fijos del servicio.
					</p>
				</div>
				<Button
					variant="outline"
					onClick={() => {
						fetchReservas();
						fetchHoteles();
					}}
					disabled={loading || loadingHoteles}
				>
					<RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
					Actualizar
				</Button>
			</div>

			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				<TarjetaResumen
					titulo="Reservas"
					valor={resumen.total}
					icon={Plane}
					color="text-primary"
				/>
				<TarjetaResumen
					titulo="Pendientes"
					valor={resumen.pendiente}
					icon={Hotel}
					color="text-amber-600"
				/>
				<TarjetaResumen
					titulo="Completadas"
					valor={resumen.completada}
					icon={Users}
					color="text-emerald-600"
				/>
				<TarjetaResumen
					titulo="Monto página"
					valor={formatearCLP(totalFacturado)}
					icon={CircleDollarSign}
					color="text-blue-600"
				/>
			</div>

			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<CardTitle className="text-base">
						Catálogo de hoteles y tarifas
					</CardTitle>
					<Button size="sm" onClick={abrirCrearHotel}>
						<Plus className="h-4 w-4 mr-1" />
						Nuevo hotel
					</Button>
				</CardHeader>
				<CardContent>
					<div className="overflow-x-auto rounded-md border">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Orden</TableHead>
									<TableHead>Hotel</TableHead>
									<TableHead>Comuna</TableHead>
									<TableHead>Código</TableHead>
									<TableHead>Solo ida</TableHead>
									<TableHead>Ida y vuelta</TableHead>
									<TableHead>Activo</TableHead>
									<TableHead>Acciones</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{loadingHoteles ? (
									<TableRow>
										<TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
											Cargando catálogo...
										</TableCell>
									</TableRow>
								) : catalogoHoteles.length === 0 ? (
									<TableRow>
										<TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
											No hay hoteles cargados en el catálogo.
										</TableCell>
									</TableRow>
								) : (
									catalogoHoteles.map((hotel) => (
										<TableRow key={hotel.id}>
											<TableCell>{hotel.orden}</TableCell>
											<TableCell className="font-medium">{hotel.nombre}</TableCell>
											<TableCell>{hotel.comuna}</TableCell>
											<TableCell className="text-xs">{hotel.codigo}</TableCell>
											<TableCell>{formatearCLP(hotel.tarifaSoloIda)}</TableCell>
											<TableCell>{formatearCLP(hotel.tarifaIdaVuelta)}</TableCell>
											<TableCell>
												<div className="flex items-center gap-2">
													<Switch
														checked={Boolean(hotel.activo)}
														onCheckedChange={() => alternarActivoHotel(hotel)}
													/>
													<Badge variant="outline">
														{hotel.activo ? "Activo" : "Inactivo"}
													</Badge>
												</div>
											</TableCell>
											<TableCell>
												<Button
													variant="outline"
													size="sm"
													onClick={() => abrirEditarHotel(hotel)}
												>
													<Pencil className="h-3.5 w-3.5 mr-1" />
													Editar
												</Button>
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="text-base">Filtros de reservas</CardTitle>
				</CardHeader>
				<CardContent className="grid gap-4 md:grid-cols-3">
					<div className="space-y-2">
						<Label>Buscar</Label>
						<Input
							value={filtros.q}
							onChange={(event) => actualizarFiltro("q", event.target.value)}
							placeholder="Código, nombre, email o teléfono"
						/>
					</div>

					<div className="space-y-2">
						<Label>Estado</Label>
						<Select
							value={filtros.estado}
							onValueChange={(value) => actualizarFiltro("estado", value)}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="todos">Todos</SelectItem>
								{ESTADOS.map((estado) => (
									<SelectItem key={estado} value={estado}>
										{estado}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<Label>Hotel</Label>
						<Select
							value={filtros.hotelCodigo}
							onValueChange={(value) => actualizarFiltro("hotelCodigo", value)}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="todos">Todos</SelectItem>
								{hotelesFiltro.map((hotel) => (
									<SelectItem key={hotel.codigo} value={hotel.codigo}>
										{hotel.nombre}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="text-base">
						Reservas ({total}) · Página {filtros.page} de {totalPages}
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="overflow-x-auto rounded-md border">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Código</TableHead>
									<TableHead>Cliente</TableHead>
									<TableHead>Trayecto</TableHead>
									<TableHead>Fecha/Hora</TableHead>
									<TableHead>Pax</TableHead>
									<TableHead>Monto</TableHead>
									<TableHead>Estado</TableHead>
									<TableHead>Acción</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{loading ? (
									<TableRow>
										<TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
											Cargando reservas...
										</TableCell>
									</TableRow>
								) : reservas.length === 0 ? (
									<TableRow>
										<TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
											No hay reservas para los filtros seleccionados.
										</TableCell>
									</TableRow>
								) : (
									reservas.map((reserva) => (
										<TableRow key={reserva.id}>
											<TableCell className="font-medium">
												<div>{reserva.codigoReserva}</div>
												<div className="text-xs text-muted-foreground">
													{reserva.hotelNombre}
												</div>
											</TableCell>
											<TableCell>
												<div className="font-medium">{reserva.nombre}</div>
												<div className="text-xs text-muted-foreground">{reserva.email}</div>
												<div className="text-xs text-muted-foreground">{reserva.telefono}</div>
											</TableCell>
											<TableCell>
												<div className="text-sm">{reserva.origen}</div>
												<div className="text-xs text-muted-foreground">→ {reserva.destino}</div>
												<Badge variant="outline" className="mt-1">
													{reserva.tipoServicio === "ida_vuelta"
														? "Ida y vuelta"
														: "Solo ida"}
												</Badge>
											</TableCell>
											<TableCell>
												<div>{formatearFecha(reserva.fechaIda)}</div>
												<div className="text-xs text-muted-foreground">{reserva.horaIda}</div>
											</TableCell>
											<TableCell>{reserva.pasajeros}</TableCell>
											<TableCell>{formatearCLP(reserva.montoTotal)}</TableCell>
											<TableCell>
												<Badge
													variant="outline"
													className={CLASES_ESTADO[reserva.estado] || ""}
												>
													{reserva.estado}
												</Badge>
											</TableCell>
											<TableCell className="min-w-[180px]">
												<Select
													value={reserva.estado}
													onValueChange={(value) => cambiarEstado(reserva.id, value)}
													disabled={updatingId === reserva.id}
												>
													<SelectTrigger>
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														{ESTADOS.map((estado) => (
															<SelectItem key={estado} value={estado}>
																Marcar {estado}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</div>

					<div className="flex items-center justify-end gap-2">
						<Button
							variant="outline"
							size="sm"
							disabled={filtros.page <= 1}
							onClick={() => actualizarFiltro("page", filtros.page - 1)}
						>
							Anterior
						</Button>
						<Button
							variant="outline"
							size="sm"
							disabled={filtros.page >= totalPages}
							onClick={() => actualizarFiltro("page", filtros.page + 1)}
						>
							Siguiente
						</Button>
					</div>
				</CardContent>
			</Card>

			<Dialog open={showHotelDialog} onOpenChange={setShowHotelDialog}>
				<DialogContent className="sm:max-w-lg">
					<DialogHeader>
						<DialogTitle>
							{hotelEditando ? "Editar hotel y tarifas" : "Nuevo hotel y tarifas"}
						</DialogTitle>
					</DialogHeader>
					<div className="grid gap-4 py-2">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
							<div className="space-y-2">
								<Label>Nombre</Label>
								<Input
									value={hotelForm.nombre}
									onChange={(event) => setHotelCampo("nombre", event.target.value)}
									placeholder="Ej: Hotel Dreams Araucanía"
								/>
							</div>
							<div className="space-y-2">
								<Label>Comuna</Label>
								<Input
									value={hotelForm.comuna}
									onChange={(event) => setHotelCampo("comuna", event.target.value)}
									placeholder="Ej: Temuco"
								/>
							</div>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
							<div className="space-y-2">
								<Label>Código (slug)</Label>
								<Input
									value={hotelForm.codigo}
									onChange={(event) => setHotelCampo("codigo", event.target.value)}
									placeholder="Ej: dreams-temuco"
								/>
							</div>
							<div className="space-y-2">
								<Label>Orden</Label>
								<Input
									type="number"
									value={hotelForm.orden}
									onChange={(event) => setHotelCampo("orden", event.target.value)}
								/>
							</div>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
							<div className="space-y-2">
								<Label>Tarifa solo ida (CLP)</Label>
								<Input
									type="number"
									min="1"
									value={hotelForm.tarifaSoloIda}
									onChange={(event) =>
										setHotelCampo("tarifaSoloIda", event.target.value)
									}
								/>
							</div>
							<div className="space-y-2">
								<Label>Tarifa ida y vuelta (CLP)</Label>
								<Input
									type="number"
									min="1"
									value={hotelForm.tarifaIdaVuelta}
									onChange={(event) =>
										setHotelCampo("tarifaIdaVuelta", event.target.value)
									}
								/>
							</div>
						</div>
						<div className="flex items-center justify-between rounded-lg border p-3">
							<div>
								<p className="text-sm font-medium">Hotel activo en venta</p>
								<p className="text-xs text-muted-foreground">
									Si está desactivado, no aparece en el formulario público.
								</p>
							</div>
							<Switch
								checked={hotelForm.activo}
								onCheckedChange={(checked) => setHotelCampo("activo", checked)}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setShowHotelDialog(false)}
							disabled={guardandoHotel}
						>
							Cancelar
						</Button>
						<Button onClick={guardarHotel} disabled={guardandoHotel}>
							{guardandoHotel ? "Guardando..." : "Guardar hotel"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

export default AdminTrasladosHoteles;
