/**
 * Migration segura para agregar índice UNIQUE ux_clientes_rut en clientes.rut
 * Esta migración verifica índices existentes y duplicados antes de actuar.
 */

'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const desiredIndexName = 'ux_clientes_rut';

    const [rows] = await queryInterface.sequelize.query("SHOW INDEX FROM clientes");
    const distinctKeys = new Set(rows.map(r => r.Key_name));

    if (distinctKeys.has(desiredIndexName)) {
      console.log(`Índice ${desiredIndexName} ya existe. No se realizan cambios.`);
      return;
    }

    if (distinctKeys.size >= 64) {
      console.warn('La tabla tiene 64 o más índices. No se puede agregar ux_clientes_rut automáticamente. Revisar índices manualmente.');
      return;
    }

    const [dups] = await queryInterface.sequelize.query(`
      SELECT rut, COUNT(*) AS c FROM clientes GROUP BY rut HAVING c > 1
    `);
    if (dups.length > 0) {
      console.warn('Hay duplicados en clientes.rut; no se agregará UNIQUE hasta resolverlos. Ejemplos:', dups.slice(0,5));
      return;
    }

    await queryInterface.sequelize.query(`
      ALTER TABLE clientes
        MODIFY rut VARCHAR(20) COMMENT 'RUT del cliente (formato: 12345678-9 sin puntos)',
        ADD UNIQUE INDEX ${desiredIndexName} (rut)
    `);

    console.log(`Índice UNIQUE agregado con nombre ${desiredIndexName}`);
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeIndex('clientes', 'ux_clientes_rut');
      console.log('Índice ux_clientes_rut eliminado (down).');
    } catch (err) {
      console.warn('No se pudo eliminar ux_clientes_rut en down (probablemente no existe).');
    }
  }
};
