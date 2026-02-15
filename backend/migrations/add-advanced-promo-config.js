import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

async function addAdvancedPromoConfig() {
  const queryInterface = sequelize.getQueryInterface();
  const table = "promociones_banner";

  try {
    const tableInfo = await queryInterface.describeTable(table);

    if (!tableInfo.permite_sillas) {
      await queryInterface.addColumn(table, "permite_sillas", {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      });
      console.log("✅ Columna 'permite_sillas' agregada a promociones_banner");
    }

    if (!tableInfo.max_sillas) {
      await queryInterface.addColumn(table, "max_sillas", {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
      });
      console.log("✅ Columna 'max_sillas' agregada a promociones_banner");
    }

    if (!tableInfo.valor_silla) {
      await queryInterface.addColumn(table, "valor_silla", {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
      });
      console.log("✅ Columna 'valor_silla' agregada a promociones_banner");
    }

    if (!tableInfo.anticipacion_minima) {
      await queryInterface.addColumn(table, "anticipacion_minima", {
        type: DataTypes.INTEGER,
        defaultValue: 3, // Default 3 hours
        allowNull: false,
        comment: "Horas mínimas de anticipación para reservar",
      });
      console.log("✅ Columna 'anticipacion_minima' agregada a promociones_banner");
    }

  } catch (error) {
    console.error("❌ Error al agregar columnas de configuración avanzada:", error);
  }
}

export default addAdvancedPromoConfig;
