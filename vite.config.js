/* eslint-env node */
/* global __dirname */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import sitemap from "vite-plugin-sitemap";

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		react(),
		tailwindcss(),
		sitemap({
			hostname: "https://www.transportesaraucaria.cl",
			dynamicRoutes: ["/"],
			changefreq: "weekly",
			priority: 1.0,
		}),
	],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
	// Configuración de build para controlar el tamaño de los chunks
	// y mejorar el code-splitting. Comentarios y nombres en español.
	build: {
		// Aumentar el límite de advertencia si necesitamos evitar warnings excesivos.
		// Si aún se generan chunks grandes, mejor dividir componentes con import() dinámico.
		chunkSizeWarningLimit: 700, // en KB, ajustar según necesidades (valor por defecto 500)
		rollupOptions: {
			output: {
				// manualChunks permite agrupar dependencias en chunks separados.
				// Aquí agrupamos librerías pesadas y de UI para evitar un único bundle masivo.
				manualChunks(id) {
					if (id.includes("node_modules")) {
						// Agrupamos todas las dependencias en un solo chunk de vendor 
						// para evitar ciclos entre vendor-react, vendor-ui, etc.
						return "vendor";
					}
				},
			},
		},
	},
});
