// backend/migrations/001_add_enhanced_fields.js
// Migración para agregar campos mejorados a la tabla reservas

import sequelize from '../config/database.js';

/**
 * Agrega campos adicionales a la tabla reservas para mejorar
 * la funcionalidad y trazabilidad del sistema
 */
async function addEnhancedFields() {
	try {
		console.log('🔧 Agregando campos mejorados a la tabla reservas...');

		// Verificar si las columnas ya existen antes de agregarlas
		const [results] = await sequelize.query(`
			SELECT COLUMN_NAME 
			FROM INFORMATION_SCHEMA.COLUMNS 
			WHERE TABLE_SCHEMA = DATABASE() 
			AND TABLE_NAME = 'reservas'
		`);

		const existingColumns = results.map(row => row.COLUMN_NAME);
		console.log(`📋 Columnas existentes: ${existingColumns.length}`);

		// Lista de columnas nuevas a agregar
		const newColumns = [
			{
				name: 'latitud',
				definition: 'DECIMAL(10, 8) NULL COMMENT "Latitud del punto de recogida"'
			},
			{
				name: 'longitud',
				definition: 'DECIMAL(11, 8) NULL COMMENT "Longitud del punto de recogida"'
			},
			{
				name: 'calificacion',
				definition: 'INTEGER NULL CHECK (calificacion BETWEEN 1 AND 5) COMMENT "Calificación del servicio (1-5 estrellas)"'
			},
			{
				name: 'comentario_cliente',
				definition: 'TEXT NULL COMMENT "Comentario o review del cliente después del servicio"'
			},
			{
				name: 'fecha_completada',
				definition: 'TIMESTAMP NULL COMMENT "Fecha y hora en que se completó el servicio"'
			},
			{
				name: 'conductor_id',
				definition: 'INTEGER NULL COMMENT "ID del conductor asignado"'
			},
			{
				name: 'conductor_nombre',
				definition: 'VARCHAR(255) NULL COMMENT "Nombre del conductor asignado"'
			},
			{
				name: 'conductor_telefono',
				definition: 'VARCHAR(50) NULL COMMENT "Teléfono del conductor asignado"'
			},
			{
				name: 'patente_vehiculo',
				definition: 'VARCHAR(20) NULL COMMENT "Patente del vehículo asignado"'
			},
			{
				name: 'notificaciones_enviadas',
				definition: 'JSON NULL COMMENT "Array con historial de notificaciones enviadas"'
			},
			{
				name: 'ultimo_recordatorio',
				definition: 'TIMESTAMP NULL COMMENT "Fecha del último recordatorio enviado"'
			}
		];

		// Agregar solo las columnas que no existen
		let columnsAdded = 0;
		for (const column of newColumns) {
			if (!existingColumns.includes(column.name)) {
				try {
					await sequelize.query(`
						ALTER TABLE reservas 
						ADD COLUMN ${column.name} ${column.definition}
					`);
					console.log(`✅ Columna agregada: ${column.name}`);
					columnsAdded++;
				} catch (error) {
					console.warn(`⚠️ No se pudo agregar ${column.name}: ${error.message}`);
				}
			} else {
				console.log(`⏭️ Columna ya existe: ${column.name}`);
			}
		}

		// Crear índices adicionales si no existen
		console.log('🔧 Creando índices adicionales...');

		const indexes = [
			{
				name: 'idx_fecha_estado',
				definition: 'CREATE INDEX IF NOT EXISTS idx_fecha_estado ON reservas(fecha, estado)'
			},
			{
				name: 'idx_created_estado_pago',
				definition: 'CREATE INDEX IF NOT EXISTS idx_created_estado_pago ON reservas(created_at, estadoPago)'
			},
			{
				name: 'idx_conductor',
				definition: 'CREATE INDEX IF NOT EXISTS idx_conductor ON reservas(conductor_id)'
			}
		];

		for (const index of indexes) {
			try {
				await sequelize.query(index.definition);
				console.log(`✅ Índice creado: ${index.name}`);
			} catch (error) {
				// Los índices pueden ya existir, no es crítico
				console.log(`⏭️ Índice ya existe o error: ${index.name}`);
			}
		}

		console.log(`✅ Migración completada: ${columnsAdded} columnas nuevas agregadas`);
		
		return {
			success: true,
			columnsAdded,
			message: 'Campos mejorados agregados exitosamente'
		};

	} catch (error) {
		console.error('❌ Error agregando campos mejorados:', error);
		throw error;
	}
}

// Función para revertir la migración (rollback)
async function rollbackEnhancedFields() {
	try {
		console.log('⏮️ Revirtiendo migración de campos mejorados...');

		const columnsToRemove = [
			'latitud', 'longitud', 'calificacion', 'comentario_cliente',
			'fecha_completada', 'conductor_id', 'conductor_nombre',
			'conductor_telefono', 'patente_vehiculo', 'notificaciones_enviadas',
			'ultimo_recordatorio'
		];

		for (const column of columnsToRemove) {
			try {
				await sequelize.query(`ALTER TABLE reservas DROP COLUMN IF EXISTS ${column}`);
				console.log(`✅ Columna eliminada: ${column}`);
			} catch (error) {
				console.warn(`⚠️ No se pudo eliminar ${column}: ${error.message}`);
			}
		}

		console.log('✅ Rollback completado');
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
				await addEnhancedFields();
			} else if (action === 'down') {
				await rollbackEnhancedFields();
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

export { addEnhancedFields, rollbackEnhancedFields };
export default addEnhancedFields;
