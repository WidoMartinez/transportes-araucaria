
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

import Reserva from "./models/Reserva.js";
import { testConnection } from "./config/database.js";

async function doSwap() {
    try {
        await testConnection();

        const id = 270;
        const res = await Reserva.findByPk(id);

        if (!res) {
            console.error("Reserva no encontrada");
            return;
        }

        console.log(`Swapping ID ${id}...`);
        
        const oldOrigen = res.origen;
        const oldDestino = res.destino;
        const oldDirO = res.direccionOrigen;
        const oldDirD = res.direccionDestino;

        await res.update({
            origen: oldDestino,
            destino: oldOrigen,
            direccionOrigen: oldDirD,
            direccionDestino: oldDirO,
            tipoTramo: 'ida' // Set as 'ida' since it's "Hacia el aeropuerto"
        });

        console.log("✅ Swap completado para ID 270.");

    } catch (error) {
        console.error("Error:", error);
    } finally {
        process.exit();
    }
}

doSwap();
