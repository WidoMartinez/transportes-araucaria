// src/components/AdminFestivos.jsx
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, Plus, Pencil, Trash2 } from "lucide-react";

const API_BASE_URL =
	import.meta.env.VITE_API_URL || "https://transportes-araucaria.onrender.com";

const ADMIN_TOKEN = import.meta.env.VITE_ADMIN_TOKEN || "admin-secret-token";

const tiposFestivo = [
	{ value: "feriado_nacional", label: "Feriado Nacional" },
	{ value: "feriado_regional", label: "Feriado Regional" },
	{ value: "fecha_especial", label: "Fecha Especial" },
];

function AdminFestivos() {
	const [festivos, setFestivos] = useState([]);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [editingFestivo, setEditingFestivo] = useState(null);
	const [nuevoFestivo, setNuevoFestivo] = useState(null);

	const festivoTemplate = {
		fecha: "",
		nombre: "",
		tipo: "feriado_nacional",
		recurrente: false,
		porcentajeRecargo: null,
		activo: true,
		descripcion: "",
	};

	useEffect(() => {
		cargarFestivos();
	}, []);

	const cargarFestivos = async () => {
		try {
			setLoading(true);
			const response = await fetch(`${API_BASE_URL}/api/festivos`);

			if (!response.ok) throw new Error("Error al cargar festivos");

			const data = await response.json();
			setFestivos(data);
		} catch (err) {
			setError("Error al cargar festivos: " + err.message);
		} finally {
			setLoading(false);
		}
	};

	const handleGuardar = async (festivo) => {
		try {
			setSaving(true);
			setError("");
			setSuccess("");

			const url = festivo.id
				? `${API_BASE_URL}/api/festivos/${festivo.id}`
				: `${API_BASE_URL}/api/festivos`;

			const response = await fetch(url, {
				method: festivo.id ? "PUT" : "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${ADMIN_TOKEN}`,
				},
				body: JSON.stringify(festivo),
			});

			if (!response.ok) throw new Error("Error al guardar festivo");

			setSuccess("Festivo guardado correctamente");
			setEditingFestivo(null);
			setNuevoFestivo(null);
			await cargarFestivos();
		} catch (err) {
			setError("Error al guardar: " + err.message);
		} finally {
			setSaving(false);
		}
	};

	const handleEliminar = async (id) => {
		if (!confirm("¿Está seguro de eliminar este festivo?")) return;

		try {
			setSaving(true);
			const response = await fetch(`${API_BASE_URL}/api/festivos/${id}`, {
				method: "DELETE",
				headers: {
					Authorization: `Bearer ${ADMIN_TOKEN}`,
				},
			});
			if (!response.ok) throw new Error("Error al eliminar festivo");
			setSuccess("Festivo eliminado correctamente");
			await cargarFestivos();
		} catch (err) {
			setError("Error al eliminar: " + err.message);
		} finally {
			setSaving(false);
		}
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center py-8">
				<Loader2 className="h-8 w-8 animate-spin text-blue-500" />
			</div>
		);
	}

	// Agrupar festivos por año
	const festivosPorAno = festivos.reduce((acc, festivo) => {
		const ano = new Date(festivo.fecha).getFullYear();
		if (!acc[ano]) acc[ano] = [];
		acc[ano].push(festivo);
		return acc;
	}, {});

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold text-white">
						Gestión de Festivos y Fechas Especiales
					</h2>
					<p className="mt-1 text-sm text-slate-400">
						Administra festivos nacionales, regionales y fechas especiales con
						recargos personalizados
					</p>
				</div>
				<Button
					onClick={() => setNuevoFestivo(festivoTemplate)}
					disabled={nuevoFestivo !== null}
				>
					<Plus className="mr-2 h-4 w-4" />
					Agregar Festivo
				</Button>
			</div>

			{error && (
				<div className="rounded-md bg-red-900/50 p-4 text-red-200">{error}</div>
			)}

			{success && (
				<div className="rounded-md bg-green-900/50 p-4 text-green-200">
					{success}
				</div>
			)}

			{/* Formulario nuevo festivo */}
			{nuevoFestivo && (
				<FormularioFestivo
					festivo={nuevoFestivo}
					onChange={setNuevoFestivo}
					onGuardar={() => handleGuardar(nuevoFestivo)}
					onCancelar={() => setNuevoFestivo(null)}
					saving={saving}
				/>
			)}

			{/* Festivos agrupados por año */}
			{Object.keys(festivosPorAno)
				.sort((a, b) => b - a)
				.map((ano) => {
					const festivosAno = festivosPorAno[ano];

					return (
						<div
							key={ano}
							className="rounded-lg border border-slate-700 bg-slate-900/50 p-6"
						>
							<div className="mb-4 flex items-center gap-3">
								<Calendar className="h-6 w-6 text-blue-400" />
								<h3 className="text-lg font-semibold text-white">Año {ano}</h3>
								<Badge variant="secondary">{festivosAno.length} festivos</Badge>
							</div>

							<div className="space-y-3">
								{festivosAno.map((festivo) => (
									<div key={festivo.id}>
										{editingFestivo?.id === festivo.id ? (
											<FormularioFestivo
												festivo={editingFestivo}
												onChange={setEditingFestivo}
												onGuardar={() => handleGuardar(editingFestivo)}
												onCancelar={() => setEditingFestivo(null)}
												saving={saving}
											/>
										) : (
											<TarjetaFestivo
												festivo={festivo}
												onEditar={() => setEditingFestivo(festivo)}
												onEliminar={() => handleEliminar(festivo.id)}
												saving={saving}
											/>
										)}
									</div>
								))}
							</div>
						</div>
					);
				})}

			{festivos.length === 0 && (
				<div className="rounded-lg border border-slate-700 bg-slate-900/50 p-8 text-center">
					<Calendar className="mx-auto h-12 w-12 text-slate-600" />
					<p className="mt-4 text-slate-400">
						No hay festivos registrados. Agrega el primer festivo para comenzar.
					</p>
				</div>
			)}
		</div>
	);
}

function TarjetaFestivo({ festivo, onEditar, onEliminar, saving }) {
	const formatearFecha = (fecha) => {
		const d = new Date(fecha + "T00:00:00");
		return d.toLocaleDateString("es-CL", {
			day: "2-digit",
			month: "long",
			year: "numeric",
		});
	};

	const getTipoLabel = (tipo) => {
		const found = tiposFestivo.find((t) => t.value === tipo);
		return found ? found.label : tipo;
	};

	return (
		<div className="flex items-start justify-between rounded-lg border border-slate-700 bg-slate-800 p-4">
			<div className="flex-1">
				<div className="flex items-center gap-3">
					<h4 className="font-semibold text-white">{festivo.nombre}</h4>
					<Badge variant="outline">{getTipoLabel(festivo.tipo)}</Badge>
					{festivo.recurrente && (
						<Badge variant="secondary">Recurrente</Badge>
					)}
					{festivo.porcentajeRecargo && (
						<Badge className="bg-orange-900/50 text-orange-200">
							+{festivo.porcentajeRecargo}%
						</Badge>
					)}
					<Badge
						variant={festivo.activo ? "default" : "secondary"}
						className={
							festivo.activo ? "bg-green-900/50 text-green-200" : ""
						}
					>
						{festivo.activo ? "Activo" : "Inactivo"}
					</Badge>
				</div>

				<p className="mt-2 text-sm text-slate-400">
					{formatearFecha(festivo.fecha)}
				</p>

				{festivo.descripcion && (
					<p className="mt-2 text-sm text-slate-500">{festivo.descripcion}</p>
				)}
			</div>

			<div className="ml-4 flex gap-2">
				<Button size="sm" variant="outline" onClick={onEditar}>
					<Pencil className="h-4 w-4" />
				</Button>
				<Button
					size="sm"
					variant="destructive"
					onClick={onEliminar}
					disabled={saving}
				>
					<Trash2 className="h-4 w-4" />
				</Button>
			</div>
		</div>
	);
}

function FormularioFestivo({ festivo, onChange, onGuardar, onCancelar, saving }) {
	return (
		<div className="space-y-4 rounded-lg border-2 border-blue-500 bg-slate-900 p-4">
			<h3 className="text-lg font-semibold text-white">
				{festivo.id ? "Editar Festivo" : "Nuevo Festivo"}
			</h3>

			<div className="grid gap-4 md:grid-cols-2">
				<div>
					<label className="block text-sm text-slate-300">Fecha *</label>
					<input
						type="date"
						value={festivo.fecha || ""}
						onChange={(e) => onChange({ ...festivo, fecha: e.target.value })}
						className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-white"
						required
					/>
				</div>

				<div>
					<label className="block text-sm text-slate-300">Nombre *</label>
					<input
						type="text"
						value={festivo.nombre || ""}
						onChange={(e) => onChange({ ...festivo, nombre: e.target.value })}
						className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-white"
						placeholder="Ej: Navidad"
						required
					/>
				</div>

				<div>
					<label className="block text-sm text-slate-300">Tipo *</label>
					<select
						value={festivo.tipo || "feriado_nacional"}
						onChange={(e) => onChange({ ...festivo, tipo: e.target.value })}
						className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-white"
					>
						{tiposFestivo.map((tipo) => (
							<option key={tipo.value} value={tipo.value}>
								{tipo.label}
							</option>
						))}
					</select>
				</div>

				<div>
					<label className="block text-sm text-slate-300">
						Porcentaje Recargo (%)
					</label>
					<input
						type="number"
						value={festivo.porcentajeRecargo || ""}
						onChange={(e) =>
							onChange({
								...festivo,
								porcentajeRecargo: e.target.value
									? parseFloat(e.target.value)
									: null,
							})
						}
						className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-white"
						step="0.1"
						placeholder="Ej: 15"
					/>
					<p className="mt-1 text-xs text-slate-500">
						Dejar vacío para usar configuración de día de semana
					</p>
				</div>
			</div>

			<div>
				<label className="block text-sm text-slate-300">Descripción</label>
				<textarea
					value={festivo.descripcion || ""}
					onChange={(e) =>
						onChange({ ...festivo, descripcion: e.target.value })
					}
					className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-white"
					rows="2"
					placeholder="Descripción opcional del festivo..."
				/>
			</div>

			<div className="flex gap-4">
				<label className="flex items-center gap-2 text-sm text-slate-300">
					<input
						type="checkbox"
						checked={festivo.recurrente || false}
						onChange={(e) =>
							onChange({ ...festivo, recurrente: e.target.checked })
						}
						className="rounded border-slate-600"
					/>
					Recurrente (se repite cada año)
				</label>

				<label className="flex items-center gap-2 text-sm text-slate-300">
					<input
						type="checkbox"
						checked={festivo.activo || false}
						onChange={(e) => onChange({ ...festivo, activo: e.target.checked })}
						className="rounded border-slate-600"
					/>
					Activo
				</label>
			</div>

			<div className="flex gap-2">
				<Button onClick={onGuardar} disabled={saving || !festivo.nombre || !festivo.fecha}>
					{saving ? (
						<>
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							Guardando...
						</>
					) : (
						"Guardar"
					)}
				</Button>
				<Button variant="outline" onClick={onCancelar} disabled={saving}>
					Cancelar
				</Button>
			</div>
		</div>
	);
}

export default AdminFestivos;
