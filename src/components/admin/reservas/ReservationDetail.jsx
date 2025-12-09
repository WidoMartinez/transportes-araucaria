import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../ui/dialog";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { Separator } from "../../ui/separator";
import {
  User,
  Mail,
  Phone,
  CreditCard,
  MapPin,
  Calendar,
  Clock,
  Car,
  UserCheck,
  Plane,
  Building,
  Briefcase,
  Baby,
  MessageCircle,
  Edit,
  X
} from "lucide-react";

export function ReservationDetail({
  isOpen,
  onClose,
  reserva,
  onEdit,
  onAsignar,
}) {
  if (!reserva) return null;

  const formatDate = (dateString, timeString) => {
    if (!dateString) return "Fecha no definida";
    const date = new Date(dateString);
    const dateFormatted = date.toLocaleDateString("es-CL", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    // Capitalize first letter only
    const capitalizedDate = dateFormatted.charAt(0).toUpperCase() + dateFormatted.slice(1);
    return `${capitalizedDate} ${timeString ? `a las ${timeString}` : ""}`;
  };

  const getStatusBadge = (status) => {
    const styles = {
      pendiente: "bg-yellow-100 text-yellow-800 border-yellow-200",
      confirmada: "bg-blue-100 text-blue-800 border-blue-200",
      completada: "bg-green-100 text-green-800 border-green-200",
      cancelada: "bg-red-100 text-red-800 border-red-200",
    };
    return (
      <Badge variant="outline" className={`${styles[status?.toLowerCase()] || "bg-gray-100"} capitalize`}>
        {status}
      </Badge>
    );
  };

  const getPaymentBadge = (status) => {
    const styles = {
      pendiente: "bg-orange-50 text-orange-700 border-orange-200",
      pagado: "bg-green-50 text-green-700 border-green-200",
      parcial: "bg-yellow-50 text-yellow-700 border-yellow-200",
      reembolsado: "bg-purple-50 text-purple-700 border-purple-200",
    };
    return (
      <Badge variant="outline" className={`${styles[status?.toLowerCase()] || "bg-gray-50"} capitalize`}>
        {status}
      </Badge>
    );
  };

  const sendWhatsApp = () => {
    if (!reserva.telefono) return;
    const phone = reserva.telefono.replace(/[^\d]/g, "");
    const message = `Hola ${reserva.nombre}, te contactamos de Transportes Araucanía por tu reserva #${reserva.id}.`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-7xl max-h-[90vh] flex flex-col p-0 gap-0 bg-gray-50">
        
        {/* Header Fixed */}
        <div className="p-6 bg-white border-b shrink-0">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-2xl font-bold text-gray-900">Reserva #{reserva.id}</h2>
                {getStatusBadge(reserva.estado)}
              </div>
              <p className="text-sm text-gray-500">
                Creada el {new Date(reserva.createdAt || Date.now()).toLocaleDateString("es-CL")}
              </p>
            </div>
            
            <div className="flex gap-2">
               <Button variant="outline" size="sm" onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
               </Button>
               <Button variant="ghost" size="icon" onClick={onClose} className="-mr-2">
                  <X className="h-4 w-4" />
               </Button>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Columna Izquierda: Cliente & Pago */}
            <div className="space-y-6">
              
              {/* Cliente Card */}
              <div className="bg-white p-4 rounded-xl border shadow-sm">
                 <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                   <User className="h-5 w-5 text-primary" />
                   Información del Cliente
                 </h3>
                 
                 <div className="space-y-3">
                   <div className="flex items-start gap-3">
                     <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                       <span className="font-semibold text-gray-600">
                          {reserva.nombre?.charAt(0).toUpperCase()}
                       </span>
                     </div>
                     <div>
                       <p className="font-medium text-gray-900">{reserva.nombre}</p>
                       <p className="text-sm text-gray-500">Cliente {reserva.esCliente ? "Frecuente" : "Estándar"}</p>
                     </div>
                   </div>
                   
                   <Separator />
                   
                   <div className="grid gap-3 text-sm">
                     <div className="flex items-center gap-2 text-gray-700">
                       <Mail className="h-4 w-4 text-gray-400" />
                       <a href={`mailto:${reserva.email}`} className="hover:text-primary hover:underline">{reserva.email}</a>
                     </div>
                     <div className="flex items-center gap-2 text-gray-700">
                       <Phone className="h-4 w-4 text-gray-400" />
                       <span>{reserva.telefono}</span>
                       <Button 
                         variant="ghost" 
                         size="sm" 
                         className="h-6 px-2 text-green-600 hover:text-green-700 hover:bg-green-50 ml-auto"
                         onClick={sendWhatsApp}
                       >
                         <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
                         WhatsApp
                       </Button>
                     </div>
                     {reserva.rut && (
                        <div className="flex items-center gap-2 text-gray-700">
                          <UserCheck className="h-4 w-4 text-gray-400" />
                          <span>RUT: {reserva.rut}</span>
                        </div>
                     )}
                   </div>
                 </div>
              </div>

              {/* Pago Card */}
              <div className="bg-white p-4 rounded-xl border shadow-sm">
                 <div className="flex justify-between items-center mb-4">
                   <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                     <CreditCard className="h-5 w-5 text-primary" />
                     Detalles de Pago
                   </h3>
                   {getPaymentBadge(reserva.estadoPago)}
                 </div>

                 <div className="space-y-3">
                   <div className="flex justify-between items-end p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Total a Pagar</span>
                      <span className="text-xl font-bold text-gray-900">
                        {new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(reserva.totalConDescuento || reserva.precio || 0)}
                      </span>
                   </div>

                   <div className="grid grid-cols-2 gap-4 text-sm mt-2">
                      <div>
                        <span className="text-gray-500 block text-xs uppercase tracking-wider">Método</span>
                        <span className="font-medium">{reserva.metodoPago || "No especificado"}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block text-xs uppercase tracking-wider">Referencia</span>
                        <span className="font-medium truncate" title={reserva.referenciaPago}>
                           {reserva.referenciaPago || "-"}
                        </span>
                      </div>
                   </div>
                 </div>
              </div>

              {/* Asignación Card */}
               <div className="bg-white p-4 rounded-xl border shadow-sm">
                 <div className="flex justify-between items-center mb-4">
                   <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                     <Car className="h-5 w-5 text-primary" />
                     Asignación
                   </h3>
                   <Button variant="ghost" size="sm" onClick={onAsignar} className="text-primary hover:text-primary/90 h-8 px-2">
                     {reserva.vehiculo || reserva.conductor ? "Cambiar" : "Asignar"}
                   </Button>
                 </div>

                 <div className="space-y-4">
                   <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                        <Car className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-blue-600 font-medium uppercase">Vehículo</p>
                        <p className="text-sm font-semibold text-gray-900">{reserva.vehiculo || "Sin asignar"}</p>
                      </div>
                   </div>
                   
                   <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                        <UserCheck className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-xs text-indigo-600 font-medium uppercase">Conductor</p>
                        <p className="text-sm font-semibold text-gray-900">{reserva.conductor || "Sin asignar"}</p>
                      </div>
                   </div>
                 </div>
              </div>

            </div>

            {/* Columna Derecha: Viaje */}
            <div className="space-y-6">
              
               {/* Viaje Card */}
               <div className="bg-white p-4 rounded-xl border shadow-sm h-full">
                  <h3 className="font-semibold text-gray-900 mb-6 flex items-center gap-2">
                     <MapPin className="h-5 w-5 text-primary" />
                     Itinerario de Viaje
                  </h3>

                  <div className="relative pl-8 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
                    {/* Origen */}
                    <div className="relative">
                      <div className="absolute -left-8 top-1 h-6 w-6 rounded-full border-4 border-white bg-green-500 shadow-sm z-10 box-content"></div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">Origen</p>
                      <p className="text-lg font-semibold text-gray-900">{reserva.origen}</p>
                    </div>

                    {/* Destino */}
                     <div className="relative">
                      <div className="absolute -left-8 top-1 h-6 w-6 rounded-full border-4 border-white bg-red-500 shadow-sm z-10 box-content"></div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">Destino</p>
                      <p className="text-lg font-semibold text-gray-900">{reserva.destino}</p>
                    </div>
                  </div>

                  <div className="mt-8 grid gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                     <div className="flex items-center gap-3">
                       <Calendar className="h-5 w-5 text-gray-400" />
                       <div>
                         <p className="text-sm text-gray-500">Fecha y Hora</p>
                         <p className="font-medium text-gray-900">
                           {formatDate(reserva.fecha, reserva.hora)}
                         </p>
                       </div>
                     </div>

                     {reserva.idaVuelta && (
                       <>
                        <Separator className="border-dashed" />
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col">
                             <Badge variant="secondary" className="w-fit mb-1">Regreso</Badge>
                             <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-purple-400" />
                                <p className="font-medium text-gray-900">
                                  {formatDate(reserva.fechaRegreso, reserva.horaRegreso)}
                                </p>
                             </div>
                          </div>
                        </div>
                       </>
                     )}
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-4">
                     <div className="space-y-1">
                       <div className="flex items-center gap-2 text-sm text-gray-600">
                         <Plane className="h-4 w-4" /> Vuelo
                       </div>
                       <p className="font-medium text-gray-900 pl-6">{reserva.numeroVuelo || "N/A"}</p>
                     </div>
                     
                     <div className="space-y-1">
                       <div className="flex items-center gap-2 text-sm text-gray-600">
                         <Building className="h-4 w-4" /> Hotel / Dirección
                       </div>
                       <p className="font-medium text-gray-900 pl-6 text-sm line-clamp-2" title={reserva.hotel}>
                          {reserva.hotel || "N/A"}
                       </p>
                     </div>

                     <div className="space-y-1">
                       <div className="flex items-center gap-2 text-sm text-gray-600">
                         <Briefcase className="h-4 w-4" /> Equipaje
                       </div>
                       <p className="font-medium text-gray-900 pl-6 text-sm">
                          {reserva.equipajeEspecial ? "Especial" : "Estándar"}
                       </p>
                     </div>

                     <div className="space-y-1">
                       <div className="flex items-center gap-2 text-sm text-gray-600">
                         <User className="h-4 w-4" /> Pasajeros
                       </div>
                       <p className="font-medium text-gray-900 pl-6 text-sm flex gap-2 items-center">
                          {reserva.pasajeros} Personas
                          {reserva.sillaInfantil && <Baby className="h-4 w-4 text-pink-500" title="Silla de bebé requerida" />}
                       </p>
                     </div>
                  </div>

                  {reserva.observaciones && (
                    <div className="mt-6">
                      <p className="text-sm font-medium text-gray-900 mb-2">Observaciones</p>
                      <div className="p-3 bg-yellow-50 text-yellow-800 text-sm rounded-md border border-yellow-100">
                        {reserva.observaciones}
                      </div>
                    </div>
                  )}
               </div>

            </div>
          </div>
        </div>

        {/* Footer Fixed */}
        <div className="p-4 bg-gray-50 border-t flex justify-end gap-3 shrink-0">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          <Button onClick={onEdit}>
            Editar Detalles
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
