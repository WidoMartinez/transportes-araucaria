
import Reserva from "./models/Reserva.js";
import { testConnection } from "./config/database.js";

async function diagnose() {
    try {
        await testConnection();
        const lastReservas = await Reserva.findAll({
            limit: 10,
            order: [['id', 'DESC']],
            attributes: ['id', 'codigoReserva', 'tipoTramo', 'tramoPadreId', 'tramoHijoId', 'idaVuelta', 'fecha', 'email']
        });

        console.log("ID | Código | Tipo | Padre | Hijo | IV | Fecha | Email");
        console.log("-".repeat(80));
        lastReservas.forEach(r => {
            console.log(`${r.id} | ${r.codigoReserva} | ${r.tipoTramo} | ${r.tramoPadreId} | ${r.tramoHijoId} | ${r.idaVuelta} | ${r.fecha} | ${r.email}`);
        });
    } catch (error) {
        console.error("Error:", error);
    }
}

diagnose();
