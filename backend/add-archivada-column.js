import sequelize from './config/database.js';
import { DataTypes } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';

// Forzar carga de .env desde el directorio actual
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

console.log('CWD:', process.cwd());
console.log('DB_USER loaded:', !!process.env.DB_USER);
console.log('DB_PASSWORD loaded:', !!process.env.DB_PASSWORD);
console.log('DB_NAME loaded:', !!process.env.DB_NAME);


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
