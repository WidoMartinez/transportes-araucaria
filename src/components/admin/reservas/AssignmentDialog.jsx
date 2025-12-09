import React, { useState, useEffect } from "react";
import { Button } from "../../ui/button";
import { Label } from "../../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { Checkbox } from "../../ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../ui/dialog";
import { LoaderCircle, Car, User, Info } from "lucide-react";

export function AssignmentDialog({
  isOpen,
  onClose,
  reserva,
  vehiculos = [],
  conductores = [],
  onSave,
  loading = false,
}) {
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [sendNotification, setSendNotification] = useState(true);

  // Initialize selection when dialog opens or reserva changes
  useEffect(() => {
    if (isOpen && reserva) {
      // Logic to pre-select based on current assignment
      // This mimics the logic in AdminReservas.jsx
      
      // 1. Try to find by ID if we had direct relation (not common in current DB schema apparently)
      // 2. Try to match by string in 'vehiculo' or 'conductor' fields
      
      let foundVehicleId = "";
      if (reserva.vehiculo) {
        const patente = reserva.vehiculo.split(" ").pop(); // Extract patente from "Sedan AB1234"
        const found = vehiculos.find(v => v.patente === patente || v.modelo + " " + v.patente === reserva.vehiculo);
        if (found) foundVehicleId = String(found.id);
      }
      
      let foundDriverId = "";
      // Driver logic is tricky as it was stored in observations mostly
      // But if we have a conductor name field:
      if (reserva.conductor) {
        const found = conductores.find(c => c.nombre === reserva.conductor);
        if (found) foundDriverId = String(found.id);
      }

      setSelectedVehicleId(foundVehicleId);
      setSelectedDriverId(foundDriverId);
      setSendNotification(true);
    }
  }, [isOpen, reserva, vehiculos, conductores]);

  const handleSave = () => {
    onSave({
      vehiculoId: selectedVehicleId,
      conductorId: selectedDriverId,
      sendEmail: sendNotification
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Asignar Recurso</DialogTitle>
          <DialogDescription>
            Asigna un vehículo y conductor para la reserva #{reserva?.id}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-md bg-blue-50 p-3 mb-4 flex items-start">
             <Info className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
             <div className="text-sm text-blue-700">
               <p className="font-medium">Detalles del Viaje:</p>
               <p>{reserva?.origen} ➔ {reserva?.destino}</p>
               <p className="text-xs mt-1 opacity-80">{reserva?.fecha} a las {reserva?.hora}</p>
               <p className="text-xs opacity-80">{reserva?.pasajeros} pasajeros</p>
             </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vehiculo">Vehículo</Label>
            <div className="relative">
              <Car className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Select 
                value={selectedVehicleId} 
                onValueChange={setSelectedVehicleId} 
              >
                <SelectTrigger className="pl-9">
                  <SelectValue placeholder="Seleccionar vehículo" />
                </SelectTrigger>
                <SelectContent>
                  {vehiculos.map(v => (
                    <SelectItem key={v.id} value={String(v.id)}>
                      {v.modelo} - {v.patente} ({v.capacidad} pax)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="conductor">Conductor</Label>
             <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Select 
                value={selectedDriverId} 
                onValueChange={setSelectedDriverId}
              >
                <SelectTrigger className="pl-9">
                  <SelectValue placeholder="Seleccionar conductor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin conductor asignado</SelectItem>
                  {conductores.map(c => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Checkbox 
              id="notify" 
              checked={sendNotification} 
              onCheckedChange={setSendNotification}
            />
            <Label htmlFor="notify" className="font-normal text-sm text-muted-foreground">
              Enviar notificación por correo al cliente
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading || !selectedVehicleId}>
             {loading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
             Guardar Asignación
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
