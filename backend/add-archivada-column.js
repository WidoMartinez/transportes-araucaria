import sequelize from './config/database.js';
import { DataTypes } from 'sequelize';

async function addArchivadaColumn() {
  try {
    const queryInterface = sequelize.getQueryInterface();
    const tableDescription = await queryInterface.describeTable('reservas');

    if (!tableDescription.archivada) {
      console.log('Agregando columna "archivada" a la tabla "reservas"...');
      await queryInterface.addColumn('reservas', 'archivada', {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      });
      console.log('✅ Columna "archivada" agregada correctamente.');
    } else {
      console.log('ℹ️ La columna "archivada" ya existe en la tabla "reservas".');
    }
  } catch (error) {
    console.error('❌ Error al agregar la columna "archivada":', error);
  } finally {
    await sequelize.close();
  }
}

addArchivadaColumn();
