import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Car, Users, MapPin, Shield } from "lucide-react";

// Servicios optimizados con keywords para SEO
const servicios = [
	{
		icono: <Car className="h-8 w-8" />,
		titulo: "Transfer Aeropuerto Temuco",
		descripcion:
			"Servicio de transfer privado desde el Aeropuerto La Araucanía a Temuco, Pucón y Villarrica. Transporte exclusivo para hasta 4 personas en vehículos modernos y confortables.",
	},
	{
		icono: <Users className="h-8 w-8" />,
		titulo: "Transporte Grupal en Van",
		descripcion:
			"¿Viajan más de 4 personas? Contamos con vans de pasajeros para grupos. Traslados cómodos y seguros para toda La Araucanía con conductores profesionales.",
	},
	{
		icono: <Shield className="h-8 w-8" />,
		titulo: "Servicio 24/7 Puntual",
		descripcion:
			"Transporte disponible las 24 horas. Monitoreamos vuelos en tiempo real y garantizamos puntualidad. Conductores certificados para un viaje seguro y confiable.",
	},
	{
		icono: <MapPin className="h-8 w-8" />,
		titulo: "Tours Turísticos Privados",
		descripcion:
			"Descubre la Araucanía Andina con nuestros tours personalizados. Transporte turístico a volcanes, termas y parques nacionales. Creamos la ruta perfecta para tu aventura.",
	},
];

function Servicios() {
	return (
		<section id="servicios" className="py-20 bg-muted/40">
			<div className="container mx-auto px-4">
				<div className="text-center mb-16">
					{/* H2 optimizado con keywords principales */}
					<h2 className="text-4xl font-bold mb-4">
						Servicios de Transporte en La Araucanía
					</h2>
					{/* Descripción optimizada con keywords secundarias */}
					<p className="text-xl text-muted-foreground max-w-2xl mx-auto">
						Transfer aeropuerto, traslados turísticos y transporte privado en Temuco, Pucón y Villarrica. 
						Calidad, seguridad y puntualidad garantizada las 24 horas del día.
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
