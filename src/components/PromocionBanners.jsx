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
<section className="bg-gradient-to-b from-chocolate-50 to-white py-8">
<div className="container mx-auto px-4">
<div className="relative">
{/* Carrusel */}
<div className="overflow-hidden" ref={emblaRef}>
<div className="flex">
{promociones.map((promo) => (
<div
key={promo.id}
className="flex-[0_0_100%] min-w-0 md:flex-[0_0_80%] lg:flex-[0_0_70%] px-2"
>
<div
className="relative overflow-hidden rounded-2xl shadow-2xl cursor-pointer transform transition-all duration-300 hover:scale-[1.02] hover:shadow-3xl group"
onClick={() => handleBannerClick(promo)}
>
{/* Imagen del banner */}
<img
src={`${getBackendUrl()}${promo.imagen_url}`}
alt={promo.nombre}
className="w-full h-64 md:h-96 object-cover"
/>

{/* Overlay con info */}
<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-90 group-hover:opacity-100 transition-opacity">
<div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 text-white">
<h3 className="text-2xl md:text-3xl font-bold mb-2">
{promo.nombre}
</h3>
<div className="flex items-center gap-4 mb-3">
<span className="text-3xl md:text-4xl font-bold text-green-400">
${promo.precio.toLocaleString("es-CL")}
</span>
<span className="text-sm md:text-base opacity-90">
{promo.tipo_viaje === "ida_vuelta"
? "Ida y Vuelta"
: "Solo Ida"}
</span>
</div>
<div className="text-sm md:text-base opacity-80">
{promo.origen} → {promo.destino} • Hasta{" "}
{promo.max_pasajeros} pasajeros
</div>
<Button
className="mt-4 bg-green-500 hover:bg-green-600 text-white"
onClick={(e) => {
e.stopPropagation();
handleBannerClick(promo);
}}
>
Reservar Ahora
</Button>
</div>
</div>
</div>
</div>
))}
</div>
</div>

{/* Botones de navegación */}
{promociones.length > 1 && (
<>
<Button
variant="outline"
size="icon"
className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-lg"
onClick={scrollPrev}
>
<ChevronLeft className="h-6 w-6" />
</Button>
<Button
variant="outline"
size="icon"
className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-lg"
onClick={scrollNext}
>
<ChevronRight className="h-6 w-6" />
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
