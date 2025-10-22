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
					if (!id) return null;
					if (id.includes('node_modules')) {
						// Agrupar React + React DOM juntos
						if (id.includes('react') || id.includes('react-dom')) {
							return 'vendor-react';
						}
						// Agrupar librerías de UI/animación en un chunk separado
						if (id.includes('framer-motion') || id.includes('gsap') || id.includes('recharts')) {
							return 'vendor-animacion';
						}
						// Agrupar Radix / Lucide / Sonner / otras utilidades UI
						if (id.includes('@radix-ui') || id.includes('lucide-react') || id.includes('sonner') || id.includes('cmdk')) {
							return 'vendor-ui';
						}
						// Agrupar librerías de utilidades/pesadas como xlsx
						if (id.includes('xlsx') || id.includes('date-fns')) {
							return 'vendor-utils';
						}
						// Por defecto, agrupar resto de node_modules en vendor
						return 'vendor';
					}
					// Archivos del propio src: si están en components grandes se pueden dividir
					if (id.includes('/src/components/') && id.match(/\.(jsx|js|ts|tsx)$/)) {
						// separar paneles/admin como chunks propios si existen
						if (id.includes('/src/components/Admin') || id.includes('/src/components/AdminReservas')) {
							return 'admin-components';
						}
					}
				},
			},
		},
	},
});
