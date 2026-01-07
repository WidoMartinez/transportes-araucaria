// src/components/EvaluarServicio.jsx
// Componente para evaluar el servicio de transporte recibido
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { getBackendUrl } from "../lib/backend";
import { Star, Clock, Sparkles, Shield, MessageCircle, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

/**
 * Componente de estrellas interactivo
 * @param {Object} props
 * @param {number} props.value - Valor actual (1-5)
 * @param {Function} props.onChange - Callback al cambiar
 * @param {string} props.label - Etiqueta de la categoría
 * @param {React.ReactNode} props.icon - Icono de la categoría
 */
const StarRating = ({ value, onChange, label, icon }) => {
	const [hover, setHover] = useState(0);

	return (
		<div className="space-y-2">
			<div className="flex items-center gap-2">
				{icon}
				<Label className="text-base font-medium">{label}</Label>
			</div>
			<div className="flex gap-1">
				{[1, 2, 3, 4, 5].map((star) => (
					<button
						key={star}
						type="button"
						onClick={() => onChange(star)}
						onMouseEnter={() => setHover(star)}
						onMouseLeave={() => setHover(0)}
						className="transition-all duration-200 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 rounded"
						aria-label={`${star} estrella${star !== 1 ? 's' : ''}`}
					>
						<Star
							className={`w-8 h-8 transition-colors duration-200 ${
								star <= (hover || value)
									? "fill-yellow-400 text-yellow-400"
									: "text-gray-300"
							}`}
						/>
					</button>
				))}
			</div>
		</div>
	);
};

/**
 * Componente principal de evaluación de servicio
 * @param {Object} props
 * @param {Object} props.datos - Datos de la evaluación
 * @param {string} props.datos.token - Token de autenticación
 * @param {string} props.datos.evaluacionId - ID de la evaluación
 * @param {Object} props.datos.reserva - Datos de la reserva
 * @param {Object} props.datos.conductor - Datos del conductor
 * @param {string} props.datos.clienteNombre - Nombre del cliente
 */
const EvaluarServicio = ({ datos }) => {
	// Estados para las calificaciones (todas obligatorias)
	const [calificaciones, setCalificaciones] = useState({
		puntualidad: 0,
		limpieza: 0,
		seguridad: 0,
		comunicacion: 0,
	});

	// Estado para comentario opcional
	const [comentario, setComentario] = useState("");

	// Estados para propina
	const [propinaMonto, setPropinaMonto] = useState(0);
	const [propinaPersonalizada, setPropinaPersonalizada] = useState("");
	const [mostrarInputPersonalizado, setMostrarInputPersonalizado] = useState(false);

	// Estados del formulario
	const [estadoFormulario, setEstadoFormulario] = useState("evaluando"); // evaluando, enviando, enviado, error
	const [mensajeError, setMensajeError] = useState("");

	// Valores predefinidos de propina
	const opcionesPropina = [
		{ valor: 0, etiqueta: "$0" },
		{ valor: 1000, etiqueta: "$1.000" },
		{ valor: 3000, etiqueta: "$3.000" },
		{ valor: 5000, etiqueta: "$5.000" },
	];

	/**
	 * Actualiza una calificación individual
	 */
	const actualizarCalificacion = (categoria, valor) => {
		setCalificaciones((prev) => ({
			...prev,
			[categoria]: valor,
		}));
	};

	/**
	 * Maneja la selección de propina predefinida
	 */
	const seleccionarPropina = (valor) => {
		setPropinaMonto(valor);
		setPropinaPersonalizada("");
		setMostrarInputPersonalizado(false);
	};

	/**
	 * Maneja la entrada de propina personalizada
	 */
	const manejarPropinaPersonalizada = (e) => {
		const valor = e.target.value.replace(/\D/g, ""); // Solo números
		setPropinaPersonalizada(valor);
		setPropinaMonto(parseInt(valor) || 0);
	};

	/**
	 * Valida que todas las calificaciones estén completas
	 */
	const validarFormulario = () => {
		const todasLasCalificaciones = Object.values(calificaciones);
		const algunaVacia = todasLasCalificaciones.some((cal) => cal === 0);
		
		if (algunaVacia) {
			setMensajeError("Por favor califica todas las categorías (1-5 estrellas)");
			return false;
		}

		if (propinaMonto < 0) {
			setMensajeError("El monto de propina no puede ser negativo");
			return false;
		}

		return true;
	};

	/**
	 * Formatea números a formato chileno (CLP)
	 */
	const formatearMoneda = (valor) => {
		return new Intl.NumberFormat("es-CL", {
			style: "currency",
			currency: "CLP",
			minimumFractionDigits: 0,
		}).format(valor);
	};

	/**
	 * Envía la evaluación al backend
	 */
	const enviarEvaluacion = async (e) => {
		e.preventDefault();

		if (!validarFormulario()) {
			return;
		}

		setEstadoFormulario("enviando");
		setMensajeError("");

		try {
			const apiUrl = getBackendUrl() || "https://transportes-araucaria.onrender.com";
			const response = await fetch(`${apiUrl}/api/evaluaciones/guardar`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					token: datos.token,
					calificaciones,
					comentario: comentario.trim(),
					propinaMonto,
				}),
			});

			const resultado = await response.json();

			if (!response.ok) {
				throw new Error(resultado.message || "Error al guardar la evaluación");
			}

			// Si hay propina y URL de pago, redirigir a Flow
			if (propinaMonto > 0 && resultado.paymentUrl) {
				window.location.href = resultado.paymentUrl;
				return;
			}

			// Sin propina o sin URL de pago, mostrar mensaje de agradecimiento
			setEstadoFormulario("enviado");
		} catch (error) {
			console.error("Error al enviar evaluación:", error);
			setMensajeError(error.message || "Error al enviar la evaluación. Por favor intenta nuevamente.");
			setEstadoFormulario("error");
		}
	};

	// Vista de éxito
	if (estadoFormulario === "enviado") {
		return (
			<div className="max-w-2xl mx-auto">
				<Card className="shadow-xl border-green-200">
					<CardContent className="pt-6">
						<div className="text-center space-y-6 py-8">
							<div className="flex justify-center">
								<CheckCircle className="w-20 h-20 text-green-600 animate-bounce" />
							</div>
							<div className="space-y-2">
								<h2 className="text-3xl font-bold text-gray-800">
									¡Gracias por tu evaluación!
								</h2>
								<p className="text-lg text-gray-600">
									Tu opinión nos ayuda a mejorar nuestro servicio
								</p>
							</div>
							<div className="bg-green-50 rounded-lg p-4 space-y-2">
								<p className="text-sm text-gray-700">
									<strong>Conductor:</strong> {datos.conductor?.nombre || "N/A"}
								</p>
								<p className="text-sm text-gray-700">
									<strong>Reserva:</strong> {datos.reserva?.codigoReserva || "N/A"}
								</p>
								{propinaMonto > 0 && (
									<p className="text-sm text-gray-700">
										<strong>Propina:</strong> {formatearMoneda(propinaMonto)}
									</p>
								)}
							</div>
							<p className="text-sm text-gray-500">
								Esperamos volver a servirte pronto
							</p>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	// Categorías con sus respectivos iconos
	const categorias = [
		{ key: "puntualidad", label: "Puntualidad", icon: <Clock className="w-5 h-5 text-purple-600" /> },
		{ key: "limpieza", label: "Limpieza", icon: <Sparkles className="w-5 h-5 text-blue-600" /> },
		{ key: "seguridad", label: "Seguridad", icon: <Shield className="w-5 h-5 text-green-600" /> },
		{ key: "comunicacion", label: "Comunicación", icon: <MessageCircle className="w-5 h-5 text-orange-600" /> },
	];

	return (
		<div className="max-w-2xl mx-auto">
			<Card className="shadow-xl">
				<CardHeader className="space-y-2 bg-gradient-to-r from-purple-50 to-blue-50 rounded-t-lg">
					<CardTitle className="text-2xl md:text-3xl text-center">
						Evalúa tu experiencia
					</CardTitle>
					<CardDescription className="text-center text-base">
						Tu opinión es muy importante para nosotros
					</CardDescription>
				</CardHeader>

				<CardContent className="pt-6 space-y-6">
					{/* Información de la reserva */}
					<div className="bg-gray-50 rounded-lg p-4 space-y-2">
						<h3 className="font-semibold text-gray-800 mb-2">Detalles del servicio</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
							<p className="text-gray-700">
								<strong>Cliente:</strong> {datos.clienteNombre || "N/A"}
							</p>
							<p className="text-gray-700">
								<strong>Conductor:</strong> {datos.conductor?.nombre || "N/A"}
							</p>
							<p className="text-gray-700">
								<strong>Código:</strong> {datos.reserva?.codigoReserva || "N/A"}
							</p>
							<p className="text-gray-700">
								<strong>Fecha:</strong> {datos.reserva?.fecha || "N/A"}
							</p>
						</div>
						{datos.reserva?.origen && datos.reserva?.destino && (
							<p className="text-gray-700 text-sm pt-2">
								<strong>Ruta:</strong> {datos.reserva.origen} → {datos.reserva.destino}
							</p>
						)}
					</div>

					<form onSubmit={enviarEvaluacion} className="space-y-6">
						{/* Calificaciones por categoría */}
						<div className="space-y-4">
							<h3 className="font-semibold text-gray-800 text-lg">
								Califica el servicio <span className="text-red-500">*</span>
							</h3>
							<div className="space-y-4 bg-white p-4 rounded-lg border border-gray-200">
								{categorias.map((categoria) => (
									<StarRating
										key={categoria.key}
										value={calificaciones[categoria.key]}
										onChange={(valor) => actualizarCalificacion(categoria.key, valor)}
										label={categoria.label}
										icon={categoria.icon}
									/>
								))}
							</div>
							<p className="text-xs text-gray-500">* Todas las categorías son obligatorias</p>
						</div>

						{/* Comentario opcional */}
						<div className="space-y-2">
							<Label htmlFor="comentario" className="text-base">
								Comentario (opcional)
							</Label>
							<Textarea
								id="comentario"
								placeholder="Cuéntanos más sobre tu experiencia..."
								value={comentario}
								onChange={(e) => setComentario(e.target.value)}
								rows={4}
								className="resize-none"
								maxLength={500}
							/>
							<p className="text-xs text-gray-500 text-right">
								{comentario.length}/500 caracteres
							</p>
						</div>

						{/* Selector de propina */}
						<div className="space-y-3">
							<Label className="text-base">Propina para el conductor (opcional)</Label>
							
							{/* Botones predefinidos */}
							<div className="grid grid-cols-2 md:grid-cols-4 gap-2">
								{opcionesPropina.map((opcion) => (
									<Button
										key={opcion.valor}
										type="button"
										variant={propinaMonto === opcion.valor && !mostrarInputPersonalizado ? "default" : "outline"}
										onClick={() => seleccionarPropina(opcion.valor)}
										className="w-full"
									>
										{opcion.etiqueta}
									</Button>
								))}
							</div>

							{/* Botón para monto personalizado */}
							<Button
								type="button"
								variant={mostrarInputPersonalizado ? "default" : "outline"}
								onClick={() => setMostrarInputPersonalizado(!mostrarInputPersonalizado)}
								className="w-full"
							>
								Otro monto
							</Button>

							{/* Input personalizado */}
							{mostrarInputPersonalizado && (
								<div className="space-y-2 animate-in slide-in-from-top-2">
									<Label htmlFor="propina-personalizada">Monto personalizado (CLP)</Label>
									<Input
										id="propina-personalizada"
										type="text"
										placeholder="Ingresa el monto"
										value={propinaPersonalizada}
										onChange={manejarPropinaPersonalizada}
										className="text-lg"
									/>
									{propinaMonto > 0 && (
										<p className="text-sm text-gray-600">
											Propina: <strong>{formatearMoneda(propinaMonto)}</strong>
										</p>
									)}
								</div>
							)}

							{propinaMonto > 0 && !mostrarInputPersonalizado && (
								<p className="text-sm text-gray-600 text-center">
									Propina seleccionada: <strong>{formatearMoneda(propinaMonto)}</strong>
								</p>
							)}
						</div>

						{/* Mensaje de error */}
						{estadoFormulario === "error" && mensajeError && (
							<div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 animate-in slide-in-from-top-2">
								<AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
								<p className="text-sm text-red-800">{mensajeError}</p>
							</div>
						)}

						{/* Botón de envío */}
						<Button
							type="submit"
							disabled={estadoFormulario === "enviando"}
							className="w-full py-6 text-lg"
							size="lg"
						>
							{estadoFormulario === "enviando" ? (
								<>
									<Loader2 className="w-5 h-5 mr-2 animate-spin" />
									Enviando evaluación...
								</>
							) : (
								"Enviar evaluación"
							)}
						</Button>

						{propinaMonto > 0 && (
							<p className="text-xs text-center text-gray-500">
								Serás redirigido a Flow para completar el pago de la propina
							</p>
						)}
					</form>
				</CardContent>
			</Card>
		</div>
	);
};

export default EvaluarServicio;
