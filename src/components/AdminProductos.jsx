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
	CheckCircle2,
	XCircle,
	Image as ImageIcon,
	Package,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

function AdminProductos() {
	const [productos, setProductos] = useState([]);
	const [loading, setLoading] = useState(true);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingProduct, setEditingProduct] = useState(null);
	const [formData, setFormData] = useState({
		nombre: "",
		descripcion: "",
		precio: "",
		imagen: "",
		categoria: "General",
		activo: true,
		orden: 0,
		stock: null,
	});

	useEffect(() => {
		fetchProductos();
	}, []);

	const fetchProductos = async () => {
		try {
			setLoading(true);
			const response = await fetch(`${API_URL}/api/productos`);
			if (response.ok) {
				const data = await response.json();
				setProductos(data);
			}
		} catch (error) {
			console.error("Error cargando productos:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		try {
			const url = editingProduct
				? `${API_URL}/api/productos/${editingProduct.id}`
				: `${API_URL}/api/productos`;

			const method = editingProduct ? "PUT" : "POST";

			const response = await fetch(url, {
				method,
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					...formData,
					precio: parseFloat(formData.precio),
					orden: parseInt(formData.orden) || 0,
					stock: formData.stock ? parseInt(formData.stock) : null,
				}),
			});

			if (response.ok) {
				await fetchProductos();
				resetForm();
				setDialogOpen(false);
			} else {
				const error = await response.json();
				alert(`Error: ${error.error || "No se pudo guardar el producto"}`);
			}
		} catch (error) {
			console.error("Error guardando producto:", error);
			alert("Error de conexión al guardar el producto");
		}
	};

	const handleEdit = (producto) => {
		setEditingProduct(producto);
		setFormData({
			nombre: producto.nombre,
			descripcion: producto.descripcion || "",
			precio: producto.precio,
			imagen: producto.imagen || "",
			categoria: producto.categoria || "General",
			activo: producto.activo,
			orden: producto.orden || 0,
			stock: producto.stock,
		});
		setDialogOpen(true);
	};

	const handleDelete = async (id) => {
		if (!confirm("¿Estás seguro de eliminar este producto?")) {
			return;
		}

		try {
			const response = await fetch(`${API_URL}/api/productos/${id}`, {
				method: "DELETE",
			});

			if (response.ok) {
				await fetchProductos();
			} else {
				alert("Error al eliminar el producto");
			}
		} catch (error) {
			console.error("Error eliminando producto:", error);
			alert("Error de conexión al eliminar el producto");
		}
	};

	const toggleActivo = async (producto) => {
		try {
			const response = await fetch(`${API_URL}/api/productos/${producto.id}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					activo: !producto.activo,
				}),
			});

			if (response.ok) {
				await fetchProductos();
			}
		} catch (error) {
			console.error("Error actualizando estado:", error);
		}
	};

	const resetForm = () => {
		setEditingProduct(null);
		setFormData({
			nombre: "",
			descripcion: "",
			precio: "",
			imagen: "",
			categoria: "General",
			activo: true,
			orden: 0,
			stock: null,
		});
	};

	const formatCurrency = (value) => {
		return new Intl.NumberFormat("es-CL", {
			style: "currency",
			currency: "CLP",
		}).format(value || 0);
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center p-8">
				<div className="text-center">
					<Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
					<p className="text-muted-foreground">Cargando productos...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold">Gestión de Productos</h2>
					<p className="text-muted-foreground">
						Administra los productos disponibles para las reservas
					</p>
				</div>
				<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
					<DialogTrigger asChild>
						<Button onClick={resetForm}>
							<Plus className="w-4 h-4 mr-2" />
							Nuevo Producto
						</Button>
					</DialogTrigger>
					<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
						<DialogHeader>
							<DialogTitle>
								{editingProduct ? "Editar Producto" : "Nuevo Producto"}
							</DialogTitle>
							<DialogDescription>
								{editingProduct
									? "Modifica los datos del producto"
									: "Agrega un nuevo producto al catálogo"}
							</DialogDescription>
						</DialogHeader>
						<form onSubmit={handleSubmit} className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="nombre">Nombre *</Label>
								<Input
									id="nombre"
									value={formData.nombre}
									onChange={(e) =>
										setFormData({ ...formData, nombre: e.target.value })
									}
									required
									placeholder="Ej: Coca-Cola 500ml"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="descripcion">Descripción</Label>
								<Textarea
									id="descripcion"
									value={formData.descripcion}
									onChange={(e) =>
										setFormData({ ...formData, descripcion: e.target.value })
									}
									placeholder="Descripción del producto"
									rows={3}
								/>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="precio">Precio (CLP) *</Label>
									<Input
										id="precio"
										type="number"
										value={formData.precio}
										onChange={(e) =>
											setFormData({ ...formData, precio: e.target.value })
										}
										required
										min="0"
										step="100"
										placeholder="1500"
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="categoria">Categoría</Label>
									<Select
										value={formData.categoria}
										onValueChange={(value) =>
											setFormData({ ...formData, categoria: value })
										}
									>
										<SelectTrigger id="categoria">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="General">General</SelectItem>
											<SelectItem value="Bebidas">Bebidas</SelectItem>
											<SelectItem value="Comida">Comida</SelectItem>
											<SelectItem value="Snacks">Snacks</SelectItem>
											<SelectItem value="Otros">Otros</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="imagen">URL de Imagen</Label>
								<Input
									id="imagen"
									value={formData.imagen}
									onChange={(e) =>
										setFormData({ ...formData, imagen: e.target.value })
									}
									placeholder="https://ejemplo.com/imagen.jpg"
								/>
								{formData.imagen && (
									<div className="mt-2">
										<img
											src={formData.imagen}
											alt="Preview"
											className="w-32 h-32 object-cover rounded-md border"
											onError={(e) => {
												e.target.style.display = "none";
											}}
										/>
									</div>
								)}
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="orden">Orden de visualización</Label>
									<Input
										id="orden"
										type="number"
										value={formData.orden}
										onChange={(e) =>
											setFormData({ ...formData, orden: e.target.value })
										}
										min="0"
										placeholder="0"
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="stock">Stock (opcional)</Label>
									<Input
										id="stock"
										type="number"
										value={formData.stock || ""}
										onChange={(e) =>
											setFormData({
												...formData,
												stock: e.target.value ? e.target.value : null,
											})
										}
										min="0"
										placeholder="Sin control de stock"
									/>
								</div>
							</div>

							<div className="flex items-center space-x-2">
								<input
									type="checkbox"
									id="activo"
									checked={formData.activo}
									onChange={(e) =>
										setFormData({ ...formData, activo: e.target.checked })
									}
									className="w-4 h-4"
								/>
								<Label htmlFor="activo" className="cursor-pointer">
									Producto activo
								</Label>
							</div>

							<div className="flex justify-end gap-2 pt-4">
								<Button
									type="button"
									variant="outline"
									onClick={() => {
										resetForm();
										setDialogOpen(false);
									}}
								>
									Cancelar
								</Button>
								<Button type="submit">
									{editingProduct ? "Actualizar" : "Crear"} Producto
								</Button>
							</div>
						</form>
					</DialogContent>
				</Dialog>
			</div>

			{productos.length === 0 ? (
				<Card>
					<CardContent className="flex flex-col items-center justify-center p-12">
						<Package className="w-16 h-16 text-muted-foreground mb-4" />
						<p className="text-lg font-medium mb-2">No hay productos</p>
						<p className="text-muted-foreground mb-4">
							Crea tu primer producto para comenzar
						</p>
						<Button onClick={() => setDialogOpen(true)}>
							<Plus className="w-4 h-4 mr-2" />
							Crear Producto
						</Button>
					</CardContent>
				</Card>
			) : (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Package className="w-5 h-5" />
							Productos ({productos.length})
						</CardTitle>
					</CardHeader>
					<CardContent>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Imagen</TableHead>
									<TableHead>Nombre</TableHead>
									<TableHead>Categoría</TableHead>
									<TableHead>Precio</TableHead>
									<TableHead>Stock</TableHead>
									<TableHead>Estado</TableHead>
									<TableHead className="text-right">Acciones</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{productos.map((producto) => (
									<TableRow key={producto.id}>
										<TableCell>
											{producto.imagen ? (
												<img
													src={producto.imagen}
													alt={producto.nombre}
													className="w-12 h-12 object-cover rounded-md"
													onError={(e) => {
														e.target.src = "";
														e.target.style.display = "none";
													}}
												/>
											) : (
												<div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center">
													<ImageIcon className="w-6 h-6 text-muted-foreground" />
												</div>
											)}
										</TableCell>
										<TableCell>
											<div>
												<div className="font-medium">{producto.nombre}</div>
												{producto.descripcion && (
													<div className="text-sm text-muted-foreground line-clamp-1">
														{producto.descripcion}
													</div>
												)}
											</div>
										</TableCell>
										<TableCell>
											<Badge variant="outline">{producto.categoria}</Badge>
										</TableCell>
										<TableCell className="font-medium">
											{formatCurrency(producto.precio)}
										</TableCell>
										<TableCell>
											{producto.stock !== null
												? producto.stock
												: "Sin control"}
										</TableCell>
										<TableCell>
											<button
												onClick={() => toggleActivo(producto)}
												className="inline-flex"
											>
												{producto.activo ? (
													<Badge className="bg-green-500 hover:bg-green-600">
														<CheckCircle2 className="w-3 h-3 mr-1" />
														Activo
													</Badge>
												) : (
													<Badge variant="secondary">
														<XCircle className="w-3 h-3 mr-1" />
														Inactivo
													</Badge>
												)}
											</button>
										</TableCell>
										<TableCell className="text-right">
											<div className="flex justify-end gap-2">
												<Button
													size="sm"
													variant="outline"
													onClick={() => handleEdit(producto)}
												>
													<Edit className="w-4 h-4" />
												</Button>
												<Button
													size="sm"
													variant="destructive"
													onClick={() => handleDelete(producto.id)}
												>
													<Trash2 className="w-4 h-4" />
												</Button>
											</div>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</CardContent>
				</Card>
			)}
		</div>
	);
}

export default AdminProductos;
