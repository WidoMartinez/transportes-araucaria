from playwright.sync_api import sync_playwright, expect
import time

def verify_promo_message():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()

        print("Navigating to home page...")
        page.goto("http://localhost:5173")

        print("Waiting for HeroExpress component...")
        page.wait_for_selector("select#origen")

        print("Selecting origin and destination...")
        page.select_option("select#origen", index=1)
        page.select_option("select#destino", index=1)

        print("Checking for promo message...")
        try:
            promo_locator = page.get_by_text("Precio especial si reservas ida y vuelta")
            expect(promo_locator).to_be_visible(timeout=5000)
            print("SUCCESS: Promo message is visible when destination is selected and idaVuelta is unchecked.")

            page.screenshot(path="verification_promo_visible.png")

            print("Checking checking the checkbox hides the message...")
            # Use get_by_text since we removed htmlFor
            page.get_by_text("Necesito regreso").click()

            time.sleep(1)

            expect(promo_locator).not_to_be_visible()
            print("SUCCESS: Promo message is hidden when idaVuelta is checked.")

            page.screenshot(path="verification_promo_hidden.png")

        except Exception as e:
            print(f"FAILURE: {e}")
            page.screenshot(path="verification_failure.png")
            raise e
        finally:
            browser.close()

if __name__ == "__main__":
    verify_promo_message()
