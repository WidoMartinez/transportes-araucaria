/* eslint-env node */
// Script para ELIMINAR y REGENERAR todas las oportunidades con la nueva lógica
import dotenv from "dotenv";
import { testConnection } from "../config/database.js";
import Reserva from "../models/Reserva.js";
import Oportunidad from "../models/Oportunidad.js";
import { detectarYGenerarOportunidades } from "../routes/oportunidades.js";
import { Op } from "sequelize";

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

async function regenerarOportunidades() {
  try {
    console.log("🔄 Conectando a la base de datos...");
    await testConnection();
    console.log("✅ Conexión exitosa\n");

    console.log("🗑️ Eliminando oportunidades antiguas...");
    const eliminadas = await Oportunidad.destroy({ where: {} });
    console.log(`✅ ${eliminadas} oportunidades eliminadas.`);

    console.log("🔍 Buscando reservas confirmadas con fechas futuras...");
    const reservas = await Reserva.findAll({
      where: {
        estado: ["confirmada", "completada"],
        fecha: { [Op.gte]: new Date() },
      },
      order: [["fecha", "ASC"]],
    });

    console.log(`📊 Encontradas ${reservas.length} reservas elegibles\n`);

    let totalGeneradas = 0;
    for (const reserva of reservas) {
      console.log(`🎯 Procesando reserva ${reserva.codigoReserva}: ${reserva.origen} → ${reserva.destino}`);
      const oportunidades = await detectarYGenerarOportunidades(reserva);
      if (oportunidades.length > 0) {
        oportunidades.forEach(op => {
          console.log(`   ✅ GENERADA: ${op.codigo} | ${op.tipo} | ${op.origen} → ${op.destino} | $${op.precioFinal} (${op.vehiculo})`);
        });
        totalGeneradas += oportunidades.length;
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("📊 RESUMEN FINAL");
    console.log(`Total de oportunidades regeneradas: ${totalGeneradas}`);
    console.log("=".repeat(60));

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error fatal:", error);
    process.exit(1);
  }
}

regenerarOportunidades();
