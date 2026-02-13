import { useState } from "react";
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

if (!promocion) return null;

const handleChange = (e) => {
const { name, value } = e.target;
setFormData((prev) => ({ ...prev, [name]: value }));
};

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
<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
<DialogHeader>
<DialogTitle className="text-2xl font-bold">
Reserva Rápida: {promocion.nombre}
</DialogTitle>
<DialogDescription>
Completa tus datos para confirmar tu reserva promocional
</DialogDescription>
</DialogHeader>

<form onSubmit={handleSubmit} className="space-y-6">
{/* Detalles de la promoción */}
<div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border-2 border-green-200">
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
<div className="flex items-center gap-2">
<MapPin className="h-5 w-5 text-green-600" />
<div>
<p className="text-xs text-gray-600">Ruta</p>
<p className="font-semibold">
{promocion.origen} <ArrowRight className="inline h-4 w-4" />{" "}
{promocion.destino}
</p>
</div>
</div>

<div className="flex items-center gap-2">
<Users className="h-5 w-5 text-green-600" />
<div>
<p className="text-xs text-gray-600">Pasajeros</p>
<p className="font-semibold">Hasta {promocion.max_pasajeros}</p>
</div>
</div>

<div className="flex items-center gap-2">
<span className="text-2xl font-bold text-green-600">
${promocion.precio.toLocaleString("es-CL")}
</span>
</div>

<div className="text-right">
<p className="text-xs text-gray-600">Tipo de viaje</p>
<p className="font-semibold">
{promocion.tipo_viaje === "ida_vuelta" ? "Ida y Vuelta" : "Solo Ida"}
</p>
</div>
</div>
</div>

{/* Datos del cliente */}
<div className="space-y-4">
<h3 className="font-semibold text-lg">Tus Datos</h3>

<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
<div className="space-y-2">
<Label htmlFor="nombre">
Nombre Completo <span className="text-red-500">*</span>
</Label>
<Input
id="nombre"
name="nombre"
value={formData.nombre}
onChange={handleChange}
required
placeholder="Juan Pérez"
/>
</div>

<div className="space-y-2">
<Label htmlFor="email">
Email <span className="text-red-500">*</span>
</Label>
<Input
id="email"
name="email"
type="email"
value={formData.email}
onChange={handleChange}
required
placeholder="juan@example.com"
/>
</div>

<div className="space-y-2 md:col-span-2">
<Label htmlFor="telefono">
Teléfono <span className="text-red-500">*</span>
</Label>
<Input
id="telefono"
name="telefono"
type="tel"
value={formData.telefono}
onChange={handleChange}
required
placeholder="+56 9 1234 5678"
/>
</div>
</div>
</div>

{/* Fechas y horarios */}
<div className="space-y-4">
<h3 className="font-semibold text-lg">Fechas de Viaje</h3>

<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
{/* Fecha/hora de ida */}
<div className="space-y-2">
<Label htmlFor="fecha_ida" className="flex items-center gap-2">
<Calendar className="h-4 w-4" />
Fecha de Ida <span className="text-red-500">*</span>
</Label>
<Input
id="fecha_ida"
name="fecha_ida"
type="date"
value={formData.fecha_ida}
onChange={handleChange}
required
min={new Date().toISOString().split("T")[0]}
/>
</div>

<div className="space-y-2">
<Label htmlFor="hora_ida" className="flex items-center gap-2">
<Clock className="h-4 w-4" />
Hora de Ida <span className="text-red-500">*</span>
</Label>
<Input
id="hora_ida"
name="hora_ida"
type="time"
value={formData.hora_ida}
onChange={handleChange}
required
/>
</div>

{/* Fecha/hora de vuelta (solo si es ida_vuelta) */}
{promocion.tipo_viaje === "ida_vuelta" && (
<>
<div className="space-y-2">
<Label htmlFor="fecha_vuelta" className="flex items-center gap-2">
<Calendar className="h-4 w-4" />
Fecha de Vuelta <span className="text-red-500">*</span>
</Label>
<Input
id="fecha_vuelta"
name="fecha_vuelta"
type="date"
value={formData.fecha_vuelta}
onChange={handleChange}
required={promocion.tipo_viaje === "ida_vuelta"}
min={formData.fecha_ida || new Date().toISOString().split("T")[0]}
/>
</div>

<div className="space-y-2">
<Label htmlFor="hora_vuelta" className="flex items-center gap-2">
<Clock className="h-4 w-4" />
Hora de Vuelta <span className="text-red-500">*</span>
</Label>
<Input
id="hora_vuelta"
name="hora_vuelta"
type="time"
value={formData.hora_vuelta}
onChange={handleChange}
required={promocion.tipo_viaje === "ida_vuelta"}
/>
</div>
</>
)}
</div>
</div>

{/* Botones */}
<div className="flex gap-3 justify-end pt-4 border-t">
<Button type="button" variant="outline" onClick={onClose} disabled={loading}>
Cancelar
</Button>
<Button
type="submit"
className="bg-green-600 hover:bg-green-700 text-white font-semibold px-8"
disabled={loading}
>
{loading ? "Procesando..." : `Pagar $${promocion.precio.toLocaleString("es-CL")}`}
</Button>
</div>
</form>
</DialogContent>
</Dialog>
);
}
