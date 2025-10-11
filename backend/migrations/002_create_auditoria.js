// backend/migrations/002_create_auditoria.js
// Migración para crear tabla de auditoría de cambios en reservas

import sequelize from '../config/database.js';

/**
 * Crea la tabla auditoria_reservas para tracking completo de cambios
 */
async function createAuditoriaTable() {
	try {
		console.log('🔧 Creando tabla de auditoría...');

		// Verificar si la tabla ya existe
		const [tables] = await sequelize.query(`
			SHOW TABLES LIKE 'auditoria_reservas'
		`);

		if (tables.length > 0) {
			console.log('⏭️ La tabla auditoria_reservas ya existe');
			return { success: true, message: 'Tabla ya existe' };
		}

		// Crear tabla de auditoría
		await sequelize.query(`
			CREATE TABLE auditoria_reservas (
				id INT AUTO_INCREMENT PRIMARY KEY,
				reserva_id INT NOT NULL,
				campo_modificado VARCHAR(100) NOT NULL COMMENT 'Nombre del campo modificado',
				valor_anterior TEXT COMMENT 'Valor antes del cambio',
				valor_nuevo TEXT COMMENT 'Valor después del cambio',
				usuario VARCHAR(100) DEFAULT 'sistema' COMMENT 'Usuario que realizó el cambio',
				ip_address VARCHAR(45) COMMENT 'Dirección IP del usuario',
				metodo VARCHAR(50) COMMENT 'Método HTTP o tipo de operación',
				fecha_cambio TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Momento exacto del cambio',
				
				FOREIGN KEY (reserva_id) REFERENCES reservas(id) ON DELETE CASCADE,
				INDEX idx_reserva_fecha (reserva_id, fecha_cambio),
				INDEX idx_campo (campo_modificado),
				INDEX idx_usuario (usuario),
				INDEX idx_fecha (fecha_cambio)
			) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
			COMMENT='Auditoría completa de cambios en reservas'
		`);

		console.log('✅ Tabla auditoria_reservas creada exitosamente');

		// Crear trigger para auditoría automática
		console.log('🔧 Creando trigger de auditoría...');

		try {
			// Trigger para UPDATE
			await sequelize.query(`
				CREATE TRIGGER audit_reservas_update
				AFTER UPDATE ON reservas
				FOR EACH ROW
				BEGIN
					-- Auditar cambios en campos importantes
					IF OLD.estado != NEW.estado THEN
						INSERT INTO auditoria_reservas (reserva_id, campo_modificado, valor_anterior, valor_nuevo)
						VALUES (NEW.id, 'estado', OLD.estado, NEW.estado);
					END IF;
					
					IF OLD.estadoPago != NEW.estadoPago THEN
						INSERT INTO auditoria_reservas (reserva_id, campo_modificado, valor_anterior, valor_nuevo)
						VALUES (NEW.id, 'estadoPago', OLD.estadoPago, NEW.estadoPago);
					END IF;
					
					IF OLD.fecha != NEW.fecha THEN
						INSERT INTO auditoria_reservas (reserva_id, campo_modificado, valor_anterior, valor_nuevo)
						VALUES (NEW.id, 'fecha', OLD.fecha, NEW.fecha);
					END IF;
					
					IF OLD.hora != NEW.hora THEN
						INSERT INTO auditoria_reservas (reserva_id, campo_modificado, valor_anterior, valor_nuevo)
						VALUES (NEW.id, 'hora', OLD.hora, NEW.hora);
					END IF;
					
					IF OLD.precio != NEW.precio THEN
						INSERT INTO auditoria_reservas (reserva_id, campo_modificado, valor_anterior, valor_nuevo)
						VALUES (NEW.id, 'precio', OLD.precio, NEW.precio);
					END IF;
				END
			`);
			console.log('✅ Trigger de auditoría creado');
		} catch (error) {
			// Los triggers pueden ya existir
			console.log('⏭️ Trigger ya existe o error al crearlo:', error.message);
		}

		return {
			success: true,
			message: 'Tabla de auditoría creada exitosamente'
		};

	} catch (error) {
		console.error('❌ Error creando tabla de auditoría:', error);
		throw error;
	}
}

/**
 * Elimina la tabla de auditoría (rollback)
 */
async function dropAuditoriaTable() {
	try {
		console.log('⏮️ Eliminando tabla de auditoría...');

		// Eliminar trigger primero
		try {
			await sequelize.query('DROP TRIGGER IF EXISTS audit_reservas_update');
			console.log('✅ Trigger eliminado');
		} catch (error) {
			console.warn('⚠️ Error eliminando trigger:', error.message);
		}

		// Eliminar tabla
		await sequelize.query('DROP TABLE IF EXISTS auditoria_reservas');
		console.log('✅ Tabla auditoria_reservas eliminada');

		return { success: true, message: 'Rollback exitoso' };

	} catch (error) {
		console.error('❌ Error en rollback:', error);
		throw error;
	}
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
	const action = process.argv[2] || 'up';

	(async () => {
		try {
			if (action === 'up') {
				await createAuditoriaTable();
			} else if (action === 'down') {
				await dropAuditoriaTable();
			} else {
				console.error('Acción no válida. Use "up" o "down"');
				process.exit(1);
			}
			console.log('🎉 Operación completada exitosamente');
			process.exit(0);
		} catch (error) {
			console.error('💥 Error en la migración:', error);
			process.exit(1);
		} finally {
			await sequelize.close();
		}
	})();
}

export { createAuditoriaTable, dropAuditoriaTable };
export default createAuditoriaTable;
