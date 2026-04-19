import React from "react";
import { 
	Clock, 
	Car, 
	UserCheck, 
	CreditCard, 
	CalendarCheck, 
	Radio,
	Sparkles,
	Baby
} from "lucide-react";
import { cn } from "@/lib/utils";

const VENTAJAS = [
	{
		titulo: "Puntualidad Garantizada",
		desc: "Llegamos siempre a tiempo para que no pierdas tu vuelo o conexión.",
		icon: Clock,
		color: "text-[#C4895E]",
		bg: "bg-[#8C5E42]/10"
	},
	{
		titulo: "Confort y Privacidad",
		desc: "Nuestros vehículos privados te ofrecen un viaje cómodo, discreto y con espacio suficiente para tu equipaje.",
		icon: Car,
		color: "text-[#C4895E]",
		bg: "bg-[#8C5E42]/10"
	},
	{
		titulo: "Conductores Profesionales",
		desc: "Personal capacitado, con licencia profesional y conocimiento local de toda la región.",
		icon: UserCheck,
		color: "text-[#C4895E]",
		bg: "bg-[#8C5E42]/10"
	},
	{
		titulo: "Tarifas Competitivas",
		desc: "Precios justos sin sorpresas, con descuentos especiales para grupos y viajes de ida y vuelta.",
		icon: CreditCard,
		color: "text-[#C4895E]",
		bg: "bg-[#8C5E42]/10"
	},
	{
		titulo: "Disponible 24/7",
		desc: "Servicio disponible todos los días del año, adaptándonos totalmente a tu horario de llegada o salida.",
		icon: CalendarCheck,
		color: "text-[#C4895E]",
		bg: "bg-[#8C5E42]/10"
	},
	{
		titulo: "Sillas para Niños",
		desc: "Uso obligatorio de sillas de seguridad para niños en todos nuestros servicios sin costo adicional.",
		icon: Baby,
		color: "text-[#C4895E]",
		bg: "bg-[#8C5E42]/10"
	},
	{
		titulo: "Pago en Cuotas",
		desc: "Flexibilidad total: paga hasta en 3 cuotas sin intereses con Flow en todos tus viajes.",
		icon: CreditCard,
		color: "text-[#C4895E]",
		bg: "bg-[#8C5E42]/10"
	}
];

function PorQueElegirnos() {
	return (
		<section className="py-24 bg-transparent text-white relative overflow-hidden">
			<div className="container mx-auto px-6 relative z-10 font-sans">
				<div className="text-center mb-20 max-w-3xl mx-auto">
					<p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#C4895E] mb-3">
						Nuestro Compromiso
					</p>
					<h2 className="font-serif text-4xl md:text-6xl font-medium text-white mb-6">
						¿Por qué <em className="not-italic text-[#C4895E]">elegirnos</em>?
					</h2>
					<p className="text-lg opacity-80 leading-relaxed font-light">
						Más de 10 años redefiniendo el estándar de traslados en el sur de Chile con un servicio enfocado en la excelencia y la confianza.
					</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
					{VENTAJAS.map((v, i) => (
						<div key={i} className="group h-full">
							<div className="flex flex-col gap-6 p-8 rounded-[2rem] bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-500 h-full backdrop-blur-sm">
								<div className={cn(
									"p-4 rounded-2xl w-fit transition-all duration-500 group-hover:scale-110",
									v.bg,
									"border border-white/10"
								)}>
									<v.icon className={cn("w-6 h-6", v.color)} />
								</div>
								<div>
									<h3 className="text-xl font-bold mb-3 tracking-tight group-hover:text-[#C4895E] transition-colors">
										{v.titulo}
									</h3>
									<p className="opacity-70 font-light leading-relaxed text-sm">
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
