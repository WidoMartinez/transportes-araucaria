from playwright.sync_api import sync_playwright, expect
import time

def verify_images():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        try:
            # 1. Navegar a la aplicación
            print("Navegando a http://localhost:5173...")
            page.goto("http://localhost:5173", timeout=60000)

            # Esperar a que cargue el formulario
            page.wait_for_selector("select#destino")
            print("Formulario cargado.")

            destinations = ["Licán Ray", "Lautaro", "Melipeuco", "Panguipulli"]

            for dest in destinations:
                print(f"Seleccionando {dest}...")

                # Seleccionar el destino
                page.select_option("select#destino", label=dest)

                # Esperar un momento para que la imagen cambie (transición)
                time.sleep(2)

                # Buscar la imagen en el panel derecho.
                # El componente HeroExpress tiene una estructura de grid cols-2.
                # El panel derecho es el segundo div directo.

                # Usaremos evaluate con un selector más robusto o traversing
                img_src = page.evaluate('''() => {
                    // Buscar la sección hero
                    const hero = document.getElementById('inicio');
                    if (!hero) return "Sección inicio no encontrada";

                    // Buscar la imagen en el panel derecho (que es hidden en mobile, block en lg)
                    // Buscamos una imagen que NO esté dentro del formulario (el formulario está en el primer div)
                    const images = Array.from(hero.querySelectorAll('img'));

                    // La imagen de fondo suele ser la última o estar en el div container derecho
                    // Filtramos por visibilidad si es posible, o por posición

                    // En HeroExpress.jsx, la imagen dinámica está en el div:
                    // <div className="relative hidden lg:block h-full overflow-hidden bg-primary sticky top-0">

                    // Buscamos ese div específico por sus clases
                    const rightPanel = Array.from(hero.querySelectorAll('div')).find(div =>
                        div.className.includes('hidden lg:block') && div.className.includes('sticky top-0')
                    );

                    if (!rightPanel) return "Panel derecho no encontrado";

                    const img = rightPanel.querySelector('img');
                    return img ? img.src : "Imagen no encontrada en panel derecho";
                }''')

                print(f"Imagen para {dest}: {img_src}")

                if "hero-van" in str(img_src):
                    print(f"⚠️  ALERTA: Se muestra la imagen por defecto (hero-van).")
                elif "http" in str(img_src):
                    print(f"✅ Se muestra una imagen específica: {img_src}")
                else:
                    print(f"⚠️  Resultado inesperado: {img_src}")

                # Tomar screenshot
                filename = f"jules-scratch/verification/debug_{dest.replace(' ', '_').replace('á', 'a')}.png"
                page.screenshot(path=filename)

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_images()
