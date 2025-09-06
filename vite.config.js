import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
// CORRECCIÓN: Se quitan las llaves {} de la importación
import sitemap from "vite-plugin-sitemap";

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		react(),
		tailwindcss(),
		sitemap({
			hostname: "https://www.transportesaraucaria.cl",
			dynamicRoutes: [
				"/",
				"/#inicio",
				"/#servicios",
				"/#destinos",
				"/#contacto",
			],
			changefreq: "weekly",
			priority: 0.8,
		}),
	],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
});
