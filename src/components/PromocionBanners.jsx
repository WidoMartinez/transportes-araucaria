import { useState, useEffect, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";
import ReservaRapidaModal from "./ReservaRapidaModal";
import { getBackendUrl } from "../lib/backend";

/**
 * Componente de carrusel de banners promocionales
 * Muestra promociones activas con imágenes clicables
 * Al hacer clic, abre modal de reserva rápida con datos pre-cargados
 */
export default function PromocionBanners() {
const [promociones, setPromociones] = useState([]);
const [selectedPromocion, setSelectedPromocion] = useState(null);
const [isModalOpen, setIsModalOpen] = useState(false);

// Configurar embla carousel con autoplay
const [emblaRef, emblaApi] = useEmblaCarousel(
{ loop: true, align: "center" },
[Autoplay({ delay: 5000, stopOnInteraction: true })]
);

// Cargar promociones activas
useEffect(() => {
fetch(`${getBackendUrl()}/api/promociones-banner/activas`)
.then((res) => res.json())
.then((data) => {
if (Array.isArray(data) && data.length > 0) {
setPromociones(data);
}
})
.catch((error) => {
console.error("Error al cargar promociones:", error);
});
}, []);

// Navegar al banner anterior
const scrollPrev = useCallback(() => {
if (emblaApi) emblaApi.scrollPrev();
}, [emblaApi]);

// Navegar al banner siguiente
const scrollNext = useCallback(() => {
if (emblaApi) emblaApi.scrollNext();
}, [emblaApi]);

// Manejar clic en banner
const handleBannerClick = (promocion) => {
setSelectedPromocion(promocion);
setIsModalOpen(true);
};

// No mostrar nada si no hay promociones
if (promociones.length === 0) {
return null;
}

  return (
    <>

    <section className="bg-white py-12 md:py-16 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="relative group/carousel">
          {/* Carrusel */}
          <div className="overflow-hidden rounded-3xl" ref={emblaRef}>
            <div className="flex">
              {promociones.map((promo) => (
                <div
                  key={promo.id}
                  className="flex-[0_0_100%] min-w-0 px-2 md:px-4"
                >
                  <div
                    className="relative aspect-[21/9] min-h-[400px] md:min-h-[500px] overflow-hidden rounded-3xl shadow-2xl cursor-pointer group/banner"
                    onClick={() => handleBannerClick(promo)}
                  >
                    {/* Imagen del banner con fallback */}
                    <img
                      src={`${getBackendUrl()}${promo.imagen_url}`}
                      alt={promo.nombre}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover/banner:scale-110"
                      onError={(e) => {
                        e.target.src = "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=2000"; // Fallback premium (mountains)
                      }}
                    />

                    {/* Overlay Dinámico */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent group-hover/banner:from-black/90 transition-all duration-500" />

                    {/* Contenido con Glassmorphism */}
                    <div className="absolute inset-y-0 left-0 w-full md:w-2/3 lg:w-1/2 p-8 md:p-16 flex flex-col justify-center text-white z-10">
                      <div className="backdrop-blur-md bg-white/5 border border-white/10 p-8 rounded-3xl shadow-2xl transform transition-all duration-500 group-hover/banner:translate-x-2">
                        <span className="inline-block px-4 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-sm font-bold tracking-wider uppercase mb-4 border border-emerald-500/30">
                          {promo.tipo_viaje === "ida_vuelta" ? "Oferta Ida y Vuelta" : "Promoción Especial"}
                        </span>
                        
                        <h3 className="text-4xl md:text-5xl lg:text-6xl font-black mb-4 leading-tight drop-shadow-lg">
                          {promo.nombre}
                        </h3>

                        <div className="flex flex-col gap-2 mb-8">
                          <div className="flex items-baseline gap-3">
                            <span className="text-5xl md:text-6xl font-black text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.3)]">
                              ${promo.precio.toLocaleString("es-CL")}
                            </span>
                          </div>
                          <p className="text-xl md:text-2xl font-medium text-white/90">
                            <span className="text-emerald-400">Desde</span> {promo.origen} <span className="text-emerald-400">hasta</span> {promo.destino}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-6">
                          <Button
                            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-lg px-10 py-7 rounded-2xl shadow-[0_10px_20px_rgba(16,185,129,0.3)] hover:shadow-[0_15px_30px_rgba(16,185,129,0.4)] transition-all duration-300 transform hover:-translate-y-1 active:scale-95"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBannerClick(promo);
                            }}
                          >
                            RESERVAR AHORA
                          </Button>
                          
                          <div className="flex items-center gap-2 text-white/60 font-semibold uppercase tracking-widest text-xs">
                            <div className="w-8 h-px bg-white/30" />
                            <span>Válido para {promo.max_pasajeros} personas</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Decoración Visual */}
                    <div className="absolute top-8 right-8 w-24 h-24 border-t-2 border-r-2 border-white/20 rounded-tr-3xl pointer-events-none" />
                    <div className="absolute bottom-8 right-8 w-24 h-24 border-b-2 border-l-2 border-white/20 rounded-bl-3xl pointer-events-none" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Botones de navegación Modernos */}
          {promociones.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute -left-4 md:-left-8 top-1/2 -translate-y-1/2 w-12 h-12 md:w-16 md:h-16 rounded-full bg-white shadow-2xl text-slate-900 opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 hover:bg-emerald-500 hover:text-white z-20 group-hover/carousel:-translate-x-2"
                onClick={scrollPrev}
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute -right-4 md:-right-8 top-1/2 -translate-y-1/2 w-12 h-12 md:w-16 md:h-16 rounded-full bg-white shadow-2xl text-slate-900 opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 hover:bg-emerald-500 hover:text-white z-20 group-hover/carousel:translate-x-2"
                onClick={scrollNext}
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
            </>
          )}
        </div>
      </div>
    </section>


{/* Modal de reserva rápida */}
<ReservaRapidaModal
isOpen={isModalOpen}
onClose={() => setIsModalOpen(false)}
promocion={selectedPromocion}
/>
</>
);
}
