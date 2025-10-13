import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from "./ui/dialog";
import {
	ShoppingCart,
	Plus,
	Minus,
	X,
	Package,
	Coffee,
	Utensils,
	Cookie,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const categoriaIcons = {
	Bebidas: Coffee,
	Comida: Utensils,
	Snacks: Cookie,
	General: Package,
};

function MenuProductos({ open, onOpenChange, onConfirm, reservaId }) {
	const [productos, setProductos] = useState([]);
	const [carrito, setCarrito] = useState({});
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (open) {
			fetchProductos();
			if (reservaId) {
				fetchProductosReserva();
			}
		}
	}, [open, reservaId]);

	const fetchProductos = async () => {
		try {
			setLoading(true);
			const response = await fetch(`${API_URL}/api/productos?activos=true`);
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

	const fetchProductosReserva = async () => {
		try {
			const response = await fetch(
				`${API_URL}/api/reservas/${reservaId}/productos`
			);
			if (response.ok) {
				const data = await response.json();
				const carritoExistente = {};
				data.productos.forEach((pr) => {
					carritoExistente[pr.productoId] = pr.cantidad;
				});
				setCarrito(carritoExistente);
			}
		} catch (error) {
			console.error("Error cargando productos de reserva:", error);
		}
	};

	const agregarProducto = (productoId) => {
		setCarrito((prev) => ({
			...prev,
			[productoId]: (prev[productoId] || 0) + 1,
		}));
	};

	const quitarProducto = (productoId) => {
		setCarrito((prev) => {
			const newCarrito = { ...prev };
			if (newCarrito[productoId] > 1) {
				newCarrito[productoId]--;
			} else {
				delete newCarrito[productoId];
			}
			return newCarrito;
		});
	};

	const eliminarProducto = (productoId) => {
		setCarrito((prev) => {
			const newCarrito = { ...prev };
			delete newCarrito[productoId];
			return newCarrito;
		});
	};

	const calcularTotal = () => {
		return Object.entries(carrito).reduce((total, [productoId, cantidad]) => {
			const producto = productos.find((p) => p.id === parseInt(productoId));
			return total + (producto ? parseFloat(producto.precio) * cantidad : 0);
		}, 0);
	};

	const formatCurrency = (value) => {
		return new Intl.NumberFormat("es-CL", {
			style: "currency",
			currency: "CLP",
		}).format(value || 0);
	};

	const handleConfirmar = () => {
		const productosSeleccionados = Object.entries(carrito).map(
			([productoId, cantidad]) => ({
				productoId: parseInt(productoId),
				cantidad,
			})
		);
		onConfirm(productosSeleccionados, calcularTotal());
	};

	const totalItems = Object.values(carrito).reduce(
		(sum, cantidad) => sum + cantidad,
		0
	);

	const productosPorCategoria = productos.reduce((acc, producto) => {
		const categoria = producto.categoria || "General";
		if (!acc[categoria]) {
			acc[categoria] = [];
		}
		acc[categoria].push(producto);
		return acc;
	}, {});

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
				<DialogHeader>
					<DialogTitle className="text-2xl font-bold">
						Agregar Productos
					</DialogTitle>
					<DialogDescription>
						Selecciona productos para complementar tu viaje
					</DialogDescription>
				</DialogHeader>

				<div className="flex-1 overflow-y-auto px-1">
					{loading ? (
						<div className="flex items-center justify-center py-12">
							<div className="text-center">
								<Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
								<p className="text-muted-foreground">Cargando productos...</p>
							</div>
						</div>
					) : productos.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-12">
							<Package className="w-16 h-16 text-muted-foreground mb-4" />
							<p className="text-lg font-medium mb-2">
								No hay productos disponibles
							</p>
							<p className="text-muted-foreground">
								Vuelve más tarde para ver nuestro catálogo
							</p>
						</div>
					) : (
						<div className="space-y-6 pb-4">
							{Object.entries(productosPorCategoria).map(
								([categoria, productosCategoria]) => {
									const Icon =
										categoriaIcons[categoria] || categoriaIcons.General;
									return (
										<div key={categoria}>
											<div className="flex items-center gap-2 mb-3">
												<Icon className="w-5 h-5 text-primary" />
												<h3 className="text-lg font-semibold">{categoria}</h3>
												<Badge variant="secondary">
													{productosCategoria.length}
												</Badge>
											</div>
											<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
												{productosCategoria.map((producto) => {
													const cantidad = carrito[producto.id] || 0;
													return (
														<Card
															key={producto.id}
															className={`overflow-hidden transition-all ${
																cantidad > 0
																	? "ring-2 ring-primary"
																	: "hover:shadow-md"
															}`}
														>
															<CardContent className="p-4">
																<div className="flex gap-4">
																	<div className="flex-shrink-0">
																		{producto.imagen ? (
																			<img
																				src={producto.imagen}
																				alt={producto.nombre}
																				className="w-24 h-24 object-cover rounded-lg"
																				onError={(e) => {
																					e.target.src = "";
																					e.target.style.display = "none";
																				}}
																			/>
																		) : (
																			<div className="w-24 h-24 bg-muted rounded-lg flex items-center justify-center">
																				<Package className="w-8 h-8 text-muted-foreground" />
																			</div>
																		)}
																	</div>
																	<div className="flex-1 min-w-0">
																		<h4 className="font-semibold text-base mb-1">
																			{producto.nombre}
																		</h4>
																		{producto.descripcion && (
																			<p className="text-sm text-muted-foreground line-clamp-2 mb-2">
																				{producto.descripcion}
																			</p>
																		)}
																		<div className="flex items-center justify-between gap-2">
																			<span className="text-lg font-bold text-primary">
																				{formatCurrency(producto.precio)}
																			</span>
																			{cantidad === 0 ? (
																				<Button
																					size="sm"
																					onClick={() =>
																						agregarProducto(producto.id)
																					}
																				>
																					<Plus className="w-4 h-4 mr-1" />
																					Agregar
																				</Button>
																			) : (
																				<div className="flex items-center gap-2">
																					<Button
																						size="sm"
																						variant="outline"
																						onClick={() =>
																							quitarProducto(producto.id)
																						}
																					>
																						<Minus className="w-4 h-4" />
																					</Button>
																					<span className="font-semibold min-w-[2rem] text-center">
																						{cantidad}
																					</span>
																					<Button
																						size="sm"
																						variant="outline"
																						onClick={() =>
																							agregarProducto(producto.id)
																						}
																					>
																						<Plus className="w-4 h-4" />
																					</Button>
																					<Button
																						size="sm"
																						variant="ghost"
																						onClick={() =>
																							eliminarProducto(producto.id)
																						}
																					>
																						<X className="w-4 h-4" />
																					</Button>
																				</div>
																			)}
																		</div>
																	</div>
																</div>
															</CardContent>
														</Card>
													);
												})}
											</div>
										</div>
									);
								}
							)}
						</div>
					)}
				</div>

				{/* Footer con resumen y botones */}
				<div className="border-t pt-4 space-y-4">
					{totalItems > 0 && (
						<div className="bg-muted p-4 rounded-lg space-y-2">
							<div className="flex justify-between items-center">
								<span className="font-medium">Total items:</span>
								<Badge variant="default" className="text-base px-3 py-1">
									{totalItems}
								</Badge>
							</div>
							<div className="flex justify-between items-center text-lg font-bold">
								<span>Total productos:</span>
								<span className="text-primary">
									{formatCurrency(calcularTotal())}
								</span>
							</div>
						</div>
					)}

					<div className="flex justify-end gap-2">
						<Button variant="outline" onClick={() => onOpenChange(false)}>
							Cancelar
						</Button>
						<Button onClick={handleConfirmar} disabled={totalItems === 0}>
							<ShoppingCart className="w-4 h-4 mr-2" />
							Confirmar {totalItems > 0 && `(${totalItems})`}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}

export default MenuProductos;
