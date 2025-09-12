import React from "react";
import { CheckCircle } from "lucide-react";

function PorQueElegirnos() {
	return (
		<section className="py-20 bg-primary text-white">
			<div className="container mx-auto px-4">
				<div className="text-center mb-16">
					<h2 className="text-4xl font-bold mb-4">
						¿Por qué elegir Transportes Araucaria?
					</h2>
					<p className="text-xl opacity-90 max-w-2xl mx-auto">
						Más de 10 años de experiencia brindando el mejor servicio de
						traslados en La Araucanía
					</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
					<div className="flex items-start space-x-4">
						<CheckCircle className="h-8 w-8 text-accent flex-shrink-0 mt-1" />
						<div>
							<h3 className="text-xl font-semibold mb-2">
								Puntualidad Garantizada
							</h3>
							<p className="opacity-90">
								Llegamos siempre a tiempo para que no pierdas tu vuelo o
								conexión.
							</p>
						</div>
					</div>
					<div className="flex items-start space-x-4">
						<CheckCircle className="h-8 w-8 text-accent flex-shrink-0 mt-1" />
						<div>
							<h3 className="text-xl font-semibold mb-2">
								Confort y Privacidad
							</h3>
							<p className="opacity-90">
								Nuestros vehículos privados te ofrecen un viaje cómodo, discreto
								y con espacio suficiente para tu equipaje.
							</p>
						</div>
					</div>
					<div className="flex items-start space-x-4">
						<CheckCircle className="h-8 w-8 text-accent flex-shrink-0 mt-1" />
						<div>
							<h3 className="text-xl font-semibold mb-2">
								Conductores Profesionales
							</h3>
							<p className="opacity-90">
								Personal capacitado, con licencia profesional y conocimiento
								local.
							</p>
						</div>
					</div>
					<div className="flex items-start space-x-4">
						<CheckCircle className="h-8 w-8 text-accent flex-shrink-0 mt-1" />
						<div>
							<h3 className="text-xl font-semibold mb-2">
								Tarifas Competitivas
							</h3>
							<p className="opacity-90">
								Precios justos sin sorpresas, con descuentos para grupos.
							</p>
						</div>
					</div>
					<div className="flex items-start space-x-4">
						<CheckCircle className="h-8 w-8 text-accent flex-shrink-0 mt-1" />
						<div>
							<h3 className="text-xl font-semibold mb-2">Disponible 24/7</h3>
							<p className="opacity-90">
								Servicio disponible todos los días, adaptándonos a tu horario.
							</p>
						</div>
					</div>
					<div className="flex items-start space-x-4">
						<CheckCircle className="h-8 w-8 text-accent flex-shrink-0 mt-1" />
						<div>
							<h3 className="text-xl font-semibold mb-2">
								Seguimiento en Tiempo Real
							</h3>
							<p className="opacity-90">
								Monitoreo del vuelo y comunicación constante vía WhatsApp.
							</p>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}

export default PorQueElegirnos;
