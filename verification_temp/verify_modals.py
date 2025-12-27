from playwright.sync_api import sync_playwright
import time

def verify_modals():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 720})
        page = context.new_page()

        print("Navegando a la aplicación...")
        page.goto("http://localhost:5173")
        page.wait_for_load_state("networkidle")

        print("Llenando formulario de paso 1...")
        # Llenar fecha (mañana)
        # Usar una fecha fija lejana para asegurar disponibilidad
        page.fill('input#fecha', '2025-12-27')

        # Seleccionar origen (si es necesario, por defecto suele ser Aeropuerto)
        # Verificamos valor actual
        origen_val = page.input_value('select#origen')
        if not origen_val:
            page.select_option('select#origen', 'Aeropuerto La Araucanía')

        # Seleccionar destino (Pucón)
        print("Seleccionando destino Pucón...")
        page.select_option('select#destino', 'Pucón')

        # Seleccionar hora
        print("Seleccionando hora 10:00...")
        page.select_option('select#hora', '10:00')

        # Esperar un momento para simulaciones de carga/precios
        page.wait_for_timeout(1000)

        print("Avanzando al paso 2...")
        # Click en "Reservar Ahora"
        # Usamos un selector robusto para el botón
        page.click('button:has-text("Reservar Ahora")')

        # Esperar a que aparezca el formulario del paso 2 (Detalles y Pago)
        try:
            page.wait_for_selector('text=Detalles y Pago', timeout=10000)
        except Exception as e:
            # Si falla, imprimimos el contenido para debug
            print("Error esperando paso 2. Contenido actual:")
            # print(page.content())
            raise e

        print("Verificando modal de Términos...")
        # Click en "términos y condiciones"
        # El texto está dentro de un span dentro de un label.
        page.click('text=términos y condiciones')

        # Verificar que el modal se abre
        page.wait_for_selector('text=Condiciones de servicio')

        # Tomar screenshot
        page.screenshot(path="verification_temp/terminos_modal.png")
        print("Screenshot de términos capturado.")

        # Cerrar modal (escape)
        page.keyboard.press('Escape')
        page.wait_for_timeout(500)

        print("Verificando modal de Política de Privacidad...")
        # Click en "política de privacidad"
        page.click('text=política de privacidad')

        # Verificar modal
        page.wait_for_selector('text=Política de Privacidad')

        # Tomar screenshot
        page.screenshot(path="verification_temp/politica_modal.png")
        print("Screenshot de privacidad capturado.")

        # Cerrar modal
        page.keyboard.press('Escape')
        page.wait_for_timeout(500)

        print("Verificando estado del checkbox...")
        # Verificar que el checkbox NO está marcado
        # El checkbox tiene id="terms" pero Shadcn a veces usa button[role="checkbox"].
        # En HeroExpress.jsx: <Checkbox id="terms" ... /> que renderiza un button.
        # Buscamos por id terms.

        is_checked = page.get_by_role("checkbox", name="Acepto los términos y condiciones y la política de privacidad.").is_checked()
        # O usar locator('#terms')
        is_checked_id = page.locator('#terms').is_checked()

        if not is_checked_id:
            print("SUCCESS: El checkbox permanece desmarcado tras abrir los modales.")
        else:
            print(f"FAILURE: El checkbox se marcó incorrectamente (checked={is_checked_id}).")
            exit(1)

        browser.close()

if __name__ == "__main__":
    verify_modals()
