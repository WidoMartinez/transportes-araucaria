
import asyncio
import sys

async def main():
    print("--- Iniciando prueba de arranque del servidor ---")

    try:
        # Iniciar el servidor de desarrollo
        process = await asyncio.create_subprocess_shell(
            "npm run dev",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )

        print("Subproceso iniciado. Esperando salida...")

        # Leer salida para ver si el servidor arranca
        try:
            stdout, stderr = await asyncio.wait_for(process.communicate(), timeout=30.0)

            print("\n--- Salida del Servidor (stdout) ---")
            print(stdout.decode('utf-8'))

            print("\n--- Errores del Servidor (stderr) ---")
            print(stderr.decode('utf-8'), file=sys.stderr)

            if "ready in" in stdout.decode('utf-8'):
                print("\n✅ Éxito: El servidor parece haber arrancado correctamente.")
            else:
                print("\n❌ Fallo: La señal 'ready in' no fue encontrada en la salida.", file=sys.stderr)

        except asyncio.TimeoutError:
            print("\n--- ❌ Error: Timeout esperando la salida del servidor ---", file=sys.stderr)
            process.kill()
            await process.wait()
            print("El proceso del servidor ha sido terminado.", file=sys.stderr)

    except Exception as e:
        print(f"\n--- ❌ Error al iniciar el subproceso ---", file=sys.stderr)
        print(f"{e}", file=sys.stderr)

if __name__ == "__main__":
    asyncio.run(main())
