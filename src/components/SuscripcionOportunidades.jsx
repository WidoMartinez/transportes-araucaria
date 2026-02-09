import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { Bell, CheckCircle2, Mail, MapPin, Percent } from "lucide-react";
import { getBackendUrl } from "../lib/backend";

/**
 * Componente para suscribirse a alertas de oportunidades
 */
function SuscripcionOportunidades() {
const [formData, setFormData] = useState({
email: "",
nombre: "",
descuentoMinimo: 40,
});

const [rutasSeleccionadas, setRutasSeleccionadas] = useState([]);
const [loading, setLoading] = useState(false);
const [mensaje, setMensaje] = useState(null);

// Rutas comunes para seleccionar
const rutasComunes = [
{ origen: "Temuco", destino: "Pucón" },
{ origen: "Pucón", destino: "Temuco" },
{ origen: "Temuco", destino: "Villarrica" },
{ origen: "Villarrica", destino: "Temuco" },
{ origen: "Aeropuerto Temuco", destino: "Pucón" },
{ origen: "Pucón", destino: "Aeropuerto Temuco" },
{ origen: "Aeropuerto Temuco", destino: "Villarrica" },
{ origen: "Villarrica", destino: "Aeropuerto Temuco" },
];

const toggleRuta = (ruta) => {
const rutaStr = `${ruta.origen}-${ruta.destino}`;
const exists = rutasSeleccionadas.find(
(r) => `${r.origen}-${r.destino}` === rutaStr
);

if (exists) {
setRutasSeleccionadas(
rutasSeleccionadas.filter(
(r) => `${r.origen}-${r.destino}` !== rutaStr
)
);
} else {
setRutasSeleccionadas([...rutasSeleccionadas, ruta]);
}
};

const handleSubmit = async (e) => {
e.preventDefault();
setLoading(true);
setMensaje(null);

if (!formData.email || rutasSeleccionadas.length === 0) {
setMensaje({
tipo: "error",
texto: "Por favor completa el email y selecciona al menos una ruta",
});
setLoading(false);
return;
}

try {
const response = await fetch(
`${getBackendUrl()}/api/oportunidades/suscribir`,
{
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({
...formData,
rutas: rutasSeleccionadas,
}),
}
);

const data = await response.json();

if (data.success) {
setMensaje({
tipo: "success",
texto:
"¡Suscripción exitosa! Te notificaremos cuando haya oportunidades en tus rutas.",
});
// Limpiar formulario
setFormData({ email: "", nombre: "", descuentoMinimo: 40 });
setRutasSeleccionadas([]);
} else {
setMensaje({
tipo: "error",
texto: data.error || "Error al crear suscripción",
});
}
} catch (error) {
console.error("Error:", error);
setMensaje({
tipo: "error",
texto: "Error de conexión. Por favor intenta nuevamente.",
});
} finally {
setLoading(false);
}
};

return (
<Card className="max-w-4xl mx-auto">
<CardHeader>
<div className="flex items-center gap-3">
<Bell className="h-8 w-8 text-chocolate-600" />
<div>
<CardTitle className="text-2xl">
Recibe Alertas de Oportunidades
</CardTitle>
<p className="text-sm text-muted-foreground mt-1">
Te notificaremos por email cuando haya traslados disponibles en
tus rutas de interés
</p>
</div>
</div>
</CardHeader>
<CardContent>
<form onSubmit={handleSubmit} className="space-y-6">
{/* Email */}
<div className="space-y-2">
<Label htmlFor="email" className="flex items-center gap-2">
<Mail className="h-4 w-4" />
Email *
</Label>
<Input
id="email"
type="email"
placeholder="tu@email.com"
value={formData.email}
onChange={(e) =>
setFormData({ ...formData, email: e.target.value })
}
required
/>
</div>

{/* Nombre (opcional) */}
<div className="space-y-2">
<Label htmlFor="nombre">Nombre (opcional)</Label>
<Input
id="nombre"
type="text"
placeholder="Tu nombre"
value={formData.nombre}
onChange={(e) =>
setFormData({ ...formData, nombre: e.target.value })
}
/>
</div>

{/* Seleccionar rutas */}
<div className="space-y-3">
<Label className="flex items-center gap-2">
<MapPin className="h-4 w-4" />
Selecciona tus rutas de interés *
</Label>
<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
{rutasComunes.map((ruta, index) => {
const rutaStr = `${ruta.origen}-${ruta.destino}`;
const isSelected = rutasSeleccionadas.find(
(r) => `${r.origen}-${r.destino}` === rutaStr
);
return (
<Button
key={index}
type="button"
variant={isSelected ? "default" : "outline"}
className={
isSelected
? "bg-chocolate-600 hover:bg-chocolate-700"
: ""
}
onClick={() => toggleRuta(ruta)}
>
{isSelected && <CheckCircle2 className="h-4 w-4 mr-2" />}
{ruta.origen} → {ruta.destino}
</Button>
);
})}
</div>
<p className="text-xs text-muted-foreground">
Seleccionadas: {rutasSeleccionadas.length} ruta(s)
</p>
</div>

{/* Descuento mínimo */}
<div className="space-y-3">
<Label htmlFor="descuentoMinimo" className="flex items-center gap-2">
<Percent className="h-4 w-4" />
Descuento mínimo para notificar: {formData.descuentoMinimo}%
</Label>
<input
id="descuentoMinimo"
type="range"
min="30"
max="70"
step="5"
value={formData.descuentoMinimo}
onChange={(e) =>
setFormData({
...formData,
descuentoMinimo: parseInt(e.target.value),
})
}
className="w-full"
/>
<div className="flex justify-between text-xs text-muted-foreground">
<span>30%</span>
<span>50%</span>
<span>70%</span>
</div>
</div>

{/* Mensaje de resultado */}
{mensaje && (
<Alert
variant={mensaje.tipo === "error" ? "destructive" : "default"}
className={
mensaje.tipo === "success"
? "bg-green-50 border-green-200 text-green-800"
: ""
}
>
<AlertDescription>{mensaje.texto}</AlertDescription>
</Alert>
)}

{/* Botón de envío */}
<Button
type="submit"
className="w-full bg-chocolate-600 hover:bg-chocolate-700 text-white"
size="lg"
disabled={loading}
>
{loading ? "Suscribiendo..." : "Suscribirme a Alertas"}
</Button>

<p className="text-xs text-center text-muted-foreground">
Podrás cancelar tu suscripción en cualquier momento
</p>
</form>
</CardContent>
</Card>
);
}

export default SuscripcionOportunidades;
