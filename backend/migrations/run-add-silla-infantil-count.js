import sequelize from "../config/database.js";
import process from "process";

async function migrateSillaInfantilCount() {
    const queryInterface = sequelize.getQueryInterface();

    try {
        console.log("🔧 Iniciando migración: agregar columna cantidad_sillas_infantiles a reservas...");

        // Verificar si la columna ya existe
        const tableInfo = await queryInterface.describeTable('reservas').catch(() => ({}));
        
        if (!tableInfo.cantidad_sillas_infantiles && !tableInfo.cantidadSillasInfantiles) {
            console.log("📦 Agregando columna cantidad_sillas_infantiles...");
            await queryInterface.addColumn('reservas', 'cantidad_sillas_infantiles', {
                type: sequelize.Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
                comment: 'Cantidad de sillas infantiles solicitadas'
            });
            console.log("✅ Columna cantidad_sillas_infantiles añadida exitosamente");
        } else {
            console.log("ℹ️ La columna cantidad_sillas_infantiles ya existe, omitiendo.");
        }

        console.log("✅ Migración finalizada correctamente.");
    } catch (error) {
        console.error("❌ Error durante la migración:", error);
        throw error;
    } finally {
        await sequelize.close();
    }
}

migrateSillaInfantilCount()
    .then(() => {
        console.log("🎉 Proceso de migración terminado.");
        process.exit(0);
    })
    .catch((error) => {
        console.error("💥 Error fatal en migración:", error);
        process.exit(1);
    });
