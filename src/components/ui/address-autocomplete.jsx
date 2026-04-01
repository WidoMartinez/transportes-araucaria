import React, { useEffect, useRef, useState } from "react";
import { useGoogleMaps } from "../../hooks/useGoogleMaps";
import { MapPin, Loader2 } from "lucide-react";

/**
 * Componente de autocompletado de direcciones.
 *
 * Arquitectura:
 * - Un <input> controlado por React es SIEMPRE el elemento visible y la fuente de verdad.
 *   Esto garantiza que el formulario siempre funcione aunque la API de Google falle.
 * - Si la API de Google Maps está cargada y con billing habilitado, se activa
 *   PlaceAutocompleteElement como mejora: cuando el usuario selecciona una sugerencia,
 *   se actualiza el input controlado con la dirección normalizada.
 * - Si la API devuelve 403 (billing no habilitado) o cualquier otro error, el input
 *   de texto simple sigue funcionando sin interrupciones.
 *
 * @param {string} props.value - Valor actual del campo
 * @param {Function} props.onChange - Callback cuando cambia el valor
 * @param {Function} props.onPlaceSelected - Callback opcional con datos completos del lugar
 * @param {string} props.placeholder - Texto de placeholder
 * @param {string} props.id - ID del input
 * @param {string} props.name - Nombre del campo
 * @param {string} props.className - Clases CSS adicionales
 * @param {boolean} props.required - Si el campo es requerido
 * @param {Object} props.autocompleteOptions - Opciones adicionales para PlaceAutocompleteElement
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
	const elementRef = useRef(null);
	const containerRef = useRef(null);
	const { isLoaded, isAvailable } = useGoogleMaps();
	const [isInitializing, setIsInitializing] = useState(false);
	// Indica si el Web Component está activo y superpuesto sobre el input nativo
	const [webComponentActive, setWebComponentActive] = useState(false);

	// Inicializar PlaceAutocompleteElement cuando la API esté lista
	useEffect(() => {
		if (!isAvailable || !isLoaded) return;
		if (elementRef.current) return;

		if (!window.google?.maps?.places?.PlaceAutocompleteElement) {
			return;
		}

		// Capturar el nodo al inicio del efecto para usarlo en el cleanup
		const containerNode = containerRef.current;
		if (!containerNode) return;

		setIsInitializing(true);

		try {
			const element = new window.google.maps.places.PlaceAutocompleteElement({
				componentRestrictions: { country: "cl" },
				types: ["address"],
				...autocompleteOptions,
			});

			if (placeholder) element.setAttribute("placeholder", placeholder);

			if (containerRef.current) {
				containerRef.current.appendChild(element);
				elementRef.current = element;
			}

			// Capturar el texto del input interno del Web Component mientras el usuario escribe.
			// Los eventos 'input' del shadow DOM son composed:true, por lo que burbujean
			// hacia afuera. composedPath()[0] da acceso al elemento real (dentro del shadow DOM).
			// Esto mantiene React state sincronizado aunque el billing no esté habilitado.
			element.addEventListener("input", (evt) => {
				const innerTarget = evt.composedPath?.()[0];
				const text = innerTarget?.value ?? evt.target?.value ?? "";
				if (text !== undefined && onChange) {
					onChange({ target: { name, value: text } });
				}
			});

			// Si hay error de billing o dominio bloqueado, ocultar el Web Component.
			// El input nativo React sigue activo y captura el texto sin interrupciones.
			// Como el evento 'input' ya sincronizó el valor, el input nativo mostrará
			// el mismo texto que tenía el Web Component.
			element.addEventListener("gmp-requesterror", (evt) => {
				console.warn(
					"[AddressAutocomplete] API no disponible (sin billing o dominio bloqueado).",
					evt.error?.status || "",
				);
				setWebComponentActive(false);
			});

			// Cuando el usuario selecciona una sugerencia, actualizar el input nativo
			element.addEventListener(
				"gmp-placeautocomplete-place-changed",
				async () => {
					const place = element.value;
					if (!place) return;

					try {
						// fetchFields obtiene la dirección normalizada (requiere billing)
						await place.fetchFields({
							fields: ["formattedAddress", "addressComponents", "location"],
						});
						const address = place.formattedAddress || "";
						if (address) {
							if (onChange) onChange({ target: { name, value: address } });
							if (onPlaceSelected) {
								onPlaceSelected({
									address,
									components: place.addressComponents,
									geometry: place.location
										? { location: place.location }
										: null,
								});
							}
						}
					} catch (fetchErr) {
						// Sin billing, fetchFields falla: el input nativo ya tiene el texto escrito
						void fetchErr;
					}
				},
			);

			setWebComponentActive(true);
		} catch (error) {
			console.error(
				"[AddressAutocomplete] Error al crear PlaceAutocompleteElement:",
				error,
			);
		} finally {
			setIsInitializing(false);
		}

		return () => {
			const el = elementRef.current;
			if (el && containerNode?.contains(el)) {
				try {
					containerNode.removeChild(el);
				} catch (e) {
					void e;
				}
			}
			elementRef.current = null;
		};
	}, [isLoaded, isAvailable]); // eslint-disable-line react-hooks/exhaustive-deps

	return (
		<div className="relative">
			<MapPin className="absolute left-3 top-3 h-5 w-5 text-muted-foreground pointer-events-none z-10" />

			{/* Input nativo React: SIEMPRE en el DOM como fuente de verdad del formulario.
			    Cuando el Web Component está activo, se vuelve invisible (opacity:0) para
			    evitar la superposición de texto/placeholder, pero sigue recibiendo el valor
			    y permite que la validación funcione correctamente. */}
			<input
				ref={inputRef}
				id={id}
				name={name}
				value={value || ""}
				onChange={onChange}
				placeholder={placeholder}
				className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 pl-10 ${className}`}
				required={required}
				autoComplete="off"
				style={
					webComponentActive ? { opacity: 0, pointerEvents: "none" } : undefined
				}
				{...props}
			/>

			{/* PlaceAutocompleteElement: superpuesto sobre el input nativo,
			    solo cuando billing está activo y sin errores de red. */}
			{isAvailable && (
				<div
					ref={containerRef}
					className="gmp-autocomplete-wrapper"
					style={{
						position: "absolute",
						inset: 0,
						display: webComponentActive ? "block" : "none",
						zIndex: 1,
					}}
				/>
			)}

			{isInitializing && (
				<Loader2 className="absolute right-3 top-3 h-5 w-5 text-muted-foreground animate-spin pointer-events-none z-10" />
			)}
		</div>
	);
}
