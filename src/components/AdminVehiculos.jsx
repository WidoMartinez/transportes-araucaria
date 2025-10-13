// src/components/AdminVehiculos.jsx
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const API_BASE_URL =
	import.meta.env.VITE_API_URL || "https://transportes-araucaria.onrender.com";

const tiposVehiculo = [
	{ value: "auto", label: "Auto" },
	{ value: "van", label: "Van" },
	{ value: "minibus", label: "Minibus" },
];

function AdminVehiculos() {
	const [vehiculos, setVehiculos] = useState([]);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [editingVehiculo, setEditingVehiculo] = useState(null);
	const [nuevoVehiculo, setNuevoVehiculo] = useState(null);

	const vehiculoTemplate = {
		placa: "",
		tipo: "auto",
		marca: "",
		modelo: "",
		ano: new Date().getFullYear(),
		capacidad: 4,
		color: "",
		activo: true,
		enMantenimiento: false,
		kilometraje: 0,
		observaciones: "",
	};

	useEffect(() => {
		cargarVehiculos();
	}, []);

	const cargarVehiculos = async () => {
		try {
			setLoading(true);
			const response = await fetch(`${API_BASE_URL}/api/vehiculos`);
			if (!response.ok) throw new Error("Error al cargar vehículos");
			const data = await response.json();
			setVehiculos(data);
		} catch (err) {
			setError("Error al cargar vehículos: " + err.message);
		} finally {
			setLoading(false);
		}
	};

	const handleGuardar = async (vehiculo) => {
		try {
			setSaving(true);
			setError("");
			setSuccess("");

			const url = vehiculo.id
				? `${API_BASE_URL}/api/vehiculos/${vehiculo.id}`
				: `${API_BASE_URL}/api/vehiculos`;

			const response = await fetch(url, {
				method: vehiculo.id ? "PUT" : "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(vehiculo),
			});

			if (!response.ok) throw new Error("Error al guardar vehículo");

			setSuccess("Vehículo guardado correctamente");
			setEditingVehiculo(null);
			setNuevoVehiculo(null);
			await cargarVehiculos();
		} catch (err) {
			setError("Error al guardar: " + err.message);
		} finally {
			setSaving(false);
		}
	};

	const handleEliminar = async (id) => {
		if (!confirm("¿Está seguro de eliminar este vehículo?")) return;

		try {
			setSaving(true);
			const response = await fetch(`${API_BASE_URL}/api/vehiculos/${id}`, {
				method: "DELETE",
			});
			if (!response.ok) throw new Error("Error al eliminar vehículo");
			setSuccess("Vehículo eliminado correctamente");
			await cargarVehiculos();
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
				<h2 className="text-2xl font-bold text-white">Gestión de Vehículos</h2>
				<Button
					onClick={() => setNuevoVehiculo(vehiculoTemplate)}
					disabled={nuevoVehiculo !== null}
				>
					Añadir Vehículo
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

			{/* Formulario nuevo vehículo */}
			{nuevoVehiculo && (
				<FormularioVehiculo
					vehiculo={nuevoVehiculo}
					onChange={setNuevoVehiculo}
					onGuardar={() => handleGuardar(nuevoVehiculo)}
					onCancelar={() => setNuevoVehiculo(null)}
					saving={saving}
				/>
			)}

			{/* Lista de vehículos */}
			<div className="grid gap-4">
				{vehiculos.map((vehiculo) => (
					<div
						key={vehiculo.id}
						className="rounded-lg border border-slate-700 bg-slate-800 p-4"
					>
						{editingVehiculo?.id === vehiculo.id ? (
							<FormularioVehiculo
								vehiculo={editingVehiculo}
								onChange={setEditingVehiculo}
								onGuardar={() => handleGuardar(editingVehiculo)}
								onCancelar={() => setEditingVehiculo(null)}
								saving={saving}
							/>
						) : (
							<div className="flex items-start justify-between">
								<div className="flex-1 space-y-2">
									<div className="flex items-center gap-4">
										<h3 className="text-xl font-semibold text-white">
											{vehiculo.placa}
										</h3>
										<span
											className={`rounded-full px-3 py-1 text-xs font-medium ${
												vehiculo.activo
													? "bg-green-900/50 text-green-200"
													: "bg-red-900/50 text-red-200"
											}`}
										>
											{vehiculo.activo ? "Activo" : "Inactivo"}
										</span>
										{vehiculo.enMantenimiento && (
											<span className="rounded-full bg-yellow-900/50 px-3 py-1 text-xs font-medium text-yellow-200">
												En Mantenimiento
											</span>
										)}
									</div>
									<div className="grid grid-cols-2 gap-4 text-sm text-slate-300 md:grid-cols-4">
										<div>
											<span className="text-slate-500">Tipo:</span>{" "}
											{tiposVehiculo.find((t) => t.value === vehiculo.tipo)
												?.label || vehiculo.tipo}
										</div>
										<div>
											<span className="text-slate-500">Marca:</span>{" "}
											{vehiculo.marca || "-"}
										</div>
										<div>
											<span className="text-slate-500">Modelo:</span>{" "}
											{vehiculo.modelo || "-"}
										</div>
										<div>
											<span className="text-slate-500">Año:</span>{" "}
											{vehiculo.ano || "-"}
										</div>
										<div>
											<span className="text-slate-500">Capacidad:</span>{" "}
											{vehiculo.capacidad} pasajeros
										</div>
										<div>
											<span className="text-slate-500">Color:</span>{" "}
											{vehiculo.color || "-"}
										</div>
										<div>
											<span className="text-slate-500">Kilometraje:</span>{" "}
											{vehiculo.kilometraje?.toLocaleString() || 0} km
										</div>
									</div>
									{vehiculo.observaciones && (
										<div className="text-sm text-slate-400">
											<span className="text-slate-500">Observaciones:</span>{" "}
											{vehiculo.observaciones}
										</div>
									)}
								</div>
								<div className="ml-4 flex gap-2">
									<Button
										size="sm"
										variant="outline"
										onClick={() => setEditingVehiculo(vehiculo)}
									>
										Editar
									</Button>
									<Button
										size="sm"
										variant="destructive"
										onClick={() => handleEliminar(vehiculo.id)}
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

			{vehiculos.length === 0 && (
				<div className="rounded-lg border border-dashed border-slate-700 p-8 text-center">
					<p className="text-slate-400">
						No hay vehículos registrados. Añade el primero usando el botón de
						arriba.
					</p>
				</div>
			)}
		</div>
	);
}

function FormularioVehiculo({ vehiculo, onChange, onGuardar, onCancelar, saving }) {
	return (
		<div className="space-y-4 rounded-lg border-2 border-blue-500 bg-slate-900 p-4">
			<h3 className="text-lg font-semibold text-white">
				{vehiculo.id ? "Editar Vehículo" : "Nuevo Vehículo"}
			</h3>

			<div className="grid gap-4 md:grid-cols-2">
				<div>
					<label className="block text-sm text-slate-300">
						Placa / Patente *
					</label>
					<input
						type="text"
						value={vehiculo.placa || ""}
						onChange={(e) =>
							onChange({ ...vehiculo, placa: e.target.value.toUpperCase() })
						}
						className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-white"
						placeholder="BBGG12"
						required
					/>
				</div>

				<div>
					<label className="block text-sm text-slate-300">Tipo *</label>
					<select
						value={vehiculo.tipo || "auto"}
						onChange={(e) => {
							const capacidad =
								e.target.value === "auto"
									? 4
									: e.target.value === "van"
									? 7
									: 12;
							onChange({ ...vehiculo, tipo: e.target.value, capacidad });
						}}
						className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-white"
					>
						{tiposVehiculo.map((tipo) => (
							<option key={tipo.value} value={tipo.value}>
								{tipo.label}
							</option>
						))}
					</select>
				</div>

				<div>
					<label className="block text-sm text-slate-300">Marca</label>
					<input
						type="text"
						value={vehiculo.marca || ""}
						onChange={(e) => onChange({ ...vehiculo, marca: e.target.value })}
						className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-white"
						placeholder="Toyota, Mercedes, etc."
					/>
				</div>

				<div>
					<label className="block text-sm text-slate-300">Modelo</label>
					<input
						type="text"
						value={vehiculo.modelo || ""}
						onChange={(e) => onChange({ ...vehiculo, modelo: e.target.value })}
						className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-white"
						placeholder="Corolla, Sprinter, etc."
					/>
				</div>

				<div>
					<label className="block text-sm text-slate-300">Año</label>
					<input
						type="number"
						value={vehiculo.ano || ""}
						onChange={(e) =>
							onChange({ ...vehiculo, ano: parseInt(e.target.value) })
						}
						className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-white"
						min="1990"
						max={new Date().getFullYear() + 1}
					/>
				</div>

				<div>
					<label className="block text-sm text-slate-300">
						Capacidad (pasajeros) *
					</label>
					<input
						type="number"
						value={vehiculo.capacidad || 4}
						onChange={(e) =>
							onChange({ ...vehiculo, capacidad: parseInt(e.target.value) })
						}
						className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-white"
						min="1"
						max="20"
						required
					/>
				</div>

				<div>
					<label className="block text-sm text-slate-300">Color</label>
					<input
						type="text"
						value={vehiculo.color || ""}
						onChange={(e) => onChange({ ...vehiculo, color: e.target.value })}
						className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-white"
						placeholder="Blanco, Negro, etc."
					/>
				</div>

				<div>
					<label className="block text-sm text-slate-300">Kilometraje</label>
					<input
						type="number"
						value={vehiculo.kilometraje || 0}
						onChange={(e) =>
							onChange({ ...vehiculo, kilometraje: parseInt(e.target.value) })
						}
						className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-white"
						min="0"
					/>
				</div>
			</div>

			<div>
				<label className="block text-sm text-slate-300">Observaciones</label>
				<textarea
					value={vehiculo.observaciones || ""}
					onChange={(e) =>
						onChange({ ...vehiculo, observaciones: e.target.value })
					}
					className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-white"
					rows="3"
					placeholder="Notas adicionales sobre el vehículo..."
				/>
			</div>

			<div className="flex gap-4">
				<label className="flex items-center gap-2 text-sm text-slate-300">
					<input
						type="checkbox"
						checked={vehiculo.activo || false}
						onChange={(e) =>
							onChange({ ...vehiculo, activo: e.target.checked })
						}
						className="rounded border-slate-600"
					/>
					Activo
				</label>

				<label className="flex items-center gap-2 text-sm text-slate-300">
					<input
						type="checkbox"
						checked={vehiculo.enMantenimiento || false}
						onChange={(e) =>
							onChange({ ...vehiculo, enMantenimiento: e.target.checked })
						}
						className="rounded border-slate-600"
					/>
					En Mantenimiento
				</label>
			</div>

			<div className="flex gap-2">
				<Button onClick={onGuardar} disabled={saving || !vehiculo.placa}>
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

export default AdminVehiculos;
