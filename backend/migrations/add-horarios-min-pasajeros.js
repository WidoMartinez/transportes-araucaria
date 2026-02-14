
import sequelize from "../config/database.js";
import { DataTypes } from "sequelize";

async function up() {
  const queryInterface = sequelize.getQueryInterface();
  const table = "promociones_banner";

  try {
    const tableInfo = await queryInterface.describeTable(table);

    if (!tableInfo.hora_inicio) {
      await queryInterface.addColumn(table, "hora_inicio", {
        type: DataTypes.TIME,
        allowNull: true,
      });
      console.log("Columna hora_inicio agregada");
    }

    if (!tableInfo.hora_fin) {
      await queryInterface.addColumn(table, "hora_fin", {
        type: DataTypes.TIME,
        allowNull: true,
      });
      console.log("Columna hora_fin agregada");
    }

    if (!tableInfo.min_pasajeros) {
      await queryInterface.addColumn(table, "min_pasajeros", {
        type: DataTypes.INTEGER,
        defaultValue: 1,
      });
      console.log("Columna min_pasajeros agregada");
    }
    
    // El cambio de ENUM a VARCHAR o agregar valores a ENUM es complejo en SQL crudo y depende del dialecto.
    // Para simplificar y dado que Sequelize valida en aplicación, asumiremos que tipo_viaje
    // se maneja como string o que se deben ejecutar comandos ALTER TYPE manualmente si es PostgreSQL.
    // En MySQL, los ENUM son strings. Si es necesario, podemos cambiar la columna a STRING.
    
    try {
        await queryInterface.changeColumn(table, 'tipo_viaje', {
            type: DataTypes.STRING(50), // Cambiar a String para flexibilidad
            allowNull: false
        });
        console.log("Columna tipo_viaje modificada a STRING");
    } catch (e) {
        console.warn("No se pudo modificar tipo_viaje automáticamente (puede requerir SQL manual según DB):", e.message);
    }

  } catch (error) {
    console.error("Error en migración:", error);
  }
}

up();
