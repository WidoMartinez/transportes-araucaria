// backend/models/Configuracion.js
import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

/**
 * Modelo para configuraciones generales del sistema
 * Almacena configuraciones clave-valor para diferentes funcionalidades
 */
const Configuracion = sequelize.define(
"configuracion",
{
id: {
type: DataTypes.INTEGER,
primaryKey: true,
autoIncrement: true,
},
clave: {
type: DataTypes.STRING(100),
allowNull: false,
unique: true,
comment: "Clave única de configuración (ej: whatsapp_intercept_activo)",
},
valor: {
type: DataTypes.TEXT,
allowNull: true,
comment: "Valor de la configuración (puede ser string, número, JSON, etc.)",
},
tipo: {
type: DataTypes.ENUM("string", "number", "boolean", "json"),
allowNull: false,
defaultValue: "string",
comment: "Tipo de dato del valor para facilitar parsing",
},
descripcion: {
type: DataTypes.STRING(255),
allowNull: true,
comment: "Descripción legible de la configuración",
},
},
{
tableName: "configuracion",
timestamps: true,
indexes: [
{
unique: true,
fields: ["clave"],
},
],
}
);

/**
 * Helper para obtener valor parseado según su tipo
 */
Configuracion.getValorParseado = async (clave, valorDefault = null) => {
try {
const config = await Configuracion.findOne({ where: { clave } });

if (!config) {
return valorDefault;
}

// Parsear según el tipo
switch (config.tipo) {
case "boolean":
return config.valor === "true" || config.valor === "1" || config.valor === true;
case "number":
return parseFloat(config.valor);
case "json":
return JSON.parse(config.valor);
default:
return config.valor;
}
} catch (error) {
console.error(`Error obteniendo configuración ${clave}:`, error);
return valorDefault;
}
};

/**
 * Helper para establecer valor de configuración
 */
Configuracion.setValor = async (clave, valor, tipo = "string", descripcion = null) => {
try {
// Convertir valor a string según el tipo
let valorString = valor;
if (tipo === "boolean") {
valorString = valor ? "true" : "false";
} else if (tipo === "number") {
valorString = valor.toString();
} else if (tipo === "json") {
valorString = JSON.stringify(valor);
}

// Buscar o crear la configuración
const [config, created] = await Configuracion.findOrCreate({
where: { clave },
defaults: {
valor: valorString,
tipo,
descripcion,
},
});

// Si ya existía, actualizar
if (!created) {
config.valor = valorString;
config.tipo = tipo;
if (descripcion !== null) {
config.descripcion = descripcion;
}
await config.save();
}

return config;
} catch (error) {
console.error(`Error estableciendo configuración ${clave}:`, error);
throw error;
}
};

export default Configuracion;
