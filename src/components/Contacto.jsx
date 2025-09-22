import React from "react";
import {
        Card,
        CardContent,
        CardDescription,
        CardHeader,
        CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Phone, Mail, MapPin, Clock, CheckCircle2, CalendarDays, ShieldCheck } from "lucide-react";
import { useReservaWizard } from "./ReservaWizard";

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
        const { startWizard, hasProgress, currentStep, steps } = useReservaWizard();
        const currentStepTitle = steps?.[currentStep]?.title || "Datos del viaje";

        return (
                <section id="contacto" className="py-24 bg-gray-50/50">
                        <div className="container mx-auto px-4">
                                <div className="text-center mb-16">
                                        <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
                                                Estamos para ayudarte
                                        </h2>
                                        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                                                Nuestro equipo responde en menos de 30 minutos. Puedes iniciar el asistente de
                                                reservas o contactarnos directamente por los canales disponibles.
                                        </p>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
                                        <div className="lg:col-span-2">
                                                <Card className="shadow-md border-transparent h-full bg-transparent">
                                                        <CardHeader>
                                                                <CardTitle className="text-2xl">Información de Contacto</CardTitle>
                                                                <CardDescription>
                                                                        Disponibilidad 24/7 y seguimiento personalizado.
                                                                </CardDescription>
                                                        </CardHeader>
                                                        <CardContent className="space-y-8">
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
                                                                        <p>Atención continua, todos los días del año.</p>
                                                                </InfoItem>
                                                        </CardContent>
                                                </Card>
                                        </div>

                                        <div className="lg:col-span-3">
                                                <Card className="shadow-md border">
                                                        <CardHeader>
                                                                <CardTitle className="text-2xl">Agenda tu traslado ahora</CardTitle>
                                                                <CardDescription>
                                                                        Abre el wizard para definir tu viaje, personalizar extras y confirmar la reserva en minutos.
                                                                </CardDescription>
                                                        </CardHeader>
                                                        <CardContent className="space-y-8">
                                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                                        <div className="flex items-start space-x-3">
                                                                                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                                                                                <div>
                                                                                        <p className="font-semibold text-foreground">Progreso guardado</p>
                                                                                        <p className="text-sm text-muted-foreground">
                                                                                                Recupera tu información aunque cierres la página.
                                                                                        </p>
                                                                                </div>
                                                                        </div>
                                                                        <div className="flex items-start space-x-3">
                                                                                <CalendarDays className="h-5 w-5 text-primary mt-0.5" />
                                                                                <div>
                                                                                        <p className="font-semibold text-foreground">Fechas flexibles</p>
                                                                                        <p className="text-sm text-muted-foreground">
                                                                                                Validamos horarios mínimos y seguimiento de vuelos.
                                                                                        </p>
                                                                                </div>
                                                                        </div>
                                                                        <div className="flex items-start space-x-3">
                                                                                <ShieldCheck className="h-5 w-5 text-primary mt-0.5" />
                                                                                <div>
                                                                                        <p className="font-semibold text-foreground">Confirmación segura</p>
                                                                                        <p className="text-sm text-muted-foreground">
                                                                                                Recibe resumen, políticas y enlaces para abonar.
                                                                                        </p>
                                                                                </div>
                                                                        </div>
                                                                </div>
                                                                {hasProgress && (
                                                                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
                                                                                <div>
                                                                                        <p className="font-semibold text-primary">
                                                                                                Continúa donde quedaste
                                                                                        </p>
                                                                                        <p className="text-sm text-muted-foreground">
                                                                                                Abriremos el paso "{currentStepTitle}" para completar tu solicitud.
                                                                                        </p>
                                                                                </div>
                                                                                <Button variant="outline" onClick={() => startWizard()}>
                                                                                        Reanudar reserva
                                                                                </Button>
                                                                        </div>
                                                                )}
                                                                <div className="space-y-3 text-left">
                                                                        <p className="text-sm text-muted-foreground">
                                                                                Nuestro asistente contempla paradas intermedias, equipaje especial y códigos promocionales.
                                                                                También puedes añadir comentarios para facturación y preferencias de viaje.
                                                                        </p>
                                                                        <Button size="lg" className="w-full" onClick={() => startWizard()}>
                                                                                Abrir asistente de reservas
                                                                        </Button>
                                                                        <p className="text-xs text-muted-foreground">
                                                                                ¿Prefieres coordinar por WhatsApp? Escríbenos al +56 9 3664 3540 y uno de nuestros coordinadores te guiará paso a paso.
                                                                        </p>
                                                                </div>
                                                        </CardContent>
                                                </Card>
                                        </div>
                                </div>
                        </div>
                </section>
        );
}

export default Contacto;
