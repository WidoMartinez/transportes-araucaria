// src/components/CalificarServicio.jsx
import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Star, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { getBackendUrl } from "../lib/backend";

const CalificarServicio = () => {
	const [reservaId, setReservaId] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [yaCalificada, setYaCalificada] = useState(false);
	const [reservaData, setReservaData] = useState(null);
	const [enviando, setEnviando] = useState(false);
	const [exitoso, setExitoso] = useState(false);

	// Estados del formulario
	const [puntuacion, setPuntuacion] = useState(0);
	const [puntuacionHover, setPuntuacionHover] = useState(0);
	const [comentario, setComentario] = useState("");
	const [aspectos, setAspectos] = useState({
		puntualidad: 0,
		limpieza: 0,
		amabilidad: 0,
		conduccion: 0,
	});

	// Leer reservaId de query params
	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		const id = params.get("reserva");

		if (!id || isNaN(parseInt(id))) {
			setError("ID de reserva inválido o no proporcionado");
			setLoading(false);
			return;
		}

		setReservaId(parseInt(id));
		verificarCalificacion(parseInt(id));
	}, []);

	// Verificar si ya existe calificación
	const verificarCalificacion = async (id) => {
		try {
			setLoading(true);
			const response = await fetch(
				`${getBackendUrl()}/api/calificaciones/${id}`
			);

			if (!response.ok) {
				throw new Error("Error al verificar la calificación");
			}

			const data = await response.json();

			if (data.exists) {
				setYaCalificada(true);
				setReservaData(data.calificacion.reserva);
			} else if (data.reserva) {
				// Verificar que la reserva esté completada
				if (data.reserva.estado !== "completada") {
					setError(
						`Esta reserva no puede ser calificada aún. Estado: ${data.reserva.estado}`
					);
				} else {
					setReservaData(data.reserva);
				}
			}
		} catch (err) {
			console.error("Error al verificar calificación:", err);
			setError("Error al verificar la reserva. Por favor intente nuevamente.");
		} finally {
			setLoading(false);
		}
	};

	// Manejar envío del formulario
	const handleSubmit = async (e) => {
		e.preventDefault();

		// Validar puntuación obligatoria
		if (puntuacion === 0) {
			alert("Por favor seleccione una calificación general");
			return;
		}

		// Validar longitud del comentario
		if (comentario.length > 500) {
			alert("El comentario no puede exceder los 500 caracteres");
			return;
		}

		try {
			setEnviando(true);

			// Preparar aspectos (solo enviar los que tienen valor)
			const aspectosValidos = {};
			Object.entries(aspectos).forEach(([key, value]) => {
				if (value > 0) {
					aspectosValidos[key] = value;
				}
			});

			const payload = {
				reservaId,
				puntuacion,
				comentario: comentario.trim() || null,
				aspectos: Object.keys(aspectosValidos).length > 0 ? aspectosValidos : null,
				ipCliente: null, // Se puede obtener del servidor
				dispositivo: navigator.userAgent,
			};

			const response = await fetch(`${getBackendUrl()}/api/calificaciones`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(payload),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Error al enviar la calificación");
			}

			setExitoso(true);
		} catch (err) {
			console.error("Error al enviar calificación:", err);
			alert(err.message || "Error al enviar la calificación");
		} finally {
			setEnviando(false);
		}
	};

	// Renderizar estrellas para calificación
	const renderEstrellas = (valor, setValor, hover, setHover, size = "large") => {
		const starSize = size === "large" ? "h-12 w-12" : "h-6 w-6";
		const stars = [];

		for (let i = 1; i <= 5; i++) {
			const filled = i <= (hover || valor);
			stars.push(
				<button
					key={i}
					type="button"
					onClick={() => setValor(i)}
					onMouseEnter={() => setHover && setHover(i)}
					onMouseLeave={() => setHover && setHover(0)}
					className="transition-transform hover:scale-110"
				>
					<Star
						className={`${starSize} ${
							filled
								? "fill-yellow-400 text-yellow-400"
								: "text-gray-300"
						} transition-colors`}
					/>
				</button>
			);
		}

		return <div className="flex gap-2">{stars}</div>;
	};

	// Estados de carga y error
	if (loading) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center p-4">
				<Card className="max-w-md w-full">
					<CardContent className="pt-6 flex flex-col items-center gap-4">
						<Loader2 className="h-12 w-12 animate-spin text-blue-600" />
						<p className="text-gray-600">Cargando...</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (error) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center p-4">
				<Card className="max-w-md w-full">
					<CardHeader>
						<div className="flex items-center gap-2 text-red-600">
							<AlertCircle className="h-6 w-6" />
							<CardTitle>Error</CardTitle>
						</div>
					</CardHeader>
					<CardContent>
						<p className="text-gray-700">{error}</p>
						<Button
							onClick={() => window.location.href = "/"}
							className="mt-4 w-full"
						>
							Volver al inicio
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	// Ya calificada
	if (yaCalificada) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center p-4">
				<Card className="max-w-md w-full">
					<CardHeader>
						<div className="flex items-center gap-2 text-green-600">
							<CheckCircle className="h-6 w-6" />
							<CardTitle>¡Ya calificaste este servicio!</CardTitle>
						</div>
						<CardDescription>
							{reservaData?.codigoReserva && `Reserva: ${reservaData.codigoReserva}`}
						</CardDescription>
					</CardHeader>
					<CardContent>
						<p className="text-gray-700 mb-4">
							Esta reserva ya fue calificada. Gracias por tu feedback.
						</p>
						<Button
							onClick={() => window.location.href = "/"}
							className="w-full"
						>
							Volver al inicio
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	// Enviado exitosamente
	if (exitoso) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center p-4">
				<Card className="max-w-md w-full">
					<CardHeader>
						<div className="flex items-center gap-2 text-green-600">
							<CheckCircle className="h-6 w-6" />
							<CardTitle>¡Gracias por tu calificación!</CardTitle>
						</div>
					</CardHeader>
					<CardContent>
						<p className="text-gray-700 mb-4">
							Tu opinión es muy importante para nosotros y nos ayuda a mejorar
							nuestro servicio.
						</p>
						<div className="flex justify-center mb-4">
							{renderEstrellas(puntuacion, () => {}, 0, null, "large")}
						</div>
						<Button
							onClick={() => window.location.href = "/"}
							className="w-full"
						>
							Volver al inicio
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	// Formulario de calificación
	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center p-4">
			<Card className="max-w-2xl w-full">
				<CardHeader className="text-center">
					<CardTitle className="text-2xl">Califica tu experiencia</CardTitle>
					<CardDescription>
						{reservaData?.codigoReserva && `Reserva: ${reservaData.codigoReserva}`}
						<br />
						{reservaData?.origen} → {reservaData?.destino}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-6">
						{/* Calificación General */}
						<div className="text-center space-y-3">
							<label className="block text-lg font-semibold text-gray-900">
								Calificación General <span className="text-red-500">*</span>
							</label>
							<div className="flex justify-center">
								{renderEstrellas(
									puntuacion,
									setPuntuacion,
									puntuacionHover,
									setPuntuacionHover,
									"large"
								)}
							</div>
							{puntuacion > 0 && (
								<p className="text-sm text-gray-600">
									{puntuacion} de 5 estrellas
								</p>
							)}
						</div>

						{/* Aspectos Específicos */}
						<div className="space-y-4 border-t pt-6">
							<h3 className="font-semibold text-gray-900">
								Aspectos del servicio <span className="text-gray-500 text-sm font-normal">(opcional)</span>
							</h3>

							{/* Puntualidad */}
							<div className="flex items-center justify-between">
								<label className="text-gray-700">Puntualidad</label>
								{renderEstrellas(
									aspectos.puntualidad,
									(val) => setAspectos({ ...aspectos, puntualidad: val }),
									0,
									null,
									"small"
								)}
							</div>

							{/* Limpieza */}
							<div className="flex items-center justify-between">
								<label className="text-gray-700">Limpieza del vehículo</label>
								{renderEstrellas(
									aspectos.limpieza,
									(val) => setAspectos({ ...aspectos, limpieza: val }),
									0,
									null,
									"small"
								)}
							</div>

							{/* Amabilidad */}
							<div className="flex items-center justify-between">
								<label className="text-gray-700">Amabilidad del conductor</label>
								{renderEstrellas(
									aspectos.amabilidad,
									(val) => setAspectos({ ...aspectos, amabilidad: val }),
									0,
									null,
									"small"
								)}
							</div>

							{/* Conducción */}
							<div className="flex items-center justify-between">
								<label className="text-gray-700">Calidad de la conducción</label>
								{renderEstrellas(
									aspectos.conduccion,
									(val) => setAspectos({ ...aspectos, conduccion: val }),
									0,
									null,
									"small"
								)}
							</div>
						</div>

						{/* Comentario */}
						<div className="space-y-2 border-t pt-6">
							<label className="block text-gray-900 font-semibold">
								Comentario <span className="text-gray-500 text-sm font-normal">(opcional)</span>
							</label>
							<Textarea
								value={comentario}
								onChange={(e) => setComentario(e.target.value)}
								placeholder="Cuéntanos sobre tu experiencia..."
								rows={4}
								maxLength={500}
								className="resize-none"
							/>
							<p className="text-xs text-gray-500 text-right">
								{comentario.length}/500 caracteres
							</p>
						</div>

						{/* Botón de envío */}
						<Button
							type="submit"
							disabled={enviando || puntuacion === 0}
							className="w-full"
							size="lg"
						>
							{enviando ? (
								<>
									<Loader2 className="mr-2 h-5 w-5 animate-spin" />
									Enviando...
								</>
							) : (
								"Enviar Calificación"
							)}
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
};

export default CalificarServicio;
