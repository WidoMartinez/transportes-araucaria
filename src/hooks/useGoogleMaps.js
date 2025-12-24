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

		// Si ya está cargado y disponible, no cargar de nuevo
		if (window.google && window.google.maps && window.google.maps.places) {
			setIsLoaded(true);
			return;
		}

		// Función de callback global
		window.googleMapsCallback = () => {
			setIsLoaded(true);
		};

		// Si ya hay un script cargándose
		const existingScript = document.querySelector(
			'script[src*="maps.googleapis.com"]'
		);
		
		if (existingScript) {
			// Si el script ya existe, comprobamos si ya terminó de cargar
			if (window.google && window.google.maps && window.google.maps.places) {
				setIsLoaded(true);
			} else {
				// Si no, esperamos un poco o reintentamos verificar
				// Nota: Esto es un fallback por si el callback original ya se disparó
				const interval = setInterval(() => {
					if (window.google && window.google.maps && window.google.maps.places) {
						setIsLoaded(true);
						clearInterval(interval);
					}
				}, 100);
				return () => clearInterval(interval);
			}
			return;
		}

		// Cargar el script
		const script = document.createElement("script");
		// Añadimos el callback a la URL
		script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&loading=async&libraries=places&language=es&region=CL&callback=googleMapsCallback`;
		script.async = true;
		script.defer = true;

		script.onerror = () => {
			setLoadError("Error al cargar la API de Google Maps");
		};

		document.head.appendChild(script);

		return () => {
			// Cleanup
			delete window.googleMapsCallback;
		};
	}, [apiKey]);

	return {
		isLoaded: isLoaded && !!apiKey,
		loadError,
		isAvailable: !!apiKey,
	};
}
