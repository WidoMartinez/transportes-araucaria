import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import { RefreshCw, Phone, Mail, User, MapPin, Calendar } from "lucide-react";

// Componente para gestión de leads capturados
function AdminLeads() {
	const [leads, setLeads] = useState([]);
	const [loading, setLoading] = useState(false);
	const [pagination, setPagination] = useState({
		page: 1,
		limit: 20,
		total: 0,
		totalPages: 0,
	});
	const [filtros, setFiltros] = useState({
		convertido: "false",
		estadoRemarketing: "",
	});
	const [leadSeleccionado, setLeadSeleccionado] = useState(null);
	const [dialogAbierto, setDialogAbierto] = useState(false);
	const [notasContacto, setNotasContacto] = useState("");
	const [nuevoEstado, setNuevoEstado] = useState("");

	const apiUrl =
		import.meta.env.VITE_API_URL ||
		"https://transportes-araucaria.onrender.com";

	// Cargar leads desde la API
	const cargarLeads = async () => {
		setLoading(true);
		try {
			const params = new URLSearchParams({
				page: pagination.page,
				limit: pagination.limit,
				...(filtros.convertido && { convertido: filtros.convertido }),
				...(filtros.estadoRemarketing && {
					estadoRemarketing: filtros.estadoRemarketing,
				}),
			});

			const response = await fetch(`${apiUrl}/api/leads?${params}`);
			const data = await response.json();

			if (data.success) {
				setLeads(data.leads);
				setPagination((prev) => ({
					...prev,
					total: data.pagination.total,
					totalPages: data.pagination.totalPages,
				}));
			}
		} catch (error) {
			console.error("Error cargando leads:", error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		cargarLeads();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pagination.page, filtros]);

	// Marcar lead como contactado
	const marcarContactado = async () => {
		if (!leadSeleccionado) return;

		try {
			const response = await fetch(
				`${apiUrl}/api/leads/${leadSeleccionado.id}/contactar`,
				{
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						estadoRemarketing: nuevoEstado || leadSeleccionado.estadoRemarketing,
						notas: notasContacto,
					}),
				}
			);

			const data = await response.json();

			if (data.success) {
				setDialogAbierto(false);
				setLeadSeleccionado(null);
				setNotasContacto("");
				setNuevoEstado("");
				cargarLeads();
			}
		} catch (error) {
			console.error("Error actualizando lead:", error);
		}
	};

	// Abrir diálogo de contacto
	const abrirDialogoContacto = (lead) => {
		setLeadSeleccionado(lead);
		setNotasContacto(lead.notas || "");
		setNuevoEstado(lead.estadoRemarketing);
		setDialogAbierto(true);
	};

	// Formatear fecha
	const formatearFecha = (fecha) => {
		if (!fecha) return "-";
		return new Date(fecha).toLocaleDateString("es-CL");
	};

	// Obtener color del badge según estado
	const obtenerColorEstado = (estado) => {
		const colores = {
			nuevo: "bg-blue-500",
			contactado: "bg-yellow-500",
			interesado: "bg-green-500",
			no_interesado: "bg-gray-500",
			convertido: "bg-purple-500",
		};
		return colores[estado] || "bg-gray-400";
	};

	return (
		<div className="container mx-auto p-6 space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>Gestión de Leads para Remarketing</CardTitle>
					<CardDescription>
						Leads capturados que aún no han completado su reserva
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{/* Filtros */}
					<div className="flex flex-wrap gap-4">
						<Select
							value={filtros.convertido}
							onValueChange={(value) =>
								setFiltros((prev) => ({ ...prev, convertido: value }))
							}
						>
							<SelectTrigger className="w-[180px]">
								<SelectValue placeholder="Estado de conversión" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Todos</SelectItem>
								<SelectItem value="false">No convertidos</SelectItem>
								<SelectItem value="true">Convertidos</SelectItem>
							</SelectContent>
						</Select>

						<Select
							value={filtros.estadoRemarketing}
							onValueChange={(value) =>
								setFiltros((prev) => ({ ...prev, estadoRemarketing: value }))
							}
						>
							<SelectTrigger className="w-[180px]">
								<SelectValue placeholder="Estado remarketing" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="">Todos</SelectItem>
								<SelectItem value="nuevo">Nuevo</SelectItem>
								<SelectItem value="contactado">Contactado</SelectItem>
								<SelectItem value="interesado">Interesado</SelectItem>
								<SelectItem value="no_interesado">No interesado</SelectItem>
								<SelectItem value="convertido">Convertido</SelectItem>
							</SelectContent>
						</Select>

						<Button
							onClick={cargarLeads}
							disabled={loading}
							variant="outline"
							size="icon"
						>
							<RefreshCw className={loading ? "animate-spin" : ""} />
						</Button>
					</div>

					{/* Tabla de leads */}
					<div className="border rounded-lg overflow-x-auto">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Contacto</TableHead>
									<TableHead>Viaje</TableHead>
									<TableHead>Paso Alcanzado</TableHead>
									<TableHead>Dispositivo</TableHead>
									<TableHead>Estado</TableHead>
									<TableHead>Fecha</TableHead>
									<TableHead>Acciones</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{loading ? (
									<TableRow>
										<TableCell colSpan={7} className="text-center py-8">
											Cargando leads...
										</TableCell>
									</TableRow>
								) : leads.length === 0 ? (
									<TableRow>
										<TableCell colSpan={7} className="text-center py-8">
											No hay leads que mostrar
										</TableCell>
									</TableRow>
								) : (
									leads.map((lead) => (
										<TableRow key={lead.id}>
											<TableCell>
												<div className="space-y-1">
													{lead.nombre && (
														<div className="flex items-center gap-1 text-sm">
															<User className="h-3 w-3" />
															<span>{lead.nombre}</span>
														</div>
													)}
													{lead.email && (
														<div className="flex items-center gap-1 text-sm text-muted-foreground">
															<Mail className="h-3 w-3" />
															<span>{lead.email}</span>
														</div>
													)}
													{lead.telefono && (
														<div className="flex items-center gap-1 text-sm text-muted-foreground">
															<Phone className="h-3 w-3" />
															<span>{lead.telefono}</span>
														</div>
													)}
												</div>
											</TableCell>
											<TableCell>
												<div className="space-y-1 text-sm">
													{lead.destino && (
														<div className="flex items-center gap-1">
															<MapPin className="h-3 w-3" />
															<span>
																{lead.origen || "?"} → {lead.destino}
															</span>
														</div>
													)}
													{lead.fecha && (
														<div className="flex items-center gap-1 text-muted-foreground">
															<Calendar className="h-3 w-3" />
															<span>{formatearFecha(lead.fecha)}</span>
														</div>
													)}
													{lead.pasajeros && (
														<span className="text-muted-foreground">
															{lead.pasajeros} pax
														</span>
													)}
												</div>
											</TableCell>
											<TableCell>
												<div className="text-sm">
													<div>{lead.pasoAlcanzado || "-"}</div>
													<div className="text-xs text-muted-foreground">
														{lead.tiempoEnSitio
															? `${lead.tiempoEnSitio}s en sitio`
															: ""}
													</div>
												</div>
											</TableCell>
											<TableCell>
												<div className="text-sm text-muted-foreground">
													<div>{lead.dispositivo || "-"}</div>
													<div className="text-xs">{lead.navegador || ""}</div>
												</div>
											</TableCell>
											<TableCell>
												<Badge
													className={obtenerColorEstado(lead.estadoRemarketing)}
												>
													{lead.estadoRemarketing}
												</Badge>
												{lead.intentosContacto > 0 && (
													<div className="text-xs text-muted-foreground mt-1">
														{lead.intentosContacto} contactos
													</div>
												)}
											</TableCell>
											<TableCell className="text-sm text-muted-foreground">
												{formatearFecha(lead.createdAt)}
											</TableCell>
											<TableCell>
												<Button
													size="sm"
													variant="outline"
													onClick={() => abrirDialogoContacto(lead)}
												>
													Contactar
												</Button>
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</div>

					{/* Paginación */}
					<div className="flex items-center justify-between">
						<div className="text-sm text-muted-foreground">
							Mostrando {leads.length} de {pagination.total} leads
						</div>
						<div className="flex gap-2">
							<Button
								variant="outline"
								size="sm"
								disabled={pagination.page === 1}
								onClick={() =>
									setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
								}
							>
								Anterior
							</Button>
							<Button
								variant="outline"
								size="sm"
								disabled={pagination.page >= pagination.totalPages}
								onClick={() =>
									setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
								}
							>
								Siguiente
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Diálogo de contacto */}
			<Dialog open={dialogAbierto} onOpenChange={setDialogAbierto}>
				<DialogContent className="sm:max-w-[500px]">
					<DialogHeader>
						<DialogTitle>Contactar Lead</DialogTitle>
						<DialogDescription>
							Registra el contacto con este lead y actualiza su estado.
						</DialogDescription>
					</DialogHeader>

					{leadSeleccionado && (
						<div className="space-y-4 py-4">
							<div className="space-y-2">
								<h4 className="font-semibold">Información del Lead</h4>
								<div className="text-sm space-y-1">
									<p>
										<strong>Nombre:</strong> {leadSeleccionado.nombre || "-"}
									</p>
									<p>
										<strong>Email:</strong> {leadSeleccionado.email || "-"}
									</p>
									<p>
										<strong>Teléfono:</strong> {leadSeleccionado.telefono || "-"}
									</p>
									<p>
										<strong>Viaje:</strong> {leadSeleccionado.origen} →{" "}
										{leadSeleccionado.destino}
									</p>
								</div>
							</div>

							<div className="space-y-2">
								<label className="text-sm font-medium">Nuevo Estado</label>
								<Select value={nuevoEstado} onValueChange={setNuevoEstado}>
									<SelectTrigger>
										<SelectValue placeholder="Selecciona un estado" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="contactado">Contactado</SelectItem>
										<SelectItem value="interesado">Interesado</SelectItem>
										<SelectItem value="no_interesado">No interesado</SelectItem>
										<SelectItem value="convertido">Convertido</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<label className="text-sm font-medium">
									Notas del Contacto
								</label>
								<Textarea
									placeholder="Escribe notas sobre este contacto..."
									value={notasContacto}
									onChange={(e) => setNotasContacto(e.target.value)}
									rows={4}
								/>
							</div>
						</div>
					)}

					<DialogFooter>
						<Button variant="outline" onClick={() => setDialogAbierto(false)}>
							Cancelar
						</Button>
						<Button onClick={marcarContactado}>Guardar Contacto</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

export default AdminLeads;
