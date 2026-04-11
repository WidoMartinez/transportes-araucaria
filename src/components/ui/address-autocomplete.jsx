import React, { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";

/**
 * Componente de autocompletado de direcciones.
 *
	* Usa Places API (New) por HTTP para evitar inconsistencias del Web Component
	* y dependencia de servicios legacy del SDK de Maps.
 *
 * Arquitectura:
	* - El input React sigue siendo la fuente de verdad del formulario.
	* - Al escribir, se consultan sugerencias de Places API con debounce.
	* - Al seleccionar, primero se guarda la direccion sugerida y luego se enriquece con Place Details.
	* - Si no hay API key, funciona como input de texto simple.
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
	const debounceTimerRef = useRef(null);
	const autocompleteAbortRef = useRef(null);
	const detailsAbortRef = useRef(null);
	const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
	const isAvailable = Boolean(apiKey);
	const [active, setActive] = useState(false);
	const [suggestions, setSuggestions] = useState([]);
	const [highlightedIndex, setHighlightedIndex] = useState(-1);
	const focusOutTimerRef = useRef(null);
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

	useEffect(() => {
		return () => {
			if (focusOutTimerRef.current) clearTimeout(focusOutTimerRef.current);
			if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
			autocompleteAbortRef.current?.abort();
			detailsAbortRef.current?.abort();
		};
	}, []);

	useEffect(() => {
		if (!isAvailable) return;
		if (!active) {
			setSuggestions([]);
			setHighlightedIndex(-1);
			return;
		}

		const query = value?.trim() || "";
		if (!query) {
			setSuggestions([]);
			setHighlightedIndex(-1);
			return;
		}

		if (selectedAddressRef.current === query) {
			return;
		}

		if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
		debounceTimerRef.current = setTimeout(() => {
			autocompleteAbortRef.current?.abort();
			const controller = new AbortController();
			autocompleteAbortRef.current = controller;

			fetch("https://places.googleapis.com/v1/places:autocomplete", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"X-Goog-Api-Key": apiKey,
					"X-Goog-FieldMask": "suggestions.placePrediction.place,suggestions.placePrediction.placeId,suggestions.placePrediction.text.text,suggestions.placePrediction.structuredFormat.mainText.text,suggestions.placePrediction.structuredFormat.secondaryText.text",
				},
				body: JSON.stringify({
					input: query,
					languageCode: "es",
					regionCode: "CL",
					includedRegionCodes: ["cl"],
					...autocompleteOptions,
				}),
				signal: controller.signal,
			})
				.then(async (response) => {
					if (!response.ok) {
						throw new Error(`Autocomplete HTTP ${response.status}`);
					}
					return response.json();
				})
				.then((data) => {
					const predictions = data?.suggestions
						?.map((item) => item?.placePrediction)
						.filter(Boolean) || [];

					if (!predictions.length) {
						setSuggestions([]);
						setHighlightedIndex(-1);
						return;
					}

					setSuggestions(predictions);
					setHighlightedIndex(0);
				})
				.catch((error) => {
					if (error.name === "AbortError") return;
					console.warn("[AddressAutocomplete] No se pudieron obtener sugerencias:", error?.message ?? error);
					setSuggestions([]);
					setHighlightedIndex(-1);
				});
		}, 180);

		return () => {
			if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
		};
	}, [active, apiKey, autocompleteOptions, isAvailable, value]);

	const applyAddressValue = (address) => {
		selectedAddressRef.current = address;
		onChangeRef.current?.({ target: { name: nameRef.current, value: address } });
	};

	const handleSuggestionSelect = (prediction) => {
		if (!prediction) return;

		if (focusOutTimerRef.current) {
			clearTimeout(focusOutTimerRef.current);
			focusOutTimerRef.current = null;
		}

		const fallbackAddress =
			prediction.text?.text?.trim() ||
			prediction.structuredFormat?.mainText?.text?.trim() ||
			"";
		if (fallbackAddress) {
			applyAddressValue(fallbackAddress);
		}

		setSuggestions([]);
		setHighlightedIndex(-1);
		setActive(false);

		if (!prediction.place || !apiKey) return;

		detailsAbortRef.current?.abort();
		const controller = new AbortController();
		detailsAbortRef.current = controller;

		fetch(`https://places.googleapis.com/v1/${prediction.place}?languageCode=es&regionCode=CL`, {
			headers: {
				"X-Goog-Api-Key": apiKey,
				"X-Goog-FieldMask": "formattedAddress,addressComponents,location",
			},
			signal: controller.signal,
		})
			.then(async (response) => {
				if (!response.ok) {
					throw new Error(`Place Details HTTP ${response.status}`);
				}
				return response.json();
			})
			.then((place) => {
				const address = place?.formattedAddress?.trim();

				onPlaceSelectedRef.current?.({
					address: fallbackAddress || address || "",
					components: place?.addressComponents || [],
					geometry: place?.location ? { location: place.location } : null,
					formattedAddress: address || "",
					placeId: prediction.placeId || "",
				});
			})
			.catch((error) => {
				if (error.name === "AbortError") return;
				console.warn("[AddressAutocomplete] No se pudieron obtener detalles del lugar:", error?.message ?? error);
			});
	};

	return (
		<div className="relative">
			<MapPin className="absolute left-3 top-3 h-5 w-5 text-muted-foreground pointer-events-none z-10" />

			<input
				ref={inputRef}
				id={id}
				name={name}
				value={value || ""}
				onChange={(event) => {
					selectedAddressRef.current = null;
					onChange(event);
				}}
				placeholder={placeholder}
				className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 pl-10 ${className}`}
				required={required}
				autoComplete="off"
				onFocus={() => {
					if (focusOutTimerRef.current) {
						clearTimeout(focusOutTimerRef.current);
						focusOutTimerRef.current = null;
					}
					selectedAddressRef.current = null;
					setActive(true);
				}}
				onBlur={() => {
					focusOutTimerRef.current = setTimeout(() => {
						focusOutTimerRef.current = null;
						setActive(false);
						setSuggestions([]);
						setHighlightedIndex(-1);
					}, 180);
				}}
				onKeyDown={(event) => {
					if (!suggestions.length) return;

					if (event.key === "ArrowDown") {
						event.preventDefault();
						setHighlightedIndex((current) => (current + 1) % suggestions.length);
						return;
					}

					if (event.key === "ArrowUp") {
						event.preventDefault();
						setHighlightedIndex((current) => (current <= 0 ? suggestions.length - 1 : current - 1));
						return;
					}

					if (event.key === "Enter") {
						if (highlightedIndex < 0 || highlightedIndex >= suggestions.length) return;
						event.preventDefault();
						handleSuggestionSelect(suggestions[highlightedIndex]);
						return;
					}

					if (event.key === "Escape") {
						setSuggestions([]);
						setHighlightedIndex(-1);
						setActive(false);
					}
				}}
				{...props}
			/>

			{active && suggestions.length > 0 && (
				<ul
					className="absolute left-0 right-0 top-full z-20 mt-1 max-h-72 overflow-auto rounded-md border border-border bg-background shadow-lg"
					role="listbox"
				>
					{suggestions.map((prediction, index) => {
						const isHighlighted = index === highlightedIndex;
						return (
							<li key={prediction.placeId || prediction.place} role="option" aria-selected={isHighlighted}>
								<button
									type="button"
									className={`w-full px-3 py-2 text-left text-sm ${isHighlighted ? "bg-muted" : "bg-background hover:bg-muted/60"}`}
									onMouseDown={(event) => {
										event.preventDefault();
										handleSuggestionSelect(prediction);
									}}
								>
									<div className="font-medium text-foreground">
										{prediction.structuredFormat?.mainText?.text || prediction.text?.text}
									</div>
									{prediction.structuredFormat?.secondaryText?.text && (
										<div className="text-xs text-muted-foreground">
											{prediction.structuredFormat.secondaryText.text}
										</div>
									)}
								</button>
							</li>
						);
					})}
				</ul>
			)}
		</div>
	);
}
