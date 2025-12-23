from playwright.sync_api import sync_playwright
import time

def verify_codigos_pago():
    with sync_playwright() as p:
        # Launch browser
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        try:
            # Login as Admin (simulated or real if needed)
            # The admin dashboard is protected, but we are running locally.
            # Assuming dev environment allows access or we can simulate auth.
            # For this verification, we will check if the elements exist in the component.
            # However, since AdminCodigosPago is behind auth, we might need to bypass it or login.
            # Let's try accessing the route directly assuming local dev might be lenient or we can use a test account.

            # Since auth is complex to script quickly without credentials, let's assume we can hit the page if we mock the auth context or if dev mode is open.
            # If not, we will verify the PagarConCodigo page which is public.

            # Verify PagarConCodigo public page
            print("Verifying PagarConCodigo page...")
            page.goto("http://localhost:5173/#pagar-con-codigo")
            page.wait_for_selector("#codigo")

            # Take a screenshot of the initial state
            page.screenshot(path="verification/pagar_con_codigo_initial.png")
            print("Screenshot saved: verification/pagar_con_codigo_initial.png")

            # We can't fully test the admin modal without logging in.
            # But we can verify the public facing changes.

            # To verify the admin modal, we would need to login.
            # Let's try to login using the default admin credentials if possible or skip admin verification if too complex for this step.
            # Memory says: "LoginAdmin.jsx" exists.

            print("Attempting to login as admin...")
            page.goto("http://localhost:5173/admin/login")

            # Check if we are already logged in or need to login
            if page.locator("input[type='email']").is_visible():
                page.fill("input[type='email']", "admin@transportesaraucaria.cl") # Guessing email based on context
                # Wait, I don't have the password.
                # I will skip the admin UI verification via Playwright for now and focus on code review/unit tests if needed.
                # But wait, I can check the `PagarConCodigo` page logic if I mock the API response.

                # Mock API response for code validation
                page.route("**/api/codigos-pago/TESTCODE", lambda route: route.fulfill(
                    status=200,
                    content_type="application/json",
                    body='{"success":true,"codigoPago":{"id":999,"codigo":"TESTCODE","origen":"Aeropuerto La Araucanía","destino":"Pucón","monto":"50000","descripcion":"Test Description","vehiculo":"Van","pasajeros":2,"idaVuelta":false,"permitirAbono":true,"sillaInfantil":true,"fechaVencimiento":"2025-12-31T23:59:00.000Z","usosMaximos":1,"usosActuales":0,"estado":"activo"}}'
                ))

                page.goto("http://localhost:5173/#pagar-con-codigo")
                page.fill("#codigo", "TESTCODE")
                page.click("button:has-text('Validar Código')")

                # Wait for validation
                page.wait_for_selector("text=Silla de Niño")

                # Take screenshot of the validated state showing "Silla de Niño" badge
                page.screenshot(path="verification/pagar_con_codigo_validated.png")
                print("Screenshot saved: verification/pagar_con_codigo_validated.png")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_codigos_pago()
