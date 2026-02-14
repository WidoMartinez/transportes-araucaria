
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

import Reserva from "./models/Reserva.js";
import { testConnection } from "./config/database.js";

async function inspectSwap() {
    try {
        await testConnection();

        const records = await Reserva.findAll({
            where: { id: [269, 270] },
            attributes: ['id', 'codigoReserva', 'tipoTramo', 'origen', 'destino', 'direccionOrigen', 'direccionDestino', 'fecha', 'hora']
        });

        records.forEach(r => {
            console.log(`ID: ${r.id}, Code: ${r.codigoReserva}, Tipo: ${r.tipoTramo}, O: ${r.origen}, D: ${r.destino}, DirO: ${r.direccionOrigen}, DirD: ${r.direccionDestino}, Fecha: ${r.fecha}, Hora: ${r.hora}`);
        });

    } catch (error) {
        console.error("Error:", error);
    } finally {
        process.exit();
    }
}

inspectSwap();
