import { useCallback, useEffect, useState } from "react";

const API_BASE_URL =
        import.meta.env.VITE_API_URL || "https://transportes-araucaria.onrender.com";

const createId = () => {
        if (typeof crypto !== "undefined" && crypto.randomUUID) {
                return crypto.randomUUID();
        }
        return `promo-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const defaultState = {
        basePrice: 0,
        tramoPromotions: [],
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
                        setPricing({
                                basePrice: data.basePrice ?? 0,
                                tramoPromotions: Array.isArray(data.tramoPromotions)
                                        ? data.tramoPromotions
                                        : [],
                                dayPromotions: Array.isArray(data.dayPromotions)
                                        ? data.dayPromotions
                                        : [],
                                updatedAt: data.updatedAt || null,
                        });
                } catch (fetchError) {
                        console.error(fetchError);
                        setError(
                                fetchError.message ||
                                        "Ocurrió un error inesperado al cargar la configuración."
                        );
                } finally {
                        setLoading(false);
                }
        }, []);

        useEffect(() => {
                fetchPricing();
        }, [fetchPricing]);

        useEffect(() => {
                if (!success) return;

                const timeout = setTimeout(() => setSuccess(""), 4000);
                return () => clearTimeout(timeout);
        }, [success]);

        const handleBasePriceChange = (event) => {
                const value = Number(event.target.value);
                setPricing((prev) => ({ ...prev, basePrice: Number.isNaN(value) ? 0 : value }));
        };

        const handleTramoChange = (id, field, value) => {
                setPricing((prev) => ({
                        ...prev,
                        tramoPromotions: prev.tramoPromotions.map((promo) =>
                                promo.id === id ? { ...promo, [field]: value } : promo
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

        const addTramoPromotion = () => {
                setPricing((prev) => ({
                        ...prev,
                        tramoPromotions: [
                                ...prev.tramoPromotions,
                                {
                                        id: createId(),
                                        nombre: "Nuevo tramo",
                                        descripcion: "",
                                        precio: prev.basePrice,
                                },
                        ],
                }));
        };

        const addDayPromotion = () => {
                setPricing((prev) => ({
                        ...prev,
                        dayPromotions: [
                                ...prev.dayPromotions,
                                {
                                        id: createId(),
                                        dia: "Lunes",
                                        descripcion: "",
                                        descuento: 0,
                                },
                        ],
                }));
        };

        const removeTramoPromotion = (id) => {
                setPricing((prev) => ({
                        ...prev,
                        tramoPromotions: prev.tramoPromotions.filter((promo) => promo.id !== id),
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
                                headers: {
                                        "Content-Type": "application/json",
                                },
                                body: JSON.stringify({
                                        basePrice: Number(pricing.basePrice) || 0,
                                        tramoPromotions: pricing.tramoPromotions.map((promo) => ({
                                                ...promo,
                                                precio: Number(promo.precio) || 0,
                                        })),
                                        dayPromotions: pricing.dayPromotions.map((promo) => ({
                                                ...promo,
                                                descuento: Number(promo.descuento) || 0,
                                        })),
                                }),
                        });

                        if (!response.ok) {
                                const errorBody = await response.json().catch(() => ({}));
                                const message =
                                        errorBody?.message ||
                                        "No se pudo guardar la configuración de precios.";
                                throw new Error(message);
                        }

                        const saved = await response.json();
                        setPricing(saved);
                        setSuccess("Configuración guardada correctamente.");
                } catch (submitError) {
                        console.error(submitError);
                        setError(submitError.message || "Ocurrió un error al guardar los cambios.");
                } finally {
                        setSaving(false);
                }
        };

        return (
                <div className="min-h-screen bg-slate-950 text-slate-100">
                        <div className="mx-auto w-full max-w-5xl px-4 py-10">
                                <header className="mb-10">
                                        <h1 className="text-3xl font-semibold text-white">
                                                Panel de tarifas y promociones
                                        </h1>
                                        <p className="mt-2 max-w-3xl text-sm text-slate-300">
                                                Ajusta los valores base y administra promociones por tramo o por día.
                                                Todos los cambios se guardan en el servidor para que puedan ser
                                                consultados por otras herramientas o integraciones.
                                        </p>
                                        {pricing.updatedAt ? (
                                                <p className="mt-3 text-xs text-slate-400">
                                                        Última actualización: {" "}
                                                        {new Date(pricing.updatedAt).toLocaleString()}
                                                </p>
                                        ) : null}
                                </header>

                                <form onSubmit={handleSubmit} className="space-y-10">
                                        <section className="rounded-lg border border-slate-800 bg-slate-900/70 p-6 shadow-lg">
                                                <h2 className="text-xl font-semibold text-white">
                                                        Precio base por defecto
                                                </h2>
                                                <p className="mt-2 text-sm text-slate-300">
                                                        Define un precio base sugerido para tramos sin configuración
                                                        específica.
                                                </p>
                                                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                                                        <label className="text-sm text-slate-300" htmlFor="basePrice">
                                                                Precio base (CLP)
                                                        </label>
                                                        <input
                                                                id="basePrice"
                                                                type="number"
                                                                min="0"
                                                                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white shadow-inner focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 sm:w-60"
                                                                value={pricing.basePrice}
                                                                onChange={handleBasePriceChange}
                                                        />
                                                </div>
                                        </section>

                                        <section className="space-y-6 rounded-lg border border-slate-800 bg-slate-900/70 p-6 shadow-lg">
                                                <div className="flex flex-wrap items-center justify-between gap-4">
                                                        <div>
                                                                <h2 className="text-xl font-semibold text-white">
                                                                        Promociones por tramo
                                                                </h2>
                                                                <p className="mt-2 text-sm text-slate-300">
                                                                        Define tarifas especiales según origen/destino u
                                                                        otros criterios.
                                                                </p>
                                                        </div>
                                                        <button
                                                                type="button"
                                                                onClick={addTramoPromotion}
                                                                className="inline-flex items-center rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow transition hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
                                                        >
                                                                Añadir tramo
                                                        </button>
                                                </div>

                                                <div className="space-y-4">
                                                        {pricing.tramoPromotions.length === 0 ? (
                                                                <p className="text-sm text-slate-400">
                                                                        Aún no has agregado promociones por tramo.
                                                                </p>
                                                        ) : (
                                                                pricing.tramoPromotions.map((promo) => (
                                                                        <div
                                                                                key={promo.id}
                                                                                className="rounded-md border border-slate-800 bg-slate-950/60 p-4"
                                                                        >
                                                                                <div className="flex flex-col gap-3 sm:grid sm:grid-cols-2 sm:gap-4">
                                                                                        <label className="text-sm text-slate-300">
                                                                                                Nombre del tramo
                                                                                                <input
                                                                                                        type="text"
                                                                                                        value={promo.nombre || ""}
                                                                                                        onChange={(event) =>
                                                                                                                handleTramoChange(
                                                                                                                        promo.id,
                                                                                                                        "nombre",
                                                                                                                        event.target.value
                                                                                                                )
                                                                                                        }
                                                                                                        className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                                                                                                />
                                                                                        </label>
                                                                                        <label className="text-sm text-slate-300">
                                                                                                Precio fijo (CLP)
                                                                                                <input
                                                                                                        type="number"
                                                                                                        min="0"
                                                                                                        value={promo.precio ?? 0}
                                                                                                        onChange={(event) =>
                                                                                                                handleTramoChange(
                                                                                                                        promo.id,
                                                                                                                        "precio",
                                                                                                                        Number(event.target.value)
                                                                                                                )
                                                                                                        }
                                                                                                        className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                                                                                                />
                                                                                        </label>
                                                                                        <label className="sm:col-span-2 text-sm text-slate-300">
                                                                                                Descripción u observaciones
                                                                                                <textarea
                                                                                                        value={promo.descripcion || ""}
                                                                                                        onChange={(event) =>
                                                                                                                handleTramoChange(
                                                                                                                        promo.id,
                                                                                                                        "descripcion",
                                                                                                                        event.target.value
                                                                                                                )
                                                                                                        }
                                                                                                        rows={2}
                                                                                                        className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                                                                                                />
                                                                                        </label>
                                                                                </div>
                                                                                <div className="mt-4 flex justify-end">
                                                                                        <button
                                                                                                type="button"
                                                                                                onClick={() => removeTramoPromotion(promo.id)}
                                                                                                className="rounded-md border border-red-400 px-3 py-1 text-xs font-semibold text-red-200 transition hover:bg-red-500/10 focus:outline-none focus:ring-2 focus:ring-red-500/40"
                                                                                        >
                                                                                                Eliminar tramo
                                                                                        </button>
                                                                                </div>
                                                                        </div>
                                                                ))
                                                        )}
                                                </div>
                                        </section>

                                        <section className="space-y-6 rounded-lg border border-slate-800 bg-slate-900/70 p-6 shadow-lg">
                                                <div className="flex flex-wrap items-center justify-between gap-4">
                                                        <div>
                                                                <h2 className="text-xl font-semibold text-white">
                                                                        Promociones por día
                                                                </h2>
                                                                <p className="mt-2 text-sm text-slate-300">
                                                                        Configura descuentos para días específicos de la semana o rangos.
                                                                </p>
                                                        </div>
                                                        <button
                                                                type="button"
                                                                onClick={addDayPromotion}
                                                                className="inline-flex items-center rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow transition hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
                                                        >
                                                                Añadir promoción por día
                                                        </button>
                                                </div>

                                                <div className="space-y-4">
                                                        {pricing.dayPromotions.length === 0 ? (
                                                                <p className="text-sm text-slate-400">
                                                                        No existen promociones por día configuradas.
                                                                </p>
                                                        ) : (
                                                                pricing.dayPromotions.map((promo) => (
                                                                        <div
                                                                                key={promo.id}
                                                                                className="rounded-md border border-slate-800 bg-slate-950/60 p-4"
                                                                        >
                                                                                <div className="flex flex-col gap-3 sm:grid sm:grid-cols-2 sm:gap-4">
                                                                                        <label className="text-sm text-slate-300">
                                                                                                Día o rango
                                                                                                <select
                                                                                                        value={promo.dia || ""}
                                                                                                        onChange={(event) =>
                                                                                                                handleDayChange(
                                                                                                                        promo.id,
                                                                                                                        "dia",
                                                                                                                        event.target.value
                                                                                                                )
                                                                                                        }
                                                                                                        className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                                                                                                >
                                                                                                        <option value="">Personalizado</option>
                                                                                                        {daysOfWeek.map((day) => (
                                                                                                                <option key={day} value={day}>
                                                                                                                        {day}
                                                                                                                </option>
                                                                                                        ))}
                                                                                                        <option value="Fin de semana">Fin de semana</option>
                                                                                                        <option value="Feriados">Feriados</option>
                                                                                                </select>
                                                                                        </label>
                                                                                        <label className="text-sm text-slate-300">
                                                                                                Descuento (%)
                                                                                                <input
                                                                                                        type="number"
                                                                                                        min="0"
                                                                                                        max="100"
                                                                                                        value={promo.descuento ?? 0}
                                                                                                        onChange={(event) =>
                                                                                                                handleDayChange(
                                                                                                                        promo.id,
                                                                                                                        "descuento",
                                                                                                                        Number(event.target.value)
                                                                                                                )
                                                                                                        }
                                                                                                        className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                                                                                                />
                                                                                        </label>
                                                                                        <label className="sm:col-span-2 text-sm text-slate-300">
                                                                                                Detalles de la promoción
                                                                                                <textarea
                                                                                                        value={promo.descripcion || ""}
                                                                                                        onChange={(event) =>
                                                                                                                handleDayChange(
                                                                                                                        promo.id,
                                                                                                                        "descripcion",
                                                                                                                        event.target.value
                                                                                                                )
                                                                                                        }
                                                                                                        rows={2}
                                                                                                        className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                                                                                                />
                                                                                        </label>
                                                                                </div>
                                                                                <div className="mt-4 flex justify-end">
                                                                                        <button
                                                                                                type="button"
                                                                                                onClick={() => removeDayPromotion(promo.id)}
                                                                                                className="rounded-md border border-red-400 px-3 py-1 text-xs font-semibold text-red-200 transition hover:bg-red-500/10 focus:outline-none focus:ring-2 focus:ring-red-500/40"
                                                                                        >
                                                                                                Eliminar promoción
                                                                                        </button>
                                                                                </div>
                                                                        </div>
                                                                ))
                                                        )}
                                                </div>
                                        </section>

                                        <footer className="flex flex-col gap-4 border-t border-slate-800 pt-6 sm:flex-row sm:items-center sm:justify-between">
                                                <div className="flex items-center gap-3 text-sm">
                                                        <button
                                                                type="button"
                                                                onClick={fetchPricing}
                                                                className="rounded-md border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500/40"
                                                                disabled={loading || saving}
                                                        >
                                                                Descartar cambios
                                                        </button>
                                                        <span className="text-xs text-slate-500">
                                                                Recarga la información desde el servidor
                                                        </span>
                                                </div>
                                                <button
                                                        type="submit"
                                                        disabled={saving || loading}
                                                        className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-500 px-6 py-2 text-sm font-semibold text-slate-950 shadow transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-500/60"
                                                >
                                                        {saving ? "Guardando..." : "Guardar cambios"}
                                                </button>
                                        </footer>
                                </form>

                                {loading ? (
                                        <div className="mt-6 rounded-md border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-300">
                                                Cargando información de tarifas...
                                        </div>
                                ) : null}

                                {error ? (
                                        <div className="mt-6 rounded-md border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
                                                {error}
                                        </div>
                                ) : null}

                                {success ? (
                                        <div className="mt-6 rounded-md border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-200">
                                                {success}
                                        </div>
                                ) : null}
                        </div>
                </div>
        );
}

export default AdminPricing;
