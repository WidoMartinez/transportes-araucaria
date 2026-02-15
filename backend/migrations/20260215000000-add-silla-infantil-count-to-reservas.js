export default {
  up: async (queryInterface, Sequelize) => {
    try {
      const tableInfo = await queryInterface.describeTable('reservas');
      if (!tableInfo.cantidad_sillas_infantiles) {
        await queryInterface.addColumn('reservas', 'cantidad_sillas_infantiles', {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
          comment: 'Cantidad de sillas infantiles solicitadas'
        });
        console.log('✅ Columna cantidad_sillas_infantiles añadida a reservas');
      }
    } catch (error) {
      console.error('❌ Error en migración add-silla-infantil-count:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('reservas', 'cantidad_sillas_infantiles');
  }
};
