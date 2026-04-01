/* eslint-env node */
// backend/migrations/add-configuracion-table.js
// Migración para crear tabla de configuración general del sistema
import sequelize from "../config/database.js";

const addConfiguracionTable = async () => {
	try {
		console.log("🔄 Verificando tabla configuracion...");

		// Verificar si la tabla ya existe
		const [results] = await sequelize.query(`
SHOW TABLES LIKE 'configuracion';
`);

		if (results.length === 0) {
			console.log("📋 Creando tabla configuracion...");

			await sequelize.query(`
CREATE TABLE IF NOT EXISTS configuracion (
id INT AUTO_INCREMENT PRIMARY KEY,
clave VARCHAR(100) NOT NULL UNIQUE COMMENT 'Clave única de configuración',
valor TEXT DEFAULT NULL COMMENT 'Valor de la configuración',
tipo ENUM('string', 'number', 'boolean', 'json') NOT NULL DEFAULT 'string' COMMENT 'Tipo de dato del valor',
descripcion VARCHAR(255) DEFAULT NULL COMMENT 'Descripción de la configuración',
created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
UNIQUE INDEX idx_clave (clave)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Tabla de configuraciones generales del sistema';
`);

			console.log("✅ Tabla configuracion creada exitosamente");

			// Inicializar configuración de modal WhatsApp (activo por defecto)
			console.log("📋 Inicializando configuración de WhatsApp intercept...");

			await sequelize.query(`
INSERT INTO configuracion (clave, valor, tipo, descripcion)
VALUES (
'whatsapp_intercept_activo',
'true',
'boolean',
'Controla si el modal de intercepción de WhatsApp está activo'
);
`);

			console.log(
				"✅ Configuración inicial de WhatsApp establecida (activo: true)",
			);

			// Insertar recargo default de feriados (10%) junto con la creación de la tabla
			await sequelize.query(`
INSERT INTO configuracion (clave, valor, tipo, descripcion)
VALUES (
'recargo_feriados_default',
'10',
'number',
'Porcentaje de recargo aplicado automáticamente en días feriados cuando el festivo no tiene recargo específico definido'
);
`);

			console.log(
				"✅ Configuración recargo_feriados_default establecida (10%)",
			);
		} else {
			console.log("✅ Tabla configuracion ya existe");

			// Verificar si la configuración de WhatsApp existe
			const [configExists] = await sequelize.query(`
SELECT * FROM configuracion WHERE clave = 'whatsapp_intercept_activo';
`);

			if (configExists.length === 0) {
				console.log("📋 Inicializando configuración de WhatsApp intercept...");

				await sequelize.query(`
INSERT INTO configuracion (clave, valor, tipo, descripcion)
VALUES (
'whatsapp_intercept_activo',
'true',
'boolean',
'Controla si el modal de intercepción de WhatsApp está activo'
);
`);

				console.log(
					"✅ Configuración inicial de WhatsApp establecida (activo: true)",
				);
			} else {
				console.log("✅ Configuración de WhatsApp ya existe");
			}

			// Verificar si ya existe el recargo default de feriados; insertarlo si falta
			const [feriadoConfigExists] = await sequelize.query(`
SELECT * FROM configuracion WHERE clave = 'recargo_feriados_default';
`);

			if (feriadoConfigExists.length === 0) {
				console.log(
					"📋 Inicializando configuración recargo_feriados_default...",
				);

				await sequelize.query(`
INSERT INTO configuracion (clave, valor, tipo, descripcion)
VALUES (
'recargo_feriados_default',
'10',
'number',
'Porcentaje de recargo aplicado automáticamente en días feriados cuando el festivo no tiene recargo específico definido'
);
`);

				console.log(
					"✅ Configuración recargo_feriados_default establecida (10%)",
				);
			} else {
				console.log("✅ Configuración recargo_feriados_default ya existe");
			}
		}

		console.log("✅ Migración de configuracion completada");
	} catch (error) {
		console.error("❌ Error en migración de configuracion:", error.message);
		// No lanzar error para no detener el servidor
	}
};

export default addConfiguracionTable;
