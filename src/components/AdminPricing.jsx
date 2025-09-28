// src/components/AdminPricing.jsx

import { useCallback, useEffect, useState } from "react";
import { destinosBase as destinosIniciales } from "@/data/destinos";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

const nuevoDestinoTemplate = {
	nombre: "",
	descripcion: "",
	tiempo: "",
	imagen: "URL_de_imagen_por_defecto.jpg",
	maxPasajeros: 7,
	minHorasAnticipacion: 5,
	precios: {
		auto: { base: 0, porcentajeAdicional: 0.1 },
		van: { base: 0, porcentajeAdicional: 0.05 },
	},
};

const daysOfWeek = [
	"Lunes",
	"Martes",
	"Miércoles",
	"Jueves",
	"Viernes",
	"Sábado",
	"Domingo",
	"Fin de semana",
	"Feriados",
];

function AdminPricing() {
	const [pricing, setPricing] = useState({ destinos: [], dayPromotions: [] });
	const [newDestino, setNewDestino] = useState(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");

	const fetchPricing = useCallback(async () => {
		setLoading(true);
		setError("");
		try {
			const response = await fetch(`${API_BASE_URL}/pricing`);
			if (!response.ok) {
				throw new Error(
					"No se pudo obtener la configuración de precios del servidor."
				);
			}
			const data = await response.json();

			// Lógica Corregida: La fuente de verdad son los datos del servidor.
			// Si el servidor no tiene destinos, se muestra una lista vacía.
			// El fallback a `destinosIniciales` solo ocurre si la carga falla por completo.
			setPricing({
				destinos:
					data.destinos && Array.isArray(data.destinos) ? data.destinos : [],
				dayPromotions: Array.isArray(data.dayPromotions)
					? data.dayPromotions
					: [],
				updatedAt: data.updatedAt || null,
			});
		} catch (fetchError) {
			console.error(fetchError);
			setError(
				fetchError.message || "Ocurrió un error al cargar la configuración."
			);
			// Fallback a los datos iniciales solo si hay un error de conexión
			setPricing({
				destinos: destinosIniciales,
				dayPromotions: [],
				updatedAt: null,
			});
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchPricing();
	}, [fetchPricing]);

	useEffect(() => {
		if (success) {
			const timer = setTimeout(() => setSuccess(""), 4000);
			return () => clearTimeout(timer);
		}
	}, [success]);

	const handleDestinoChange = (nombre, vehiculo, field, value) => {
		setPricing((prev) => ({
			...prev,
			destinos: prev.destinos.map((dest) =>
				dest.nombre === nombre
					? {
							...dest,
							precios: {
								...dest.precios,
								[vehiculo]: {
									...dest.precios[vehiculo],
									[field]: Number(value) || 0,
								},
							},
					  }
					: dest
			),
		}));
	};

	const handleAddNewDestino = () => {
		if (newDestino.nombre.trim() === "") {
			alert("El nombre del destino no puede estar vacío.");
			return;
		}
		if (
			pricing.destinos.some(
				(d) => d.nombre.toLowerCase() === newDestino.nombre.toLowerCase()
			)
		) {
			alert("Ya existe un destino con ese nombre.");
			return;
		}

		setPricing((prev) => ({
			...prev,
			destinos: [...prev.destinos, { ...newDestino, id: `dest-${Date.now()}` }],
		}));
		setNewDestino(null);
	};

	const handleRemoveDestino = (nombre) => {
		if (
			window.confirm(
				`¿Estás seguro de que quieres eliminar el destino "${nombre}"?`
			)
		) {
			setPricing((prev) => ({
				...prev,
				destinos: prev.destinos.filter((d) => d.nombre !== nombre),
			}));
		}
	};

	const handleSubmit = async (event) => {
		event.preventDefault();
		if (newDestino) {
			alert(
				"Por favor, guarda o cancela el nuevo destino antes de guardar los cambios generales."
			);
			return;
		}
		setSaving(true);
		setError("");
		setSuccess("");

		try {
			const response = await fetch(`${API_BASE_URL}/pricing`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					destinos: pricing.destinos,
					dayPromotions: pricing.dayPromotions,
				}),
			});

			if (!response.ok) {
				const errorBody = await response.json().catch(() => ({}));
				throw new Error(
					errorBody.message || "No se pudo guardar la configuración."
				);
			}

			const savedData = await response.json();
			setPricing(savedData);
			setSuccess("Configuración guardada correctamente.");
		} catch (submitError) {
			console.error(submitError);
			setError(
				submitError.message || "Ocurrió un error al guardar los cambios."
			);
		} finally {
			setSaving(false);
		}
	};

	if (loading) {
		return (
			<div className="flex h-screen items-center justify-center bg-slate-950 text-white">
				Cargando...
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-slate-950 text-slate-100">
			<div className="mx-auto w-full max-w-5xl px-4 py-10">
				<header className="mb-10">
					<h1 className="text-3xl font-semibold text-white">
						Panel de Tarifas y Destinos
					</h1>
					<p className="mt-2 max-w-3xl text-sm text-slate-300">
						Administra las tarifas para cada destino y vehículo. También puedes
						añadir o eliminar destinos.
					</p>
					{pricing.updatedAt && (
						<p className="mt-3 text-xs text-slate-400">
							Última actualización:{" "}
							{new Date(pricing.updatedAt).toLocaleString()}
						</p>
					)}
				</header>

				<form onSubmit={handleSubmit} className="space-y-10">
					<section className="space-y-6 rounded-lg border border-slate-800 bg-slate-900/70 p-6 shadow-lg">
						<div className="flex flex-wrap items-center justify-between gap-4">
							<h2 className="text-xl font-semibold text-white">
								Tarifas por Destino
							</h2>
							<button
								type="button"
								onClick={() => setNewDestino({ ...nuevoDestinoTemplate })}
								className="inline-flex items-center rounded-md bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
								disabled={!!newDestino}
							>
								Añadir Nuevo Destino
							</button>
						</div>

						<div className="space-y-6">
							{newDestino && (
								<div className="rounded-md border-2 border-dashed border-blue-500 bg-slate-950/80 p-4">
									<h3 className="text-lg font-medium text-blue-400">
										Nuevo Destino
									</h3>
									<div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
										<label className="text-sm text-slate-300">
											Nombre del Destino
											<input
												type="text"
												value={newDestino.nombre}
												onChange={(e) =>
													setNewDestino((d) => ({
														...d,
														nombre: e.target.value,
													}))
												}
												className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
												placeholder="Ej: Lican Ray"
											/>
										</label>
										<label className="text-sm text-slate-300">
											Tiempo de Viaje
											<input
												type="text"
												value={newDestino.tiempo}
												onChange={(e) =>
													setNewDestino((d) => ({
														...d,
														tiempo: e.target.value,
													}))
												}
												className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
												placeholder="Ej: 1h 45min"
											/>
										</label>
										<label className="text-sm text-slate-300 sm:col-span-2">
											Descripción
											<input
												type="text"
												value={newDestino.descripcion}
												onChange={(e) =>
													setNewDestino((d) => ({
														...d,
														descripcion: e.target.value,
													}))
												}
												className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
												placeholder="Breve descripción del lugar"
											/>
										</label>
										<label className="text-sm text-slate-300">
											Precio Base (Auto)
											<input
												type="number"
												value={newDestino.precios.auto.base}
												onChange={(e) =>
													setNewDestino((d) => ({
														...d,
														precios: {
															...d.precios,
															auto: {
																...d.precios.auto,
																base: Number(e.target.value),
															},
														},
													}))
												}
												className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
											/>
										</label>
										<label className="text-sm text-slate-300">
											Precio Base (Van)
											<input
												type="number"
												value={newDestino.precios.van.base}
												onChange={(e) =>
													setNewDestino((d) => ({
														...d,
														precios: {
															...d.precios,
															van: {
																...d.precios.van,
																base: Number(e.target.value),
															},
														},
													}))
												}
												className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
											/>
										</label>
									</div>
									<div className="mt-4 flex justify-end gap-3">
										<button
											type="button"
											onClick={() => setNewDestino(null)}
											className="rounded-md px-3 py-1 text-xs font-semibold text-slate-300 transition hover:bg-slate-800"
										>
											Cancelar
										</button>
										<button
											type="button"
											onClick={handleAddNewDestino}
											className="rounded-md bg-blue-500 px-3 py-1 text-xs font-semibold text-white transition hover:bg-blue-400"
										>
											Guardar Destino
										</button>
									</div>
								</div>
							)}

							{pricing.destinos.length > 0 ? (
								pricing.destinos.map((destino) => (
									<div
										key={destino.nombre}
										className="rounded-md border border-slate-800 bg-slate-950/60 p-4"
									>
										<div className="flex items-center justify-between">
											<h3 className="text-lg font-medium text-emerald-400">
												{destino.nombre}
											</h3>
											<button
												type="button"
												onClick={() => handleRemoveDestino(destino.nombre)}
												className="rounded-md border border-red-400/50 px-3 py-1 text-xs font-semibold text-red-200 transition hover:bg-red-500/10"
											>
												Eliminar
											</button>
										</div>
										<div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
											{Object.keys(destino.precios).map((vehiculo) => (
												<label
													key={vehiculo}
													className="text-sm capitalize text-slate-300"
												>
													Precio Base ({vehiculo})
													<input
														type="number"
														min="0"
														value={destino.precios[vehiculo].base}
														onChange={(e) =>
															handleDestinoChange(
																destino.nombre,
																vehiculo,
																"base",
																e.target.value
															)
														}
														className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
													/>
												</label>
											))}
										</div>
									</div>
								))
							) : (
								<p className="text-center text-sm text-slate-400 py-4">
									No hay destinos configurados. ¡Añade el primero para empezar!
								</p>
							)}
						</div>
					</section>

					<footer className="flex flex-col gap-4 border-t border-slate-800 pt-6 sm:flex-row sm:items-center sm:justify-between">
						<button
							type="button"
							onClick={fetchPricing}
							disabled={loading || saving}
							className="rounded-md border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
						>
							Descartar Cambios
						</button>
						<button
							type="submit"
							disabled={saving || loading}
							className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-500 px-6 py-2 text-sm font-semibold text-slate-950 shadow transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
						>
							{saving ? "Guardando..." : "Guardar Cambios y Publicar"}
						</button>
					</footer>
				</form>

				{error && (
					<div className="mt-6 rounded-md border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
						{error}
					</div>
				)}
				{success && (
					<div className="mt-6 rounded-md border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-200">
						{success}
					</div>
				)}
			</div>
		</div>
	);
}

export default AdminPricing;
