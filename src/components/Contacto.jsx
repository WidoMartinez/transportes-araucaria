import React from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Phone, Mail, MapPin, Clock, LoaderCircle } from "lucide-react";

function Contacto({
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
		<section id="contacto" className="py-20">
			<div className="container mx-auto px-4">
				<div className="text-center mb-16">
					<h2 className="text-4xl font-bold mb-4">Solicita tu Cotización</h2>
					<p className="text-xl text-muted-foreground max-w-2xl mx-auto">
						Completa el formulario y te contactaremos en menos de 30 minutos
					</p>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
					<Card className="shadow-lg">
						<CardHeader>
							<CardTitle>Información de Contacto</CardTitle>
							<CardDescription>
								Estamos disponibles para atenderte las 24 horas del día
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							<div className="flex items-center space-x-3">
								<Phone className="h-5 w-5 text-primary" />
								<div>
									<p className="font-semibold">Teléfono</p>
									<a
										href="tel:+56936643540"
										className="text-muted-foreground hover:text-primary"
									>
										+56 9 3664 3540
									</a>
								</div>
							</div>
							<div className="flex items-center space-x-3">
								<Mail className="h-5 w-5 text-primary" />
								<div>
									<p className="font-semibold">Email</p>
									<p className="text-muted-foreground">
										contacto@transportesaraucaria.cl
									</p>
								</div>
							</div>
							<div className="flex items-center space-x-3">
								<MapPin className="h-5 w-5 text-primary" />
								<div>
									<p className="font-semibold">Ubicación</p>
									<p className="text-muted-foreground">
										Temuco, Región de La Araucanía
									</p>
								</div>
							</div>
							<div className="flex items-center space-x-3">
								<Clock className="h-5 w-5 text-primary" />
								<div>
									<p className="font-semibold">Horarios</p>
									<p className="text-muted-foreground">Disponible 24/7</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card className="shadow-lg">
						<CardHeader>
							<CardTitle>Solicitar Cotización</CardTitle>
							<CardDescription>
								Completa tus datos y te enviaremos una cotización personalizada
							</CardDescription>
						</CardHeader>
						<CardContent>
							<form onSubmit={handleSubmit} className="space-y-4">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<Label htmlFor="nombre">Nombre completo</Label>
										<Input
											name="nombre"
											value={formData.nombre}
											onChange={handleInputChange}
											required
										/>
									</div>
									<div>
										<Label htmlFor="telefono-form">Teléfono</Label>
										<Input
											id="telefono-form"
											name="telefono"
											value={formData.telefono}
											onChange={handleInputChange}
											required
										/>
										{phoneError && (
											<p className="text-red-500 text-xs mt-1">{phoneError}</p>
										)}
									</div>
								</div>
								<div>
									<Label htmlFor="email">Email</Label>
									<Input
										type="email"
										name="email"
										value={formData.email}
										onChange={handleInputChange}
										required
									/>
								</div>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<Label htmlFor="origen">Origen</Label>
										<Input
											name="origen"
											value={formData.origen}
											onChange={handleInputChange}
											required
										/>
									</div>
									<div>
										<Label htmlFor="destino-form">Destino</Label>
										<select
											id="destino-form"
											name="destino"
											value={formData.destino}
											onChange={handleInputChange}
											className="w-full p-2 border rounded-md"
											required
										>
											<option value="">Seleccionar destino</option>
											{destinos.map((d) => (
												<option key={d.nombre} value={d.nombre}>
													{d.nombre}
												</option>
											))}
											<option value="Otro">Otro destino</option>
										</select>
									</div>
								</div>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<Label htmlFor="fecha-form">Fecha</Label>
										<Input
											type="date"
											id="fecha-form"
											name="fecha"
											value={formData.fecha}
											onChange={handleInputChange}
											min={minDateTime}
											required
										/>
									</div>
									<div>
										<Label htmlFor="hora-form">Hora</Label>
										<Input
											type="time"
											id="hora-form"
											name="hora"
											value={formData.hora}
											onChange={handleInputChange}
											required
										/>
									</div>
								</div>
								<div>
									<Label htmlFor="pasajeros-form">Pasajeros</Label>
									<select
										id="pasajeros-form"
										name="pasajeros"
										value={formData.pasajeros}
										onChange={handleInputChange}
										className="w-full p-2 border rounded-md"
									>
										{[...Array(maxPasajeros)].map((_, i) => (
											<option key={i + 1} value={i + 1}>
												{i + 1} pasajero(s)
											</option>
										))}
									</select>
								</div>
								{cotizacion.precio && (
									<div className="p-4 bg-blue-100 rounded-lg text-blue-800 text-center transition-all duration-300 ease-in-out">
										<div className="flex justify-center items-center gap-4">
											<div>
												<p className="font-semibold">Precio Total:</p>
												<p className="text-2xl font-bold">
													$
													{new Intl.NumberFormat("es-CL").format(
														cotizacion.precio
													)}
												</p>
											</div>
											<div className="border-l-2 border-blue-300 h-12"></div>
											<div>
												<p className="font-semibold">Vehículo:</p>
												<p className="text-lg font-bold">
													{cotizacion.vehiculo}
												</p>
											</div>
										</div>
									</div>
								)}
								<div>
									<Label htmlFor="mensaje">Mensaje adicional (opcional)</Label>
									<Textarea
										name="mensaje"
										value={formData.mensaje}
										onChange={handleInputChange}
										placeholder="Cuéntanos sobre equipaje especial, necesidades particulares, etc."
									/>
								</div>
								<Button
									type="submit"
									className="w-full bg-primary hover:bg-primary/90"
									disabled={isSubmitting}
								>
									{isSubmitting ? (
										<>
											<LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
											Enviando Solicitud...
										</>
									) : (
										"Enviar Solicitud"
									)}
								</Button>
							</form>
						</CardContent>
					</Card>
				</div>
			</div>
		</section>
	);
}

export default Contacto;
