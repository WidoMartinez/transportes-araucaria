/* eslint-env node */
/* global process */
/**
 * Migración: Crear tabla promociones_banner
 * 
 * Tabla para gestionar banners promocionales con reserva rápida
 * Separada del modelo Promocion existente (descuentos por día)
 */
import sequelize from "../config/database.js";

const createPromocionesBannerTable = async () => {
try {
console.log("🔄 Iniciando migración: crear tabla promociones_banner...");

// Crear tabla promociones_banner
await sequelize.query(`
CREATE TABLE IF NOT EXISTS promociones_banner (
id INT AUTO_INCREMENT PRIMARY KEY,
nombre VARCHAR(255) NOT NULL COMMENT 'Nombre de la promoción',
imagen_url VARCHAR(500) NOT NULL COMMENT 'URL de la imagen del banner',
precio DECIMAL(10,2) NOT NULL COMMENT 'Precio promocional',
tipo_viaje ENUM('ida', 'ida_vuelta') NOT NULL COMMENT 'Tipo de viaje',
destino VARCHAR(100) NOT NULL COMMENT 'Destino del viaje',
origen VARCHAR(100) DEFAULT 'Temuco' COMMENT 'Origen del viaje',
max_pasajeros INT DEFAULT 3 COMMENT 'Número máximo de pasajeros',
activo BOOLEAN DEFAULT TRUE COMMENT 'Si la promoción está activa',
orden INT DEFAULT 0 COMMENT 'Orden de visualización',
fecha_inicio DATE NULL COMMENT 'Fecha de inicio de vigencia (opcional)',
fecha_fin DATE NULL COMMENT 'Fecha de fin de vigencia (opcional)',
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
INDEX idx_activo (activo),
INDEX idx_orden (orden),
INDEX idx_vigencia (fecha_inicio, fecha_fin)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Banners promocionales con reserva rápida';
`);

console.log("✅ Tabla 'promociones_banner' creada correctamente");
} catch (error) {
console.error("❌ Error al crear tabla promociones_banner:", error);
throw error;
}
};

export default createPromocionesBannerTable;

// Permitir ejecución directa del archivo
if (import.meta.url === `file://${process.argv[1]}`) {
import("../config/database.js").then(() => {
createPromocionesBannerTable()
.then(() => {
console.log("✅ Migración completada exitosamente");
process.exit(0);
})
.catch((error) => {
console.error("❌ Migración falló:", error);
process.exit(1);
});
});
}
