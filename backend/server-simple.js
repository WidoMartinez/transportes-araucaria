/* eslint-env node */
/* global process */
// backend/server-simple.js - Servidor simplificado para manejar reservas
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// Endpoint para recibir reservas desde el formulario web
app.post("/enviar-reserva", async (req, res) => {
	try {
		const datosReserva = req.body || {};

		console.log("Reserva web recibida:", {
			nombre: datosReserva.nombre,
			email: datosReserva.email,
			telefono: datosReserva.telefono,
			origen: datosReserva.origen,
			destino: datosReserva.destino,
			fecha: datosReserva.fecha,
			hora: datosReserva.hora,
			pasajeros: datosReserva.pasajeros,
			totalConDescuento: datosReserva.totalConDescuento,
			source: datosReserva.source || "web",
		});

		return res.json({
			success: true,
			message: "Reserva recibida correctamente",
		});
	} catch (error) {
		console.error("Error al procesar la reserva:", error);
		return res.status(500).json({
			success: false,
			message: "Error interno del servidor",
		});
	}
});

// Endpoint de salud para verificar que el servidor está funcionando
app.get("/health", (req, res) => {
	res.json({ status: "OK", message: "Servidor funcionando correctamente" });
});

// Endpoint raíz para verificar que el servidor está funcionando
app.get("/", (req, res) => {
	res.json({
		status: "OK",
		message: "Servidor Transportes Araucaria funcionando correctamente",
		endpoints: {
			"POST /enviar-reserva": "Enviar reserva",
			"GET /health": "Estado del servidor",
		},
	});
});

// --- INICIALIZAR SERVIDOR ---
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
	console.log(`🚀 Servidor simplificado ejecutándose en puerto ${PORT}`);
	console.log(`📧 Endpoint /enviar-reserva disponible`);
});
