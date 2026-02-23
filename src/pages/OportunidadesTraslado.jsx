import React, { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Alert, AlertDescription } from "../components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";
import { ScrollArea } from "../components/ui/scroll-area";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Checkbox } from "../components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Sparkles,
  TrendingDown,
  RefreshCw,
  Filter,
  AlertCircle,
  Car,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Calendar,
  ShieldAlert,
  Info,
} from "lucide-react";
import OportunidadCard from "../components/OportunidadCard";
import SuscripcionOportunidades from "../components/SuscripcionOportunidades";
import { getBackendUrl } from "../lib/backend";
import { validatePaymentAmount } from "../utils/paymentValidation";
import { TERMINOS_CONDICIONES } from "../data/legal";
import imagenOportunidades from "../assets/imagenoportunidades.png";
const vansBg = imagenOportunidades;

function OportunidadesTraslado() {
const [oportunidades, setOportunidades] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
const [filtros, setFiltros] = useState({
  origen: "",
  destino: "",
  fecha: "",
});

// Estados para el Modal de Reserva Expedita
const [modalOpen, setModalOpen] = useState(false);
const [oportunidadSeleccionada, setOportunidadSeleccionada] = useState(null);
const [submittingReserva, setSubmittingReserva] = useState(false);
  const [reservaFormData, setReservaFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    pasajeros: "1",
    direccion: "",
    horaSalida: "",
  });
  const [phoneError, setPhoneError] = useState("");
  const [horaError, setHoraError] = useState("");
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [terminosError, setTerminosError] = useState("");

  const cargarOportunidades = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      
      // Solo agregar filtros si no son "todos"
      if (filtros.origen && filtros.origen !== "todos") {
        params.append("origen", filtros.origen);
      }
      if (filtros.destino && filtros.destino !== "todos") {
        params.append("destino", filtros.destino);
      }
      if (filtros.fecha) {
        params.append("fecha", filtros.fecha);
      }

      const url = `${getBackendUrl()}/api/oportunidades?${params.toString()}`;
const response = await fetch(url);
const data = await response.json();

        if (data.success) {
          const opsConHora = data.oportunidades.map(op => ({
            ...op,
            // Asegurar que 'hora' exista, tomando de horaAproximada si es necesario
            hora: op.hora || op.horaAproximada
          }));
          setOportunidades(opsConHora);
        } else {
setError(data.error || "Error al cargar oportunidades");
}
} catch (err) {
console.error("Error:", err);
setError("Error de conexión. Por favor intenta nuevamente.");
} finally {
setLoading(false);
}
};

useEffect(() => {
cargarOportunidades();
}, [filtros]);

useEffect(() => {
const intervalId = setInterval(() => {
console.log("Actualizando oportunidades automáticamente...");
cargarOportunidades();
}, 120000);
return () => clearInterval(intervalId);
}, [filtros]);

  const handleReservar = (oportunidad) => {
    setOportunidadSeleccionada(oportunidad);
    setReservaFormData({
      nombre: "",
      email: "",
      telefono: "",
      pasajeros: "1",
      direccion: "",
      horaSalida: oportunidad.hora || "",
    });
    setHoraError("");
    setAceptaTerminos(false);
    setTerminosError("");
    setModalOpen(true);
  };

  const handleReservaInputChange = (e) => {
    const { name, value } = e.target;
    setReservaFormData(prev => ({ ...prev, [name]: value }));
    if (name === "telefono") setPhoneError("");
  };

  const validarTelefono = (telefono) =>
    /^(\+?56)?(\s?9)\s?(\d{4})\s?(\d{4})$/.test(telefono);

  const handleConfirmarReserva = async () => {
    if (!reservaFormData.nombre || !reservaFormData.email || !reservaFormData.telefono || !reservaFormData.direccion || !reservaFormData.horaSalida) {
      alert("Por favor completa todos los campos obligatorios.");
      return;
    }

    if (!aceptaTerminos) {
      setTerminosError("Debes aceptar los términos y condiciones para continuar.");
      return;
    }

    if (!validarTelefono(reservaFormData.telefono)) {
      setPhoneError("Formato inválido (ej: +56 9 1234 5678)");
      return;
    }

    // Validación de rango horario
    const opHora = oportunidadSeleccionada.hora;
    const salidaHora = reservaFormData.horaSalida;
    const esIda = oportunidadSeleccionada.tipo === "ida_vacia";
    
    const timeToMinutes = (t) => {
      if (!t) return 0;
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    };

    const timeMinutes = timeToMinutes(opHora);
    const minMin = esIda ? Math.max(0, timeMinutes - 60) : timeMinutes;
    const maxMin = esIda ? timeMinutes : timeMinutes + 60;
    const currentMin = timeToMinutes(salidaHora);

    if (currentMin < minMin || currentMin > maxMin) {
      const formatTime = (tm) => `${Math.floor(tm/60).toString().padStart(2,"0")}:${(tm%60).toString().padStart(2,"0")}`;
      setHoraError(`La hora debe estar entre las ${formatTime(minMin)} y las ${formatTime(maxMin)}`);
      return;
    }

    setSubmittingReserva(true);
    try {
      const response = await fetch(`${getBackendUrl()}/api/oportunidades/reservar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oportunidadId: oportunidadSeleccionada.id,
          ...reservaFormData
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Validación del precio antes de generar pago
        const precioValidado = validatePaymentAmount(data.precio);
        
        if (precioValidado <= 0) {
          alert("Error: No se pudo determinar el precio de la oportunidad. Contacta a soporte.");
          return;
        }
        
        console.log(`💰 [Oportunidades] Iniciando pago:`, {
          precioOriginal: data.precio,
          precioValidado: precioValidado,
          oportunidadId: oportunidadSeleccionada.id,
          reservaId: data.reservaId,
          codigoReserva: data.codigoReserva,
          email: reservaFormData.email
        });
        
        // Proceder al pago automáticamente (Flow Total)
        const paymentResponse = await fetch(`${getBackendUrl()}/create-payment`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            gateway: "flow",
            amount: precioValidado,
            description: `Reserva Oportunidad ${oportunidadSeleccionada.codigo} - ${oportunidadSeleccionada.origen} a ${oportunidadSeleccionada.destino}`,
            email: reservaFormData.email,
            reservaId: data.reservaId,
            codigoReserva: data.codigoReserva,
            tipoPago: "total",
          }),
        });

        const paymentData = await paymentResponse.json();
        if (paymentData.url) {
          // ✅ Lead: registrar intención de pago antes de redirigir a Flow
          if (typeof window.gtag === "function") {
            window.gtag("event", "conversion", {
              send_to: "AW-17529712870/8GVlCLP-05MbEObh6KZB",
              value: precioValidado,
              currency: "CLP",
            });
          }
          window.location.href = paymentData.url;
        } else {
          alert("Reserva creada pero no se pudo generar el enlace de pago. Contacta a soporte.");
        }
      } else {
        alert(data.error || "Hubo un error al procesar la reserva.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error de conexión. Intenta nuevamente.");
    } finally {
      setSubmittingReserva(false);
    }
  };

const origenes = [...new Set(oportunidades.map((op) => op.origen))];
const destinos = [...new Set(oportunidades.map((op) => op.destino))];

return (
<div className="min-h-screen bg-gray-50">
<section className="relative bg-chocolate-700 text-white py-20 md:py-32 overflow-hidden">
  <div 
    className="absolute inset-0 z-0 opacity-50 md:opacity-40 bg-center md:bg-[center_80%]"
    style={{
      backgroundImage: vansBg ? `url(${vansBg})` : 'none',
      backgroundSize: 'cover',
      mixBlendMode: 'overlay'
    }}
  ></div>
<div className="container mx-auto px-4 relative z-10">
<div className="max-w-4xl mx-auto text-center">
<Badge className="mb-4 bg-yellow-400 text-chocolate-900 text-lg px-4 py-2">
<Sparkles className="h-5 w-5 mr-2 inline" />
Ofertas Exclusivas
</Badge>
<h1 className="text-5xl md:text-6xl font-bold mb-6">
Traslados Privados con hasta{" "}
<span className="text-yellow-400">60% de Descuento</span>
</h1>
<p className="text-xl md:text-2xl mb-8 text-chocolate-100">
Aprovecha nuestros retornos disponibles. Mismo servicio premium,
mejor precio.
</p>
<div className="flex flex-wrap justify-center gap-6 text-lg">
<div className="flex items-center gap-2">
<CheckCircle2 className="h-6 w-6 text-green-400" />
<span>100% Privado</span>
</div>
<div className="flex items-center gap-2">
<CheckCircle2 className="h-6 w-6 text-green-400" />
<span>Vehículo Completo</span>
</div>
<div className="flex items-center gap-2">
<CheckCircle2 className="h-6 w-6 text-green-400" />
<span>Conductor Certificado</span>
</div>
</div>
</div>
</div>
</section>

<section className="py-16 bg-white">
<div className="container mx-auto px-4">
<h2 className="text-4xl font-bold text-center mb-12 text-gray-800">
¿Cómo Funciona?
</h2>
<div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
<div className="text-center">
<div className="bg-chocolate-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
<Car className="h-10 w-10 text-chocolate-600" />
</div>
<h3 className="text-xl font-bold mb-2">Retornos Vacíos</h3>
<p className="text-muted-foreground">
Cuando dejamos un cliente en su destino, el vehículo está
disponible para el retorno
</p>
</div>
<div className="text-center">
<div className="bg-chocolate-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
<TrendingDown className="h-10 w-10 text-chocolate-600" />
</div>
<h3 className="text-xl font-bold mb-2">Precio Especial</h3>
<p className="text-muted-foreground">
Ofrecemos hasta 60% de descuento para aprovechar ese traslado
vacío
</p>
</div>
<div className="text-center">
<div className="bg-chocolate-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
<CheckCircle2 className="h-10 w-10 text-chocolate-600" />
</div>
<h3 className="text-xl font-bold mb-2">Servicio Premium</h3>
<p className="text-muted-foreground">
Mismo traslado privado, mismo conductor profesional, mejor
precio
</p>
</div>
</div>
</div>
</section>

<section className="py-16 bg-gray-50">
<div className="container mx-auto px-4">
<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
<div>
<h2 className="text-4xl font-bold text-gray-800">
Oportunidades Activas
</h2>
<p className="text-muted-foreground mt-2">
Actualización automática cada 2 minutos
</p>
</div>
						<div className="flex items-center gap-2">
							<Button
								variant="ghost"
								className="text-gray-600 hover:text-chocolate-600 font-medium"
								onClick={() => (window.location.href = "/")}
							>
								<ArrowLeft className="h-4 w-4 mr-2" />
								Volver al Inicio
							</Button>
							<Button
								onClick={() => cargarOportunidades()}
								variant="outline"
								disabled={loading}
							>
								<RefreshCw
									className={"h-4 w-4 mr-2 " + (loading ? "animate-spin" : "")}
								/>
								Actualizar
							</Button>
						</div>
</div>

<div className="bg-white p-6 rounded-lg shadow-sm mb-8">
<div className="flex items-center gap-2 mb-4">
<Filter className="h-5 w-5 text-chocolate-600" />
<h3 className="font-semibold text-lg">Filtrar Oportunidades</h3>
</div>
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
<Select
value={filtros.origen}
onValueChange={(value) =>
setFiltros({ ...filtros, origen: value })
}
>
<SelectTrigger>
<SelectValue placeholder="Origen" />
</SelectTrigger>
<SelectContent>
<SelectItem value="todos">Todos los orígenes</SelectItem>
{origenes.map((origen) => (
<SelectItem key={origen} value={origen}>
{origen}
</SelectItem>
))}
</SelectContent>
</Select>

<Select
value={filtros.destino}
onValueChange={(value) =>
setFiltros({ ...filtros, destino: value })
}
>
<SelectTrigger>
<SelectValue placeholder="Destino" />
</SelectTrigger>
<SelectContent>
<SelectItem value="todos">Todos los destinos</SelectItem>
{destinos.map((destino) => (
<SelectItem key={destino} value={destino}>
{destino}
</SelectItem>
))}
</SelectContent>
</Select>

<input
type="date"
value={filtros.fecha}
onChange={(e) =>
setFiltros({ ...filtros, fecha: e.target.value })
}
className="border rounded-md px-3 py-2"
min={new Date().toISOString().split("T")[0]}
/>
</div>
{(filtros.origen || filtros.destino || filtros.fecha) && (
<Button
onClick={() => setFiltros({ origen: "", destino: "", fecha: "" })}
variant="link"
className="mt-2"
>
Limpiar filtros
</Button>
)}
</div>

{loading && (
<div className="text-center py-12">
<RefreshCw className="h-12 w-12 animate-spin mx-auto text-chocolate-600 mb-4" />
<p className="text-lg text-muted-foreground">
Cargando oportunidades...
</p>
</div>
)}

{error && (
<Alert variant="destructive" className="mb-8">
<AlertCircle className="h-4 w-4" />
<AlertDescription>{error}</AlertDescription>
</Alert>
)}

{!loading && !error && oportunidades.length === 0 && (
<div className="text-center py-12">
<AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
<p className="text-lg text-muted-foreground mb-4">
No hay oportunidades disponibles en este momento
</p>
<p className="text-sm text-muted-foreground">
Suscríbete abajo para recibir alertas cuando haya nuevas
oportunidades
</p>
</div>
)}

{!loading && !error && oportunidades.length > 0 && (
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
{oportunidades.map((oportunidad) => (
<OportunidadCard
key={oportunidad.id}
oportunidad={oportunidad}
onReservar={handleReservar}
/>
))}
</div>
)}
</div>
</section>

<section className="py-16 bg-white">
<div className="container mx-auto px-4">
<SuscripcionOportunidades />
</div>
</section>

      <section className="py-16 bg-chocolate-50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">
            Nuestras Garantías
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <div className="text-center">
              <Badge className="mb-4 bg-green-500 text-white text-base px-4 py-2">
                100% Privado
              </Badge>
              <p className="text-sm text-muted-foreground">
                El vehículo es solo para ti y tu grupo
              </p>
            </div>
            <div className="text-center">
              <Badge className="mb-4 bg-blue-500 text-white text-base px-4 py-2">
                Mismo Servicio
              </Badge>
              <p className="text-sm text-muted-foreground">
                Calidad premium sin diferencias
              </p>
            </div>
            <div className="text-center">
              <Badge className="mb-4 bg-purple-500 text-white text-base px-4 py-2">
                Conductores Pro
              </Badge>
              <p className="text-sm text-muted-foreground">
                Certificados y con experiencia
              </p>
            </div>
            <div className="text-center">
              <Badge className="mb-4 bg-yellow-500 text-white text-base px-4 py-2">
                 Mejor Precio
              </Badge>
              <p className="text-sm text-muted-foreground">
                Hasta 60% de ahorro garantizado
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Modal de Reserva Expedita */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[520px] p-0 overflow-hidden rounded-t-2xl sm:rounded-2xl border-none shadow-2xl max-h-[95vh] flex flex-col">
          <DialogHeader className="bg-chocolate-600 p-4 sm:p-6 text-white relative shrink-0">
            <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2 sm:gap-3 text-white">
              <Sparkles className="h-5 w-5 sm:h-6 sm:h-6 text-yellow-400 animate-pulse" />
              ¡Reserva tu Oferta!
            </DialogTitle>
            <DialogDescription className="text-chocolate-100 text-xs sm:text-base opacity-90 mt-0.5 sm:mt-1">
              Completa los datos para asegurar tu traslado con descuento.
            </DialogDescription>
            <div className="absolute top-4 sm:top-6 right-10 sm:right-6 bg-yellow-400 text-chocolate-900 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold shadow-lg">
              {oportunidadSeleccionada && `${Math.round((1 - oportunidadSeleccionada.precioFinal / oportunidadSeleccionada.precioOriginal) * 100)}% DCTO.`}
            </div>
          </DialogHeader>

          <div className="p-4 sm:p-5 space-y-3 bg-white overflow-y-auto max-h-[75vh] sm:max-h-[60vh] flex-grow">

            {/* Resumen de viaje consolidado con fecha y hora */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-chocolate-50 p-3 rounded-xl border border-chocolate-100">
                <p className="text-[10px] text-chocolate-600 font-bold uppercase tracking-wider mb-0.5">Ruta</p>
                <p className="text-sm font-semibold text-chocolate-900 line-clamp-1">
                  {oportunidadSeleccionada?.origen} → {oportunidadSeleccionada?.destino}
                </p>
              </div>
              <div className="bg-chocolate-50 p-3 rounded-xl border border-chocolate-100">
                <p className="text-[10px] text-chocolate-600 font-bold uppercase tracking-wider mb-0.5">Precio Oferta</p>
                <p className="text-lg font-bold text-chocolate-700 leading-tight">
                  ${oportunidadSeleccionada?.precioFinal.toLocaleString()}
                </p>
              </div>
              {oportunidadSeleccionada?.fecha && (
                <div className="bg-blue-50 p-3 rounded-xl border border-blue-200 col-span-2 relative">
                  <p className="text-[10px] text-blue-700 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Fecha y Hora del Servicio
                  </p>
                  <p className="text-sm font-bold text-blue-900">
                    {new Date(`${oportunidadSeleccionada.fecha}T00:00:00`).toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" })}
                    {oportunidadSeleccionada?.hora && ` — ${oportunidadSeleccionada.hora} hrs`}
                  </p>
                  <div className="flex items-start gap-1.5 mt-1.5 pt-1.5 border-t border-blue-100">
                    <ShieldAlert className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-blue-700 font-medium leading-tight">
                      <strong>Precio exclusivo:</strong> Válido solo para esta fecha y hora.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="nombre" className="text-xs font-bold text-gray-700">Tu Nombre Completo</Label>
                <Input
                  id="nombre"
                  name="nombre"
                  placeholder="Ej: Juan Pérez"
                  value={reservaFormData.nombre}
                  onChange={handleReservaInputChange}
                  className="h-10 border-gray-200 focus:ring-chocolate-500 rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-bold text-gray-700">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="tucorreo@ejemplo.com"
                    value={reservaFormData.email}
                    onChange={handleReservaInputChange}
                    className="h-10 border-gray-200 focus:ring-chocolate-500 rounded-xl text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="telefono" className="text-xs font-bold text-gray-700">Teléfono (WhatsApp)</Label>
                  <Input
                    id="telefono"
                    name="telefono"
                    placeholder="+56 9 1234 5678"
                    value={reservaFormData.telefono}
                    onChange={handleReservaInputChange}
                    className={`h-10 border-gray-200 focus:ring-chocolate-500 rounded-xl text-sm ${phoneError ? 'border-red-500' : ''}`}
                  />
                  {phoneError && <p className="text-[10px] text-red-500 font-medium">{phoneError}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="pasajeros" className="text-xs font-bold text-gray-700">Pasajeros</Label>
                  <Select
                    value={reservaFormData.pasajeros}
                    onValueChange={(value) => setReservaFormData(prev => ({ ...prev, pasajeros: value }))}
                  >
                    <SelectTrigger className="h-10 border-gray-200 focus:ring-chocolate-500 rounded-xl text-sm">
                      <SelectValue placeholder="Cuántos son" />
                    </SelectTrigger>
                    <SelectContent>
                      {[...Array(parseInt(oportunidadSeleccionada?.capacidad.match(/\d+/) || 7))].map((_, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()}>
                          {i + 1} {i === 0 ? "persona" : "personas"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="direccion" className="text-xs font-bold text-gray-700">
                    {oportunidadSeleccionada?.tipo === "retorno_vacio" ? "Recogida" : "Llegada"}
                  </Label>
                  <Input
                    id="direccion"
                    name="direccion"
                    placeholder="Hotel, Calle, etc."
                    value={reservaFormData.direccion}
                    onChange={handleReservaInputChange}
                    className="h-10 border-gray-200 focus:ring-chocolate-500 rounded-xl text-sm"
                  />
                </div>
              </div>

              {/* Nueva Fila: Hora de Salida con Validación */}
              <div className="space-y-1.5">
                <Label htmlFor="horaSalida" className="text-xs font-bold text-gray-700">
                  Hora de Salida Solicitada <span className="text-chocolate-600 font-medium text-[10px]">(Rango sugerido: {
                    oportunidadSeleccionada?.hora ? (() => {
                      const [h, m] = oportunidadSeleccionada.hora.split(":").map(Number);
                      const t = h * 60 + m;
                      const esIda = oportunidadSeleccionada.tipo === "ida_vacia";
                      const minT = esIda ? Math.max(0, t - 60) : t;
                      const maxT = esIda ? t : t + 60;
                      const format = (tm) => `${Math.floor(tm/60).toString().padStart(2,"0")}:${(tm%60).toString().padStart(2,"0")}`;
                      return `${format(minT)}h - ${format(maxT)}h`;
                    })() : "--:--"
                  })</span>
                </Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 z-10" />
                  <Input
                    id="horaSalida"
                    name="horaSalida"
                    type="time"
                    value={reservaFormData.horaSalida}
                    onChange={(e) => {
                      handleReservaInputChange(e);
                      setHoraError("");
                    }}
                    className={`h-10 pl-9 border-gray-200 focus:ring-chocolate-500 rounded-xl text-sm ${horaError ? 'border-red-500' : ''}`}
                  />
                </div>
                {horaError && (
                  <p className="text-[10px] text-red-500 font-medium">{horaError}</p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="p-4 sm:p-5 pt-0 bg-white flex flex-col items-stretch space-y-2 sm:flex-col sm:space-x-0 shrink-0">
            {/* Política de cancelación resumida */}
            <div className="w-full bg-gray-50 rounded-xl border border-gray-200 p-3">
              <p className="text-[10px] font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                <Info className="h-3 w-3 text-gray-500" />
                Política de Cancelación
              </p>
              <ul className="text-[10px] text-gray-600 space-y-0.5">
                {TERMINOS_CONDICIONES.find(t => t.titulo === "Cambios y Cancelaciones")?.contenido.slice(0, 2).map((item, i) => (
                  <li key={i} className="flex items-start gap-1">
                    <span className="text-chocolate-500 shrink-0">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Checkbox de consentimiento */}
            <div className="w-full flex items-start gap-2.5">
              <Checkbox
                id="aceptaTerminos"
                checked={aceptaTerminos}
                onCheckedChange={(checked) => {
                  setAceptaTerminos(checked);
                  if (checked) setTerminosError("");
                }}
                className="mt-0.5 h-4 w-4"
              />
              <label htmlFor="aceptaTerminos" className="text-[10px] text-gray-600 cursor-pointer leading-tight">
                Acepto los <strong>Términos y Condiciones</strong> y la política de exclusividad de precio para esta fecha/hora.
              </label>
            </div>
            {terminosError && (
              <p className="w-full text-[10px] text-red-500 font-medium flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {terminosError}
              </p>
            )}

            <Button
              className="w-full h-12 text-lg font-bold bg-chocolate-600 hover:bg-chocolate-700 text-white rounded-xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleConfirmarReserva}
              disabled={submittingReserva || !aceptaTerminos}
            >
              {submittingReserva ? (
                <>
                  <RefreshCw className="mr-2 h-5 w-5 animate-spin text-white" />
                  Procesando...
                </>
              ) : (
                <>
                  Pagar ${oportunidadSeleccionada?.precioFinal.toLocaleString()}
                  <Car className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
);
}

export default OportunidadesTraslado;
