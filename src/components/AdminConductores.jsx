// src/components/AdminConductores.jsx
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const API_BASE_URL =
	import.meta.env.VITE_API_URL || "https://transportes-araucaria.onrender.com";

const tiposLicencia = [
	{ value: "clase_b", label: "Clase B (Vehículos livianos)" },
	{ value: "clase_a1", label: "Clase A1 (Taxi, colectivo)" },
	{ value: "clase_a2", label: "Clase A2 (Vehículos de transporte)" },
	{ value: "clase_a3", label: "Clase A3 (Transporte de carga)" },
	{ value: "clase_a4", label: "Clase A4 (Vehículos de emergencia)" },
	{ value: "clase_a5", label: "Clase A5 (Transporte de pasajeros)" },
];

function AdminConductores() {
	const [conductores, setConductores] = useState([]);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [editingConductor, setEditingConductor] = useState(null);
	const [nuevoConductor, setNuevoConductor] = useState(null);

	const conductorTemplate = {
		rut: "",
		nombre: "",
		telefono: "",
		email: "",
		licenciaConducir: "",
		tipoLicencia: "clase_b",
		fechaVencimientoLicencia: "",
		activo: true,
		direccion: "",
		calificacionPromedio: 5.0,
		observaciones: "",
	};

	useEffect(() => {
		cargarConductores();
	}, []);

	const cargarConductores = async () => {
		try {
			setLoading(true);
			const response = await fetch(`${API_BASE_URL}/api/conductores`);
			if (!response.ok) throw new Error("Error al cargar conductores");
			const data = await response.json();
			setConductores(data);
		} catch (err) {
			setError("Error al cargar conductores: " + err.message);
		} finally {
			setLoading(false);
		}
	};

	const handleGuardar = async (conductor) => {
		try {
			setSaving(true);
			setError("");
			setSuccess("");

			const url = conductor.id
				? `${API_BASE_URL}/api/conductores/${conductor.id}`
				: `${API_BASE_URL}/api/conductores`;

			const response = await fetch(url, {
				method: conductor.id ? "PUT" : "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(conductor),
			});

			if (!response.ok) throw new Error("Error al guardar conductor");

			setSuccess("Conductor guardado correctamente");
			setEditingConductor(null);
			setNuevoConductor(null);
			await cargarConductores();
		} catch (err) {
			setError("Error al guardar: " + err.message);
		} finally {
			setSaving(false);
		}
	};

	const handleEliminar = async (id) => {
		if (!confirm("¿Está seguro de eliminar este conductor?")) return;

		try {
			setSaving(true);
			const response = await fetch(`${API_BASE_URL}/api/conductores/${id}`, {
				method: "DELETE",
			});
			if (!response.ok) throw new Error("Error al eliminar conductor");
			setSuccess("Conductor eliminado correctamente");
			await cargarConductores();
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

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h2 className="text-2xl font-bold text-white">Gestión de Conductores</h2>
				<Button
					onClick={() => setNuevoConductor(conductorTemplate)}
					disabled={nuevoConductor !== null}
				>
					Añadir Conductor
				</Button>
			</div>

			{error && (
				<div className="rounded-md bg-red-900/50 p-4 text-red-200">
					{error}
				</div>
			)}

			{success && (
				<div className="rounded-md bg-green-900/50 p-4 text-green-200">
					{success}
				</div>
			)}

			{/* Formulario nuevo conductor */}
			{nuevoConductor && (
				<FormularioConductor
					conductor={nuevoConductor}
					onChange={setNuevoConductor}
					onGuardar={() => handleGuardar(nuevoConductor)}
					onCancelar={() => setNuevoConductor(null)}
					saving={saving}
				/>
			)}

			{/* Lista de conductores */}
			<div className="grid gap-4">
				{conductores.map((conductor) => (
					<div
						key={conductor.id}
						className="rounded-lg border border-slate-700 bg-slate-800 p-4"
					>
						{editingConductor?.id === conductor.id ? (
							<FormularioConductor
								conductor={editingConductor}
								onChange={setEditingConductor}
								onGuardar={() => handleGuardar(editingConductor)}
								onCancelar={() => setEditingConductor(null)}
								saving={saving}
							/>
						) : (
							<div className="flex items-start justify-between">
								<div className="flex-1 space-y-2">
									<div className="flex items-center gap-4">
										<h3 className="text-xl font-semibold text-white">
											{conductor.nombre}
										</h3>
										<span
											className={`rounded-full px-3 py-1 text-xs font-medium ${
												conductor.activo
													? "bg-green-900/50 text-green-200"
													: "bg-red-900/50 text-red-200"
											}`}
										>
											{conductor.activo ? "Activo" : "Inactivo"}
										</span>
									</div>
									<div className="grid grid-cols-2 gap-4 text-sm text-slate-300 md:grid-cols-3">
										<div>
											<span className="text-slate-500">RUT:</span>{" "}
											{conductor.rut}
										</div>
										<div>
											<span className="text-slate-500">Teléfono:</span>{" "}
											{conductor.telefono}
										</div>
										<div>
											<span className="text-slate-500">Email:</span>{" "}
											{conductor.email || "-"}
										</div>
										<div>
											<span className="text-slate-500">Licencia:</span>{" "}
											{conductor.licenciaConducir}
										</div>
										<div>
											<span className="text-slate-500">Tipo:</span>{" "}
											{tiposLicencia.find(
												(t) => t.value === conductor.tipoLicencia
											)?.label || conductor.tipoLicencia}
										</div>
										<div>
											<span className="text-slate-500">Vencimiento:</span>{" "}
											{new Date(
												conductor.fechaVencimientoLicencia
											).toLocaleDateString()}
										</div>
										<div>
											<span className="text-slate-500">Calificación:</span>{" "}
											⭐ {conductor.calificacionPromedio || 5.0}
										</div>
									</div>
									{conductor.observaciones && (
										<div className="text-sm text-slate-400">
											<span className="text-slate-500">Observaciones:</span>{" "}
											{conductor.observaciones}
										</div>
									)}
								</div>
								<div className="ml-4 flex gap-2">
									<Button
										size="sm"
										variant="outline"
										onClick={() => setEditingConductor(conductor)}
									>
										Editar
									</Button>
									<Button
										size="sm"
										variant="destructive"
										onClick={() => handleEliminar(conductor.id)}
										disabled={saving}
									>
										Eliminar
									</Button>
								</div>
							</div>
						)}
					</div>
				))}
			</div>

			{conductores.length === 0 && (
				<div className="rounded-lg border border-dashed border-slate-700 p-8 text-center">
					<p className="text-slate-400">
						No hay conductores registrados. Añade el primero usando el botón de
						arriba.
					</p>
				</div>
			)}
		</div>
	);
}

function FormularioConductor({
	conductor,
	onChange,
	onGuardar,
	onCancelar,
	saving,
}) {
	return (
		<div className="space-y-4 rounded-lg border-2 border-blue-500 bg-slate-900 p-4">
			<h3 className="text-lg font-semibold text-white">
				{conductor.id ? "Editar Conductor" : "Nuevo Conductor"}
			</h3>

			<div className="grid gap-4 md:grid-cols-2">
				<div>
					<label className="block text-sm text-slate-300">RUT *</label>
					<input
						type="text"
						value={conductor.rut || ""}
						onChange={(e) => onChange({ ...conductor, rut: e.target.value })}
						className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-white"
						placeholder="12345678-9"
						required
					/>
				</div>

				<div>
					<label className="block text-sm text-slate-300">
						Nombre Completo *
					</label>
					<input
						type="text"
						value={conductor.nombre || ""}
						onChange={(e) => onChange({ ...conductor, nombre: e.target.value })}
						className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-white"
						placeholder="Juan Pérez González"
						required
					/>
				</div>

				<div>
					<label className="block text-sm text-slate-300">Teléfono *</label>
					<input
						type="tel"
						value={conductor.telefono || ""}
						onChange={(e) =>
							onChange({ ...conductor, telefono: e.target.value })
						}
						className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-white"
						placeholder="+56 9 1234 5678"
						required
					/>
				</div>

				<div>
					<label className="block text-sm text-slate-300">Email</label>
					<input
						type="email"
						value={conductor.email || ""}
						onChange={(e) => onChange({ ...conductor, email: e.target.value })}
						className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-white"
						placeholder="conductor@ejemplo.cl"
					/>
				</div>

				<div>
					<label className="block text-sm text-slate-300">
						Número de Licencia *
					</label>
					<input
						type="text"
						value={conductor.licenciaConducir || ""}
						onChange={(e) =>
							onChange({ ...conductor, licenciaConducir: e.target.value })
						}
						className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-white"
						placeholder="12345678"
						required
					/>
				</div>

				<div>
					<label className="block text-sm text-slate-300">
						Tipo de Licencia *
					</label>
					<select
						value={conductor.tipoLicencia || "clase_b"}
						onChange={(e) =>
							onChange({ ...conductor, tipoLicencia: e.target.value })
						}
						className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-white"
						required
					>
						{tiposLicencia.map((tipo) => (
							<option key={tipo.value} value={tipo.value}>
								{tipo.label}
							</option>
						))}
					</select>
				</div>

				<div>
					<label className="block text-sm text-slate-300">
						Vencimiento Licencia *
					</label>
					<input
						type="date"
						value={conductor.fechaVencimientoLicencia || ""}
						onChange={(e) =>
							onChange({
								...conductor,
								fechaVencimientoLicencia: e.target.value,
							})
						}
						className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-white"
						required
					/>
				</div>

				<div>
					<label className="block text-sm text-slate-300">
						Calificación (0-5)
					</label>
					<input
						type="number"
						value={conductor.calificacionPromedio || 5.0}
						onChange={(e) =>
							onChange({
								...conductor,
								calificacionPromedio: parseFloat(e.target.value),
							})
						}
						className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-white"
						min="0"
						max="5"
						step="0.1"
					/>
				</div>
			</div>

			<div>
				<label className="block text-sm text-slate-300">Dirección</label>
				<input
					type="text"
					value={conductor.direccion || ""}
					onChange={(e) =>
						onChange({ ...conductor, direccion: e.target.value })
					}
					className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-white"
					placeholder="Calle, número, comuna"
				/>
			</div>

			<div>
				<label className="block text-sm text-slate-300">Observaciones</label>
				<textarea
					value={conductor.observaciones || ""}
					onChange={(e) =>
						onChange({ ...conductor, observaciones: e.target.value })
					}
					className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-white"
					rows="3"
					placeholder="Notas adicionales sobre el conductor..."
				/>
			</div>

			<div className="flex gap-4">
				<label className="flex items-center gap-2 text-sm text-slate-300">
					<input
						type="checkbox"
						checked={conductor.activo || false}
						onChange={(e) =>
							onChange({ ...conductor, activo: e.target.checked })
						}
						className="rounded border-slate-600"
					/>
					Activo
				</label>
			</div>

			<div className="flex gap-2">
				<Button
					onClick={onGuardar}
					disabled={
						saving ||
						!conductor.rut ||
						!conductor.nombre ||
						!conductor.telefono ||
						!conductor.licenciaConducir ||
						!conductor.fechaVencimientoLicencia
					}
				>
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

export default AdminConductores;
