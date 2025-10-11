import { useEffect, useRef, useCallback } from "react";

/**
 * Hook personalizado para capturar datos de leads para remarketing
 * Captura datos del usuario incluso si no completa la reserva
 */
export const useLeadCapture = (formData, currentStep, apiUrl) => {
	const timeOnSiteRef = useRef(Date.now());
	const leadCapturedRef = useRef(false);
	const debounceTimerRef = useRef(null);

	// Detectar tipo de dispositivo
	const getDeviceType = () => {
		const ua = navigator.userAgent;
		if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
			return "tablet";
		}
		if (
			/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(
				ua
			)
		) {
			return "mobile";
		}
		return "desktop";
	};

	// Extraer información del navegador
	const getBrowserInfo = () => {
		const ua = navigator.userAgent;
		let browserName = "Unknown";
		let osName = "Unknown";

		// Detectar navegador
		if (ua.indexOf("Firefox") > -1) {
			browserName = "Firefox";
		} else if (ua.indexOf("Opera") > -1 || ua.indexOf("OPR") > -1) {
			browserName = "Opera";
		} else if (ua.indexOf("Trident") > -1) {
			browserName = "Internet Explorer";
		} else if (ua.indexOf("Edge") > -1 || ua.indexOf("Edg") > -1) {
			browserName = "Edge";
		} else if (ua.indexOf("Chrome") > -1) {
			browserName = "Chrome";
		} else if (ua.indexOf("Safari") > -1) {
			browserName = "Safari";
		}

		// Detectar sistema operativo
		if (ua.indexOf("Win") > -1) osName = "Windows";
		if (ua.indexOf("Mac") > -1) osName = "MacOS";
		if (ua.indexOf("Linux") > -1) osName = "Linux";
		if (ua.indexOf("Android") > -1) osName = "Android";
		if (ua.indexOf("like Mac") > -1) osName = "iOS";

		return { browserName, osName };
	};

	// Extraer parámetros UTM de la URL
	const getUtmParams = () => {
		const urlParams = new URLSearchParams(window.location.search);
		return {
			utmSource: urlParams.get("utm_source"),
			utmMedium: urlParams.get("utm_medium"),
			utmCampaign: urlParams.get("utm_campaign"),
			utmTerm: urlParams.get("utm_term"),
			utmContent: urlParams.get("utm_content"),
		};
	};

	// Función para capturar el lead
	const capturarLead = useCallback(
		async (pasoAlcanzado) => {
			// Solo capturar si hay al menos email o teléfono
			if (!formData.email && !formData.telefono) {
				return;
			}

			// Evitar múltiples capturas del mismo lead
			if (leadCapturedRef.current) {
				return;
			}

			const timeOnSite = Math.floor((Date.now() - timeOnSiteRef.current) / 1000);
			const { browserName, osName } = getBrowserInfo();
			const utmParams = getUtmParams();

			const leadData = {
				nombre: formData.nombre || null,
				email: formData.email || null,
				telefono: formData.telefono || null,
				origen: formData.origen || null,
				destino: formData.destino || null,
				fecha: formData.fecha || null,
				pasajeros: formData.pasajeros || null,
				ultimaPagina: window.location.pathname,
				tiempoEnSitio: timeOnSite,
				pasoAlcanzado: pasoAlcanzado || currentStep || "formulario_inicial",
				dispositivo: getDeviceType(),
				navegador: browserName,
				sistemaOperativo: osName,
				source: "express_web",
				...utmParams,
			};

			try {
				const url = apiUrl || "https://transportes-araucaria.onrender.com";
				const response = await fetch(`${url}/capturar-lead`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(leadData),
				});

				if (response.ok) {
					leadCapturedRef.current = true;
					console.log("📊 Lead capturado correctamente para remarketing");
				}
			} catch (error) {
				console.warn("Aviso: No se pudo capturar el lead:", error);
				// No interrumpir la experiencia del usuario
			}
		},
		[formData, currentStep, apiUrl]
	);

	// Capturar lead con debounce cuando cambia el formulario
	useEffect(() => {
		// Limpiar timeout anterior
		if (debounceTimerRef.current) {
			clearTimeout(debounceTimerRef.current);
		}

		// Capturar después de 3 segundos de inactividad
		debounceTimerRef.current = setTimeout(() => {
			if ((formData.email || formData.telefono) && !leadCapturedRef.current) {
				capturarLead(currentStep);
			}
		}, 3000);

		return () => {
			if (debounceTimerRef.current) {
				clearTimeout(debounceTimerRef.current);
			}
		};
	}, [formData.email, formData.telefono, currentStep, capturarLead]);

	// Capturar lead cuando el usuario está a punto de salir
	useEffect(() => {
		const handleBeforeUnload = () => {
			if ((formData.email || formData.telefono) && !leadCapturedRef.current) {
				// Usar sendBeacon para envío garantizado al salir
				const timeOnSite = Math.floor(
					(Date.now() - timeOnSiteRef.current) / 1000
				);
				const { browserName, osName } = getBrowserInfo();
				const utmParams = getUtmParams();

				const leadData = {
					nombre: formData.nombre || null,
					email: formData.email || null,
					telefono: formData.telefono || null,
					origen: formData.origen || null,
					destino: formData.destino || null,
					fecha: formData.fecha || null,
					pasajeros: formData.pasajeros || null,
					ultimaPagina: window.location.pathname,
					tiempoEnSitio: timeOnSite,
					pasoAlcanzado: currentStep || "formulario_abandonado",
					dispositivo: getDeviceType(),
					navegador: browserName,
					sistemaOperativo: osName,
					source: "express_web",
					...utmParams,
				};

				const url = apiUrl || "https://transportes-araucaria.onrender.com";
				const blob = new Blob([JSON.stringify(leadData)], {
					type: "application/json",
				});
				navigator.sendBeacon(`${url}/capturar-lead`, blob);
				leadCapturedRef.current = true;
			}
		};

		window.addEventListener("beforeunload", handleBeforeUnload);
		return () => window.removeEventListener("beforeunload", handleBeforeUnload);
	}, [formData, currentStep, apiUrl]);

	return { capturarLead };
};
