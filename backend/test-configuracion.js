/* eslint-env node */
/* global process */
// backend/test-configuracion.js - Test para configuración de WhatsApp intercept
import dotenv from "dotenv";
import { testConnection } from "./config/database.js";
import Configuracion from "./models/Configuracion.js";

dotenv.config();

console.log("🧪 Probando sistema de configuración...\n");

const testConfiguracion = async () => {
try {
// 1. Probar conexión
console.log("1️⃣ Probando conexión a la base de datos...");
const connected = await testConnection();
if (!connected) {
throw new Error("No se pudo conectar a la base de datos");
}
console.log("✅ Conexión exitosa\n");

// 2. Sincronizar modelo
console.log("2️⃣ Sincronizando modelo Configuracion...");
await Configuracion.sync({ alter: true });
console.log("✅ Modelo sincronizado\n");

// 3. Establecer valor de prueba
console.log("3️⃣ Estableciendo configuración de prueba...");
await Configuracion.setValor(
"whatsapp_intercept_activo",
true,
"boolean",
"Controla si el modal de intercepción de WhatsApp está activo"
);
console.log("✅ Configuración establecida\n");

// 4. Obtener valor
console.log("4️⃣ Obteniendo configuración...");
const valor = await Configuracion.getValorParseado(
"whatsapp_intercept_activo",
false
);
console.log(`✅ Valor obtenido: ${valor}`);
console.log(`   Tipo: ${typeof valor}\n`);

// 5. Cambiar valor a false
console.log("5️⃣ Cambiando configuración a false...");
await Configuracion.setValor(
"whatsapp_intercept_activo",
false,
"boolean"
);
const nuevoValor = await Configuracion.getValorParseado(
"whatsapp_intercept_activo",
true
);
console.log(`✅ Nuevo valor: ${nuevoValor}`);
console.log(`   Tipo: ${typeof nuevoValor}\n`);

// 6. Restaurar valor a true
console.log("6️⃣ Restaurando configuración a true...");
await Configuracion.setValor(
"whatsapp_intercept_activo",
true,
"boolean"
);
const valorRestaurado = await Configuracion.getValorParseado(
"whatsapp_intercept_activo",
false
);
console.log(`✅ Valor restaurado: ${valorRestaurado}\n`);

// 7. Verificar que se guardó correctamente en BD
console.log("7️⃣ Verificando registro en base de datos...");
const config = await Configuracion.findOne({
where: { clave: "whatsapp_intercept_activo" },
});
if (config) {
console.log("✅ Registro encontrado:");
console.log(`   Clave: ${config.clave}`);
console.log(`   Valor: ${config.valor}`);
console.log(`   Tipo: ${config.tipo}`);
console.log(`   Descripción: ${config.descripcion}\n`);
} else {
throw new Error("No se encontró el registro en la base de datos");
}

console.log("🎉 ¡Todas las pruebas pasaron exitosamente!\n");
process.exit(0);
} catch (error) {
console.error("❌ Error en las pruebas:", error);
process.exit(1);
}
};

testConfiguracion();
