// src/components/Admin/AdminEvaluaciones.jsx
// Panel administrativo para gestión de evaluaciones de conductor post-viaje.
// Permite ver, filtrar, publicar y retirar testimonios públicos.

import { useState, useEffect, useCallback } from "react";
import { Star, Eye, CheckCircle, XCircle, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
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
	const authFetch = useAuthenticatedFetch();

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
			const resp = await authFetch(`${apiUrl}/api/admin/evaluaciones?${params}`);
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
				`${apiUrl}/api/admin/evaluaciones/${evaluacion.id}/publicar`,
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
		if (!confirm("¿Seguro que deseas retirar este testimonio del sitio?")) return;
		setAccionando(true);
		try {
			const resp = await authFetch(
				`${apiUrl}/api/admin/evaluaciones/${evaluacion.id}/despublicar`,
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
			<Dialog open={!!modalEval} onOpenChange={(open) => !open && setModalEval(null)}>
				{modalEval && (
					<DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
						<DialogHeader>
							<DialogTitle>
								Evaluación — Reserva {modalEval.Reserva?.codigoReserva || `#${modalEval.reservaId}`}
							</DialogTitle>
						</DialogHeader>

						<div className="space-y-4 py-2">
							{/* Datos generales */}
							<div className="bg-amber-50 rounded-lg p-4 space-y-2 text-sm">
								<p><span className="font-medium">Pasajero:</span> {modalEval.clienteNombre || "—"}</p>
								<p><span className="font-medium">Email:</span> {modalEval.clienteEmail}</p>
								{modalEval.conductorNombre && (
									<p><span className="font-medium">Conductor:</span> {modalEval.conductorNombre}</p>
								)}
								{modalEval.Reserva && (
									<p>
										<span className="font-medium">Ruta:</span>{" "}
										{modalEval.Reserva.origen} → {modalEval.Reserva.destino}
									</p>
								)}
								<p>
									<span className="font-medium">Fecha evaluación:</span>{" "}
									{formatFecha(modalEval.fechaEvaluacion)}
								</p>
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
