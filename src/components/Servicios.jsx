import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Car, Users, MapPin, Shield } from "lucide-react";

const servicios = [
	{
		icono: <Car className="h-8 w-8" />,
		titulo: "Traslado Privado en Auto",
		descripcion:
			"Servicio exclusivo para ti y tu grupo (hasta 4 personas) en un moderno y confortable vehículo.",
	},
	{
		icono: <Users className="h-8 w-8" />,
		titulo: "Disponibilidad para Grupos",
		descripcion:
			"¿Viajan más de 4 personas? Consulta por nuestras cómodas y seguras Vans de pasajeros.",
	},
	{
		icono: <Shield className="h-8 w-8" />,
		titulo: "Puntualidad y Confianza",
		descripcion:
			"Monitoreamos tu vuelo y te esperamos a tiempo. Conductores profesionales para un viaje seguro.",
	},
	{
		icono: <MapPin className="h-8 w-8" />,
		titulo: "Tours a Medida",
		descripcion:
			"Descubre la Araucanía Andina con nuestros tours privados. Creamos una ruta perfecta para ti.",
	},
];

function Servicios() {
	return (
		<section id="servicios" className="py-20 bg-muted/40">
			<div className="container mx-auto px-4">
				<div className="text-center mb-16">
					<h2 className="text-4xl font-bold mb-4">
						Un Servicio Pensado para Tu Comodidad
					</h2>
					<p className="text-xl text-muted-foreground max-w-2xl mx-auto">
						Ofrecemos diferentes opciones de transporte para satisfacer tus
						necesidades, con un enfoque en la calidad y el servicio privado.
					</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
					{servicios.map((servicio, index) => (
						<Card
							key={index}
							className="text-center hover:shadow-xl transition-all duration-300 hover:scale-105"
						>
							<CardHeader>
								<div className="mx-auto text-primary mb-4">
									{servicio.icono}
								</div>
								<CardTitle className="text-xl">{servicio.titulo}</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-muted-foreground">{servicio.descripcion}</p>
							</CardContent>
						</Card>
					))}
				</div>
			</div>
		</section>
	);
}

export default Servicios;
