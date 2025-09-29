import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";
import {
	Plus,
	Edit,
	Trash2,
	Copy,
	CheckCircle2,
	XCircle,
	Calendar,
	Users,
	Target,
} from "lucide-react";

function AdminCodigos() {
	const [codigos, setCodigos] = useState([]);
	const [loading, setLoading] = useState(true);
	const [showForm, setShowForm] = useState(false);
	const [editingCodigo, setEditingCodigo] = useState(null);
	const [formData, setFormData] = useState({
		codigo: "",
		descripcion: "",
		tipo: "porcentaje",
		valor: 0,
		activo: true,
		limiteUsos: 100,
		fechaVencimiento: "",
		destinosAplicables: [],
		montoMinimo: 0,
		combinable: true,
		exclusivo: false,
	});

	// Cargar códigos desde la API
	const fetchCodigos = async () => {
		try {
			const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";
			const response = await fetch(`${apiUrl}/api/codigos`);
			const data = await response.json();
			setCodigos(data);
		} catch (error) {
			console.error("Error cargando códigos:", error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchCodigos();
	}, []);

	const handleSubmit = async (e) => {
		e.preventDefault();
		try {
			const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";
			const url = editingCodigo
				? `${apiUrl}/api/codigos/${editingCodigo.id}`
				: `${apiUrl}/api/codigos`;
			const method = editingCodigo ? "PUT" : "POST";

			const response = await fetch(url, {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(formData),
			});

			if (response.ok) {
				await fetchCodigos();
				resetForm();
			}
		} catch (error) {
			console.error("Error guardando código:", error);
		}
	};

	const handleEdit = (codigo) => {
		setEditingCodigo(codigo);
		setFormData({
			codigo: codigo.codigo,
			descripcion: codigo.descripcion,
			tipo: codigo.tipo,
			valor: codigo.valor,
			activo: codigo.activo,
			limiteUsos: codigo.limiteUsos,
			fechaVencimiento: codigo.fechaVencimiento,
			destinosAplicables: codigo.destinosAplicables || [],
			montoMinimo: codigo.montoMinimo,
			combinable: codigo.combinable,
			exclusivo: codigo.exclusivo,
		});
		setShowForm(true);
	};

	const handleDelete = async (id) => {
		if (confirm("¿Estás seguro de eliminar este código?")) {
			try {
				const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";
				await fetch(`${apiUrl}/api/codigos/${id}`, { method: "DELETE" });
				await fetchCodigos();
			} catch (error) {
				console.error("Error eliminando código:", error);
			}
		}
	};

	const resetForm = () => {
		setFormData({
			codigo: "",
			descripcion: "",
			tipo: "porcentaje",
			valor: 0,
			activo: true,
			limiteUsos: 100,
			fechaVencimiento: "",
			destinosAplicables: [],
			montoMinimo: 0,
			combinable: true,
			exclusivo: false,
		});
		setEditingCodigo(null);
		setShowForm(false);
	};

	const formatCurrency = (amount) => {
		return new Intl.NumberFormat("es-CL", {
			style: "currency",
			currency: "CLP",
			minimumFractionDigits: 0,
		}).format(amount);
	};

	const getStatusBadge = (codigo) => {
		const now = new Date();
		const vencimiento = new Date(codigo.fechaVencimiento);

		if (!codigo.activo) return <Badge variant="secondary">Inactivo</Badge>;
		if (vencimiento < now) return <Badge variant="destructive">Vencido</Badge>;
		if (codigo.usosActuales >= codigo.limiteUsos)
			return <Badge variant="destructive">Agotado</Badge>;
		return <Badge variant="default">Activo</Badge>;
	};

	if (loading) {
		return <div className="p-4">Cargando códigos...</div>;
	}

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<h2 className="text-2xl font-bold">Gestión de Códigos de Descuento</h2>
				<Button
					onClick={() => setShowForm(true)}
					className="bg-purple-600 hover:bg-purple-700"
				>
					<Plus className="w-4 h-4 mr-2" />
					Nuevo Código
				</Button>
			</div>

			{/* Formulario */}
			{showForm && (
				<Card>
					<CardHeader>
						<CardTitle>
							{editingCodigo ? "Editar Código" : "Nuevo Código de Descuento"}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleSubmit} className="space-y-4">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<Label htmlFor="codigo">Código</Label>
									<Input
										id="codigo"
										value={formData.codigo}
										onChange={(e) =>
											setFormData({
												...formData,
												codigo: e.target.value.toUpperCase(),
											})
										}
										placeholder="VERANO2024"
										required
									/>
								</div>
								<div>
									<Label htmlFor="descripcion">Descripción</Label>
									<Input
										id="descripcion"
										value={formData.descripcion}
										onChange={(e) =>
											setFormData({ ...formData, descripcion: e.target.value })
										}
										placeholder="Descuento de Verano 2024"
										required
									/>
								</div>
								<div>
									<Label htmlFor="tipo">Tipo de Descuento</Label>
									<Select
										value={formData.tipo}
										onValueChange={(value) =>
											setFormData({ ...formData, tipo: value })
										}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="porcentaje">Porcentaje</SelectItem>
											<SelectItem value="monto_fijo">Monto Fijo</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div>
									<Label htmlFor="valor">Valor</Label>
									<Input
										id="valor"
										type="number"
										value={formData.valor}
										onChange={(e) =>
											setFormData({
												...formData,
												valor: parseInt(e.target.value),
											})
										}
										placeholder={
											formData.tipo === "porcentaje" ? "15" : "10000"
										}
										required
									/>
									<p className="text-xs text-slate-500 mt-1">
										{formData.tipo === "porcentaje"
											? "Porcentaje (ej: 15 = 15%)"
											: "Monto en pesos (ej: 10000 = $10.000)"}
									</p>
								</div>
								<div>
									<Label htmlFor="limiteUsos">Límite de Usos</Label>
									<Input
										id="limiteUsos"
										type="number"
										value={formData.limiteUsos}
										onChange={(e) =>
											setFormData({
												...formData,
												limiteUsos: parseInt(e.target.value),
											})
										}
										placeholder="100"
									/>
								</div>
								<div>
									<Label htmlFor="fechaVencimiento">Fecha de Vencimiento</Label>
									<Input
										id="fechaVencimiento"
										type="date"
										value={formData.fechaVencimiento}
										onChange={(e) =>
											setFormData({
												...formData,
												fechaVencimiento: e.target.value,
											})
										}
									/>
								</div>
								<div>
									<Label htmlFor="montoMinimo">Monto Mínimo</Label>
									<Input
										id="montoMinimo"
										type="number"
										value={formData.montoMinimo}
										onChange={(e) =>
											setFormData({
												...formData,
												montoMinimo: parseInt(e.target.value),
											})
										}
										placeholder="20000"
									/>
								</div>
							</div>

							<div className="space-y-3">
								<div className="flex items-center space-x-2">
									<Checkbox
										id="activo"
										checked={formData.activo}
										onCheckedChange={(checked) =>
											setFormData({ ...formData, activo: checked })
										}
									/>
									<Label htmlFor="activo">Activo</Label>
								</div>
								<div className="flex items-center space-x-2">
									<Checkbox
										id="combinable"
										checked={formData.combinable}
										onCheckedChange={(checked) =>
											setFormData({ ...formData, combinable: checked })
										}
									/>
									<Label htmlFor="combinable">
										Combinable con otros descuentos
									</Label>
								</div>
								<div className="flex items-center space-x-2">
									<Checkbox
										id="exclusivo"
										checked={formData.exclusivo}
										onCheckedChange={(checked) =>
											setFormData({ ...formData, exclusivo: checked })
										}
									/>
									<Label htmlFor="exclusivo">
										Exclusivo (reemplaza otros descuentos)
									</Label>
								</div>
							</div>

							<div className="flex gap-2">
								<Button
									type="submit"
									className="bg-purple-600 hover:bg-purple-700"
								>
									{editingCodigo ? "Actualizar" : "Crear"} Código
								</Button>
								<Button type="button" variant="outline" onClick={resetForm}>
									Cancelar
								</Button>
							</div>
						</form>
					</CardContent>
				</Card>
			)}

			{/* Lista de códigos */}
			<div className="grid gap-4">
				{codigos.map((codigo) => (
					<Card key={codigo.id}>
						<CardContent className="p-4">
							<div className="flex justify-between items-start">
								<div className="flex-1">
									<div className="flex items-center gap-2 mb-2">
										<h3 className="font-semibold">{codigo.codigo}</h3>
										{getStatusBadge(codigo)}
									</div>
									<p className="text-sm text-slate-600 mb-2">
										{codigo.descripcion}
									</p>

									<div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
										<div>
											<span className="font-medium">Tipo:</span>{" "}
											{codigo.tipo === "porcentaje"
												? "Porcentaje"
												: "Monto Fijo"}
										</div>
										<div>
											<span className="font-medium">Valor:</span>{" "}
											{codigo.tipo === "porcentaje"
												? `${codigo.valor}%`
												: formatCurrency(codigo.valor)}
										</div>
										<div>
											<span className="font-medium">Usos:</span>{" "}
											{codigo.usosActuales}/{codigo.limiteUsos}
										</div>
										<div>
											<span className="font-medium">Vencimiento:</span>{" "}
											{new Date(codigo.fechaVencimiento).toLocaleDateString(
												"es-CL"
											)}
										</div>
									</div>

									<div className="flex gap-2 mt-3">
										{codigo.combinable && (
											<Badge variant="secondary" className="text-xs">
												Combinable
											</Badge>
										)}
										{codigo.exclusivo && (
											<Badge variant="destructive" className="text-xs">
												Exclusivo
											</Badge>
										)}
									</div>
								</div>

								<div className="flex gap-2">
									<Button
										variant="outline"
										size="sm"
										onClick={() => handleEdit(codigo)}
									>
										<Edit className="w-4 h-4" />
									</Button>
									<Button
										variant="outline"
										size="sm"
										onClick={() => navigator.clipboard.writeText(codigo.codigo)}
									>
										<Copy className="w-4 h-4" />
									</Button>
									<Button
										variant="outline"
										size="sm"
										onClick={() => handleDelete(codigo.id)}
										className="text-red-600 hover:text-red-700"
									>
										<Trash2 className="w-4 h-4" />
									</Button>
								</div>
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}

export default AdminCodigos;
