/* eslint-env node */
// Migración para crear tabla de oportunidades de traslado
import sequelize from "../config/database.js";

const addOportunidadesTable = async () => {
try {
console.log("🔄 Verificando tabla oportunidades...");

// Verificar si la tabla ya existe
const [results] = await sequelize.query(`
SHOW TABLES LIKE 'oportunidades';
`);

if (results.length === 0) {
console.log("📋 Creando tabla oportunidades...");

await sequelize.query(`
CREATE TABLE IF NOT EXISTS oportunidades (
id INT AUTO_INCREMENT PRIMARY KEY,
codigo VARCHAR(50) NOT NULL UNIQUE,
tipo ENUM('retorno_vacio', 'ida_vacia') NOT NULL,
origen VARCHAR(255) NOT NULL,
destino VARCHAR(255) NOT NULL,
fecha DATE NOT NULL,
hora_aproximada TIME,
descuento INT NOT NULL,
precio_original DECIMAL(10, 2) NOT NULL,
precio_final DECIMAL(10, 2) NOT NULL,
vehiculo VARCHAR(255),
capacidad VARCHAR(100),
reserva_relacionada_id INT,
estado ENUM('disponible', 'reservada', 'expirada') DEFAULT 'disponible',
valido_hasta DATETIME,
reserva_aprovechada_id INT NULL,
motivo_descuento TEXT,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
INDEX idx_codigo (codigo),
INDEX idx_fecha_estado (fecha, estado),
INDEX idx_origen_destino (origen, destino),
INDEX idx_estado (estado),
INDEX idx_tipo (tipo),
INDEX idx_valido_hasta (valido_hasta)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Tabla de oportunidades de traslado (retornos e idas vacías)';
`);

console.log("✅ Tabla oportunidades creada exitosamente");
} else {
console.log("✅ Tabla oportunidades ya existe");
}
} catch (error) {
console.error("❌ Error al crear tabla oportunidades:", error);
throw error;
}
};

export default addOportunidadesTable;
