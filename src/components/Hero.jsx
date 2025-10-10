import React, { useMemo } from "react";
import heroVan from "../assets/hero-van.png";
import BookingModuleMinimal from "./BookingModuleMinimal";

function Hero({ booking }) {
        const basePercentage = Math.round((booking?.discountInfo?.base || 0) * 100);
        const promotionPercentage = Math.round((booking?.discountInfo?.promotion || 0) * 100);
        const roundTripPercentage = Math.round((booking?.discountInfo?.roundTrip || 0) * 100);
        const personalizedPercentage = Math.round((booking?.discountInfo?.personalized || 0) * 100);

        const promoDetails = useMemo(() => {
                if (!booking?.discountInfo?.activePromotion) return null;
                const { activePromotion } = booking.discountInfo;
                const parts = [];
                if (activePromotion?.descripcion) {
                        parts.push(activePromotion.descripcion);
                }
                if (activePromotion?.dias?.length) {
                                parts.push(`Días: ${activePromotion.dias.join(", ")}`);
                }
                if (activePromotion?.horaInicio && activePromotion?.horaFin) {
                                parts.push(`Horario: ${activePromotion.horaInicio} - ${activePromotion.horaFin}`);
                }
                return parts.join(" · ");
        }, [booking?.discountInfo?.activePromotion]);

        return (
                <section
                        id="inicio"
                        className="relative overflow-hidden bg-slate-900 text-white"
                >
                        <div
                                className="absolute inset-0 opacity-60"
                                style={{ backgroundImage: `url(${heroVan})`, backgroundSize: "cover", backgroundPosition: "center" }}
                        />
                        <div className="absolute inset-0 bg-slate-900/70" />
                        <div className="relative z-10 mx-auto flex min-h-screen w-full flex-col justify-center gap-12 px-4 py-16 sm:px-6 lg:px-8">
                                <div className="mx-auto w-full max-w-5xl text-left">
                                        <p className="text-sm uppercase tracking-[0.3em] text-slate-300">
                                                Traslados privados en La Araucanía
                                        </p>
                                        <h1 className="mt-4 text-4xl font-semibold leading-tight text-white md:text-5xl lg:text-6xl">
                                                Reserva tu transporte entre el Aeropuerto La Araucanía y los destinos más visitados
                                        </h1>
                                        <p className="mt-6 max-w-3xl text-lg text-slate-200 md:text-xl">
                                                Confirma tu chofer en minutos y asegura descuentos web desde {basePercentage}%.
                                                {promotionPercentage > 0 && ` Promoción activa +${promotionPercentage}%`}
                                                {roundTripPercentage > 0 && ` · Ida y vuelta +${roundTripPercentage}%`}
                                                {personalizedPercentage > 0 && ` · Beneficios especiales +${personalizedPercentage}%`}
                                                .
                                        </p>
                                        {promoDetails && (
                                                <p className="mt-3 text-sm text-slate-300">
                                                        {promoDetails}
                                                </p>
                                        )}
                                </div>

                                <div className="mx-auto w-full max-w-6xl">
                                        <BookingModuleMinimal {...booking} />
                                </div>
                        </div>
                </section>
        );
}

export default Hero;
