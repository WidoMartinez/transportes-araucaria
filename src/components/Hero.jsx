import React, { useMemo } from "react";
import BookingModuleMinimal from "./BookingModuleMinimal";

function Hero({ bookingModule }) {
        const data = bookingModule?.data || {};

        const baseDiscountPercentage = Math.round((data.baseDiscountRate || 0) * 100);
        const promoDiscountPercentage = Math.round((data.promotionDiscountRate || 0) * 100);
        const roundTripDiscountPercentage = Math.round((data.roundTripDiscountRate || 0) * 100);
        const personalizedDiscountPercentage = Math.round(
                (data.personalizedDiscountRate || 0) * 100
        );

        const extraDiscountCopy = useMemo(() => {
                const parts = [];
                if (promoDiscountPercentage > 0) {
                        parts.push(`${promoDiscountPercentage}% extra por promociones activas`);
                }
                if (roundTripDiscountPercentage > 0) {
                        parts.push(
                                `${roundTripDiscountPercentage}% adicional al reservar ida y vuelta`
                        );
                }
                if (personalizedDiscountPercentage > 0) {
                        parts.push(`${personalizedDiscountPercentage}% en descuentos especiales`);
                }
                return parts.length > 0 ? ` + ${parts.join(" + ")}` : "";
        }, [
                promoDiscountPercentage,
                roundTripDiscountPercentage,
                personalizedDiscountPercentage,
        ]);

        return (
                <section id="inicio" className="bg-slate-100 py-16 sm:py-20">
                        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                                <div className="grid gap-12 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-start">
                                        <div className="space-y-6 text-slate-800">
                                                <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                                                        Traslados privados en La Araucanía
                                                </p>
                                                <h1 className="text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">
                                                        Traslados aeropuerto y destinos turísticos con confirmación inmediata
                                                </h1>
                                                <p className="text-base text-slate-600 sm:text-lg">
                                                        Transportes Araucaria conecta el Aeropuerto La Araucanía con Malalcahuello,
                                                        Pucón, Villarrica y los principales destinos de la región. Reserva en línea,
                                                        coordina tu conductor y asegura desde un {baseDiscountPercentage}% de descuento web
                                                        garantizado{extraDiscountCopy}.
                                                </p>
                                                <p className="text-sm text-slate-500">
                                                        Completa el formulario y confirma tu pago en una sola vista. Un módulo limpio,
                                                        fondo claro y tipografía neutra para que te concentres en tu viaje.
                                                </p>
                                        </div>
                                        <BookingModuleMinimal {...bookingModule} />
                                </div>
                        </div>
                </section>
        );
}

export default Hero;
