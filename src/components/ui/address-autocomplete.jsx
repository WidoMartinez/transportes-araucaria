import React, { useEffect, useRef, useState } from "react";
import { useGoogleMaps } from "../../hooks/useGoogleMaps";
import { MapPin } from "lucide-react";

/**
 * Componente de autocompletado de direcciones.
 *
 * Usa PlaceAutocompleteElement (API nueva, requerida desde marzo 2025).
 * El script de Google Maps se carga SIN v=beta para evitar ApiTargetBlockedMapError.
 *
 * Arquitectura:
 * - Cuando Google Maps está disponible, PlaceAutocompleteElement se monta en el DOM
 *   y se superpone visualmente sobre el input React.
 * - El input React queda visible (opacity:0) para que los formularios lean su valor.
 * - La selección de lugar actualiza el estado React vía onChangeRef (evita stale closure).
 * - Si Google Maps no está disponible, funciona como input de texto simple.
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
	const [active, setActive] = useState(false);
	const [webComponentActive, setWebComponentActive] = useState(false);
	const focusOutTimerRef = useRef(null);
	// Dirección seleccionada: se guarda al dispararse place-changed y se usa como
	// fuente de verdad. Previene que eventos input posteriores la sobreescriban.
	const selectedAddressRef = useRef(null);

	// Refs para evitar stale closures: los event listeners se registran UNA SOLA VEZ
	// pero al ser async necesitan acceder siempre al callback MÁS RECIENTE del padre.
	const onChangeRef = useRef(onChange);
	const onPlaceSelectedRef = useRef(onPlaceSelected);
	const nameRef = useRef(name);
	useEffect(() => {
		onChangeRef.current = onChange;
		onPlaceSelectedRef.current = onPlaceSelected;
		nameRef.current = name;
	});

	const showWebComponent = webComponentActive && (!value || active);

	useEffect(() => {
		if (!isLoaded || !isAvailable) return;
		if (elementRef.current) return;
		if (!window.google?.maps?.places?.PlaceAutocompleteElement) return;

		const containerNode = containerRef.current;
		if (!containerNode) return;

		const element = new window.google.maps.places.PlaceAutocompleteElement({
			componentRestrictions: { country: "cl" },
			types: ["address"],
			...autocompleteOptions,
		});

		if (placeholder) element.setAttribute("placeholder", placeholder);
		containerNode.appendChild(element);
		elementRef.current = element;

		// Foco: cancelar timer de ocultamiento si el usuario vuelve al campo
		element.addEventListener("focusin", () => {
			if (focusOutTimerRef.current) {
				clearTimeout(focusOutTimerRef.current);
				focusOutTimerRef.current = null;
			}
			selectedAddressRef.current = null; // Limpiar selección previa al re-enfocar
			setActive(true);
		});

		// Desenfoque con delay para no ocultar el dropdown antes de que se procese
		// el clic en la sugerencia (mousedown → focusout → place-changed)
		element.addEventListener("focusout", () => {
			focusOutTimerRef.current = setTimeout(() => {
				focusOutTimerRef.current = null;
				setActive(false);
			}, 300);
		});

		// Escritura del usuario: solo propagar a React si NO hay una selección
		// completada (evita que el Web Component sobreescriba la dirección elegida
		// con el texto parcial escrito, que algunos navegadores disparan post-selección).
		element.addEventListener("input", (evt) => {
			if (selectedAddressRef.current !== null) return;
			const innerTarget = evt.composedPath?.()[0];
			const text = innerTarget?.value ?? evt.target?.value ?? "";
			onChangeRef.current?.({ target: { name: nameRef.current, value: text } });
		});

		element.addEventListener("gmp-requesterror", () => {
			setWebComponentActive(false);
		});

		// Selección de sugerencia
		element.addEventListener(
			"gmp-placeautocomplete-place-changed",
			async () => {
				// Cancelar ocultamiento para que el overlay no desaparezca durante el proceso
				if (focusOutTimerRef.current) {
					clearTimeout(focusOutTimerRef.current);
					focusOutTimerRef.current = null;
				}

				// element.value es un PlacePrediction (NO un Place).
				// PlacePrediction.text.text entrega el texto completo SINCRÓNICAMENTE
				// sin llamadas adicionales: "Bordelago, Pucón - Camino Villarrica - Pucón, Chile".
				const prediction = element.value;
				if (!prediction) {
					setActive(false);
					return;
				}

				const fallbackAddress = prediction.text?.text?.trim() || "";
				if (fallbackAddress) {
					// Guardar de inmediato: bloquea que el listener de 'input' sobreescriba
					// la dirección con el texto parcial que el usuario había escrito.
					selectedAddressRef.current = fallbackAddress;
					onChangeRef.current?.({
						target: { name: nameRef.current, value: fallbackAddress },
					});
				}

				try {
					// Para llamar fetchFields se necesita un Place, no un PlacePrediction.
					// prediction.toPlace() crea el objeto Place correspondiente.
					// fetchFields da la dirección normalizada por Google (más precisa si hay billing).
					const place = prediction.toPlace();
					await place.fetchFields({
						fields: ["formattedAddress", "addressComponents", "location"],
					});
					const address = place.formattedAddress?.trim();
					if (address) {
						selectedAddressRef.current = address;
						onChangeRef.current?.({
							target: { name: nameRef.current, value: address },
						});
						onPlaceSelectedRef.current?.({
							address,
							components: place.addressComponents,
							geometry: place.location ? { location: place.location } : null,
						});
					}
				} catch (err) {
					// fetchFields falló (Places API no habilitada o sin billing):
					// el fallbackAddress ya fue guardado arriba, no hay pérdida de dato.
					console.warn(
						"[AddressAutocomplete] fetchFields falló:",
						err?.message ?? err,
					);
				} finally {
					setActive(false);
				}
			},
		);

		setWebComponentActive(true);

		return () => {
			if (focusOutTimerRef.current) clearTimeout(focusOutTimerRef.current);
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

			{/* Input React: fuente de verdad del formulario. Se oculta visualmente
			    cuando el Web Component está activo, pero sigue en el DOM. */}
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
				onFocus={() => {
					if (webComponentActive) {
						setActive(true);
						requestAnimationFrame(() => elementRef.current?.focus());
					}
				}}
				style={
					showWebComponent ? { opacity: 0, pointerEvents: "none" } : undefined
				}
				{...props}
			/>

			{/* Contenedor del PlaceAutocompleteElement */}
			{isAvailable && (
				<div
					ref={containerRef}
					className="gmp-autocomplete-wrapper"
					style={{
						position: "absolute",
						inset: 0,
						display: showWebComponent ? "block" : "none",
						zIndex: 1,
					}}
				/>
			)}
		</div>
	);
}
