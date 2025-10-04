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
		<section id="destacados" className="py-20 bg-muted/40 overflow-hidden">
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

				<Carousel
					opts={{
						align: "start",
						loop: true,
					}}
					plugins={[autoplayPlugin]}
					className="w-full max-w-6xl mx-auto"
				>
					<CarouselContent>
						{destinos.map((destino, index) => (
							<CarouselItem key={index}>
								<div className="p-1">
									<Card className="overflow-hidden border-0 shadow-2xl">
										<CardContent className="relative p-0 aspect-video md:aspect-[2.4/1] flex items-center justify-center text-white">
											{/* Contenedor de la Imagen de Fondo */}
											<div
												className="absolute inset-0 bg-cover bg-center transition-transform duration-500 ease-in-out group-hover:scale-105"
												style={{ backgroundImage: `url(${destino.imagen})` }}
											></div>
											{/* Capa Oscura para Contraste */}
											<div className="absolute inset-0 bg-black/50"></div>

											{/* Contenido de Texto Superpuesto */}
											<div className="relative z-10 p-8 md:p-12 text-center max-w-2xl">
												<h3 className="text-3xl md:text-4xl font-bold mb-2 text-shadow-lg">
													{destino.titulo}
												</h3>
												<p className="text-lg text-shadow md:text-xl mb-4 font-light opacity-90">
													{destino.subtitulo}
												</p>
												<p className="mb-8 text-shadow-sm opacity-95">
													{destino.descripcion}
												</p>
												<a href="#contacto">
													<Button
														size="lg"
														className="bg-accent hover:bg-accent/90 text-accent-foreground text-lg py-3 px-6 focus-visible:ring-accent/30 shadow-lg"
													>
														Cotizar Viaje a {destino.nombre}
														<ArrowRight className="ml-2 h-5 w-5" />
													</Button>
												</a>
											</div>
										</CardContent>
									</Card>
								</div>
							</CarouselItem>
						))}
					</CarouselContent>
					<CarouselPrevious className="absolute left-[-50px] top-1/2 -translate-y-1/2 hidden md:inline-flex h-12 w-12 bg-white/80 hover:bg-white text-primary" />
					<CarouselNext className="absolute right-[-50px] top-1/2 -translate-y-1/2 hidden md:inline-flex h-12 w-12 bg-white/80 hover:bg-white text-primary" />
				</Carousel>
			</div>
		</section>
	);
}

export default Destacados;
