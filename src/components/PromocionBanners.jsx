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
      if (Array.isArray(data)) {
        setPromociones(data);

        // Lógica de Deep Link: abrir modal si viene ?promo=ID en la URL
        const urlParams = new URLSearchParams(window.location.search);
        const promoIdFromUrl = urlParams.get("promo");
        
        if (promoIdFromUrl && data.length > 0) {
          const matchingPromo = data.find(p => p.id.toString() === promoIdFromUrl);
          if (matchingPromo) {
            console.log("🔗 Deep Link detectado: Abriendo promoción", matchingPromo.nombre);
            setSelectedPromocion(matchingPromo);
            setIsModalOpen(true);
          }
        }
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

    <section className="bg-white py-8 md:py-16 overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Encabezado de la Sección */}
        <div className="text-center mb-10 md:mb-16">
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-slate-900 mb-4 tracking-tight">
            Ofertas <span className="text-emerald-500">Especiales</span>
          </h2>
          <div className="w-24 h-1.5 bg-emerald-500 mx-auto rounded-full mb-6" />
          <p className="text-slate-600 text-lg md:text-xl font-medium max-w-2xl mx-auto px-4">
            Aprovecha nuestros traslados en promoción y viaja con la comodidad de siempre al mejor precio.
          </p>
        </div>

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
                    className="relative aspect-[4/5] md:aspect-[21/9] min-h-[450px] md:min-h-[500px] w-full overflow-hidden rounded-3xl shadow-2xl cursor-pointer group/banner"
                    onClick={() => handleBannerClick(promo)}
                  >
                    {/* Imagen del banner con fallback */}
                    <img
                      src={`${getBackendUrl()}${promo.imagen_url}`}
                      alt={promo.nombre}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover/banner:scale-110"
                      style={{ 
                        objectPosition: promo.posicion_imagen || "center",
                        transformOrigin: promo.posicion_imagen || "center" 
                      }}
                      onError={(e) => {
                        e.target.src = "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=2000";
                      }}
                    />

                    {/* Overlay Dinámico */}
                    <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/95 via-black/60 to-transparent md:from-black/80 md:via-black/40 group-hover/banner:from-black/90 transition-all duration-500" />

                    {/* Contenido con Glassmorphism */}
                    <div className="absolute inset-0 md:inset-y-0 md:left-0 w-full md:w-2/3 lg:w-1/2 p-4 md:p-16 flex flex-col justify-end md:justify-center text-white z-10 text-center md:text-left">
                      <div className="backdrop-blur-md bg-white/5 border border-white/10 p-5 md:p-8 rounded-2xl md:rounded-3xl shadow-2xl transform transition-all duration-500 group-hover/banner:translate-y-[-5px] md:group-hover/banner:translate-y-0 md:group-hover/banner:translate-x-2">
                        <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] md:text-sm font-bold tracking-widest uppercase mb-2 md:mb-4 border border-emerald-500/30">
                          {promo.tipo_viaje === "ida_vuelta" ? "Oferta Ida y Vuelta" : "Promoción Especial"}
                        </span>
                        
                        <h3 className="text-2xl md:text-5xl lg:text-6xl font-black mb-2 md:mb-4 leading-tight drop-shadow-lg">
                          {promo.nombre}
                        </h3>

                        <div className="flex flex-col gap-1 md:gap-2 mb-4 md:mb-8">
                          <div className="flex items-baseline justify-center md:justify-start gap-2 md:gap-3">
                            <span className="text-3xl md:text-6xl font-black text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.3)]">
                              ${promo.precio.toLocaleString("es-CL")}
                            </span>
                          </div>
                          <p className="text-sm md:text-xl md:text-2xl font-medium text-white/90">
                            <span className="text-emerald-400">Desde</span> {promo.origen} <span className="text-emerald-400">hacia</span> {promo.destino}
                          </p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4 md:gap-6">
                          <Button
                            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm md:text-lg px-10 md:px-10 py-5 md:py-7 rounded-xl md:rounded-2xl shadow-lg transition-all duration-300 transform hover:-translate-y-1 active:scale-95 w-full md:w-auto"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBannerClick(promo);
                            }}
                          >
                            RESERVAR AHORA
                          </Button>
                          
                          <div className="hidden sm:flex items-center gap-2 text-white/50 font-bold uppercase tracking-widest text-[10px]">
                            <div className="w-6 h-px bg-white/20" />
                            <span>Máx. {promo.max_pasajeros} pasajeros</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Decoración Visual más discreta */}
                    <div className="absolute top-4 right-4 md:top-6 md:right-6 w-12 h-12 md:w-16 md:h-16 border-t border-r border-white/20 rounded-tr-2xl pointer-events-none" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Botones de navegación - Ocultos en mobile para maximizar espacio */}
          {promociones.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="hidden md:flex absolute -left-4 md:-left-6 top-1/2 -translate-y-1/2 w-10 h-10 md:w-14 md:h-14 rounded-full bg-white/90 shadow-xl text-slate-900 opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 hover:bg-emerald-500 hover:text-white z-20"
                onClick={scrollPrev}
              >
                <ChevronLeft className="h-6 w-6 md:h-8 md:w-8" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="hidden md:flex absolute -right-4 md:-right-6 top-1/2 -translate-y-1/2 w-10 h-10 md:w-14 md:h-14 rounded-full bg-white/90 shadow-xl text-slate-900 opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 hover:bg-emerald-500 hover:text-white z-20"
                onClick={scrollNext}
              >
                <ChevronRight className="h-6 w-6 md:h-8 md:w-8" />
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
