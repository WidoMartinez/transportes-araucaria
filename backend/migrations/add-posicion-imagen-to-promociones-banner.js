/**
 * Migración para agregar columna posicion_imagen a la tabla promociones_banner
 */
const addPosicionImagenToPromocionesBanner = async (queryInterface, Sequelize) => {
  try {
    const tableInfo = await queryInterface.describeTable("promociones_banner");
    
    if (!tableInfo.posicion_imagen) {
      console.log("📋 Agregando columna posicion_imagen a promociones_banner...");
      await queryInterface.addColumn("promociones_banner", "posicion_imagen", {
        type: Sequelize.STRING(50),
        allowNull: true,
        defaultValue: "center",
        comment: "Posición de la imagen (object-position)",
      });
      console.log("✅ Columna posicion_imagen agregada");
    } else {
      console.log("✅ Columna posicion_imagen ya existe");
    }
  } catch (error) {
    console.warn("⚠️ Error en migración posicion_imagen:", error.message);
  }
};

export default addPosicionImagenToPromocionesBanner;
