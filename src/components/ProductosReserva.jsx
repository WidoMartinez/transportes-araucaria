import React, { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import {
	ShoppingCart,
	Plus,
	Minus,
	X,
	Package,
	Coffee,
	Utensils,
	Cookie,
	Search,
	CheckCircle2,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const categoriaIcons = {
	Bebidas: Coffee,
	Comida: Utensils,
	Snacks: Cookie,
	General: Package,
};

function ProductosReserva() {
	const [codigoReserva, setCodigoReserva] = useState("");
	const [reserva, setReserva] = useState(null);
	const [productos, setProductos] = useState([]);
	const [carrito, setCarrito] = useState({});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [success, setSuccess] = useState(false);
	const [buscando, setBuscando] = useState(false);

	const buscarReserva = async () => {
		if (!codigoReserva.trim()) {
			setError("Por favor ingresa un código de reserva");
			return;
		}

		try {
			setBuscando(true);
			setError(null);

			// Buscar reserva por ID
			const responseReserva = await fetch(
				`${API_URL}/api/reservas/${codigoReserva}`
			);

			if (!responseReserva.ok) {
				throw new Error("Reserva no encontrada");
			}

			const dataReserva = await responseReserva.json();
			setReserva(dataReserva);

			// Cargar productos disponibles
			const responseProductos = await fetch(
				`${API_URL}/api/productos?activos=true`
			);

			if (responseProductos.ok) {
				const dataProductos = await responseProductos.json();
				setProductos(dataProductos);
			}

			// Cargar productos ya asociados a la reserva
			const responseProductosReserva = await fetch(
				`${API_URL}/api/reservas/${codigoReserva}/productos`
			);

			if (responseProductosReserva.ok) {
				const dataProductosReserva = await responseProductosReserva.json();
				const carritoExistente = {};
				dataProductosReserva.productos.forEach((pr) => {
					carritoExistente[pr.productoId] = pr.cantidad;
				});
				setCarrito(carritoExistente);
			}
		} catch (err) {
			setError(
				err.message || "No se pudo encontrar la reserva. Verifica el código."
			);
			setReserva(null);
			setProductos([]);
			setCarrito({});
		} finally {
			setBuscando(false);
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

	const guardarProductos = async () => {
		try {
			setLoading(true);
			setError(null);

			const productosSeleccionados = Object.entries(carrito).map(
				([productoId, cantidad]) => ({
					productoId: parseInt(productoId),
					cantidad,
				})
			);

			const response = await fetch(
				`${API_URL}/api/reservas/${reserva.id}/productos`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						productos: productosSeleccionados,
					}),
				}
			);

			if (!response.ok) {
				throw new Error("Error al guardar los productos");
			}

			setSuccess(true);
			setTimeout(() => setSuccess(false), 5000);
		} catch (err) {
			setError(err.message || "Error al guardar los productos");
		} finally {
			setLoading(false);
		}
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
		<div className="min-h-screen bg-background py-12 px-4">
			<div className="max-w-6xl mx-auto">
				<div className="text-center mb-8">
					<h1 className="text-4xl font-bold mb-4">Agregar Productos</h1>
					<p className="text-muted-foreground text-lg">
						Complementa tu viaje con productos para el camino
					</p>
				</div>

				{/* Búsqueda de reserva */}
				{!reserva ? (
					<Card className="max-w-md mx-auto">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Search className="w-5 h-5" />
								Buscar Reserva
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="codigo">Código de Reserva</Label>
								<Input
									id="codigo"
									value={codigoReserva}
									onChange={(e) => setCodigoReserva(e.target.value)}
									placeholder="Ej: 123"
									onKeyPress={(e) => {
										if (e.key === "Enter") {
											buscarReserva();
										}
									}}
								/>
								<p className="text-xs text-muted-foreground">
									Ingresa el número de tu reserva
								</p>
							</div>

							{error && (
								<div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
									{error}
								</div>
							)}

							<Button
								onClick={buscarReserva}
								disabled={buscando || !codigoReserva.trim()}
								className="w-full"
							>
								{buscando ? "Buscando..." : "Buscar Reserva"}
							</Button>
						</CardContent>
					</Card>
				) : (
					<div className="space-y-6">
						{/* Información de la reserva */}
						<Card>
							<CardHeader>
								<CardTitle>Reserva #{reserva.id}</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
									<div>
										<p className="text-muted-foreground">Pasajero</p>
										<p className="font-semibold">{reserva.nombre}</p>
									</div>
									<div>
										<p className="text-muted-foreground">Destino</p>
										<p className="font-semibold">{reserva.destino}</p>
									</div>
									<div>
										<p className="text-muted-foreground">Fecha</p>
										<p className="font-semibold">{reserva.fecha}</p>
									</div>
								</div>
								<Button
									variant="outline"
									size="sm"
									onClick={() => {
										setReserva(null);
										setProductos([]);
										setCarrito({});
										setCodigoReserva("");
									}}
									className="mt-4"
								>
									Buscar otra reserva
								</Button>
							</CardContent>
						</Card>

						{/* Productos disponibles */}
						{productos.length === 0 ? (
							<Card>
								<CardContent className="flex flex-col items-center justify-center py-12">
									<Package className="w-16 h-16 text-muted-foreground mb-4" />
									<p className="text-lg font-medium mb-2">
										No hay productos disponibles
									</p>
									<p className="text-muted-foreground">
										Vuelve más tarde para ver nuestro catálogo
									</p>
								</CardContent>
							</Card>
						) : (
							<>
								<div className="space-y-6">
									{Object.entries(productosPorCategoria).map(
										([categoria, productosCategoria]) => {
											const Icon =
												categoriaIcons[categoria] || categoriaIcons.General;
											return (
												<Card key={categoria}>
													<CardHeader>
														<CardTitle className="flex items-center gap-2">
															<Icon className="w-5 h-5 text-primary" />
															{categoria}
															<Badge variant="secondary">
																{productosCategoria.length}
															</Badge>
														</CardTitle>
													</CardHeader>
													<CardContent>
														<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
																			<div className="space-y-3">
																				<div className="flex-shrink-0">
																					{producto.imagen ? (
																						<img
																							src={producto.imagen}
																							alt={producto.nombre}
																							className="w-full h-32 object-cover rounded-lg"
																							onError={(e) => {
																								e.target.src = "";
																								e.target.style.display = "none";
																							}}
																						/>
																					) : (
																						<div className="w-full h-32 bg-muted rounded-lg flex items-center justify-center">
																							<Package className="w-8 h-8 text-muted-foreground" />
																						</div>
																					)}
																				</div>
																				<div>
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
																					</div>
																				</div>
																				<div className="flex items-center justify-between">
																					{cantidad === 0 ? (
																						<Button
																							size="sm"
																							onClick={() =>
																								agregarProducto(producto.id)
																							}
																							className="w-full"
																						>
																							<Plus className="w-4 h-4 mr-1" />
																							Agregar
																						</Button>
																					) : (
																						<div className="flex items-center gap-2 w-full">
																							<Button
																								size="sm"
																								variant="outline"
																								onClick={() =>
																									quitarProducto(producto.id)
																								}
																							>
																								<Minus className="w-4 h-4" />
																							</Button>
																							<span className="font-semibold flex-1 text-center">
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
																		</CardContent>
																	</Card>
																);
															})}
														</div>
													</CardContent>
												</Card>
											);
										}
									)}
								</div>

								{/* Resumen del carrito */}
								{totalItems > 0 && (
									<Card className="sticky bottom-4">
										<CardContent className="p-6">
											<div className="flex flex-col sm:flex-row items-center justify-between gap-4">
												<div className="space-y-1 text-center sm:text-left">
													<div className="flex items-center gap-2">
														<ShoppingCart className="w-5 h-5" />
														<span className="font-semibold">
															{totalItems} {totalItems === 1 ? "producto" : "productos"}
														</span>
													</div>
													<p className="text-2xl font-bold text-primary">
														{formatCurrency(calcularTotal())}
													</p>
												</div>

												{success && (
													<div className="flex items-center gap-2 text-green-600">
														<CheckCircle2 className="w-5 h-5" />
														<span className="font-medium">
															¡Productos guardados!
														</span>
													</div>
												)}

												{error && (
													<div className="text-destructive text-sm">{error}</div>
												)}

												<Button
													onClick={guardarProductos}
													disabled={loading}
													size="lg"
													className="w-full sm:w-auto"
												>
													{loading ? "Guardando..." : "Guardar Productos"}
												</Button>
											</div>
										</CardContent>
									</Card>
								)}
							</>
						)}
					</div>
				)}
			</div>
		</div>
	);
}

export default ProductosReserva;
