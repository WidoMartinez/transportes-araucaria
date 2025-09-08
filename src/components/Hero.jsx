import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { LoaderCircle } from "lucide-react";
import heroVan from "../assets/hero-van.png";

function Hero({
	formData,
	handleInputChange,
	handleSubmit,
	cotizacion,
	destinos,
	maxPasajeros,
	minDateTime,
	phoneError,
	isSubmitting,
}) {
	return (
		<section
			id="inicio"
			className="relative bg-gradient-to-r from-primary to-secondary text-white min-h-screen flex items-center"
		>
			<div className="absolute inset-0 bg-black/30"></div>
			<div
				className="absolute inset-0 bg-cover bg-center bg-no-repeat"
				style={{ backgroundImage: `url(${heroVan})` }}
			></div>
			<div className="relative container mx-auto px-4 text-center">
				<h2 className="text-5xl md:text-6xl font-bold mb-6 animate-fade-in-down">
					Transfer Confiable desde
					<br />
					<span className="text-accent">Aeropuerto La Araucanía</span>
				</h2>
				<p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
					Traslados seguros y cómodos a Temuco, Villarrica y Pucón
				</p>

				<Card className="max-w-5xl mx-auto bg-white/95 backdrop-blur-sm shadow-xl border">
					<CardHeader>
						<CardTitle className="text-foreground text-center text-2xl">
							Cotiza y Reserva tu Transfer
						</CardTitle>
					</CardHeader>
					<CardContent>
						<form
							onSubmit={handleSubmit}
							className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end"
						>
							<div className="text-left">
								<Label htmlFor="destino-hero">Destino</Label>
								<select
									id="destino-hero"
									name="destino"
									value={formData.destino}
									onChange={handleInputChange}
									className="w-full p-2 border rounded-md focus:ring-2 focus:ring-primary text-foreground"
									required
								>
									<option value="">Seleccionar</option>
									{destinos.map((d) => (
										<option key={d.nombre} value={d.nombre}>
											{d.nombre}
										</option>
									))}
									<option value="Otro">Otro</option>
								</select>
							</div>
							{formData.destino === "Otro" && (
								<div className="text-left">
									<Label htmlFor="otroDestino-hero">Otro Destino</Label>
									<Input
										id="otroDestino-hero"
										name="otroDestino"
										value={formData.otroDestino}
										onChange={handleInputChange}
										required
									/>
								</div>
							)}
							<div className="text-left">
								<Label htmlFor="pasajeros-hero">Pasajeros</Label>
								<select
									id="pasajeros-hero"
									name="pasajeros"
									value={formData.pasajeros}
									onChange={handleInputChange}
									className="w-full p-2 border rounded-md focus:ring-2 focus:ring-primary text-foreground"
									required
								>
									{[...Array(maxPasajeros)].map((_, i) => (
										<option key={i + 1} value={i + 1}>
											{i + 1} pasajero(s)
										</option>
									))}
								</select>
							</div>
							<div className="text-left">
								<Label htmlFor="fecha-hero">Fecha</Label>
								<Input
									id="fecha-hero"
									type="date"
									name="fecha"
									value={formData.fecha}
									onChange={handleInputChange}
									min={minDateTime}
									required
								/>
							</div>
							<div className="text-left">
								<Label htmlFor="hora-hero">Hora</Label>
								<Input
									id="hora-hero"
									type="time"
									name="hora"
									value={formData.hora}
									onChange={handleInputChange}
									required
								/>
							</div>
							<div className="text-left">
								<Label htmlFor="telefono-hero">Teléfono</Label>
								<Input
									id="telefono-hero"
									type="tel"
									name="telefono"
									placeholder="Ej: +569..."
									value={formData.telefono}
									onChange={handleInputChange}
									required
								/>
								{phoneError && (
									<p className="text-red-500 text-xs mt-1">{phoneError}</p>
								)}
							</div>
							<Button
								type="submit"
								className="w-full bg-accent hover:bg-accent/90 text-lg py-3"
								disabled={isSubmitting}
							>
								{isSubmitting ? (
									<>
										<LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
										Enviando...
									</>
								) : (
									"Reservar"
								)}
							</Button>
						</form>
						{cotizacion.precio && (
							<div className="mt-4 p-4 bg-green-100 rounded-lg text-green-800 text-center transition-all duration-300 ease-in-out">
								<p className="font-bold">
									Precio Cotizado: $
									{new Intl.NumberFormat("es-CL").format(cotizacion.precio)}
								</p>
								<p>Vehículo Asignado: {cotizacion.vehiculo}</p>
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</section>
	);
}

export default Hero;
