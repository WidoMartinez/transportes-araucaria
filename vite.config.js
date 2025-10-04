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
	build: {
		chunkSizeWarningLimit: 1000,
		rollupOptions: {
			output: {
				manualChunks: {
					vendor: ['react', 'react-dom'],
					ui: ['lucide-react', '@radix-ui/react-slot'],
					utils: ['class-variance-authority']
				}
			}
		}
	}
});
