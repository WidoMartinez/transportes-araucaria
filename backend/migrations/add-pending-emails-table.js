import sequelize from "../config/database.js";

const addPendingEmailsTable = async () => {
	try {
		console.log("🔄 Verificando tabla pending_emails...");

		// Verificar si la tabla ya existe
		const [tables] = await sequelize.query(`
			SHOW TABLES LIKE 'pending_emails';
		`);

		if (tables.length === 0) {
			console.log("📋 Creando tabla pending_emails...");

			await sequelize.query(`
				CREATE TABLE pending_emails (
					id INT AUTO_INCREMENT PRIMARY KEY,
					reserva_id INT NOT NULL,
					email VARCHAR(255) NOT NULL,
					type VARCHAR(50) NOT NULL DEFAULT 'discount_offer',
					status VARCHAR(50) NOT NULL DEFAULT 'pending',
					scheduled_at DATETIME NOT NULL,
					sent_at DATETIME NULL,
					attempts INT DEFAULT 0,
					last_error TEXT NULL,
					created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
					updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
					INDEX idx_status_scheduled (status, scheduled_at),
					INDEX idx_reserva_id (reserva_id),
					FOREIGN KEY (reserva_id) REFERENCES reservas(id) ON DELETE CASCADE
				) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
			`);

			console.log("✅ Tabla pending_emails creada exitosamente");
		} else {
			console.log("✅ Tabla pending_emails ya existe");
            
            // Verificar si las columnas existen (por si acaso se creó mal antes)
            const [columns] = await sequelize.query(`
                SHOW COLUMNS FROM pending_emails LIKE 'scheduled_at';
            `);
            
            if (columns.length === 0) {
                 console.log("⚠️ La tabla existe pero falta scheduled_at. Intentando corregir...");
                 // Aquí podríamos intentar un ALTER TABLE si fuera necesario, 
                 // pero por seguridad mejor avisar o intentar agregarla.
                 try {
                     await sequelize.query(`ALTER TABLE pending_emails ADD COLUMN scheduled_at DATETIME NOT NULL;`);
                     console.log("✅ Columna scheduled_at agregada.");
                 } catch (e) {
                     console.error("❌ Error al intentar corregir tabla pending_emails:", e.message);
                 }
            }
		}
	} catch (error) {
		console.error("❌ Error en migración de pending_emails:", error.message);
	}
};

export default addPendingEmailsTable;
