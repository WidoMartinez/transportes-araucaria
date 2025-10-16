import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
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
	DialogDescription,
} from "./ui/dialog";
import { Alert, AlertDescription } from "./ui/alert";
import { LoaderCircle, Plus, Edit, Trash2, CheckCircle, XCircle } from "lucide-react";

// Componente de administración de códigos de pago
function AdminCodigosPago() {
	const [codigosPago, setCodigosPago] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [showCrearDialog, setShowCrearDialog] = useState(false);
	const [procesando, setProcesando] = useState(false);

	// Formulario para nuevo código
	const [formData, setFormData] = useState({
		codigo: "",
		origen: "Aeropuerto Temuco",
		destino: "",
		monto: "",
		descripcion: "",
		vehiculo: "",
		pasajeros: 1,
		idaVuelta: false,
		fechaVencimiento: "",
		usosMaximos: 1,
		observaciones: "",
	});

	const backendUrl =
		import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";
	const adminToken = import.meta.env.VITE_ADMIN_TOKEN || "admin-secret-token";

	const formatCurrency = (value) => {
		return new Intl.NumberFormat("es-CL", {
			style: "currency",
			currency: "CLP",
		}).format(value || 0);
	};

	const formatDate = (date) => {
		if (!date) return "-";
		return new Date(date).toLocaleDateString("es-CL", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	// Cargar códigos de pago
	const cargarCodigos = async () => {
		setLoading(true);
		setError("");

		try {
			const response = await fetch(`${backendUrl}/api/codigos-pago`, {
				headers: {
					Authorization: `Bearer ${adminToken}`,
				},
			});

			const data = await response.json();

			if (!response.ok) {
				setError(data.message || "Error al cargar códigos");
				return;
			}

			setCodigosPago(data.codigosPago || []);
		} catch (error) {
			console.error("Error cargando códigos:", error);
			setError("Error al conectar con el servidor");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		cargarCodigos();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Manejar cambios en el formulario
	const handleInputChange = (e) => {
		const { name, value, type, checked } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: type === "checkbox" ? checked : value,
		}));
	};

	// Crear nuevo código de pago
	const crearCodigo = async () => {
		// Validaciones
		if (!formData.codigo.trim()) {
			setError("El código es requerido");
			return;
		}

		if (!formData.destino.trim()) {
			setError("El destino es requerido");
			return;
		}

		if (!formData.monto || parseFloat(formData.monto) <= 0) {
			setError("El monto debe ser mayor a 0");
			return;
		}

		setProcesando(true);
		setError("");

		try {
			const response = await fetch(`${backendUrl}/api/codigos-pago`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${adminToken}`,
				},
				body: JSON.stringify({
					...formData,
					codigo: formData.codigo.toUpperCase(),
					monto: parseFloat(formData.monto),
					pasajeros: parseInt(formData.pasajeros),
					usosMaximos: parseInt(formData.usosMaximos),
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				setError(data.message || "Error al crear código");
				return;
			}

			// Resetear formulario y cerrar dialog
			setFormData({
				codigo: "",
				origen: "Aeropuerto Temuco",
				destino: "",
				monto: "",
				descripcion: "",
				vehiculo: "",
				pasajeros: 1,
				idaVuelta: false,
				fechaVencimiento: "",
				usosMaximos: 1,
				observaciones: "",
			});
			setShowCrearDialog(false);

			// Recargar lista
			cargarCodigos();
		} catch (error) {
			console.error("Error creando código:", error);
			setError("Error al conectar con el servidor");
		} finally {
			setProcesando(false);
		}
	};

	// Eliminar código
	const eliminarCodigo = async (codigo) => {
		if (!confirm(`¿Estás seguro de eliminar el código ${codigo}?`)) {
			return;
		}

		try {
			const response = await fetch(
				`${backendUrl}/api/codigos-pago/${codigo}`,
				{
					method: "DELETE",
					headers: {
						Authorization: `Bearer ${adminToken}`,
					},
				}
			);

			if (!response.ok) {
				const data = await response.json();
				setError(data.message || "Error al eliminar código");
				return;
			}

			// Recargar lista
			cargarCodigos();
		} catch (error) {
			console.error("Error eliminando código:", error);
			setError("Error al conectar con el servidor");
		}
	};

	// Obtener badge según el estado
	const getEstadoBadge = (estado) => {
		const badges = {
			activo: <Badge variant="default" className="bg-green-500">Activo</Badge>,
			usado: <Badge variant="secondary">Usado</Badge>,
			vencido: <Badge variant="destructive">Vencido</Badge>,
			cancelado: <Badge variant="outline">Cancelado</Badge>,
		};
		return badges[estado] || <Badge>{estado}</Badge>;
	};

	return (
		<div className="container mx-auto py-8 px-4">
			<div className="flex justify-between items-center mb-6">
				<div>
					<h1 className="text-3xl font-bold">Códigos de Pago</h1>
					<p className="text-gray-600">
						Gestiona códigos de pago para WhatsApp
					</p>
				</div>
				<Button onClick={() => setShowCrearDialog(true)}>
					<Plus className="h-4 w-4 mr-2" />
					Nuevo Código
				</Button>
			</div>

			{error && (
				<Alert variant="destructive" className="mb-4">
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}

			<Card>
				<CardHeader>
					<CardTitle>Lista de Códigos</CardTitle>
				</CardHeader>
				<CardContent>
					{loading ? (
						<div className="flex justify-center py-8">
							<LoaderCircle className="h-8 w-8 animate-spin" />
						</div>
					) : codigosPago.length === 0 ? (
						<div className="text-center py-8 text-gray-500">
							No hay códigos de pago registrados
						</div>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Código</TableHead>
										<TableHead>Ruta</TableHead>
										<TableHead>Monto</TableHead>
										<TableHead>Estado</TableHead>
										<TableHead>Usos</TableHead>
										<TableHead>Vencimiento</TableHead>
										<TableHead>Acciones</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{codigosPago.map((codigo) => (
										<TableRow key={codigo.id}>
											<TableCell className="font-mono font-bold">
												{codigo.codigo}
											</TableCell>
											<TableCell>
												<div className="text-sm">
													<div>{codigo.origen}</div>
													<div className="text-gray-500">↓</div>
													<div>{codigo.destino}</div>
												</div>
											</TableCell>
											<TableCell>{formatCurrency(codigo.monto)}</TableCell>
											<TableCell>{getEstadoBadge(codigo.estado)}</TableCell>
											<TableCell>
												{codigo.usosActuales} / {codigo.usosMaximos}
											</TableCell>
											<TableCell className="text-sm">
												{formatDate(codigo.fechaVencimiento)}
											</TableCell>
											<TableCell>
												<Button
													variant="ghost"
													size="sm"
													onClick={() => eliminarCodigo(codigo.codigo)}
													disabled={codigo.estado === "usado"}
												>
													<Trash2 className="h-4 w-4 text-red-500" />
												</Button>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Dialog para crear código */}
			<Dialog open={showCrearDialog} onOpenChange={setShowCrearDialog}>
				<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Crear Nuevo Código de Pago</DialogTitle>
						<DialogDescription>
							Completa los datos para generar un código de pago único
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-4">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="codigo">
									Código <span className="text-red-500">*</span>
								</Label>
								<Input
									id="codigo"
									name="codigo"
									value={formData.codigo}
									onChange={handleInputChange}
									placeholder="A-TCO-25"
									className="uppercase"
									required
								/>
								<p className="text-xs text-gray-500">
									Ejemplo: A-TCO-25, P-VLL-30
								</p>
							</div>

							<div className="space-y-2">
								<Label htmlFor="monto">
									Monto <span className="text-red-500">*</span>
								</Label>
								<Input
									id="monto"
									name="monto"
									type="number"
									value={formData.monto}
									onChange={handleInputChange}
									placeholder="25000"
									min="0"
									step="1000"
									required
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="origen">
									Origen <span className="text-red-500">*</span>
								</Label>
								<Input
									id="origen"
									name="origen"
									value={formData.origen}
									onChange={handleInputChange}
									placeholder="Aeropuerto Temuco"
									required
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="destino">
									Destino <span className="text-red-500">*</span>
								</Label>
								<Input
									id="destino"
									name="destino"
									value={formData.destino}
									onChange={handleInputChange}
									placeholder="Temuco Centro"
									required
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="vehiculo">Vehículo</Label>
								<Input
									id="vehiculo"
									name="vehiculo"
									value={formData.vehiculo}
									onChange={handleInputChange}
									placeholder="Sedan, Van, etc."
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="pasajeros">Pasajeros</Label>
								<Input
									id="pasajeros"
									name="pasajeros"
									type="number"
									value={formData.pasajeros}
									onChange={handleInputChange}
									min="1"
									max="15"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="usosMaximos">Usos Máximos</Label>
								<Input
									id="usosMaximos"
									name="usosMaximos"
									type="number"
									value={formData.usosMaximos}
									onChange={handleInputChange}
									min="1"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="fechaVencimiento">Fecha de Vencimiento</Label>
								<Input
									id="fechaVencimiento"
									name="fechaVencimiento"
									type="datetime-local"
									value={formData.fechaVencimiento}
									onChange={handleInputChange}
								/>
							</div>

							<div className="space-y-2 md:col-span-2">
								<Label htmlFor="descripcion">Descripción</Label>
								<textarea
									id="descripcion"
									name="descripcion"
									value={formData.descripcion}
									onChange={handleInputChange}
									placeholder="Descripción del servicio..."
									className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
								/>
							</div>

							<div className="space-y-2 md:col-span-2">
								<Label htmlFor="observaciones">Observaciones</Label>
								<textarea
									id="observaciones"
									name="observaciones"
									value={formData.observaciones}
									onChange={handleInputChange}
									placeholder="Notas internas..."
									className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
								/>
							</div>

							<div className="space-y-2 md:col-span-2">
								<div className="flex items-center space-x-2">
									<input
										type="checkbox"
										id="idaVuelta"
										name="idaVuelta"
										checked={formData.idaVuelta}
										onChange={handleInputChange}
										className="h-4 w-4 rounded border-gray-300"
									/>
									<Label htmlFor="idaVuelta">Incluye ida y vuelta</Label>
								</div>
							</div>
						</div>

						{error && (
							<Alert variant="destructive">
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						)}

						<div className="flex justify-end gap-3 pt-4">
							<Button
								variant="outline"
								onClick={() => setShowCrearDialog(false)}
								disabled={procesando}
							>
								Cancelar
							</Button>
							<Button onClick={crearCodigo} disabled={procesando}>
								{procesando ? (
									<>
										<LoaderCircle className="h-4 w-4 mr-2 animate-spin" />
										Creando...
									</>
								) : (
									"Crear Código"
								)}
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}

export default AdminCodigosPago;
