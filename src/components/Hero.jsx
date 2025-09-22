import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { CheckCircle2, MapPin, ShieldCheck, Timer } from "lucide-react";
import heroVan from "../assets/hero-van.png";
import { useReservaWizard } from "./ReservaWizard";

function Hero({ destinos = [] }) {
        const { startWizard, hasProgress, currentStep, steps } = useReservaWizard();

        const highlightedDestinos = destinos.slice(0, 3).map((destino) => destino.nombre);
        const currentStepTitle = steps?.[currentStep]?.title || "Datos del viaje";
        const destinosTexto = highlightedDestinos.length
                ? `Destinos frecuentes: ${highlightedDestinos.join(", ")}${
                          destinos.length > highlightedDestinos.length
                                  ? " y más ciudades de la región."
                                  : "."
                  }`
                : "Cobertura completa en la Región de La Araucanía.";

        const handleStart = () => {
                startWizard();
        };

        return (
                <section
                        id="inicio"
                        className="relative bg-gradient-to-r from-primary to-secondary text-white min-h-screen flex items-center"
                >
                        <div className="absolute inset-0 bg-black/30" />
                        <div
                                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                                style={{ backgroundImage: `url(${heroVan})` }}
                        />
                        <div className="relative container mx-auto px-4 text-center space-y-10">
                                <div className="space-y-6">
                                        <h2 className="text-5xl md:text-6xl font-bold leading-tight animate-fade-in-down">
                                                Tu viaje privado en La Araucanía
                                                <br />
                                                <span className="text-accent">ahora con reserva guiada paso a paso</span>
                                        </h2>
                                        <p className="text-xl md:text-2xl max-w-3xl mx-auto">
                                                Coordina traslados desde y hacia el Aeropuerto La Araucanía con choferes
                                                certificados. Guarda tu progreso, añade extras y recibe confirmación en
                                                minutos.
                                        </p>
                                </div>
                                <Card className="max-w-5xl mx-auto bg-white/95 backdrop-blur-sm shadow-xl border">
                                        <CardHeader className="space-y-2">
                                                <CardTitle className="text-foreground text-center text-2xl">
                                                        Completa tu reserva en 4 pasos
                                                </CardTitle>
                                                <p className="text-sm text-muted-foreground text-center">
                                                        El asistente conserva tu información aunque cierres la página.
                                                </p>
                                        </CardHeader>
                                        <CardContent className="space-y-8">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                                                        {(steps || []).map((step, index) => (
                                                                <div
                                                                        key={step.title}
                                                                        className="flex items-start space-x-3 rounded-lg border border-muted/60 bg-muted/20 p-4"
                                                                >
                                                                        <Badge variant="secondary" className="mt-0.5">
                                                                                Paso {index + 1}
                                                                        </Badge>
                                                                        <div>
                                                                                <p className="font-semibold text-foreground">
                                                                                        {step.title}
                                                                                </p>
                                                                                <p className="text-sm text-muted-foreground">
                                                                                        {step.description}
                                                                                </p>
                                                                        </div>
                                                                </div>
                                                        ))}
                                                </div>
                                                {hasProgress && (
                                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border border-primary/30 bg-primary/10 p-4 text-left">
                                                                <div className="flex items-center space-x-3">
                                                                        <CheckCircle2 className="h-5 w-5 text-primary" />
                                                                        <div>
                                                                                <p className="font-semibold text-primary">
                                                                                        ¡Tienes un borrador guardado!
                                                                                </p>
                                                                                <p className="text-sm text-muted-foreground">
                                                                                        Retomaremos tu reserva en "{currentStepTitle}".
                                                                                </p>
                                                                        </div>
                                                                </div>
                                                                <Button variant="outline" onClick={handleStart}>
                                                                        Continuar donde quedé
                                                                </Button>
                                                        </div>
                                                )}
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                                                        <div className="flex items-start space-x-3">
                                                                <MapPin className="h-5 w-5 text-primary mt-0.5" />
                                                                <div>
                                                                        <p className="font-semibold text-foreground">Rutas a medida</p>
                                                                        <p className="text-sm text-muted-foreground">
                                                                                Define origen, destino y paradas intermedias según tus planes.
                                                                        </p>
                                                                </div>
                                                        </div>
                                                        <div className="flex items-start space-x-3">
                                                                <Timer className="h-5 w-5 text-primary mt-0.5" />
                                                                <div>
                                                                        <p className="font-semibold text-foreground">Confirmación rápida</p>
                                                                        <p className="text-sm text-muted-foreground">
                                                                                Recibe el resumen con abono sugerido y recordatorios automáticos.
                                                                        </p>
                                                                </div>
                                                        </div>
                                                        <div className="flex items-start space-x-3">
                                                                <ShieldCheck className="h-5 w-5 text-primary mt-0.5" />
                                                                <div>
                                                                        <p className="font-semibold text-foreground">Seguridad y soporte</p>
                                                                        <p className="text-sm text-muted-foreground">
                                                                                Conductores certificados, monitoreo de vuelos y asistencia 24/7.
                                                                        </p>
                                                                </div>
                                                        </div>
                                                </div>
                                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                                        <Button
                                                                size="lg"
                                                                className="bg-accent hover:bg-accent/90 text-lg px-10"
                                                                onClick={handleStart}
                                                        >
                                                                Iniciar mi reserva ahora
                                                        </Button>
                                                        <p className="text-sm text-muted-foreground">{destinosTexto}</p>
                                                </div>
                                        </CardContent>
                                </Card>
                        </div>
                </section>
        );
}

export default Hero;
