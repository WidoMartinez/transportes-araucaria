import React from "react";
import {
  Search,
  RefreshCw,
  Plus,
  Filter,
  Download,
  Trash2,
  CheckCircle2
} from "lucide-react";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";

export function ReservationFilters({
  searchTerm,
  onSearchChange,
  estadoFiltro,
  onEstadoChange,
  estadoPagoFiltro,
  onEstadoPagoChange,
  fechaDesde,
  onFechaDesdeChange,
  fechaHasta,
  onFechaHastaChange,
  onRefresh,
  onNewReservation,
  onExport,
  selectedCount = 0,
  onBulkDelete,
  onBulkUpdateStatus
}) {
  return (
    <div className="space-y-4 mb-6">
      {/* Search and Main Actions */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, email, teléfono o ID..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 bg-white"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto justify-end">
          <Button
            variant="outline"
            onClick={onRefresh}
            title="Recargar datos"
            className="bg-white"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>

          <Button 
            onClick={onNewReservation} 
            className="bg-primary hover:bg-primary/90 text-white gap-2"
          >
            <Plus className="h-4 w-4" />
            Nueva Reserva
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-end md:items-center bg-white p-4 rounded-lg border shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 w-full">
          {/* Status Filter */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground ml-1">Estado Reserva</label>
            <Select value={estadoFiltro} onValueChange={onEstadoChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Estado Reserva" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="confirmada">Confirmada</SelectItem>
                <SelectItem value="completada">Completada</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Payment Status Filter */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground ml-1">Estado Pago</label>
            <Select value={estadoPagoFiltro} onValueChange={onEstadoPagoChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Estado Pago" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los pagos</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="pagado">Pagado</SelectItem>
                <SelectItem value="parcial">Pago Parcial</SelectItem>
                <SelectItem value="reembolsado">Reembolsado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date From */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground ml-1">Desde</label>
            <Input
              type="date"
              value={fechaDesde}
              onChange={(e) => onFechaDesdeChange(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Date To */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground ml-1">Hasta</label>
            <Input
              type="date"
              value={fechaHasta}
              onChange={(e) => onFechaHastaChange(e.target.value)}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Bulk Actions & Selection Info */}
      {selectedCount > 0 && (
        <div className="flex items-center gap-4 bg-primary/5 p-3 rounded-lg border border-primary/20 animate-in fade-in slide-in-from-top-2">
          <span className="text-sm font-medium text-primary ml-2">
            {selectedCount} reserva{selectedCount !== 1 ? 's' : ''} seleccionada{selectedCount !== 1 ? 's' : ''}
          </span>
          <div className="h-4 w-px bg-primary/20" />
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
              className="bg-white hover:bg-gray-50 text-xs h-8"
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Exportar
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="bg-white hover:bg-gray-50 text-xs h-8">
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                  Cambiar Estado
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>Marcar como...</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onBulkUpdateStatus("confirmada")}>
                  Confirmada
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onBulkUpdateStatus("completada")}>
                  Completada
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onBulkUpdateStatus("cancelada")} className="text-red-600">
                  Cancelada
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="outline"
              size="sm"
              onClick={onBulkDelete}
              className="bg-white hover:bg-red-50 text-red-600 border-red-200 text-xs h-8 ml-auto"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              Eliminar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
