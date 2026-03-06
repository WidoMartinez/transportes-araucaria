import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../ui/select";
import { Button } from "../ui/button";
import { Search, Calendar, RefreshCw } from "lucide-react";

export function FiltrosReservas({
	searchTerm,
	setSearchTerm,
	rangoFecha,
	handleRangoFechaChange,
	fechaDesde,
	setFechaDesde,
	fechaHasta,
	setFechaHasta,
	filtroInteligente,
	setFiltroInteligente,
	estadoFiltro,
	setEstadoFiltro,
	estadoPagoFiltro,
	setEstadoPagoFiltro,
	reservasFiltradasLength,
	totalReservas,
	setCurrentPage,
}) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Filtros de Búsqueda</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="flex flex-col md:flex-row gap-4 mb-6">
					<div className="flex-1">
						<Label className="mb-2 block">Buscar</Label>
						<div className="relative">
							<Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="Nombre, email, teléfono, ID..."
								className="pl-8 h-12 md:h-10 text-base"
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
							/>
						</div>
					</div>
					<div className="w-full md:w-[180px]">
						<Label className="mb-2 block">Rango Fechas</Label>
						<Select value={rangoFecha} onValueChange={handleRangoFechaChange}>
							<SelectTrigger className="h-12 md:h-10 text-base">
								<SelectValue placeholder="Seleccionar rango" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="todos">Todo el tiempo</SelectItem>
								<SelectItem value="hoy">Hoy</SelectItem>
								<SelectItem value="ayer">Ayer</SelectItem>
								<SelectItem value="semana">Últimos 7 días</SelectItem>
								<SelectItem value="quincena">Últimos 15 días</SelectItem>
								<SelectItem value="mes">Este Mes</SelectItem>
								<SelectItem value="personalizado">Personalizado</SelectItem>
							</SelectContent>
						</Select>
					</div>
					{rangoFecha === "personalizado" && (
						<>
							<div className="w-full md:w-[150px]">
								<Label className="mb-2 block">Fecha Desde</Label>
								<div className="relative">
									<Input
										type="date"
										value={fechaDesde}
										onChange={(e) => setFechaDesde(e.target.value)}
										className="pl-8 h-12 md:h-10 text-base"
									/>
									<Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
								</div>
							</div>
							<div className="w-full md:w-[150px]">
								<Label className="mb-2 block">Fecha Hasta</Label>
								<div className="relative">
									<Input
										type="date"
										value={fechaHasta}
										onChange={(e) => setFechaHasta(e.target.value)}
										className="pl-8 h-12 md:h-10 text-base"
									/>
									<Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
								</div>
							</div>
						</>
					)}
					<div className="w-full md:w-[200px]">
						<Label className="mb-2 block">Filtros Inteligentes</Label>
						<Select
							value={filtroInteligente}
							onValueChange={setFiltroInteligente}
						>
							<SelectTrigger className="h-12 md:h-10 text-base">
								<SelectValue placeholder="Aplicar filtro..." />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="todos">Ninguno</SelectItem>
								<SelectItem value="sin_asignacion">
									⚠️ Sin Asignación
								</SelectItem>
								<SelectItem value="incompletas">
									📋 Faltan Detalles
								</SelectItem>
								<SelectItem value="archivadas">
									📦 Ver Archivadas
								</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className="w-full md:w-[150px]">
						<Label className="mb-2 block">Estado</Label>
						<Select value={estadoFiltro} onValueChange={setEstadoFiltro}>
							<SelectTrigger className="h-12 md:h-10 text-base">
								<SelectValue placeholder="Todos" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="todos">Todos</SelectItem>
								<SelectItem value="pendiente">Pendiente</SelectItem>
								<SelectItem value="confirmada">Confirmada</SelectItem>
								<SelectItem value="completada">Completada</SelectItem>
								<SelectItem value="cancelada">Cancelada</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className="w-full md:w-[150px]">
						<Label className="mb-2 block">Estado de Pago</Label>
						<Select
							value={estadoPagoFiltro}
							onValueChange={setEstadoPagoFiltro}
						>
							<SelectTrigger className="h-12 md:h-10 text-base">
								<SelectValue placeholder="Todos" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="todos">Todos</SelectItem>
								<SelectItem value="pendiente">Pendiente</SelectItem>
								<SelectItem value="pagado">Pagado</SelectItem>
								<SelectItem value="parcial">Parcial</SelectItem>
								<SelectItem value="reembolsado">Reembolsado</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>
				<div className="mt-4 flex justify-between items-center">
					<p className="text-sm text-muted-foreground">
						Mostrando {reservasFiltradasLength} de {totalReservas} reservas
					</p>
					<Button
						variant="outline"
						size="sm"
						onClick={() => {
							setSearchTerm("");
							setEstadoFiltro("todos");
							setEstadoPagoFiltro("todos");
							setFechaDesde("");
							setFechaHasta("");
							setCurrentPage(1);
						}}
					>
						<RefreshCw className="w-4 h-4 mr-2" />
						Limpiar Filtros
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
