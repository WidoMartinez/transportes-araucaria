import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Checkbox } from "../../ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";
import {
  Eye,
  Edit,
  MoreHorizontal,
  Car,
  UserCheck,
  CreditCard,
  MapPin,
  Calendar,
  Clock,
  User
} from "lucide-react";
import { LoaderCircle } from "lucide-react";

// Helper for currency format
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
  }).format(amount);
};

// Helper for date format
const formatDate = (dateString) => {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString("es-CL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  } catch {
    return dateString;
  }
};

export function ReservationTable({
  reservas,
  loading,
  selectedReservas = [],
  onSelectReserva,
  onSelectAll,
  onView,
  onEdit,
  onAsignar,
  columnasVisibles, // Object like { id: true, cliente: true, ... }
  pagination, // { currentPage, totalPages, totalItems, onPageChange }
}) {
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4 text-muted-foreground bg-white rounded-lg border">
        <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
        <p>Cargando reservas...</p>
      </div>
    );
  }

  if (reservas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4 text-muted-foreground bg-white rounded-lg border">
        <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
          <Calendar className="h-6 w-6 text-gray-400" />
        </div>
        <div className="text-center">
          <p className="font-medium text-gray-900">No se encontraron reservas</p>
          <p className="text-sm">Intenta ajustar los filtros o crear una nueva.</p>
        </div>
      </div>
    );
  }

  // Get status badge styles
  const getEstadoBadge = (estado) => {
    const styles = {
      pendiente: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200",
      confirmada: "bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200",
      completada: "bg-green-100 text-green-800 hover:bg-green-200 border-green-200",
      cancelada: "bg-red-100 text-red-800 hover:bg-red-200 border-red-200",
    };
    const defaultStyle = "bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-200";
    
    return (
      <Badge variant="outline" className={`${styles[estado?.toLowerCase()] || defaultStyle} capitalize`}>
        {estado}
      </Badge>
    );
  };

  const getPagoBadge = (estado) => {
    const styles = {
      pendiente: "bg-orange-50 text-orange-700 border-orange-200",
      pagado: "bg-green-50 text-green-700 border-green-200",
      parcial: "bg-yellow-50 text-yellow-700 border-yellow-200",
      reembolsado: "bg-purple-50 text-purple-700 border-purple-200",
    };
    
    return (
      <Badge variant="outline" className={`${styles[estado?.toLowerCase()] || "bg-gray-50 text-gray-700 border-gray-200"} capitalize px-2 py-0.5 text-[10px]`}>
        {estado || "pend."}
      </Badge>
    );
  };

  const allSelected = reservas.length > 0 && selectedReservas.length === reservas.length;

  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="w-[40px] px-4">
                  <Checkbox 
                    checked={allSelected}
                    onCheckedChange={(checked) => onSelectAll(checked)}
                  />
                </TableHead>
                
                {columnasVisibles.id && <TableHead className="w-[80px]">ID</TableHead>}
                
                {columnasVisibles.cliente && (
                  <TableHead>
                    <div className="flex items-center gap-2">
                       <User className="h-3.5 w-3.5" />
                       Cliente
                    </div>
                  </TableHead>
                )}
                
                {columnasVisibles.fechaHora && (
                   <TableHead>
                     <div className="flex items-center gap-2">
                       <Calendar className="h-3.5 w-3.5" />
                       Fecha Viaje
                     </div>
                   </TableHead>
                )}
                 
                {columnasVisibles.ruta && (
                  <TableHead>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5" />
                      Ruta
                    </div>
                  </TableHead>
                )}
                
                {columnasVisibles.pasajeros && <TableHead>Pax</TableHead>}
                
                {columnasVisibles.total && <TableHead className="text-right">Total</TableHead>}
                
                {columnasVisibles.estado && <TableHead>Estado</TableHead>}
                
                {columnasVisibles.pago && <TableHead>Pago</TableHead>}
                
                {columnasVisibles.asignacion && <TableHead>Asignación</TableHead>}
                
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reservas.map((reserva) => {
                const isSelected = selectedReservas.includes(reserva.id);
                const hasAssign = reserva.vehiculo || reserva.conductor;
                
                return (
                  <TableRow key={reserva.id} className={isSelected ? "bg-primary/5" : ""}>
                    <TableCell className="px-4">
                      <Checkbox 
                        checked={isSelected}
                        onCheckedChange={() => onSelectReserva(reserva.id)}
                      />
                    </TableCell>
                    
                    {columnasVisibles.id && (
                      <TableCell className="font-medium text-gray-600">
                        #{reserva.id}
                      </TableCell>
                    )}
                    
                    {columnasVisibles.cliente && (
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm text-gray-900">{reserva.nombre}</span>
                          <span className="text-xs text-muted-foreground">{reserva.email}</span>
                          <span className="text-xs text-muted-foreground">{reserva.telefono}</span>
                          {reserva.esCliente && (
                            <Badge variant="secondary" className="w-fit text-[10px] px-1.5 py-0 h-4 mt-1 bg-blue-50 text-blue-700 border-blue-100">
                              Frecuente
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    )}
                    
                    {columnasVisibles.fechaHora && (
                      <TableCell>
                         <div className="flex flex-col">
                           <span className="text-sm font-medium">{formatDate(reserva.fecha)}</span>
                           <div className="flex items-center text-xs text-muted-foreground">
                             <Clock className="h-3 w-3 mr-1" />
                             {reserva.hora}
                           </div>
                         </div>
                      </TableCell>
                    )}
                    
                    {columnasVisibles.ruta && (
                      <TableCell>
                         <div className="flex flex-col max-w-[200px]">
                           <div className="flex items-start gap-1.5 text-sm">
                             <div className="mt-1 h-1.5 w-1.5 rounded-full bg-green-500 shrink-0" />
                             <span className="truncate" title={reserva.origen}>{reserva.origen}</span>
                           </div>
                           <div className="ml-[3px] border-l border-dashed border-gray-300 h-2" />
                           <div className="flex items-start gap-1.5 text-sm">
                             <div className="mt-1 h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
                             <span className="truncate" title={reserva.destino}>{reserva.destino}</span>
                           </div>
                           {reserva.idaVuelta && (
                             <Badge variant="outline" className="w-fit mt-1 text-[10px] bg-purple-50 text-purple-700 border-none">
                               Ida y Vuelta
                             </Badge>
                           )}
                         </div>
                      </TableCell>
                    )}
                    
                    {columnasVisibles.pasajeros && (
                      <TableCell className="text-center">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-xs font-medium">
                          {reserva.pasajeros}
                        </span>
                      </TableCell>
                    )}
                    
                    {columnasVisibles.total && (
                      <TableCell className="text-right font-medium">
                        {formatCurrency(reserva.totalConDescuento || reserva.precio || 0)}
                      </TableCell>
                    )}
                    
                    {columnasVisibles.estado && (
                      <TableCell>
                        {getEstadoBadge(reserva.estado)}
                      </TableCell>
                    )}
                    
                    {columnasVisibles.pago && (
                      <TableCell>
                        <div className="flex flex-col gap-1 items-start">
                          {getPagoBadge(reserva.estadoPago)}
                          <span className="text-[10px] text-muted-foreground">
                            {reserva.metodoPago || "-"}
                          </span>
                        </div>
                      </TableCell>
                    )}
                    
                    {columnasVisibles.asignacion && (
                      <TableCell>
                         {hasAssign ? (
                           <div className="flex flex-col gap-1">
                             {reserva.vehiculo && (
                               <div className="flex items-center gap-1.5 text-xs">
                                 <Car className="h-3 w-3 text-gray-500" />
                                 <span className="truncate max-w-[120px]" title={reserva.vehiculo}>
                                   {reserva.vehiculo}
                                 </span>
                               </div>
                             )}
                             {reserva.conductor && (
                               <div className="flex items-center gap-1.5 text-xs">
                                 <UserCheck className="h-3 w-3 text-gray-500" />
                                 <span className="truncate max-w-[120px]" title={reserva.conductor}>
                                   {reserva.conductor}
                                 </span>
                               </div>
                             )}
                           </div>
                         ) : (
                           <Button 
                             variant="ghost" 
                             size="sm" 
                             onClick={() => onAsignar(reserva)}
                             className="h-7 text-xs text-muted-foreground hover:text-primary"
                           >
                             <div className="flex items-center gap-1">
                               <PlusIcon className="h-3 w-3" />
                               Asignar
                             </div>
                           </Button>
                         )}
                      </TableCell>
                    )}
                    
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Abrir menú</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => onView(reserva)}>
                            <Eye className="mr-2 h-4 w-4" /> Ver detalles
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEdit(reserva)}>
                            <Edit className="mr-2 h-4 w-4" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onAsignar(reserva)}>
                            <Car className="mr-2 h-4 w-4" /> Asignar móvil
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {/* Add other actions like payment, delete, etc. if needed */}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-4 border-t bg-gray-50">
          <div className="text-sm text-muted-foreground">
             Mostrando página <span className="font-medium">{pagination.currentPage}</span> de <span className="font-medium">{pagination.totalPages}</span>
             <span className="ml-2 hidden sm:inline">({pagination.totalItems} reservas totales)</span>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage <= 1}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage >= pagination.totalPages}
            >
              Siguiente
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Simple Plus icon component to avoid import error if lucide-react doesn't export PlusIcon explicitly (it exports Plus)
function PlusIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}
