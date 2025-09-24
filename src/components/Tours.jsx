import React from "react";
import { Button } from "@/components/ui/button";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import {
	ArrowRight,
	MapPin,
	Camera,
	Mountain,
	Trees,
	Clock,
	CheckCircle,
} from "lucide-react";

// Importa las imágenes que usarás para cada tour
import conguillioImage from "../assets/conguilllio.jpg";
import corralcoImage from "../assets/corralco.jpg";

// Componente interno para los puntos del itinerario
const ItineraryStop = ({ icon, title, description }) => {
        const IconComponent = icon;

        return (
                <div className="flex items-start">
                        {IconComponent ? (
                                <IconComponent className="h-6 w-6 text-primary mr-4 mt-1 flex-shrink-0" />
                        ) : null}
                        <div>
                                <p className="font-semibold">{title}</p>
                                <p className="text-muted-foreground text-sm">{description}</p>
                        </div>
                </div>
        );
};

function Tours() {
	return (
		<section id="tours" className="py-24 bg-white">
			<div className="container mx-auto px-4">
				<div className="text-center mb-16">
					<h2 className="text-4xl font-bold mb-4 text-gray-800">
						Tours por la Araucanía Andina
					</h2>
					<p className="text-xl text-muted-foreground max-w-3xl mx-auto">
						Vive una experiencia inolvidable por el día, descubriendo los
						paisajes únicos y la cultura ancestral de la Araucanía Andina desde
						Temuco.
					</p>
				</div>

				<Accordion
					type="single"
					collapsible
					className="w-full max-w-5xl mx-auto"
				>
					{/* ITINERARIO 1: RUTA DEL PEHUÉN */}
					<AccordionItem value="item-1">
						<AccordionTrigger className="text-xl md:text-2xl font-semibold hover:no-underline">
							Ruta del Pehuén: Volcanes y Araucarias
						</AccordionTrigger>
						<AccordionContent className="pt-4">
							<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
								<div className="space-y-6">
									<p className="text-muted-foreground">
										Un viaje escénico hacia el corazón de la cordillera,
										explorando paisajes moldeados por volcanes y bosques de
										araucarias milenarias.
									</p>
									<div className="space-y-4">
										<ItineraryStop
											icon={Camera}
											title="Salto de la Princesa y Salto del Indio"
											description="Comenzamos con paradas fotográficas en estas hermosas cascadas cercanas a Curacautín."
										/>
										<ItineraryStop
											icon={Mountain}
											title="Centro de Ski Corralco"
											description="Ascendemos por las faldas del volcán Lonquimay para disfrutar de vistas panorámicas impresionantes."
										/>
										<ItineraryStop
											icon={Trees}
											title="Túnel Las Raíces"
											description="Atravesamos uno de los túneles más largos de Sudamérica, una obra de ingeniería histórica."
										/>
										<ItineraryStop
											icon={MapPin}
											title="Villa de Lonquimay"
											description="Visitamos este pintoresco pueblo fronterizo, conociendo su cultura y gastronomía local (almuerzo no incluido)."
										/>
									</div>
									<a href="#contacto">
										<Button size="lg" className="w-full sm:w-auto">
											Reservar Tour Ruta del Pehuén
											<ArrowRight className="ml-2 h-5 w-5" />
										</Button>
									</a>
								</div>
								<div>
									<img
										src={corralcoImage}
										alt="Paisaje del volcán Lonquimay y Corralco"
										className="rounded-lg shadow-lg w-full h-full object-cover aspect-square"
									/>
								</div>
							</div>
						</AccordionContent>
					</AccordionItem>

					{/* ITINERARIO 2: PARQUE NACIONAL CONGUILLÍO */}
					<AccordionItem value="item-2">
						<AccordionTrigger className="text-xl md:text-2xl font-semibold hover:no-underline">
							Corazón de Conguillío: Lagos y Escoria Volcánica
						</AccordionTrigger>
						<AccordionContent className="pt-4">
							<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
								<div className="space-y-6">
									<p className="text-muted-foreground">
										Sumérgete en un paisaje prehistórico declarado Geoparque
										Mundial por la UNESCO. Un viaje al pasado de nuestro
										planeta.
									</p>
									<div className="space-y-4">
										<ItineraryStop
											icon={MapPin}
											title="Melipeuco, puerta de entrada"
											description="Iniciamos nuestra aventura en el principal acceso al Parque Nacional Conguillío."
										/>
										<ItineraryStop
											icon={Camera}
											title="Salto del Truful-Truful"
											description="Contempla la espectacular caída de agua sobre un lecho de lava volcánica solidificada."
										/>
										<ItineraryStop
											icon={Trees}
											title="Laguna Verde y Laguna Arcoíris"
											description="Caminata suave para descubrir los colores únicos de estas lagunas y los bosques hundidos."
										/>
										<ItineraryStop
											icon={Mountain}
											title="Lago Conguillío y Volcán Llaima"
											description="Disfruta de la vista icónica del parque con el imponente volcán de fondo y aguas turquesas."
										/>
									</div>
									<a href="#contacto">
										<Button size="lg" className="w-full sm:w-auto">
											Reservar Tour a Conguillío
											<ArrowRight className="ml-2 h-5 w-5" />
										</Button>
									</a>
								</div>
								<div>
									<img
										src={conguillioImage}
										alt="Paisaje del Parque Nacional Conguillío con el Volcán Llaima"
										className="rounded-lg shadow-lg w-full h-full object-cover aspect-square"
									/>
								</div>
							</div>
						</AccordionContent>
					</AccordionItem>
				</Accordion>

				<div className="mt-16 p-6 bg-muted/40 rounded-lg max-w-5xl mx-auto">
					<div className="flex flex-col md:flex-row items-center text-center md:text-left gap-6">
						<Clock className="h-12 w-12 text-primary flex-shrink-0" />
						<div>
							<h4 className="text-xl font-bold mb-1">
								Todos nuestros tours incluyen:
							</h4>
							<p className="text-muted-foreground">
								<span className="inline-flex items-center mr-4">
									<CheckCircle className="h-4 w-4 mr-2 text-green-600" />
									Transporte privado climatizado.
								</span>
								<span className="inline-flex items-center mr-4">
									<CheckCircle className="h-4 w-4 mr-2 text-green-600" />
									Conductor profesional.
								</span>
								<span className="inline-flex items-center">
									<CheckCircle className="h-4 w-4 mr-2 text-green-600" />
									Flexibilidad horaria.
								</span>
							</p>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}

export default Tours;
