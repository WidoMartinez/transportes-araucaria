import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
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
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "./ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "./ui/alert-dialog";
import {
	Trash2,
	RotateCcw,
	Users,
	Search,
	Filter,
	BarChart3,
	Eye,
	Trash,
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export default function AdminCodigosMejorado() {
	const [codigos, setCodigos] = useState([]);
	const [estadisticas, setEstadisticas] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [success, setSuccess] = useState(null);

	// Filtros y búsqueda
	const [filtros, setFiltros] = useState({
		activo: "todos",
		agotado: "todos",
		vencido: "todos",
		buscar: "",
		ordenar: "fechaCreacion",
		direccion: "DESC",
	});

	// Paginación
	const [paginacion, setPaginacion] = useState({
		pagina: 1,
		limite: 20,
		total: 0,
		totalPaginas: 0,
	});

	// Estados para modales
	const [codigoSeleccionado, setCodigoSeleccionado] = useState(null);
	const [usuariosCodigo, setUsuariosCodigo] = useState([]);
	const [mostrarUsuarios, setMostrarUsuarios] = useState(false);

	// Cargar códigos con filtros
	const cargarCodigos = async () => {
		try {
			setLoading(true);
			const params = new URLSearchParams({
				...filtros,
				pagina: paginacion.pagina,
				limite: paginacion.limite,
			});

			const response = await fetch(
				`${API_BASE_URL}/api/codigos/buscar?${params}`
			);
			if (!response.ok) throw new Error("Error al cargar códigos");

			const data = await response.json();
			setCodigos(data.codigos);
			setPaginacion((prev) => ({
				...prev,
				total: data.paginacion.total,
				totalPaginas: data.paginacion.totalPaginas,
			}));
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	// Cargar estadísticas
	const cargarEstadisticas = async () => {
		try {
			const response = await fetch(`${API_BASE_URL}/api/codigos/estadisticas`);
			if (!response.ok) throw new Error("Error al cargar estadísticas");

			const data = await response.json();
			setEstadisticas(data);
		} catch (err) {
			console.error("Error cargando estadísticas:", err);
		}
	};

	// Cargar usuarios de un código
	const cargarUsuariosCodigo = async (codigoId) => {
		try {
			const response = await fetch(
				`${API_BASE_URL}/api/codigos/${codigoId}/usuarios`
			);
			if (!response.ok) throw new Error("Error al cargar usuarios");

			const data = await response.json();
			setUsuariosCodigo(data.usuarios);
			setCodigoSeleccionado(data.codigo);
		} catch (err) {
			setError(err.message);
		}
	};

	// Eliminar usuario de un código
	const eliminarUsuario = async (codigoId, usuarioId) => {
		try {
			const response = await fetch(
				`${API_BASE_URL}/api/codigos/${codigoId}/usuarios/${usuarioId}`,
				{
					method: "DELETE",
				}
			);

			if (!response.ok) throw new Error("Error al eliminar usuario");

			setSuccess("Usuario eliminado exitosamente");
			cargarUsuariosCodigo(codigoId);
			cargarCodigos();
		} catch (err) {
			setError(err.message);
		}
	};

	// Resetear código
	const resetearCodigo = async (codigoId) => {
		try {
			const response = await fetch(
				`${API_BASE_URL}/api/codigos/${codigoId}/reset`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ confirmar: true }),
				}
			);

			if (!response.ok) throw new Error("Error al resetear código");

			setSuccess("Código reseteado exitosamente");
			cargarCodigos();
			cargarEstadisticas();
		} catch (err) {
			setError(err.message);
		}
	};

	// Aplicar filtros
	const aplicarFiltros = () => {
		setPaginacion((prev) => ({ ...prev, pagina: 1 }));
		cargarCodigos();
	};

	// Limpiar filtros
	const limpiarFiltros = () => {
		setFiltros({
			activo: "todos",
			agotado: "todos",
			vencido: "todos",
			buscar: "",
			ordenar: "fechaCreacion",
			direccion: "DESC",
		});
	};

	useEffect(() => {
		cargarCodigos();
		cargarEstadisticas();
	}, [paginacion.pagina]);

	useEffect(() => {
		const timer = setTimeout(() => {
			setError(null);
			setSuccess(null);
		}, 5000);
		return () => clearTimeout(timer);
	}, [error, success]);

	const formatearFecha = (fecha) => {
		return new Date(fecha).toLocaleDateString("es-CL");
	};

	const formatearMonto = (monto) => {
		return new Intl.NumberFormat("es-CL", {
			style: "currency",
			currency: "CLP",
		}).format(monto);
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex justify-between items-center">
				<h1 className="text-3xl font-bold">Panel de Códigos Mejorado</h1>
				<Button
					onClick={() => {
						cargarCodigos();
						cargarEstadisticas();
					}}
				>
					<RotateCcw className="w-4 h-4 mr-2" />
					Actualizar
				</Button>
			</div>

			{/* Alertas */}
			{error && (
				<Alert variant="destructive">
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}

			{success && (
				<Alert>
					<AlertDescription>{success}</AlertDescription>
				</Alert>
			)}

			{/* Estadísticas */}
			{estadisticas && (
				<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
					<Card>
						<CardContent className="p-4">
							<div className="flex items-center space-x-2">
								<BarChart3 className="w-5 h-5 text-blue-500" />
								<div>
									<p className="text-sm font-medium">Total Códigos</p>
									<p className="text-2xl font-bold">
										{estadisticas.totalCodigos}
									</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardContent className="p-4">
							<div className="flex items-center space-x-2">
								<Users className="w-5 h-5 text-green-500" />
								<div>
									<p className="text-sm font-medium">Activos</p>
									<p className="text-2xl font-bold">
										{estadisticas.codigosActivos}
									</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardContent className="p-4">
							<div className="flex items-center space-x-2">
								<RotateCcw className="w-5 h-5 text-red-500" />
								<div>
									<p className="text-sm font-medium">Agotados</p>
									<p className="text-2xl font-bold">
										{estadisticas.codigosAgotados}
									</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardContent className="p-4">
							<div className="flex items-center space-x-2">
								<BarChart3 className="w-5 h-5 text-purple-500" />
								<div>
									<p className="text-sm font-medium">Total Usos</p>
									<p className="text-2xl font-bold">{estadisticas.totalUsos}</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			)}

			{/* Filtros */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center space-x-2">
						<Filter className="w-5 h-5" />
						<span>Filtros y Búsqueda</span>
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
						<div>
							<label className="text-sm font-medium">Buscar</label>
							<Input
								placeholder="Código o descripción..."
								value={filtros.buscar}
								onChange={(e) =>
									setFiltros((prev) => ({ ...prev, buscar: e.target.value }))
								}
							/>
						</div>

						<div>
							<label className="text-sm font-medium">Estado</label>
							<Select
								value={filtros.activo}
								onValueChange={(value) =>
									setFiltros((prev) => ({ ...prev, activo: value }))
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="Todos" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="todos">Todos</SelectItem>
									<SelectItem value="true">Activos</SelectItem>
									<SelectItem value="false">Inactivos</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div>
							<label className="text-sm font-medium">Agotados</label>
							<Select
								value={filtros.agotado}
								onValueChange={(value) =>
									setFiltros((prev) => ({ ...prev, agotado: value }))
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="Todos" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="todos">Todos</SelectItem>
									<SelectItem value="true">Solo Agotados</SelectItem>
									<SelectItem value="false">No Agotados</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div>
							<label className="text-sm font-medium">Vencidos</label>
							<Select
								value={filtros.vencido}
								onValueChange={(value) =>
									setFiltros((prev) => ({ ...prev, vencido: value }))
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="Todos" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="todos">Todos</SelectItem>
									<SelectItem value="true">Solo Vencidos</SelectItem>
									<SelectItem value="false">No Vencidos</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div>
							<label className="text-sm font-medium">Ordenar</label>
							<Select
								value={filtros.ordenar}
								onValueChange={(value) =>
									setFiltros((prev) => ({ ...prev, ordenar: value }))
								}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="fechaCreacion">Fecha Creación</SelectItem>
									<SelectItem value="usosActuales">Usos</SelectItem>
									<SelectItem value="codigo">Código</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div>
							<label className="text-sm font-medium">Dirección</label>
							<Select
								value={filtros.direccion}
								onValueChange={(value) =>
									setFiltros((prev) => ({ ...prev, direccion: value }))
								}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="DESC">Descendente</SelectItem>
									<SelectItem value="ASC">Ascendente</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					<div className="flex space-x-2 mt-4">
						<Button onClick={aplicarFiltros}>
							<Search className="w-4 h-4 mr-2" />
							Aplicar Filtros
						</Button>
						<Button variant="outline" onClick={limpiarFiltros}>
							Limpiar
						</Button>
					</div>
				</CardContent>
			</Card>

			{/* Tabla de Códigos */}
			<Card>
				<CardHeader>
					<CardTitle>Códigos de Descuento</CardTitle>
				</CardHeader>
				<CardContent>
					{loading ? (
						<div className="text-center py-8">Cargando...</div>
					) : (
						<>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Código</TableHead>
										<TableHead>Descripción</TableHead>
										<TableHead>Usos</TableHead>
										<TableHead>Estado</TableHead>
										<TableHead>Vencimiento</TableHead>
										<TableHead>Acciones</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{codigos.map((codigo) => (
										<TableRow key={codigo.id}>
											<TableCell className="font-mono">
												{codigo.codigo}
											</TableCell>
											<TableCell>{codigo.descripcion}</TableCell>
											<TableCell>
												<div className="flex items-center space-x-2">
													<span>{codigo.usosActuales}</span>
													<span className="text-gray-400">/</span>
													<span>{codigo.limiteUsos}</span>
												</div>
											</TableCell>
											<TableCell>
												<div className="flex space-x-1">
													<Badge
														variant={codigo.activo ? "default" : "secondary"}
													>
														{codigo.activo ? "Activo" : "Inactivo"}
													</Badge>
													{codigo.usosActuales >= codigo.limiteUsos && (
														<Badge variant="destructive">Agotado</Badge>
													)}
													{new Date(codigo.fechaVencimiento) < new Date() && (
														<Badge variant="outline">Vencido</Badge>
													)}
												</div>
											</TableCell>
											<TableCell>
												{formatearFecha(codigo.fechaVencimiento)}
											</TableCell>
											<TableCell>
												<div className="flex space-x-2">
													<Button
														size="sm"
														variant="outline"
														onClick={() => {
															cargarUsuariosCodigo(codigo.id);
															setMostrarUsuarios(true);
														}}
													>
														<Eye className="w-4 h-4" />
													</Button>

													<AlertDialog>
														<AlertDialogTrigger asChild>
															<Button size="sm" variant="outline">
																<RotateCcw className="w-4 h-4" />
															</Button>
														</AlertDialogTrigger>
														<AlertDialogContent>
															<AlertDialogHeader>
																<AlertDialogTitle>
																	¿Resetear código?
																</AlertDialogTitle>
																<AlertDialogDescription>
																	Esta acción eliminará todos los usuarios y
																	reseteará el contador de usos del código "
																	{codigo.codigo}". Esta acción no se puede
																	deshacer.
																</AlertDialogDescription>
															</AlertDialogHeader>
															<AlertDialogFooter>
																<AlertDialogCancel>Cancelar</AlertDialogCancel>
																<AlertDialogAction
																	onClick={() => resetearCodigo(codigo.id)}
																>
																	Resetear
																</AlertDialogAction>
															</AlertDialogFooter>
														</AlertDialogContent>
													</AlertDialog>
												</div>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>

							{/* Paginación */}
							{paginacion.totalPaginas > 1 && (
								<div className="flex justify-between items-center mt-4">
									<div className="text-sm text-gray-500">
										Mostrando {(paginacion.pagina - 1) * paginacion.limite + 1}{" "}
										a{" "}
										{Math.min(
											paginacion.pagina * paginacion.limite,
											paginacion.total
										)}{" "}
										de {paginacion.total} códigos
									</div>
									<div className="flex space-x-2">
										<Button
											variant="outline"
											size="sm"
											disabled={paginacion.pagina === 1}
											onClick={() =>
												setPaginacion((prev) => ({
													...prev,
													pagina: prev.pagina - 1,
												}))
											}
										>
											Anterior
										</Button>
										<Button
											variant="outline"
											size="sm"
											disabled={paginacion.pagina === paginacion.totalPaginas}
											onClick={() =>
												setPaginacion((prev) => ({
													...prev,
													pagina: prev.pagina + 1,
												}))
											}
										>
											Siguiente
										</Button>
									</div>
								</div>
							)}
						</>
					)}
				</CardContent>
			</Card>

			{/* Modal de Usuarios */}
			<Dialog open={mostrarUsuarios} onOpenChange={setMostrarUsuarios}>
				<DialogContent className="max-w-4xl">
					<DialogHeader>
						<DialogTitle>
							Usuarios del Código: {codigoSeleccionado?.codigo}
						</DialogTitle>
						<DialogDescription>
							{codigoSeleccionado?.descripcion}
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4">
						<div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
							<div>
								<p className="text-sm font-medium">Usos Actuales</p>
								<p className="text-lg font-bold">
									{codigoSeleccionado?.usosActuales}
								</p>
							</div>
							<div>
								<p className="text-sm font-medium">Límite de Usos</p>
								<p className="text-lg font-bold">
									{codigoSeleccionado?.limiteUsos}
								</p>
							</div>
							<div>
								<p className="text-sm font-medium">Total Usuarios</p>
								<p className="text-lg font-bold">{usuariosCodigo.length}</p>
							</div>
						</div>

						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Usuario</TableHead>
									<TableHead>Email</TableHead>
									<TableHead>Teléfono</TableHead>
									<TableHead>Fecha Uso</TableHead>
									<TableHead>Monto</TableHead>
									<TableHead>Estado</TableHead>
									<TableHead>Acciones</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{usuariosCodigo.map((usuario, index) => (
									<TableRow key={index}>
										<TableCell>{usuario.nombre}</TableCell>
										<TableCell>{usuario.email}</TableCell>
										<TableCell>{usuario.telefono}</TableCell>
										<TableCell>
											{usuario.fechaUso
												? formatearFecha(usuario.fechaUso)
												: "N/A"}
										</TableCell>
										<TableCell>
											{usuario.monto ? formatearMonto(usuario.monto) : "N/A"}
										</TableCell>
										<TableCell>
											<div className="flex space-x-1">
												<Badge
													variant={
														usuario.estado === "confirmada"
															? "default"
															: "secondary"
													}
												>
													{usuario.estado}
												</Badge>
												<Badge
													variant={
														usuario.estadoPago === "pagado"
															? "default"
															: "outline"
													}
												>
													{usuario.estadoPago}
												</Badge>
											</div>
										</TableCell>
										<TableCell>
											<AlertDialog>
												<AlertDialogTrigger asChild>
													<Button size="sm" variant="destructive">
														<Trash className="w-4 h-4" />
													</Button>
												</AlertDialogTrigger>
												<AlertDialogContent>
													<AlertDialogHeader>
														<AlertDialogTitle>
															¿Eliminar usuario?
														</AlertDialogTitle>
														<AlertDialogDescription>
															Esta acción eliminará a {usuario.nombre} (
															{usuario.email}) del código. El contador de usos
															se reducirá en 1.
														</AlertDialogDescription>
													</AlertDialogHeader>
													<AlertDialogFooter>
														<AlertDialogCancel>Cancelar</AlertDialogCancel>
														<AlertDialogAction
															onClick={() =>
																eliminarUsuario(
																	codigoSeleccionado.id,
																	usuario.usuarioId
																)
															}
														>
															Eliminar
														</AlertDialogAction>
													</AlertDialogFooter>
												</AlertDialogContent>
											</AlertDialog>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>

					<DialogFooter>
						<Button variant="outline" onClick={() => setMostrarUsuarios(false)}>
							Cerrar
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
