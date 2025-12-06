
import dotenv from "dotenv";
dotenv.config();
import { buscarRetornosDisponibles } from "./utils/disponibilidad.js";
import sequelize from "./config/database.js";

async function test() {
    try {
        console.log("Conectando a DB...");
        await sequelize.authenticate();
        console.log("Conexión exitosa.");

        const params = {
            origen: "Pucón",
            destino: "Aeropuerto La Araucanía", 
            fecha: "2025-12-08"
        };

        console.log("Buscando retornos con params:", params);
        const resultado = await buscarRetornosDisponibles(params);
        
        console.log("Resultado:", JSON.stringify(resultado, null, 2));
    } catch (error) {
        console.error("Error en test:", error);
    } finally {
        await sequelize.close();
    }
}

test();
