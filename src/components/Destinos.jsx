import React from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Clock, Plane } from "lucide-react";

function Destinos({ destinos }) {
	return (
		<section id="destinos" className="py-20">
			<div className="container mx-auto px-4">
				<div className="text-center mb-16">
					<h2 className="text-4xl font-bold mb-4">Principales Destinos</h2>
					<p className="text-xl text-muted-foreground max-w-2xl mx-auto">
						Conectamos el aeropuerto con los destinos más populares de La
						Araucanía
					</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
					{destinos.map((destino, index) => (
						<Card
							key={index}
							className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105 flex flex-col"
						>
							<div
								className="h-48 bg-cover bg-center"
								style={{ backgroundImage: `url(${destino.imagen})` }}
							></div>
							<CardHeader>
								<CardTitle className="flex justify-between items-center">
									{destino.nombre}
								</CardTitle>
								<CardDescription>{destino.descripcion}</CardDescription>
							</CardHeader>
							<CardContent className="flex-grow flex flex-col justify-between">
								<div>
									<p className="text-lg font-semibold text-primary mb-2">
										Desde $
										{new Intl.NumberFormat("es-CL").format(
											destino.precios.sedan.base
										)}{" "}
										CLP
									</p>
									<div className="flex justify-between items-center mb-4">
										<div className="flex items-center space-x-2">
											<Clock className="h-4 w-4 text-muted-foreground" />
											<span className="text-sm">{destino.tiempo}</span>
										</div>
										<div className="flex items-center space-x-2">
											<Plane className="h-4 w-4 text-muted-foreground" />
											<span className="text-sm">Desde aeropuerto</span>
										</div>
									</div>
								</div>
								<a href="#contacto">
									<Button className="w-full mt-2">Reservar Transfer</Button>
								</a>
							</CardContent>
						</Card>
					))}
				</div>
			</div>
		</section>
	);
}

export default Destinos;
