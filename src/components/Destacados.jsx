import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from "@/components/ui/carousel"; // Importamos el carrusel
import Autoplay from "embla-carousel-autoplay";

// El componente recibe una lista de 'destinos' como propiedad
function Destacados({ destinos }) {
	if (!destinos || destinos.length === 0) {
		return null; // No renderizar nada si no hay destinos destacados
	}

	// Configurar el plugin de autoplay
	const autoplayPlugin = Autoplay({ delay: 5000, stopOnInteraction: false });

	return (
		<section id="destacados" className="py-16 lg:py-24 bg-transparent overflow-hidden h-full flex flex-col justify-start">
			<div className="w-full px-6 lg:pl-12 lg:pr-6">
				<div className="mb-12 lg:mb-16">
					<p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#C4895E] mb-2">
						Experiencias únicas
					</p>
					<h2 className="font-serif text-4xl lg:text-6xl font-medium text-white tracking-tight leading-tight">
						Destinos de <em className="not-italic text-[#D4A373]">temporada</em>
					</h2>
					<p className="mt-4 text-sm lg:text-base leading-relaxed text-slate-400 font-light italic max-w-md">
						"Descubre las mejores aventuras que La Araucanía tiene para ofrecer en cada estación del año."
					</p>
				</div>

				<Carousel
					opts={{
						align: "start",
						loop: true,
					}}
					plugins={[autoplayPlugin]}
					className="w-full relative group"
				>
					<CarouselContent className="-ml-4">
						{destinos.map((destino, index) => (
							<CarouselItem key={index} className="pl-4 basis-full">
								<div className="group/card relative overflow-hidden rounded-[2rem] lg:rounded-[2.5rem] shadow-2xl aspect-[4/5] md:aspect-video lg:aspect-[1.6/1] min-h-[400px]">
									{/* Imagen con zoom sutil */}
									<div
										className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 ease-in-out group-hover/card:scale-105"
										style={{ backgroundImage: `url(${destino.imagen})` }}
									/>
									
									{/* Gradiente de profundidad */}
									<div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

									{/* Contenido Postal */}
									<div className="absolute inset-0 p-8 lg:p-12 flex flex-col justify-end text-white z-10 text-left">
										<div className="max-w-2xl transform transition-all duration-700 group-hover/card:-translate-y-2">
											<span className="inline-block text-[#C4895E] text-[10px] lg:text-xs font-bold tracking-widest uppercase mb-3 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10">
												{destino.subtitulo}
											</span>
											
											<h3 className="font-serif text-2xl lg:text-4xl font-medium mb-3 leading-tight">
												{destino.titulo}
											</h3>
											
											<p className="mb-6 text-slate-200 text-xs lg:text-base font-light max-w-lg leading-relaxed line-clamp-3">
												{destino.descripcion}
											</p>
											
											<div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
												<a href="#contacto" className="w-full sm:w-auto">
													<Button
														size="lg"
														className="bg-[#C4895E] hover:bg-[#D4A373] text-white text-sm h-12 px-8 rounded-xl shadow-xl transition-all w-full sm:w-auto font-bold"
													>
														Descubrir {destino.nombre}
														<ArrowRight className="ml-2 h-4 w-4" />
													</Button>
												</a>
												
												<div className="flex items-center gap-2 text-white/40 text-[10px] font-bold uppercase tracking-widest pl-2">
													<Mountain className="h-4 w-4" />
													<span>Turismo Aventura</span>
												</div>
											</div>
										</div>
									</div>
								</div>
							</CarouselItem>
						))}
					</CarouselContent>
					
					{/* Navegación elegante */}
					<div className="absolute top-1/2 -translate-y-1/2 left-4 right-4 flex justify-between z-20 pointer-events-none lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300">
						<CarouselPrevious className="static translate-y-0 h-10 w-10 lg:h-12 lg:w-12 rounded-full border border-white/20 bg-black/40 backdrop-blur-sm text-white hover:bg-white hover:text-slate-900 transition-all pointer-events-auto" />
						<CarouselNext className="static translate-y-0 h-10 w-10 lg:h-12 lg:w-12 rounded-full border border-white/20 bg-black/40 backdrop-blur-sm text-white hover:bg-white hover:text-slate-900 transition-all pointer-events-auto" />
					</div>
				</Carousel>
			</div>
		</section>
	);
}

const Mountain = ({ className }) => (
	<svg 
		className={className} 
		viewBox="0 0 24 24" 
		fill="none" 
		stroke="currentColor" 
		strokeWidth="2" 
		strokeLinecap="round" 
		strokeLinejoin="round"
	>
		<path d="m8 3 4 8 5-5 5 15H2L8 3z"/>
	</svg>
);

export default Destacados;
