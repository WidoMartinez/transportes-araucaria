
from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch()
    page = browser.new_page()

    try:
        page.goto("http://localhost:5173/")

        # Use a more robust locator for the "Reservar ahora" button
        reservar_button = page.locator('section#inicio').get_by_role('button', name='🚀 Reservar ahora')

        # Wait for the button to be visible and enabled before clicking
        expect(reservar_button).to_be_visible()
        expect(reservar_button).to_be_enabled()
        reservar_button.click(force=True)

        # Step 1: Fill trip details
        page.select_option('select[name="origen"]', 'Aeropuerto La Araucanía')
        page.select_option('select[name="destino"]', 'Pucón')
        page.fill('input[name="fecha"]', '2025-12-24')
        page.select_option('select[name="pasajeros"]', '2')
        page.click('button:has-text("Continuar al pago →")')

        # Step 2: Fill personal details, which makes the checkbox visible
        page.fill('input[name="nombre"]', 'Test User')
        page.fill('input[name="email"]', 'test@example.com')
        page.fill('input[name="telefono"]', '+56912345678')

        # Use the label text to find and check the consent checkbox
        consent_label = page.locator('label[for="payment-consent"]')
        consent_label.check()

        # Select payment type first
        page.get_by_role("button", name="Reservar con 40%").click()

        # Now click the payment method button
        page.get_by_role("button", name="Flow").click()

        # The above click will trigger a redirect to the payment gateway.
        # We will simulate a successful payment by navigating back to our app
        # with the success URL parameters.
        # A dummy reserva_id is used as the backend is not actually hit in this test.
        page.goto("http://localhost:5173/?flow_payment=success&reserva_id=12345")

        # Wait for the "CompletarDetalles" component to be visible
        completion_header = page.locator('h1:has-text("Completa los detalles de tu reserva")')
        expect(completion_header).to_be_visible()

        # Take a screenshot
        page.screenshot(path="jules-scratch/verification/verification.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
