import { useState, useMemo } from "react";
import {
Dialog,
DialogContent,
DialogDescription,
DialogHeader,
DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Calendar, Clock, Users, MapPin, ArrowRight } from "lucide-react";
import { getBackendUrl } from "../lib/backend";

// Función para generar opciones de hora en intervalos de 15 minutos (6:00 AM - 10:00 PM)
const generateTimeOptions = () => {
  const options = [];
  for (let hour = 6; hour <= 22; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      if (hour === 22 && minute > 0) break;
      const timeString = `${hour.toString().padStart(2, "0")}:${minute
        .toString()
        .padStart(2, "0")}`;
      options.push({ value: timeString, label: timeString });
    }
  }
  return options;
};

/**
 * Modal de reserva rápida desde banner promocional
 * Muestra datos pre-cargados de la promoción
 * Solicita solo datos mínimos del cliente y fechas
 */
export default function ReservaRapidaModal({ isOpen, onClose, promocion }) {
const [loading, setLoading] = useState(false);
const [formData, setFormData] = useState({
nombre: "",
email: "",
telefono: "",
fecha_ida: "",
hora_ida: "",
fecha_vuelta: "",
hora_vuelta: "",
});

const handleChange = (e) => {
const { name, value } = e.target;
setFormData((prev) => ({ ...prev, [name]: value }));
};

  // Lógica de opciones de hora sincronizada con HeroExpress
  const getTimeOptions = (fechaSeleccionada) => {
    let options = generateTimeOptions();
    
    // Filtrado por anticipación mínima (5 horas) para hoy
    const hoy = new Date();
    const hoyStr = hoy.toISOString().split("T")[0];
    
    if (fechaSeleccionada === hoyStr) {
      const ahora = new Date();
      const anticipacionMinima = 5; // 5 horas
      
      options = options.filter(opt => {
        const [h, m] = opt.value.split(":").map(Number);
        const fechaOpt = new Date();
        fechaOpt.setHours(h, m, 0, 0);
        
        const diffHoras = (fechaOpt - ahora) / 3600000;
        return diffHoras >= anticipacionMinima;
      });
    }
    
    return options;
  };

  const timeOptionsIda = useMemo(() => getTimeOptions(formData.fecha_ida), [formData.fecha_ida]);
  const timeOptionsVuelta = useMemo(() => getTimeOptions(formData.fecha_vuelta), [formData.fecha_vuelta]);

  if (!promocion) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(
        `${getBackendUrl()}/api/promociones-banner/desde-promocion/${promocion.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al crear reserva");
      }

      const data = await response.json();

      // Proceder al pago automáticamente con Flow
      const paymentResponse = await fetch(`${getBackendUrl()}/create-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gateway: "flow",
          amount: promocion.precio,
          description: `Promoción ${promocion.nombre} - ${promocion.origen} a ${promocion.destino}`,
          email: formData.email,
          reservaId: data.reserva.id,
          codigoReserva: data.reserva.codigo_reserva,
          tipoPago: "total",
        }),
      });

      const paymentData = await paymentResponse.json();
      
      if (paymentData.url) {
        // Redirigir a Flow para completar el pago
        window.location.href = paymentData.url;
      } else {
        alert(`Reserva creada: ${data.reserva.codigo_reserva}. Por favor contacta a soporte para completar el pago.`);
        onClose();
      }
    } catch (error) {
      console.error("Error al crear reserva:", error);
      alert(error.message || "Error al crear reserva. Por favor, intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

return (
<Dialog open={isOpen} onOpenChange={onClose}>
<DialogContent className="max-w-[95vw] md:max-w-2xl max-h-[95vh] overflow-y-auto p-4 md:p-6 rounded-xl">
<DialogHeader className="mb-4">
<DialogTitle className="text-xl md:text-2xl font-bold">
Reserva Rápida
</DialogTitle>
<DialogDescription className="text-sm">
{promocion.nombre} - Completa tus datos para confirmar
</DialogDescription>
</DialogHeader>

<form onSubmit={handleSubmit} className="space-y-6">
{/* Detalles de la promoción - Optimizado: R en PC, BR en Móvil */}
<div className="bg-gradient-to-br md:bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-xl border-2 border-green-200/60 shadow-sm">
<div className="grid grid-cols-2 md:grid-cols-2 gap-y-4 gap-x-2 md:gap-4">
<div className="flex items-start md:items-center gap-2 col-span-2 md:col-span-1">
<div className="p-2 bg-white rounded-lg shadow-sm">
<MapPin className="h-4 w-4 text-green-600" />
</div>
<div>
<p className="text-[10px] md:text-xs text-green-700 uppercase font-bold tracking-wider">Ruta</p>
<p className="text-sm md:text-base font-bold text-gray-800 leading-tight">
{promocion.origen} <ArrowRight className="inline h-3 w-3 md:h-4 md:w-4 mx-0.5" />{" "}
{promocion.destino}
</p>
</div>
</div>

<div className="flex items-start md:items-center gap-2">
<div className="p-2 bg-white rounded-lg shadow-sm">
<Users className="h-4 w-4 text-green-600" />
</div>
<div>
<p className="text-[10px] md:text-xs text-green-700 uppercase font-bold tracking-wider">Pax</p>
<p className="text-sm md:text-base font-bold text-gray-800">Hasta {promocion.max_pasajeros}</p>
</div>
</div>

<div className="flex items-start md:items-center gap-2">
<div className="p-2 bg-white rounded-lg shadow-sm">
<Clock className="h-4 w-4 text-green-600" />
</div>
<div>
<p className="text-[10px] md:text-xs text-green-700 uppercase font-bold tracking-wider">Tipo</p>
<p className="text-sm md:text-base font-bold text-gray-800">
{promocion.tipo_viaje === "ida_vuelta" ? "Ida/Vta" : "Solo Ida"}
</p>
</div>
</div>

<div className="col-span-2 md:col-span-1 md:text-right pt-2 border-t md:border-t-0 border-green-200/50 mt-1 md:mt-0 flex justify-between md:flex-col items-center md:items-end">
<p className="text-sm font-medium text-green-800">Total Promocional</p>
<span className="text-2xl font-black text-green-600">
${promocion.precio.toLocaleString("es-CL")}
</span>
</div>
</div>
</div>

{/* Datos del cliente */}
<div className="space-y-4">
<h3 className="font-bold text-base md:text-lg border-b pb-2">Tus Datos</h3>

<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
<div className="space-y-2">
<Label htmlFor="nombre" className="text-sm font-semibold">
Nombre Completo <span className="text-red-500">*</span>
</Label>
<Input
id="nombre"
name="nombre"
value={formData.nombre}
onChange={handleChange}
required
placeholder="Ej: Juan Pérez"
className="h-12 md:h-11 bg-gray-50/50"
/>
</div>

<div className="space-y-2">
<Label htmlFor="email" className="text-sm font-semibold">
Email <span className="text-red-500">*</span>
</Label>
<Input
id="email"
name="email"
type="email"
inputMode="email"
value={formData.email}
onChange={handleChange}
required
placeholder="tu@email.com"
className="h-12 md:h-11 bg-gray-50/50"
/>
</div>

<div className="space-y-2 md:col-span-2">
<Label htmlFor="telefono" className="text-sm font-semibold">
Teléfono <span className="text-red-500">*</span>
</Label>
<Input
id="telefono"
name="telefono"
type="tel"
inputMode="tel"
value={formData.telefono}
onChange={handleChange}
required
placeholder="+56 9 1234 5678"
className="h-12 md:h-11 bg-gray-50/50"
/>
</div>
</div>
</div>

{/* Fechas y horarios - Rediseñado para ser menos invasivo */}
<div className="space-y-4">
<h3 className="font-bold text-base md:text-lg border-b pb-2">Planificación del Viaje</h3>

<div className="space-y-4">
{/* Segmento de Ida */}
<div className="p-3 md:p-4 bg-gray-50/80 rounded-xl border border-gray-200 shadow-sm space-y-3">
<div className="flex items-center justify-between">
<p className="text-sm font-bold text-gray-700 flex items-center gap-2">
<span className="p-1.5 bg-green-100 rounded-md text-green-700">
<ArrowRight className="h-3.5 w-3.5" />
</span>
Trayecto de Salida
</p>
</div>

<div className="flex gap-2 md:gap-4">
<div className="flex-1 space-y-1.5">
<Label htmlFor="fecha_ida" className="text-[10px] uppercase text-gray-500 font-bold tracking-tight">
Fecha de Ida
</Label>
<div className="relative">
<Input
id="fecha_ida"
name="fecha_ida"
type="date"
value={formData.fecha_ida}
onChange={handleChange}
required
min={new Date().toISOString().split("T")[0]}
className="h-12 md:h-11 bg-white border-gray-200"
/>
</div>
</div>

<div className="w-28 md:w-32 space-y-1.5">
<Label htmlFor="hora_ida" className="text-[10px] uppercase text-gray-500 font-bold tracking-tight">
Hora
</Label>
<div className="relative">
<select
id="hora_ida"
name="hora_ida"
value={formData.hora_ida}
onChange={handleChange}
required
className="w-full h-12 md:h-11 px-2 bg-white border border-gray-200 rounded-md text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 appearance-none cursor-pointer font-medium"
>
<option value="">--:--</option>
{timeOptionsIda.map((t) => (
<option key={t.value} value={t.value}>{t.label}</option>
))}
</select>
<div className="absolute right-2 top-3.5 md:top-3 h-5 w-5 pointer-events-none text-gray-400">
<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
</svg>
</div>
</div>
</div>
</div>
</div>

{/* Segmento de Vuelta (solo si es ida_vuelta) */}
{promocion.tipo_viaje === "ida_vuelta" && (
<div className="p-3 md:p-4 bg-gray-50/80 rounded-xl border border-gray-200 shadow-sm space-y-3">
<div className="flex items-center justify-between">
<p className="text-sm font-bold text-gray-700 flex items-center gap-2">
<span className="p-1.5 bg-blue-100 rounded-md text-blue-700">
<ArrowRight className="h-3.5 w-3.5 rotate-180" />
</span>
Trayecto de Regreso
</p>
</div>

<div className="flex gap-2 md:gap-4">
<div className="flex-1 space-y-1.5">
<Label htmlFor="fecha_vuelta" className="text-[10px] uppercase text-gray-500 font-bold tracking-tight">
Fecha de Regreso
</Label>
<div className="relative">
<Input
id="fecha_vuelta"
name="fecha_vuelta"
type="date"
value={formData.fecha_vuelta}
onChange={handleChange}
required={promocion.tipo_viaje === "ida_vuelta"}
min={formData.fecha_ida || new Date().toISOString().split("T")[0]}
className="h-12 md:h-11 bg-white border-gray-200"
/>
</div>
</div>

<div className="w-28 md:w-32 space-y-1.5">
<Label htmlFor="hora_vuelta" className="text-[10px] uppercase text-gray-500 font-bold tracking-tight">
Hora
</Label>
<div className="relative">
<select
id="hora_vuelta"
name="hora_vuelta"
value={formData.hora_vuelta}
onChange={handleChange}
required={promocion.tipo_viaje === "ida_vuelta"}
className="w-full h-12 md:h-11 px-2 bg-white border border-gray-200 rounded-md text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 appearance-none cursor-pointer font-medium"
>
<option value="">--:--</option>
{timeOptionsVuelta.map((t) => (
<option key={t.value} value={t.value}>{t.label}</option>
))}
</select>
<div className="absolute right-2 top-3.5 md:top-3 h-5 w-5 pointer-events-none text-gray-400">
<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
</svg>
</div>
</div>
</div>
</div>
</div>
)}
</div>
</div>

{/* Botones de acción - Stacked en Móvil, Row en PC */}
<div className="flex flex-col-reverse md:flex-row gap-3 pt-4 border-t md:justify-end sticky md:relative bottom-0 bg-white/80 md:bg-transparent backdrop-blur-sm md:backdrop-blur-none pb-1 mt-6">
<Button 
type="button" 
variant="outline" 
onClick={onClose} 
className="w-full md:w-auto md:px-8 h-12 md:h-11 font-semibold"
disabled={loading}
>
Cancelar
</Button>
<Button 
type="submit" 
disabled={loading} 
className="w-full md:w-auto md:px-10 h-12 md:h-11 bg-green-600 hover:bg-green-700 text-white font-bold text-lg md:text-base shadow-md transition-all active:scale-[0.98]"
>
{loading ? "Procesando..." : `Pagar $${promocion.precio.toLocaleString("es-CL")}`}
</Button>
</div>
</form>
</DialogContent>
</Dialog>
);
}
