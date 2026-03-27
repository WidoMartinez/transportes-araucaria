/**
 * AdminExportadorPrecios.jsx
 *
 * Componente para exportar e imprimir la lista completa de precios por tramo,
 * con tarifa dinámica incluida, calculados para una fecha específica.
 *
 * Llama a POST /api/cotizar para cada combinación destino × pasajeros
 * y muestra los precios reales que vería el pasajero en esa fecha.
 */

import { useState, useCallback, useRef } from "react";
import * as XLSX from "xlsx";
import { getBackendUrl } from "../lib/backend";
import { Loader2, Printer, RefreshCw, FileSpreadsheet } from "lucide-react";

// URL base del backend
const API_BASE_URL =
	getBackendUrl() || "https://transportes-araucaria.onrender.com";

// Máximo de pasajeros por defecto — consistente con el backend (defaultValue: 4 en BD)
const MAX_PAX_ABSOLUTO = 4;

/**
 * Formatea un número como precio en CLP.
 * @param {number|null} valor
 */
const formatPrecio = (valor) => {
	if (valor == null || valor === 0) return "—";
	return new Intl.NumberFormat("es-CL", {
		style: "currency",
		currency: "CLP",
		minimumFractionDigits: 0,
	}).format(valor);
};

/**
 * Formatea minutos como "X h Y min" o "Y min".
 * @param {number|null} minutos
 */
const formatDuracion = (minutos) => {
	if (!minutos || minutos <= 0) return null;
	const h = Math.floor(minutos / 60);
	const m = minutos % 60;
	if (h > 0 && m > 0) return `${h} h ${m} min`;
	if (h > 0) return `${h} h`;
	return `${m} min`;
};

/**
 * Escapa texto para seguridad al mostrarlo.
 * @param {string} texto
 */
const escapar = (texto) =>
	String(texto ?? "").replace(
		/[<>"'&]/g,
		(c) =>
			({
				"<": "&lt;",
				">": "&gt;",
				'"': "&quot;",
				"'": "&#39;",
				"&": "&amp;",
			})[c],
	);

// ─── Componente principal ──────────────────────────────────────────────────────

function AdminExportadorPrecios({ destinos = [] }) {
	// Fecha por defecto: hoy en formato YYYY-MM-DD
	const hoyStr = new Date().toISOString().slice(0, 10);

	const [fecha, setFecha] = useState(hoyStr);
	const [hora, setHora] = useState("10:00");
	const [idaVuelta, setIdaVuelta] = useState(false);
	const [cargando, setCargando] = useState(false);
	const [precios, setPrecios] = useState(null); // { [destino]: { [pax]: resultado } }
	const [error, setError] = useState("");
	const tablaRef = useRef(null);

	// Tramos seleccionados para exportar/imprimir (null = todos)
	const [tramosSeleccionados, setTramosSeleccionados] = useState(null);

	/**
	 * Alterna la selección de un tramo. null significa "todos".
	 */
	const toggleTramo = (nombre) => {
		setTramosSeleccionados((prev) => {
			// Si estaba en modo "todos", inicializar con todos menos el clickeado desactivado
			const activos = prev ?? destinosActivos.map((d) => d.nombre);
			if (activos.includes(nombre)) {
				const nuevo = activos.filter((n) => n !== nombre);
				// Si quedan todos activos de nuevo, volver a null
				return nuevo.length === destinosActivos.length ? null : nuevo;
			}
			const nuevo = [...activos, nombre];
			return nuevo.length === destinosActivos.length ? null : nuevo;
		});
	};

	const seleccionarTodos = () => setTramosSeleccionados(null);
	const deseleccionarTodos = () => setTramosSeleccionados([]);

	/**
	 * Genera y descarga un archivo .xlsx con los precios calculados.
	 * Solo incluye los tramos seleccionados.
	 */
	const exportarXLSX = () => {
		if (!precios) return;
		const wb = XLSX.utils.book_new();
		const tramosAExportar = destinosActivos.filter(
			(d) =>
				tramosSeleccionados === null || tramosSeleccionados.includes(d.nombre),
		);

		// Una hoja por destino
		for (const dest of tramosAExportar) {
			const dataDest = precios[dest.nombre] || {};
			const maxPax = dest.maxPasajeros || MAX_PAX_ABSOLUTO;
			const durIda = formatDuracion(dest.duracionIdaMinutos);
			const durVuelta = formatDuracion(dest.duracionVueltaMinutos);

			// Cabecera informativa
			const infoFilas = [
				[`Tramo: ${dest.nombre}`],
				[`Fecha: ${fecha}${hora ? ` a las ${hora}` : ""}`],
			];
			if (durIda) infoFilas.push([`Duración ida: ${durIda}`]);
			if (idaVuelta && durVuelta)
				infoFilas.push([`Duración vuelta: ${durVuelta}`]);
			infoFilas.push([]);

			// Columnas
			const colHeaders = [
				"Pasajeros",
				"Vehículo",
				"Precio base",
				"Solo ida (con tarifa dinámica)",
				"Solo ida (con descuento online)",
				"+Upgrade Van (extra s/sedán, 1-3 pax)",
			];
			if (idaVuelta) {
				colHeaders.push("Ida y vuelta (con tarifa dinámica)");
				colHeaders.push("Ida y vuelta (con todos los dtos.)");
			}

			const filasDatos = [];
			for (let pax = 1; pax <= maxPax; pax++) {
				const d = dataDest[pax];
				if (!d) continue;
				// Diferencia upgrade van: precio van con tarifa - precio sedán con tarifa
				const pctTotalXLSX = d.tarifaDinamica?.ida?.porcentajeTotal ?? 0;
				const soloIdaXLSX =
					d.tarifaDinamica?.ida?.precioAjustado ?? d.precioBase ?? 0;
				const precioUpgradeXLSX =
					pax <= 3 && dest.precios?.van?.base
						? Math.round(dest.precios.van.base * (1 + pctTotalXLSX / 100)) -
							soloIdaXLSX
						: "";
				const fila = [
					pax,
					d.vehiculo ?? "",
					d.precioBase ?? 0,
					d.tarifaDinamica?.ida?.precioAjustado ?? d.precioBase ?? 0,
					d.totalConDescuento ?? 0,
					precioUpgradeXLSX,
				];
				if (idaVuelta) {
					const precioIVTD =
						(d.tarifaDinamica?.ida?.precioAjustado ?? d.precioBase ?? 0) +
						(d.tarifaDinamica?.vuelta?.precioAjustado ?? d.precioBase ?? 0);
					fila.push(precioIVTD);
					fila.push(
						d.preciosRoundTrip?.totalConDescuento ||
							(d.totalConDescuento
								? Math.round(d.totalConDescuento * 2 * 0.9)
								: 0),
					);
				}
				filasDatos.push(fila);
			}

			// Construir hoja de cálculo
			const wsData = [...infoFilas, colHeaders, ...filasDatos];
			const ws = XLSX.utils.aoa_to_sheet(wsData);

			// Ancho de columnas aproximado
			ws["!cols"] = [10, 24, 16, 32, 32, 34, 34, 14].map((w) => ({ wch: w }));

			// Nombre de hoja (máx 31 chars, sin caracteres especiales)
			const nombreHoja = dest.nombre.replace(/[[\]*?:/\\]/g, "-").slice(0, 31);
			XLSX.utils.book_append_sheet(wb, ws, nombreHoja);
		}

		// Nombre del archivo
		const nombreArchivo = `tarifas_araucania_${fecha}.xlsx`;
		XLSX.writeFile(wb, nombreArchivo);
	};

	/**
	 * Llama a POST /api/cotizar para cada combinación destino × pasajeros.
	 * Ejecuta las peticiones en paralelo para mayor velocidad.
	 */
	const calcularPrecios = useCallback(async () => {
		if (!fecha) {
			setError("Selecciona una fecha para calcular los precios.");
			return;
		}
		if (!destinos || destinos.length === 0) {
			setError(
				"No hay destinos disponibles. Asegúrate de que los destinos estén cargados.",
			);
			return;
		}

		setCargando(true);
		setError("");
		setPrecios(null);

		try {
			// Construir todas las combinaciones a consultar
			const combinaciones = [];

			for (const dest of destinos) {
				if (!dest.activo) continue;

				// Usar maxPasajeros real del destino (puede ser 7, 8, etc.)
				const maxPax = dest.maxPasajeros || MAX_PAX_ABSOLUTO;
				for (let pax = 1; pax <= maxPax; pax++) {
					combinaciones.push({
						destino: dest.nombre,
						pasajeros: pax,
					});
				}
			}

			// Ejecutar todas las consultas en paralelo (lotes de 10 para no saturar)
			const TAMANO_LOTE = 10;
			const resultados = {};

			for (let i = 0; i < combinaciones.length; i += TAMANO_LOTE) {
				const lote = combinaciones.slice(i, i + TAMANO_LOTE);

				const promesas = lote.map(async ({ destino, pasajeros }) => {
					try {
						const resp = await fetch(`${API_BASE_URL}/api/cotizar`, {
							method: "POST",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({
								origen: "Aeropuerto La Araucanía",
								destino,
								pasajeros,
								fecha,
								hora: hora || undefined,
								idaVuelta,
								fechaRegreso: idaVuelta ? fecha : undefined,
								horaRegreso: idaVuelta && hora ? hora : undefined,
								upgradeVan: false,
							}),
						});

						if (!resp.ok) return { destino, pasajeros, error: true };

						const data = await resp.json();
						return { destino, pasajeros, data };
					} catch {
						return { destino, pasajeros, error: true };
					}
				});

				const resultadosLote = await Promise.all(promesas);

				for (const r of resultadosLote) {
					if (!resultados[r.destino]) resultados[r.destino] = {};
					resultados[r.destino][r.pasajeros] = r.error ? null : r.data;
				}
			}

			setPrecios(resultados);
		} catch (err) {
			setError(
				"Error al calcular precios: " + (err.message || "error desconocido"),
			);
		} finally {
			setCargando(false);
		}
	}, [fecha, hora, idaVuelta, destinos]);

	/**
	 * Abre una ventana nueva con solo el contenido del reporte y dispara la impresión.
	 * Esto evita el problema de que body > * { display:none } oculte también el #root.
	 */
	const imprimir = () => {
		const nodo = tablaRef.current;
		if (!nodo) return;

		// Capturar los estilos base del documento (Tailwind + demás hojas)
		const estilosGlobales = Array.from(document.styleSheets)
			.map((hoja) => {
				try {
					return Array.from(hoja.cssRules)
						.map((r) => r.cssText)
						.join("\n");
				} catch {
					// Hojas externas (CORS) se ignoran con seguridad
					return "";
				}
			})
			.join("\n");

		const ventana = window.open("", "_blank", "width=900,height=700");
		if (!ventana) {
			setError(
				"El navegador bloqueó la ventana emergente. Permite pop-ups para este sitio.",
			);
			return;
		}

		ventana.document.write(`
			<!DOCTYPE html>
			<html lang="es">
			<head>
				<meta charset="UTF-8" />
				<title>Lista de Precios Transportes Araucanía</title>
				<style>
					${estilosGlobales}
					body { background: white; color: black; font-family: sans-serif; padding: 20px; }
					table { width: 100%; border-collapse: collapse; font-size: 11px; }
					th, td { border: 1px solid #999; padding: 4px 7px; text-align: right; }
					th { background: #f0f0f0; font-weight: bold; }
					td:first-child, th:first-child { text-align: left; }
					.badge-recargo { color: #c00; font-weight: bold; }
					.badge-descuento { color: #060; font-weight: bold; }
					.nota-pie { font-size: 9px; color: #555; margin-top: 8px; }
					@media print { body { padding: 0; } }
				</style>
			</head>
			<body>${nodo.innerHTML}</body>
			</html>
		`);
		ventana.document.close();
		ventana.focus();
		// Pequeño delay para que carguen los estilos antes de imprimir
		setTimeout(() => {
			ventana.print();
			ventana.close();
		}, 400);
	};

	// Destinos activos
	const destinosActivos = destinos.filter((d) => d.activo);

	// Destinos que se muestran según la selección
	const destinosMostrar = destinosActivos.filter(
		(d) =>
			tramosSeleccionados === null || tramosSeleccionados.includes(d.nombre),
	);

	// Formatea la fecha para mostrar en el encabezado del reporte
	const fechaFormateada = fecha
		? new Date(fecha + "T12:00:00").toLocaleDateString("es-CL", {
				weekday: "long",
				year: "numeric",
				month: "long",
				day: "numeric",
			})
		: "";

	return (
		<>
			{/* Los estilos de impresión ya no se necesitan aquí:
			     el botón "Imprimir" abre una ventana nueva con el contenido,
			     evitando que body > * oculte el #root de React. */}

			{/* ────────── Panel de control (no se imprime) ────────── */}
			<section className="rounded-lg border border-slate-700 bg-slate-900/60 p-6 space-y-4 no-print">
				<div className="flex items-center gap-3">
					<Printer className="h-5 w-5 text-chocolate-400" />
					<h2 className="text-xl font-semibold text-white">
						Lista de Precios por Fecha (con Tarifa Dinámica)
					</h2>
				</div>

				<p className="text-sm text-slate-400">
					Selecciona una fecha y hora para calcular los precios reales que se
					mostrarían al pasajero en ese momento, incluyendo todos los ajustes de
					tarifa dinámica (anticipación, día de semana, horario, festivos).
				</p>

				{/* Controles */}
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
					{/* Fecha */}
					<div>
						<label className="block mb-1 text-sm text-slate-300">
							Fecha del viaje *
						</label>
						<input
							type="date"
							value={fecha}
							onChange={(e) => setFecha(e.target.value)}
							min={hoyStr}
							className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-white focus:border-chocolate-500 focus:outline-none"
						/>
					</div>

					{/* Hora */}
					<div>
						<label className="block mb-1 text-sm text-slate-300">
							Hora del viaje (opcional)
						</label>
						<input
							type="time"
							value={hora}
							onChange={(e) => setHora(e.target.value)}
							className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-white focus:border-chocolate-500 focus:outline-none"
						/>
					</div>

					{/* Tipo de viaje */}
					<div className="flex flex-col justify-end">
						<label className="inline-flex items-center gap-2 cursor-pointer">
							<input
								type="checkbox"
								checked={idaVuelta}
								onChange={(e) => setIdaVuelta(e.target.checked)}
								className="rounded border-slate-600 bg-slate-700 text-chocolate-500 focus:ring-chocolate-500"
							/>
							<span className="text-sm text-slate-300">
								Calcular también ida y vuelta
							</span>
						</label>
						<p className="mt-1 text-xs text-slate-500">
							Si está activo, muestra el precio del viaje de regreso en la misma
							fecha.
						</p>
					</div>
				</div>

				{/* Botones */}
				<div className="flex flex-wrap gap-3">
					<button
						type="button"
						onClick={calcularPrecios}
						disabled={cargando || !fecha}
						className="flex items-center gap-2 rounded-md bg-chocolate-600 px-4 py-2 text-sm font-medium text-white hover:bg-chocolate-700 disabled:opacity-50"
					>
						{cargando ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : (
							<RefreshCw className="h-4 w-4" />
						)}
						{cargando ? "Calculando…" : "Calcular precios"}
					</button>

					{precios && (
						<>
							<button
								type="button"
								onClick={imprimir}
								className="flex items-center gap-2 rounded-md bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600 border border-slate-600"
							>
								<Printer className="h-4 w-4" />
								Imprimir / Guardar PDF
							</button>
							<button
								type="button"
								onClick={exportarXLSX}
								disabled={destinosMostrar.length === 0}
								className="flex items-center gap-2 rounded-md bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-600 disabled:opacity-50"
							>
								<FileSpreadsheet className="h-4 w-4" />
								Exportar .xlsx
							</button>
						</>
					)}
				</div>

				{/* Selector de tramos */}
				{precios && destinosActivos.length > 1 && (
					<div className="mt-2 rounded-md border border-slate-700 bg-slate-800/60 p-3">
						<div className="flex items-center justify-between mb-2">
							<span className="text-xs font-medium text-slate-300">
								Tramos a incluir en impresión / exportación:
							</span>
							<div className="flex gap-2">
								<button
									type="button"
									onClick={seleccionarTodos}
									className="text-xs text-slate-400 hover:text-white underline"
								>
									Todos
								</button>
								<button
									type="button"
									onClick={deseleccionarTodos}
									className="text-xs text-slate-400 hover:text-white underline"
								>
									Ninguno
								</button>
							</div>
						</div>
						<div className="flex flex-wrap gap-2">
							{destinosActivos.map((d) => {
								const activo =
									tramosSeleccionados === null ||
									tramosSeleccionados.includes(d.nombre);
								return (
									<label
										key={d.nombre}
										className="inline-flex items-center gap-1.5 cursor-pointer"
									>
										<input
											type="checkbox"
											checked={activo}
											onChange={() => toggleTramo(d.nombre)}
											className="rounded border-slate-600 bg-slate-700 text-chocolate-500 focus:ring-chocolate-500"
										/>
										<span
											className={`text-xs ${
												activo ? "text-white" : "text-slate-500"
											}`}
										>
											{d.nombre}
										</span>
									</label>
								);
							})}
						</div>
					</div>
				)}

				{/* Error */}
				{error && (
					<div className="rounded-md bg-red-900/50 px-4 py-3 text-sm text-red-200">
						{error}
					</div>
				)}
			</section>

			{/* ────────── Sección de impresión ────────── */}
			{precios && (
				<div
					id="seccion-impresion-precios"
					ref={tablaRef}
					className="mt-6 rounded-lg border border-slate-700 bg-white text-gray-900 p-6"
				>
					{/* Encabezado del reporte */}
					<div className="mb-6 border-b border-gray-200 pb-4">
						<div className="flex items-start justify-between">
							<div>
								<h2 className="text-xl font-bold text-gray-900">
									Transportes Araucanía — Lista de Precios
								</h2>
								<p className="text-sm text-gray-600 mt-1">
									Precios calculados con tarifa dinámica para:
									<strong> {fechaFormateada}</strong>
									{hora && ` a las ${hora}`}
								</p>
								{idaVuelta && (
									<span className="inline-block mt-1 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
										Incluye precio ida y vuelta (misma fecha)
									</span>
								)}
							</div>
							<div className="text-right text-xs text-gray-500">
								<p>Generado: {new Date().toLocaleString("es-CL")}</p>
								<p className="text-gray-400">Precios en pesos chilenos (CLP)</p>
							</div>
						</div>
					</div>

					{/* Tablas por destino — solo los seleccionados */}
					{destinosMostrar.map((dest, idx) => {
						const dataDest = precios[dest.nombre] || {};
						const tieneAjuste = Object.values(dataDest).some(
							(d) =>
								d?.tarifaDinamica?.ida?.ajustes?.length > 0 ||
								d?.tarifaDinamica?.vuelta?.ajustes?.length > 0,
						);

						// Obtener el primer resultado para mostrar info de tarifa dinámica
						const primerResultado = Object.values(dataDest).find((d) => d);
						const ajustesIda =
							primerResultado?.tarifaDinamica?.ida?.ajustes || [];
						return (
							<div key={dest.nombre} className={idx > 0 ? "mt-8" : ""}>
								{/* Nombre del destino */}
								<div className="flex items-baseline gap-3 mb-2">
									<h3 className="font-bold text-gray-900 text-base">
										{escapar(dest.nombre)}
									</h3>
									{/* Duración real desde duracionIdaMinutos / duracionVueltaMinutos */}
									{dest.duracionIdaMinutos || dest.duracionVueltaMinutos ? (
										<span className="text-xs text-gray-500">
											⏱ {formatDuracion(dest.duracionIdaMinutos) ?? "—"}
											{idaVuelta &&
												dest.duracionVueltaMinutos &&
												dest.duracionVueltaMinutos !==
													dest.duracionIdaMinutos &&
												` / vuelta: ${formatDuracion(dest.duracionVueltaMinutos)}`}
										</span>
									) : dest.tiempo ? (
										<span className="text-xs text-gray-500">
											⏱ {escapar(dest.tiempo)}
										</span>
									) : null}
									{tieneAjuste && (
										<span className="text-xs font-medium text-orange-600">
											⚡ Tarifa dinámica activa
										</span>
									)}
								</div>

								{/* Descripción de ajustes de tarifa dinámica — filtra ajustes con nombre vacío */}
								{ajustesIda.filter((a) => a.nombre?.trim()).length > 0 && (
									<div className="mb-2 rounded bg-amber-50 border border-amber-200 px-3 py-1.5 text-xs text-amber-800">
										<span className="font-semibold">Ajustes aplicados: </span>
										{ajustesIda
											.filter((a) => a.nombre?.trim())
											.map((a, i) => (
												<span key={`${a.nombre}-${i}`} className="mr-2">
													{a.nombre}
													{a.porcentaje !== 0 && (
														<span
															className={
																a.porcentaje > 0
																	? "badge-recargo ml-1"
																	: "badge-descuento ml-1"
															}
														>
															({a.porcentaje > 0 ? "+" : ""}
															{a.porcentaje}%)
														</span>
													)}
												</span>
											))}
									</div>
								)}

								{/* Tabla de precios */}
								<div className="overflow-x-auto">
									{/* Info de porcentajes adicionales por vehículo */}
									{(dest.precios?.auto?.porcentajeAdicional != null ||
										dest.precios?.van?.porcentajeAdicional != null) && (
										<div className="mb-1 flex flex-wrap gap-x-5 text-xs text-gray-500">
											{dest.precios?.auto?.porcentajeAdicional != null && (
												<span>
													🚗 Sedán: base 1 pax, +
													<strong>
														{Math.round(
															dest.precios.auto.porcentajeAdicional * 100,
														)}
														%
													</strong>{" "}
													por cada pax adicional (2.°, 3.°)
												</span>
											)}
											{dest.precios?.van?.porcentajeAdicional != null && (
												<span>
													🚐 Van: base 4 pax, +
													<strong>
														{Math.round(
															dest.precios.van.porcentajeAdicional * 100,
														)}
														%
													</strong>{" "}
													por cada pax adicional (5.°, 6.°…)
												</span>
											)}
										</div>
									)}
									<table className="w-full text-sm border border-gray-200">
										<thead>
											<tr className="bg-gray-100">
												<th className="border border-gray-200 px-3 py-2 text-left font-semibold text-gray-700">
													Pasajeros
												</th>
												<th className="border border-gray-200 px-3 py-2 text-right font-semibold text-gray-700">
													Vehículo
												</th>
												<th className="border border-gray-200 px-3 py-2 text-right font-semibold text-gray-700">
													Precio base
												</th>
												<th className="border border-gray-200 px-3 py-2 text-right font-semibold text-gray-700 bg-amber-50">
													Solo ida
													<br />
													<span className="text-xs font-normal text-amber-700">
														(con tarifa dinámica)
													</span>
												</th>
												<th className="border border-gray-200 px-3 py-2 text-right font-semibold text-gray-700 bg-green-50">
													Solo ida
													<br />
													<span className="text-xs font-normal text-green-700">
														(con descuento online)
													</span>
												</th>
												{idaVuelta && (
													<>
														<th className="border border-gray-200 px-3 py-2 text-right font-semibold text-gray-700 bg-blue-50">
															Ida y vuelta
															<br />
															<span className="text-xs font-normal text-blue-700">
																(con tarifa dinámica)
															</span>
														</th>
														<th className="border border-gray-200 px-3 py-2 text-right font-semibold text-gray-700 bg-purple-50">
															Ida y vuelta
															<br />
															<span className="text-xs font-normal text-purple-700">
																(con todos los dtos.)
															</span>
														</th>
													</>
												)}
												<th className="border border-gray-200 px-3 py-2 text-right font-semibold text-gray-700 bg-orange-50">
													+Upgrade Van
													<br />
													<span className="text-xs font-normal text-orange-600">
														(extra s/sedán, 1–3 pax)
													</span>
												</th>
											</tr>
										</thead>
										<tbody>
											{Array.from(
												{ length: dest.maxPasajeros || MAX_PAX_ABSOLUTO },
												(_, i) => i + 1,
											).map((pax) => {
												const d = dataDest[pax];
												if (!d) {
													return (
														<tr key={pax} className="border-b border-gray-100">
															<td className="border border-gray-200 px-3 py-2">
																{pax} pax
															</td>
															<td
																colSpan={idaVuelta ? 7 : 5}
																className="border border-gray-200 px-3 py-2 text-center text-gray-400 text-xs"
															>
																No disponible
															</td>
														</tr>
													);
												}

												// Extracción de datos del resultado de /api/cotizar
												const precioBase = d.precioBaseIda || d.precioBase || 0;
												// precioAjustado = precio de ida tras aplicar tarifa dinámica
												const soloIda =
													d.tarifaDinamica?.ida?.precioAjustado ??
													d.precioBase ??
													0;
												const totalConDto = d.totalConDescuento ?? soloIda;

												// Para ida y vuelta
												const ida2 = d.tarifaDinamica?.ida?.precioAjustado ?? 0;
												const vuelta2 =
													d.tarifaDinamica?.vuelta?.precioAjustado ?? 0;
												const totalIdaVuelta = idaVuelta
													? ida2 + vuelta2 || (d.precioBase ?? 0)
													: 0;
												const totalIdaVueltaConDto = idaVuelta
													? (d.totalConDescuento ?? totalIdaVuelta)
													: 0;

												// Porcentaje de variación respecto al precio base
												const variacion =
													precioBase > 0
														? ((soloIda - precioBase) / precioBase) * 100
														: 0;

												return (
													<tr
														key={pax}
														className={`border-b border-gray-100 ${pax >= 4 ? "bg-slate-50" : ""}`}
													>
														{/* Pasajeros + indicador de % adicional cuando aplica */}
														<td className="border border-gray-200 px-3 py-2 font-medium">
															{pax} {pax === 1 ? "pasajero" : "pasajeros"}
															{/* Mostrar % adicional solo en pasajeros que generan recargo */}
															{pax >= 2 &&
															pax <= 3 &&
															dest.precios?.auto?.porcentajeAdicional ? (
																<span className="ml-1 text-xs text-blue-500 font-normal">
																	(+
																	{Math.round(
																		dest.precios.auto.porcentajeAdicional *
																			100 *
																			(pax - 1),
																	)}
																	% sobre base)
																</span>
															) : null}
															{pax >= 5 &&
															dest.precios?.van?.porcentajeAdicional ? (
																<span className="ml-1 text-xs text-purple-500 font-normal">
																	(+
																	{Math.round(
																		dest.precios.van.porcentajeAdicional *
																			100 *
																			(pax - 4),
																	)}
																	% sobre base van)
																</span>
															) : null}
														</td>

														{/* Vehículo */}
														<td className="border border-gray-200 px-3 py-2 text-right text-gray-600">
															{d.vehiculo || (pax <= 3 ? "Sedán" : "Van")}
														</td>

														{/* Precio base */}
														<td className="border border-gray-200 px-3 py-2 text-right text-gray-500">
															{formatPrecio(precioBase)}
														</td>

														{/* Solo ida con tarifa dinámica */}
														<td className="border border-gray-200 px-3 py-2 text-right font-semibold bg-amber-50">
															{formatPrecio(soloIda)}
															{Math.abs(variacion) >= 0.5 && (
																<span
																	className={`ml-1 text-xs ${
																		variacion > 0
																			? "badge-recargo text-red-600"
																			: "badge-descuento text-green-600"
																	}`}
																>
																	({variacion > 0 ? "+" : ""}
																	{variacion.toFixed(0)}%)
																</span>
															)}
														</td>

														{/* Solo ida con descuento online */}
														<td className="border border-gray-200 px-3 py-2 text-right font-semibold text-green-700 bg-green-50">
															{idaVuelta ? "—" : formatPrecio(totalConDto)}
														</td>

														{/* Upgrade Van: diferencia a pagar sobre el sedán, solo para 1-3 pax */}
														{(() => {
															const pctTotal =
																d.tarifaDinamica?.ida?.porcentajeTotal ?? 0;
															const vanBase = dest.precios?.van?.base;
															// soloIda = precio sedán con tarifa dinámica aplicada
															const soloIda =
																d.tarifaDinamica?.ida?.precioAjustado ??
																d.precioBase ??
																0;
															const precioUpgrade =
																pax <= 3 && vanBase
																	? Math.round(vanBase * (1 + pctTotal / 100)) -
																		soloIda
																	: null;
															return (
																<td className="border border-gray-200 px-3 py-2 text-right bg-orange-50">
																	{precioUpgrade != null ? (
																		formatPrecio(precioUpgrade)
																	) : (
																		<span className="text-gray-300">—</span>
																	)}
																</td>
															);
														})()}

														{/* Ida y vuelta */}
														{idaVuelta && (
															<>
																<td className="border border-gray-200 px-3 py-2 text-right font-semibold bg-blue-50">
																	{formatPrecio(totalIdaVuelta)}
																</td>
																<td className="border border-gray-200 px-3 py-2 text-right font-semibold text-purple-700 bg-purple-50">
																	{formatPrecio(totalIdaVueltaConDto)}
																</td>
															</>
														)}
													</tr>
												);
											})}
										</tbody>
									</table>
								</div>

								{/* Leyenda de descuentos del destino */}
								{primerResultado?.descuentos && (
									<div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 nota-pie">
										{primerResultado.descuentos.online > 0 && (
											<span>
												✓ Dto. online:{" "}
												{formatPrecio(primerResultado.descuentos.online)}
											</span>
										)}
										{primerResultado.descuentos.roundTrip > 0 && (
											<span>
												✓ Dto. ida y vuelta:{" "}
												{formatPrecio(primerResultado.descuentos.roundTrip)}
											</span>
										)}
										{primerResultado.descuentos.personalizados > 0 && (
											<span>
												✓ Dto. personalizados:{" "}
												{formatPrecio(
													primerResultado.descuentos.personalizados,
												)}
											</span>
										)}
										{primerResultado.descuentos.promocion > 0 && (
											<span>
												✓ Promoción activa:{" "}
												{formatPrecio(primerResultado.descuentos.promocion)}
											</span>
										)}
									</div>
								)}
							</div>
						);
					})}

					{/* Pie de página del reporte */}
					<div className="mt-8 border-t border-gray-200 pt-4 text-xs text-gray-400 nota-pie">
						<p>
							* Los precios incluyen tarifa dinámica calculada para la fecha y
							hora indicadas. El precio final puede variar si el pasajero
							ingresa en un horario distinto o aplica un código de descuento.
						</p>
						<p className="mt-1">
							* El abono corresponde al 40% del precio con descuentos. El saldo
							restante se paga en destino.
						</p>
						<p className="mt-1">
							Transportes Araucanía — {new Date().getFullYear()}
						</p>
					</div>
				</div>
			)}
		</>
	);
}

export default AdminExportadorPrecios;
