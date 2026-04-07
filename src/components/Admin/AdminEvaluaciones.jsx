// src/components/Admin/AdminEvaluaciones.jsx
// Panel administrativo para gestión de evaluaciones de conductor post-viaje.
// Permite ver, filtrar, publicar y retirar testimonios públicos.

import { useState, useEffect, useCallback } from "react";
import { Star, Eye, CheckCircle, XCircle, RefreshCw, ChevronLeft, ChevronRight, Link2, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { useAuthenticatedFetch } from "../../hooks/useAuthenticatedFetch";
import { getBackendUrl } from "../../lib/backend";
import { formatCurrency } from "../../lib/utils";

// Renderiza estrellas para una calificación
function Estrellas({ valor, size = "sm" }) {
	const filled = Math.round(Number(valor) || 0);
	const cls = size === "lg" ? "h-5 w-5" : "h-3.5 w-3.5";
	return (
		<div className="flex gap-0.5">
			{[1, 2, 3, 4, 5].map((i) => (
				<Star
					key={i}
					className={`${cls} ${
						i <= filled
							? "fill-amber-400 text-amber-400"
							: "text-gray-300"
					}`}
				/>
			))}
			{valor !== undefined && (
				<span className="text-xs text-gray-500 ml-1">{Number(valor).toFixed(1)}</span>
			)}
		</div>
	);
}

function AdminEvaluaciones() {
	const apiUrl = getBackendUrl();
	const { authenticatedFetch: authFetch } = useAuthenticatedFetch();

	// Estado de lista
	const [evaluaciones, setEvaluaciones] = useState([]);
	const [total, setTotal] = useState(0);
	const [totalPages, setTotalPages] = useState(1);
	const [page, setPage] = useState(1);
	const LIMIT = 15;

	// Filtros
	const [soloEvaluadas, setSoloEvaluadas] = useState(true);
	const [soloConPropina, setSoloConPropina] = useState(false);
	const [cargando, setCargando] = useState(false);

	// Modal de detalle
	const [modalEval, setModalEval] = useState(null);
	const [nombrePublico, setNombrePublico] = useState("");

	// Estado del link manual de evaluación
	const [linkManual, setLinkManual] = useState("");
	const [linkExpiracion, setLinkExpiracion] = useState(null);
	const [cargandoLink, setCargandoLink] = useState(false);
	const [accionando, setAccionando] = useState(false);

	const fetchEvaluaciones = useCallback(async () => {
		setCargando(true);
		try {
			const params = new URLSearchParams({
				page,
				limit: LIMIT,
				soloEvaluadas: soloEvaluadas ? "true" : "false",
				soloConPropina: soloConPropina ? "true" : "false",
			});
			const resp = await authFetch(`/api/admin/evaluaciones?${params}`);
			const data = await resp.json();
			setEvaluaciones(data.evaluaciones || []);
			setTotal(data.total || 0);
			setTotalPages(data.totalPages || 1);
		} catch (err) {
			toast.error("Error al cargar evaluaciones: " + err.message);
		} finally {
			setCargando(false);
		}
	}, [page, soloEvaluadas, soloConPropina, apiUrl, authFetch]);

	useEffect(() => {
		fetchEvaluaciones();
	}, [fetchEvaluaciones]);

	// Publicar testimonio
	const handlePublicar = async (evaluacion) => {
		setAccionando(true);
		try {
			const resp = await authFetch(
				`/api/admin/evaluaciones/${evaluacion.id}/publicar`,
				{
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ publicado_nombre: nombrePublico || evaluacion.clienteNombre }),
				}
			);
			const data = await resp.json();
			if (!data.success) throw new Error(data.error);
			toast.success("✅ Testimonio publicado en el sitio");
			setModalEval(null);
			fetchEvaluaciones();
		} catch (err) {
			toast.error("Error al publicar: " + err.message);
		} finally {
			setAccionando(false);
		}
	};

	// Despublicar testimonio
	const handleDespublicar = async (evaluacion) => {
		if (!window.confirm("¿Seguro que deseas retirar este testimonio del sitio?")) return;
		setAccionando(true);
		try {
			const resp = await authFetch(
				`/api/admin/evaluaciones/${evaluacion.id}/despublicar`,
				{ method: "PUT" }
			);
			const data = await resp.json();
			if (!data.success) throw new Error(data.error);
			toast.success("Testimonio retirado del sitio");
			setModalEval(null);
			fetchEvaluaciones();
		} catch (err) {
			toast.error("Error al retirar: " + err.message);
		} finally {
			setAccionando(false);
		}
	};

	const abrirModal = (ev) => {
		setModalEval(ev);
		setNombrePublico(ev.clienteNombre || "");
		// Limpiar el link al abrir una nueva evaluación
		setLinkManual("");
		setLinkExpiracion(null);
	};

	// Solicitar evaluación (enviar correo) y guardar link para mostrar al admin
	const handleSolicitarEvaluacion = async (evaluacion) => {
		setAccionando(true);
		try {
			const resp = await authFetch(
				`/api/admin/evaluaciones/solicitar/${evaluacion.reservaId}`,
				{ method: "POST" }
			);
			const data = await resp.json();
			if (data.success) {
				toast.success("Solicitud enviada correctamente");
				fetchEvaluaciones();
				// Guardar el link generado para que el admin pueda copiarlo si es necesario
				if (data.tokenEvaluacion) {
					const base = window.location.origin;
					setLinkManual(`${base}/#evaluar?token=${data.tokenEvaluacion}`);
					setLinkExpiracion(data.tokenExpiracion || null);
				}
				// No cerrar el modal para mostrar el link al admin
			} else {
				toast.error(data.error || "Error al enviar solicitud");
			}
		} catch (err) {
			toast.error("Error de conexión: " + err.message);
		} finally {
			setAccionando(false);
		}
	};

	const formatFecha = (d) =>
		d ? new Date(d).toLocaleDateString("es-CL") : "—";

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div>
					<h2 className="text-xl font-bold text-gray-900">Evaluaciones de Conductor</h2>
					<p className="text-sm text-gray-500">
						{total} {total === 1 ? "evaluación" : "evaluaciones"} encontradas
					</p>
				</div>
				<Button variant="outline" size="sm" onClick={fetchEvaluaciones} disabled={cargando}>
					<RefreshCw className={`h-4 w-4 mr-2 ${cargando ? "animate-spin" : ""}`} />
					Actualizar
				</Button>
			</div>

			{/* Filtros */}
			<div className="bg-white rounded-lg border p-4 flex flex-wrap gap-4">
				<div className="flex items-center gap-2">
					<Checkbox
						id="soloEvaluadas"
						checked={soloEvaluadas}
						onCheckedChange={(v) => { setSoloEvaluadas(!!v); setPage(1); }}
					/>
					<Label htmlFor="soloEvaluadas" className="cursor-pointer text-sm">
						Solo evaluadas
					</Label>
				</div>
				<div className="flex items-center gap-2">
					<Checkbox
						id="soloConPropina"
						checked={soloConPropina}
						onCheckedChange={(v) => { setSoloConPropina(!!v); setPage(1); }}
					/>
					<Label htmlFor="soloConPropina" className="cursor-pointer text-sm">
						Solo con propina
					</Label>
				</div>
			</div>

			{/* Tabla */}
			<div className="bg-white rounded-lg border overflow-hidden">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Reserva</TableHead>
							<TableHead>Cliente</TableHead>
							<TableHead>Fecha</TableHead>
							<TableHead>Estrellas</TableHead>
							<TableHead>Comentario</TableHead>
							<TableHead>Propina 🔒</TableHead>
							<TableHead>Estado</TableHead>
							<TableHead>Acciones</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{cargando ? (
							<TableRow>
								<TableCell colSpan={8} className="text-center py-10 text-gray-400">
									<RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />
									Cargando...
								</TableCell>
							</TableRow>
						) : evaluaciones.length === 0 ? (
							<TableRow>
								<TableCell colSpan={8} className="text-center py-10 text-gray-400">
									No se encontraron evaluaciones
								</TableCell>
							</TableRow>
						) : (
							evaluaciones.map((ev) => (
								<TableRow key={ev.id} className="hover:bg-amber-50 cursor-pointer" onClick={() => abrirModal(ev)}>
									<TableCell className="font-medium text-amber-800">
										{ev.Reserva?.codigoReserva || `#${ev.reservaId}`}
									</TableCell>
									<TableCell>
										<div className="text-sm">
											<p className="font-medium">{ev.clienteNombre || "—"}</p>
											<p className="text-gray-400 text-xs">{ev.clienteEmail}</p>
										</div>
									</TableCell>
									<TableCell className="text-sm text-gray-600">
										{formatFecha(ev.fechaEvaluacion)}
									</TableCell>
									<TableCell>
										{ev.evaluada ? (
											<Estrellas valor={ev.calificacionPromedio} />
										) : (
											<span className="text-gray-400 text-xs">Sin evaluar</span>
										)}
									</TableCell>
									<TableCell className="max-w-xs">
										<p className="text-sm text-gray-600 truncate">
											{ev.comentario || "—"}
										</p>
									</TableCell>
									<TableCell>
										{Number(ev.propinaMonto) > 0 ? (
											<div className="text-sm">
												<p className="font-medium text-green-800">
													{formatCurrency(ev.propinaMonto)}
												</p>
												<Badge
													variant={ev.propinaPagada ? "default" : "secondary"}
													className="text-xs"
												>
													{ev.propinaPagada ? "Pagada" : "Pendiente"}
												</Badge>
											</div>
										) : (
											<span className="text-gray-400 text-xs">—</span>
										)}
									</TableCell>
									<TableCell>
										<div className="flex flex-col gap-1">
											{ev.evaluada ? (
												<Badge className="bg-green-100 text-green-800 text-xs">
													✅ Evaluada
												</Badge>
											) : (
												<Badge variant="secondary" className="text-xs">
													⏳ Pendiente
												</Badge>
											)}
											{ev.publicado && (
												<Badge className="bg-amber-100 text-amber-800 text-xs">
													🌟 Publicado
												</Badge>
											)}
										</div>
									</TableCell>
									<TableCell>
										<Button
											variant="ghost"
											size="sm"
											onClick={(e) => { e.stopPropagation(); abrirModal(ev); }}
										>
											<Eye className="h-4 w-4" />
										</Button>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>

			{/* Paginación */}
			{totalPages > 1 && (
				<div className="flex items-center justify-between">
					<p className="text-sm text-gray-500">
						Página {page} de {totalPages}
					</p>
					<div className="flex gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setPage((p) => Math.max(1, p - 1))}
							disabled={page === 1}
						>
							<ChevronLeft className="h-4 w-4" />
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
							disabled={page === totalPages}
						>
							<ChevronRight className="h-4 w-4" />
						</Button>
					</div>
				</div>
			)}

			{/* Modal de detalle */}
			<Dialog open={!!modalEval} onOpenChange={(open) => { if (!open) { setModalEval(null); setLinkManual(""); setLinkExpiracion(null); } }}>
				{modalEval && (
					<DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
						<DialogHeader>
							<DialogTitle>
								Evaluación — Reserva {modalEval.Reserva?.codigoReserva || `#${modalEval.reservaId}`}
							</DialogTitle>
						</DialogHeader>

						<div className="space-y-4 py-2">
							{/* Datos generales */}
						<div className="bg-amber-50 rounded-lg p-4 space-y-3 text-sm">
							{/* Pasajero y Email */}
							<div className="grid grid-cols-2 gap-3">
								<div>
									<p className="text-xs text-amber-700 font-medium mb-0.5">Pasajero</p>
									<p className="text-gray-900">{modalEval.clienteNombre || "—"}</p>
								</div>
								<div>
									<p className="text-xs text-amber-700 font-medium mb-0.5">Email</p>
									<p className="text-gray-900 break-all">{modalEval.clienteEmail || "—"}</p>
								</div>
							</div>
							{/* Tramo realizado */}
							{modalEval.Reserva && (
								<div>
									<p className="text-xs text-amber-700 font-medium mb-0.5">Tramo realizado</p>
									<p className="text-gray-900 font-semibold">
										{modalEval.Reserva.origen} → {modalEval.Reserva.destino}
									</p>
								</div>
							)}
							{/* Fecha servicio, Hora y Nro. pasajeros */}
							{modalEval.Reserva && (
								<div className="grid grid-cols-3 gap-3">
									<div>
										<p className="text-xs text-amber-700 font-medium mb-0.5">Fecha servicio</p>
										<p className="text-gray-900">{formatFecha(modalEval.Reserva.fecha)}</p>
									</div>
									<div>
										<p className="text-xs text-amber-700 font-medium mb-0.5">Hora</p>
										<p className="text-gray-900">{modalEval.Reserva.hora || "—"}</p>
									</div>
									<div>
										<p className="text-xs text-amber-700 font-medium mb-0.5">Nro. pasajeros</p>
										<p className="text-gray-900">{modalEval.Reserva.pasajeros || "—"}</p>
									</div>
								</div>
							)}
							{/* Valor del servicio, desglose de descuentos y Conductor */}
							{modalEval.Reserva?.precio > 0 && (() => {
								const precioBase = Number(modalEval.Reserva.precio) || 0;
								const totalReal = Number(modalEval.Reserva.totalConDescuento) || precioBase;
								const totalDescuento = precioBase - totalReal;
								const tieneDescuento = totalDescuento > 0;
								return (
									<div className="space-y-1">
										{/* Fila: precio base y conductor en paralelo */}
										<div className="grid grid-cols-2 gap-3">
											<div>
												<p className="text-xs text-amber-700 font-medium mb-0.5">
													{tieneDescuento ? "Precio base" : "Valor servicio"}
												</p>
												<p className={`font-semibold ${tieneDescuento ? "text-gray-500 line-through text-sm" : "text-gray-900"}`}>
													{formatCurrency(precioBase)}
												</p>
											</div>
											{modalEval.conductorNombre && (
												<div>
													<p className="text-xs text-amber-700 font-medium mb-0.5">Conductor</p>
													<p className="text-gray-900">{modalEval.conductorNombre}</p>
												</div>
											)}
										</div>
										{/* Desglose de descuentos cuando aplica */}
										{tieneDescuento && (
											<div className="bg-green-50 border border-green-200 rounded-lg p-2 space-y-1 text-xs">
												{Number(modalEval.Reserva.descuentoBase) > 0 && (
													<div className="flex justify-between text-green-700">
														<span>Descuento base</span>
														<span>-{formatCurrency(modalEval.Reserva.descuentoBase)}</span>
													</div>
												)}
												{Number(modalEval.Reserva.descuentoOnline) > 0 && (
													<div className="flex justify-between text-green-700">
														<span>Descuento online</span>
														<span>-{formatCurrency(modalEval.Reserva.descuentoOnline)}</span>
													</div>
												)}
												{Number(modalEval.Reserva.descuentoRoundTrip) > 0 && (
													<div className="flex justify-between text-green-700">
														<span>Descuento ida y vuelta</span>
														<span>-{formatCurrency(modalEval.Reserva.descuentoRoundTrip)}</span>
													</div>
												)}
												{Number(modalEval.Reserva.descuentoPromocion) > 0 && (
													<div className="flex justify-between text-green-700">
														<span>Promoción
															{modalEval.Reserva.codigoDescuento ? ` (${modalEval.Reserva.codigoDescuento})` : ""}
														</span>
														<span>-{formatCurrency(modalEval.Reserva.descuentoPromocion)}</span>
													</div>
												)}
												<div className="flex justify-between font-bold text-green-800 border-t border-green-300 pt-1 mt-1">
													<span>Total descuentos</span>
													<span>-{formatCurrency(totalDescuento)}</span>
												</div>
											</div>
										)}
										{/* Valor real pagado */}
										{tieneDescuento && (
											<div>
												<p className="text-xs text-amber-700 font-medium mb-0.5">Valor real pagado</p>
												<p className="text-gray-900 font-bold text-base">{formatCurrency(totalReal)}</p>
											</div>
										)}
									</div>
								);
							})()}
							{/* Conductor cuando no hay precio */}
							{!(modalEval.Reserva?.precio > 0) && modalEval.conductorNombre && (
								<div>
									<p className="text-xs text-amber-700 font-medium mb-0.5">Conductor</p>
									<p className="text-gray-900">{modalEval.conductorNombre}</p>
								</div>
							)}
							{/* Fecha evaluación */}
							<div className="border-t border-amber-200 pt-2">
								<p className="text-xs text-amber-700 font-medium mb-0.5">Fecha evaluación</p>
								<p className="text-gray-900">{formatFecha(modalEval.fechaEvaluacion)}</p>
							</div>
						</div>

							{/* Calificaciones */}
							{modalEval.evaluada && (
								<div className="space-y-2">
									<h4 className="font-semibold text-gray-800">Calificaciones</h4>
									<div className="grid grid-cols-2 gap-2 text-sm">
										{[
											{ label: "⏰ Puntualidad", val: modalEval.calificacionPuntualidad },
											{ label: "✨ Limpieza", val: modalEval.calificacionLimpieza },
											{ label: "🛡️ Seguridad", val: modalEval.calificacionSeguridad },
											{ label: "💬 Comunicación", val: modalEval.calificacionComunicacion },
										].map(({ label, val }) => (
											<div key={label} className="bg-gray-50 rounded-lg p-3">
												<p className="text-gray-500 text-xs mb-1">{label}</p>
												<Estrellas valor={val} />
											</div>
										))}
									</div>
									<div className="flex items-center gap-2 mt-2">
										<span className="text-gray-700 font-medium">Promedio:</span>
										<Estrellas valor={modalEval.calificacionPromedio} size="lg" />
									</div>
								</div>
							)}

							{/* Comentario */}
							{modalEval.comentario && (
								<div>
									<h4 className="font-semibold text-gray-800 mb-1">Comentario</h4>
									<div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 italic">
										"{modalEval.comentario}"
									</div>
								</div>
							)}

							{/* Propina (confidencial) */}
							{Number(modalEval.propinaMonto) > 0 && (
								<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
									<h4 className="font-semibold text-yellow-800 mb-2">🔒 Propina (Confidencial)</h4>
									<div className="space-y-1 text-sm">
										<p>
											<span className="font-medium">Monto:</span>{" "}
											<strong>{formatCurrency(modalEval.propinaMonto)}</strong>
										</p>
										<p>
											<span className="font-medium">Estado:</span>{" "}
											{modalEval.propinaPagada ? (
												<span className="text-green-700">✅ Pagada</span>
											) : (
												<span className="text-yellow-700">⏳ Pendiente</span>
											)}
										</p>
									</div>
								</div>
							)}
							{/* Botón para solicitar si está pendiente + link generado */}
							{!modalEval.evaluada && (
								<div className="border-t pt-4 space-y-3">
									<Button
										onClick={() => handleSolicitarEvaluacion(modalEval)}
										disabled={accionando}
										className="w-full bg-amber-600 hover:bg-amber-700 text-white"
									>
										{accionando ? (
											<RefreshCw className="h-4 w-4 animate-spin mr-2" />
										) : (
											<CheckCircle className="h-4 w-4 mr-2" />
										)}
										Enviar solicitud de evaluación por correo
									</Button>
									<p className="text-xs text-gray-400 text-center">
										Se enviará un correo al pasajero con el link para evaluar el servicio.
									</p>
									{/* Link generado tras envío: permite copiarlo para compartirlo manualmente */}
									{linkManual && (
										<div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
											<p className="text-xs font-medium text-blue-700 mb-2 flex items-center gap-1">
												<Link2 className="h-3.5 w-3.5" />
												Link de evaluación generado
												{linkExpiracion && (
													<span className="text-blue-500 ml-1">· Expira {formatFecha(linkExpiracion)}</span>
												)}
											</p>
											<div className="flex gap-2">
												<Input
													value={linkManual}
													readOnly
													className="text-xs bg-white"
												/>
												<Button
													size="sm"
													variant="outline"
													onClick={() => {
														navigator.clipboard.writeText(linkManual);
														toast.success("Link copiado al portapapeles");
													}}
												>
													<Copy className="h-3.5 w-3.5" />
												</Button>
											</div>
										</div>
									)}
								</div>
							)}

							{/* Acciones de publicación */}
							{modalEval.evaluada && (
								<div className="border-t pt-4">
									{!modalEval.publicado ? (
										<div className="space-y-3">
											<h4 className="font-semibold text-gray-800">Publicar como testimonio</h4>
											<div>
												<Label className="text-sm">Nombre público a mostrar</Label>
												<Input
													value={nombrePublico}
													onChange={(e) => setNombrePublico(e.target.value)}
													placeholder="Ej: María P. o nombre completo"
													className="mt-1"
												/>
												<p className="text-xs text-gray-400 mt-1">
													Puede ser el nombre completo o un nombre abreviado para mayor privacidad.
												</p>
											</div>
											<Button
												onClick={() => handlePublicar(modalEval)}
												disabled={accionando || !nombrePublico.trim()}
												className="w-full bg-amber-700 hover:bg-amber-800 text-white"
											>
												{accionando ? (
													<RefreshCw className="h-4 w-4 animate-spin mr-2" />
												) : (
													<CheckCircle className="h-4 w-4 mr-2" />
												)}
												Publicar testimonio en el sitio
											</Button>
										</div>
									) : (
										<div className="space-y-3">
											<div className="flex items-center gap-2 text-green-700">
												<CheckCircle className="h-4 w-4" />
												<span className="text-sm font-medium">
													Publicado como <strong>"{modalEval.publicadoNombre}"</strong>
												</span>
											</div>
											<p className="text-xs text-gray-500">
												Publicado el {formatFecha(modalEval.publicadoEn)}
											</p>
											<Button
												variant="outline"
												onClick={() => handleDespublicar(modalEval)}
												disabled={accionando}
												className="w-full border-red-300 text-red-700 hover:bg-red-50"
											>
												<XCircle className="h-4 w-4 mr-2" />
												Retirar del sitio
											</Button>
										</div>
									)}
								</div>
							)}
						</div>

						<DialogFooter>
							<Button variant="ghost" onClick={() => setModalEval(null)}>
								Cerrar
							</Button>
						</DialogFooter>
					</DialogContent>
				)}
			</Dialog>
		</div>
	);
}

export default AdminEvaluaciones;
