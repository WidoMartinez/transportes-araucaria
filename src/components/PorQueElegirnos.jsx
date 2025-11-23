import React from "react";
import { CheckCircle } from "lucide-react";

function PorQueElegirnos() {
	return (
		<section className="py-20 bg-primary text-white">
			<div className="container mx-auto px-4">
				<div className="text-center mb-16">
					{/* H2 optimizado con valor diferencial y keywords */}
					<h2 className="text-4xl font-bold mb-4">
						Empresa Líder en Transfer y Transporte Privado en La Araucanía
					</h2>
					{/* Descripción con keywords de confianza y experiencia */}
					<p className="text-xl opacity-90 max-w-2xl mx-auto">
						Más de 10 años conectando el Aeropuerto La Araucanía con Temuco, Pucón y Villarrica. 
						El mejor servicio de traslados privados con cientos de clientes satisfechos.
					</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
					<div className="flex items-start space-x-4">
						<CheckCircle className="h-8 w-8 text-accent flex-shrink-0 mt-1" />
						<div>
							{/* H3 con keyword de beneficio */}
							<h3 className="text-xl font-semibold mb-2">
								Transfer Puntual Garantizado
							</h3>
							<p className="opacity-90">
								Llegamos siempre a tiempo. Monitoreamos tu vuelo en el Aeropuerto La Araucanía 
								para que no pierdas tu conexión o llegues tarde a tu destino.
							</p>
						</div>
					</div>
					<div className="flex items-start space-x-4">
						<CheckCircle className="h-8 w-8 text-accent flex-shrink-0 mt-1" />
						<div>
							{/* H3 con keyword de servicio privado */}
							<h3 className="text-xl font-semibold mb-2">
								Transporte Privado Confortable
							</h3>
							<p className="opacity-90">
								Vehículos modernos y exclusivos para tu comodidad. Viaje cómodo, discreto 
								y con amplio espacio para equipaje. Sin compartir con otros pasajeros.
							</p>
						</div>
					</div>
					<div className="flex items-start space-x-4">
						<CheckCircle className="h-8 w-8 text-accent flex-shrink-0 mt-1" />
						<div>
							{/* H3 con keyword de seguridad */}
							<h3 className="text-xl font-semibold mb-2">
								Conductores Certificados
							</h3>
							<p className="opacity-90">
								Personal profesional capacitado con licencia clase A1. 
								Conocimiento experto de las rutas de La Araucanía para un viaje seguro.
							</p>
						</div>
					</div>
					<div className="flex items-start space-x-4">
						<CheckCircle className="h-8 w-8 text-accent flex-shrink-0 mt-1" />
						<div>
							{/* H3 con keyword de precios */}
							<h3 className="text-xl font-semibold mb-2">
								Precios Transparentes Online
							</h3>
							<p className="opacity-90">
								Tarifas competitivas sin costos ocultos. Descuentos por reserva online, 
								viajes de ida y vuelta, y grupos. Paga online o en efectivo.
							</p>
						</div>
					</div>
					<div className="flex items-start space-x-4">
						<CheckCircle className="h-8 w-8 text-accent flex-shrink-0 mt-1" />
						<div>
							{/* H3 con keyword de disponibilidad */}
							<h3 className="text-xl font-semibold mb-2">
								Servicio 24 Horas Todos los Días
							</h3>
							<p className="opacity-90">
								Transfer disponible 24/7 los 365 días del año. Nos adaptamos a tu horario, 
								incluso vuelos de madrugada o días festivos.
							</p>
						</div>
					</div>
					<div className="flex items-start space-x-4">
						<CheckCircle className="h-8 w-8 text-accent flex-shrink-0 mt-1" />
						<div>
							{/* H3 con keyword de tecnología */}
							<h3 className="text-xl font-semibold mb-2">
								Seguimiento de Vuelos en Tiempo Real
							</h3>
							<p className="opacity-90">
								Monitoreo automático de tu vuelo y comunicación directa por WhatsApp. 
								Te mantenemos informado durante todo el traslado.
							</p>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}

export default PorQueElegirnos;
