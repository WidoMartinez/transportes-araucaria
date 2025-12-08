import React, { useEffect, useRef, useState } from "react";
import { Input } from "./input";
import { useGoogleMaps } from "../../hooks/useGoogleMaps";
import { MapPin, Loader2 } from "lucide-react";

/**
 * Componente de autocompletado de direcciones con Google Places
 * Funciona en modo degradado si no hay API key disponible
 * 
 * @param {Object} props - Propiedades del componente
 * @param {string} props.value - Valor actual del campo
 * @param {Function} props.onChange - Callback cuando cambia el valor
 * @param {Function} props.onPlaceSelected - Callback cuando se selecciona un lugar (opcional)
 * @param {string} props.placeholder - Texto de placeholder
 * @param {string} props.id - ID del input
 * @param {string} props.name - Nombre del input
 * @param {string} props.className - Clases CSS adicionales
 * @param {boolean} props.required - Si el campo es requerido
 * @param {Object} props.autocompleteOptions - Opciones para el autocompletado de Google
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
	const inputRef = useRef(null);
	const autocompleteRef = useRef(null);
	const { isLoaded, isAvailable } = useGoogleMaps();
	const [isInitializing, setIsInitializing] = useState(false);

	useEffect(() => {
		// Si no está disponible o no está cargado, no hacer nada
		if (!isAvailable || !isLoaded || !inputRef.current) {
			return;
		}

		// Si ya está inicializado, no reinicializar
		if (autocompleteRef.current) {
			return;
		}

		setIsInitializing(true);

		try {
			// Configuración por defecto para Chile
			const defaultOptions = {
				componentRestrictions: { country: "cl" },
				fields: ["address_components", "formatted_address", "geometry", "name"],
				types: ["address"],
				...autocompleteOptions,
			};

			// Crear instancia de autocomplete
			const autocomplete = new window.google.maps.places.Autocomplete(
				inputRef.current,
				defaultOptions
			);

			// Manejar selección de lugar
			autocomplete.addListener("place_changed", () => {
				const place = autocomplete.getPlace();

				if (place.formatted_address) {
					// Actualizar el valor del input
					if (onChange) {
						onChange({
							target: {
								name: name,
								value: place.formatted_address,
							},
						});
					}

					// Callback adicional con información completa del lugar
					if (onPlaceSelected) {
						onPlaceSelected({
							address: place.formatted_address,
							components: place.address_components,
							geometry: place.geometry,
							name: place.name,
						});
					}
				}
			});

			autocompleteRef.current = autocomplete;
		} catch (error) {
			console.error("Error al inicializar Google Places Autocomplete:", error);
		} finally {
			setIsInitializing(false);
		}

		return () => {
			// Cleanup: remover listeners si existen
			if (autocompleteRef.current) {
				window.google.maps.event.clearInstanceListeners(
					autocompleteRef.current
				);
				autocompleteRef.current = null;
			}
		};
	}, [isLoaded, isAvailable, name, onChange, onPlaceSelected, autocompleteOptions]);

	// Manejar cambios manuales del input
	const handleChange = (e) => {
		if (onChange) {
			onChange(e);
		}
	};

	return (
		<div className="relative">
			<MapPin className="absolute left-3 top-3 h-5 w-5 text-muted-foreground pointer-events-none z-10" />
			<Input
				ref={inputRef}
				id={id}
				name={name}
				value={value}
				onChange={handleChange}
				placeholder={placeholder}
				className={`pl-10 ${className}`}
				required={required}
				autoComplete="off"
				{...props}
			/>
			{isInitializing && (
				<Loader2 className="absolute right-3 top-3 h-5 w-5 text-muted-foreground animate-spin pointer-events-none" />
			)}
		</div>
	);
}
