import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Star, Award, Gift } from "lucide-react";

const beneficios = [
	{
		icono: <Star className="h-10 w-10 text-yellow-400" />,
		titulo: "Acumula Viajes",
		descripcion:
			"Cada traslado que realizas con nosotros te acerca más a beneficios exclusivos. ¡Tu lealtad tiene premio!",
	},
	{
		icono: <Award className="h-10 w-10 text-blue-500" />,
		titulo: "Tercer Viaje con Descuento",
		descripcion:
			"Al completar tu tercer viaje, obtienes automáticamente un 15% de descuento para tu próximo traslado.",
	},
	{
		icono: <Gift className="h-10 w-10 text-green-500" />,
		titulo: "Quinto Viaje VIP",
		descripcion:
			"Como cliente destacado, en tu quinto viaje te premiamos con un 25% de descuento y una bebida de cortesía.",
	},
];

function Fidelizacion() {
	return (
		<section id="fidelizacion" className="py-24 bg-gray-50/50">
			<div className="container mx-auto px-4">
				<div className="text-center mb-16">
					<h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight text-gray-800">
						Únete a nuestro Club Araucanía
					</h2>
					<p className="text-lg text-muted-foreground max-w-3xl mx-auto">
						Premiamos tu preferencia. Mientras más viajas con nosotros, más
						beneficios obtienes.
					</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
					{beneficios.map((beneficio, index) => (
						<Card
							key={index}
							className="text-center hover:shadow-xl transition-all duration-300 hover:scale-105 border-transparent bg-transparent"
						>
							<CardHeader>
								<div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
									{beneficio.icono}
								</div>
							</CardHeader>
							<CardContent className="space-y-2">
								<CardTitle className="text-xl text-gray-800">
									{beneficio.titulo}
								</CardTitle>
								<p className="text-muted-foreground">{beneficio.descripcion}</p>
							</CardContent>
						</Card>
					))}
				</div>
			</div>
		</section>
	);
}

export default Fidelizacion;
