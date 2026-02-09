import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
ArrowRight,
Clock,
Calendar,
MapPin,
Car,
Users,
Percent,
CheckCircle2,
} from "lucide-react";

/**
 * Componente para mostrar una tarjeta de oportunidad individual
 * @param {Object} oportunidad - Datos de la oportunidad
 * @param {Function} onReservar - Callback cuando se hace clic en reservar
 */
function OportunidadCard({ oportunidad, onReservar }) {
const getTipoBadge = (tipo) => {
if (tipo === "retorno_vacio") {
return (
<Badge variant="secondary" className="bg-blue-100 text-blue-800">
Retorno Disponible
</Badge>
);
}
return (
<Badge variant="secondary" className="bg-purple-100 text-purple-800">
Ida Disponible
</Badge>
);
};

const formatFecha = (fecha) => {
const opciones = {
weekday: "long",
year: "numeric",
month: "long",
day: "numeric",
};
return new Date(fecha + "T00:00:00").toLocaleDateString("es-CL", opciones);
};

const formatPrecio = (precio) => {
return new Intl.NumberFormat("es-CL", {
style: "currency",
currency: "CLP",
minimumFractionDigits: 0,
}).format(precio);
};

return (
<Card className="hover:shadow-lg transition-shadow duration-300">
<CardHeader>
<div className="flex justify-between items-start mb-2">
{getTipoBadge(oportunidad.tipo)}
<Badge variant="destructive" className="text-lg font-bold">
-{oportunidad.descuento}%
</Badge>
</div>
<CardTitle className="text-2xl">
<div className="flex items-center gap-2">
<MapPin className="h-5 w-5 text-chocolate-600" />
<span>{oportunidad.origen}</span>
<ArrowRight className="h-5 w-5 text-muted-foreground" />
<MapPin className="h-5 w-5 text-chocolate-600" />
<span>{oportunidad.destino}</span>
</div>
</CardTitle>
</CardHeader>
<CardContent>
<div className="space-y-4">
{/* Fecha y hora */}
<div className="flex items-center gap-4 text-muted-foreground">
<div className="flex items-center gap-2">
<Calendar className="h-4 w-4" />
<span className="text-sm">{formatFecha(oportunidad.fecha)}</span>
</div>
{oportunidad.horaAproximada && (
<div className="flex items-center gap-2">
<Clock className="h-4 w-4" />
<span className="text-sm">
Aprox. {oportunidad.horaAproximada}
</span>
</div>
)}
</div>

{/* Vehículo y capacidad */}
<div className="flex items-center gap-4 text-muted-foreground">
<div className="flex items-center gap-2">
<Car className="h-4 w-4" />
<span className="text-sm">{oportunidad.vehiculo}</span>
</div>
<div className="flex items-center gap-2">
<Users className="h-4 w-4" />
<span className="text-sm">{oportunidad.capacidad}</span>
</div>
</div>

{/* Precio */}
<div className="bg-green-50 border border-green-200 rounded-lg p-4">
<div className="flex items-center justify-between">
<div>
<p className="text-sm text-muted-foreground line-through">
{formatPrecio(oportunidad.precioOriginal)}
</p>
<p className="text-3xl font-bold text-green-700">
{formatPrecio(oportunidad.precioFinal)}
</p>
</div>
<Badge
variant="outline"
className="bg-green-100 text-green-800 border-green-300"
>
<Percent className="h-4 w-4 mr-1" />
Ahorra {formatPrecio(oportunidad.precioOriginal - oportunidad.precioFinal)}
</Badge>
</div>
</div>

{/* Motivo del descuento */}
<div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
<p className="text-sm text-blue-800">
<strong>¿Por qué este precio?</strong>
<br />
{oportunidad.motivoDescuento}
</p>
</div>

{/* Garantías */}
<div className="space-y-2">
<div className="flex items-center gap-2 text-sm text-green-700">
<CheckCircle2 className="h-4 w-4" />
<span>Traslado 100% privado solo para ti</span>
</div>
<div className="flex items-center gap-2 text-sm text-green-700">
<CheckCircle2 className="h-4 w-4" />
<span>Mismo servicio premium</span>
</div>
<div className="flex items-center gap-2 text-sm text-green-700">
<CheckCircle2 className="h-4 w-4" />
<span>Conductor profesional certificado</span>
</div>
</div>

{/* Botón de reserva */}
<Button
onClick={() => onReservar(oportunidad)}
className="w-full bg-chocolate-600 hover:bg-chocolate-700 text-white"
size="lg"
>
Reservar Ahora
<ArrowRight className="ml-2 h-5 w-5" />
</Button>

{/* Tiempo limitado */}
{oportunidad.validoHasta && (
<p className="text-xs text-center text-muted-foreground">
Válido hasta:{" "}
{new Date(oportunidad.validoHasta).toLocaleString("es-CL")}
</p>
)}
</div>
</CardContent>
</Card>
);
}

export default OportunidadCard;
