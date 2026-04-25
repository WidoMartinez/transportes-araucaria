/**
 * Utilidades para tracking de conversiones y eventos.
 */

export const WHATSAPP_CONV_KEY = "wa_conversion_fired";
export const WHATSAPP_SEND_TO = "AW-17529712870/M7-iCN_HtZUbEObh6KZB";

const waitForGtag = (timeoutMs = 2000) =>
	new Promise((resolve) => {
		if (typeof window === "undefined") {
			resolve(false);
			return;
		}

		if (typeof window.gtag === "function") {
			resolve(true);
			return;
		}

		const startTime = Date.now();
		const interval = window.setInterval(() => {
			if (typeof window.gtag === "function") {
				window.clearInterval(interval);
				resolve(true);
				return;
			}

			if (Date.now() - startTime >= timeoutMs) {
				window.clearInterval(interval);
				resolve(false);
			}
		}, 100);
	});

/**
 * Registra una conversion de WhatsApp en Google Ads si no se ha registrado en esta sesion.
 * @param {string} source - Origen del clic (Header, Footer, Button, etc.).
 * @returns {Promise<boolean>} true si se envio una conversion nueva.
 */
export const trackWhatsAppConversion = async (source = "unknown") => {
	if (typeof window === "undefined") {
		return false;
	}

	if (sessionStorage.getItem(WHATSAPP_CONV_KEY)) {
		console.info(
			`[${source}] Conversion WhatsApp ya registrada esta sesion, se omite.`,
		);
		return false;
	}

	const gtagListo = await waitForGtag();
	if (!gtagListo || typeof window.gtag !== "function") {
		console.warn(
			`[${source}] gtag no disponible. No se marca deduplicacion de WhatsApp.`,
		);
		return false;
	}

	sessionStorage.setItem(WHATSAPP_CONV_KEY, "1");

	window.gtag("event", "conversion", {
		send_to: WHATSAPP_SEND_TO,
		value: 1.0,
		currency: "CLP",
		event_label: source,
	});

	window.gtag("event", "click_whatsapp", {
		event_category: "engagement",
		event_label: source,
	});

	console.log(`[${source}] Conversion de clic en WhatsApp enviada.`);
	return true;
};
