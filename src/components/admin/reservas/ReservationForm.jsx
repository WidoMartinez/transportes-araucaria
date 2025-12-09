import React, { useState, useEffect } from "react";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Textarea } from "../../ui/textarea";
import { Checkbox } from "../../ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { LoaderCircle, Save, X } from "lucide-react";

export function ReservationForm({
  initialData,
  onSubmit,
  onCancel,
  destinosCatalog = [],
  isEditing = false,
  loading = false,
}) {
  // Initialize state with initialData or defaults
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    rut: "",
    origen: "",
    destino: "",
    fecha: "",
    hora: "08:00",
    pasajeros: "1",
    vehiculo: "sedan",
    precio: 0,
    estado: "pendiente",
    estadoPago: "pendiente",
    metodoPago: "",
    referenciaPago: "",
    tipoPago: "",
    montoPagado: "",
    observaciones: "",
    numeroVuelo: "",
    hotel: "",
    equipajeEspecial: "",
    sillaInfantil: false,
    idaVuelta: false,
    fechaRegreso: "",
    horaRegreso: "",
    ...initialData,
  });

  // Handle "Other" locations
  const [origenEsOtro, setOrigenEsOtro] = useState(
    initialData?.origen && 
    !destinosCatalog.includes(initialData.origen) && 
    initialData.origen !== "Aeropuerto La Araucanía"
  );
  
  const [destinoEsOtro, setDestinoEsOtro] = useState(
    initialData?.destino && 
    !destinosCatalog.includes(initialData.destino) && 
    initialData.destino !== "Aeropuerto La Araucanía"
  );

  const [otroOrigen, setOtroOrigen] = useState(origenEsOtro ? initialData.origen : "");
  const [otroDestino, setOtroDestino] = useState(destinoEsOtro ? initialData.destino : "");

  // Update formData when "Other" inputs change
  useEffect(() => {
    if (origenEsOtro) {
      setFormData(prev => ({ ...prev, origen: otroOrigen }));
    }
  }, [otroOrigen, origenEsOtro]);

  useEffect(() => {
    if (destinoEsOtro) {
      setFormData(prev => ({ ...prev, destino: otroDestino }));
    }
  }, [otroDestino, destinoEsOtro]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 py-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Contact Info */}
        <div className="space-y-2">
          <Label htmlFor="nombre">Nombre Cliente *</Label>
          <Input
            id="nombre"
            value={formData.nombre}
            onChange={(e) => handleChange("nombre", e.target.value)}
            required
            placeholder="Nombre completo"
          />
        </div>
        
        <div className="space-y-2">
           <Label htmlFor="email">Email *</Label>
           <Input
             id="email"
             type="email"
             value={formData.email}
             onChange={(e) => handleChange("email", e.target.value)}
             required
             placeholder="usuario@ejemplo.com"
           />
        </div>

        <div className="space-y-2">
           <Label htmlFor="telefono">Teléfono *</Label>
           <Input
             id="telefono"
             value={formData.telefono}
             onChange={(e) => handleChange("telefono", e.target.value)}
             required
             placeholder="+56 9 1234 5678"
           />
        </div>
        
        <div className="space-y-2">
           <Label htmlFor="rut">RUT (Opcional)</Label>
           <Input
             id="rut"
             value={formData.rut || ""}
             onChange={(e) => handleChange("rut", e.target.value)}
             placeholder="12.345.678-9"
           />
        </div>

        {/* Trip Info */}
        <div className="col-span-1 md:col-span-2 border-t pt-4 mt-2">
           <h3 className="font-medium mb-3">Detalles del Viaje</h3>
        </div>

        <div className="space-y-2">
           <Label htmlFor="fecha">Fecha *</Label>
           <Input
             id="fecha"
             type="date"
             value={formData.fecha ? String(formData.fecha).substring(0, 10) : ""}
             onChange={(e) => handleChange("fecha", e.target.value)}
             required
           />
        </div>

        <div className="space-y-2">
           <Label htmlFor="hora">Hora *</Label>
           <Input
             id="hora"
             type="time"
             value={formData.hora}
             onChange={(e) => handleChange("hora", e.target.value)}
             required
           />
        </div>

        <div className="space-y-2">
           <Label htmlFor="origen">Origen *</Label>
           {!origenEsOtro ? (
             <Select 
                value={destinosCatalog.includes(formData.origen) ? formData.origen : (formData.origen === "Aeropuerto La Araucanía" ? "Aeropuerto La Araucanía" : "")} 
                onValueChange={(val) => {
                   if (val === "Otro") {
                     setOrigenEsOtro(true);
                     setOtroOrigen("");
                     handleChange("origen", "");
                   } else {
                     handleChange("origen", val);
                   }
                }}
             >
               <SelectTrigger>
                 <SelectValue placeholder="Seleccionar origen" />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="Aeropuerto La Araucanía">Aeropuerto La Araucanía</SelectItem>
                 {destinosCatalog.map(d => d !== "Aeropuerto La Araucanía" && (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                 ))}
                 <SelectItem value="Otro">Otro...</SelectItem>
               </SelectContent>
             </Select>
           ) : (
             <div className="flex gap-2">
                <Input 
                   value={otroOrigen} 
                   onChange={(e) => setOtroOrigen(e.target.value)}
                   placeholder="Especificar origen"
                   required
                />
                <Button 
                   type="button" 
                   variant="ghost" 
                   size="icon" 
                   onClick={() => {
                     setOrigenEsOtro(false);
                     handleChange("origen", "");
                   }}
                >
                  <X className="h-4 w-4" />
                </Button>
             </div>
           )}
        </div>

        <div className="space-y-2">
           <Label htmlFor="destino">Destino *</Label>
           {!destinoEsOtro ? (
             <Select 
                value={destinosCatalog.includes(formData.destino) ? formData.destino : (formData.destino === "Aeropuerto La Araucanía" ? "Aeropuerto La Araucanía" : "")} 
                onValueChange={(val) => {
                   if (val === "Otro") {
                     setDestinoEsOtro(true);
                     setOtroDestino("");
                     handleChange("destino", "");
                   } else {
                     handleChange("destino", val);
                   }
                }}
             >
               <SelectTrigger>
                 <SelectValue placeholder="Seleccionar destino" />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="Aeropuerto La Araucanía">Aeropuerto La Araucanía</SelectItem>
                 {destinosCatalog.map(d => d !== "Aeropuerto La Araucanía" && (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                 ))}
                 <SelectItem value="Otro">Otro...</SelectItem>
               </SelectContent>
             </Select>
           ) : (
             <div className="flex gap-2">
                <Input 
                   value={otroDestino} 
                   onChange={(e) => setOtroDestino(e.target.value)}
                   placeholder="Especificar destino"
                   required
                />
                <Button 
                   type="button" 
                   variant="ghost" 
                   size="icon" 
                   onClick={() => {
                     setDestinoEsOtro(false);
                     handleChange("destino", "");
                   }}
                >
                  <X className="h-4 w-4" />
                </Button>
             </div>
           )}
        </div>
        
        <div className="space-y-2">
           <Label htmlFor="pasajeros">Pasajeros</Label>
           <Input 
             id="pasajeros"
             type="number" 
             min="1"
             value={formData.pasajeros}
             onChange={(e) => handleChange("pasajeros", e.target.value)}
           />
        </div>

        <div className="flex items-center space-x-2 pt-8">
          <Checkbox 
            id="idaVuelta" 
            checked={formData.idaVuelta}
            onCheckedChange={(checked) => handleChange("idaVuelta", checked)}
          />
          <Label htmlFor="idaVuelta">Ida y Vuelta</Label>
        </div>

        {formData.idaVuelta && (
          <>
             <div className="space-y-2">
               <Label htmlFor="fechaRegreso">Fecha Regreso</Label>
               <Input
                 id="fechaRegreso"
                 type="date"
                 value={formData.fechaRegreso ? String(formData.fechaRegreso).substring(0, 10) : ""}
                 onChange={(e) => handleChange("fechaRegreso", e.target.value)}
               />
             </div>
             <div className="space-y-2">
               <Label htmlFor="horaRegreso">Hora Regreso</Label>
               <Input
                 id="horaRegreso"
                 type="time"
                 value={formData.horaRegreso}
                 onChange={(e) => handleChange("horaRegreso", e.target.value)}
               />
             </div>
          </>
        )}

        {/* Status Info */}
        <div className="col-span-1 md:col-span-2 border-t pt-4 mt-2">
           <h3 className="font-medium mb-3">Estado y Pagos</h3>
        </div>

        <div className="space-y-2">
          <Label htmlFor="estado">Estado Reserva</Label>
          <Select value={formData.estado} onValueChange={(val) => handleChange("estado", val)}>
             <SelectTrigger><SelectValue /></SelectTrigger>
             <SelectContent>
               <SelectItem value="pendiente">Pendiente</SelectItem>
               <SelectItem value="confirmada">Confirmada</SelectItem>
               <SelectItem value="completada">Completada</SelectItem>
               <SelectItem value="cancelada">Cancelada</SelectItem>
             </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="estadoPago">Estado Pago</Label>
          <Select value={formData.estadoPago} onValueChange={(val) => handleChange("estadoPago", val)}>
             <SelectTrigger><SelectValue /></SelectTrigger>
             <SelectContent>
               <SelectItem value="pendiente">Pendiente</SelectItem>
               <SelectItem value="pagado">Pagado</SelectItem>
               <SelectItem value="parcial">Pago Parcial</SelectItem>
               <SelectItem value="reembolsado">Reembolsado</SelectItem>
             </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="precio">Precio Total</Label>
          <div className="relative">
             <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
             <Input 
               id="precio"
               type="number"
               className="pl-7"
               value={formData.precio || formData.totalConDescuento || 0}
               onChange={(e) => handleChange("precio", e.target.value)}
             />
          </div>
        </div>

         {/* Additional Info */}
         <div className="col-span-1 md:col-span-2 border-t pt-4 mt-2">
           <h3 className="font-medium mb-3">Información Adicional</h3>
        </div>

        <div className="space-y-2">
           <Label htmlFor="numeroVuelo">Número de Vuelo</Label>
           <Input
             id="numeroVuelo"
             value={formData.numeroVuelo || ""}
             onChange={(e) => handleChange("numeroVuelo", e.target.value)}
             placeholder="Ej: LA-123"
           />
        </div>

         <div className="space-y-2">
           <Label htmlFor="hotel">Hotel / Dirección</Label>
           <Input
             id="hotel"
             value={formData.hotel || ""}
             onChange={(e) => handleChange("hotel", e.target.value)}
             placeholder="Dirección exacta o Hotel"
           />
        </div>

        <div className="col-span-1 md:col-span-2 space-y-2">
           <Label htmlFor="observaciones">Observaciones</Label>
           <Textarea 
             id="observaciones"
             value={formData.observaciones || ""}
             onChange={(e) => handleChange("observaciones", e.target.value)}
             placeholder="Notas internas o comentarios del cliente..."
           />
        </div>
        
        <div className="col-span-1 md:col-span-2 flex items-center space-x-2">
           <Checkbox 
             id="sillaInfantil"
             checked={formData.sillaInfantil}
             onCheckedChange={(checked) => handleChange("sillaInfantil", checked)}
           />
           <Label htmlFor="sillaInfantil">Silla de Niño</Label>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t sticky bottom-0 bg-white z-10">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? "Guardar Cambios" : "Crear Reserva"}
        </Button>
      </div>
    </form>
  );
}
