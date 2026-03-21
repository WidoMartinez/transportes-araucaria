// src/components/Evaluar/FormularioEvaluacion.jsx
// Formulario de evaluación de conductor post-viaje con estrellas y propina opcional.

import { useState } from "react";
import { Star, Clock, Sparkles, Shield, MessageSquare, ChevronRight } from "lucide-react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { getBackendUrl } from "../../lib/backend";

// Componente de estrellas interactivas
function EstrellasSelectorCategoria({ valor, onChange, label, icono }) {
	const [hover, setHover] = useState(0);

	return (
		<div className="flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-amber-100">
			<div className="flex items-center gap-2 text-sm font-medium text-amber-900">
				<span>{icono}</span>
				<span>{label}</span>
			</div>
			<div className="flex gap-1">
				{[1, 2, 3, 4, 5].map((i) => (
					<button
						key={i}
						type="button"
						onClick={() => onChange(i)}
						onMouseEnter={() => setHover(i)}
						onMouseLeave={() => setHover(0)}
						className="focus:outline-none transition-transform hover:scale-110"
					>
						<Star
							className={`h-7 w-7 transition-colors ${
								i <= (hover || valor)
									? "fill-amber-400 text-amber-400"
									: "text-gray-300"
							}`}
						/>
					</button>
				))}
			</div>
		</div>
	);
}

// Componente principal del formulario
function FormularioEvaluacion({ token, reserva, evaluacion }) {
	const apiUrl = getBackendUrl();

	// Estado de calificaciones
	const [califs, setCalifs] = useState({
		puntualidad: 0,
		limpieza: 0,
		seguridad: 0,
		comunicacion: 0,
	});

	// Comentario
	const [comentario, setComentario] = useState("");
	const MAX_COMENTARIO = 500;

	// Propina
	const MONTOS_PRESET = [0, 1000, 2000, 5000];
	const [propinaMonto, setPropinaMonto] = useState(0);
	const [propinaOtro, setPropinaOtro] = useState(false);
	const [propinaOtroValor, setPropinaOtroValor] = useState("");

	// Estado del envío
	const [enviando, setEnviando] = useState(false);
	const [enviado, setEnviado] = useState(false);
	const [flowUrl, setFlowUrl] = useState(null);
	const [error, setError] = useState("");

	const montoFinal = propinaOtro
		? Math.max(0, Math.floor(Number(propinaOtroValor) || 0))
		: propinaMonto;

	// Formatear monto en CLP
	const formatCLP = (v) =>
		new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(v);

	// Validar que todas las calificaciones estén completadas
	const califsCompletas =
		califs.puntualidad > 0 &&
		califs.limpieza > 0 &&
		califs.seguridad > 0 &&
		califs.comunicacion > 0;

	const handleEnviar = async () => {
		if (!califsCompletas) {
			setError("Por favor califica todas las categorías antes de enviar.");
			return;
		}
		setError("");
		setEnviando(true);

		try {
			const resp = await fetch(`${apiUrl}/api/evaluaciones/guardar`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					token,
					calificacion_puntualidad: califs.puntualidad,
					calificacion_limpieza: califs.limpieza,
					calificacion_seguridad: califs.seguridad,
					calificacion_comunicacion: califs.comunicacion,
					comentario: comentario.trim() || null,
					propina_monto: montoFinal,
				}),
			});

			const data = await resp.json();

			if (!resp.ok || !data.success) {
				throw new Error(data.error || "Error al enviar la evaluación");
			}

			if (data.flowUrl) {
				// Hay propina: redirigir a Flow
				setFlowUrl(data.flowUrl);
			} else {
				setEnviado(true);
			}
		} catch (err) {
			setError(err.message || "Error al enviar. Intenta nuevamente.");
		} finally {
			setEnviando(false);
		}
	};

	// Redirigir a Flow para pagar propina
	if (flowUrl) {
		return (
			<div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
				<div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
					<div className="text-5xl mb-4">💰</div>
					<h2 className="text-2xl font-bold text-amber-900 mb-3">
						¡Evaluación guardada!
					</h2>
					<p className="text-amber-700 mb-6">
						Tu calificación fue registrada. Ahora puedes proceder a pagar
						la propina de <strong>{formatCLP(montoFinal)}</strong> de forma segura con Flow.
					</p>
					<Button
						onClick={() => window.location.href = flowUrl}
						className="w-full bg-amber-700 hover:bg-amber-800 text-white text-lg py-6 rounded-xl"
					>
						💳 Pagar propina con Flow
						<ChevronRight className="h-5 w-5 ml-2" />
					</Button>
					<button
						onClick={() => setEnviado(true)}
						className="mt-4 text-sm text-gray-500 underline hover:text-gray-700"
					>
						Omitir propina y finalizar
					</button>
				</div>
			</div>
		);
	}

	// Pantalla de agradecimiento
	if (enviado) {
		return (
			<div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
				<div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
					<div className="text-6xl mb-4">🎉</div>
					<h2 className="text-2xl font-bold text-amber-900 mb-3">
						¡Gracias por tu evaluación!
					</h2>
					<p className="text-amber-700 mb-4">
						Tu opinión nos ayuda a seguir mejorando el servicio de
						Transportes Araucanía.
					</p>
					<div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
						<p className="text-amber-800 text-sm">
							🌟 Tu calificación fue registrada exitosamente.
						</p>
					</div>
				</div>
			</div>
		);
	}

	// Datos del viaje
	const origenDestino =
		reserva?.origen && reserva?.destino
			? `${reserva.origen} → ${reserva.destino}`
			: null;

	const fechaFormateada = reserva?.fecha
		? new Date(reserva.fecha + "T00:00:00").toLocaleDateString("es-CL", {
				weekday: "long",
				year: "numeric",
				month: "long",
				day: "numeric",
		  })
		: null;

	return (
		<div className="min-h-screen bg-amber-50 py-8 px-4">
			<div className="max-w-lg mx-auto">
				{/* Header */}
				<div className="bg-gradient-to-br from-amber-900 to-amber-700 rounded-2xl p-6 mb-6 text-center text-white shadow-lg">
					<div className="text-4xl mb-2">⭐</div>
					<h1 className="text-2xl font-bold mb-1">
						¿Cómo fue tu viaje?
					</h1>
					<p className="text-amber-200 text-sm">
						Tu opinión nos ayuda a mejorar cada día
					</p>
				</div>

				{/* Datos del viaje */}
				{(origenDestino || fechaFormateada || evaluacion?.conductorNombre) && (
					<div className="bg-white rounded-xl shadow-sm border border-amber-100 p-4 mb-5">
						<h2 className="text-sm font-bold text-amber-700 uppercase tracking-wider mb-3">
							📋 Detalles del viaje
						</h2>
						{origenDestino && (
							<p className="text-gray-800 font-medium">{origenDestino}</p>
						)}
						{fechaFormateada && (
							<p className="text-gray-500 text-sm mt-1">{fechaFormateada}</p>
						)}
						{evaluacion?.conductorNombre && (
							<p className="text-gray-600 text-sm mt-1">
								👤 Conductor: <strong>{evaluacion.conductorNombre}</strong>
							</p>
						)}
					</div>
				)}

				{/* Calificaciones */}
				<div className="bg-white rounded-xl shadow-sm border border-amber-100 p-5 mb-5">
					<h2 className="text-base font-bold text-amber-900 mb-4">
						Califica tu experiencia
					</h2>
					<div className="space-y-3">
						<EstrellasSelectorCategoria
							label="Puntualidad"
							icono="⏰"
							valor={califs.puntualidad}
							onChange={(v) => setCalifs((p) => ({ ...p, puntualidad: v }))}
						/>
						<EstrellasSelectorCategoria
							label="Limpieza del vehículo"
							icono="✨"
							valor={califs.limpieza}
							onChange={(v) => setCalifs((p) => ({ ...p, limpieza: v }))}
						/>
						<EstrellasSelectorCategoria
							label="Seguridad"
							icono="🛡️"
							valor={califs.seguridad}
							onChange={(v) => setCalifs((p) => ({ ...p, seguridad: v }))}
						/>
						<EstrellasSelectorCategoria
							label="Comunicación"
							icono="💬"
							valor={califs.comunicacion}
							onChange={(v) => setCalifs((p) => ({ ...p, comunicacion: v }))}
						/>
					</div>
				</div>

				{/* Comentario */}
				<div className="bg-white rounded-xl shadow-sm border border-amber-100 p-5 mb-5">
					<h2 className="text-base font-bold text-amber-900 mb-3">
						💬 Comentario <span className="font-normal text-gray-400">(opcional)</span>
					</h2>
					<Textarea
						placeholder="¿Algo que quieras destacar de tu viaje?"
						value={comentario}
						onChange={(e) => setComentario(e.target.value.slice(0, MAX_COMENTARIO))}
						rows={3}
						className="resize-none border-amber-200 focus:border-amber-400 focus:ring-amber-400"
					/>
					<p className="text-right text-xs text-gray-400 mt-1">
						{comentario.length}/{MAX_COMENTARIO}
					</p>
				</div>

				{/* Propina */}
				<div className="bg-white rounded-xl shadow-sm border border-amber-100 p-5 mb-5">
					<h2 className="text-base font-bold text-amber-900 mb-1">
						💰 Propina <span className="font-normal text-gray-400">(opcional)</span>
					</h2>
					<p className="text-sm text-gray-500 mb-4">
						Si deseas reconocer el esfuerzo de tu conductor, puedes dejarle una propina mediante pago seguro con Flow.
					</p>
					<div className="flex flex-wrap gap-2 mb-3">
						{MONTOS_PRESET.map((m) => (
							<button
								key={m}
								type="button"
								onClick={() => {
									setPropinaMonto(m);
									setPropinaOtro(false);
								}}
								className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
									!propinaOtro && propinaMonto === m
										? "bg-amber-700 text-white border-amber-700"
										: "bg-white text-amber-800 border-amber-300 hover:bg-amber-50"
								}`}
							>
								{m === 0 ? "Sin propina" : formatCLP(m)}
							</button>
						))}
						<button
							type="button"
							onClick={() => setPropinaOtro(true)}
							className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
								propinaOtro
									? "bg-amber-700 text-white border-amber-700"
									: "bg-white text-amber-800 border-amber-300 hover:bg-amber-50"
							}`}
						>
							Otro monto
						</button>
					</div>
					{propinaOtro && (
						<div className="flex items-center gap-2">
							<span className="text-gray-500 font-medium">$</span>
							<input
								type="number"
								min="1"
								placeholder="Ingresa el monto en CLP"
								value={propinaOtroValor}
								onChange={(e) => setPropinaOtroValor(e.target.value)}
								className="flex-1 border border-amber-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
							/>
						</div>
					)}
					{montoFinal > 0 && (
						<p className="text-sm text-amber-700 mt-2 font-medium">
							💳 Se procesará un pago de <strong>{formatCLP(montoFinal)}</strong> con Flow
						</p>
					)}
				</div>

				{/* Error */}
				{error && (
					<div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-4 text-sm">
						{error}
					</div>
				)}

				{/* Botón de envío */}
				<Button
					onClick={handleEnviar}
					disabled={enviando || !califsCompletas}
					className="w-full py-6 text-base bg-amber-700 hover:bg-amber-800 text-white rounded-xl shadow-md disabled:opacity-50"
				>
					{enviando ? (
						<>
							<span className="animate-spin mr-2">⏳</span>
							Enviando...
						</>
					) : montoFinal > 0 ? (
						<>
							💳 Guardar y Pagar Propina con Flow
							<ChevronRight className="h-5 w-5 ml-2" />
						</>
					) : (
						<>
							✅ Enviar Evaluación
						</>
					)}
				</Button>

				{!califsCompletas && (
					<p className="text-center text-xs text-gray-400 mt-2">
						Califica todas las categorías para poder enviar
					</p>
				)}
			</div>
		</div>
	);
}

export default FormularioEvaluacion;
