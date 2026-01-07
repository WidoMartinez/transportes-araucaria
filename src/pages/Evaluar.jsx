// src/pages/Evaluar.jsx
// Página pública para evaluar el servicio recibido
import { useState, useEffect } from "react";
import EvaluarServicio from "../components/EvaluarServicio";
import { getBackendUrl } from "../lib/backend";
import { Card, CardContent } from "../components/ui/card";
import { AlertCircle, CheckCircle, Clock, XCircle } from "lucide-react";

/**
 * Página de evaluación pública
 * Accesible mediante URL: /evaluar?token=XXXXX
 */
const Evaluar = () => {
	const [estado, setEstado] = useState("validando"); // validando, valido, invalido, expirado, evaluada
	const [datosEvaluacion, setDatosEvaluacion] = useState(null);
	const [error, setError] = useState(null);

	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		const token = params.get("token");

		if (!token) {
			setEstado("invalido");
			setError("No se proporcionó un token de evaluación");
			return;
		}

		validarToken(token);
	}, []);

	const validarToken = async (token) => {
		try {
			const apiUrl = getBackendUrl() || "https://transportes-araucaria.onrender.com";
			const response = await fetch(`${apiUrl}/api/evaluaciones/validar-token/${token}`);
			const data = await response.json();

			if (data.success && data.estado === "valido") {
				setEstado("valido");
				setDatosEvaluacion({
					token,
					...data.data,
				});
			} else {
				setEstado(data.estado || "invalido");
				setError(data.message || "Token inválido");
			}
		} catch (err) {
			console.error("Error validando token:", err);
			setEstado("error");
			setError("Error al validar el token. Por favor, intenta nuevamente.");
		}
	};

	const renderEstado = () => {
		switch (estado) {
			case "validando":
				return (
					<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-4">
						<Card className="w-full max-w-md">
							<CardContent className="pt-6">
								<div className="text-center space-y-4">
									<Clock className="w-16 h-16 mx-auto text-purple-600 animate-pulse" />
									<h2 className="text-2xl font-bold text-gray-800">
										Validando enlace...
									</h2>
									<p className="text-gray-600">
										Por favor espera un momento
									</p>
								</div>
							</CardContent>
						</Card>
					</div>
				);

			case "valido":
				return (
					<div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4 py-8">
						<EvaluarServicio datos={datosEvaluacion} />
					</div>
				);

			case "evaluada":
				return (
					<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-4">
						<Card className="w-full max-w-md">
							<CardContent className="pt-6">
								<div className="text-center space-y-4">
									<CheckCircle className="w-16 h-16 mx-auto text-green-600" />
									<h2 className="text-2xl font-bold text-gray-800">
										Ya evaluaste este servicio
									</h2>
									<p className="text-gray-600">
										Esta reserva ya fue evaluada anteriormente.
										Gracias por tu feedback.
									</p>
								</div>
							</CardContent>
						</Card>
					</div>
				);

			case "expirado":
				return (
					<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-4">
						<Card className="w-full max-w-md">
							<CardContent className="pt-6">
								<div className="text-center space-y-4">
									<Clock className="w-16 h-16 mx-auto text-orange-600" />
									<h2 className="text-2xl font-bold text-gray-800">
										Enlace expirado
									</h2>
									<p className="text-gray-600">
										Este enlace de evaluación ha expirado (válido por 72 horas).
									</p>
									<p className="text-sm text-gray-500">
										Si deseas evaluar este servicio, por favor contacta a
										nuestro equipo de soporte.
									</p>
								</div>
							</CardContent>
						</Card>
					</div>
				);

			case "invalido":
			case "error":
			default:
				return (
					<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-4">
						<Card className="w-full max-w-md">
							<CardContent className="pt-6">
								<div className="text-center space-y-4">
									{estado === "error" ? (
										<AlertCircle className="w-16 h-16 mx-auto text-red-600" />
									) : (
										<XCircle className="w-16 h-16 mx-auto text-red-600" />
									)}
									<h2 className="text-2xl font-bold text-gray-800">
										{estado === "error" ? "Error" : "Enlace inválido"}
									</h2>
									<p className="text-gray-600">
										{error || "El enlace de evaluación no es válido."}
									</p>
									<p className="text-sm text-gray-500">
										Por favor verifica el enlace que recibiste por correo.
									</p>
								</div>
							</CardContent>
						</Card>
					</div>
				);
		}
	};

	return renderEstado();
};

export default Evaluar;
