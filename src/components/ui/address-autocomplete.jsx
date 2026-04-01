import React, { useEffect, useRef, useState } from "react";
import { useGoogleMaps } from "../../hooks/useGoogleMaps";
import { MapPin, Loader2 } from "lucide-react";

/**
 * Componente de autocompletado de direcciones usando la nueva API
 * google.maps.places.PlaceAutocompleteElement (reemplaza la API legacy Autocomplete).
 * Funciona en modo degradado (input de texto simple) si no hay API key o si la API no está disponible.
 *
 * @param {string} props.value - Valor actual del campo (para modo fallback)
 * @param {Function} props.onChange - Callback cuando cambia el valor
 * @param {Function} props.onPlaceSelected - Callback opcional con datos completos del lugar
 * @param {string} props.placeholder - Texto de placeholder
 * @param {string} props.id - ID del input
 * @param {string} props.name - Nombre del campo (usado en el evento onChange)
 * @param {string} props.className - Clases CSS adicionales para el contenedor
 * @param {boolean} props.required - Si el campo es requerido
 * @param {Object} props.autocompleteOptions - Opciones adicionales para el elemento
 */
export function AddressAutocomplete({
	value,
	onChange,
	onPlaceSelected,
	placeholder = "Ingresa una dirección",
	id,
	name,
	className = "",
	required = false,
	autocompleteOptions = {},
	...props
}) {
	const wrapperRef = useRef(null);
	const elementRef = useRef(null);
	const { isLoaded, isAvailable } = useGoogleMaps();
	const [isInitializing, setIsInitializing] = useState(false);
	const [useFallback, setUseFallback] = useState(false);

	// Inicializar PlaceAutocompleteElement cuando la API esté lista
	useEffect(() => {
		if (!isAvailable || !isLoaded || !wrapperRef.current) return;
		// Evitar reinicialización
		if (elementRef.current) return;

		if (!window.google?.maps?.places?.PlaceAutocompleteElement) {
			console.warn(
				"[AddressAutocomplete] PlaceAutocompleteElement no disponible, usando modo degradado.",
			);
			setUseFallback(true);
			return;
		}

		setIsInitializing(true);

		try {
			// Crear el nuevo Web Component de autocompletado
			const element = new window.google.maps.places.PlaceAutocompleteElement({
				componentRestrictions: { country: "cl" },
				types: ["address"],
				...autocompleteOptions,
			});

			// Atributos del elemento
			if (id) element.id = id;
			if (placeholder) element.setAttribute("placeholder", placeholder);

			wrapperRef.current.appendChild(element);
			elementRef.current = element;

			// Detectar errores de red (403 billing, restricciones de dominio, etc.)
			// y degradar el componente a input de texto simple
			element.addEventListener("gmp-requesterror", (evt) => {
				console.warn(
					"[AddressAutocomplete] Error en la API de Google Maps (sin facturación o restricción de dominio). Cambiando a modo de texto simple.",
					evt.error?.status || evt,
				);
				// Remover el elemento roto y cambiar a modo degradado
				if (wrapperRef.current?.contains(element)) {
					try { wrapperRef.current.removeChild(element); } catch (_) {}
				}
				elementRef.current = null;
				setUseFallback(true);
			});

			// Escuchar evento de selección de lugar (nueva API)
			element.addEventListener(
				"gmp-placeautocomplete-place-changed",
				async () => {
					// En la nueva API, el lugar seleccionado se obtiene desde element.value
					const place = element.value;
					if (!place) return;

					try {
						await place.fetchFields({
							fields: [
								"addressComponents",
								"formattedAddress",
								"location",
								"displayName",
							],
						});

						const address = place.formattedAddress || "";

						if (onChange) {
							onChange({ target: { name, value: address } });
						}

						if (onPlaceSelected) {
							onPlaceSelected({
								address,
								components: place.addressComponents,
								geometry: place.location ? { location: place.location } : null,
								name: place.displayName,
							});
						}
					} catch (err) {
						console.error(
							"[AddressAutocomplete] Error al obtener detalles del lugar:",
							err,
						);
					}
				},
			);
		} catch (error) {
			console.error(
				"[AddressAutocomplete] Error al crear PlaceAutocompleteElement:",
				error,
			);
			setUseFallback(true);
		} finally {
			setIsInitializing(false);
		}

		return () => {
			// Cleanup: remover el elemento del DOM
			if (
				elementRef.current &&
				wrapperRef.current?.contains(elementRef.current)
			) {
				try {
					wrapperRef.current.removeChild(elementRef.current);
				} catch (_) {}
			}
			elementRef.current = null;
		};
	}, [isLoaded, isAvailable]); // eslint-disable-line react-hooks/exhaustive-deps

	// Modo degradado: input de texto simple cuando no hay API key o hay un error
	if (!isAvailable || useFallback) {
		return (
			<div className="relative">
				<MapPin className="absolute left-3 top-3 h-5 w-5 text-muted-foreground pointer-events-none z-10" />
				<input
					id={id}
					name={name}
					value={value || ""}
					onChange={onChange}
					placeholder={placeholder}
					className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 pl-10 ${className}`}
					required={required}
					autoComplete="off"
					{...props}
				/>
			</div>
		);
	}

	return (
		<div className="relative">
			<MapPin className="absolute left-3 top-3 h-5 w-5 text-muted-foreground pointer-events-none z-10" />
			{/* El PlaceAutocompleteElement se inyecta aquí por JS */}
			<div
				ref={wrapperRef}
				className={`gmp-autocomplete-wrapper ${className}`}
			/>
			{isInitializing && (
				<Loader2 className="absolute right-3 top-3 h-5 w-5 text-muted-foreground animate-spin pointer-events-none" />
			)}
		</div>
	);
}
