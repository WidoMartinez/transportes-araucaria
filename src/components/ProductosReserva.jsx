import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	DialogFooter,
} from "./ui/dialog";
import {
	ShoppingCart,
	Plus,
	Minus,
	Trash2,
	Package,
	Coffee,
	Candy,
	Headphones,
	Loader2,
	AlertCircle,
	CheckCircle2,
	DollarSign,
} from "lucide-react";
import { getBackendUrl } from "../lib/backend";
import { formatCurrency } from "../lib/utils";

const API_URL = getBackendUrl() || "https://transportes-araucaria-backend.onrender.com";

/**
 * Componente para mostrar y gestionar productos agregados a una reserva
 * Similar a Uber Eats, permite agregar productos a reservas activas/confirmadas
 */
function ProductosReserva({ reservaId, reserva, onTotalProductosChange }) {
	const [productos, setProductos] = useState([]);
	const [productosReserva, setProductosReserva] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [success, setSuccess] = useState(null);
	const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("todos");
	const [dialogAbierto, setDialogAbierto] = useState(false);

	// Calcular total de productos
	const totalProductos = productosReserva.reduce(
		(sum, pr) => sum + parseFloat(pr.subtotal || 0),
		0
	);

	// Verificar si la reserva permite agregar productos
	const puedeAgregarProductos =
		reserva &&
		["confirmada", "pendiente_detalles", "pendiente"].includes(reserva.estado);

	// Cargar productos disponibles
	const cargarProductos = async () => {
		try {
			setLoading(true);
			setError(null);

			const response = await fetch(`${API_URL}/api/productos?disponible=true`);
			if (!response.ok) {
				throw new Error("Error al cargar productos");
			}

			const data = await response.json();
			setProductos(data.productos || []);
		} catch (err) {
			setError(err.message);
			console.error("Error cargando productos:", err);
		} finally {
			setLoading(false);
		}
	};

	// Cargar productos de la reserva
	const cargarProductosReserva = async () => {
		if (!reservaId) return;

		try {
			const response = await fetch(`${API_URL}/api/reservas/${reservaId}/productos`);
			if (!response.ok) {
				throw new Error("Error al cargar productos de la reserva");
			}

			const data = await response.json();
			setProductosReserva(data.productos || []);
		} catch (err) {
			console.error("Error cargando productos de reserva:", err);
		}
	};

	// Agregar producto a la reserva
	const agregarProducto = async (productoId, cantidad = 1, notas = "") => {
		try {
			setLoading(true);
			setError(null);
			setSuccess(null);

			const response = await fetch(`${API_URL}/api/reservas/${reservaId}/productos`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					productoId,
					cantidad,
					notas,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Error al agregar producto");
			}

			const data = await response.json();
			setSuccess("Producto agregado exitosamente");
			
			// Recargar productos de la reserva
			await cargarProductosReserva();
			
			// Cerrar diálogo después de 1 segundo
			setTimeout(() => {
				setDialogAbierto(false);
				setSuccess(null);
			}, 1000);
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	// Eliminar producto de la reserva
	const eliminarProducto = async (productoReservaId) => {
		if (!window.confirm("¿Estás seguro de eliminar este producto?")) {
			return;
		}

		try {
			setLoading(true);
			setError(null);

			const response = await fetch(
				`${API_URL}/api/reservas/${reservaId}/productos/${productoReservaId}`,
				{
					method: "DELETE",
				}
			);

			if (!response.ok) {
				throw new Error("Error al eliminar producto");
			}

			setSuccess("Producto eliminado exitosamente");
			await cargarProductosReserva();
			
			setTimeout(() => setSuccess(null), 3000);
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	// Cargar productos al montar el componente
	useEffect(() => {
		if (reservaId && puedeAgregarProductos) {
			cargarProductos();
			cargarProductosReserva();
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [reservaId, puedeAgregarProductos]);

	// Notificar al padre cuando el total de productos cambie
	useEffect(() => {
		if (onTotalProductosChange) {
			onTotalProductosChange(totalProductos);
		}
	}, [totalProductos, onTotalProductosChange]);

	// Obtener icono según categoría
	const getIconoCategoria = (categoria) => {
		switch (categoria) {
			case "bebidas":
				return <Coffee className="w-4 h-4" />;
			case "snacks":
				return <Candy className="w-4 h-4" />;
			case "accesorios":
				return <Headphones className="w-4 h-4" />;
			default:
				return <Package className="w-4 h-4" />;
		}
	};

	// Filtrar productos por categoría
	const productosFiltrados =
		categoriaSeleccionada === "todos"
			? productos
			: productos.filter((p) => p.categoria === categoriaSeleccionada);

	// Obtener categorías únicas
	const categorias = ["todos", ...new Set(productos.map((p) => p.categoria))];

	// Si la reserva no permite agregar productos, no mostrar nada
	if (!puedeAgregarProductos) {
		return null;
	}

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<ShoppingCart className="w-5 h-5" />
						<div>
							<CardTitle>Productos Adicionales</CardTitle>
							<CardDescription>
								Agrega productos a tu viaje (snacks, bebidas, accesorios)
							</CardDescription>
						</div>
					</div>
					{productosReserva.length > 0 && (
						<Badge variant="default" className="gap-1">
							<DollarSign className="w-3 h-3" />
							{formatCurrency(totalProductos)}
						</Badge>
					)}
				</div>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* Mensajes de éxito y error */}
				{success && (
					<div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800">
						<CheckCircle2 className="w-4 h-4" />
						<p className="text-sm">{success}</p>
					</div>
				)}

				{error && (
					<div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800">
						<AlertCircle className="w-4 h-4" />
						<p className="text-sm">{error}</p>
					</div>
				)}

				{/* Lista de productos agregados */}
				{productosReserva.length > 0 && (
					<div className="space-y-2">
						<Label className="text-sm font-medium">Productos agregados:</Label>
						{productosReserva.map((pr) => (
							<div
								key={pr.id}
								className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
							>
								<div className="flex items-center gap-3 flex-1">
									{getIconoCategoria(pr.producto?.categoria)}
									<div className="flex-1">
										<p className="font-medium text-sm">
											{pr.producto?.nombre}
										</p>
										<p className="text-xs text-muted-foreground">
											Cantidad: {pr.cantidad} x {formatCurrency(pr.precioUnitario)}
										</p>
										{pr.notas && (
											<p className="text-xs text-muted-foreground italic">
												Nota: {pr.notas}
											</p>
										)}
									</div>
									<div className="text-right">
										<p className="font-semibold text-sm">
											{formatCurrency(pr.subtotal)}
										</p>
										<Badge variant="outline" className="text-xs">
											{pr.estadoEntrega}
										</Badge>
									</div>
								</div>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => eliminarProducto(pr.id)}
									disabled={loading}
									className="ml-2"
								>
									<Trash2 className="w-4 h-4 text-red-500" />
								</Button>
							</div>
						))}
					</div>
				)}

				{/* Botón para agregar productos */}
				<Dialog open={dialogAbierto} onOpenChange={setDialogAbierto}>
					<DialogTrigger asChild>
						<Button className="w-full gap-2" variant="outline">
							<Plus className="w-4 h-4" />
							Agregar Productos
						</Button>
					</DialogTrigger>
					<DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
						<DialogHeader>
							<DialogTitle>Catálogo de Productos</DialogTitle>
							<DialogDescription>
								Selecciona productos para agregar a tu reserva
							</DialogDescription>
						</DialogHeader>

						{/* Filtro por categoría */}
						<div className="flex gap-2 flex-wrap">
							{categorias.map((cat) => (
								<Button
									key={cat}
									variant={categoriaSeleccionada === cat ? "default" : "outline"}
									size="sm"
									onClick={() => setCategoriaSeleccionada(cat)}
								>
									{cat.charAt(0).toUpperCase() + cat.slice(1)}
								</Button>
							))}
						</div>

						{/* Grid de productos */}
						{loading ? (
							<div className="flex items-center justify-center py-8">
								<Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
							</div>
						) : (
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								{productosFiltrados.map((producto) => (
									<ProductoCard
										key={producto.id}
										producto={producto}
										onAgregar={agregarProducto}
										loading={loading}
									/>
								))}
							</div>
						)}
					</DialogContent>
				</Dialog>
			</CardContent>
		</Card>
	);
}

/**
 * Componente individual para cada producto en el catálogo
 */
function ProductoCard({ producto, onAgregar, loading }) {
	const [cantidad, setCantidad] = useState(1);
	const [notas, setNotas] = useState("");
	const [agregando, setAgregando] = useState(false);

	const handleAgregar = async () => {
		setAgregando(true);
		await onAgregar(producto.id, cantidad, notas);
		setAgregando(false);
		setCantidad(1);
		setNotas("");
	};

	const subtotal = parseFloat(producto.precio) * cantidad;

	return (
		<Card>
			<CardContent className="pt-6">
				<div className="space-y-3">
					<div>
						<h3 className="font-semibold text-sm">{producto.nombre}</h3>
						{producto.descripcion && (
							<p className="text-xs text-muted-foreground mt-1">
								{producto.descripcion}
							</p>
						)}
						<p className="font-bold text-lg mt-2">
							{formatCurrency(producto.precio)}
						</p>
					</div>

					{/* Control de cantidad */}
					<div className="flex items-center gap-2">
						<Label className="text-xs">Cantidad:</Label>
						<div className="flex items-center gap-1">
							<Button
								variant="outline"
								size="sm"
								onClick={() => setCantidad(Math.max(1, cantidad - 1))}
								disabled={cantidad <= 1}
							>
								<Minus className="w-3 h-3" />
							</Button>
							<Input
								type="number"
								min="1"
								value={cantidad}
								onChange={(e) => setCantidad(Math.max(1, parseInt(e.target.value) || 1))}
								className="w-16 text-center"
							/>
							<Button
								variant="outline"
								size="sm"
								onClick={() => setCantidad(cantidad + 1)}
							>
								<Plus className="w-3 h-3" />
							</Button>
						</div>
					</div>

					{/* Notas opcionales */}
					<div>
						<Label className="text-xs">Notas (opcional):</Label>
						<Textarea
							value={notas}
							onChange={(e) => setNotas(e.target.value)}
							placeholder="Ej: Sin azúcar, extra frío..."
							className="text-sm h-16"
						/>
					</div>

					{/* Subtotal y botón */}
					<div className="flex items-center justify-between pt-2">
						<p className="text-sm font-semibold">
							Subtotal: {formatCurrency(subtotal)}
						</p>
						<Button
							onClick={handleAgregar}
							disabled={loading || agregando}
							size="sm"
							className="gap-1"
						>
							{agregando ? (
								<>
									<Loader2 className="w-3 h-3 animate-spin" />
									Agregando...
								</>
							) : (
								<>
									<Plus className="w-3 h-3" />
									Agregar
								</>
							)}
						</Button>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

export default ProductosReserva;
