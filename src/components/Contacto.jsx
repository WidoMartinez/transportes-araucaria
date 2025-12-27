import React from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";
import { Phone, Mail, MapPin, Clock } from "lucide-react";

// Componente interno para reutilizar la lógica de mostrar información de contacto
const InfoItem = ({ icon: Icon, title, children }) => (
	<div className="flex items-start space-x-4">
		<div className="flex-shrink-0">
			<Icon className="h-6 w-6 text-primary mt-1" />
		</div>
		<div>
			<p className="font-semibold text-lg">{title}</p>
			<div className="text-muted-foreground">{children}</div>
		</div>
	</div>
);

function Contacto() {
	return (
		<section id="contacto" className="py-24 bg-gray-50/50">
			<div className="container mx-auto px-4">
				<div className="text-center mb-16">
					<h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
						Hablemos
					</h2>
					<p className="text-lg text-muted-foreground max-w-3xl mx-auto">
						Estamos disponibles para atenderte 24/7 y responder a todas tus consultas sobre nuestros servicios de transporte.
					</p>
				</div>

				<div className="max-w-3xl mx-auto">
					{/* Columna de Información de Contacto */}
					<Card className="shadow-md border h-full">
						<CardHeader>
							<CardTitle className="text-2xl text-center">
								Información de Contacto
							</CardTitle>
							<CardDescription className="text-center">
								Contáctanos directamente por cualquiera de estos medios.
							</CardDescription>
						</CardHeader>
						<CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
							<InfoItem icon={Phone} title="Teléfono">
								<a
									href="tel:+56936643540"
									className="hover:text-primary transition-colors duration-300"
								>
									+56 9 3664 3540
								</a>
							</InfoItem>
							<InfoItem icon={Mail} title="Email">
								<a
									href="mailto:contacto@transportesaraucaria.cl"
									className="hover:text-primary transition-colors duration-300"
								>
									contacto@transportesaraucaria.cl
								</a>
							</InfoItem>
							<InfoItem icon={MapPin} title="Ubicación">
								<p>Temuco, Región de La Araucanía</p>
							</InfoItem>
							<InfoItem icon={Clock} title="Horarios">
								<p>Disponible 24 horas, 7 días a la semana.</p>
							</InfoItem>
						</CardContent>
					</Card>
				</div>
			</div>
		</section>
	);
}

export default Contacto;
