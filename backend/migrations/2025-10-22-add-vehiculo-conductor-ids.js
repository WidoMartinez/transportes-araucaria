// migrations/2025-10-22-add-vehiculo-conductor-ids.js
import sequelize from "../config/database.js";
import { QueryTypes } from "sequelize";

async function up() {
  try {
    console.log("🔄 Verificando columnas vehiculo_id y conductor_id en reservas...");

    const cols = await sequelize.query("SHOW COLUMNS FROM reservas", {
      type: QueryTypes.SELECT,
    });
    const names = cols.map((c) => c.Field);

    if (!names.includes("vehiculo_id")) {
      console.log("➕ Agregando columna vehiculo_id en reservas...");
      await sequelize.query(
        "ALTER TABLE reservas ADD COLUMN vehiculo_id INT NULL COMMENT 'FK Vehículo asignado'"
      );
      console.log("✅ vehiculo_id agregada");
    }

    if (!names.includes("conductor_id")) {
      console.log("➕ Agregando columna conductor_id en reservas...");
      await sequelize.query(
        "ALTER TABLE reservas ADD COLUMN conductor_id INT NULL COMMENT 'FK Conductor asignado'"
      );
      console.log("✅ conductor_id agregada");
    }

    console.log("✅ Migración vehiculo/conductor completada");
    return true;
  } catch (error) {
    console.error("❌ Error migración vehiculo/conductor:", error);
    throw error;
  }
}

export default up;
