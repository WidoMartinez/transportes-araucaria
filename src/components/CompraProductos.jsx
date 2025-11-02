import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import {
	Card,
	CardContent,
} from "./ui/card";
import {
	AlertCircle,
	Loader2,
	CreditCard,
} from "lucide-react";

import { getBackendUrl } from "../lib/backend";
import ProductosReserva from "./ProductosReserva";

const API_URL =
        getBackendUrl() || "https://transportes-araucaria-backend.onrender.com";

function CompraProductos() {
	const [reserva, setReserva] = useState(null);
	const [error, setError] = useState(null);
	const [paying, setPaying] = useState(false);
	const [payError, setPayError] = useState(null);
	const [totalProductos, setTotalProductos] = useState(0);

	useEffect(() => {
		const hash = window.location.hash;
		const match = hash.match(/#comprar-productos\/(.+)/);
		if (match && match[1]) {
			const codigo = match[1];
			buscarReserva(codigo);
		} else {
			setError("Código de reserva no encontrado en la URL.");
		}
	}, []);

	const buscarReserva = async (codigo) => {
		if (!codigo.trim()) {
			setError("Por favor ingresa un código de reserva");
			return;
		}

		setError(null);
		setReserva(null);

		try {
			const response = await fetch(
				`${API_URL}/api/reservas/codigo/${codigo.trim()}`
			);

			if (!response.ok) {
				if (response.status === 404) {
					throw new Error("No se encontró ninguna reserva con ese código");
				}
				throw new Error("Error al buscar la reserva");
			}

            const data = await response.json();
            setReserva(data);
		} catch (err) {
			setError(err.message);
		}
	};

	const continuarPago = async (tipo, monto) => {
		if (!reserva) return;
		try {
			setPaying(true);
			setPayError(null);
			const apiBase =
				getBackendUrl() ||
				"https://transportes-araucaria-backend.onrender.com";

			if (!monto || monto <= 0) {
				throw new Error("No hay monto disponible para generar el pago");
			}
			const description = `Pago de productos para la reserva ${reserva.codigoReserva}`;

			const resp = await fetch(`${apiBase}/create-payment`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					gateway: "flow",
					amount: monto,
					description,
					email: reserva.email,
					reservationId: reserva.id,
				}),
			});
			if (!resp.ok) {
				const detail = await resp.text().catch(() => "");
				throw new Error(`Error al generar pago (${resp.status}) ${detail}`);
			}
			const data = await resp.json();
			if (!data.url)
				throw new Error("Respuesta inválida del servidor de pagos");
			window.open(data.url, "_blank");
		} catch (e) {
			setPayError(e.message || "No se pudo iniciar el pago");
		} finally {
			setPaying(false);
		}
	};

	const formatCurrency = (amount) => {
		return new Intl.NumberFormat("es-CL", {
			style: "currency",
			currency: "CLP",
		}).format(amount || 0);
	};


	const getPaymentOptions = () => {
		const saldoPendiente = parseFloat(reserva?.saldo_pendiente || 0);
		const montoTotal = totalProductos + saldoPendiente;

		if (montoTotal <= 0) return [];

		const descriptions = [];
		if (totalProductos > 0) {
			descriptions.push(`Productos (${formatCurrency(totalProductos)})`);
		}
		if (saldoPendiente > 0) {
			descriptions.push(`Saldo Reserva (${formatCurrency(saldoPendiente)})`);
		}

		return [
			{
				tipo: "productos_y_saldo",
				monto: montoTotal,
				texto: `Pagar Total: ${descriptions.join(" + ")} = ${formatCurrency(
					montoTotal
				)}`,
				variant: "default",
				className: "bg-blue-600 hover:bg-blue-700",
			},
		];
	};

	const paymentOptions = reserva ? getPaymentOptions() : [];

	return (
		<div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-12 px-4">
			<div className="max-w-4xl mx-auto">
				{/* Encabezado */}
				<div className="text-center mb-8">
					<h1 className="text-4xl font-bold text-slate-900 mb-2">
						Añadir Productos a tu Viaje
					</h1>
					<p className="text-slate-600">
						Selecciona los productos que deseas agregar a tu reserva.
					</p>
				</div>

				{/* Error */}
				{error && (
					<Card className="mb-8 border-red-200 bg-red-50">
						<CardContent className="pt-6">
							<div className="flex items-center gap-2 text-red-800">
								<AlertCircle className="w-5 h-5" />
								<p>{error}</p>
							</div>
						</CardContent>
					</Card>
				)}

				{/* Resultado */}
				{reserva && (
					<div className="space-y-6">

						{/* Productos Adicionales */}
						<ProductosReserva
							reservaId={reserva.id}
							reserva={reserva}
							onTotalProductosChange={setTotalProductos}
							forzarVisible={true}
						/>

						{/* Acciones de pago */}
						{paymentOptions.length > 0 && (
							<Card>
								<CardContent className="pt-6">
									<div className="space-y-3">
										{payError && (
											<div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded p-3 text-sm">
												<AlertCircle className="w-4 h-4" />
												<span>{payError}</span>
											</div>
										)}
										<div className="flex flex-wrap gap-3">
											{paymentOptions.map((option) => (
												<Button
													key={option.tipo}
													onClick={() =>
														continuarPago(option.tipo, option.monto)
													}
													disabled={paying}
													variant={option.variant}
													className={`gap-2 ${option.className || ""}`}
												>
													{paying ? (
														<>
															<Loader2 className="w-4 h-4 animate-spin" />
															Generando pago...
														</>
													) : (
														<>
															<CreditCard className="w-4 h-4" />
															{option.texto}
														</>
													)}
												</Button>
											))}
										</div>
										<p className="text-xs text-muted-foreground">
											Se abrirá una ventana para completar el pago de forma
											segura con Flow.
										</p>
									</div>
								</CardContent>
							</Card>
						)}
					</div>
				)}
			</div>
		</div>
	);
}

export default CompraProductos;
