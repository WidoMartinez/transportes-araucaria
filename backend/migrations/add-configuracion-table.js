// backend/migrations/add-configuracion-table.js
import Configuracion from "../models/Configuracion.js";

/**
 * Migración para crear tabla de configuración general del sistema
 * Incluye inicialización de configuración de modal WhatsApp
 */
async function addConfiguracionTable() {
try {
console.log("🔄 Iniciando migración: tabla configuracion...");

// Sincronizar modelo (crear tabla si no existe)
await Configuracion.sync({ alter: true });

console.log("✅ Tabla configuracion creada/actualizada");

// Inicializar configuración de modal WhatsApp (activo por defecto)
await Configuracion.setValor(
"whatsapp_intercept_activo",
true,
"boolean",
"Controla si el modal de intercepción de WhatsApp está activo"
);

console.log("✅ Configuración inicial de WhatsApp establecida (activo: true)");

return true;
} catch (error) {
console.error("❌ Error en migración add-configuracion-table:", error);
return false;
}
}

export default addConfiguracionTable;
