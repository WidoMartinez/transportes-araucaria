import { useEffect, useState } from "react";

/**
 * Hook para cargar la API de Google Maps Places
 * @returns {Object} Estado de carga de Google Maps
 */
export function useGoogleMaps() {
	const [isLoaded, setIsLoaded] = useState(false);
	const [loadError, setLoadError] = useState(null);
	
	const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

	useEffect(() => {
		// Si no hay API key, no intentamos cargar
		if (!apiKey) {
			return;
		}

		// Si ya está cargado, no cargar de nuevo
		if (window.google && window.google.maps && window.google.maps.places) {
			setIsLoaded(true);
			return;
		}

		// Si ya hay un script cargándose, esperar
		const existingScript = document.querySelector(
			'script[src*="maps.googleapis.com"]'
		);
		if (existingScript) {
			existingScript.addEventListener("load", () => setIsLoaded(true));
			existingScript.addEventListener("error", (e) =>
				setLoadError(e.message || "Error al cargar Google Maps")
			);
			return;
		}

		// Cargar el script
		const script = document.createElement("script");
		script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=es&region=CL`;
		script.async = true;
		script.defer = true;

		script.addEventListener("load", () => {
			setIsLoaded(true);
		});

		script.addEventListener("error", () => {
			setLoadError("Error al cargar la API de Google Maps");
		});

		document.head.appendChild(script);

		return () => {
			// Cleanup: no removemos el script porque puede ser usado por otros componentes
		};
	}, [apiKey]);

	return {
		isLoaded: isLoaded && !!apiKey,
		loadError,
		isAvailable: !!apiKey,
	};
}
