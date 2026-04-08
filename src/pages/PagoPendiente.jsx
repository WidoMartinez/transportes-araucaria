/**
 * src/pages/PagoPendiente.jsx
 *
 * Página que se muestra cuando el pago con Mercado Pago está en proceso
 * de verificación (pendiente de confirmación bancaria o manual).
 */

import { Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";

export default function PagoPendiente() {
	// Leer external_reference (reservaId) si viene en los params de retorno
	const params = new URLSearchParams(window.location.search);
	const reservaId = params.get("external_reference");

	const handleVolverInicio = () => {
		window.location.href = "/";
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
			<Card className="w-full max-w-md shadow-lg">
				<CardHeader className="text-center pb-2">
					<div className="flex justify-center mb-4">
						<Clock className="w-16 h-16 text-yellow-500" />
					</div>
					<CardTitle className="text-2xl text-yellow-700">
						Pago en proceso de verificación
					</CardTitle>
				</CardHeader>

				<CardContent className="text-center space-y-4">
					<p className="text-gray-600">
						Tu pago está siendo procesado por Mercado Pago. Este proceso
						puede tardar algunos minutos dependiendo del método de pago
						utilizado.
					</p>

					{reservaId && (
						<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
							<p className="text-sm text-yellow-700 font-medium">
								N° de Reserva:{" "}
								<span className="font-bold">{reservaId}</span>
							</p>
						</div>
					)}

					<div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
						<p className="text-sm text-blue-600">
							Recibirás una confirmación por correo electrónico una vez
							que el pago sea verificado. No es necesario realizar ninguna
							acción adicional.
						</p>
					</div>

					<Button
						onClick={handleVolverInicio}
						variant="outline"
						className="w-full mt-4"
					>
						Volver al inicio
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
