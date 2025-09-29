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

const generatePromotionId = () =>
	`promo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const nuevaPromocionTemplate = {
	id: "",
	destino: "",
	descripcion: "",
	aplicaPorDias: false,
	dias: [],
	aplicaPorHorario: false,
	horaInicio: "",
	horaFin: "",
	descuentoPorcentaje: 0,
	aplicaTipoViaje: {
		ida: false,
		vuelta: false,
		ambos: true,
	},
};

const normalizePromotions = (promociones = []) => {
	if (!Array.isArray(promociones)) return [];
	return promociones.map((promo, index) => {
		const id = promo.id || generatePromotionId() || `promo-${index}`;
		return {
			...nuevaPromocionTemplate,
			...promo,
			id,
			dias: Array.isArray(promo.dias) ? promo.dias : [],
			descuentoPorcentaje: Number(promo.descuentoPorcentaje) || 0,
			aplicaPorDias: Boolean(promo.aplicaPorDias),
			aplicaPorHorario: Boolean(promo.aplicaPorHorario),
			horaInicio: promo.horaInicio || "",
			horaFin: promo.horaFin || "",
			descripcion: promo.descripcion || "",
			aplicaTipoViaje: {
				ida:
					promo.aplicaTipoViaje?.ida !== undefined
						? Boolean(promo.aplicaTipoViaje.ida)
						: false,
				vuelta:
					promo.aplicaTipoViaje?.vuelta !== undefined
						? Boolean(promo.aplicaTipoViaje.vuelta)
						: false,
				ambos:
					promo.aplicaTipoViaje?.ambos !== undefined
						? Boolean(promo.aplicaTipoViaje.ambos)
						: true,
			},
		};
	});
};

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

			setPricing({
				destinos:
					data.destinos && data.destinos.length > 0
						? data.destinos
						: destinosIniciales,
				dayPromotions: normalizePromotions(data.dayPromotions),
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

	const handleGeneralDestinoChange = (nombre, field, value) => {
		const numValue = Number(value);
		setPricing((prev) => ({
			...prev,
			destinos: prev.destinos.map((dest) =>
				dest.nombre === nombre ? { ...dest, [field]: numValue || 0 } : dest
			),
		}));
	};

	const handleAddPromotion = () => {
		if (pricing.destinos.length === 0) {
			alert(
				"Agrega al menos un destino antes de crear un descuento personalizado."
			);
			return;
		}

		const nuevaPromocion = {
			...nuevaPromocionTemplate,
			id: generatePromotionId(),
		};

		setPricing((prev) => ({
			...prev,
			dayPromotions: [...prev.dayPromotions, nuevaPromocion],
		}));
	};

	const handlePromotionFieldChange = (id, field, value) => {
		setPricing((prev) => ({
			...prev,
			dayPromotions: prev.dayPromotions.map((promo) => {
				if (promo.id !== id) return promo;
				if (field === "descuentoPorcentaje") {
					const parsed = Number(value);
					const bounded = Number.isFinite(parsed)
						? Math.min(Math.max(parsed, 0), 100)
						: 0;
					return { ...promo, descuentoPorcentaje: bounded };
				}
				return { ...promo, [field]: value };
			}),
		}));
	};

	const handleTogglePromotionDay = (id, day) => {
		setPricing((prev) => ({
			...prev,
			dayPromotions: prev.dayPromotions.map((promo) => {
				if (promo.id !== id) return promo;
				if (!promo.aplicaPorDias) return promo;
				const isActive = promo.dias.includes(day);
				const updatedDays = isActive
					? promo.dias.filter((d) => d !== day)
					: [...promo.dias, day];
				return { ...promo, dias: updatedDays };
			}),
		}));
	};

	const handleTogglePromotionSetting = (id, field) => {
		setPricing((prev) => ({
			...prev,
			dayPromotions: prev.dayPromotions.map((promo) => {
				if (promo.id !== id) return promo;
				if (field === "aplicaPorDias") {
					const nextValue = !promo.aplicaPorDias;
					return {
						...promo,
						aplicaPorDias: nextValue,
						dias: nextValue ? promo.dias : [],
					};
				}
				if (field === "aplicaPorHorario") {
					const nextValue = !promo.aplicaPorHorario;
					return {
						...promo,
						aplicaPorHorario: nextValue,
						horaInicio: nextValue ? promo.horaInicio : "",
						horaFin: nextValue ? promo.horaFin : "",
					};
				}
				return promo;
			}),
		}));
	};

	const handleToggleTipoViaje = (id, tipoViaje) => {
		setPricing((prev) => ({
			...prev,
			dayPromotions: prev.dayPromotions.map((promo) => {
				if (promo.id !== id) return promo;
				const newValue = !promo.aplicaTipoViaje[tipoViaje];

				// Lógica mutuamente excluyente
				let newAplicaTipoViaje = { ...promo.aplicaTipoViaje };

				if (tipoViaje === "ambos" && newValue) {
					// Si selecciona "ambos", desactiva "ida" y "vuelta"
					newAplicaTipoViaje = {
						ida: false,
						vuelta: false,
						ambos: true,
					};
				} else if (
					(tipoViaje === "ida" || tipoViaje === "vuelta") &&
					newValue
				) {
					// Si selecciona "ida" o "vuelta", desactiva "ambos"
					newAplicaTipoViaje = {
						...newAplicaTipoViaje,
						[tipoViaje]: true,
						ambos: false,
					};
				} else {
					// Si desactiva cualquier opción
					newAplicaTipoViaje[tipoViaje] = newValue;
				}

				return {
					...promo,
					aplicaTipoViaje: newAplicaTipoViaje,
				};
			}),
		}));
	};

	const handleRemovePromotion = (id) => {
		setPricing((prev) => ({
			...prev,
			dayPromotions: prev.dayPromotions.filter((promo) => promo.id !== id),
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
				dayPromotions: prev.dayPromotions.filter(
					(promo) => promo.destino !== nombre
				),
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

		const promocionInvalida = pricing.dayPromotions.find((promo) => {
			if (!promo.destino) return true;
			if (promo.descuentoPorcentaje <= 0) return true;
			if (promo.aplicaPorDias && promo.dias.length === 0) return true;
			if (
				promo.aplicaPorHorario &&
				(!promo.horaInicio ||
					!promo.horaFin ||
					promo.horaInicio >= promo.horaFin)
			) {
				return true;
			}
			// Validar que al menos una opción de tipo de viaje esté seleccionada
			if (
				!promo.aplicaTipoViaje.ida &&
				!promo.aplicaTipoViaje.vuelta &&
				!promo.aplicaTipoViaje.ambos
			) {
				return true;
			}
			return false;
		});

		if (promocionInvalida) {
			alert(
				"Revisa los descuentos: cada promoción debe tener destino, porcentaje y configuración válida."
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
			setPricing({
				...savedData,
				dayPromotions: normalizePromotions(savedData.dayPromotions),
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
						Administra las tarifas, máximo de pasajeros y más para cada destino.
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
											Máx. Pasajeros
											<input
												type="number"
												min="1"
												value={newDestino.maxPasajeros}
												onChange={(e) =>
													setNewDestino((d) => ({
														...d,
														maxPasajeros: Number(e.target.value),
													}))
												}
												className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
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
								pricing.destinos.map((destino) => {
									const isVanDisabled = destino.maxPasajeros <= 4;
									return (
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
												<label className="text-sm text-slate-300">
													Precio Base (Auto)
													<input
														type="number"
														min="0"
														value={destino.precios.auto.base}
														onChange={(e) =>
															handleDestinoChange(
																destino.nombre,
																"auto",
																"base",
																e.target.value
															)
														}
														className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
													/>
												</label>
												<label
													className={`text-sm ${
														isVanDisabled ? "text-slate-500" : "text-slate-300"
													}`}
												>
													Precio Base (Van)
													<input
														type="number"
														min="0"
														value={destino.precios.van.base}
														onChange={(e) =>
															handleDestinoChange(
																destino.nombre,
																"van",
																"base",
																e.target.value
															)
														}
														disabled={isVanDisabled}
														className={`mt-1 w-full rounded-md border px-3 py-2 text-sm text-white ${
															isVanDisabled
																? "border-slate-800 bg-slate-900/50 cursor-not-allowed"
																: "border-slate-700 bg-slate-900"
														}`}
													/>
													{isVanDisabled && (
														<p className="text-xs text-slate-500 mt-1">
															Habilitado para más de 4 pasajeros.
														</p>
													)}
												</label>
												<label className="text-sm text-slate-300">
													Máx. Pasajeros
													<input
														type="number"
														min="1"
														value={destino.maxPasajeros}
														onChange={(e) =>
															handleGeneralDestinoChange(
																destino.nombre,
																"maxPasajeros",
																e.target.value
															)
														}
														className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
													/>
												</label>
											</div>
										</div>
									);
								})
							) : (
								<p className="text-center text-sm text-slate-400 py-4">
									No hay destinos configurados. ¡Añade el primero para empezar!
								</p>
							)}
						</div>
					</section>

					<section className="space-y-6 rounded-lg border border-slate-800 bg-slate-900/70 p-6 shadow-lg">
						<div className="flex flex-wrap items-center justify-between gap-4">
							<div>
								<h2 className="text-xl font-semibold text-white">
									Descuentos Personalizados
								</h2>
								<p className="mt-1 text-xs text-slate-400 max-w-xl">
									Configura promociones por tramo con restricciones por día u
									horario. Estos porcentajes se aplican como descuento adicional
									al 10% base del canal web.
								</p>
							</div>
							<button
								type="button"
								onClick={handleAddPromotion}
								disabled={pricing.destinos.length === 0}
								className="inline-flex items-center rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
							>
								Añadir Descuento
							</button>
						</div>

						{pricing.destinos.length === 0 && (
							<p className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-200">
								Primero crea un destino para asociar descuentos.
							</p>
						)}

						{pricing.dayPromotions.length > 0 ? (
							<div className="space-y-5">
								{pricing.dayPromotions.map((promo) => {
									const destinoOptions = pricing.destinos.map(
										(dest) => dest.nombre
									);
									return (
										<div
											key={promo.id}
											className="rounded-md border border-slate-800 bg-slate-950/60 p-4"
										>
											<div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
												<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:flex-1 lg:grid-cols-3">
													<label className="text-sm text-slate-300">
														Tramo / Destino
														<select
															className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
															value={promo.destino}
															onChange={(e) =>
																handlePromotionFieldChange(
																	promo.id,
																	"destino",
																	e.target.value
																)
															}
														>
															<option value="">Selecciona un destino</option>
															{destinoOptions.map((nombre) => (
																<option key={nombre} value={nombre}>
																	{nombre}
																</option>
															))}
														</select>
													</label>
													<label className="text-sm text-slate-300">
														% Descuento adicional
														<input
															type="number"
															min="0"
															max="100"
															value={promo.descuentoPorcentaje}
															onChange={(e) =>
																handlePromotionFieldChange(
																	promo.id,
																	"descuentoPorcentaje",
																	e.target.value
																)
															}
															className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
														/>
													</label>
													<label className="text-sm text-slate-300 sm:col-span-2 lg:col-span-1">
														Descripción interna
														<input
															type="text"
															value={promo.descripcion}
															onChange={(e) =>
																handlePromotionFieldChange(
																	promo.id,
																	"descripcion",
																	e.target.value
																)
															}
															placeholder="Ej: Promo finde"
															className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
														/>
													</label>
												</div>
												<button
													type="button"
													onClick={() => handleRemovePromotion(promo.id)}
													className="self-start rounded-md border border-red-400/50 px-3 py-1 text-xs font-semibold text-red-200 transition hover:bg-red-500/10"
												>
													Eliminar
												</button>
											</div>

											<div className="mt-4 space-y-4">
												<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
													<label className="inline-flex items-center gap-2 text-sm text-slate-300">
														<input
															type="checkbox"
															checked={promo.aplicaPorDias}
															onChange={() =>
																handleTogglePromotionSetting(
																	promo.id,
																	"aplicaPorDias"
																)
															}
															className="h-4 w-4 rounded border border-slate-600 bg-slate-900"
														/>
														Aplicar solo en días específicos
													</label>
												</div>
												<div className="flex flex-wrap gap-2">
													{daysOfWeek.map((day) => {
														const isActive = promo.dias.includes(day);
														return (
															<button
																type="button"
																key={day}
																onClick={() =>
																	handleTogglePromotionDay(promo.id, day)
																}
																disabled={!promo.aplicaPorDias}
																className={`rounded-full border px-3 py-1 text-xs transition ${
																	isActive
																		? "border-emerald-400 bg-emerald-500/20 text-emerald-100"
																		: "border-slate-700 bg-slate-900 text-slate-300"
																} ${
																	promo.aplicaPorDias
																		? "hover:border-emerald-400 hover:bg-emerald-500/10"
																		: "opacity-50"
																}`}
															>
																{day}
															</button>
														);
													})}
												</div>
											</div>

											<div className="space-y-3">
												<label className="inline-flex items-center gap-2 text-sm text-slate-300">
													<input
														type="checkbox"
														checked={promo.aplicaPorHorario}
														onChange={() =>
															handleTogglePromotionSetting(
																promo.id,
																"aplicaPorHorario"
															)
														}
														className="h-4 w-4 rounded border border-slate-600 bg-slate-900"
													/>
													Aplicar solo en un rango horario
												</label>
												<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
													<label className="text-sm text-slate-300">
														Hora inicio
														<input
															type="time"
															value={promo.horaInicio}
															onChange={(e) =>
																handlePromotionFieldChange(
																	promo.id,
																	"horaInicio",
																	e.target.value
																)
															}
															disabled={!promo.aplicaPorHorario}
															className={`mt-1 w-full rounded-md border px-3 py-2 text-sm text-white ${
																promo.aplicaPorHorario
																	? "border-slate-700 bg-slate-900"
																	: "border-slate-800 bg-slate-900/50 cursor-not-allowed"
															}`}
														/>
													</label>
													<label className="text-sm text-slate-300">
														Hora fin
														<input
															type="time"
															value={promo.horaFin}
															onChange={(e) =>
																handlePromotionFieldChange(
																	promo.id,
																	"horaFin",
																	e.target.value
																)
															}
															disabled={!promo.aplicaPorHorario}
															className={`mt-1 w-full rounded-md border px-3 py-2 text-sm text-white ${
																promo.aplicaPorHorario
																	? "border-slate-700 bg-slate-900"
																	: "border-slate-800 bg-slate-900/50 cursor-not-allowed"
															}`}
														/>
													</label>
												</div>
											</div>

											<div className="space-y-3">
												<label className="text-sm font-medium text-slate-300">
													Aplicar descuento en:
												</label>
												<div className="flex flex-wrap gap-3">
													<label className="inline-flex items-center gap-2 text-sm text-slate-300">
														<input
															type="checkbox"
															checked={promo.aplicaTipoViaje.ida}
															onChange={() =>
																handleToggleTipoViaje(promo.id, "ida")
															}
															className="h-4 w-4 rounded border border-slate-600 bg-slate-900"
														/>
														<span className="flex items-center gap-1">
															🚗 Solo ida
														</span>
													</label>
													<label className="inline-flex items-center gap-2 text-sm text-slate-300">
														<input
															type="checkbox"
															checked={promo.aplicaTipoViaje.vuelta}
															onChange={() =>
																handleToggleTipoViaje(promo.id, "vuelta")
															}
															className="h-4 w-4 rounded border border-slate-600 bg-slate-900"
														/>
														<span className="flex items-center gap-1">
															🔄 Solo vuelta
														</span>
													</label>
													<label className="inline-flex items-center gap-2 text-sm text-slate-300">
														<input
															type="checkbox"
															checked={promo.aplicaTipoViaje.ambos}
															onChange={() =>
																handleToggleTipoViaje(promo.id, "ambos")
															}
															className="h-4 w-4 rounded border border-slate-600 bg-slate-900"
														/>
														<span className="flex items-center gap-1">
															🔄🚗 Ida y vuelta
														</span>
													</label>
												</div>
												<p className="text-xs text-slate-400">
													Selecciona en qué tipo de viaje se aplicará este
													descuento.
													<br />
													<strong>Nota:</strong> "Ida y vuelta" es excluyente
													con "Solo ida" y "Solo vuelta".
												</p>
											</div>
										</div>
									);
								})}
							</div>
						) : (
							<p className="text-center text-sm text-slate-400 py-4">
								No hay descuentos configurados todavía.
							</p>
						)}
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
