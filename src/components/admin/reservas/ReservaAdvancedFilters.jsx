import React, { useState } from "react";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../ui/select";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "../../ui/popover";
import { Badge } from "../../ui/badge";
import {
	Filter,
	X,
	Calendar,
	CheckCircle2,
	XCircle,
	AlertCircle,
	DollarSign,
	Car,
	User,
} from "lucide-react";
import { Separator } from "../../ui/separator";

/**
 * Componente de filtros avanzados para reservas
 * Permite filtrar por múltiples criterios simultáneamente
 */

export function ReservaAdvancedFilters({
	filters = {},
	onFiltersChange,
	conductores = [],
	vehiculos = [],
}) {
	const [localFilters, setLocalFilters] = useState(filters);
	const [isOpen, setIsOpen] = useState(false);

	// Valores por defecto para filtros
	const DEFAULT_FILTER_VALUES = {
		estado: "todos",
		estadoPago: "todos",
		conductorId: "",
		vehiculoId: "",
		tieneGastos: undefined,
		rangoFecha: "todos",
	};

	// Contar filtros activos de forma declarativa
	const getActiveFiltersCount = () => {
		return Object.keys(DEFAULT_FILTER_VALUES).reduce((count, key) => {
			const currentValue = localFilters[key];
			const defaultValue = DEFAULT_FILTER_VALUES[key];
			// Contar si el valor difiere del valor por defecto
			return currentValue !== defaultValue ? count + 1 : count;
		}, 0);
	};

	const handleFilterChange = (key, value) => {
		const newFilters = { ...localFilters, [key]: value };
		setLocalFilters(newFilters);
	};

	const handleApply = () => {
		if (onFiltersChange) {
			onFiltersChange(localFilters);
		}
		setIsOpen(false);
	};

	const handleReset = () => {
		setLocalFilters(DEFAULT_FILTER_VALUES);
		if (onFiltersChange) {
			onFiltersChange(DEFAULT_FILTER_VALUES);
		}
	};

	const activeFiltersCount = getActiveFiltersCount();

	return (
		<Popover open={isOpen} onOpenChange={setIsOpen}>
			<PopoverTrigger asChild>
				<Button variant="outline" size="sm" className="relative">
					<Filter className="w-4 h-4 mr-2" />
					Filtros Avanzados
					{activeFiltersCount > 0 && (
						<Badge
							variant="default"
							className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center"
						>
							{activeFiltersCount}
						</Badge>
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-80" align="end">
				<div className="space-y-4">
					{/* Header */}
					<div className="flex items-center justify-between">
						<h4 className="font-semibold text-sm">Filtros Avanzados</h4>
						{activeFiltersCount > 0 && (
							<Button
								variant="ghost"
								size="sm"
								onClick={handleReset}
								className="h-8 px-2 text-xs"
							>
								<X className="w-3 h-3 mr-1" />
								Limpiar
							</Button>
						)}
					</div>

					<Separator />

					{/* Filtro de Estado de Reserva */}
					<div className="space-y-2">
						<Label className="text-xs font-medium flex items-center gap-2">
							<CheckCircle2 className="w-4 h-4" />
							Estado de Reserva
						</Label>
						<Select
							value={localFilters.estado || "todos"}
							onValueChange={(value) => handleFilterChange("estado", value)}
						>
							<SelectTrigger className="h-9">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="todos">Todos los estados</SelectItem>
								<SelectItem value="confirmada">
									<div className="flex items-center gap-2">
										<CheckCircle2 className="w-4 h-4 text-green-600" />
										Confirmadas
									</div>
								</SelectItem>
								<SelectItem value="pendiente">
									<div className="flex items-center gap-2">
										<AlertCircle className="w-4 h-4 text-yellow-600" />
										Pendientes
									</div>
								</SelectItem>
								<SelectItem value="cancelada">
									<div className="flex items-center gap-2">
										<XCircle className="w-4 h-4 text-red-600" />
										Canceladas
									</div>
								</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{/* Filtro de Estado de Pago */}
					<div className="space-y-2">
						<Label className="text-xs font-medium flex items-center gap-2">
							<DollarSign className="w-4 h-4" />
							Estado de Pago
						</Label>
						<Select
							value={localFilters.estadoPago || "todos"}
							onValueChange={(value) => handleFilterChange("estadoPago", value)}
						>
							<SelectTrigger className="h-9">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="todos">Todos los estados</SelectItem>
								<SelectItem value="pagado">Pagadas</SelectItem>
								<SelectItem value="pendiente">Pendientes de pago</SelectItem>
								<SelectItem value="parcial">Pago parcial</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{/* Filtro de Rango de Fecha */}
					<div className="space-y-2">
						<Label className="text-xs font-medium flex items-center gap-2">
							<Calendar className="w-4 h-4" />
							Rango de Fecha
						</Label>
						<Select
							value={localFilters.rangoFecha || "todos"}
							onValueChange={(value) => handleFilterChange("rangoFecha", value)}
						>
							<SelectTrigger className="h-9">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="todos">Todas las fechas</SelectItem>
								<SelectItem value="hoy">Hoy</SelectItem>
								<SelectItem value="ayer">Ayer</SelectItem>
								<SelectItem value="semana">Últimos 7 días</SelectItem>
								<SelectItem value="quincena">Últimos 15 días</SelectItem>
								<SelectItem value="mes">Este mes</SelectItem>
								<SelectItem value="personalizado">Personalizado</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{/* Filtro de Conductor */}
					{conductores.length > 0 && (
						<div className="space-y-2">
							<Label className="text-xs font-medium flex items-center gap-2">
								<User className="w-4 h-4" />
								Conductor
							</Label>
							<Select
								value={localFilters.conductorId || ""}
								onValueChange={(value) => handleFilterChange("conductorId", value)}
							>
								<SelectTrigger className="h-9">
									<SelectValue placeholder="Todos los conductores" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="">Todos los conductores</SelectItem>
									{conductores.map((conductor) => (
										<SelectItem key={conductor.id} value={conductor.id.toString()}>
											{conductor.nombre}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					)}

					{/* Filtro de Vehículo */}
					{vehiculos.length > 0 && (
						<div className="space-y-2">
							<Label className="text-xs font-medium flex items-center gap-2">
								<Car className="w-4 h-4" />
								Vehículo
							</Label>
							<Select
								value={localFilters.vehiculoId || ""}
								onValueChange={(value) => handleFilterChange("vehiculoId", value)}
							>
								<SelectTrigger className="h-9">
									<SelectValue placeholder="Todos los vehículos" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="">Todos los vehículos</SelectItem>
									{vehiculos.map((vehiculo) => (
										<SelectItem key={vehiculo.id} value={vehiculo.id.toString()}>
											{vehiculo.patente} - {vehiculo.tipo}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					)}

					{/* Filtro de Gastos */}
					<div className="space-y-2">
						<Label className="text-xs font-medium">Con Gastos</Label>
						<Select
							value={
								localFilters.tieneGastos === undefined
									? "todos"
									: localFilters.tieneGastos
									? "si"
									: "no"
							}
							onValueChange={(value) =>
								handleFilterChange(
									"tieneGastos",
									value === "todos" ? undefined : value === "si"
								)
							}
						>
							<SelectTrigger className="h-9">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="todos">Todas</SelectItem>
								<SelectItem value="si">Con gastos registrados</SelectItem>
								<SelectItem value="no">Sin gastos</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<Separator />

					{/* Botones de Acción */}
					<div className="flex gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setIsOpen(false)}
							className="flex-1"
						>
							Cancelar
						</Button>
						<Button size="sm" onClick={handleApply} className="flex-1">
							Aplicar Filtros
						</Button>
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
}

export default ReservaAdvancedFilters;
