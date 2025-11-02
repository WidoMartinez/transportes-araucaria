// src/components/AdminTarifaDinamica.jsx
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, TrendingUp, TrendingDown, Calendar, Clock } from "lucide-react";

const API_BASE_URL =
	import.meta.env.VITE_API_URL || "https://transportes-araucaria.onrender.com";

const tiposConfig = [
	{ value: "anticipacion", label: "Por Anticipación", icon: Calendar },
	{ value: "dia_semana", label: "Por Día de Semana", icon: Calendar },
	{ value: "horario", label: "Por Horario", icon: Clock },
	{ value: "descuento_retorno", label: "Descuento Retorno", icon: TrendingDown },
];

const diasSemana = [
	{ value: 0, label: "Domingo" },
	{ value: 1, label: "Lunes" },
	{ value: 2, label: "Martes" },
	{ value: 3, label: "Miércoles" },
	{ value: 4, label: "Jueves" },
	{ value: 5, label: "Viernes" },
	{ value: 6, label: "Sábado" },
];

function AdminTarifaDinamica() {
	const [configuraciones, setConfiguraciones] = useState([]);
	const [destinos, setDestinos] = useState([]);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [editingConfig, setEditingConfig] = useState(null);
	const [nuevaConfig, setNuevaConfig] = useState(null);

	const configTemplate = {
		nombre: "",
		tipo: "anticipacion",
		diasMinimos: 0,
		diasMaximos: null,
		diasSemana: [],
		horaInicio: "",
		horaFin: "",
		porcentajeAjuste: 0,
		activo: true,
		prioridad: 5,
		destinosExcluidos: [],
		descripcion: "",
		tiempoEsperaMaximo: 240,
	};

	useEffect(() => {
		cargarDatos();
	}, []);

	const cargarDatos = async () => {
		try {
			setLoading(true);
			const [configResp, preciosResp] = await Promise.all([
				fetch(`${API_BASE_URL}/api/tarifa-dinamica`),
				fetch(`${API_BASE_URL}/pricing`),
			]);

			if (!configResp.ok) throw new Error("Error al cargar configuraciones");
			if (!preciosResp.ok) throw new Error("Error al cargar destinos");

			const configs = await configResp.json();
			const precios = await preciosResp.json();

			setConfiguraciones(configs);
			setDestinos(precios.destinos || []);
		} catch (err) {
			setError("Error al cargar datos: " + err.message);
		} finally {
			setLoading(false);
		}
	};

	const handleGuardar = async (config) => {
		try {
			setSaving(true);
			setError("");
			setSuccess("");

			const url = config.id
				? `${API_BASE_URL}/api/tarifa-dinamica/${config.id}`
				: `${API_BASE_URL}/api/tarifa-dinamica`;

			const response = await fetch(url, {
				method: config.id ? "PUT" : "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(config),
			});

			if (!response.ok) throw new Error("Error al guardar configuración");

			setSuccess("Configuración guardada correctamente");
			setEditingConfig(null);
			setNuevaConfig(null);
			await cargarDatos();
		} catch (err) {
			setError("Error al guardar: " + err.message);
		} finally {
			setSaving(false);
		}
	};

	const handleEliminar = async (id) => {
		if (!confirm("¿Está seguro de eliminar esta configuración?")) return;

		try {
			setSaving(true);
			const response = await fetch(`${API_BASE_URL}/api/tarifa-dinamica/${id}`, {
				method: "DELETE",
			});
			if (!response.ok) throw new Error("Error al eliminar configuración");
			setSuccess("Configuración eliminada correctamente");
			await cargarDatos();
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

	// Agrupar configuraciones por tipo
	const configsPorTipo = configuraciones.reduce((acc, config) => {
		if (!acc[config.tipo]) acc[config.tipo] = [];
		acc[config.tipo].push(config);
		return acc;
	}, {});

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold text-white">
						Configuración de Tarifa Dinámica
					</h2>
					<p className="mt-1 text-sm text-slate-400">
						Gestiona recargos y descuentos automáticos según anticipación, día y
						horario
					</p>
				</div>
				<Button
					onClick={() => setNuevaConfig(configTemplate)}
					disabled={nuevaConfig !== null}
				>
					Añadir Regla
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

			{/* Formulario nueva configuración */}
			{nuevaConfig && (
				<FormularioConfig
					config={nuevaConfig}
					onChange={setNuevaConfig}
					onGuardar={() => handleGuardar(nuevaConfig)}
					onCancelar={() => setNuevaConfig(null)}
					saving={saving}
					destinos={destinos}
				/>
			)}

			{/* Configuraciones agrupadas por tipo */}
			{tiposConfig.map((tipo) => {
				const configs = configsPorTipo[tipo.value] || [];
				const Icon = tipo.icon;

				return (
					<div
						key={tipo.value}
						className="rounded-lg border border-slate-700 bg-slate-900/50 p-6"
					>
						<div className="mb-4 flex items-center gap-3">
							<Icon className="h-6 w-6 text-blue-400" />
							<h3 className="text-lg font-semibold text-white">{tipo.label}</h3>
							<span className="rounded-full bg-slate-700 px-2 py-1 text-xs text-slate-300">
								{configs.length} reglas
							</span>
						</div>

						{configs.length === 0 ? (
							<p className="text-sm text-slate-500">
								No hay reglas de este tipo configuradas
							</p>
						) : (
							<div className="space-y-3">
								{configs.map((config) => (
									<div key={config.id}>
										{editingConfig?.id === config.id ? (
											<FormularioConfig
												config={editingConfig}
												onChange={setEditingConfig}
												onGuardar={() => handleGuardar(editingConfig)}
												onCancelar={() => setEditingConfig(null)}
												saving={saving}
												destinos={destinos}
											/>
										) : (
											<TarjetaConfig
												config={config}
												onEditar={() => setEditingConfig(config)}
												onEliminar={() => handleEliminar(config.id)}
												saving={saving}
											/>
										)}
									</div>
								))}
							</div>
						)}
					</div>
				);
			})}
		</div>
	);
}

function TarjetaConfig({ config, onEditar, onEliminar, saving }) {
	const esRecargo = config.porcentajeAjuste > 0;

	return (
		<div className="flex items-start justify-between rounded-lg border border-slate-700 bg-slate-800 p-4">
			<div className="flex-1">
				<div className="flex items-center gap-3">
					<h4 className="font-semibold text-white">{config.nombre}</h4>
					<span
						className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
							esRecargo
								? "bg-red-900/50 text-red-200"
								: "bg-green-900/50 text-green-200"
						}`}
					>
						{esRecargo ? (
							<TrendingUp className="h-3 w-3" />
						) : (
							<TrendingDown className="h-3 w-3" />
						)}
						{esRecargo ? "+" : ""}
						{config.porcentajeAjuste}%
					</span>
					<span
						className={`rounded-full px-2 py-1 text-xs ${
							config.activo
								? "bg-green-900/50 text-green-200"
								: "bg-gray-700 text-gray-400"
						}`}
					>
						{config.activo ? "Activo" : "Inactivo"}
					</span>
				</div>

				{config.descripcion && (
					<p className="mt-2 text-sm text-slate-400">{config.descripcion}</p>
				)}

				<div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-500">
					{config.tipo === "anticipacion" && (
						<span>
							{config.diasMinimos} - {config.diasMaximos || "∞"} días
						</span>
					)}
					{config.tipo === "dia_semana" && config.diasSemana && (
						<span>
							Días:{" "}
							{config.diasSemana
								.map((d) => diasSemana.find((ds) => ds.value === d)?.label)
								.join(", ")}
						</span>
					)}
					{config.tipo === "horario" && (
						<span>
							{config.horaInicio?.substring(0, 5)} -{" "}
							{config.horaFin?.substring(0, 5)}
						</span>
					)}
					<span>Prioridad: {config.prioridad}</span>
					{config.destinosExcluidos && config.destinosExcluidos.length > 0 && (
						<span>
							Excluye {config.destinosExcluidos.length} destino(s)
						</span>
					)}
				</div>
			</div>

			<div className="ml-4 flex gap-2">
				<Button size="sm" variant="outline" onClick={onEditar}>
					Editar
				</Button>
				<Button size="sm" variant="destructive" onClick={onEliminar} disabled={saving}>
					Eliminar
				</Button>
			</div>
		</div>
	);
}

function FormularioConfig({ config, onChange, onGuardar, onCancelar, saving, destinos }) {
	return (
		<div className="space-y-4 rounded-lg border-2 border-blue-500 bg-slate-900 p-4">
			<h3 className="text-lg font-semibold text-white">
				{config.id ? "Editar Configuración" : "Nueva Configuración"}
			</h3>

			<div className="grid gap-4 md:grid-cols-2">
				<div>
					<label className="block text-sm text-slate-300">Nombre *</label>
					<input
						type="text"
						value={config.nombre || ""}
						onChange={(e) => onChange({ ...config, nombre: e.target.value })}
						className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-white"
						placeholder="Ej: Recargo mismo día"
						required
					/>
				</div>

				<div>
					<label className="block text-sm text-slate-300">Tipo *</label>
					<select
						value={config.tipo || "anticipacion"}
						onChange={(e) => onChange({ ...config, tipo: e.target.value })}
						className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-white"
					>
						{tiposConfig.map((tipo) => (
							<option key={tipo.value} value={tipo.value}>
								{tipo.label}
							</option>
						))}
					</select>
				</div>

				<div>
					<label className="block text-sm text-slate-300">
						Ajuste (%) * {config.porcentajeAjuste > 0 ? "(Recargo)" : "(Descuento)"}
					</label>
					<input
						type="number"
						value={config.porcentajeAjuste || 0}
						onChange={(e) =>
							onChange({
								...config,
								porcentajeAjuste: parseFloat(e.target.value),
							})
						}
						className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-white"
						step="0.1"
						placeholder="+25 para recargo, -15 para descuento"
						required
					/>
				</div>

				<div>
					<label className="block text-sm text-slate-300">Prioridad</label>
					<input
						type="number"
						value={config.prioridad || 5}
						onChange={(e) =>
							onChange({ ...config, prioridad: parseInt(e.target.value) })
						}
						className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-white"
						min="0"
						max="10"
					/>
				</div>

				{config.tipo === "anticipacion" && (
					<>
						<div>
							<label className="block text-sm text-slate-300">
								Días Mínimos *
							</label>
							<input
								type="number"
								value={config.diasMinimos || 0}
								onChange={(e) =>
									onChange({ ...config, diasMinimos: parseInt(e.target.value) })
								}
								className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-white"
								min="0"
							/>
						</div>
						<div>
							<label className="block text-sm text-slate-300">
								Días Máximos (vacío = sin límite)
							</label>
							<input
								type="number"
								value={config.diasMaximos || ""}
								onChange={(e) =>
									onChange({
										...config,
										diasMaximos: e.target.value
											? parseInt(e.target.value)
											: null,
									})
								}
								className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-white"
								min="0"
							/>
						</div>
					</>
				)}

				{config.tipo === "horario" && (
					<>
						<div>
							<label className="block text-sm text-slate-300">
								Hora Inicio *
							</label>
							<input
								type="time"
								value={config.horaInicio?.substring(0, 5) || ""}
								onChange={(e) =>
									onChange({ ...config, horaInicio: e.target.value + ":00" })
								}
								className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-white"
							/>
						</div>
						<div>
							<label className="block text-sm text-slate-300">Hora Fin *</label>
							<input
								type="time"
								value={config.horaFin?.substring(0, 5) || ""}
								onChange={(e) =>
									onChange({ ...config, horaFin: e.target.value + ":00" })
								}
								className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-white"
							/>
						</div>
					</>
				)}

				{config.tipo === "descuento_retorno" && (
					<div>
						<label className="block text-sm text-slate-300">
							Tiempo Espera Máximo (minutos)
						</label>
						<input
							type="number"
							value={config.tiempoEsperaMaximo || 240}
							onChange={(e) =>
								onChange({
									...config,
									tiempoEsperaMaximo: parseInt(e.target.value),
								})
							}
							className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-white"
							min="0"
						/>
					</div>
				)}
			</div>

			{config.tipo === "dia_semana" && (
				<div>
					<label className="block text-sm text-slate-300 mb-2">
						Días de la semana *
					</label>
					<div className="flex flex-wrap gap-2">
						{diasSemana.map((dia) => (
							<label
								key={dia.value}
								className="flex items-center gap-2 rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-300"
							>
								<input
									type="checkbox"
									checked={config.diasSemana?.includes(dia.value) || false}
									onChange={(e) => {
										const dias = config.diasSemana || [];
										const newDias = e.target.checked
											? [...dias, dia.value]
											: dias.filter((d) => d !== dia.value);
										onChange({ ...config, diasSemana: newDias });
									}}
									className="rounded border-slate-600"
								/>
								{dia.label}
							</label>
						))}
					</div>
				</div>
			)}

			<div>
				<label className="block text-sm text-slate-300">Descripción</label>
				<textarea
					value={config.descripcion || ""}
					onChange={(e) => onChange({ ...config, descripcion: e.target.value })}
					className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-white"
					rows="2"
					placeholder="Descripción de la regla..."
				/>
			</div>

			<div>
				<label className="block text-sm text-slate-300 mb-2">
					Destinos Excluidos (opcional)
				</label>
				<div className="flex flex-wrap gap-2">
					{destinos.map((destino) => (
						<label
							key={destino.nombre}
							className="flex items-center gap-2 rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-300"
						>
							<input
								type="checkbox"
								checked={
									config.destinosExcluidos?.includes(destino.nombre) || false
								}
								onChange={(e) => {
									const excluidos = config.destinosExcluidos || [];
									const newExcluidos = e.target.checked
										? [...excluidos, destino.nombre]
										: excluidos.filter((d) => d !== destino.nombre);
									onChange({ ...config, destinosExcluidos: newExcluidos });
								}}
								className="rounded border-slate-600"
							/>
							{destino.nombre}
						</label>
					))}
				</div>
			</div>

			<div>
				<label className="flex items-center gap-2 text-sm text-slate-300">
					<input
						type="checkbox"
						checked={config.activo || false}
						onChange={(e) => onChange({ ...config, activo: e.target.checked })}
						className="rounded border-slate-600"
					/>
					Activo
				</label>
			</div>

			<div className="flex gap-2">
				<Button onClick={onGuardar} disabled={saving || !config.nombre}>
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

export default AdminTarifaDinamica;
