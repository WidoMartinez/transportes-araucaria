/* eslint-env node */
// Script para generar oportunidades desde reservas existentes
import dotenv from "dotenv";
import { testConnection } from "./config/database.js";
import Reserva from "./models/Reserva.js";
import { detectarYGenerarOportunidades } from "./routes/oportunidades.js";
import { Op } from "sequelize";

dotenv.config();

async function generarOportunidadesManual() {
  try {
    console.log("🔄 Conectando a la base de datos...");
    await testConnection();
    console.log("✅ Conexión exitosa\n");

    console.log("🔍 Buscando reservas confirmadas con fechas futuras...");
    
    const reservas = await Reserva.findAll({
      where: {
        estado: ["confirmada", "completada"],
        fecha: { [Op.gte]: new Date() },
      },
      order: [["fecha", "ASC"]],
    });

    console.log(`📊 Encontradas ${reservas.length} reservas elegibles\n`);

    if (reservas.length === 0) {
      console.log("ℹ️  No hay reservas confirmadas con fechas futuras.");
      console.log("   Esto es normal si:");
      console.log("   - Todas las reservas están en estado 'pendiente'");
      console.log("   - Todas las fechas ya pasaron");
      console.log("   - No hay reservas en el sistema\n");
      process.exit(0);
    }

    let totalGeneradas = 0;
    const resultados = [];

    for (const reserva of reservas) {
      console.log(`\n🎯 Procesando reserva ${reserva.codigoReserva}:`);
      console.log(`   Origen: ${reserva.origen}`);
      console.log(`   Destino: ${reserva.destino}`);
      console.log(`   Fecha: ${reserva.fecha}`);
      console.log(`   Estado: ${reserva.estado}`);

      try {
        const oportunidades = await detectarYGenerarOportunidades(reserva);
        
        if (oportunidades.length > 0) {
          console.log(`   ✅ ${oportunidades.length} oportunidades generadas:`);
          oportunidades.forEach((op) => {
            console.log(`      - ${op.codigo}: ${op.tipo} (${op.origen} → ${op.destino})`);
          });
          totalGeneradas += oportunidades.length;
          resultados.push({
            reserva: reserva.codigoReserva,
            oportunidades: oportunidades.map((op) => op.codigo),
          });
        } else {
          console.log(`   ℹ️  No se generaron oportunidades (ya existen o no aplica)`);
        }
      } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("📊 RESUMEN FINAL");
    console.log("=".repeat(60));
    console.log(`Total de reservas procesadas: ${reservas.length}`);
    console.log(`Total de oportunidades generadas: ${totalGeneradas}`);
    
    if (resultados.length > 0) {
      console.log("\nDetalle de oportunidades generadas:");
      resultados.forEach((r) => {
        console.log(`  ${r.reserva}: ${r.oportunidades.join(", ")}`);
      });
    }

    console.log("\n✅ Proceso completado exitosamente");
    console.log("\n💡 Próximo paso: Visita http://localhost:5173/oportunidades para ver las oportunidades\n");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error fatal:", error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Ejecutar
generarOportunidadesManual();
