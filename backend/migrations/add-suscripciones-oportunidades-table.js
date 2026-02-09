/* eslint-env node */
// Migración para crear tabla de suscripciones a oportunidades
import sequelize from "../config/database.js";

const addSuscripcionesOportunidadesTable = async () => {
try {
console.log("🔄 Verificando tabla suscripciones_oportunidades...");

// Verificar si la tabla ya existe
const [results] = await sequelize.query(`
SHOW TABLES LIKE 'suscripciones_oportunidades';
`);

if (results.length === 0) {
console.log("📋 Creando tabla suscripciones_oportunidades...");

await sequelize.query(`
CREATE TABLE IF NOT EXISTS suscripciones_oportunidades (
id INT AUTO_INCREMENT PRIMARY KEY,
email VARCHAR(255) NOT NULL,
nombre VARCHAR(255),
rutas JSON NOT NULL,
descuento_minimo INT DEFAULT 40,
activa BOOLEAN DEFAULT TRUE,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
INDEX idx_email (email),
INDEX idx_activa (activa)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Tabla de suscripciones a alertas de oportunidades';
`);

console.log("✅ Tabla suscripciones_oportunidades creada exitosamente");
} else {
console.log("✅ Tabla suscripciones_oportunidades ya existe");
}
} catch (error) {
console.error("❌ Error al crear tabla suscripciones_oportunidades:", error);
throw error;
}
};

export default addSuscripcionesOportunidadesTable;
