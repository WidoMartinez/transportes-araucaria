import React from "react";
import { 
	Clock, 
	Car, 
	UserCheck, 
	CreditCard, 
	CalendarCheck, 
	Radio,
	Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

const VENTAJAS = [
	{
		titulo: "Puntualidad Garantizada",
		desc: "Llegamos siempre a tiempo para que no pierdas tu vuelo o conexión.",
		icon: Clock,
		color: "text-amber-400",
		bg: "bg-amber-400/10"
	},
	{
		titulo: "Confort y Privacidad",
		desc: "Nuestros vehículos privados te ofrecen un viaje cómodo, discreto y con espacio suficiente para tu equipaje.",
		icon: Car,
		color: "text-blue-400",
		bg: "bg-blue-400/10"
	},
	{
		titulo: "Conductores Profesionales",
		desc: "Personal capacitado, con licencia profesional y conocimiento local de toda la región.",
		icon: UserCheck,
		color: "text-emerald-400",
		bg: "bg-emerald-400/10"
	},
	{
		titulo: "Tarifas Competitivas",
		desc: "Precios justos sin sorpresas, con descuentos especiales para grupos y viajes de ida y vuelta.",
		icon: CreditCard,
		color: "text-purple-400",
		bg: "bg-purple-400/10"
	},
	{
		titulo: "Disponible 24/7",
		desc: "Servicio disponible todos los días del año, adaptándonos totalmente a tu horario de llegada o salida.",
		icon: CalendarCheck,
		color: "text-rose-400",
		bg: "bg-rose-400/10"
	},
	{
		titulo: "Seguimiento en Tiempo Real",
		desc: "Monitoreo del vuelo y comunicación constante vía WhatsApp para tu total tranquilidad.",
		icon: Radio,
		color: "text-cyan-400",
		bg: "bg-cyan-400/10"
	}
];

function PorQueElegirnos() {
	return (
		<section className="py-24 bg-transparent text-white relative overflow-hidden">
			{/* Decoración de fondo */}
			<div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none opacity-20">
				<div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px]" />
				<div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px]" />
			</div>

			<div className="container mx-auto px-4 relative z-10">
				<div className="text-center mb-20">
					<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-sm font-bold mb-4 backdrop-blur-sm">
						<Sparkles className="w-4 h-4 text-primary" />
						<span>Elegancia & Seguridad</span>
					</div>
					<h2 className="text-5xl font-extrabold mb-6 tracking-tight">
						¿Por qué elegir <span className="text-primary italic">Transportes Araucaria</span>?
					</h2>
					<p className="text-xl opacity-80 max-w-3xl mx-auto leading-relaxed">
						Más de 10 años redefiniendo el estándar de traslados en el sur de Chile con un servicio enfocado en la excelencia.
					</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
					{VENTAJAS.map((v, i) => (
						<div key={i} className="group relative">
							<div className="flex items-start gap-5 p-6 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary/5 h-full">
								<div className={cn(
									"p-4 rounded-2xl shrink-0 transition-all duration-500 group-hover:scale-110",
									v.bg,
									"border border-white/10 shadow-lg relative overflow-hidden"
								)}>
									<v.icon className={cn("w-7 h-7 drop-shadow-md", v.color)} />
								</div>
								<div className="pt-1">
									<h3 className="text-xl font-bold mb-3 tracking-tight group-hover:text-primary transition-colors">
										{v.titulo}
									</h3>
									<p className="opacity-70 leading-relaxed text-[15px]">
										{v.desc}
									</p>
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}

export default PorQueElegirnos;
