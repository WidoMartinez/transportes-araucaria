/**
 * src/components/BotonPagoMercadoPago.jsx
 *
 * Componente reutilizable para iniciar el pago con Mercado Pago (Checkout Pro).
 *
 * Al hacer clic, llama al backend para crear una preferencia de pago y
 * redirige al usuario a la URL de pago de Mercado Pago (init_point).
 *
 * Props:
 *   reservaId    {number|string}  - ID de la reserva a pagar (requerido)
 *   monto        {number}         - Monto total a cobrar en CLP (requerido)
 *   descripcion  {string}         - Descripción del ítem (opcional)
 *   emailCliente {string}         - Email del cliente para MP (opcional)
 */

import { useState } from "react";
import { toast } from "sonner";
import { getBackendUrl } from "../lib/backend";
import { LoaderCircle } from "lucide-react";

// Logo de Mercado Pago en SVG simplificado (azul corporativo)
function LogoMP() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="currentColor"
			className="w-5 h-5"
			aria-hidden="true"
		>
			<path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.418 0-8-3.582-8-8s3.582-8 8-8 8 3.582 8 8-3.582 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
		</svg>
	);
}

export default function BotonPagoMercadoPago({
	reservaId,
	monto,
	descripcion,
	emailCliente,
}) {
	const [cargando, setCargando] = useState(false);

	const handlePagar = async () => {
		// Validación básica en el cliente antes de llamar al backend
		if (!reservaId || !monto || Number(monto) <= 0) {
			toast.error("Datos de reserva inválidos. Por favor recarga la página.");
			return;
		}

		setCargando(true);

		try {
			const backendUrl = getBackendUrl();
			const respuesta = await fetch(
				`${backendUrl}/api/pagos/crear-preferencia`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						reservaId,
						monto,
						descripcion:
							descripcion ||
							"Reserva de transporte - Transportes Araucanía",
						email_cliente: emailCliente,
					}),
				},
			);

			if (!respuesta.ok) {
				const errorData = await respuesta.json().catch(() => ({}));
				throw new Error(
					errorData.error || `Error del servidor (${respuesta.status})`,
				);
			}

			const { init_point } = await respuesta.json();

			if (!init_point) {
				throw new Error("No se recibió la URL de pago desde el servidor.");
			}

			// Redirigir al portal de pago de Mercado Pago
			window.location.href = init_point;
		} catch (error) {
			console.error("❌ Error al iniciar pago con Mercado Pago:", error);
			toast.error(
				error.message ||
					"No se pudo iniciar el pago. Por favor, intenta de nuevo.",
			);
			setCargando(false);
		}
	};

	return (
		<button
			onClick={handlePagar}
			disabled={cargando}
			className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 bg-[#009ee3] hover:bg-[#007bbf] active:bg-[#006da8] disabled:bg-[#009ee3]/60 text-white font-semibold rounded-lg shadow-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#009ee3] focus:ring-offset-2"
			aria-label="Pagar con Mercado Pago"
		>
			{cargando ? (
				<>
					<LoaderCircle className="w-5 h-5 animate-spin" />
					<span>Procesando...</span>
				</>
			) : (
				<>
					<LogoMP />
					<span>Pagar con Mercado Pago</span>
				</>
			)}
		</button>
	);
}
