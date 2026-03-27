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
import { getBackendUrl } from "../lib/backend";
import { Loader2, Printer, RefreshCw } from "lucide-react";

// URL base del backend
const API_BASE_URL =
	getBackendUrl() || "https://transportes-araucaria.onrender.com";

// Rangos de pasajeros a mostrar por tipo de vehículo
const PASAJEROS_AUTO = [1, 2, 3];
const PASAJEROS_VAN  = [4, 5, 6, 7];

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
 * Escapa texto para seguridad al mostrarlo.
 * @param {string} texto
 */
const escapar = (texto) =>
	String(texto ?? "").replace(/[<>"'&]/g, (c) => ({
		"<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;", "&": "&amp;",
	}[c]));

// ─── Componente principal ──────────────────────────────────────────────────────

function AdminExportadorPrecios({ destinos = [] }) {
	// Fecha por defecto: hoy en formato YYYY-MM-DD
	const hoyStr = new Date().toISOString().slice(0, 10);

	const [fecha, setFecha]         = useState(hoyStr);
	const [hora, setHora]           = useState("10:00");
	const [idaVuelta, setIdaVuelta] = useState(false);
	const [cargando, setCargando]   = useState(false);
	const [precios, setPrecios]     = useState(null); // { [destino]: { [pax]: resultado } }
	const [error, setError]         = useState("");
	const tablaRef                  = useRef(null);

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
			setError("No hay destinos disponibles. Asegúrate de que los destinos estén cargados.");
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

				const todosLosPasajeros = [...PASAJEROS_AUTO, ...PASAJEROS_VAN];
				for (const pax of todosLosPasajeros) {
					// Verificar si el destino soporta esa cantidad de pasajeros
					const maxPax = dest.maxPasajeros || 7;
					if (pax > maxPax) continue;

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
								horaRegreso:  idaVuelta && hora ? hora : undefined,
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
			setError("Error al calcular precios: " + (err.message || "error desconocido"));
		} finally {
			setCargando(false);
		}
	}, [fecha, hora, idaVuelta, destinos]);

	/**
	 * Abre el diálogo de impresión del navegador mostrando solo la tabla.
	 */
	const imprimir = () => {
		window.print();
	};

	// Destinos activos con precios calculados
	const destinosActivos = destinos.filter((d) => d.activo);

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
			{/* ────────── Estilos de impresión ────────── */}
			<style>{`
				@media print {
					/* Ocultar todo excepto la sección de impresión */
					body > * { display: none !important; }
					#seccion-impresion-precios {
						display: block !important;
						position: absolute;
						top: 0; left: 0;
						width: 100%;
						background: white;
						color: black;
					}
					/* Estilos de tabla para impresión */
					#seccion-impresion-precios table {
						width: 100%;
						border-collapse: collapse;
						font-size: 11px;
					}
					#seccion-impresion-precios th,
					#seccion-impresion-precios td {
						border: 1px solid #999;
						padding: 4px 6px;
						text-align: right;
					}
					#seccion-impresion-precios th {
						background: #f0f0f0;
						font-weight: bold;
					}
					#seccion-impresion-precios td:first-child,
					#seccion-impresion-precios th:first-child {
						text-align: left;
					}
					#seccion-impresion-precios .badge-recargo {
						color: #c00;
						font-weight: bold;
					}
					#seccion-impresion-precios .badge-descuento {
						color: #060;
						font-weight: bold;
					}
					#seccion-impresion-precios .nota-pie {
						font-size: 9px;
						color: #555;
						margin-top: 8px;
					}
					/* Saltos de página */
					#seccion-impresion-precios .salto-pagina {
						page-break-before: always;
					}
				}
			`}</style>

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
					mostrarían al pasajero en ese momento, incluyendo todos los ajustes
					de tarifa dinámica (anticipación, día de semana, horario, festivos).
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
							Si está activo, muestra el precio del viaje de regreso en la
							misma fecha.
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
						<button
							type="button"
							onClick={imprimir}
							className="flex items-center gap-2 rounded-md bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600 border border-slate-600"
						>
							<Printer className="h-4 w-4" />
							Imprimir / Guardar PDF
						</button>
					)}
				</div>

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
								<p className="text-gray-400">
									Precios en pesos chilenos (CLP)
								</p>
							</div>
						</div>
					</div>

					{/* Tablas por destino */}
					{destinosActivos.map((dest, idx) => {
						const dataDest = precios[dest.nombre] || {};
						const tieneAjuste = Object.values(dataDest).some(
							(d) =>
								d?.tarifaDinamica?.ida?.ajustes?.length > 0 ||
								d?.tarifaDinamica?.vuelta?.ajustes?.length > 0
						);

						// Obtener el primer resultado para mostrar info de tarifa dinámica
						const primerResultado = Object.values(dataDest).find((d) => d);
						const ajustesIda =
							primerResultado?.tarifaDinamica?.ida?.ajustes || [];
						return (
							<div
								key={dest.nombre}
								className={idx > 0 ? "mt-8" : ""}
							>
								{/* Nombre del destino */}
								<div className="flex items-baseline gap-3 mb-2">
									<h3 className="font-bold text-gray-900 text-base">
										{escapar(dest.nombre)}
									</h3>
									{dest.tiempo && (
										<span className="text-xs text-gray-500">
											⏱ {escapar(dest.tiempo)}
										</span>
									)}
									{tieneAjuste && (
										<span className="text-xs font-medium text-orange-600">
											⚡ Tarifa dinámica activa
										</span>
									)}
								</div>

								{/* Descripción de ajustes de tarifa dinámica */}
								{ajustesIda.length > 0 && (
									<div className="mb-2 rounded bg-amber-50 border border-amber-200 px-3 py-1.5 text-xs text-amber-800">
										<span className="font-semibold">Ajustes aplicados: </span>
										{ajustesIda.map((a) => (
											<span key={a.nombre} className="mr-2">
												{a.nombre}
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
											</span>
										))}
									</div>
								)}

								{/* Tabla de precios */}
								<div className="overflow-x-auto">
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
												<th className="border border-gray-200 px-3 py-2 text-right font-semibold text-gray-700 bg-gray-50">
													Abono (40%)
												</th>
											</tr>
										</thead>
										<tbody>
											{[...PASAJEROS_AUTO, ...PASAJEROS_VAN].map((pax) => {
												const maxPax = dest.maxPasajeros || 7;
												if (pax > maxPax) return null;
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
												const precioBase     = d.precioBaseIda || d.precioBase || 0;
										// precioAjustado = precio de ida tras aplicar tarifa dinámica
										const soloIda        = d.tarifaDinamica?.ida?.precioAjustado ?? d.precioBase ?? 0;
										const totalConDto    = d.totalConDescuento ?? soloIda;
										const abono          = d.abono ?? Math.round(totalConDto * 0.4);

										// Para ida y vuelta
										const ida2           = d.tarifaDinamica?.ida?.precioAjustado  ?? 0;
										const vuelta2        = d.tarifaDinamica?.vuelta?.precioAjustado ?? 0;
												const totalIdaVuelta = idaVuelta ? (ida2 + vuelta2) || (d.precioBase ?? 0) : 0;
												const totalIdaVueltaConDto = idaVuelta ? (d.totalConDescuento ?? totalIdaVuelta) : 0;
												const abonoIdaVuelta = Math.round(totalIdaVueltaConDto * 0.4);

												// Porcentaje de variación respecto al precio base
												const variacion = precioBase > 0
													? ((soloIda - precioBase) / precioBase) * 100
													: 0;

												return (
													<tr
														key={pax}
														className={`border-b border-gray-100 ${pax >= 4 ? "bg-slate-50" : ""}`}
													>
														{/* Pasajeros */}
														<td className="border border-gray-200 px-3 py-2 font-medium">
															{pax} {pax === 1 ? "pasajero" : "pasajeros"}
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

														{/* Abono */}
														<td className="border border-gray-200 px-3 py-2 text-right text-gray-500 bg-gray-50">
															{formatPrecio(idaVuelta ? abonoIdaVuelta : abono)}
														</td>
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
												{formatPrecio(primerResultado.descuentos.personalizados)}
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
