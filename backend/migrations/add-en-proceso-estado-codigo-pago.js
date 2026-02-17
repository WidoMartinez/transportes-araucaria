import sequelize from "../config/database.js";

/**
 * Migración: Agregar estado "en_proceso" al enum de codigos_pago
 * 
 * Este estado temporal se usa para prevenir la creación de reservas duplicadas
 * cuando múltiples solicitudes intentan usar el mismo código simultáneamente.
 */
export default async function addEnProcesoEstado() {
const queryInterface = sequelize.getQueryInterface();

try {
console.log("📝 Actualizando ENUM de estado en codigos_pago para agregar 'en_proceso'...");

// Verificar si la columna existe
const tableDescription = await queryInterface.describeTable("codigos_pago");

if (!tableDescription.estado) {
console.log("⚠️ Columna 'estado' no existe, saltando migración");
return;
}

// Modificar el ENUM para incluir el nuevo estado
await queryInterface.sequelize.query(`
ALTER TABLE codigos_pago 
MODIFY COLUMN estado 
ENUM('activo', 'en_proceso', 'usado', 'vencido', 'cancelado') 
DEFAULT 'activo'
COMMENT 'Estado del código de pago (en_proceso previene duplicados)'
`);

console.log("✅ Estado 'en_proceso' agregado exitosamente al modelo CodigoPago");

// Verificar cuántos códigos podrían estar en estado inconsistente
const [results] = await queryInterface.sequelize.query(`
SELECT COUNT(*) as count 
FROM codigos_pago 
WHERE estado NOT IN ('activo', 'usado', 'vencido', 'cancelado')
`);

if (results[0].count > 0) {
console.log(`⚠️ Se encontraron ${results[0].count} códigos en estado inconsistente`);
}

} catch (error) {
if (error.message.includes("ENUM")) {
console.error("❌ Error modificando ENUM. Puede que la base de datos ya tenga el estado 'en_proceso'");
} else {
console.error("❌ Error en migración add-en-proceso-estado:", error);
throw error;
}
}
}
