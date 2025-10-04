// src/components/AdminPricing.jsx

import { useCallback, useEffect, useState } from "react";
import { destinosBase as destinosIniciales } from "@/data/destinos";

const API_BASE_URL =
	import.meta.env.VITE_API_URL || "https://transportes-araucaria.onrender.com";

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

const parsePromotionMetadata = (promo) => {
	if (!promo || typeof promo.descripcion !== "string") return null;
	try {
		const parsed = JSON.parse(promo.descripcion);
		return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
	} catch (error) {
		return null;
	}
};

const normalizePromotions = (promociones = []) => {
	if (!Array.isArray(promociones)) return [];
	return promociones.map((promo, index) => {
		const metadata = parsePromotionMetadata(promo);
		const id = metadata?.sourceId || promo.id || generatePromotionId() || `promo-${index}`;
		const diasMetadata = Array.isArray(metadata?.dias) ? metadata.dias.filter(Boolean) : [];
		const aplicaPorDias = metadata?.aplicaPorDias ?? Boolean(promo.aplicaPorDias);
		const dias = aplicaPorDias
			? (diasMetadata.length > 0
				? diasMetadata
				: Array.isArray(promo.dias)
				? promo.dias.filter(Boolean)
				: metadata?.diaIndividual
				? [metadata.diaIndividual]
				: [])
			: [];
		const porcentaje = Number(
			metadata?.porcentaje ?? promo.descuentoPorcentaje ?? 0
		);
		const aplicaTipoViajeMetadata = metadata?.aplicaTipoViaje || {};

		return {
			...nuevaPromocionTemplate,
			...promo,
			id,
			destino: metadata?.destino ?? promo.destino ?? "",
			descripcion: metadata?.descripcion ?? promo.descripcion ?? "",
			aplicaPorDias,
			dias,
			aplicaPorHorario: metadata?.aplicaPorHorario ?? Boolean(promo.aplicaPorHorario),
			horaInicio: metadata?.horaInicio ?? promo.horaInicio ?? "",
			horaFin: metadata?.horaFin ?? promo.horaFin ?? "",
			descuentoPorcentaje: Number.isFinite(porcentaje) ? porcentaje : 0,
			aplicaTipoViaje: {
				ida:
					metadata?.aplicaTipoViaje?.ida ?? promo.aplicaTipoViaje?.ida ?? false,
				vuelta:
					metadata?.aplicaTipoViaje?.vuelta ?? promo.aplicaTipoViaje?.vuelta ?? false,
				ambos:
					metadata?.aplicaTipoViaje?.ambos ?? promo.aplicaTipoViaje?.ambos ?? true,
			},
			activo: metadata?.activo ?? promo.activo ?? true,
		};
	});
};

function AdminPricing() {
	const [pricing, setPricing] = useState({
		destinos: [],
		dayPromotions: [],
		descuentosGlobales: {
			descuentoOnline: {
				valor: 5,
				activo: true,
				nombre: "Descuento por Reserva Online",
			},
			descuentoRoundTrip: {
				valor: 10,
				activo: true,
				nombre: "Descuento por Ida y Vuelta",
			},
			descuentosPersonalizados: [],
		},
	});
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
				descuentosGlobales: {
					descuentoOnline: {
						valor:
							data.descuentosGlobales?.descuentoOnline?.valor ||
							data.descuentosGlobales?.descuentoOnline ||
							5,
						activo:
							data.descuentosGlobales?.descuentoOnline?.activo !== undefined
								? data.descuentosGlobales.descuentoOnline.activo
								: true,
						nombre: "Descuento por Reserva Online",
					},
					descuentoRoundTrip: {
						valor:
							data.descuentosGlobales?.descuentoRoundTrip?.valor ||
							data.descuentosGlobales?.descuentoRoundTrip ||
							10,
						activo:
							data.descuentosGlobales?.descuentoRoundTrip?.activo !== undefined
								? data.descuentosGlobales.descuentoRoundTrip.activo
								: true,
						nombre: "Descuento por Ida y Vuelta",
					},
					descuentosPersonalizados:
						data.descuentosGlobales?.descuentosPersonalizados || [],
				},
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
				descuentosGlobales: {
					descuentoOnline: {
						valor: 5,
						activo: true,
						nombre: "Descuento por Reserva Online",
					},
					descuentoRoundTrip: {
						valor: 10,
						activo: true,
						nombre: "Descuento por Ida y Vuelta",
					},
					descuentosPersonalizados: [],
				},
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
		console.log("🔍 handleAddPromotion - pricing.destinos:", pricing.destinos);
		console.log(
			"🔍 handleAddPromotion - pricing.destinos.length:",
			pricing.destinos?.length
		);
		console.log(
			"🔍 handleAddPromotion - condición:",
			!pricing.destinos || pricing.destinos.length === 0
		);

		if (!pricing.destinos || pricing.destinos.length === 0) {
			alert(
				"Agrega al menos un destino antes de crear un descuento personalizado."
			);
			return;
		}

		const nuevaPromocion = {
			...nuevaPromocionTemplate,
			id: generatePromotionId(),
		};

		console.log("🔍 handleAddPromotion - nuevaPromocion:", nuevaPromocion);

		setPricing((prev) => {
			console.log(
				"🔍 handleAddPromotion - dayPromotions antes:",
				prev.dayPromotions
			);
			const newDayPromotions = [...prev.dayPromotions, nuevaPromocion];
			console.log(
				"🔍 handleAddPromotion - dayPromotions después:",
				newDayPromotions
			);
			return {
				...prev,
				dayPromotions: newDayPromotions,
			};
		});
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

				// Lógica inteligente para tipo de viaje
				let newAplicaTipoViaje = { ...promo.aplicaTipoViaje };

				if (tipoViaje === "ambos" && newValue) {
					// Si selecciona "ambos", desactiva "ida" y "vuelta"
					newAplicaTipoViaje = {
						ida: false,
						vuelta: false,
						ambos: true,
					};
				} else if (tipoViaje === "ambos" && !newValue) {
					// Si deselecciona "ambos", activa por defecto "ida"
					newAplicaTipoViaje = {
						ida: true,
						vuelta: false,
						ambos: false,
					};
				} else if (
					(tipoViaje === "ida" || tipoViaje === "vuelta") &&
					newValue
				) {
					// Si selecciona "ida" o "vuelta", desactiva "ambos" primero
					newAplicaTipoViaje = {
						...newAplicaTipoViaje,
						[tipoViaje]: true,
						ambos: false,
					};

					// Si ahora tiene tanto "ida" como "vuelta", convertir a "ambos"
					if (newAplicaTipoViaje.ida && newAplicaTipoViaje.vuelta) {
						newAplicaTipoViaje = {
							ida: false,
							vuelta: false,
							ambos: true,
						};
					}
				} else {
					// Si desactiva "ida" o "vuelta"
					newAplicaTipoViaje[tipoViaje] = newValue;

					// Si no queda ninguna opción seleccionada, activar "ida" por defecto
					if (
						!newAplicaTipoViaje.ida &&
						!newAplicaTipoViaje.vuelta &&
						!newAplicaTipoViaje.ambos
					) {
						newAplicaTipoViaje.ida = true;
					}
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

	// Funciones para manejar descuentos globales
	const handleDescuentoFijoChange = (tipo, field, value) => {
		setPricing((prev) => ({
			...prev,
			descuentosGlobales: {
				...prev.descuentosGlobales,
				[tipo]: {
					...prev.descuentosGlobales[tipo],
					[field]:
						field === "valor"
							? Math.min(Math.max(Number(value) || 0, 0), 100)
							: value,
				},
			},
		}));
	};

	const toggleDescuentoFijo = (tipo) => {
		setPricing((prev) => ({
			...prev,
			descuentosGlobales: {
				...prev.descuentosGlobales,
				[tipo]: {
					...prev.descuentosGlobales[tipo],
					activo: !prev.descuentosGlobales[tipo].activo,
				},
			},
		}));
	};

	// Funciones para descuentos personalizados
	const addDescuentoPersonalizado = () => {
		const nuevoDescuento = {
			id: `desc_${Date.now()}`,
			nombre: "",
			valor: 0,
			activo: true,
		};

		setPricing((prev) => ({
			...prev,
			descuentosGlobales: {
				...prev.descuentosGlobales,
				descuentosPersonalizados: [
					...prev.descuentosGlobales.descuentosPersonalizados,
					nuevoDescuento,
				],
			},
		}));
	};

	const handleDescuentoPersonalizadoChange = (id, field, value) => {
		setPricing((prev) => ({
			...prev,
			descuentosGlobales: {
				...prev.descuentosGlobales,
				descuentosPersonalizados:
					prev.descuentosGlobales.descuentosPersonalizados.map((desc) =>
						desc.id === id
							? {
									...desc,
									[field]:
										field === "valor"
											? Math.min(Math.max(Number(value) || 0, 0), 100)
											: value,
							  }
							: desc
					),
			},
		}));
	};

	const removeDescuentoPersonalizado = (id) => {
		setPricing((prev) => ({
			...prev,
			descuentosGlobales: {
				...prev.descuentosGlobales,
				descuentosPersonalizados:
					prev.descuentosGlobales.descuentosPersonalizados.filter(
						(desc) => desc.id !== id
					),
			},
		}));
	};

	const toggleDescuentoPersonalizado = (id) => {
		setPricing((prev) => ({
			...prev,
			descuentosGlobales: {
				...prev.descuentosGlobales,
				descuentosPersonalizados:
					prev.descuentosGlobales.descuentosPersonalizados.map((desc) =>
						desc.id === id ? { ...desc, activo: !desc.activo } : desc
					),
			},
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
			if (
				promo.aplicaPorDias &&
				(!Array.isArray(promo.dias) || promo.dias.length === 0)
			)
				return true;
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

		// Debug logs para descuentos personalizados
		console.log(
			"🔍 Frontend - Descuentos personalizados antes de enviar:",
			pricing.descuentosGlobales.descuentosPersonalizados
		);
		console.log(
			"🔍 Frontend - Tipo:",
			typeof pricing.descuentosGlobales.descuentosPersonalizados
		);
		console.log(
			"🔍 Frontend - Es array:",
			Array.isArray(pricing.descuentosGlobales.descuentosPersonalizados)
		);
		console.log(
			"🔍 Frontend - Longitud:",
			pricing.descuentosGlobales.descuentosPersonalizados?.length
		);

		// Debug logs para dayPromotions
		console.log(
			"🔍 Frontend - dayPromotions antes de enviar:",
			pricing.dayPromotions
		);
		console.log(
			"🔍 Frontend - dayPromotions.length:",
			pricing.dayPromotions?.length
		);
		console.log(
			"🔍 Frontend - dayPromotions contenido:",
			pricing.dayPromotions
		);
		console.log("🔍 Frontend - Estado completo de pricing:", pricing);

		setSaving(true);
		setError("");
		setSuccess("");

		try {
			const formattedDayPromotions = (pricing.dayPromotions || []).map((promo) => {
				const aplicaPorDias = Boolean(promo.aplicaPorDias);
				const diasArray = Array.isArray(promo.dias)
					? promo.dias.filter(Boolean)
					: [];
				const normalizedDias = aplicaPorDias
					? diasArray.length > 0
						? diasArray
						: ["lunes"]
					: [];
				const diaPersistencia = aplicaPorDias
					? normalizedDias[0]
					: promo.dia || diasArray[0] || "lunes";
				const porcentaje =
					typeof promo.descuentoPorcentaje === "number"
						? promo.descuentoPorcentaje
						: Number(promo.descuentoPorcentaje) || 0;
				const metadata = {
					sourceId: promo.id,
					destino: promo.destino || "",
					descripcion: promo.descripcion || "",
					dias: aplicaPorDias ? normalizedDias : [],
					aplicaPorDias,
					aplicaPorHorario: Boolean(promo.aplicaPorHorario),
					horaInicio: promo.horaInicio || "",
					horaFin: promo.horaFin || "",
					porcentaje,
					aplicaTipoViaje: {
						ida: Boolean(promo.aplicaTipoViaje?.ida),
						vuelta: Boolean(promo.aplicaTipoViaje?.vuelta),
						ambos: Boolean(promo.aplicaTipoViaje?.ambos),
					},
					activo: promo.activo !== false,
					diaIndividual: diaPersistencia,
				};

				return {
					...promo,
					dias: aplicaPorDias ? normalizedDias : [],
					dia: diaPersistencia,
					porcentaje,
					descripcion: JSON.stringify(metadata),
				};
			});

			const response = await fetch(`${API_BASE_URL}/pricing`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					destinos: pricing.destinos,
					dayPromotions: formattedDayPromotions,
					descuentosGlobales: pricing.descuentosGlobales,
				}),
			});

			if (!response.ok) {
				const errorBody = await response.json().catch(() => ({}));
				throw new Error(
					errorBody.message || "No se pudo guardar la configuración."
				);
			}

			let savedData = null;
			try {
				savedData = await response.json();
			} catch (parseError) {
				console.warn("No se pudo parsear la respuesta del servidor; se recargara la configuracion.", parseError);
			}

			const hasFullPayload =
				savedData &&
				Array.isArray(savedData.destinos) &&
				Array.isArray(savedData.dayPromotions) &&
				savedData.descuentosGlobales;

			let broadcastPayload = null;

			if (hasFullPayload) {
				const normalizedPayload = {
					...savedData,
					dayPromotions: normalizePromotions(savedData.dayPromotions),
					descuentosGlobales: {
						descuentoOnline: {
							valor:
								savedData.descuentosGlobales?.descuentoOnline?.valor ||
								savedData.descuentosGlobales?.descuentoOnline ||
								5,
							activo:
								savedData.descuentosGlobales?.descuentoOnline?.activo !== undefined
									? savedData.descuentosGlobales.descuentoOnline.activo
									: true,
								nombre: "Descuento por Reserva Online",
						},
						descuentoRoundTrip: {
							valor:
								savedData.descuentosGlobales?.descuentoRoundTrip?.valor ||
								savedData.descuentosGlobales?.descuentoRoundTrip ||
								10,
							activo:
								savedData.descuentosGlobales?.descuentoRoundTrip?.activo !== undefined
									? savedData.descuentosGlobales.descuentoRoundTrip.activo
									: true,
								nombre: "Descuento por Ida y Vuelta",
						},
						descuentosPersonalizados:
							savedData.descuentosGlobales?.descuentosPersonalizados || [],
					},
					updatedAt: savedData.updatedAt || new Date().toISOString(),
				};

				setPricing(normalizedPayload);
				broadcastPayload = normalizedPayload;
			} else {
				await fetchPricing();
			}

			setSuccess(
				"Configuracion guardada correctamente. Los cambios se aplicaran en el sitio web."
			);
			// Notificar a la aplicacion principal que los datos han cambiado
			try {
				localStorage.setItem("pricing_updated", Date.now().toString());
				if (broadcastPayload) {
					try {
						localStorage.setItem("pricing_updated_payload", JSON.stringify(broadcastPayload));
					} catch (storageError) {
						console.warn("No se pudo persistir payload de precios en localStorage:", storageError);
					}
				} else {
					localStorage.removeItem("pricing_updated_payload");
				}

				if (typeof window !== "undefined") {
					window.dispatchEvent(
						new CustomEvent("pricing_updated", {
							detail: broadcastPayload || null,
						})
					);
				}

				if (typeof window !== "undefined" && window.recargarDatosPrecios) {
					const resultadoRecarga = window.recargarDatosPrecios(
						broadcastPayload ? { payload: broadcastPayload } : undefined
					);
					if (resultadoRecarga && typeof resultadoRecarga.catch == "function") {
						resultadoRecarga.catch((error) => {
							console.error("Error aplicando payload desde panel admin:", error);
						});
					}
				}

				if (
					typeof window !== "undefined" &&
					window.opener &&
					window.opener.recargarDatosPrecios
				) {
					try {
						const resultadoOpener = window.opener.recargarDatosPrecios(
							broadcastPayload ? { payload: broadcastPayload } : undefined
						);
						if (resultadoOpener && typeof resultadoOpener.catch == "function") {
							resultadoOpener.catch((error) => {
								console.error("Error aplicando payload en ventana principal:", error);
							});
						}
					} catch (callError) {
						console.error("Error notificando a la ventana principal:", callError);
					}
				}

				console.log("Notificaciones de actualizacion enviadas");
			} catch (e) {
				console.log(
					"No se pudieron enviar todas las notificaciones:",
					e.message
				);
			}

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
					{/* Sección de Descuentos Globales */}
					<section className="space-y-6 rounded-lg border border-slate-800 bg-slate-900/70 p-6 shadow-lg">
						<div className="flex flex-wrap items-center justify-between gap-4">
							<h2 className="text-xl font-semibold text-white">
								🏷️ Descuentos Globales
							</h2>
						</div>

						{/* Descuentos Fijos */}
						<div className="space-y-4">
							<h3 className="text-lg font-medium text-slate-200 border-b border-slate-700 pb-2">
								Descuentos Fijos
							</h3>

							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
								{/* Descuento Online */}
								<div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
									<div className="flex items-center justify-between mb-3">
										<h4 className="font-medium text-slate-200">
											🌐 Descuento Online
										</h4>
										<label className="inline-flex items-center">
											<input
												type="checkbox"
												checked={
													pricing.descuentosGlobales?.descuentoOnline?.activo ||
													false
												}
												onChange={() => toggleDescuentoFijo("descuentoOnline")}
												className="rounded border-slate-600 bg-slate-700 text-green-500 focus:ring-green-500/60"
											/>
											<span className="ml-2 text-sm text-slate-300">
												{pricing.descuentosGlobales?.descuentoOnline?.activo
													? "Activo"
													: "Inactivo"}
											</span>
										</label>
									</div>
									<div className="flex items-center gap-3">
										<input
											type="number"
											min="0"
											max="100"
											step="0.1"
											value={
												pricing.descuentosGlobales?.descuentoOnline?.valor || 5
											}
											onChange={(e) =>
												handleDescuentoFijoChange(
													"descuentoOnline",
													"valor",
													e.target.value
												)
											}
											disabled={
												!pricing.descuentosGlobales?.descuentoOnline?.activo
											}
											className="flex-1 rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
										/>
										<span className="text-slate-300">%</span>
									</div>
									<p className="mt-2 text-xs text-slate-400">
										Descuento por reservar online
									</p>
								</div>

								{/* Descuento Ida y Vuelta */}
								<div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
									<div className="flex items-center justify-between mb-3">
										<h4 className="font-medium text-slate-200">
											🔄 Descuento Ida y Vuelta
										</h4>
										<label className="inline-flex items-center">
											<input
												type="checkbox"
												checked={
													pricing.descuentosGlobales?.descuentoRoundTrip
														?.activo || false
												}
												onChange={() =>
													toggleDescuentoFijo("descuentoRoundTrip")
												}
												className="rounded border-slate-600 bg-slate-700 text-green-500 focus:ring-green-500/60"
											/>
											<span className="ml-2 text-sm text-slate-300">
												{pricing.descuentosGlobales?.descuentoRoundTrip?.activo
													? "Activo"
													: "Inactivo"}
											</span>
										</label>
									</div>
									<div className="flex items-center gap-3">
										<input
											type="number"
											min="0"
											max="100"
											step="0.1"
											value={
												pricing.descuentosGlobales?.descuentoRoundTrip?.valor ||
												10
											}
											onChange={(e) =>
												handleDescuentoFijoChange(
													"descuentoRoundTrip",
													"valor",
													e.target.value
												)
											}
											disabled={
												!pricing.descuentosGlobales?.descuentoRoundTrip?.activo
											}
											className="flex-1 rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
										/>
										<span className="text-slate-300">%</span>
									</div>
									<p className="mt-2 text-xs text-slate-400">
										Descuento para viajes redondos
									</p>
								</div>
							</div>
						</div>

						{/* Descuentos Personalizados */}
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<h3 className="text-lg font-medium text-slate-200 border-b border-slate-700 pb-2">
									Descuentos Personalizados
								</h3>
								<button
									type="button"
									onClick={addDescuentoPersonalizado}
									className="inline-flex items-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow transition hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/60"
								>
									+ Agregar Descuento
								</button>
							</div>

							{pricing.descuentosGlobales?.descuentosPersonalizados?.length ===
							0 ? (
								<div className="text-center py-8 text-slate-400">
									<p>No hay descuentos personalizados.</p>
									<p className="text-sm">
										Haz clic en "Agregar Descuento" para crear uno.
									</p>
								</div>
							) : (
								<div className="space-y-3">
									{pricing.descuentosGlobales?.descuentosPersonalizados?.map(
										(descuento) => (
											<div
												key={descuento.id}
												className="bg-slate-800/50 rounded-lg p-4 border border-slate-700"
											>
												<div className="flex items-start gap-4">
													<div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
														<div>
															<label className="block text-sm font-medium text-slate-300 mb-1">
																Nombre del Descuento
															</label>
															<input
																type="text"
																value={descuento.nombre}
																onChange={(e) =>
																	handleDescuentoPersonalizadoChange(
																		descuento.id,
																		"nombre",
																		e.target.value
																	)
																}
																placeholder="Ej: Descuento Estudiantes"
																className="w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
															/>
														</div>
														<div>
															<label className="block text-sm font-medium text-slate-300 mb-1">
																Porcentaje (%)
															</label>
															<input
																type="number"
																min="0"
																max="100"
																step="0.1"
																value={descuento.valor}
																onChange={(e) =>
																	handleDescuentoPersonalizadoChange(
																		descuento.id,
																		"valor",
																		e.target.value
																	)
																}
																disabled={!descuento.activo}
																className="w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
															/>
														</div>
														<div className="flex items-end gap-2">
															<label className="inline-flex items-center">
																<input
																	type="checkbox"
																	checked={descuento.activo}
																	onChange={() =>
																		toggleDescuentoPersonalizado(descuento.id)
																	}
																	className="rounded border-slate-600 bg-slate-700 text-green-500 focus:ring-green-500/60"
																/>
																<span className="ml-2 text-sm text-slate-300">
																	{descuento.activo ? "Activo" : "Inactivo"}
																</span>
															</label>
															<button
																type="button"
																onClick={() =>
																	removeDescuentoPersonalizado(descuento.id)
																}
																className="inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow transition hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/60"
															>
																🗑️
															</button>
														</div>
													</div>
												</div>
											</div>
										)
									)}
								</div>
							)}
						</div>

						{/* Vista Previa */}
						<div className="bg-slate-800/50 rounded-lg p-4">
							<h3 className="text-sm font-medium text-slate-300 mb-3">
								📊 Resumen de Descuentos
							</h3>
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
								<div>
									<h4 className="font-medium text-slate-200 mb-2">
										Descuentos Fijos:
									</h4>
									<p className="text-slate-400">
										• Online:{" "}
										{pricing.descuentosGlobales?.descuentoOnline?.valor || 5}%
										<span
											className={
												pricing.descuentosGlobales?.descuentoOnline?.activo
													? "text-green-400 ml-1"
													: "text-red-400 ml-1"
											}
										>
											{pricing.descuentosGlobales?.descuentoOnline?.activo
												? "✅"
												: "❌"}
										</span>
									</p>
									<p className="text-slate-400">
										• Ida y Vuelta:{" "}
										{pricing.descuentosGlobales?.descuentoRoundTrip?.valor ||
											10}
										%
										<span
											className={
												pricing.descuentosGlobales?.descuentoRoundTrip?.activo
													? "text-green-400 ml-1"
													: "text-red-400 ml-1"
											}
										>
											{pricing.descuentosGlobales?.descuentoRoundTrip?.activo
												? "✅"
												: "❌"}
										</span>
									</p>
								</div>
								<div>
									<h4 className="font-medium text-slate-200 mb-2">
										Descuentos Personalizados:
									</h4>
									{pricing.descuentosGlobales?.descuentosPersonalizados
										?.length === 0 ? (
										<p className="text-slate-400">Ninguno configurado</p>
									) : (
										pricing.descuentosGlobales.descuentosPersonalizados.map(
											(desc) => (
												<p key={desc.id} className="text-slate-400">
													• {desc.nombre || "Sin nombre"}: {desc.valor}%
													<span
														className={
															desc.activo
																? "text-green-400 ml-1"
																: "text-red-400 ml-1"
														}
													>
														{desc.activo ? "✅" : "❌"}
													</span>
												</p>
											)
										)
									)}
								</div>
								<div>
									<h4 className="font-medium text-slate-200 mb-2">
										Estado General:
									</h4>
									<p className="text-slate-400">
										Total Descuentos:{" "}
										{(pricing.descuentosGlobales?.descuentosPersonalizados
											?.length || 0) + 2}
									</p>
									<p className="text-slate-400">
										Activos:{" "}
										{
											[
												pricing.descuentosGlobales?.descuentoOnline?.activo,
												pricing.descuentosGlobales?.descuentoRoundTrip?.activo,
												...(pricing.descuentosGlobales?.descuentosPersonalizados?.map(
													(d) => d.activo
												) || []),
											].filter(Boolean).length
										}
									</p>
								</div>
							</div>
						</div>
					</section>

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

							{pricing.destinos && pricing.destinos.length > 0 ? (
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
									al descuento base configurado en "Descuentos Globales".
								</p>
							</div>
							<button
								type="button"
								onClick={handleAddPromotion}
								disabled={!pricing.destinos || pricing.destinos.length === 0}
								className="inline-flex items-center rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
							>
								Añadir Descuento
							</button>
						</div>

						{(!pricing.destinos || pricing.destinos.length === 0) && (
							<p className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-200">
								Primero crea un destino para asociar descuentos.
							</p>
						)}

						{/* Debug info */}
						<div className="text-xs text-gray-400 mb-2">
							Debug: Destinos disponibles: {pricing.destinos?.length || 0}
							{pricing.destinos?.map((d) => d.nombre).join(", ")}
						</div>

						{pricing.dayPromotions && pricing.dayPromotions.length > 0 ? (
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
													<strong>Nota:</strong> Si seleccionas tanto "Solo ida"
													como "Solo vuelta", se convertirá automáticamente en
													"Ida y vuelta".
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
