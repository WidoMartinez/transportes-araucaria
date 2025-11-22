import sys
from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # We need to use the local dev server URL.
        # Assuming it's running on localhost:5173 based on memory.
        page = browser.new_page()

        try:
            print("Navigating to homepage...")
            page.goto("http://localhost:5173")

            # Wait for the HeroExpress component to be visible
            print("Waiting for HeroExpress search bar...")
            # The search bar container has specific classes we added
            page.wait_for_selector("text=Tu viaje comienza aquí", timeout=10000)

            # Step 1: Fill out the form
            print("Filling out search form...")

            # Select Origen
            # Note: The select elements might be tricky if they are native selects (which they are in my code)
            # or if Shadcn Select was used (which I replaced with native selects for the inputs inside the bar for simplicity/layout,
            # wait, looking at my code I used native <select> for the search bar inputs to keep them lightweight inside the flex container).
            # "w-full bg-transparent border-none..."

            # Let's inspect the code I wrote:
            # <select id="hero-origen" ...>

            print("Selecting Origen...")
            page.select_option("select#hero-origen", index=1) # Select first available option

            print("Selecting Destino...")
            page.select_option("select#hero-destino", index=1)

            print("Selecting Fecha...")
            # Set a future date
            page.fill("input#hero-fecha", "2025-12-25")

            print("Selecting Hora...")
            # The hora select doesn't have an ID in the code I wrote:
            # <select value={formData.hora} ...> inside the div with label "Hora"
            # It shares the parent div structure.
            # I can target it by name if I added name="hora" but I didn't add name="hora" explicitly in the select props in the previous step?
            # Wait, looking at code: onChange={(e) => handleInputChange({ target: { name: "hora", value: e.target.value } })}
            # It doesn't have a name attribute on the DOM element itself in my code block?
            # Let's check: <select value={formData.hora} ...> NO name attribute.
            # I should fix that or target it by surrounding label.
            # It is inside a div that has a sibling label "Hora".

            # Targetting by CSS structure:
            # It's the 4th select in the grid (Origen, Destino, (Input date), Hora, Pasajeros)
            # Actually the 3rd select element (Origen, Destino, [Input], Hora, Pasajeros)

            print("Selecting Hora (by order)...")
            page.locator("select").nth(2).select_option(index=5) # Select some time

            print("Selecting Pasajeros...")
            page.select_option("select#hero-pasajeros", "2")

            # Click Search
            print("Clicking Search button...")
            page.click("button:has-text('Buscar')")

            # Step 2: Verify Sheet Opens
            print("Waiting for Sheet to open...")
            # The sheet title is "Resumen"
            page.wait_for_selector("text=Resumen", state="visible", timeout=5000)

            print("Sheet opened successfully!")

            # Check for form fields inside sheet
            if page.is_visible("input#hero-nombre"):
                print("Found Name input in Sheet.")
            else:
                print("ERROR: Name input not found.")
                sys.exit(1)

            print("Verification passed!")

        except Exception as e:
            print(f"Verification failed: {e}")
            sys.exit(1)
        finally:
            browser.close()

if __name__ == "__main__":
    run()
