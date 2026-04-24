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
import { usePasarelasConfig } from "../hooks/usePasarelasConfig";
import { TERMINOS_CONDICIONES } from "../data/legal";
import imagenOportunidades from "../assets/imagenoportunidades.png";
const vansBg = imagenOportunidades;

// Normaliza un nÃºmero de telÃ©fono al formato E.164 internacional
const normalizePhoneToE164 = (phone) => {
  if (!phone) return "";
  let cleaned = phone.replace(/[\s\-()]/g, "");
  if (cleaned.startsWith("+56")) return cleaned;
  if (cleaned.startsWith("56")) return "+" + cleaned;
  if (cleaned.startsWith("9") && cleaned.length >= 9) return "+56" + cleaned;
  return "+56" + cleaned;
};

function OportunidadesTraslado() {
const { pasarelasHabilitadas, loading: loadingPasarelas } = usePasarelasConfig();
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
setError("Error de conexiÃ³n. Por favor intenta nuevamente.");
} finally {
setLoading(false);
}
};

useEffect(() => {
cargarOportunidades();
}, [filtros]);

useEffect(() => {
const intervalId = setInterval(() => {
console.log("Actualizando oportunidades automÃ¡ticamente...");
cargarOportunidades();
}, 120000);
return () => clearInterval(intervalId);
}, [filtros]);

  const generarOpcionesHora = (horaBase, tipo) => {
    if (!horaBase) return [];
    const [h, m] = horaBase.split(":").map(Number);
    const t = h * 60 + m;
    const esIda = tipo === "ida_vacia";
    const minT = esIda ? Math.max(0, t - 60) : t;
    const maxT = esIda ? t : t + 60;
    
    const opciones = [];
    for (let time = minT; time <= maxT; time += 5) {
      const hh = Math.floor(time / 60).toString().padStart(2, "0");
      const mm = (time % 60).toString().padStart(2, "0");
      opciones.push(`${hh}:${mm}`);
    }
    return opciones;
  };

  const handleReservar = (oportunidad) => {
    setOportunidadSeleccionada(oportunidad);
    const opciones = generarOpcionesHora(oportunidad.hora || "", oportunidad.tipo);
    setReservaFormData({
      nombre: "",
      email: "",
      telefono: "",
      pasajeros: "1",
      direccion: "",
      horaSalida: opciones.length > 0 ? opciones[0] : (oportunidad.hora || ""),
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
      setTerminosError("Debes aceptar los tÃ©rminos y condiciones para continuar.");
      return;
    }

    if (!validarTelefono(reservaFormData.telefono)) {
      setPhoneError("Formato invÃ¡lido (ej: +56 9 1234 5678)");
      return;
    }

    // ValidaciÃ³n de rango horario
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
        // ValidaciÃ³n del precio antes de generar pago
        const precioValidado = validatePaymentAmount(data.precio);
        
        if (precioValidado <= 0) {
          alert("Error: No se pudo determinar el precio de la oportunidad. Contacta a soporte.");
          return;
        }
        
        console.log(`ðŸ’° [Oportunidades] Iniciando pago:`, {
          precioOriginal: data.precio,
          precioValidado: precioValidado,
          oportunidadId: oportunidadSeleccionada.id,
          reservaId: data.reservaId,
          codigoReserva: data.codigoReserva,
          email: reservaFormData.email
        });
        
        // Proceder al pago automáticamente según la pasarela habilitada en configuración
        if (loadingPasarelas) {
          alert("Cargando opciones de pago, intenta nuevamente en un momento.");
          setSubmittingReserva(false);
          return;
        }
        const gatewayActivo = pasarelasHabilitadas[0]?.id;
        if (!gatewayActivo) {
          alert("No hay pasarelas de pago disponibles. Contacta a soporte.");
          return;
        }

        const description = `Reserva Oportunidad ${oportunidadSeleccionada.codigo} - ${oportunidadSeleccionada.origen} a ${oportunidadSeleccionada.destino}`;
        const endpoint =
          gatewayActivo === "mercadopago"
            ? `${getBackendUrl()}/api/create-payment-mp`
            : `${getBackendUrl()}/create-payment`;
        const paymentBody =
          gatewayActivo === "mercadopago"
            ? {
                amount: precioValidado,
                description,
                email: reservaFormData.email,
                nombre: reservaFormData.nombre,
                telefono: reservaFormData.telefono,
                reservaId: data.reservaId,
                codigoReserva: data.codigoReserva,
                tipoPago: "total",
                paymentOrigin: "oportunidad_traslado",
              }
            : {
                gateway: "flow",
                amount: precioValidado,
                description,
                email: reservaFormData.email,
                reservaId: data.reservaId,
                codigoReserva: data.codigoReserva,
                tipoPago: "total",
                paymentOrigin: "oportunidad_traslado",
              };

        const paymentResponse = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(paymentBody),
        });

        const paymentData = await paymentResponse.json();
        if (paymentData.url) {
          // âœ… Lead: registrar intenciÃ³n de pago antes de redirigir a Flow
          // Usar waitForGtag para garantizar que el evento se envÃ­e incluso si gtag.js
          // aÃºn no terminÃ³ de cargar (poco probable tras el tiempo del formulario + API, pero seguro).
          const waitForGtag = () => new Promise((resolve) => {
            if (typeof window.gtag === "function") { resolve(); return; }
            const inicio = Date.now();
            const iv = setInterval(() => {
              if (typeof window.gtag === "function") { clearInterval(iv); resolve(); }
              else if (Date.now() - inicio >= 2000) { clearInterval(iv); resolve(); } // 2s mÃ¡x para no bloquear la navegaciÃ³n
            }, 50);
          });

          await waitForGtag();

          if (typeof window.gtag === "function") {
            const conversionData = {
              send_to: "AW-17529712870/8GVlCLP-05MbEObh6KZB"
            };

            const userData = {};
            if (reservaFormData.email) userData.email = reservaFormData.email.toLowerCase().trim();
            if (reservaFormData.telefono) userData.phone_number = normalizePhoneToE164(reservaFormData.telefono);
            if (reservaFormData.nombre) {
              const nameParts = reservaFormData.nombre.trim().split(" ");
              userData.address = {
                first_name: nameParts[0]?.toLowerCase() || "",
                last_name: nameParts.slice(1).join(" ")?.toLowerCase() || "",
                country: "CL",
              };
            }

            if (Object.keys(userData).length > 0) {
              conversionData.user_data = userData;
            }

            window.gtag("event", "conversion", conversionData);
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
      alert("Error de conexiÃ³n. Intenta nuevamente.");
    } finally {
      setSubmittingReserva(false);
    }
  };

const origenes = [...new Set(oportunidades.map((op) => op.origen))];
const destinos = [...new Set(oportunidades.map((op) => op.destino))];

return (
<div className="min-h-screen bg-background">
<section className="relative overflow-hidden bg-primary bg-pattern-mesh py-20 text-primary-foreground md:py-28">
  <div className="absolute inset-0 bg-primary/75" />
  <div 
    className="absolute inset-0 z-0 bg-center opacity-45 md:bg-[center_80%] md:opacity-35"
    style={{
      backgroundImage: vansBg ? `url(${vansBg})` : "none",
      backgroundSize: "cover",
      mixBlendMode: "overlay"
    }}
  ></div>
  <div className="absolute -right-44 -top-44 h-[380px] w-[380px] rounded-full bg-secondary/30 blur-[120px]" />
  <div className="absolute -left-52 bottom-[-120px] h-[320px] w-[320px] rounded-full bg-accent/25 blur-[130px]" />
<div className="container relative z-10 mx-auto px-4">
<div className="mx-auto max-w-4xl text-center">
<Badge className="mb-5 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-accent-foreground md:text-base">
<Sparkles className="mr-2 inline h-4 w-4 md:h-5 md:w-5" />
Ofertas exclusivas
</Badge>
<h1 className="font-serif text-4xl font-semibold leading-tight md:text-6xl">
Traslados privados con hasta{" "}
<span className="text-cafe-200">60% de descuento</span>
</h1>
<p className="mx-auto mt-6 max-w-3xl text-base text-primary-foreground/90 md:text-xl">
Aprovecha retornos disponibles con el mismo estándar premium de Transportes Araucaria y una tarifa más conveniente.
</p>
<div className="mt-8 flex flex-wrap justify-center gap-4 text-sm md:text-base">
<div className="flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 backdrop-blur-md">
<CheckCircle2 className="h-5 w-5 text-cafe-200" />
<span>100% privado</span>
</div>
<div className="flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 backdrop-blur-md">
<CheckCircle2 className="h-5 w-5 text-cafe-200" />
<span>Vehículo completo</span>
</div>
<div className="flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 backdrop-blur-md">
<CheckCircle2 className="h-5 w-5 text-cafe-200" />
<span>Conductor certificado</span>
</div>
</div>
</div>
</div>
</section>

<section className="bg-background py-16">
<div className="container mx-auto px-4">
<h2 className="mb-12 text-center font-serif text-4xl font-semibold text-foreground">
¿Cómo funciona?
</h2>
<div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
<div className="rounded-[2rem] border border-border/70 bg-card p-6 text-center shadow-sm">
<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
<Car className="h-8 w-8 text-primary" />
</div>
<h3 className="mb-2 text-lg font-semibold text-foreground">Retornos vacíos</h3>
<p className="text-sm text-muted-foreground">
Cuando dejamos un cliente en destino, ese regreso puede convertirse en una oportunidad con precio preferente.
</p>
</div>
<div className="rounded-[2rem] border border-border/70 bg-card p-6 text-center shadow-sm">
<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary/15">
<TrendingDown className="h-8 w-8 text-secondary" />
</div>
<h3 className="mb-2 text-lg font-semibold text-foreground">Precio especial</h3>
<p className="text-sm text-muted-foreground">
Publicamos descuentos de hasta 60% para optimizar traslados vacíos sin comprometer calidad.
</p>
</div>
<div className="rounded-[2rem] border border-border/70 bg-card p-6 text-center shadow-sm">
<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/15">
<CheckCircle2 className="h-8 w-8 text-accent" />
</div>
<h3 className="mb-2 text-lg font-semibold text-foreground">Servicio premium</h3>
<p className="text-sm text-muted-foreground">
Mantienes traslado privado, conductor profesional y seguimiento operativo en tiempo real.
</p>
</div>
</div>
</div>
</section>

<section className="bg-muted/35 py-16">
<div className="container mx-auto px-4">
<div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
<div>
<h2 className="font-serif text-4xl font-semibold text-foreground">
Oportunidades activas
</h2>
<p className="mt-2 text-sm text-muted-foreground">
Actualización automática cada 2 minutos.
</p>
</div>
						<div className="flex items-center gap-2">
							<Button
								variant="ghost"
								className="font-medium hover:bg-muted"
								onClick={() => (window.location.href = "/")}
							>
								<ArrowLeft className="mr-2 h-4 w-4" />
								Volver al inicio
							</Button>
							<Button
								onClick={() => cargarOportunidades()}
								variant="outline"
								disabled={loading}
								className="rounded-xl"
							>
								<RefreshCw
									className={"mr-2 h-4 w-4 " + (loading ? "animate-spin" : "")}
								/>
								Actualizar
							</Button>
						</div>
</div>

<div className="mb-8 rounded-[2rem] border border-border/70 bg-card p-5 shadow-sm md:p-6">
<div className="mb-4 flex items-center gap-2">
<Filter className="h-5 w-5 text-secondary" />
<h3 className="text-lg font-semibold text-foreground">Filtrar oportunidades</h3>
</div>
<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
<Select
value={filtros.origen}
onValueChange={(value) =>
setFiltros({ ...filtros, origen: value })
}
>
<SelectTrigger className="h-11 rounded-xl border-input">
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
<SelectTrigger className="h-11 rounded-xl border-input">
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

<Input
type="date"
value={filtros.fecha}
onChange={(e) =>
setFiltros({ ...filtros, fecha: e.target.value })
}
className="h-11 rounded-xl border-input"
min={new Date().toISOString().split("T")[0]}
/>
</div>
{(filtros.origen || filtros.destino || filtros.fecha) && (
<Button
onClick={() => setFiltros({ origen: "", destino: "", fecha: "" })}
variant="link"
className="mt-2 h-auto p-0 text-secondary"
>
Limpiar filtros
</Button>
)}
</div>

{loading && (
<div className="rounded-[2rem] border border-border/60 bg-card py-12 text-center shadow-sm">
<RefreshCw className="mx-auto mb-4 h-12 w-12 animate-spin text-secondary" />
<p className="text-base text-muted-foreground">
Cargando oportunidades...
</p>
</div>
)}

{error && (
<Alert variant="destructive" className="mb-8 rounded-2xl">
<AlertCircle className="h-4 w-4" />
<AlertDescription>{error}</AlertDescription>
</Alert>
)}

{!loading && !error && oportunidades.length === 0 && (
<div className="rounded-[2rem] border border-dashed border-border bg-card py-12 text-center">
<AlertCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
<p className="mb-2 text-lg text-foreground">
No hay oportunidades disponibles por ahora
</p>
<p className="text-sm text-muted-foreground">
Suscríbete más abajo y te avisaremos apenas haya nuevas opciones.
</p>
</div>
)}

{!loading && !error && oportunidades.length > 0 && (
<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
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

<section className="bg-background py-16">
<div className="container mx-auto px-4">
<SuscripcionOportunidades />
</div>
</section>

      <section className="bg-muted/45 py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center font-serif text-4xl font-semibold text-foreground">
            Nuestras garantías
          </h2>
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-5 md:grid-cols-4">
            <div className="rounded-3xl border border-border/70 bg-card p-5 text-center shadow-sm">
              <Badge className="mb-4 rounded-full bg-primary text-primary-foreground">
                100% privado
              </Badge>
              <p className="text-sm text-muted-foreground">
                El vehículo es solo para ti y tu grupo.
              </p>
            </div>
            <div className="rounded-3xl border border-border/70 bg-card p-5 text-center shadow-sm">
              <Badge className="mb-4 rounded-full bg-secondary text-secondary-foreground">
                Mismo servicio
              </Badge>
              <p className="text-sm text-muted-foreground">
                Mantienes la calidad premium del traslado.
              </p>
            </div>
            <div className="rounded-3xl border border-border/70 bg-card p-5 text-center shadow-sm">
              <Badge className="mb-4 rounded-full bg-accent text-accent-foreground">
                Conductores pro
              </Badge>
              <p className="text-sm text-muted-foreground">
                Conductores certificados y con experiencia.
              </p>
            </div>
            <div className="rounded-3xl border border-border/70 bg-card p-5 text-center shadow-sm">
              <Badge className="mb-4 rounded-full bg-primary/90 text-primary-foreground">
                 Mejor precio
              </Badge>
              <p className="text-sm text-muted-foreground">
                Hasta 60% de ahorro en ventanas seleccionadas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Modal de Reserva Expedita */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="flex max-h-[95vh] flex-col overflow-hidden rounded-3xl border border-border p-0 shadow-2xl sm:max-w-[520px]">
          <DialogHeader className="relative shrink-0 bg-primary p-4 text-primary-foreground sm:p-6">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold sm:gap-3 sm:text-2xl">
              <Sparkles className="h-5 w-5 text-cafe-200 sm:h-6 sm:w-6" />
              ¡Reserva tu oferta!
            </DialogTitle>
            <DialogDescription className="mt-1 text-xs text-primary-foreground/85 sm:text-sm">
              Completa los datos para asegurar tu traslado con descuento.
            </DialogDescription>
            <div className="absolute right-10 top-4 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-accent-foreground shadow-lg sm:right-6 sm:top-6 sm:px-3 sm:py-1 sm:text-xs">
              {oportunidadSeleccionada && `${Math.round((1 - oportunidadSeleccionada.precioFinal / oportunidadSeleccionada.precioOriginal) * 100)}% DCTO.`}
            </div>
          </DialogHeader>

          <ScrollArea className="max-h-[72vh] flex-grow bg-background p-4 sm:max-h-[60vh] sm:p-5">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-border/70 bg-muted/50 p-3">
                  <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Ruta</p>
                  <p className="line-clamp-1 text-sm font-semibold text-foreground">
                    {oportunidadSeleccionada?.origen} → {oportunidadSeleccionada?.destino}
                  </p>
                </div>
                <div className="rounded-xl border border-secondary/30 bg-secondary/10 p-3">
                  <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-secondary">Precio oferta</p>
                  <p className="text-lg font-bold leading-tight text-secondary">
                    ${oportunidadSeleccionada?.precioFinal.toLocaleString()}
                  </p>
                </div>
                {oportunidadSeleccionada?.fecha && (
                  <div className="col-span-2 rounded-xl border border-accent/30 bg-accent/10 p-3">
                    <p className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-accent-foreground">
                      <Calendar className="h-3 w-3" /> Fecha y hora del servicio
                    </p>
                    <p className="text-sm font-bold text-foreground">
                      {new Date(`${oportunidadSeleccionada.fecha}T00:00:00`).toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" })}
                      {oportunidadSeleccionada?.hora && ` - ${oportunidadSeleccionada.hora} hrs`}
                    </p>
                    <div className="mt-1.5 flex items-start gap-1.5 border-t border-accent/30 pt-1.5">
                      <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-secondary" />
                      <p className="text-[11px] font-medium leading-tight text-foreground/85">
                        <strong>Precio exclusivo:</strong> válido solo para esta fecha y hora.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="nombre" className="text-xs font-bold text-foreground">Tu nombre completo</Label>
                  <Input
                    id="nombre"
                    name="nombre"
                    placeholder="Ej: Juan Pérez"
                    value={reservaFormData.nombre}
                    onChange={handleReservaInputChange}
                    className="h-10 rounded-xl border-input text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-bold text-foreground">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="tucorreo@ejemplo.com"
                      value={reservaFormData.email}
                      onChange={handleReservaInputChange}
                      className="h-10 rounded-xl border-input text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="telefono" className="text-xs font-bold text-foreground">Teléfono (WhatsApp)</Label>
                    <Input
                      id="telefono"
                      name="telefono"
                      placeholder="+56 9 1234 5678"
                      value={reservaFormData.telefono}
                      onChange={handleReservaInputChange}
                      className={`h-10 rounded-xl border-input text-sm ${phoneError ? "border-destructive" : ""}`}
                    />
                    {phoneError && <p className="text-[10px] font-medium text-destructive">{phoneError}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="pasajeros" className="text-xs font-bold text-foreground">Pasajeros</Label>
                    <Select
                      value={reservaFormData.pasajeros}
                      onValueChange={(value) => setReservaFormData(prev => ({ ...prev, pasajeros: value }))}
                    >
                      <SelectTrigger className="h-10 rounded-xl border-input text-sm">
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
                    <Label htmlFor="direccion" className="text-xs font-bold text-foreground">
                      {oportunidadSeleccionada?.tipo === "retorno_vacio" ? "Recogida" : "Llegada"}
                    </Label>
                    <Input
                      id="direccion"
                      name="direccion"
                      placeholder="Hotel, calle, etc."
                      value={reservaFormData.direccion}
                      onChange={handleReservaInputChange}
                      className="h-10 rounded-xl border-input text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="horaSalida" className="text-xs font-bold text-foreground">
                    Hora de salida solicitada <span className="text-[10px] font-medium text-secondary">(Rango sugerido: {
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
                    <Clock className="absolute left-3 top-2.5 z-10 h-4 w-4 text-muted-foreground" />
                    <Select
                      value={reservaFormData.horaSalida}
                      onValueChange={(value) => {
                        setReservaFormData(prev => ({ ...prev, horaSalida: value }));
                        setHoraError("");
                      }}
                    >
                      <SelectTrigger className={`h-10 rounded-xl border-input pl-9 text-sm ${horaError ? "border-destructive" : ""}`}>
                        <SelectValue placeholder="Selecciona la hora" />
                      </SelectTrigger>
                      <SelectContent>
                        {generarOpcionesHora(oportunidadSeleccionada?.hora, oportunidadSeleccionada?.tipo).map((hora) => (
                          <SelectItem key={hora} value={hora}>
                            {hora} hrs
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {horaError && (
                    <p className="text-[10px] font-medium text-destructive">{horaError}</p>
                  )}
                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="flex shrink-0 flex-col items-stretch gap-2 border-t border-border bg-background p-4 sm:p-5">
            <div className="w-full rounded-xl border border-border/70 bg-muted/45 p-3">
              <p className="mb-1 flex items-center gap-1.5 text-[10px] font-bold text-foreground">
                <Info className="h-3 w-3 text-muted-foreground" />
                Política de cancelación
              </p>
              <ul className="space-y-0.5 text-[10px] text-muted-foreground">
                {TERMINOS_CONDICIONES.find(t => t.titulo === "Cambios y Cancelaciones")?.contenido.slice(0, 2).map((item, i) => (
                  <li key={i} className="flex items-start gap-1">
                    <span className="shrink-0 text-secondary">-</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex w-full items-start gap-2.5">
              <Checkbox
                id="aceptaTerminos"
                checked={aceptaTerminos}
                onCheckedChange={(checked) => {
                  setAceptaTerminos(checked);
                  if (checked) setTerminosError("");
                }}
                className="mt-0.5 h-4 w-4"
              />
              <label htmlFor="aceptaTerminos" className="cursor-pointer text-[10px] leading-tight text-muted-foreground">
                Acepto los <strong>Términos y Condiciones</strong> y la política de exclusividad de precio para esta fecha/hora.
              </label>
            </div>
            {terminosError && (
              <p className="flex w-full items-center gap-1 text-[10px] font-medium text-destructive">
                <AlertCircle className="h-3 w-3" />
                {terminosError}
              </p>
            )}

            <Button
              className="h-12 w-full rounded-xl bg-secondary text-base font-bold text-secondary-foreground shadow-md transition-all hover:bg-secondary/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              onClick={handleConfirmarReserva}
              disabled={submittingReserva || !aceptaTerminos}
            >
              {submittingReserva ? (
                <>
                  <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
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

