// src/components/AdminConductores.jsx
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
	User,
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

function AdminConductores() {
	const [conductores, setConductores] = useState([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");
	const [filterEstado, setFilterEstado] = useState("todos");
	const [showDialog, setShowDialog] = useState(false);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [selectedConductor, setSelectedConductor] = useState(null);
	const [formData, setFormData] = useState({
		nombre: "",
		rut: "",
		telefono: "",
		email: "",
		licencia: "",
		fechaVencimientoLicencia: "",
		estado: "disponible",
		observaciones: "",
	});

	// Cargar conductores al montar el componente
	useEffect(() => {
		fetchConductores();
	}, []);

	const fetchConductores = async () => {
		try {
			setLoading(true);
			const response = await fetch(`${API_BASE_URL}/api/conductores`);
			const data = await response.json();
			setConductores(data.conductores || []);
		} catch (error) {
			console.error("Error cargando conductores:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleOpenDialog = (conductor = null) => {
		if (conductor) {
			// Editar conductor existente
			setSelectedConductor(conductor);
			setFormData({
				nombre: conductor.nombre || "",
				rut: conductor.rut || "",
				telefono: conductor.telefono || "",
				email: conductor.email || "",
				licencia: conductor.licencia || "",
				fechaVencimientoLicencia: conductor.fechaVencimientoLicencia
					? new Date(conductor.fechaVencimientoLicencia)
							.toISOString()
							.split("T")[0]
					: "",
				estado: conductor.estado || "disponible",
				observaciones: conductor.observaciones || "",
			});
		} else {
			// Nuevo conductor
			setSelectedConductor(null);
			setFormData({
				nombre: "",
				rut: "",
				telefono: "",
				email: "",
				licencia: "",
				fechaVencimientoLicencia: "",
				estado: "disponible",
				observaciones: "",
			});
		}
		setShowDialog(true);
	};

	const handleCloseDialog = () => {
		setShowDialog(false);
		setSelectedConductor(null);
		setFormData({
			nombre: "",
			rut: "",
			telefono: "",
			email: "",
			licencia: "",
			fechaVencimientoLicencia: "",
			estado: "disponible",
			observaciones: "",
		});
	};

	const handleSave = async () => {
		try {
			// Validaciones básicas
			if (!formData.nombre || !formData.rut || !formData.telefono) {
				alert("Nombre, RUT y teléfono son obligatorios");
				return;
			}

			const url = selectedConductor
				? `${API_BASE_URL}/api/conductores/${selectedConductor.id}`
				: `${API_BASE_URL}/api/conductores`;

			const method = selectedConductor ? "PUT" : "POST";

			const response = await fetch(url, {
				method,
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(formData),
			});

			const data = await response.json();

			if (response.ok) {
				await fetchConductores();
				handleCloseDialog();
			} else {
				alert(data.error || "Error al guardar el conductor");
			}
		} catch (error) {
			console.error("Error guardando conductor:", error);
			alert("Error al guardar el conductor");
		}
	};

	const handleDelete = async () => {
		try {
			const response = await fetch(
				`${API_BASE_URL}/api/conductores/${selectedConductor.id}`,
				{
					method: "DELETE",
				}
			);

			if (response.ok) {
				await fetchConductores();
				setShowDeleteDialog(false);
				setSelectedConductor(null);
			} else {
				const data = await response.json();
				alert(data.error || "Error al eliminar el conductor");
			}
		} catch (error) {
			console.error("Error eliminando conductor:", error);
			alert("Error al eliminar el conductor");
		}
	};

	// Filtrar conductores
	const filteredConductores = conductores.filter((conductor) => {
		const matchSearch =
			searchTerm === "" ||
			conductor.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
			conductor.rut.toLowerCase().includes(searchTerm.toLowerCase()) ||
			(conductor.telefono &&
				conductor.telefono.toLowerCase().includes(searchTerm.toLowerCase()));

		const matchEstado =
			filterEstado === "todos" || conductor.estado === filterEstado;

		return matchSearch && matchEstado;
	});

	const getEstadoBadge = (estado) => {
		const badges = {
			disponible: "bg-green-500",
			ocupado: "bg-blue-500",
			descanso: "bg-yellow-500",
			inactivo: "bg-gray-500",
		};
		const labels = {
			disponible: "Disponible",
			ocupado: "Ocupado",
			descanso: "Descanso",
			inactivo: "Inactivo",
		};
		return (
			<Badge className={badges[estado] || "bg-gray-500"}>
				{labels[estado] || estado}
			</Badge>
		);
	};

	const formatFecha = (fecha) => {
		if (!fecha) return "-";
		return new Date(fecha).toLocaleDateString("es-CL");
	};

	if (loading) {
		return (
			<div className="flex h-screen items-center justify-center">
				<p>Cargando conductores...</p>
			</div>
		);
	}

	return (
		<div className="container mx-auto px-4 py-6">
			<div className="mb-6">
				<div className="flex items-center justify-between mb-4">
					<div>
						<h1 className="text-3xl font-bold flex items-center gap-2">
							<User className="h-8 w-8" />
							Gestión de Conductores
						</h1>
						<p className="text-muted-foreground mt-1">
							Administra los conductores del sistema
						</p>
					</div>
					<Button onClick={() => handleOpenDialog()} className="gap-2">
						<Plus className="h-4 w-4" />
						Nuevo Conductor
					</Button>
				</div>

				{/* Filtros y búsqueda */}
				<Card>
					<CardContent className="pt-6">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label>Buscar</Label>
								<div className="relative">
									<Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
									<Input
										placeholder="Nombre, RUT o teléfono..."
										value={searchTerm}
										onChange={(e) => setSearchTerm(e.target.value)}
										className="pl-8"
									/>
								</div>
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
										<SelectItem value="ocupado">Ocupado</SelectItem>
										<SelectItem value="descanso">Descanso</SelectItem>
										<SelectItem value="inactivo">Inactivo</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Tabla de conductores */}
			<Card>
				<CardHeader>
					<CardTitle>
						Conductores Registrados ({filteredConductores.length})
					</CardTitle>
				</CardHeader>
				<CardContent>
					{filteredConductores.length === 0 ? (
						<div className="text-center py-12">
							<AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
							<p className="text-muted-foreground">
								No se encontraron conductores
							</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Nombre</TableHead>
										<TableHead>RUT</TableHead>
										<TableHead>Teléfono</TableHead>
										<TableHead>Licencia</TableHead>
										<TableHead>Vencimiento</TableHead>
										<TableHead>Estado</TableHead>
										<TableHead className="text-right">Acciones</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredConductores.map((conductor) => (
										<TableRow key={conductor.id}>
											<TableCell className="font-medium">
												{conductor.nombre}
											</TableCell>
											<TableCell>{conductor.rut}</TableCell>
											<TableCell>{conductor.telefono}</TableCell>
											<TableCell>{conductor.licencia || "-"}</TableCell>
											<TableCell>
												{formatFecha(conductor.fechaVencimientoLicencia)}
											</TableCell>
											<TableCell>{getEstadoBadge(conductor.estado)}</TableCell>
											<TableCell className="text-right">
												<div className="flex justify-end gap-2">
													<Button
														variant="outline"
														size="sm"
														onClick={() => handleOpenDialog(conductor)}
													>
														<Edit className="h-4 w-4" />
													</Button>
													<Button
														variant="destructive"
														size="sm"
														onClick={() => {
															setSelectedConductor(conductor);
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

			{/* Dialog para crear/editar conductor */}
			<Dialog open={showDialog} onOpenChange={setShowDialog}>
				<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>
							{selectedConductor ? "Editar Conductor" : "Nuevo Conductor"}
						</DialogTitle>
						<DialogDescription>
							{selectedConductor
								? "Modifica los datos del conductor"
								: "Completa los datos del nuevo conductor"}
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="nombre">
								Nombre Completo <span className="text-red-500">*</span>
							</Label>
							<Input
								id="nombre"
								placeholder="Juan Pérez González"
								value={formData.nombre}
								onChange={(e) =>
									setFormData({ ...formData, nombre: e.target.value })
								}
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="rut">
									RUT <span className="text-red-500">*</span>
								</Label>
								<Input
									id="rut"
									placeholder="12345678-9"
									value={formData.rut}
									onChange={(e) =>
										setFormData({ ...formData, rut: e.target.value })
									}
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="telefono">
									Teléfono <span className="text-red-500">*</span>
								</Label>
								<Input
									id="telefono"
									placeholder="+56912345678"
									value={formData.telefono}
									onChange={(e) =>
										setFormData({ ...formData, telefono: e.target.value })
									}
								/>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								type="email"
								placeholder="conductor@ejemplo.cl"
								value={formData.email}
								onChange={(e) =>
									setFormData({ ...formData, email: e.target.value })
								}
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="licencia">Número de Licencia</Label>
								<Input
									id="licencia"
									placeholder="A1-12345678"
									value={formData.licencia}
									onChange={(e) =>
										setFormData({ ...formData, licencia: e.target.value })
									}
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="fechaVencimientoLicencia">
									Vencimiento Licencia
								</Label>
								<Input
									id="fechaVencimientoLicencia"
									type="date"
									value={formData.fechaVencimientoLicencia}
									onChange={(e) =>
										setFormData({
											...formData,
											fechaVencimientoLicencia: e.target.value,
										})
									}
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
									<SelectItem value="ocupado">Ocupado</SelectItem>
									<SelectItem value="descanso">Descanso</SelectItem>
									<SelectItem value="inactivo">Inactivo</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label htmlFor="observaciones">Observaciones</Label>
							<Textarea
								id="observaciones"
								placeholder="Notas adicionales sobre el conductor..."
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
							{selectedConductor ? "Actualizar" : "Crear"}
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
							Esta acción eliminará permanentemente al conductor{" "}
							<strong>{selectedConductor?.nombre}</strong>. Esta acción no se
							puede deshacer.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel onClick={() => setSelectedConductor(null)}>
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

export default AdminConductores;
