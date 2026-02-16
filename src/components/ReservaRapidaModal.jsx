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
import { Switch } from "./ui/switch";
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
    cantidad_pasajeros: promocion ? (promocion.min_pasajeros || 1) : 1,
    sillaInfantil: false,
    cantidadSillasInfantiles: 1,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Lógica de opciones de hora sincronizada con HeroExpress
  const getTimeOptions = (fechaSeleccionada) => {
    let options = generateTimeOptions();

    if (!promocion) return options;

    // Filtrar por rango horario de la promoción (si existe)
    if (promocion.hora_inicio || promocion.hora_fin) {
      options = options.filter(opt => {
        const timeVal = opt.value; // "HH:MM"
        // Asegurar formato HH:MM comparando strings (funciona para 24h)
        const inicio = promocion.hora_inicio ? promocion.hora_inicio.slice(0, 5) : "00:00";
        const fin = promocion.hora_fin ? promocion.hora_fin.slice(0, 5) : "23:59";
        return timeVal >= inicio && timeVal <= fin;
      });
    }
    
    // Filtrado por anticipación mínima configurada
    const hoy = new Date();
    const hoyStr = hoy.toISOString().split("T")[0];
    
    if (fechaSeleccionada === hoyStr) {
      const ahora = new Date();
      // Usar anticipación configurada o default de 3 horas
      const anticipacionMinima = (promocion && promocion.anticipacion_minima !== undefined) ? promocion.anticipacion_minima : 3;
      
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

  // Calcular precio total dinámico y desglose
  const { precioTotal, desgloseSillas } = useMemo(() => {
    if (!promocion) return { precioTotal: 0, desgloseSillas: 0 };
    
    const precioBase = Number(promocion.precio);
    let total = precioBase;
    let extraSillas = 0;
    
    if (formData.sillaInfantil && promocion.permite_sillas) {
      const valorSilla = Number(promocion.valor_silla || 0);
      const cantidad = Number(formData.cantidadSillasInfantiles || 1);
      extraSillas = valorSilla * cantidad;
      total += extraSillas;
    }
    return { precioTotal: total, desgloseSillas: extraSillas };
  }, [promocion, formData.sillaInfantil, formData.cantidadSillasInfantiles]);

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
          amount: precioTotal, // Usar total calculado
          description: `Promoción ${promocion.nombre} - ${promocion.origen} a ${promocion.destino}`,
          email: formData.email,
          reservaId: data.reserva.id,
          codigoReserva: data.reserva.codigo_reserva,
          tipoPago: "total",
          paymentOrigin: "banner_promocional", // Identificar origen para conversiones GA
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
                    {promocion.tipo_viaje === "ida_vuelta" 
                      ? "Ida/Vta" 
                      : promocion.tipo_viaje === "desde_aeropuerto" 
                        ? "Desde Aeropuerto" 
                        : "Hacia Aeropuerto"}
                  </p>
                </div>
              </div>

              <div className="col-span-2 md:col-span-1 md:text-right pt-2 border-t md:border-t-0 border-green-200/50 mt-1 md:mt-0 flex justify-between md:flex-col items-center md:items-end">
                <p className="text-sm font-medium text-green-800">Total Promocional</p>
                <div className="flex flex-col items-end">
                  <span className="text-2xl font-black text-green-600 leading-none">
                    ${precioTotal.toLocaleString("es-CL", { maximumFractionDigits: 0 })}
                  </span>
                  {desgloseSillas > 0 && (
                    <span className="text-[10px] text-green-700/80 font-medium mt-0.5">
                      Incluido: +${desgloseSillas.toLocaleString("es-CL")} (Sillas)
                    </span>
                  )}
                </div>
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

               <div className="space-y-2 md:col-span-2">
                <Label htmlFor="cantidad_pasajeros" className="text-sm font-semibold">
                  Número de Pasajeros <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <select
                    id="cantidad_pasajeros"
                    name="cantidad_pasajeros"
                    value={formData.cantidad_pasajeros || promocion.min_pasajeros || 1}
                    onChange={handleChange}
                    required
                    className="w-full h-12 md:h-11 px-3 bg-gray-50/50 border border-gray-200 rounded-md text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 appearance-none cursor-pointer"
                  >
                    {Array.from(
                      { length: Math.max(1, (promocion.max_pasajeros || 3) - (promocion.min_pasajeros || 1) + 1) },
                      (_, i) => (promocion.min_pasajeros || 1) + i
                    ).map((num) => (
                      <option key={num} value={num}>
                        {num} {num === 1 ? "Pasajero" : "Pasajeros"}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-3.5 md:top-3 h-5 w-5 pointer-events-none text-gray-400">
                     <Users className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Selector de Sillas Infantiles (si aplica) */}
          {promocion.permite_sillas && (
            <div className="bg-amber-50/50 p-4 rounded-xl border-2 border-amber-100 space-y-3">
                <h3 className="font-bold text-base md:text-lg border-b border-amber-200 pb-2 flex items-center gap-2 text-amber-900">
                    👶 Servicios Adicionales
                </h3>
                
                <div className={`group flex flex-col justify-center p-4 rounded-xl border-2 transition-all cursor-pointer touch-manipulation ${
                    formData.sillaInfantil
                        ? 'bg-white border-amber-500 shadow-sm'
                        : 'bg-white border-amber-200/50 hover:bg-amber-50 active:bg-amber-100'
                }`}>
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full transition-colors ${formData.sillaInfantil ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-400'}`}>
                                <Users className="h-5 w-5" />
                            </div>
                            <div>
                                <Label htmlFor="sillaInfantil" className="text-sm md:text-base font-bold text-gray-900 cursor-pointer block leading-tight">
                                    Silla para niños
                                </Label>
                                {promocion.valor_silla > 0 && (
                                    <span className="text-[10px] md:text-xs text-amber-700 font-bold uppercase tracking-wide">
                                        +${Number(promocion.valor_silla).toLocaleString("es-CL")} c/u
                                    </span>
                                )}
                            </div>
                        </div>
                        <Switch
                            id="sillaInfantil"
                            checked={formData.sillaInfantil}
                            onCheckedChange={(checked) => setFormData(prev => ({ 
                                ...prev, 
                                sillaInfantil: checked,
                                cantidadSillasInfantiles: checked ? 1 : 0
                            }))}
                        />
                    </div>

                    {formData.sillaInfantil && (
                        <div className="mt-3 pt-3 border-t border-amber-100 flex items-center justify-between animate-in slide-in-from-top-2 fade-in duration-200">
                            <span className="text-xs font-bold text-amber-900 uppercase tracking-widest">Cantidad</span>
                            <div className="flex gap-2">
                                {[...Array(promocion.max_sillas || 1)].map((_, i) => (
                                    <button
                                        key={i + 1}
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, cantidadSillasInfantiles: i + 1 }))}
                                        className={`w-9 h-9 md:w-10 md:h-10 rounded-lg text-sm font-black transition-all active:scale-95 border-2 flex items-center justify-center ${
                                            formData.cantidadSillasInfantiles === (i + 1)
                                                ? 'bg-amber-500 text-white border-amber-600 shadow-md transform scale-105'
                                                : 'bg-white text-amber-900 border-amber-200 hover:border-amber-400'
                                        }`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
          )}

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
              {loading ? "Procesando..." : `Pagar $${precioTotal.toLocaleString("es-CL", { maximumFractionDigits: 0 })}`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
