// src/hooks/usePricingData.js

import { useState, useEffect, useCallback } from "react";
import { getBackendUrl } from "../lib/backend";

const API_BASE_URL = getBackendUrl() || "https://transportes-araucaria.onrender.com";

/**
 * Hook para obtener datos de pricing, especialmente descuentos globales
 * @returns {Object} { discountOnline, loading, error, refetch }
 */
export function usePricingData() {
	const [discountOnline, setDiscountOnline] = useState({
		valor: 0,
		activo: false,
		nombre: "Descuento por Reserva Online",
	});
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	const fetchPricing = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			// Intentar obtener desde localStorage primero (cache)
			const cachedPayload = localStorage.getItem("pricing_updated_payload");
			if (cachedPayload) {
				try {
					const parsed = JSON.parse(cachedPayload);
					if (parsed?.descuentosGlobales?.descuentoOnline) {
						setDiscountOnline({
							valor: parsed.descuentosGlobales.descuentoOnline.valor || 0,
							activo: parsed.descuentosGlobales.descuentoOnline.activo !== false,
							nombre: parsed.descuentosGlobales.descuentoOnline.nombre || "Descuento por Reserva Online",
						});
						setLoading(false);
						return;
					}
				} catch (e) {
					console.warn("Error al parsear pricing cache:", e);
				}
			}

			// Si no hay cache, consultar API
			const response = await fetch(`${API_BASE_URL}/pricing`);
			if (!response.ok) {
				throw new Error("No se pudo obtener la configuración de precios");
			}

			const data = await response.json();
			const discountData = {
				valor: data.descuentosGlobales?.descuentoOnline?.valor || 0,
				activo: data.descuentosGlobales?.descuentoOnline?.activo !== false,
				nombre: data.descuentosGlobales?.descuentoOnline?.nombre || "Descuento por Reserva Online",
			};

			setDiscountOnline(discountData);
		} catch (err) {
			console.error("Error al obtener pricing:", err);
			setError(err.message);
			// Valores por defecto en caso de error
			setDiscountOnline({
				valor: 0,
				activo: false,
				nombre: "Descuento por Reserva Online",
			});
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchPricing();

		// Escuchar eventos de actualización de pricing
		const handlePricingUpdate = (event) => {

			if (event.detail?.descuentosGlobales?.descuentoOnline) {
				setDiscountOnline({
					valor: event.detail.descuentosGlobales.descuentoOnline.valor || 0,
					activo: event.detail.descuentosGlobales.descuentoOnline.activo !== false,
					nombre: event.detail.descuentosGlobales.descuentoOnline.nombre || "Descuento por Reserva Online",
				});
			} else {
				fetchPricing();
			}
		};

		window.addEventListener("pricing_updated", handlePricingUpdate);

		return () => {
			window.removeEventListener("pricing_updated", handlePricingUpdate);
		};
	}, [fetchPricing]);

	return {
		discountOnline,
		loading,
		error,
		refetch: fetchPricing,
	};
}
