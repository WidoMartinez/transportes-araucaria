import React, { useMemo, useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Switch } from "./ui/switch";
import { LoaderCircle } from "lucide-react";
import heroVan from "../assets/hero-van.png";

function HeroExpress({
	formData,
	handleInputChange,
	origenes,
	destinos,
	maxPasajeros,
	minDateTime,
	pricing,
	onSubmitWizard,
	isSubmitting,
	phoneError, // Añadido para mostrar errores de teléfono
}) {
	const [showPrice, setShowPrice] = useState(false);
	const [stepError, setStepError] = useState("");

	const currencyFormatter = useMemo(
		() =>
			new Intl.NumberFormat("es-CL", {
				style: "currency",
				currency: "CLP",
			}),
		[]
	);

	const formatCurrency = (value) => currencyFormatter.format(value || 0);

	const handleShowPrice = async () => {
		if (!formData.origen?.trim() || !formData.destino || !formData.fecha) {
			setStepError("Completa los detalles de tu viaje para ver el precio.");
			return;
		}
		setStepError("");
		setShowPrice(true);
	};

	// Lógica para el botón de pago final
	const handlePayment = async () => {
		// Validar campos personales
		if (
			!formData.nombre?.trim() ||
			!formData.email?.trim() ||
			!formData.telefono?.trim() ||
			(formData.idaVuelta && (!formData.fechaRegreso || !formData.horaRegreso))
		) {
			setStepError("Por favor, completa tus datos para continuar.");
			return;
		}
		setStepError("");

		// Llamar a la función que crea la reserva y luego inicia el pago
		await onSubmitWizard();
	};

	return (
		<section
			id="inicio"
			className="relative bg-gradient-to-r from-primary to-secondary text-white min-h-screen flex items-center justify-center"
		>
			<div
				className="absolute inset-0 bg-cover bg-center bg-no-repeat"
				style={{ backgroundImage: `url(${heroVan})` }}
			></div>
			<div className="absolute inset-0 bg-black/50"></div>

			<div className="relative container mx-auto px-4 text-center py-16">
				<h1 className="text-4xl md:text-6xl font-bold mb-4">
					Viajes privados y de turismo
				</h1>
				<p className="text-lg md:text-2xl mb-8">
					Cotiza y reserva en línea de forma rápida y segura.
				</p>
				<Card className="max-w-md mx-auto bg-white/95 backdrop-blur-sm shadow-xl border text-left p-6">
					<CardContent className="p-0">
						<div className="space-y-4">
							<h2 className="text-2xl font-bold text-foreground">
								Viaja a cualquier lugar
							</h2>

							{/* --- ETAPA 1: COTIZACIÓN --- */}
							{!showPrice && (
								<>
									<div className="relative space-y-2">
										<div className="relative">
											<Label
												htmlFor="origen-express"
												className="text-xs font-medium text-muted-foreground"
											>
												Punto de partida
											</Label>
											<select
												id="origen-express"
												name="origen"
												value={formData.origen}
												onChange={handleInputChange}
												className="flex h-11 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
												required
											>
												{origenes.map((origen) => (
													<option key={origen} value={origen}>
														{origen}
													</option>
												))}
											</select>
										</div>
										<div className="relative">
											<Label
												htmlFor="destino-express"
												className="text-xs font-medium text-muted-foreground"
											>
												Destino
											</Label>
											<select
												id="destino-express"
												name="destino"
												value={formData.destino}
												onChange={handleInputChange}
												className="flex h-11 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
												required
											>
												<option value="">Seleccionar destino</option>
												{destinos.map((d) => (
													<option key={d} value={d}>
														{d}
													</option>
												))}
											</select>
										</div>
									</div>
									<div className="flex items-center justify-between mt-4">
										<Label htmlFor="idaVuelta-switch" className="text-base">
											Viaje de Ida y Vuelta
										</Label>
										<Switch
											id="idaVuelta-switch"
											name="idaVuelta"
											checked={formData.idaVuelta}
											onCheckedChange={(checked) =>
												handleInputChange({
													target: { name: "idaVuelta", value: checked },
												})
											}
										/>
									</div>
									<div className="grid grid-cols-2 gap-4">
										{formData.idaVuelta && (
											<>
												<div className="space-y-1">
													<Label
														htmlFor="fechaRegreso-express"
														className="text-xs"
													>
														Fecha de Regreso
													</Label>
													<Input
														id="fechaRegreso-express"
														type="date"
														name="fechaRegreso"
														value={formData.fechaRegreso}
														onChange={handleInputChange}
														min={formData.fecha || minDateTime}
														className="h-11 text-base"
														required
													/>
												</div>
												<div className="space-y-1">
													<Label
														htmlFor="horaRegreso-express"
														className="text-xs"
													>
														Hora de Regreso
													</Label>
													<Input
														id="horaRegreso-express"
														type="time"
														name="horaRegreso"
														value={formData.horaRegreso}
														onChange={handleInputChange}
														className="h-11 text-base"
														required
													/>
												</div>
											</>
										)}
										<div className="space-y-1">
											<Label htmlFor="fecha-express" className="text-xs">
												Fecha
											</Label>
											<Input
												id="fecha-express"
												type="date"
												name="fecha"
												value={formData.fecha}
												onChange={handleInputChange}
												min={minDateTime}
												className="h-11 text-base"
												required
											/>
										</div>
										<div className="space-y-1">
											<Label htmlFor="pasajeros-express" className="text-xs">
												Pasajeros
											</Label>
											<select
												id="pasajeros-express"
												name="pasajeros"
												value={formData.pasajeros}
												onChange={handleInputChange}
												className="flex h-11 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
												required
											>
												{[...Array(maxPasajeros)].map((_, i) => (
													<option key={i + 1} value={i + 1}>
														{i + 1}
													</option>
												))}
											</select>
										</div>
									</div>
									<Button
										type="button"
										onClick={handleShowPrice}
										className="w-full bg-black hover:bg-black/90 text-white px-8 py-3 text-lg font-semibold"
										disabled={isSubmitting}
									>
										Ver precios
									</Button>
								</>
							)}

							{/* --- ETAPA 2: DATOS Y PAGO --- */}
							{showPrice && (
								<div className="space-y-4">
									{/* Resumen y Precio */}
									<div className="border-t pt-4 space-y-2">
										<h3 className="text-lg font-semibold text-foreground">
											Resumen de tu viaje
										</h3>

										{/* Desglose de precios y descuentos */}
										<div className="text-sm text-muted-foreground space-y-1">
											<div className="flex justify-between">
												<span>Precio base</span>
												<span>{formatCurrency(pricing.precioBase)}</span>
											</div>

											{pricing.descuentoSameDay > 0 && (
												<div className="flex justify-between text-green-600">
													<span>Descuento viaje mismo día (25%)</span>
													<span>
														-{formatCurrency(pricing.descuentoSameDay)}
													</span>
												</div>
											)}
											{pricing.descuentoRoundTrip > 0 &&
												pricing.descuentoSameDay === 0 && (
													<div className="flex justify-between text-green-600">
														<span>Descuento ida y vuelta</span>
														<span>
															-{formatCurrency(pricing.descuentoRoundTrip)}
														</span>
													</div>
												)}
										</div>

										{/* Total */}
										<div className="flex justify-between items-center pt-2 border-t">
											<p className="text-lg font-bold">Precio final:</p>
											<p className="text-2xl font-bold text-primary">
												{formatCurrency(pricing.totalConDescuento)}
											</p>
										</div>

										{/* Ahorro Total */}
										{pricing.totalAhorrado > 0 && (
											<div className="text-right">
												<Badge
													variant="default"
													className="bg-green-500 text-white font-semibold"
												>
													🎉 Ahorraste: {formatCurrency(pricing.totalAhorrado)}
												</Badge>
											</div>
										)}
									</div>

									{/* Campos de datos personales */}
									<div className="space-y-2">
										<Label htmlFor="nombre-express">Nombre</Label>
										<Input
											id="nombre-express"
											name="nombre"
											value={formData.nombre}
											onChange={handleInputChange}
											placeholder="Tu nombre completo"
											required
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="email-express">Correo electrónico</Label>
										<Input
											id="email-express"
											type="email"
											name="email"
											value={formData.email}
											onChange={handleInputChange}
											placeholder="tu@email.com"
											required
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="telefono-express">Teléfono</Label>
										<Input
											id="telefono-express"
											name="telefono"
											value={formData.telefono}
											onChange={handleInputChange}
											placeholder="+56 9 1234 5678"
											required
										/>
										{phoneError && (
											<p className="text-xs text-destructive">
												{phoneError}
											</p>
										)}
									</div>

									{stepError && (
										<p className="text-sm text-destructive">{stepError}</p>
									)}

									{/* Botón de Pago */}
									<Button
										type="button"
										onClick={handlePayment}
										className="w-full bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-semibold"
										disabled={isSubmitting}
									>
										{isSubmitting ? (
											<LoaderCircle className="animate-spin" />
										) : (
											"Pagar con Flow"
										)}
									</Button>
								</div>
							)}
						</div>
					</CardContent>
				</Card>
			</div>
		</section>
	);
}

export default HeroExpress;
