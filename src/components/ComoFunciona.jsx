import { Separator } from "@/components/ui/separator";
import ScrollReveal from "./animations/ScrollReveal";

const steps = [
	{
		step: "01",
		title: "Reserva online",
		desc: "Completa el formulario con tu información de viaje. Recibirás confirmación en menos de 20 minutos.",
	},
	{
		step: "02",
		title: "Confirmamos y monitoreamos",
		desc: "Rastreamos tu vuelo en tiempo real. Si hay demoras, el conductor ajusta el horario sin costo adicional.",
	},
	{
		step: "03",
		title: "Llegamos puntual",
		desc: "Tu conductor te esperará en el punto acordado con un cartel con tu nombre. Sin esperas ni sorpresas.",
	},
];

function ComoFunciona() {
	return (
		<section className="overflow-hidden bg-[#1E3A14] px-6 py-16 lg:py-24 font-sans h-full flex flex-col justify-start">
			<div className="w-full">
				<ScrollReveal direction="down">
					<p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#C4895E] mb-2">
						¿Cómo funciona?
					</p>
					<h2 className="font-serif text-4xl lg:text-6xl font-medium text-white tracking-tight leading-tight">
						Tres pasos,
						<br />
						<em className="not-italic text-[#C4895E]">sin complicaciones.</em>
					</h2>
				</ScrollReveal>

				<div className="mt-14 space-y-0">
					{steps.map(({ step, title, desc }, index) => (
						<ScrollReveal 
							key={step} 
							direction="up" 
							delay={0.2 + (index * 0.15)}
						>
							{index > 0 && (
								<Separator className="bg-white/10 w-24 lg:w-32 my-2" />
							)}
							<div className="bg-[#1E3A14] py-8">
								<div className="flex items-start gap-8">
									<p className="font-serif text-6xl font-medium text-white/10 leading-none">
										{step}
									</p>
									<div>
										<h3 className="font-serif text-xl font-medium text-white">
											{title}
										</h3>
										<p className="mt-2 text-sm leading-relaxed text-slate-400 max-w-sm">
											{desc}
										</p>
									</div>
								</div>
							</div>
						</ScrollReveal>
					))}
				</div>
			</div>
		</section>
	);
}

export default ComoFunciona;
