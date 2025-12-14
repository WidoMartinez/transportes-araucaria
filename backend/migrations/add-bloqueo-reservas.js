/* eslint-env node */
// Migración para agregar campos de bloqueo de reservas a la tabla festivos
import sequelize from "../config/database.js";

const addBloqueoReservas = async () => {
try {
sole.log("🔄 Agregando campos de bloqueo de reservas a tabla festivos...");

Verificar si la tabla festivos existe
st [tables] = await sequelize.query(`
TABLES LIKE 'festivos';
(tables.length === 0) {
sole.log("⚠️  Tabla festivos no existe. Ejecute primero add-festivos-table.js");
;
Verificar columnas existentes
st [columns] = await sequelize.query(`
COLUMNS FROM festivos;
st columnNames = columns.map(col => col.Field);

Agregar columna bloqueaReservas si no existe
(!columnNames.includes('bloquea_reservas')) {
sole.log("📋 Agregando columna bloquea_reservas...");
sequelize.query(`
TABLE festivos 
COLUMN bloquea_reservas BOOLEAN DEFAULT FALSE 
T 'Indica si la fecha bloquea reservas';
sole.log("✅ Columna bloquea_reservas agregada");
else {
sole.log("ℹ️  Columna bloquea_reservas ya existe");
Agregar columna horaInicio si no existe
(!columnNames.includes('hora_inicio')) {
sole.log("📋 Agregando columna hora_inicio...");
sequelize.query(`
TABLE festivos 
COLUMN hora_inicio TIME NULL 
T 'Hora de inicio del bloqueo (NULL = todo el día)';
sole.log("✅ Columna hora_inicio agregada");
else {
sole.log("ℹ️  Columna hora_inicio ya existe");
Agregar columna horaFin si no existe
(!columnNames.includes('hora_fin')) {
sole.log("📋 Agregando columna hora_fin...");
sequelize.query(`
TABLE festivos 
COLUMN hora_fin TIME NULL 
T 'Hora de fin del bloqueo (NULL = todo el día)';
sole.log("✅ Columna hora_fin agregada");
else {
sole.log("ℹ️  Columna hora_fin ya existe");
Agregar columna aplicaSoloDestinos si no existe
(!columnNames.includes('aplica_solo_destinos')) {
sole.log("📋 Agregando columna aplica_solo_destinos...");
sequelize.query(`
TABLE festivos 
COLUMN aplica_solo_destinos JSON NULL 
T 'Array de destinos afectados (NULL = todos los destinos)';
sole.log("✅ Columna aplica_solo_destinos agregada");
else {
sole.log("ℹ️  Columna aplica_solo_destinos ya existe");
Agregar índice para bloquea_reservas si no existe
st [indexes] = await sequelize.query(`
INDEX FROM festivos WHERE Key_name = 'idx_bloquea_reservas';
(indexes.length === 0) {
sole.log("📋 Agregando índice para bloquea_reservas...");
sequelize.query(`
TABLE festivos 
INDEX idx_bloquea_reservas (bloquea_reservas);
sole.log("✅ Índice agregado");
else {
sole.log("ℹ️  Índice para bloquea_reservas ya existe");
Insertar el 1 de enero de 2026 como fecha bloqueada por defecto
sole.log("📋 Verificando fecha bloqueada por defecto (1 de enero 2026)...");
st [existingDate] = await sequelize.query(`
id FROM festivos 
fecha = '2026-01-01';
(existingDate.length === 0) {
sequelize.query(`
SERT INTO festivos (

ombre, 

te, 



VALUES (
Nuevo',
acional',
bloqueada para reservas - Año Nuevo 2026'
sole.log("✅ Fecha bloqueada insertada: 1 de enero 2026");
else {
Si ya existe, actualizar para asegurar que bloquea reservas
sequelize.query(`
festivos 
bloquea_reservas = TRUE,
   descripcion = 'Fecha bloqueada para reservas - Año Nuevo 2026'
fecha = '2026-01-01';
sole.log("✅ Fecha actualizada: 1 de enero 2026 ahora bloquea reservas");
sole.log("✅ Migración de bloqueo de reservas completada exitosamente");
} catch (error) {
sole.error("❌ Error en migración de bloqueo de reservas:", error.message);
error;
}
};

export default addBloqueoReservas;
