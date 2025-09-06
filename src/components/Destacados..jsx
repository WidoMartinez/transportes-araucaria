import React from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"; // <-- CORRECCIÓN: Usando alias de ruta
import { Button } from "@/components/ui/button"; // <-- CORRECCIÓN: Usando alias de ruta
import { ArrowRight } from "lucide-react";

// El componente recibe una lista de 'destinos' como propiedad
function Destacados({ destinos }) {
	if (!destinos || destinos.length === 0) {
		return null; // No renderizar nada si no hay destinos destacados
	}

	return (
		<section id="destacados" className="py-20 bg-muted/40">
			<div className="container mx-auto px-4">
				<div className="text-center mb-16">
					<h2 className="text-4xl font-bold mb-4">
						Novedades y Destinos de Temporada
					</h2>
					<p className="text-xl text-muted-foreground max-w-2xl mx-auto">
						Descubre las mejores aventuras que La Araucanía tiene para ofrecer
						cada estación.
					</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
					{destinos.map((destino, index) => (
						<Card
							key={index}
							className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105 flex flex-col group"
						>
							<div className="relative overflow-hidden">
								<div
									className="h-56 bg-cover bg-center transition-transform duration-500 ease-in-out group-hover:scale-110"
									style={{ backgroundImage: `url(${destino.imagen})` }}
								></div>
								<div className="absolute inset-0 bg-black/30"></div>
							</div>
							<CardHeader>
								<CardTitle className="text-2xl">{destino.titulo}</CardTitle>
								<CardDescription>{destino.subtitulo}</CardDescription>
							</CardHeader>
							<CardContent className="flex-grow flex flex-col justify-between">
								<p className="text-muted-foreground mb-6">
									{destino.descripcion}
								</p>
								<a href="#contacto">
									<Button className="w-full mt-2">
										Cotizar Viaje a {destino.nombre}
										<ArrowRight className="ml-2 h-4 w-4" />
									</Button>
								</a>
							</CardContent>
						</Card>
					))}
				</div>
			</div>
		</section>
	);
}

export default Destacados;
