import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Car, Users, Clock, Shield } from "lucide-react";

const servicios = [
	{
		icono: <Car className="h-8 w-8" />,
		titulo: "Transfer Privado",
		descripcion: "Servicio exclusivo para ti y tu grupo",
	},
	{
		icono: <Users className="h-8 w-8" />,
		titulo: "Transfer Compartido",
		descripcion: "Opción económica compartiendo el viaje",
	},
	{
		icono: <Clock className="h-8 w-8" />,
		titulo: "Disponible 24/7",
		descripcion: "Servicio disponible todos los días del año",
	},
	{
		icono: <Shield className="h-8 w-8" />,
		titulo: "Seguro y Confiable",
		descripcion: "Vehículos modernos y conductores profesionales",
	},
];

function Servicios() {
	return (
		<section id="servicios" className="py-20 bg-muted/40">
			<div className="container mx-auto px-4">
				<div className="text-center mb-16">
					<h2 className="text-4xl font-bold mb-4">Nuestros Servicios</h2>
					<p className="text-xl text-muted-foreground max-w-2xl mx-auto">
						Ofrecemos diferentes opciones de transporte para satisfacer tus
						necesidades
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
