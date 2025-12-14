import React, { useState, useEffect } from "react";
import { getBackendUrl } from "../lib/backend";
import { useAuthenticatedFetch } from "../hooks/useAuthenticatedFetch";
import { toast } from "sonner";
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
	Plus,
	Edit,
	Trash2,
	Calendar,
	Clock,
	Ban,
	CheckCircle2,
	XCircle,
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

/**
 * Componente para gestionar bloqueos de agenda
 * Permite crear, editar y eliminar bloqueos de fechas y horarios
 */
function AdminBloqueosAgenda() {
	const { authenticatedFetch } = useAuthenticatedFetch();

	const [bloqueos, setBloqueos] = useState([]);
	const [loading, setLoading] = useState(true);
	const [showDialog, setShowDialog] = useState(false);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [bloqueoActual, setBloqueoActual] = useState(null);
	const [bloqueoAEliminar, setBloqueoAEliminar] = useState(null);
	const [saving, setSaving] = useState(false);

	// Estado del formulario
	const [formData, setFormData] = useState({
		fechaInicio: "",
		fechaFin: "",
		horaInicio: "",
		horaFin: "",
		tipo: "dia_completo",
		motivo: "",
		activo: true,
		descripcion: "",
	});

	// Cargar bloqueos al montar el componente
	useEffect(() => {
		cargarBloqueos();
	}, []);

	const cargarBloqueos = async () => {
		try {
			setLoading(true);
			const response = await authenticatedFetch(
				`${getBackendUrl()}/api/bloqueos`
			);
			const data = await response.json();
			setBloqueos(data);
		} catch (error) {
			console.error("Error cargando bloqueos:", error);
			toast.error("Error al cargar los bloqueos");
		} finally {
			setLoading(false);
		}
	};

	const handleNuevoBloqueo = () => {
		setBloqueoActual(null);
		setFormData({
			fechaInicio: "",
			fechaFin: "",
			horaInicio: "",
			horaFin: "",
			tipo: "dia_completo",
			motivo: "",
			activo: true,
			descripcion: "",
		});
		setShowDialog(true);
	};

	const handleEditarBloqueo = (bloqueo) => {
		setBloqueoActual(bloqueo);
		setFormData({
			fechaInicio: bloqueo.fechaInicio || "",
			fechaFin: bloqueo.fechaFin || "",
			horaInicio: bloqueo.horaInicio || "",
			horaFin: bloqueo.horaFin || "",
			tipo: bloqueo.tipo || "dia_completo",
			motivo: bloqueo.motivo || "",
			activo: bloqueo.activo !== false,
			descripcion: bloqueo.descripcion || "",
		});
		setShowDialog(true);
	};

	const handleEliminarBloqueo = (bloqueo) => {
		setBloqueoAEliminar(bloqueo);
		setShowDeleteDialog(true);
	};

	const confirmarEliminacion = async () => {
		if (!bloqueoAEliminar) return;

		try {
			setSaving(true);
			const response = await authenticatedFetch(
				`${getBackendUrl()}/api/bloqueos/${bloqueoAEliminar.id}`,
				{
					method: "DELETE",
				}
			);

			if (response.ok) {
				await cargarBloqueos();
				setShowDeleteDialog(false);
				setBloqueoAEliminar(null);
				toast.success("Bloqueo eliminado correctamente");
			} else {
				const errorData = await response.json();
				toast.error(errorData.error || "Error al eliminar el bloqueo");
			}
		} catch (error) {
			console.error("Error eliminando bloqueo:", error);
			toast.error("Error al eliminar el bloqueo. Por favor, intente nuevamente.");
		} finally {
			setSaving(false);
		}
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setSaving(true);

		try {
			const url = bloqueoActual
				? `${getBackendUrl()}/api/bloqueos/${bloqueoActual.id}`
				: `${getBackendUrl()}/api/bloqueos`;

			const method = bloqueoActual ? "PUT" : "POST";

			const response = await authenticatedFetch(url, {
				method,
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(formData),
			});

			if (response.ok) {
				await cargarBloqueos();
				setShowDialog(false);
				setBloqueoActual(null);
				toast.success(
					bloqueoActual 
						? "Bloqueo actualizado correctamente" 
						: "Bloqueo creado correctamente"
				);
			} else {
				const errorData = await response.json();
				toast.error(errorData.error || "Error al guardar el bloqueo");
			}
		} catch (error) {
			console.error("Error guardando bloqueo:", error);
			toast.error("Error al guardar el bloqueo. Por favor, intente nuevamente.");
		} finally {
			setSaving(false);
		}
	};

	const formatearFecha = (fecha) => {
		if (!fecha) return "-";
		const [año, mes, dia] = fecha.split("-");
		return `${dia}/${mes}/${año}`;
	};

	const formatearHora = (hora) => {
		if (!hora) return "-";
		return hora.substring(0, 5); // Solo HH:MM
	};

	const obtenerBadgeTipo = (tipo) => {
		switch (tipo) {
			case "dia_completo":
				return <Badge variant="default">Día Completo</Badge>;
			case "rango_horario":
				return <Badge variant="secondary">Rango Horario</Badge>;
			case "fecha_especifica":
				return <Badge variant="outline">Fecha Específica</Badge>;
			default:
				return <Badge>{tipo}</Badge>;
		}
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
					<p className="mt-4 text-gray-600">Cargando bloqueos...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Encabezado */}
			<div className="flex justify-between items-center">
				<div>
					<h2 className="text-3xl font-bold">Bloqueos de Agenda</h2>
					<p className="text-muted-foreground mt-1">
						Gestiona fechas y horarios bloqueados para reservas
					</p>
				</div>
				<Button onClick={handleNuevoBloqueo} className="gap-2">
					<Plus className="w-4 h-4" />
					Nuevo Bloqueo
				</Button>
			</div>

			{/* Tabla de bloqueos */}
			<Card>
				<CardHeader>
					<CardTitle>Bloqueos Configurados</CardTitle>
				</CardHeader>
				<CardContent>
					{bloqueos.length === 0 ? (
						<div className="text-center py-12">
							<Ban className="w-12 h-12 text-gray-400 mx-auto mb-4" />
							<p className="text-gray-500">
								No hay bloqueos configurados
							</p>
							<Button
								onClick={handleNuevoBloqueo}
								variant="outline"
								className="mt-4"
							>
								Crear primer bloqueo
							</Button>
						</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Tipo</TableHead>
									<TableHead>Fecha Inicio</TableHead>
									<TableHead>Fecha Fin</TableHead>
									<TableHead>Horario</TableHead>
									<TableHead>Motivo</TableHead>
									<TableHead>Estado</TableHead>
									<TableHead>Acciones</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{bloqueos.map((bloqueo) => (
									<TableRow key={bloqueo.id}>
										<TableCell>
											{obtenerBadgeTipo(bloqueo.tipo)}
										</TableCell>
										<TableCell>
											{formatearFecha(bloqueo.fechaInicio)}
										</TableCell>
										<TableCell>
											{formatearFecha(bloqueo.fechaFin)}
										</TableCell>
										<TableCell>
											{bloqueo.tipo === "rango_horario"
												? `${formatearHora(bloqueo.horaInicio)} - ${formatearHora(bloqueo.horaFin)}`
												: "-"}
										</TableCell>
										<TableCell>
											<span className="text-sm">
												{bloqueo.motivo || "Sin motivo"}
											</span>
										</TableCell>
										<TableCell>
											{bloqueo.activo ? (
												<Badge
													variant="default"
													className="bg-green-500"
												>
													<CheckCircle2 className="w-3 h-3 mr-1" />
													Activo
												</Badge>
											) : (
												<Badge variant="secondary">
													<XCircle className="w-3 h-3 mr-1" />
													Inactivo
												</Badge>
											)}
										</TableCell>
										<TableCell>
											<div className="flex gap-2">
												<Button
													variant="ghost"
													size="sm"
													onClick={() =>
														handleEditarBloqueo(bloqueo)
													}
												>
													<Edit className="w-4 h-4" />
												</Button>
												<Button
													variant="ghost"
													size="sm"
													onClick={() =>
														handleEliminarBloqueo(bloqueo)
													}
													className="text-red-600 hover:text-red-700"
												>
													<Trash2 className="w-4 h-4" />
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

			{/* Dialog para crear/editar bloqueo */}
			<Dialog open={showDialog} onOpenChange={setShowDialog}>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle>
							{bloqueoActual ? "Editar Bloqueo" : "Nuevo Bloqueo"}
						</DialogTitle>
						<DialogDescription>
							Configura un bloqueo para restringir reservas en fechas u
							horarios específicos
						</DialogDescription>
					</DialogHeader>

					<form onSubmit={handleSubmit} className="space-y-4">
						{/* Tipo de bloqueo */}
						<div>
							<Label>Tipo de Bloqueo</Label>
							<Select
								value={formData.tipo}
								onValueChange={(value) =>
									setFormData({ ...formData, tipo: value })
								}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="dia_completo">
										Día Completo
									</SelectItem>
									<SelectItem value="rango_horario">
										Rango Horario
									</SelectItem>
									<SelectItem value="fecha_especifica">
										Fecha Específica
									</SelectItem>
								</SelectContent>
							</Select>
						</div>

						{/* Fechas */}
						<div className="grid grid-cols-2 gap-4">
							<div>
								<Label>Fecha Inicio *</Label>
								<Input
									type="date"
									value={formData.fechaInicio}
									onChange={(e) =>
										setFormData({
											...formData,
											fechaInicio: e.target.value,
										})
									}
									required
								/>
							</div>
							<div>
								<Label>
									Fecha Fin{" "}
									{formData.tipo !== "fecha_especifica" &&
										"(opcional)"}
								</Label>
								<Input
									type="date"
									value={formData.fechaFin}
									onChange={(e) =>
										setFormData({
											...formData,
											fechaFin: e.target.value,
										})
									}
									disabled={formData.tipo === "fecha_especifica"}
								/>
							</div>
						</div>

						{/* Horarios (solo para rango_horario) */}
						{formData.tipo === "rango_horario" && (
							<div className="grid grid-cols-2 gap-4">
								<div>
									<Label>Hora Inicio</Label>
									<Input
										type="time"
										value={formData.horaInicio}
										onChange={(e) =>
											setFormData({
												...formData,
												horaInicio: e.target.value,
											})
										}
									/>
								</div>
								<div>
									<Label>Hora Fin</Label>
									<Input
										type="time"
										value={formData.horaFin}
										onChange={(e) =>
											setFormData({
												...formData,
												horaFin: e.target.value,
											})
										}
									/>
								</div>
							</div>
						)}

						{/* Motivo */}
						<div>
							<Label>Motivo</Label>
							<Input
								value={formData.motivo}
								onChange={(e) =>
									setFormData({ ...formData, motivo: e.target.value })
								}
								placeholder="Ej: Mantenimiento, Festivo, Evento especial"
							/>
						</div>

						{/* Descripción */}
						<div>
							<Label>Descripción (opcional)</Label>
							<Textarea
								value={formData.descripcion}
								onChange={(e) =>
									setFormData({
										...formData,
										descripcion: e.target.value,
									})
								}
								placeholder="Descripción adicional sobre el bloqueo"
								rows={3}
							/>
						</div>

						{/* Estado activo */}
						<div className="flex items-center gap-2">
							<input
								type="checkbox"
								id="activo"
								checked={formData.activo}
								onChange={(e) =>
									setFormData({
										...formData,
										activo: e.target.checked,
									})
								}
								className="w-4 h-4"
							/>
							<Label htmlFor="activo">Bloqueo activo</Label>
						</div>

						{/* Botones */}
						<div className="flex justify-end gap-2 pt-4">
							<Button
								type="button"
								variant="outline"
								onClick={() => setShowDialog(false)}
								disabled={saving}
							>
								Cancelar
							</Button>
							<Button type="submit" disabled={saving}>
								{saving
									? "Guardando..."
									: bloqueoActual
										? "Actualizar"
										: "Crear"}
							</Button>
						</div>
					</form>
				</DialogContent>
			</Dialog>

			{/* Dialog de confirmación de eliminación */}
			<AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>¿Eliminar bloqueo?</AlertDialogTitle>
						<AlertDialogDescription>
							Esta acción no se puede deshacer. El bloqueo será eliminado
							permanentemente y las fechas/horarios volverán a estar
							disponibles para reservas.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={saving}>
							Cancelar
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={confirmarEliminacion}
							disabled={saving}
							className="bg-red-600 hover:bg-red-700"
						>
							{saving ? "Eliminando..." : "Eliminar"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

export default AdminBloqueosAgenda;
