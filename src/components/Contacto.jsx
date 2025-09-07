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

// Componente interno para reutilizar la lógica de mostrar información de contacto
const InfoItem = ({ icon: Icon, title, children }) => (
	<div className="flex items-start space-x-4">
		<div className="flex-shrink-0">
			<Icon className="h-6 w-6 text-primary mt-1" />
		</div>
		<div>
			<p className="font-semibold text-lg">{title}</p>
			<div className="text-muted-foreground">{children}</div>
		</div>
	</div>
);

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
		<section id="contacto" className="py-24 bg-gray-50/50">
			<div className="container mx-auto px-4">
				<div className="text-center mb-16">
					<h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
						Hablemos
					</h2>
					<p className="text-lg text-muted-foreground max-w-3xl mx-auto">
						Completa el formulario y nuestro equipo se pondrá en contacto
						contigo en menos de 30 minutos para entregarte una cotización a tu
						medida.
					</p>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
					{/* Columna de Información de Contacto */}
					<div className="lg:col-span-2">
						<Card className="shadow-md border-transparent h-full bg-transparent">
							<CardHeader>
								<CardTitle className="text-2xl">
									Información de Contacto
								</CardTitle>
								<CardDescription>
									Estamos disponibles para atenderte 24/7.
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-8">
								<InfoItem icon={Phone} title="Teléfono">
									<a
										href="tel:+56936643540"
										className="hover:text-primary transition-colors duration-300"
									>
										+56 9 3664 3540
									</a>
								</InfoItem>
								<InfoItem icon={Mail} title="Email">
									<a
										href="mailto:contacto@transportesaraucaria.cl"
										className="hover:text-primary transition-colors duration-300"
									>
										contacto@transportesaraucaria.cl
									</a>
								</InfoItem>
								<InfoItem icon={MapPin} title="Ubicación">
									<p>Temuco, Región de La Araucanía</p>
								</InfoItem>
								<InfoItem icon={Clock} title="Horarios">
									<p>Disponible 24 horas, 7 días a la semana.</p>
								</InfoItem>
							</CardContent>
						</Card>
					</div>

					{/* Columna del Formulario */}
					<div className="lg:col-span-3">
						<Card className="shadow-md border">
							<CardHeader>
								<CardTitle className="text-2xl">
									Solicita tu Cotización
								</CardTitle>
								<CardDescription>
									Completa tus datos y te enviaremos una oferta personalizada.
								</CardDescription>
							</CardHeader>
							<CardContent>
								<form onSubmit={handleSubmit} className="space-y-6">
									<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
										<div className="space-y-2">
											<Label htmlFor="nombre">Nombre completo</Label>
											<Input
												id="nombre"
												name="nombre"
												value={formData.nombre}
												onChange={handleInputChange}
												placeholder="Ej: Juan Pérez"
												required
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor="telefono-form">Teléfono</Label>
											<Input
												id="telefono-form"
												name="telefono"
												value={formData.telefono}
												onChange={handleInputChange}
												placeholder="+56 9 1234 5678"
												required
											/>
											{phoneError && (
												<p className="text-red-500 text-sm mt-1">
													{phoneError}
												</p>
											)}
										</div>
									</div>
									<div className="space-y-2">
										<Label htmlFor="email">Email</Label>
										<Input
											id="email"
											type="email"
											name="email"
											value={formData.email}
											onChange={handleInputChange}
											placeholder="tu@email.com"
											required
										/>
									</div>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
										<div className="space-y-2">
											<Label htmlFor="origen">Origen</Label>
											<Input
												id="origen"
												name="origen"
												value={formData.origen}
												onChange={handleInputChange}
												placeholder="Ej: Aeropuerto de Temuco"
												required
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor="destino-form">Destino</Label>
											<select
												id="destino-form"
												name="destino"
												value={formData.destino}
												onChange={handleInputChange}
												className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
									<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
										<div className="space-y-2">
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
										<div className="space-y-2">
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
									<div className="space-y-2">
										<Label htmlFor="pasajeros-form">N° de Pasajeros</Label>
										<select
											id="pasajeros-form"
											name="pasajeros"
											value={formData.pasajeros}
											onChange={handleInputChange}
											className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
										>
											{[...Array(maxPasajeros)].map((_, i) => (
												<option key={i + 1} value={i + 1}>
													{i + 1} pasajero(s)
												</option>
											))}
										</select>
									</div>

									{cotizacion.precio && (
										<div className="p-4 bg-primary/10 rounded-lg text-center transition-all duration-300 ease-in-out">
											<div className="flex justify-around items-center gap-4 text-primary">
												<div>
													<p className="font-semibold text-sm uppercase tracking-wider">
														Precio Total
													</p>
													<p className="text-3xl font-bold">
														$
														{new Intl.NumberFormat("es-CL").format(
															cotizacion.precio
														)}
													</p>
												</div>
												<div className="border-l-2 border-primary/20 h-12"></div>
												<div>
													<p className="font-semibold text-sm uppercase tracking-wider">
														Vehículo
													</p>
													<p className="text-xl font-bold">
														{cotizacion.vehiculo}
													</p>
												</div>
											</div>
										</div>
									)}

									<div className="space-y-2">
										<Label htmlFor="mensaje">
											Mensaje adicional (opcional)
										</Label>
										<Textarea
											id="mensaje"
											name="mensaje"
											value={formData.mensaje}
											onChange={handleInputChange}
											placeholder="Cuéntanos sobre equipaje especial, necesidades particulares, etc."
										/>
									</div>
									<Button
										type="submit"
										size="lg"
										className="w-full text-lg"
										disabled={isSubmitting}
									>
										{isSubmitting ? (
											<>
												<LoaderCircle className="mr-2 h-5 w-5 animate-spin" />
												Enviando...
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
			</div>
		</section>
	);
}

export default Contacto;
