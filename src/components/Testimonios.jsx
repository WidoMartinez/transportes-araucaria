import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Star } from "lucide-react";

const testimonios = [
	{
		nombre: "María González",
		comentario:
			"Excelente servicio, muy puntual y cómodo. El conductor fue muy amable.",
		calificacion: 5,
	},
	{
		nombre: "Carlos Rodríguez",
		comentario:
			"Perfecto para llegar a Pucón desde el aeropuerto. Lo recomiendo 100%.",
		calificacion: 5,
	},
	{
		nombre: "Ana Martínez",
		comentario:
			"Muy profesional, vehículo limpio y precio justo. Volveré a usar el servicio.",
		calificacion: 5,
	},
];

function Testimonios() {
	return (
		<section className="py-20 bg-muted/40">
			<div className="container mx-auto px-4">
				<div className="text-center mb-16">
					<h2 className="text-4xl font-bold mb-4">
						Lo que dicen nuestros clientes
					</h2>
					<p className="text-xl text-muted-foreground max-w-2xl mx-auto">
						Miles de pasajeros satisfechos respaldan nuestro servicio
					</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
					{testimonios.map((testimonio, index) => (
						<Card key={index} className="hover:shadow-lg transition-shadow">
							<CardHeader>
								<div className="flex items-center space-x-1 mb-2">
									{[...Array(testimonio.calificacion)].map((_, i) => (
										<Star
											key={i}
											className="h-5 w-5 fill-yellow-400 text-yellow-400"
										/>
									))}
								</div>
								<CardTitle className="text-lg">{testimonio.nombre}</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-muted-foreground italic">
									"{testimonio.comentario}"
								</p>
							</CardContent>
						</Card>
					))}
				</div>
			</div>
		</section>
	);
}

export default Testimonios;
