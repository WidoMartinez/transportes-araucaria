// src/components/Evaluar/PaginaEvaluar.jsx
// Página pública accesible por #evaluar?token=XXX
// Gestiona los estados del proceso de evaluación de conductor.

import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { Button } from "../ui/button";
import { ChevronRight } from "lucide-react";
import FormularioEvaluacion from "./FormularioEvaluacion";
import { getBackendUrl } from "../../lib/backend";

function PaginaEvaluar() {
	const apiUrl = getBackendUrl();

	// Extraer el token de la URL: #evaluar?token=XXX
	const token = (() => {
		const hash = window.location.hash;
		const queryIndex = hash.indexOf("?");
		if (queryIndex === -1) return null;
		const params = new URLSearchParams(hash.slice(queryIndex + 1));
		return params.get("token") || null;
	})();

	// Estados posibles: cargando | invalido | expirado | ya_evaluado | propina_pendiente | activo
	const [estado, setEstado] = useState("cargando");
	const [reserva, setReserva] = useState(null);
	const [evaluacion, setEvaluacion] = useState(null);
	const [errorMsg, setErrorMsg] = useState("");
	// Datos de propina pendiente
	const [propinaMontoPendiente, setPropinaMontoPendiente] = useState(0);
	const [reintentandoPropina, setReintentandoPropina] = useState(false);
	const [errorPropina, setErrorPropina] = useState("");

	useEffect(() => {
		if (!token) {
			setEstado("invalido");
			setErrorMsg("No se encontró el token de evaluación en la URL.");
			return;
		}

		const validarToken = async () => {
			try {
				const resp = await fetch(`${apiUrl}/api/evaluaciones/validar-token/${encodeURIComponent(token)}`);
				const data = await resp.json();

				if (!data.valido) {
					switch (data.motivo) {
						case "expirado":
							setEstado("expirado");
							break;
						case "ya_evaluado":
							setEstado("ya_evaluado");
							break;
						case "propina_pendiente":
							// Evaluación completa pero propina sin pagar: permitir reintento
							setPropinaMontoPendiente(data.propinaMonto || 0);
							setEstado("propina_pendiente");
							break;
						default:
							setEstado("invalido");
							setErrorMsg("El enlace de evaluación no es válido o no existe.");
					}
					return;
				}

				setReserva(data.reserva);
				setEvaluacion(data.evaluacion);
				setEstado("activo");
			} catch (err) {
				console.error("[PaginaEvaluar] Error al validar token:", err);
				setEstado("invalido");
				setErrorMsg("No se pudo verificar el enlace. Por favor intenta más tarde.");
			}
		};

		validarToken();
	}, [token, apiUrl]);

	// Solicitar nueva orden Flow para propina pendiente
	const handleReintentarPropina = async () => {
		setReintentandoPropina(true);
		setErrorPropina("");
		try {
			const resp = await fetch(`${apiUrl}/api/evaluaciones/reintentar-propina`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ token }),
			});
			const data = await resp.json();
			if (!resp.ok || !data.success) {
				throw new Error(data.error || "Error al generar el enlace de pago");
			}
			// Redirigir a Flow
			window.location.href = data.flowUrl;
		} catch (err) {
			setErrorPropina(err.message || "Error al conectar con el servidor.");
		} finally {
			setReintentandoPropina(false);
		}
	};

	const formatCLP = (v) =>
		new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(v);

	// --- Estados de la página ---

	if (estado === "cargando") {
		return (
			<div className="min-h-screen bg-amber-50 flex items-center justify-center">
				<div className="text-center">
					<LoaderCircle className="h-10 w-10 animate-spin text-amber-700 mx-auto mb-4" />
					<p className="text-amber-800 text-lg font-medium">Cargando evaluación...</p>
				</div>
			</div>
		);
	}

	if (estado === "invalido") {
		return (
			<div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
				<div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
					<div className="text-5xl mb-4">❌</div>
					<h2 className="text-2xl font-bold text-gray-800 mb-3">
						Enlace inválido
					</h2>
					<p className="text-gray-500 mb-4">
						{errorMsg || "El enlace de evaluación no es válido."}
					</p>
					<p className="text-gray-400 text-sm">
						Si crees que esto es un error, contáctanos a través de nuestro sitio web.
					</p>
				</div>
			</div>
		);
	}

	if (estado === "expirado") {
		return (
			<div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
				<div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
					<div className="text-5xl mb-4">⏰</div>
					<h2 className="text-2xl font-bold text-gray-800 mb-3">
						Enlace expirado
					</h2>
					<p className="text-gray-500 mb-4">
						El enlace de evaluación ha expirado. Los enlaces tienen una validez de 7 días.
					</p>
					<p className="text-gray-400 text-sm">
						Si deseas dejar tu evaluación de igual forma, por favor contáctanos directamente.
					</p>
				</div>
			</div>
		);
	}

	// Propina pendiente de pago: la evaluación ya se completó pero el pago no
	if (estado === "propina_pendiente") {
		return (
			<div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
				<div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
					<div className="text-5xl mb-4">💰</div>
					<h2 className="text-2xl font-bold text-amber-900 mb-3">
						Propina pendiente de pago
					</h2>
					<p className="text-amber-700 mb-2">
						Tu evaluación fue registrada exitosamente.
					</p>
					<p className="text-amber-700 mb-6">
						Tienes una propina de <strong>{formatCLP(propinaMontoPendiente)}</strong> pendiente de pago para tu conductor.
					</p>
					{errorPropina && (
						<p className="text-red-600 text-sm mb-4">{errorPropina}</p>
					)}
					<Button
						onClick={handleReintentarPropina}
						disabled={reintentandoPropina}
						className="w-full bg-amber-700 hover:bg-amber-800 text-white text-lg py-6 rounded-xl mb-3"
					>
						{reintentandoPropina ? (
							<LoaderCircle className="h-5 w-5 animate-spin mr-2" />
						) : (
							<>💳 Pagar propina con Flow<ChevronRight className="h-5 w-5 ml-2" /></>
						)}
					</Button>
					<p className="text-gray-400 text-xs">
						La propina es completamente opcional. Si prefieres no pagarla, puedes cerrar esta página.
					</p>
				</div>
			</div>
		);
	}

	if (estado === "ya_evaluado") {
		return (
			<div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
				<div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
					<div className="text-5xl mb-4">✅</div>
					<h2 className="text-2xl font-bold text-gray-800 mb-3">
						¡Ya evaluaste este viaje!
					</h2>
					<p className="text-gray-500 mb-4">
						Ya registraste tu evaluación para este viaje. ¡Muchas gracias por tu tiempo!
					</p>
					<p className="text-gray-400 text-sm">
						Tu opinión es muy valiosa para nosotros y nos ayuda a seguir mejorando.
					</p>
				</div>
			</div>
		);
	}

	if (estado === "activo") {
		return (
			<FormularioEvaluacion
				token={token}
				reserva={reserva}
				evaluacion={evaluacion}
			/>
		);
	}

	return null;
}

export default PaginaEvaluar;
