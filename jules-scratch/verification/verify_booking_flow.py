
import time
from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # Ir directamente a la página principal
        page.goto("http://localhost:5173/")

        # Esperar a que el formulario de reserva sea visible
        expect(page.get_by_role("heading", name="Viaja a cualquier lugar")).to_be_visible(timeout=15000)

        # Rellenar el formulario de cotización
        page.select_option('select[name="origen"]', 'Aeropuerto La Araucanía')
        page.select_option('select[name="destino"]', 'Pucón')
        page.fill('input[name="fecha"]', '2025-12-24')
        page.select_option('select[name="pasajeros"]', '2')

        # Hacer clic en "Ver precios"
        ver_precios_button = page.get_by_role("button", name="Ver precios")
        ver_precios_button.click()

        # Esperar a que la segunda etapa (datos personales) sea visible
        expect(page.get_by_role("button", name="Pagar con Flow")).to_be_visible(timeout=5000)

        # Rellenar los datos personales
        page.fill('input[name="nombre"]', 'Juan Pérez')
        page.fill('input[name="email"]', 'juan.perez@example.com')
        page.fill('input[name="telefono"]', '+56912345678')

        # Tomar la captura de pantalla final que muestra todo el flujo
        page.screenshot(path="jules-scratch/verification/verification.png")

    except Exception as e:
        print(f"An error occurred: {e}")
        page.screenshot(path="jules-scratch/verification/error.png")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
