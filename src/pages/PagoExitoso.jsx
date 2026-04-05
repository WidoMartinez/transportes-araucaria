/**
 * src/pages/PagoExitoso.jsx
 *
 * Página de confirmación de pago exitoso con Mercado Pago.
 * Se muestra cuando MP redirige de vuelta con status aprobado.
 *
 * Lee los query params que MP incluye en la URL de retorno:
 *   payment_id         - ID del pago en Mercado Pago
 *   status             - Estado del pago (approved, etc.)
 *   external_reference - El reservaId que enviamos como referencia
 */

import { CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";

export default function PagoExitoso() {
	// Leer los parámetros que Mercado Pago incluye en la URL de retorno
	const params = new URLSearchParams(window.location.search);
	const paymentId = params.get("payment_id");
	const status = params.get("status");
	const reservaId = params.get("external_reference");

	const handleVolverInicio = () => {
		window.location.href = "/";
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
			<Card className="w-full max-w-md shadow-lg">
				<CardHeader className="text-center pb-2">
					<div className="flex justify-center mb-4">
						<CheckCircle className="w-16 h-16 text-green-500" />
					</div>
					<CardTitle className="text-2xl text-green-700">
						¡Pago realizado con éxito!
					</CardTitle>
				</CardHeader>

				<CardContent className="text-center space-y-4">
					<p className="text-gray-600">
						Tu pago fue procesado correctamente. Recibirás una confirmación
						por correo electrónico con los detalles de tu reserva.
					</p>

					{reservaId && (
						<div className="bg-green-50 border border-green-200 rounded-lg p-3">
							<p className="text-sm text-green-700 font-medium">
								N° de Reserva:{" "}
								<span className="font-bold">{reservaId}</span>
							</p>
						</div>
					)}

					{paymentId && (
						<p className="text-xs text-gray-400">
							ID de pago: {paymentId}
							{status && ` · Estado: ${status}`}
						</p>
					)}

					<Button
						onClick={handleVolverInicio}
						className="w-full mt-4"
					>
						Volver al inicio
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
