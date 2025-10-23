import React, { useState, useEffect } from "react";
import { getBackendUrl } from "../lib/backend";
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
	DialogTrigger,
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
	DollarSign,
	Plus,
	Edit,
	Trash2,
	Fuel,
	CreditCard,
	User,
	Car,
	Receipt,
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

const TIPOS_GASTO = [
	{ value: "combustible", label: "Combustible", icon: Fuel },
	{ value: "comision_flow", label: "Comisión Flow (3.19%)", icon: CreditCard },
	{ value: "pago_conductor", label: "Pago al Conductor", icon: User },
	{ value: "peaje", label: "Peaje", icon: Receipt },
	{ value: "mantenimiento", label: "Mantenimiento", icon: Car },
	{ value: "estacionamiento", label: "Estacionamiento", icon: Car },
	{ value: "otro", label: "Otro", icon: DollarSign },
];

function AdminGastos() {
	const ADMIN_TOKEN =
		import.meta.env.VITE_ADMIN_TOKEN ||
		(typeof window !== "undefined"
			? localStorage.getItem("adminToken") || ""
			: "");

	const apiUrl = getBackendUrl() || "https://transportes-araucaria.onrender.com";

	const [reservas, setReservas] = useState([]);
	const [reservaSeleccionada, setReservaSeleccionada] = useState(null);
	const [gastos, setGastos] = useState([]);
	const [totalGastos, setTotalGastos] = useState(0);
	const [loading, setLoading] = useState(false);
	const [showNewDialog, setShowNewDialog] = useState(false);
	const [showEditDialog, setShowEditDialog] = useState(false);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [gastoToDelete, setGastoToDelete] = useState(null);
	const [conductores, setConductores] = useState([]);
	const [vehiculos, setVehiculos] = useState([]);

	const [formData, setFormData] = useState({
		tipoGasto: "",
		monto: "",
		porcentaje: "",
		descripcion: "",
		fecha: new Date().toISOString().split("T")[0],
		comprobante: "",
		conductorId: "",
		vehiculoId: "",
		observaciones: "",
	});

	const [editingGasto, setEditingGasto] = useState(null);

	useEffect(() => {
		fetchReservas();
		fetchConductores();
		fetchVehiculos();
	}, []);

	useEffect(() => {
		if (reservaSeleccionada) {
			fetchGastos(reservaSeleccionada.id);
		}
	}, [reservaSeleccionada]);

	const fetchReservas = async () => {
		try {
			const response = await fetch(`${apiUrl}/api/reservas`, {
				headers: {
					Authorization: `Bearer ${ADMIN_TOKEN}`,
				},
			});
			if (response.ok) {
				const data = await response.json();
				setReservas(data.reservas || []);
			}
		} catch (error) {
			console.error("Error al cargar reservas:", error);
		}
	};

	const fetchConductores = async () => {
		try {
			const response = await fetch(`${apiUrl}/api/conductores`, {
				headers: {
					Authorization: `Bearer ${ADMIN_TOKEN}`,
				},
			});
			if (response.ok) {
				const data = await response.json();
				setConductores(data.conductores || []);
			}
		} catch (error) {
			console.error("Error al cargar conductores:", error);
		}
	};

	const fetchVehiculos = async () => {
		try {
			const response = await fetch(`${apiUrl}/api/vehiculos`, {
				headers: {
					Authorization: `Bearer ${ADMIN_TOKEN}`,
				},
			});
			if (response.ok) {
				const data = await response.json();
				setVehiculos(data.vehiculos || []);
			}
		} catch (error) {
			console.error("Error al cargar vehículos:", error);
		}
	};

	const fetchGastos = async (reservaId) => {
		setLoading(true);
		try {
			const response = await fetch(`${apiUrl}/api/reservas/${reservaId}/gastos`, {
				headers: {
					Authorization: `Bearer ${ADMIN_TOKEN}`,
				},
			});
			if (response.ok) {
				const data = await response.json();
				setGastos(data.gastos || []);
				setTotalGastos(data.totalGastos || 0);
			}
		} catch (error) {
			console.error("Error al cargar gastos:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleCreateGasto = async () => {
		if (!reservaSeleccionada) {
			alert("Selecciona una reserva primero");
			return;
		}

		if (!formData.tipoGasto || !formData.monto) {
			alert("Completa los campos requeridos");
			return;
		}

		setLoading(true);
		try {
			const response = await fetch(`${apiUrl}/api/gastos`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${ADMIN_TOKEN}`,
				},
				body: JSON.stringify({
					reservaId: reservaSeleccionada.id,
					...formData,
					conductorId: formData.conductorId || null,
					vehiculoId: formData.vehiculoId || null,
				}),
			});

			if (response.ok) {
				await fetchGastos(reservaSeleccionada.id);
				setShowNewDialog(false);
				resetForm();
			} else {
				const error = await response.json();
				alert(`Error: ${error.error}`);
			}
		} catch (error) {
			console.error("Error al crear gasto:", error);
			alert("Error al crear gasto");
		} finally {
			setLoading(false);
		}
	};

	const handleUpdateGasto = async () => {
		if (!editingGasto) return;

		setLoading(true);
		try {
			const response = await fetch(`${apiUrl}/api/gastos/${editingGasto.id}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${ADMIN_TOKEN}`,
				},
				body: JSON.stringify({
					...formData,
					conductorId: formData.conductorId || null,
					vehiculoId: formData.vehiculoId || null,
				}),
			});

			if (response.ok) {
				await fetchGastos(reservaSeleccionada.id);
				setShowEditDialog(false);
				resetForm();
				setEditingGasto(null);
			} else {
				const error = await response.json();
				alert(`Error: ${error.error}`);
			}
		} catch (error) {
			console.error("Error al actualizar gasto:", error);
			alert("Error al actualizar gasto");
		} finally {
			setLoading(false);
		}
	};

	const handleDeleteGasto = async () => {
		if (!gastoToDelete) return;

		setLoading(true);
		try {
			const response = await fetch(`${apiUrl}/api/gastos/${gastoToDelete.id}`, {
				method: "DELETE",
				headers: {
					Authorization: `Bearer ${ADMIN_TOKEN}`,
				},
			});

			if (response.ok) {
				await fetchGastos(reservaSeleccionada.id);
				setShowDeleteDialog(false);
				setGastoToDelete(null);
			} else {
				const error = await response.json();
				alert(`Error: ${error.error}`);
			}
		} catch (error) {
			console.error("Error al eliminar gasto:", error);
			alert("Error al eliminar gasto");
		} finally {
			setLoading(false);
		}
	};

	const openEditDialog = (gasto) => {
		setEditingGasto(gasto);
		setFormData({
			tipoGasto: gasto.tipoGasto,
			monto: gasto.monto,
			porcentaje: gasto.porcentaje || "",
			descripcion: gasto.descripcion || "",
			fecha: gasto.fecha ? new Date(gasto.fecha).toISOString().split("T")[0] : "",
			comprobante: gasto.comprobante || "",
			conductorId: gasto.conductorId || "",
			vehiculoId: gasto.vehiculoId || "",
			observaciones: gasto.observaciones || "",
		});
		setShowEditDialog(true);
	};

	const resetForm = () => {
		setFormData({
			tipoGasto: "",
			monto: "",
			porcentaje: "",
			descripcion: "",
			fecha: new Date().toISOString().split("T")[0],
			comprobante: "",
			conductorId: "",
			vehiculoId: "",
			observaciones: "",
		});
	};

	const calcularMontoComisionFlow = () => {
		if (formData.tipoGasto === "comision_flow" && reservaSeleccionada) {
			const porcentaje = 3.19;
			const monto = (parseFloat(reservaSeleccionada.totalConDescuento) * porcentaje) / 100;
			setFormData({ ...formData, porcentaje: porcentaje.toString(), monto: monto.toFixed(2) });
		}
	};

	useEffect(() => {
		if (formData.tipoGasto === "comision_flow") {
			calcularMontoComisionFlow();
		}
	}, [formData.tipoGasto]);

	const getTipoGastoLabel = (tipo) => {
		const tipoObj = TIPOS_GASTO.find((t) => t.value === tipo);
		return tipoObj ? tipoObj.label : tipo;
	};

	const getTipoGastoIcon = (tipo) => {
		const tipoObj = TIPOS_GASTO.find((t) => t.value === tipo);
		const Icon = tipoObj ? tipoObj.icon : DollarSign;
		return <Icon className="w-4 h-4" />;
	};

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<h2 className="text-2xl font-bold">Gestión de Gastos</h2>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Seleccionar Reserva</CardTitle>
				</CardHeader>
				<CardContent>
					<Select
						value={reservaSeleccionada?.id?.toString() || ""}
						onValueChange={(value) => {
							const reserva = reservas.find((r) => r.id.toString() === value);
							setReservaSeleccionada(reserva);
						}}
					>
						<SelectTrigger>
							<SelectValue placeholder="Selecciona una reserva" />
						</SelectTrigger>
						<SelectContent>
							{reservas.map((reserva) => (
								<SelectItem key={reserva.id} value={reserva.id.toString()}>
									{reserva.codigoReserva} - {reserva.nombre} - {reserva.origen} → {reserva.destino} - ${reserva.totalConDescuento}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</CardContent>
			</Card>

			{reservaSeleccionada && (
				<>
					<Card>
						<CardHeader className="flex flex-row items-center justify-between">
							<div>
								<CardTitle>Gastos de la Reserva</CardTitle>
								<p className="text-sm text-muted-foreground mt-1">
									{reservaSeleccionada.codigoReserva} - {reservaSeleccionada.nombre}
								</p>
							</div>
							<div className="flex items-center gap-4">
								<div className="text-right">
									<p className="text-sm text-muted-foreground">Total Gastos</p>
									<p className="text-2xl font-bold text-red-600">
										${totalGastos.toLocaleString("es-CL")}
									</p>
								</div>
								<Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
									<DialogTrigger asChild>
										<Button onClick={resetForm}>
											<Plus className="w-4 h-4 mr-2" />
											Nuevo Gasto
										</Button>
									</DialogTrigger>
									<DialogContent className="max-w-2xl">
										<DialogHeader>
											<DialogTitle>Registrar Nuevo Gasto</DialogTitle>
											<DialogDescription>
												Registra un gasto asociado a esta reserva
											</DialogDescription>
										</DialogHeader>
										<div className="space-y-4">
											<div>
												<Label>Tipo de Gasto *</Label>
												<Select
													value={formData.tipoGasto}
													onValueChange={(value) =>
														setFormData({ ...formData, tipoGasto: value })
													}
												>
													<SelectTrigger>
														<SelectValue placeholder="Selecciona el tipo" />
													</SelectTrigger>
													<SelectContent>
														{TIPOS_GASTO.map((tipo) => (
															<SelectItem key={tipo.value} value={tipo.value}>
																{tipo.label}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</div>

											{formData.tipoGasto === "comision_flow" && (
												<div className="bg-blue-50 p-3 rounded-md">
													<p className="text-sm text-blue-800">
														<AlertCircle className="w-4 h-4 inline mr-2" />
														El monto se calculará automáticamente como el 3.19% del total de la reserva
													</p>
												</div>
											)}

											<div className="grid grid-cols-2 gap-4">
												<div>
													<Label>Monto *</Label>
													<Input
														type="number"
														step="0.01"
														value={formData.monto}
														onChange={(e) =>
															setFormData({ ...formData, monto: e.target.value })
														}
														disabled={formData.tipoGasto === "comision_flow"}
													/>
												</div>
												<div>
													<Label>Fecha *</Label>
													<Input
														type="date"
														value={formData.fecha}
														onChange={(e) =>
															setFormData({ ...formData, fecha: e.target.value })
														}
													/>
												</div>
											</div>

											<div>
												<Label>Conductor</Label>
												<Select
													value={formData.conductorId}
													onValueChange={(value) =>
														setFormData({ ...formData, conductorId: value })
													}
												>
													<SelectTrigger>
														<SelectValue placeholder="Selecciona un conductor (opcional)" />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="">Ninguno</SelectItem>
														{conductores.map((conductor) => (
															<SelectItem
																key={conductor.id}
																value={conductor.id.toString()}
															>
																{conductor.nombre} {conductor.apellido}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</div>

											<div>
												<Label>Vehículo</Label>
												<Select
													value={formData.vehiculoId}
													onValueChange={(value) =>
														setFormData({ ...formData, vehiculoId: value })
													}
												>
													<SelectTrigger>
														<SelectValue placeholder="Selecciona un vehículo (opcional)" />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="">Ninguno</SelectItem>
														{vehiculos.map((vehiculo) => (
															<SelectItem
																key={vehiculo.id}
																value={vehiculo.id.toString()}
															>
																{vehiculo.patente} - {vehiculo.marca} {vehiculo.modelo}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</div>

											<div>
												<Label>Descripción</Label>
												<Textarea
													value={formData.descripcion}
													onChange={(e) =>
														setFormData({ ...formData, descripcion: e.target.value })
													}
													placeholder="Descripción del gasto"
												/>
											</div>

											<div>
												<Label>Comprobante</Label>
												<Input
													value={formData.comprobante}
													onChange={(e) =>
														setFormData({ ...formData, comprobante: e.target.value })
													}
													placeholder="Número de comprobante o referencia"
												/>
											</div>

											<div>
												<Label>Observaciones</Label>
												<Textarea
													value={formData.observaciones}
													onChange={(e) =>
														setFormData({ ...formData, observaciones: e.target.value })
													}
													placeholder="Observaciones adicionales"
												/>
											</div>

											<div className="flex justify-end gap-2">
												<Button
													variant="outline"
													onClick={() => {
														setShowNewDialog(false);
														resetForm();
													}}
												>
													Cancelar
												</Button>
												<Button onClick={handleCreateGasto} disabled={loading}>
													{loading ? "Guardando..." : "Guardar Gasto"}
												</Button>
											</div>
										</div>
									</DialogContent>
								</Dialog>
							</div>
						</CardHeader>
						<CardContent>
							{loading ? (
								<p>Cargando gastos...</p>
							) : gastos.length === 0 ? (
								<p className="text-muted-foreground text-center py-8">
									No hay gastos registrados para esta reserva
								</p>
							) : (
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Tipo</TableHead>
											<TableHead>Monto</TableHead>
											<TableHead>Fecha</TableHead>
											<TableHead>Conductor</TableHead>
											<TableHead>Vehículo</TableHead>
											<TableHead>Descripción</TableHead>
											<TableHead>Acciones</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{gastos.map((gasto) => (
											<TableRow key={gasto.id}>
												<TableCell>
													<div className="flex items-center gap-2">
														{getTipoGastoIcon(gasto.tipoGasto)}
														<span>{getTipoGastoLabel(gasto.tipoGasto)}</span>
													</div>
												</TableCell>
												<TableCell className="font-semibold">
													${parseFloat(gasto.monto).toLocaleString("es-CL")}
												</TableCell>
												<TableCell>
													{new Date(gasto.fecha).toLocaleDateString("es-CL")}
												</TableCell>
												<TableCell>
													{gasto.conductor
														? `${gasto.conductor.nombre} ${gasto.conductor.apellido}`
														: "-"}
												</TableCell>
												<TableCell>
													{gasto.vehiculo
														? `${gasto.vehiculo.patente}`
														: "-"}
												</TableCell>
												<TableCell className="max-w-xs truncate">
													{gasto.descripcion || "-"}
												</TableCell>
												<TableCell>
													<div className="flex gap-2">
														<Button
															variant="ghost"
															size="sm"
															onClick={() => openEditDialog(gasto)}
														>
															<Edit className="w-4 h-4" />
														</Button>
														<Button
															variant="ghost"
															size="sm"
															onClick={() => {
																setGastoToDelete(gasto);
																setShowDeleteDialog(true);
															}}
														>
															<Trash2 className="w-4 h-4 text-red-600" />
														</Button>
													</div>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							)}
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Resumen Financiero</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-3 gap-4">
								<div className="p-4 bg-green-50 rounded-lg">
									<p className="text-sm text-green-800 font-medium">Total Reserva</p>
									<p className="text-2xl font-bold text-green-600">
										${parseFloat(reservaSeleccionada.totalConDescuento).toLocaleString("es-CL")}
									</p>
								</div>
								<div className="p-4 bg-red-50 rounded-lg">
									<p className="text-sm text-red-800 font-medium">Total Gastos</p>
									<p className="text-2xl font-bold text-red-600">
										${totalGastos.toLocaleString("es-CL")}
									</p>
								</div>
								<div className="p-4 bg-blue-50 rounded-lg">
									<p className="text-sm text-blue-800 font-medium">Utilidad Neta</p>
									<p className="text-2xl font-bold text-blue-600">
										${(parseFloat(reservaSeleccionada.totalConDescuento) - totalGastos).toLocaleString("es-CL")}
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</>
			)}

			<Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle>Editar Gasto</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<div>
							<Label>Tipo de Gasto *</Label>
							<Select
								value={formData.tipoGasto}
								onValueChange={(value) =>
									setFormData({ ...formData, tipoGasto: value })
								}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{TIPOS_GASTO.map((tipo) => (
										<SelectItem key={tipo.value} value={tipo.value}>
											{tipo.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div>
								<Label>Monto *</Label>
								<Input
									type="number"
									step="0.01"
									value={formData.monto}
									onChange={(e) =>
										setFormData({ ...formData, monto: e.target.value })
									}
								/>
							</div>
							<div>
								<Label>Fecha *</Label>
								<Input
									type="date"
									value={formData.fecha}
									onChange={(e) =>
										setFormData({ ...formData, fecha: e.target.value })
									}
								/>
							</div>
						</div>

						<div>
							<Label>Conductor</Label>
							<Select
								value={formData.conductorId}
								onValueChange={(value) =>
									setFormData({ ...formData, conductorId: value })
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="Selecciona un conductor (opcional)" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="">Ninguno</SelectItem>
									{conductores.map((conductor) => (
										<SelectItem
											key={conductor.id}
											value={conductor.id.toString()}
										>
											{conductor.nombre} {conductor.apellido}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div>
							<Label>Vehículo</Label>
							<Select
								value={formData.vehiculoId}
								onValueChange={(value) =>
									setFormData({ ...formData, vehiculoId: value })
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="Selecciona un vehículo (opcional)" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="">Ninguno</SelectItem>
									{vehiculos.map((vehiculo) => (
										<SelectItem
											key={vehiculo.id}
											value={vehiculo.id.toString()}
										>
											{vehiculo.patente} - {vehiculo.marca} {vehiculo.modelo}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div>
							<Label>Descripción</Label>
							<Textarea
								value={formData.descripcion}
								onChange={(e) =>
									setFormData({ ...formData, descripcion: e.target.value })
								}
							/>
						</div>

						<div>
							<Label>Comprobante</Label>
							<Input
								value={formData.comprobante}
								onChange={(e) =>
									setFormData({ ...formData, comprobante: e.target.value })
								}
							/>
						</div>

						<div>
							<Label>Observaciones</Label>
							<Textarea
								value={formData.observaciones}
								onChange={(e) =>
									setFormData({ ...formData, observaciones: e.target.value })
								}
							/>
						</div>

						<div className="flex justify-end gap-2">
							<Button
								variant="outline"
								onClick={() => {
									setShowEditDialog(false);
									resetForm();
									setEditingGasto(null);
								}}
							>
								Cancelar
							</Button>
							<Button onClick={handleUpdateGasto} disabled={loading}>
								{loading ? "Guardando..." : "Guardar Cambios"}
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			<AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>¿Eliminar gasto?</AlertDialogTitle>
						<AlertDialogDescription>
							Esta acción no se puede deshacer. El gasto será eliminado permanentemente.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel onClick={() => setGastoToDelete(null)}>
							Cancelar
						</AlertDialogCancel>
						<AlertDialogAction onClick={handleDeleteGasto} disabled={loading}>
							{loading ? "Eliminando..." : "Eliminar"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

export default AdminGastos;
