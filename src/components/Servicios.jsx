import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Car, Users, MapPin, ShieldCheck, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const servicios = [
	{
		icono: Car,
		titulo: "Traslado Privado en Auto",
		descripcion: "Servicio exclusivo para ti y tu grupo (hasta 4 personas) en un moderno y confortable vehículo.",
		color: "text-amber-400",
		bg: "bg-amber-400/10"
	},
	{
		icono: Users,
		titulo: "Disponibilidad para Grupos",
		descripcion: "¿Viajan más de 4 personas? Consulta por nuestras cómodas y seguras Vans de pasajeros de 1 a 7 personas.",
		color: "text-blue-400",
		bg: "bg-blue-400/10"
	},
	{
		icono: ShieldCheck,
		titulo: "Puntualidad y Confianza",
		descripcion: "Monitoreamos tu vuelo y te esperamos a tiempo. Conductores profesionales para un viaje seguro.",
		color: "text-emerald-400",
		bg: "bg-emerald-400/10"
	},
	{
		icono: MapPin,
		titulo: "Tours a Medida",
		descripcion: "Descubre la Araucanía Andina con nuestros tours privados. Creamos una ruta perfecta para ti.",
		color: "text-rose-400",
		bg: "bg-rose-400/10"
	},
];

function Servicios() {
	return (
		<section id="servicios" className="py-24 bg-transparent">
			<div className="container mx-auto px-4">
				<div className="text-center mb-20">
					<h2 className="text-4xl font-extrabold mb-6 tracking-tight text-white">
						Un Servicio Pensado para Tu Comodidad
					</h2>
					<p className="text-xl text-white opacity-80 max-w-2xl mx-auto leading-relaxed">
						Ofrecemos diferentes opciones de transporte para satisfacer tus
						necesidades, con un enfoque en la calidad y el servicio privado.
					</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
					{servicios.map((servicio, index) => (
						<Card
							key={index}
							className="text-center group border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-primary/5"
						>
							<CardHeader>
								<div className="mx-auto mb-6 relative">
									<div className={cn(
										"w-20 h-20 rounded-3xl mx-auto flex items-center justify-center transition-all duration-500 group-hover:scale-110 relative overflow-hidden shadow-inner",
										servicio.bg,
										"border border-white/20"
									)}>
										{/* Efecto de luz interno */}
										<div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50" />
										<servicio.icono className={cn("w-10 h-10 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]", servicio.color)} />
									</div>
								</div>
								<CardTitle className="text-2xl font-bold tracking-tight text-white group-hover:text-primary transition-colors">
									{servicio.titulo}
								</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-white opacity-70 leading-relaxed">
									{servicio.descripcion}
								</p>
							</CardContent>
						</Card>
					))}
				</div>
			</div>
		</section>
	);
}

export default Servicios;
