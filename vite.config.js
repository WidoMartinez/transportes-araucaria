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
			// CORRECCIÓN: Se elimina el resto de las rutas con hash.
			// Solo se necesita la ruta raíz para una SPA.
			dynamicRoutes: ["/"],
			changefreq: "weekly",
			priority: 1.0, // La página principal debe tener la máxima prioridad.
		}),
	],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
});
