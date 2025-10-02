import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "./ui/table";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";
import { Input } from "./ui/input";
import {
	Calendar,
	Download,
	Filter,
	Search,
	TrendingUp,
	Users,
	DollarSign,
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export default function HistorialCodigos() {
	const [historial, setHistorial] = useState([]);
	const [estadisticas, setEstadisticas] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	// Filtros
	const [filtros, setFiltros] = useState({
		codigo: "",
		fechaDesde: "",
		fechaHasta: "",
		estado: "",
		ordenar: "fechaUso",
		direccion: "DESC",
	});

	// Cargar historial
	const cargarHistorial = async () => {
		try {
			setLoading(true);
			const params = new URLSearchParams(filtros);
			const response = await fetch(
				`${API_BASE_URL}/api/codigos/historial?${params}`
			);

			if (!response.ok) throw new Error("Error al cargar historial");

			const data = await response.json();
			setHistorial(data.historial);
			setEstadisticas(data.estadisticas);
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	// Exportar a CSV
	const exportarCSV = () => {
		const headers = [
			"Código",
			"Usuario",
			"Email",
			"Teléfono",
			"Fecha Uso",
			"Monto",
			"Estado",
			"Estado Pago",
		];

		const csvContent = [
			headers.join(","),
			...historial.map((item) =>
				[
					item.codigo,
					`"${item.nombre}"`,
					item.email,
					item.telefono,
					item.fechaUso,
					item.monto,
					item.estado,
					item.estadoPago,
				].join(",")
			),
		].join("\n");

		const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
		const link = document.createElement("a");
		const url = URL.createObjectURL(blob);
		link.setAttribute("href", url);
		link.setAttribute(
			"download",
			`historial_codigos_${new Date().toISOString().split("T")[0]}.csv`
		);
		link.style.visibility = "hidden";
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	// Aplicar filtros
	const aplicarFiltros = () => {
		cargarHistorial();
	};

	// Limpiar filtros
	const limpiarFiltros = () => {
		setFiltros({
			codigo: "",
			fechaDesde: "",
			fechaHasta: "",
			estado: "",
			ordenar: "fechaUso",
			direccion: "DESC",
		});
	};

	useEffect(() => {
		cargarHistorial();
	}, []);

	const formatearFecha = (fecha) => {
		return new Date(fecha).toLocaleDateString("es-CL", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const formatearMonto = (monto) => {
		return new Intl.NumberFormat("es-CL", {
			style: "currency",
			currency: "CLP",
		}).format(monto);
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex justify-between items-center">
				<h1 className="text-3xl font-bold">Historial de Códigos</h1>
				<div className="flex space-x-2">
					<Button onClick={cargarHistorial} variant="outline">
						<Calendar className="w-4 h-4 mr-2" />
						Actualizar
					</Button>
					<Button onClick={exportarCSV}>
						<Download className="w-4 h-4 mr-2" />
						Exportar CSV
					</Button>
				</div>
			</div>

			{/* Estadísticas */}
			{estadisticas && (
				<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
					<Card>
						<CardContent className="p-4">
							<div className="flex items-center space-x-2">
								<Users className="w-5 h-5 text-blue-500" />
								<div>
									<p className="text-sm font-medium">Total Usos</p>
									<p className="text-2xl font-bold">{estadisticas.totalUsos}</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardContent className="p-4">
							<div className="flex items-center space-x-2">
								<TrendingUp className="w-5 h-5 text-green-500" />
								<div>
									<p className="text-sm font-medium">Usos Únicos</p>
									<p className="text-2xl font-bold">
										{estadisticas.usuariosUnicos}
									</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardContent className="p-4">
							<div className="flex items-center space-x-2">
								<DollarSign className="w-5 h-5 text-purple-500" />
								<div>
									<p className="text-sm font-medium">Total Descuentos</p>
									<p className="text-2xl font-bold">
										{formatearMonto(estadisticas.totalDescuentos)}
									</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardContent className="p-4">
							<div className="flex items-center space-x-2">
								<Calendar className="w-5 h-5 text-orange-500" />
								<div>
									<p className="text-sm font-medium">Usos Hoy</p>
									<p className="text-2xl font-bold">{estadisticas.usosHoy}</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			)}

			{/* Filtros */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center space-x-2">
						<Filter className="w-5 h-5" />
						<span>Filtros</span>
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
						<div>
							<label className="text-sm font-medium">Código</label>
							<Input
								placeholder="Buscar código..."
								value={filtros.codigo}
								onChange={(e) =>
									setFiltros((prev) => ({ ...prev, codigo: e.target.value }))
								}
							/>
						</div>

						<div>
							<label className="text-sm font-medium">Fecha Desde</label>
							<Input
								type="date"
								value={filtros.fechaDesde}
								onChange={(e) =>
									setFiltros((prev) => ({
										...prev,
										fechaDesde: e.target.value,
									}))
								}
							/>
						</div>

						<div>
							<label className="text-sm font-medium">Fecha Hasta</label>
							<Input
								type="date"
								value={filtros.fechaHasta}
								onChange={(e) =>
									setFiltros((prev) => ({
										...prev,
										fechaHasta: e.target.value,
									}))
								}
							/>
						</div>

						<div>
							<label className="text-sm font-medium">Estado</label>
							<Select
								value={filtros.estado}
								onValueChange={(value) =>
									setFiltros((prev) => ({ ...prev, estado: value }))
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="Todos" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="">Todos</SelectItem>
									<SelectItem value="confirmada">Confirmada</SelectItem>
									<SelectItem value="pendiente">Pendiente</SelectItem>
									<SelectItem value="cancelada">Cancelada</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div>
							<label className="text-sm font-medium">Ordenar</label>
							<Select
								value={filtros.ordenar}
								onValueChange={(value) =>
									setFiltros((prev) => ({ ...prev, ordenar: value }))
								}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="fechaUso">Fecha Uso</SelectItem>
									<SelectItem value="codigo">Código</SelectItem>
									<SelectItem value="monto">Monto</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div>
							<label className="text-sm font-medium">Dirección</label>
							<Select
								value={filtros.direccion}
								onValueChange={(value) =>
									setFiltros((prev) => ({ ...prev, direccion: value }))
								}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="DESC">Descendente</SelectItem>
									<SelectItem value="ASC">Ascendente</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					<div className="flex space-x-2 mt-4">
						<Button onClick={aplicarFiltros}>
							<Search className="w-4 h-4 mr-2" />
							Aplicar Filtros
						</Button>
						<Button variant="outline" onClick={limpiarFiltros}>
							Limpiar
						</Button>
					</div>
				</CardContent>
			</Card>

			{/* Tabla de Historial */}
			<Card>
				<CardHeader>
					<CardTitle>Historial de Usos</CardTitle>
				</CardHeader>
				<CardContent>
					{loading ? (
						<div className="text-center py-8">Cargando historial...</div>
					) : error ? (
						<div className="text-center py-8 text-red-500">{error}</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Código</TableHead>
									<TableHead>Usuario</TableHead>
									<TableHead>Email</TableHead>
									<TableHead>Teléfono</TableHead>
									<TableHead>Fecha Uso</TableHead>
									<TableHead>Monto</TableHead>
									<TableHead>Estado</TableHead>
									<TableHead>Estado Pago</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{historial.map((item, index) => (
									<TableRow key={index}>
										<TableCell className="font-mono">{item.codigo}</TableCell>
										<TableCell>{item.nombre}</TableCell>
										<TableCell>{item.email}</TableCell>
										<TableCell>{item.telefono}</TableCell>
										<TableCell>{formatearFecha(item.fechaUso)}</TableCell>
										<TableCell>{formatearMonto(item.monto)}</TableCell>
										<TableCell>
											<Badge
												variant={
													item.estado === "confirmada"
														? "default"
														: item.estado === "pendiente"
														? "secondary"
														: "destructive"
												}
											>
												{item.estado}
											</Badge>
										</TableCell>
										<TableCell>
											<Badge
												variant={
													item.estadoPago === "pagado"
														? "default"
														: item.estadoPago === "pendiente"
														? "secondary"
														: "destructive"
												}
											>
												{item.estadoPago}
											</Badge>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
