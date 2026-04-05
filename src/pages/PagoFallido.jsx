/**
 * src/pages/PagoFallido.jsx
 *
 * Página que se muestra cuando el pago con Mercado Pago no se completó.
 * MP redirige aquí cuando el usuario cancela o hay un error en el pago.
 */

import { XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";

export default function PagoFallido() {
	const handleVolverInicio = () => {
		window.location.href = "/";
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
			<Card className="w-full max-w-md shadow-lg">
				<CardHeader className="text-center pb-2">
					<div className="flex justify-center mb-4">
						<XCircle className="w-16 h-16 text-red-500" />
					</div>
					<CardTitle className="text-2xl text-red-700">
						El pago no se completó
					</CardTitle>
				</CardHeader>

				<CardContent className="text-center space-y-4">
					<p className="text-gray-600">
						Hubo un problema al procesar tu pago. No se realizó ningún
						cobro. Por favor verifica tus datos e intenta nuevamente.
					</p>

					<div className="bg-red-50 border border-red-200 rounded-lg p-3">
						<p className="text-sm text-red-600">
							Si el problema persiste, contáctanos por WhatsApp para
							coordinar tu reserva de forma alternativa.
						</p>
					</div>

					<Button
						onClick={handleVolverInicio}
						className="w-full mt-4"
					>
						Intentar nuevamente
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
