// src/components/AdminPricing.jsx

import { useCallback, useEffect, useState } from "react";
// Corregido: Importamos los destinos desde el nuevo archivo de datos
import { destinosBase as destinosIniciales } from "@/data/destinos";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

// Estructura de datos por defecto, ahora funciona sin error
const defaultState = {
	destinos: destinosIniciales,
	dayPromotions: [],
	updatedAt: null,
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
	const [pricing, setPricing] = useState(defaultState);
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
				throw new Error("No se pudo obtener la configuración de precios.");
			}
			const data = await response.json();

			const synchronizedDestinos = destinosIniciales.map((baseDest) => {
				const savedDest = data.destinos?.find(
					(d) => d.nombre === baseDest.nombre
				);
				return savedDest ? { ...baseDest, ...savedDest } : baseDest;
			});

			setPricing({
				destinos: synchronizedDestinos,
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

	const handleDayChange = (id, field, value) => {
		setPricing((prev) => ({
			...prev,
			dayPromotions: prev.dayPromotions.map((promo) =>
				promo.id === id ? { ...promo, [field]: value } : promo
			),
		}));
	};

	const addDayPromotion = () => {
		setPricing((prev) => ({
			...prev,
			dayPromotions: [
				...prev.dayPromotions,
				{
					id: `promo-${Date.now()}`,
					dia: "Lunes",
					descripcion: "",
					descuento: 0,
				},
			],
		}));
	};

	const removeDayPromotion = (id) => {
		setPricing((prev) => ({
			...prev,
			dayPromotions: prev.dayPromotions.filter((promo) => promo.id !== id),
		}));
	};

	const handleSubmit = async (event) => {
		event.preventDefault();
		setSaving(true);
		setError("");
		setSuccess("");

		try {
			const response = await fetch(`${API_BASE_URL}/pricing`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					destinos: pricing.destinos,
					dayPromotions: pricing.dayPromotions.map((promo) => ({
						...promo,
						descuento: Number(promo.descuento) || 0,
					})),
				}),
			});

			if (!response.ok) {
				const errorBody = await response.json().catch(() => ({}));
				throw new Error(
					errorBody.message || "No se pudo guardar la configuración."
				);
			}

			const savedData = await response.json();
			// Re-sincronizar después de guardar para mantener la estructura completa
			const synchronizedDestinos = destinosIniciales.map((baseDest) => {
				const savedDest = savedData.destinos?.find(
					(d) => d.nombre === baseDest.nombre
				);
				return savedDest ? { ...baseDest, ...savedDest } : baseDest;
			});

			setPricing({
				...savedData,
				destinos: synchronizedDestinos,
			});
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
				Cargando configuración de tarifas...
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-slate-950 text-slate-100">
			<div className="mx-auto w-full max-w-5xl px-4 py-10">
				<header className="mb-10">
					<h1 className="text-3xl font-semibold text-white">
						Panel de Tarifas y Promociones
					</h1>
					<p className="mt-2 max-w-3xl text-sm text-slate-300">
						Administra las tarifas base para cada destino y vehículo. Los
						cambios se reflejarán en tiempo real en el cotizador del sitio web.
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
						<h2 className="text-xl font-semibold text-white">
							Tarifas por Destino
						</h2>
						<div className="space-y-6">
							{pricing.destinos.map((destino) => (
								<div
									key={destino.nombre}
									className="rounded-md border border-slate-800 bg-slate-950/60 p-4"
								>
									<h3 className="text-lg font-medium text-emerald-400">
										{destino.nombre}
									</h3>
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
													className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
												/>
											</label>
										))}
									</div>
								</div>
							))}
						</div>
					</section>

					<section className="space-y-6 rounded-lg border border-slate-800 bg-slate-900/70 p-6 shadow-lg">
						<div className="flex flex-wrap items-center justify-between gap-4">
							<div>
								<h2 className="text-xl font-semibold text-white">
									Promociones por Día
								</h2>
								<p className="mt-2 text-sm text-slate-300">
									Configura descuentos para días específicos.
								</p>
							</div>
							<button
								type="button"
								onClick={addDayPromotion}
								className="inline-flex items-center rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow transition hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
							>
								Añadir Promoción
							</button>
						</div>
						<div className="space-y-4">
							{pricing.dayPromotions.map((promo) => (
								<div
									key={promo.id}
									className="rounded-md border border-slate-800 bg-slate-950/60 p-4"
								>
									<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
										<label className="text-sm text-slate-300">
											Día o Rango
											<select
												value={promo.dia || ""}
												onChange={(e) =>
													handleDayChange(promo.id, "dia", e.target.value)
												}
												className="mt-1 block w-full rounded-md border-slate-700 bg-slate-900 text-white"
											>
												{daysOfWeek.map((day) => (
													<option key={day} value={day}>
														{day}
													</option>
												))}
											</select>
										</label>
										<label className="text-sm text-slate-300">
											Descuento (%)
											<input
												type="number"
												min="0"
												max="100"
												value={promo.descuento || 0}
												onChange={(e) =>
													handleDayChange(promo.id, "descuento", e.target.value)
												}
												className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
											/>
										</label>
										<div className="flex items-end">
											<button
												type="button"
												onClick={() => removeDayPromotion(promo.id)}
												className="w-full rounded-md border border-red-400/50 px-3 py-2 text-xs font-semibold text-red-200 transition hover:bg-red-500/10"
											>
												Eliminar
											</button>
										</div>
									</div>
								</div>
							))}
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
							{saving ? "Guardando..." : "Guardar Cambios"}
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
