
import asyncio
import os
import re
import sys
from playwright.async_api import async_playwright, expect

async def main():
    # Iniciar el servidor de desarrollo
    print("Iniciando servidor de desarrollo...")
    dev_server_process = await asyncio.create_subprocess_shell(
        "npm run dev",
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE
    )

    port = None
    try:
        # Esperar a que el servidor esté listo y extraer el puerto
        print("Esperando al servidor de Vite...")
        output_buffer = ""
        for _ in range(30): # Esperar hasta 30 segundos
            line = await dev_server_process.stdout.readline()
            if not line:
                break
            line_str = line.decode('utf-8').strip()
            print(f"[Vite Server]: {line_str}")
            output_buffer += line_str
            if "ready in" in line_str:
                match = re.search(r'http://localhost:(\d+)', output_buffer)
                if match:
                    port = match.group(1)
                    print(f"✅ Servidor detectado en el puerto: {port}")
                    break
            await asyncio.sleep(1)

        if not port:
            stderr_output = await dev_server_process.stderr.read()
            print(f"--- Errores del Servidor ---\n{stderr_output.decode('utf-8')}", file=sys.stderr)
            raise RuntimeError("No se pudo iniciar el servidor de desarrollo o detectar el puerto.")

        base_url = f"http://localhost:{port}"

        async with async_playwright() as p:
            print("Iniciando Playwright...")
            browser = await p.chromium.launch()
            page = await browser.new_page()

            test_url = f"{base_url}/#comprar-productos/JULES-1234"
            print(f"Navegando a: {test_url}")

            try:
                await page.goto(test_url, wait_until="networkidle", timeout=30000)
                print("Página cargada.")

                print("Verificando visibilidad del título principal...")
                await expect(page.locator("h1:has-text('Añadir Productos a tu Viaje')")).to_be_visible(timeout=20000)
                print("✅ Título principal encontrado.")

                print("Verificando visibilidad del componente de productos...")
                productos_locator = page.locator("h3:has-text('Productos Adicionales')")
                await expect(productos_locator).to_be_visible(timeout=15000)
                print("✅ Componente de productos encontrado.")

                screenshot_path = "jules-scratch/verificacion_compra_productos.png"
                await page.screenshot(path=screenshot_path)
                print(f"📸 Captura de pantalla guardada en: {screenshot_path}")

            except Exception as e:
                print("\n--- 🚨 Error en la verificación de Playwright ---", file=sys.stderr)
                # Guardar HTML para depuración
                html_path = "jules-scratch/error_page.html"
                with open(html_path, "w") as f:
                    f.write(await page.content())
                print(f"Contenido HTML de la página guardado en: {html_path}", file=sys.stderr)
                # Guardar captura de pantalla de error
                error_screenshot_path = "jules-scratch/error_screenshot.png"
                await page.screenshot(path=error_screenshot_path)
                print(f"Captura de pantalla del error guardada en: {error_screenshot_path}", file=sys.stderr)
                raise e

            await browser.close()

    finally:
        if dev_server_process.returncode is None:
            print("Deteniendo servidor de desarrollo...")
            dev_server_process.terminate()
            await dev_server_process.wait()
            print("Servidor detenido.")

        stderr_output = await dev_server_process.stderr.read()
        if stderr_output:
            print(f"--- Errores del Servidor (stderr) ---\n{stderr_output.decode('utf-8')}", file=sys.stderr)

if __name__ == "__main__":
    if not os.path.exists("jules-scratch"):
        os.makedirs("jules-scratch")
    try:
        asyncio.run(main())
    except Exception as e:
        print(f"\n--- ❌ Falló la verificación ---", file=sys.stderr)
        print(f"{e}", file=sys.stderr)
        sys.exit(1)
