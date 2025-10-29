const { test, expect } = require("@playwright/test");

test.describe("Hero Section", () => {
	test("should display the main titles", async ({ page }) => {
		await page.goto("http://localhost:5174"); // Asegúrate de que esta URL es la correcta

		// Verificar que el título principal es visible
		const mainTitle = page.locator("h1", {
			hasText: "Viajes privados y de turismo",
		});
		await expect(mainTitle).toBeVisible();

		// Verificar que el subtítulo es visible
		const subtitle = page.locator("p", {
			hasText: "Cotiza y reserva en línea de forma rápida y segura.",
		});
		await expect(subtitle).toBeVisible();

		// Tomar una captura de pantalla para la verificación visual
		await page.screenshot({ path: "tests/playwright/screenshots/hero-titles.png" });
	});
});
