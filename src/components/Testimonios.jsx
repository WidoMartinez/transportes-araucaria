import * as React from "react";
import Autoplay from "embla-carousel-autoplay";
import { Quote, Star } from "lucide-react";
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const testimonios = [
	{
		nombre: "Elisa Godoy Varas",
		iniciales: "EG",
		comentario:
			"Excelente servicio, muy puntual y cómodo. El conductor fue muy amable durante todo el trayecto desde el aeropuerto.",
		calificacion: 5,
		origen: "Pucón",
	},
	{
		nombre: "Francisco Abbott Charme",
		iniciales: "FA",
		comentario:
			"Servicio de excelencia de Alejandra; FELICITACIONES y muy agradecidos.",
		calificacion: 5,
		origen: "Villarrica",
	},
	{
		nombre: "Roxanna Quinteros Amaro",
		iniciales: "RQ",
		comentario:
			"La mejor opción para llegar al aeropuerto. El vehículo estaba impecable y la coordinación fue perfecta. Totalmente recomendado.",
		calificacion: 5,
		origen: "Aeropuerto La Araucanía",
	},
	{
		nombre: "Carlos Rodríguez",
		iniciales: "CR",
		comentario:
			"Puntualidad y seguridad en cada trayecto. Un servicio inigualable en la zona. Seguiré reservando con ellos.",
		calificacion: 5,
		origen: "Temuco",
	},
	{
		nombre: "Ana Martínez",
		iniciales: "AM",
		comentario:
			"Reservé para un grupo de 6 personas y todo fue perfecto. La van estaba impecable y el conductor muy amable.",
		calificacion: 5,
		origen: "Viajera Local",
	},
];

function Testimonios() {
	// Plugin de reproducción automática con pausa al pasar el mouse
	const plugin = React.useRef(
		Autoplay({ delay: 3500, stopOnInteraction: true })
	);

	return (
		<section className="py-24 bg-[#F8F7F4] relative overflow-hidden">
			<div className="container mx-auto px-6 relative z-10">

				{/* Encabezado */}
				<div className="text-center mb-16 max-w-2xl mx-auto">
					<Badge
						variant="outline"
						className="mb-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8C5E42] border-[#8C5E42]/30 bg-[#8C5E42]/5 rounded-full px-3 py-1"
					>
						⭐ Opiniones Verificadas
					</Badge>
					<h2 className="font-serif text-4xl md:text-5xl font-medium text-forest-600 mb-4">
						Lo que dicen nuestros{" "}
						<em className="not-italic text-[#C4895E]">pasajeros</em>
					</h2>
					<p className="text-slate-500 font-light leading-relaxed font-sans">
						La confianza de nuestros clientes es el motor que nos impulsa a
						brindar un servicio de excelencia en cada kilómetro.
					</p>
				</div>

				{/* Carrusel de testimonios con autoplay */}
				<Carousel
					plugins={[plugin.current]}
					opts={{ align: "start", loop: true }}
					onMouseEnter={plugin.current.stop}
					onMouseLeave={plugin.current.reset}
					className="w-full"
				>
					<CarouselContent className="-ml-4">
						{testimonios.map((testimonio, index) => (
							<CarouselItem
								key={index}
								className="pl-4 md:basis-1/2 lg:basis-1/3"
							>
								<div className="p-1 h-full">
								<Card className="h-full border border-gray-100 shadow-[0_15px_40px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(140,94,66,0.1)] transition-all duration-500 rounded-4xl bg-white group">
									<CardContent className="flex flex-col justify-between h-full p-8 gap-6">

										{/* Estrellas */}
										<div className="flex items-center gap-1">
											{[...Array(testimonio.calificacion)].map((_, i) => (
												<Star
													key={i}
													className="h-4 w-4 fill-[#C4895E] text-[#C4895E]"
												/>
											))}
										</div>

										{/* Comentario */}
										<div className="relative flex-1">
											<Quote className="absolute -top-3 -left-1 h-8 w-8 text-[#8C5E42]/10" />
											<p className="text-slate-600 leading-relaxed font-light italic pl-2">
												"{testimonio.comentario}"
											</p>
										</div>

										{/* Autor */}
										<div className="flex items-center gap-4 pt-5 border-t border-gray-100">
											<Avatar className="size-11 border border-[#8C5E42]/10 bg-forest-600/5 group-hover:bg-[#8C5E42] transition-colors duration-300">
												<AvatarFallback className="text-[#8C5E42] font-bold text-sm group-hover:text-white bg-transparent">
													{testimonio.iniciales}
												</AvatarFallback>
											</Avatar>
											<div>
												<p className="font-bold text-forest-600 text-sm tracking-tight leading-tight">
													{testimonio.nombre}
												</p>
												<p className="text-[10px] uppercase tracking-widest text-[#8C5E42] font-semibold mt-0.5">
													{testimonio.origen}
												</p>
											</div>
										</div>

									</CardContent>
								</Card>
								</div>
							</CarouselItem>
						))}
					</CarouselContent>

					{/* Botones de navegación */}
					<CarouselPrevious className="hidden md:flex -left-5 border-[#8C5E42]/20 text-[#8C5E42] hover:bg-[#8C5E42] hover:text-white transition-colors" />
					<CarouselNext className="hidden md:flex -right-5 border-[#8C5E42]/20 text-[#8C5E42] hover:bg-[#8C5E42] hover:text-white transition-colors" />
				</Carousel>

				{/* Contador de reseñas */}
				<div className="mt-14 flex justify-center">
					<div className="flex items-center gap-4 px-6 py-3 bg-white rounded-full shadow-sm border border-gray-100">
						<div className="flex -space-x-2">
							{["EG", "FA", "RQ", "CR"].map((ini, i) => (
								<Avatar key={i} className="size-8 border-2 border-white bg-slate-200">
									<AvatarFallback className="text-[9px] text-slate-500 font-semibold">
										{ini}
									</AvatarFallback>
								</Avatar>
							))}
						</div>
						<p className="text-xs text-slate-500 font-medium">
							Más de{" "}
							<span className="text-forest-600 font-bold">1,200 reseñas</span>{" "}
							de 5 estrellas
						</p>
					</div>
				</div>

			</div>
		</section>
	);
}

export default Testimonios;
