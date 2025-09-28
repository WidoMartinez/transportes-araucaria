import React from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Clock, Plane, ArrowRight } from "lucide-react";
import { destinosBase } from "@/data/destinos";

function Destinos() {
	const destinos = destinosBase;
	// Manejo por si no llegan destinos para evitar errores
	if (!destinos || destinos.length === 0) {
		return (
			<section id="destinos" className="py-20 bg-white">
				<div className="container mx-auto px-4 text-center">
					<h2 className="text-4xl font-bold mb-4 text-gray-800">
						Principales Destinos
					</h2>
					<p className="text-xl text-muted-foreground">
						Actualmente no hay destinos disponibles. Por favor, contacta para
						más información.
					</p>
				</div>
			</section>
		);
	}

	return (
		<section id="destinos" className="py-20 bg-white">
			<div className="container mx-auto px-4">
				<div className="text-center mb-16">
					<h2 className="text-4xl font-bold mb-4 text-gray-800">
						Principales Destinos
					</h2>
					<p className="text-xl text-muted-foreground max-w-2xl mx-auto">
						Conectamos el aeropuerto con los destinos más populares de La
						Araucanía.
					</p>
					<p className="text-sm text-muted-foreground max-w-2xl mx-auto mt-2">
						Tarifas base para nuestro servicio exclusivo en auto (hasta 4
						pasajeros). Consulta en el cotizador para Vans.
					</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
					{destinos.map((destino, index) => (
						<Card
							key={index}
							className="group relative overflow-hidden rounded-lg shadow-lg hover:shadow-2xl transition-all duration-500 ease-in-out transform hover:-translate-y-2"
						>
							<div
								className="absolute inset-0 bg-cover bg-center transition-transform duration-500 ease-in-out group-hover:scale-110"
								style={{ backgroundImage: `url(${destino.imagen})` }}
							/>
							<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

							<div className="relative flex flex-col h-full p-6 text-white justify-end">
								<CardHeader className="p-0">
									<CardTitle className="text-3xl font-bold text-shadow-lg">
										{destino.nombre}
									</CardTitle>
									<CardDescription className="text-white/90 text-shadow">
										{destino.descripcion}
									</CardDescription>
								</CardHeader>
								<CardContent className="p-0 mt-4">
									<div className="flex justify-between items-center mb-6">
										<div className="flex items-center space-x-2">
											<Clock className="h-5 w-5" />
											<span>{destino.tiempo}</span>
										</div>
										<div className="flex items-center space-x-2">
											<Plane className="h-5 w-5" />
											<span>Desde aeropuerto</span>
										</div>
									</div>

									<div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
										<p className="text-2xl font-bold mb-4">
											Desde ${" "}
											{new Intl.NumberFormat("es-CL").format(
												destino.precios.auto.base
											)}{" "}
											CLP
										</p>
										<a href="#contacto">
											<Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-lg py-3">
												Reservar Ahora <ArrowRight className="ml-2 h-5 w-5" />
											</Button>
										</a>
									</div>
								</CardContent>
							</div>
						</Card>
					))}
				</div>
			</div>
		</section>
	);
}

export default Destinos;
