// src/components/AdminVehiculos.jsx
import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "./ui/dialog";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "./ui/table";
import {
	Search,
	Plus,
	Edit,
	Trash2,
	Car,
	AlertCircle,
} from "lucide-react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "./ui/alert-dialog";

const API_BASE_URL =
	import.meta.env.VITE_API_URL || "https://transportes-araucaria.onrender.com";

function AdminVehiculos() {
	const [vehiculos, setVehiculos] = useState([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");
	const [filterTipo, setFilterTipo] = useState("todos");
	const [filterEstado, setFilterEstado] = useState("todos");
	const [showDialog, setShowDialog] = useState(false);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [selectedVehiculo, setSelectedVehiculo] = useState(null);
	const [formData, setFormData] = useState({
		patente: "",
		tipo: "sedan",
		marca: "",
		modelo: "",
		anio: "",
		capacidad: 4,
		estado: "disponible",
		observaciones: "",
	});

	// Cargar vehículos al montar el componente
	useEffect(() => {
		fetchVehiculos();
	}, []);

	const fetchVehiculos = async () => {
		try {
			setLoading(true);
			const response = await fetch(`${API_BASE_URL}/api/vehiculos`);
			const data = await response.json();
			setVehiculos(data.vehiculos || []);
		} catch (error) {
			console.error("Error cargando vehículos:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleOpenDialog = (vehiculo = null) => {
		if (vehiculo) {
			// Editar vehículo existente
			setSelectedVehiculo(vehiculo);
			setFormData({
				patente: vehiculo.patente || "",
				tipo: vehiculo.tipo || "sedan",
				marca: vehiculo.marca || "",
				modelo: vehiculo.modelo || "",
				anio: vehiculo.anio || "",
				capacidad: vehiculo.capacidad || 4,
				estado: vehiculo.estado || "disponible",
				observaciones: vehiculo.observaciones || "",
			});
		} else {
			// Nuevo vehículo
			setSelectedVehiculo(null);
			setFormData({
				patente: "",
				tipo: "sedan",
				marca: "",
				modelo: "",
				anio: "",
				capacidad: 4,
				estado: "disponible",
				observaciones: "",
			});
		}
		setShowDialog(true);
	};

	const handleCloseDialog = () => {
		setShowDialog(false);
		setSelectedVehiculo(null);
		setFormData({
			patente: "",
			tipo: "sedan",
			marca: "",
			modelo: "",
			anio: "",
			capacidad: 4,
			estado: "disponible",
			observaciones: "",
		});
	};

	const handleSave = async () => {
		try {
			// Validaciones básicas
			if (!formData.patente || !formData.tipo) {
				alert("Patente y tipo son obligatorios");
				return;
			}

			const url = selectedVehiculo
				? `${API_BASE_URL}/api/vehiculos/${selectedVehiculo.id}`
				: `${API_BASE_URL}/api/vehiculos`;

			const method = selectedVehiculo ? "PUT" : "POST";

			const response = await fetch(url, {
				method,
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					...formData,
					anio: formData.anio ? Number(formData.anio) : null,
					capacidad: Number.isFinite(Number(formData.capacidad)) ? Number(formData.capacidad) : 4,
				}),
			});

			const data = await response.json();

			if (response.ok) {
				await fetchVehiculos();
				handleCloseDialog();
			} else {
				alert(data.error || "Error al guardar el vehículo");
			}
		} catch (error) {
			console.error("Error guardando vehículo:", error);
			alert("Error al guardar el vehículo");
		}
	};

	const handleDelete = async () => {
		try {
			const response = await fetch(
				`${API_BASE_URL}/api/vehiculos/${selectedVehiculo.id}`,
				{
					method: "DELETE",
				}
			);

			if (response.ok) {
				await fetchVehiculos();
				setShowDeleteDialog(false);
				setSelectedVehiculo(null);
			} else {
				const data = await response.json();
				alert(data.error || "Error al eliminar el vehículo");
			}
		} catch (error) {
			console.error("Error eliminando vehículo:", error);
			alert("Error al eliminar el vehículo");
		}
	};

	// Filtrar vehículos
	const filteredVehiculos = vehiculos.filter((vehiculo) => {
		const matchSearch =
			searchTerm === "" ||
			vehiculo.patente.toLowerCase().includes(searchTerm.toLowerCase()) ||
			(vehiculo.marca &&
				vehiculo.marca.toLowerCase().includes(searchTerm.toLowerCase())) ||
			(vehiculo.modelo &&
				vehiculo.modelo.toLowerCase().includes(searchTerm.toLowerCase()));

		const matchTipo = filterTipo === "todos" || vehiculo.tipo === filterTipo;
		const matchEstado =
			filterEstado === "todos" || vehiculo.estado === filterEstado;

		return matchSearch && matchTipo && matchEstado;
	});

	const getEstadoBadge = (estado) => {
		const badges = {
			disponible: "bg-green-500",
			en_uso: "bg-blue-500",
			mantenimiento: "bg-yellow-500",
			inactivo: "bg-gray-500",
		};
		const labels = {
			disponible: "Disponible",
			en_uso: "En Uso",
			mantenimiento: "Mantenimiento",
			inactivo: "Inactivo",
		};
		return (
			<Badge className={badges[estado] || "bg-gray-500"}>
				{labels[estado] || estado}
			</Badge>
		);
	};

	const getTipoLabel = (tipo) => {
		const labels = {
			sedan: "Sedan",
			van: "Van",
			minibus: "Minibus",
		};
		return labels[tipo] || tipo;
	};

	if (loading) {
		return (
			<div className="flex h-screen items-center justify-center">
				<p>Cargando vehículos...</p>
			</div>
		);
	}

	return (
		<div className="container mx-auto px-4 py-6">
			<div className="mb-6">
				<div className="flex items-center justify-between mb-4">
					<div>
						<h1 className="text-3xl font-bold flex items-center gap-2">
							<Car className="h-8 w-8" />
							Gestión de Vehículos
						</h1>
						<p className="text-muted-foreground mt-1">
							Administra la flota de vehículos del sistema
						</p>
					</div>
					<Button onClick={() => handleOpenDialog()} className="gap-2">
						<Plus className="h-4 w-4" />
						Nuevo Vehículo
					</Button>
				</div>

				{/* Filtros y búsqueda */}
				<Card>
					<CardContent className="pt-6">
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<div className="space-y-2">
								<Label>Buscar</Label>
								<div className="relative">
									<Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
									<Input
										placeholder="Patente, marca o modelo..."
										value={searchTerm}
										onChange={(e) => setSearchTerm(e.target.value)}
										className="pl-8"
									/>
								</div>
							</div>
							<div className="space-y-2">
								<Label>Tipo</Label>
								<Select value={filterTipo} onValueChange={setFilterTipo}>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="todos">Todos</SelectItem>
										<SelectItem value="sedan">Sedan</SelectItem>
										<SelectItem value="van">Van</SelectItem>
										<SelectItem value="minibus">Minibus</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<Label>Estado</Label>
								<Select value={filterEstado} onValueChange={setFilterEstado}>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="todos">Todos</SelectItem>
										<SelectItem value="disponible">Disponible</SelectItem>
										<SelectItem value="en_uso">En Uso</SelectItem>
										<SelectItem value="mantenimiento">Mantenimiento</SelectItem>
										<SelectItem value="inactivo">Inactivo</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Tabla de vehículos */}
			<Card>
				<CardHeader>
					<CardTitle>
						Vehículos Registrados ({filteredVehiculos.length})
					</CardTitle>
				</CardHeader>
				<CardContent>
					{filteredVehiculos.length === 0 ? (
						<div className="text-center py-12">
							<AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
							<p className="text-muted-foreground">
								No se encontraron vehículos
							</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Patente</TableHead>
										<TableHead>Tipo</TableHead>
										<TableHead>Marca/Modelo</TableHead>
										<TableHead>Año</TableHead>
										<TableHead>Capacidad</TableHead>
										<TableHead>Estado</TableHead>
										<TableHead className="text-right">Acciones</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredVehiculos.map((vehiculo) => (
										<TableRow key={vehiculo.id}>
											<TableCell className="font-medium">
												{vehiculo.patente}
											</TableCell>
											<TableCell>{getTipoLabel(vehiculo.tipo)}</TableCell>
											<TableCell>
												{vehiculo.marca || vehiculo.modelo
													? `${vehiculo.marca || ""} ${vehiculo.modelo || ""}`
													: "-"}
											</TableCell>
											<TableCell>{vehiculo.anio || "-"}</TableCell>
											<TableCell>{vehiculo.capacidad} pax</TableCell>
											<TableCell>{getEstadoBadge(vehiculo.estado)}</TableCell>
											<TableCell className="text-right">
												<div className="flex justify-end gap-2">
													<Button
														variant="outline"
														size="sm"
														onClick={() => handleOpenDialog(vehiculo)}
													>
														<Edit className="h-4 w-4" />
													</Button>
													<Button
														variant="destructive"
														size="sm"
														onClick={() => {
															setSelectedVehiculo(vehiculo);
															setShowDeleteDialog(true);
														}}
													>
														<Trash2 className="h-4 w-4" />
													</Button>
												</div>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Dialog para crear/editar vehículo */}
			<Dialog open={showDialog} onOpenChange={setShowDialog}>
				<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>
							{selectedVehiculo ? "Editar Vehículo" : "Nuevo Vehículo"}
						</DialogTitle>
						<DialogDescription>
							{selectedVehiculo
								? "Modifica los datos del vehículo"
								: "Completa los datos del nuevo vehículo"}
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-4">
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="patente">
									Patente <span className="text-red-500">*</span>
								</Label>
								<Input
									id="patente"
									placeholder="AB1234"
									value={formData.patente}
									onChange={(e) =>
										setFormData({ ...formData, patente: e.target.value.toUpperCase() })
									}
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="tipo">
									Tipo <span className="text-red-500">*</span>
								</Label>
								<Select
									value={formData.tipo}
									onValueChange={(value) =>
										setFormData({ ...formData, tipo: value })
									}
								>
									<SelectTrigger id="tipo">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="sedan">Sedan</SelectItem>
										<SelectItem value="van">Van</SelectItem>
										<SelectItem value="minibus">Minibus</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="marca">Marca</Label>
								<Input
									id="marca"
									placeholder="Toyota"
									value={formData.marca}
									onChange={(e) =>
										setFormData({ ...formData, marca: e.target.value })
									}
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="modelo">Modelo</Label>
								<Input
									id="modelo"
									placeholder="Corolla"
									value={formData.modelo}
									onChange={(e) =>
										setFormData({ ...formData, modelo: e.target.value })
									}
								/>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="anio">Año</Label>
								<Input
									id="anio"
									type="number"
									placeholder="2023"
									value={formData.anio}
									onChange={(e) =>
										setFormData({ ...formData, anio: e.target.value })
									}
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="capacidad">Capacidad (pasajeros)</Label>
								<Input
									id="capacidad"
									type="number"
									min="1"
									max="50"
									value={formData.capacidad}
									onChange={(e) => {
										const v = Number(e.target.value);
										setFormData({
											...formData,
											capacidad: Number.isNaN(v) ? '' : v,
										});
									}}
								/>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="estado">Estado</Label>
							<Select
								value={formData.estado}
								onValueChange={(value) =>
									setFormData({ ...formData, estado: value })
								}
							>
								<SelectTrigger id="estado">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="disponible">Disponible</SelectItem>
									<SelectItem value="en_uso">En Uso</SelectItem>
									<SelectItem value="mantenimiento">Mantenimiento</SelectItem>
									<SelectItem value="inactivo">Inactivo</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label htmlFor="observaciones">Observaciones</Label>
							<Textarea
								id="observaciones"
								placeholder="Notas adicionales sobre el vehículo..."
								value={formData.observaciones}
								onChange={(e) =>
									setFormData({ ...formData, observaciones: e.target.value })
								}
								rows={3}
							/>
						</div>
					</div>

					<div className="flex justify-end gap-2">
						<Button variant="outline" onClick={handleCloseDialog}>
							Cancelar
						</Button>
						<Button onClick={handleSave}>
							{selectedVehiculo ? "Actualizar" : "Crear"}
						</Button>
					</div>
				</DialogContent>
			</Dialog>

			{/* Dialog de confirmación de eliminación */}
			<AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
						<AlertDialogDescription>
							Esta acción eliminará permanentemente el vehículo{" "}
							<strong>{selectedVehiculo?.patente}</strong>. Esta acción no se
							puede deshacer.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel onClick={() => setSelectedVehiculo(null)}>
							Cancelar
						</AlertDialogCancel>
						<AlertDialogAction onClick={handleDelete}>
							Eliminar
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

export default AdminVehiculos;
