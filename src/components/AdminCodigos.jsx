import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";
import {
	Plus,
	Edit,
	Trash2,
	Copy,
	CheckCircle2,
	XCircle,
	Calendar,
	Users,
	Target,
	RotateCcw,
	LoaderCircle,
} from "lucide-react";

function AdminCodigos() {
	const [codigos, setCodigos] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [showForm, setShowForm] = useState(false);
	const [editingCodigo, setEditingCodigo] = useState(null);
	const [deleteId, setDeleteId] = useState("");
	const [deleting, setDeleting] = useState(false);
	const [selectedCodigo, setSelectedCodigo] = useState("");
	const [selectedUsuario, setSelectedUsuario] = useState("");
	const [deletingUser, setDeletingUser] = useState(false);
	const [formData, setFormData] = useState({
		codigo: "",
		descripcion: "",
		tipo: "porcentaje",
		valor: 0,
		activo: true,
		limiteUsos: 100,
		fechaVencimiento: "",
		destinosAplicables: [],
		montoMinimo: 0,
		combinable: true,
		exclusivo: false,
	});

	// Cargar códigos desde la API
	const fetchCodigos = async () => {
		setLoading(true);
		try {
			const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";
			console.log("🔍 Cargando códigos desde:", `${apiUrl}/api/codigos`);

			const response = await fetch(`${apiUrl}/api/codigos`);
			console.log(
				"📡 Respuesta del servidor:",
				response.status,
				response.statusText
			);

			if (!response.ok) {
				throw new Error(`Error ${response.status}: ${response.statusText}`);
			}

			const data = await response.json();
			console.log("📥 Datos recibidos:", data);
			setCodigos(data);
		} catch (error) {
			console.error("❌ Error cargando códigos:", error);
			setError(error.message);
			setCodigos([]);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchCodigos();
	}, []);

	const handleSubmit = async (e) => {
		e.preventDefault();
		try {
			const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";
			const url = editingCodigo
				? `${apiUrl}/api/codigos/${editingCodigo.id}`
				: `${apiUrl}/api/codigos`;
			const method = editingCodigo ? "PUT" : "POST";

			const response = await fetch(url, {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(formData),
			});

			if (response.ok) {
				await fetchCodigos();
				resetForm();
				setError(null); // Limpiar errores al guardar exitosamente
			} else {
				const errorData = await response.json();
				throw new Error(errorData.error || `Error ${response.status}`);
			}
		} catch (error) {
			console.error("Error guardando código:", error);
			setError(error.message);
		}
	};

	const handleEdit = (codigo) => {
		setEditingCodigo(codigo);
		setFormData({
			codigo: codigo.codigo,
			descripcion: codigo.descripcion,
			tipo: codigo.tipo,
			valor: codigo.valor,
			activo: codigo.activo,
			limiteUsos: codigo.limiteUsos,
			fechaVencimiento: codigo.fechaVencimiento,
			destinosAplicables: codigo.destinosAplicables || [],
			montoMinimo: codigo.montoMinimo,
			combinable: codigo.combinable,
			exclusivo: codigo.exclusivo,
		});
		setShowForm(true);
	};

	const handleDelete = async (id) => {
		if (confirm("¿Estás seguro de eliminar este código?")) {
			try {
				const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";
				await fetch(`${apiUrl}/api/codigos/${id}`, { method: "DELETE" });
				await fetchCodigos();
			} catch (error) {
				console.error("Error eliminando código:", error);
			}
		}
	};

	const handleDeleteById = async () => {
		if (!deleteId.trim()) {
			alert("Por favor, ingresa un ID válido");
			return;
		}

		const codigo = codigos.find((c) => c.id.toString() === deleteId.trim());
		if (!codigo) {
			alert("No se encontró un código con ese ID");
			return;
		}

		if (
			confirm(
				`¿Estás seguro de eliminar el código "${codigo.codigo}" (ID: ${deleteId})?`
			)
		) {
			setDeleting(true);
			try {
				const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";
				const response = await fetch(`${apiUrl}/api/codigos/${deleteId}`, {
					method: "DELETE",
				});

				if (response.ok) {
					await fetchCodigos();
					setDeleteId("");
					alert("Código eliminado exitosamente");
				} else {
					const errorData = await response.json();
					alert(`Error: ${errorData.error || "No se pudo eliminar el código"}`);
				}
			} catch (error) {
				console.error("Error eliminando código:", error);
				alert("Error al eliminar el código");
			} finally {
				setDeleting(false);
			}
		}
	};

	const handleDeleteUserFromCode = async () => {
		if (!selectedCodigo || !selectedUsuario.trim()) {
			alert("Por favor, selecciona un código y ingresa un ID de usuario");
			return;
		}

		const codigo = codigos.find((c) => c.id.toString() === selectedCodigo);
		if (!codigo) {
			alert("No se encontró el código seleccionado");
			return;
		}

		if (
			!codigo.usuariosQueUsaron ||
			!codigo.usuariosQueUsaron.includes(selectedUsuario.trim())
		) {
			console.log("Debug - Usuario no encontrado:", {
				selectedUsuario: selectedUsuario.trim(),
				usuariosQueUsaron: codigo.usuariosQueUsaron,
				codigo: codigo.codigo,
			});
			alert("El usuario no ha usado este código");
			return;
		}

		if (
			confirm(
				`¿Estás seguro de eliminar al usuario "${selectedUsuario}" de la lista de usuarios que han usado el código "${codigo.codigo}"?`
			)
		) {
			setDeletingUser(true);
			try {
				const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";
				const url = `${apiUrl}/api/codigos/${selectedCodigo}/usuarios/${selectedUsuario}`;
				console.log("Debug - Enviando petición a:", url);

				const response = await fetch(url, {
					method: "DELETE",
				});

				console.log(
					"Debug - Respuesta del servidor:",
					response.status,
					response.statusText
				);

				if (response.ok) {
					await fetchCodigos();
					setSelectedUsuario("");
					alert("Usuario eliminado exitosamente del código");
				} else {
					const errorData = await response.json();
					console.error("Error del servidor:", errorData);
					alert(
						`Error: ${errorData.error || "No se pudo eliminar el usuario"}`
					);
				}
			} catch (error) {
				console.error("Error eliminando usuario:", error);
				alert("Error al eliminar el usuario");
			} finally {
				setDeletingUser(false);
			}
		}
	};

	const handleDeleteUserFromCodeDirect = async (codigoId, usuarioId) => {
		const codigo = codigos.find((c) => c.id.toString() === codigoId);
		if (!codigo) {
			alert("No se encontró el código");
			return;
		}

		if (
			confirm(
				`¿Estás seguro de eliminar al usuario "${usuarioId}" de la lista de usuarios que han usado el código "${codigo.codigo}"?`
			)
		) {
			setDeletingUser(true);
			try {
				const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";
				const url = `${apiUrl}/api/codigos/${codigoId}/usuarios/${usuarioId}`;
				console.log("Debug - Enviando petición directa a:", url);

				const response = await fetch(url, {
					method: "DELETE",
				});

				console.log(
					"Debug - Respuesta del servidor:",
					response.status,
					response.statusText
				);

				if (response.ok) {
					await fetchCodigos();
					alert("Usuario eliminado exitosamente del código");
				} else {
					const errorData = await response.json();
					console.error("Error del servidor:", errorData);
					alert(
						`Error: ${errorData.error || "No se pudo eliminar el usuario"}`
					);
				}
			} catch (error) {
				console.error("Error eliminando usuario:", error);
				alert("Error al eliminar el usuario");
			} finally {
				setDeletingUser(false);
			}
		}
	};

	const resetForm = () => {
		setFormData({
			codigo: "",
			descripcion: "",
			tipo: "porcentaje",
			valor: 0,
			activo: true,
			limiteUsos: 100,
			fechaVencimiento: "",
			destinosAplicables: [],
			montoMinimo: 0,
			combinable: true,
			exclusivo: false,
		});
		setEditingCodigo(null);
		setShowForm(false);
	};

	const formatCurrency = (amount) => {
		return new Intl.NumberFormat("es-CL", {
			style: "currency",
			currency: "CLP",
			minimumFractionDigits: 0,
		}).format(amount);
	};

	const getStatusBadge = (codigo) => {
		const now = new Date();
		const vencimiento = new Date(codigo.fechaVencimiento);

		if (!codigo.activo) return <Badge variant="secondary">Inactivo</Badge>;
		if (vencimiento < now) return <Badge variant="destructive">Vencido</Badge>;
		if (codigo.usosActuales >= codigo.limiteUsos)
			return <Badge variant="destructive">Agotado</Badge>;
		return <Badge variant="default">Activo</Badge>;
	};

	if (loading) {
		return <div className="p-4">Cargando códigos...</div>;
	}

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<div>
					<h2 className="text-2xl font-bold">
						Gestión de Códigos de Descuento
					</h2>
					<div className="flex items-center gap-2 mt-1">
						<div
							className={`w-2 h-2 rounded-full ${
								error ? "bg-red-500" : "bg-green-500"
							}`}
						></div>
						<span className="text-sm text-gray-600">
							{error ? "Error de conexión" : "Conectado"}
						</span>
						{loading && (
							<span className="text-sm text-blue-600">Cargando...</span>
						)}
					</div>
				</div>
				<div className="flex gap-2">
					<Button
						onClick={fetchCodigos}
						variant="outline"
						disabled={loading}
						className="flex items-center gap-2"
					>
						{loading ? (
							<LoaderCircle className="w-4 h-4 animate-spin" />
						) : (
							<RotateCcw className="w-4 h-4" />
						)}
						Recargar
					</Button>
					<Button
						onClick={() => setShowForm(true)}
						className="bg-purple-600 hover:bg-purple-700"
					>
						<Plus className="w-4 h-4 mr-2" />
						Nuevo Código
					</Button>
				</div>
			</div>

			{/* Formulario */}
			{showForm && (
				<Card>
					<CardHeader>
						<CardTitle>
							{editingCodigo ? "Editar Código" : "Nuevo Código de Descuento"}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleSubmit} className="space-y-4">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<Label htmlFor="codigo">Código</Label>
									<Input
										id="codigo"
										value={formData.codigo}
										onChange={(e) =>
											setFormData({
												...formData,
												codigo: e.target.value.toUpperCase(),
											})
										}
										placeholder="VERANO2024"
										required
									/>
								</div>
								<div>
									<Label htmlFor="descripcion">Descripción</Label>
									<Input
										id="descripcion"
										value={formData.descripcion}
										onChange={(e) =>
											setFormData({ ...formData, descripcion: e.target.value })
										}
										placeholder="Descuento de Verano 2024"
										required
									/>
								</div>
								<div>
									<Label htmlFor="tipo">Tipo de Descuento</Label>
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
											<SelectItem value="porcentaje">Porcentaje</SelectItem>
											<SelectItem value="monto_fijo">Monto Fijo</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div>
									<Label htmlFor="valor">Valor</Label>
									<Input
										id="valor"
										type="number"
										value={formData.valor}
										onChange={(e) =>
											setFormData({
												...formData,
												valor: parseInt(e.target.value),
											})
										}
										placeholder={
											formData.tipo === "porcentaje" ? "15" : "10000"
										}
										required
									/>
									<p className="text-xs text-slate-500 mt-1">
										{formData.tipo === "porcentaje"
											? "Porcentaje (ej: 15 = 15%)"
											: "Monto en pesos (ej: 10000 = $10.000)"}
									</p>
								</div>
								<div>
									<Label htmlFor="limiteUsos">Límite de Usos</Label>
									<Input
										id="limiteUsos"
										type="number"
										value={formData.limiteUsos}
										onChange={(e) =>
											setFormData({
												...formData,
												limiteUsos: parseInt(e.target.value),
											})
										}
										placeholder="100"
									/>
								</div>
								<div>
									<Label htmlFor="fechaVencimiento">Fecha de Vencimiento</Label>
									<Input
										id="fechaVencimiento"
										type="date"
										value={formData.fechaVencimiento}
										onChange={(e) =>
											setFormData({
												...formData,
												fechaVencimiento: e.target.value,
											})
										}
									/>
								</div>
								<div>
									<Label htmlFor="montoMinimo">Monto Mínimo</Label>
									<Input
										id="montoMinimo"
										type="number"
										value={formData.montoMinimo}
										onChange={(e) =>
											setFormData({
												...formData,
												montoMinimo: parseInt(e.target.value),
											})
										}
										placeholder="20000"
									/>
								</div>
							</div>

							<div className="space-y-3">
								<div className="flex items-center space-x-2">
									<Checkbox
										id="activo"
										checked={formData.activo}
										onCheckedChange={(checked) =>
											setFormData({ ...formData, activo: checked })
										}
									/>
									<Label htmlFor="activo">Activo</Label>
								</div>
								<div className="flex items-center space-x-2">
									<Checkbox
										id="combinable"
										checked={formData.combinable}
										onCheckedChange={(checked) =>
											setFormData({ ...formData, combinable: checked })
										}
									/>
									<Label htmlFor="combinable">
										Combinable con otros descuentos
									</Label>
								</div>
								<div className="flex items-center space-x-2">
									<Checkbox
										id="exclusivo"
										checked={formData.exclusivo}
										onCheckedChange={(checked) =>
											setFormData({ ...formData, exclusivo: checked })
										}
									/>
									<Label htmlFor="exclusivo">
										Exclusivo (reemplaza otros descuentos)
									</Label>
								</div>
							</div>

							<div className="flex gap-2">
								<Button
									type="submit"
									className="bg-purple-600 hover:bg-purple-700"
								>
									{editingCodigo ? "Actualizar" : "Crear"} Código
								</Button>
								<Button type="button" variant="outline" onClick={resetForm}>
									Cancelar
								</Button>
							</div>
						</form>
					</CardContent>
				</Card>
			)}

			{/* Sección para eliminar usuario de un código */}
			<Card>
				<CardHeader>
					<CardTitle className="text-red-600">
						Eliminar Usuario de Código
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						<div>
							<Label htmlFor="selectedCodigo">Seleccionar Código</Label>
							<Select value={selectedCodigo} onValueChange={setSelectedCodigo}>
								<SelectTrigger>
									<SelectValue placeholder="Selecciona un código" />
								</SelectTrigger>
								<SelectContent>
									{codigos
										.filter(
											(codigo) =>
												codigo.usuariosQueUsaron &&
												codigo.usuariosQueUsaron.length > 0
										)
										.map((codigo) => (
											<SelectItem key={codigo.id} value={codigo.id.toString()}>
												{codigo.codigo} ({codigo.usuariosQueUsaron.length}{" "}
												usuarios)
											</SelectItem>
										))}
								</SelectContent>
							</Select>
						</div>

						{selectedCodigo && (
							<div>
								<Label htmlFor="selectedUsuario">
									ID del Usuario a Eliminar
								</Label>
								<Input
									id="selectedUsuario"
									value={selectedUsuario}
									onChange={(e) => setSelectedUsuario(e.target.value)}
									placeholder="Ingresa el ID del usuario"
									className="mt-1"
								/>
								<p className="text-xs text-gray-500 mt-1">
									Usuarios que han usado este código:{" "}
									{codigos
										.find((c) => c.id.toString() === selectedCodigo)
										?.usuariosQueUsaron?.join(", ") || "Ninguno"}
								</p>
							</div>
						)}

						<div className="flex gap-2">
							<Button
								onClick={handleDeleteUserFromCode}
								variant="destructive"
								disabled={
									deletingUser || !selectedCodigo || !selectedUsuario.trim()
								}
								className="flex items-center gap-2"
							>
								{deletingUser ? (
									<LoaderCircle className="w-4 h-4 animate-spin" />
								) : (
									<Trash2 className="w-4 h-4" />
								)}
								{deletingUser ? "Eliminando..." : "Eliminar Usuario"}
							</Button>
						</div>

						<p className="text-xs text-gray-500">
							⚠️ Esta acción eliminará al usuario de la lista de usuarios que
							han usado el código, pero no eliminará el código en sí.
						</p>
					</div>
				</CardContent>
			</Card>

			{/* Mensaje de error */}
			{error && (
				<div className="bg-red-50 border border-red-200 rounded-lg p-4">
					<div className="flex items-center gap-2">
						<XCircle className="w-5 h-5 text-red-600" />
						<div>
							<p className="font-semibold text-red-800">
								Error cargando códigos
							</p>
							<p className="text-sm text-red-600">{error}</p>
							<Button
								onClick={fetchCodigos}
								variant="outline"
								size="sm"
								className="mt-2"
							>
								Reintentar
							</Button>
						</div>
					</div>
				</div>
			)}

			{/* Lista de códigos */}
			<div className="grid gap-4">
				{codigos.length === 0 && !loading && !error && (
					<div className="text-center py-8 text-gray-500">
						<p className="text-lg">No hay códigos de descuento creados</p>
						<p className="text-sm">
							Haz clic en "Nuevo Código" para crear el primero
						</p>
					</div>
				)}
				{codigos.map((codigo) => (
					<Card key={codigo.id}>
						<CardContent className="p-4">
							<div className="flex justify-between items-start">
								<div className="flex-1">
									<div className="flex items-center gap-2 mb-2">
										<h3 className="font-semibold">{codigo.codigo}</h3>
										{getStatusBadge(codigo)}
										<Badge variant="outline" className="text-xs">
											ID: {codigo.id}
										</Badge>
									</div>
									<p className="text-sm text-slate-600 mb-2">
										{codigo.descripcion}
									</p>

									<div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
										<div>
											<span className="font-medium">Tipo:</span>{" "}
											{codigo.tipo === "porcentaje"
												? "Porcentaje"
												: "Monto Fijo"}
										</div>
										<div>
											<span className="font-medium">Valor:</span>{" "}
											{codigo.tipo === "porcentaje"
												? `${codigo.valor}%`
												: formatCurrency(codigo.valor)}
										</div>
										<div>
											<span className="font-medium">Usos:</span>{" "}
											{codigo.usosActuales}/{codigo.limiteUsos}
										</div>
										<div>
											<span className="font-medium">Vencimiento:</span>{" "}
											{new Date(codigo.fechaVencimiento).toLocaleDateString(
												"es-CL"
											)}
										</div>
									</div>

									{/* Información de usuarios que usaron el código */}
									{codigo.usuariosQueUsaron &&
										codigo.usuariosQueUsaron.length > 0 && (
											<div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
												<p className="text-sm font-medium text-blue-800 mb-2">
													Usuarios que han usado este código (
													{codigo.usuariosQueUsaron.length}):
												</p>
												<div className="flex flex-wrap gap-1">
													{codigo.usuariosQueUsaron
														.slice(0, 5)
														.map((usuario, index) => (
															<div
																key={index}
																className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs"
															>
																<span>{usuario.substring(0, 8)}...</span>
																<button
																	onClick={() =>
																		handleDeleteUserFromCodeDirect(
																			codigo.id,
																			usuario
																		)
																	}
																	className="text-red-600 hover:text-red-800 hover:bg-red-100 rounded p-0.5 transition-colors"
																	title="Eliminar usuario"
																>
																	<Trash2 className="w-3 h-3" />
																</button>
															</div>
														))}
													{codigo.usuariosQueUsaron.length > 5 && (
														<span className="text-xs text-blue-600">
															+{codigo.usuariosQueUsaron.length - 5} más
														</span>
													)}
												</div>
											</div>
										)}

									<div className="flex gap-2 mt-3">
										{codigo.combinable && (
											<Badge variant="secondary" className="text-xs">
												Combinable
											</Badge>
										)}
										{codigo.exclusivo && (
											<Badge variant="destructive" className="text-xs">
												Exclusivo
											</Badge>
										)}
									</div>
								</div>

								<div className="flex gap-2">
									<Button
										variant="outline"
										size="sm"
										onClick={() => handleEdit(codigo)}
									>
										<Edit className="w-4 h-4" />
									</Button>
									<Button
										variant="outline"
										size="sm"
										onClick={() => navigator.clipboard.writeText(codigo.codigo)}
									>
										<Copy className="w-4 h-4" />
									</Button>
									<Button
										variant="outline"
										size="sm"
										onClick={() => handleDelete(codigo.id)}
										className="text-red-600 hover:text-red-700"
									>
										<Trash2 className="w-4 h-4" />
									</Button>
								</div>
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}

export default AdminCodigos;
