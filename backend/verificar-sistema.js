#!/usr/bin/env node
/**
 * Script de Verificación del Sistema
 * 
 * Verifica la configuración y estructura del sistema sin necesidad de conectar a la BD.
 * Útil para verificar que todos los archivos y configuraciones están correctos.
 */

import { readFile, access } from "fs/promises";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colores
const colors = {
	reset: "\x1b[0m",
	green: "\x1b[32m",
	red: "\x1b[31m",
	yellow: "\x1b[33m",
	cyan: "\x1b[36m",
	bright: "\x1b[1m",
};

function log(message, color = colors.reset) {
	console.log(`${color}${message}${colors.reset}`);
}

function logSection(title) {
	console.log("\n" + "=".repeat(70));
	log(title, colors.bright + colors.cyan);
	console.log("=".repeat(70));
}

function logSuccess(message) {
	log(`✅ ${message}`, colors.green);
}

function logError(message) {
	log(`❌ ${message}`, colors.red);
}

function logWarning(message) {
	log(`⚠️  ${message}`, colors.yellow);
}

function logInfo(message) {
	log(`ℹ️  ${message}`, colors.cyan);
}

/**
 * Verificar archivos del sistema
 */
async function verificarArchivos() {
	logSection("1. VERIFICACIÓN DE ARCHIVOS DEL SISTEMA");
	
	const archivosRequeridos = [
		{ path: "config/database.js", desc: "Configuración de base de datos" },
		{ path: "models/Destino.js", desc: "Modelo Destino" },
		{ path: "models/Promocion.js", desc: "Modelo Promocion" },
		{ path: "models/CodigoDescuento.js", desc: "Modelo CodigoDescuento" },
		{ path: "models/DescuentoGlobal.js", desc: "Modelo DescuentoGlobal" },
		{ path: "models/Reserva.js", desc: "Modelo Reserva" },
		{ path: "server-db.js", desc: "Servidor principal con BD" },
		{ path: "migrate.js", desc: "Script de migración" },
		{ path: "test-db.js", desc: "Script de pruebas" },
		{ path: "package.json", desc: "Configuración del proyecto" },
	];
	
	const archivosExistentes = [];
	const archivosFaltantes = [];
	
	for (const archivo of archivosRequeridos) {
		try {
			await access(path.join(__dirname, archivo.path));
			logSuccess(`${archivo.desc}: ${archivo.path}`);
			archivosExistentes.push(archivo);
		} catch {
			logError(`${archivo.desc}: ${archivo.path} NO ENCONTRADO`);
			archivosFaltantes.push(archivo);
		}
	}
	
	return { archivosExistentes, archivosFaltantes };
}

/**
 * Verificar variables de entorno
 */
async function verificarVariablesEntorno() {
	logSection("2. VERIFICACIÓN DE VARIABLES DE ENTORNO");
	
	try {
		await access(path.join(__dirname, ".env"));
		logSuccess("Archivo .env encontrado");
		
		const envContent = await readFile(path.join(__dirname, ".env"), "utf-8");
		
		const variablesRequeridas = [
			"DB_HOST",
			"DB_NAME",
			"DB_USER",
			"DB_PASSWORD",
		];
		
		const variablesEncontradas = [];
		const variablesFaltantes = [];
		
		for (const variable of variablesRequeridas) {
			if (envContent.includes(`${variable}=`)) {
				// Verificar que no esté vacía o con valor por defecto
				const match = envContent.match(new RegExp(`${variable}=(.+)`));
				if (match && match[1] && !match[1].includes("tu_") && match[1].trim() !== "") {
					logSuccess(`${variable} está configurada`);
					variablesEncontradas.push(variable);
				} else {
					logWarning(`${variable} está presente pero sin valor válido`);
					variablesFaltantes.push(variable);
				}
			} else {
				logError(`${variable} no está configurada`);
				variablesFaltantes.push(variable);
			}
		}
		
		return { variablesEncontradas, variablesFaltantes };
	} catch {
		logError("Archivo .env no encontrado");
		logInfo("Copia env.example a .env y configura las variables");
		return { variablesEncontradas: [], variablesFaltantes: [] };
	}
}

/**
 * Verificar estructura de package.json
 */
async function verificarPackageJson() {
	logSection("3. VERIFICACIÓN DE PACKAGE.JSON");
	
	try {
		const packageContent = await readFile(
			path.join(__dirname, "package.json"),
			"utf-8"
		);
		const packageData = JSON.parse(packageContent);
		
		// Verificar script de inicio
		if (packageData.scripts?.start === "node server-db.js") {
			logSuccess("Script de inicio correcto: node server-db.js");
		} else {
			logWarning(
				`Script de inicio: ${packageData.scripts?.start || "NO DEFINIDO"}`
			);
			logInfo("Debería ser: node server-db.js");
		}
		
		// Verificar dependencias críticas
		const dependenciasCriticas = ["sequelize", "mysql2", "express", "dotenv"];
		
		for (const dep of dependenciasCriticas) {
			if (packageData.dependencies?.[dep]) {
				logSuccess(`Dependencia ${dep}: ${packageData.dependencies[dep]}`);
			} else {
				logError(`Dependencia ${dep} no encontrada`);
			}
		}
		
		// Verificar scripts útiles
		const scriptsUtiles = ["migrate", "test:db", "verificar"];
		
		logInfo("\nScripts disponibles:");
		for (const script of scriptsUtiles) {
			if (packageData.scripts?.[script]) {
				logSuccess(`  npm run ${script}: ${packageData.scripts[script]}`);
			} else {
				logWarning(`  npm run ${script}: NO DISPONIBLE`);
			}
		}
		
		return true;
	} catch (error) {
		logError("Error al leer package.json");
		return false;
	}
}

/**
 * Verificar modelos de Sequelize
 */
async function verificarModelos() {
	logSection("4. VERIFICACIÓN DE MODELOS");
	
	const modelos = [
		{ file: "models/Destino.js", name: "Destino" },
		{ file: "models/Promocion.js", name: "Promocion" },
		{ file: "models/CodigoDescuento.js", name: "CodigoDescuento" },
		{ file: "models/DescuentoGlobal.js", name: "DescuentoGlobal" },
		{ file: "models/Reserva.js", name: "Reserva" },
	];
	
	const modelosValidos = [];
	const modelosInvalidos = [];
	
	for (const modelo of modelos) {
		try {
			const content = await readFile(path.join(__dirname, modelo.file), "utf-8");
			
			// Verificar que importe sequelize
			if (content.includes("from \"sequelize\"") || content.includes("from 'sequelize'")) {
				logSuccess(`Modelo ${modelo.name} importa Sequelize`);
			} else {
				logWarning(`Modelo ${modelo.name} no importa Sequelize`);
			}
			
			// Verificar que defina el modelo
			if (content.includes("sequelize.define") || content.includes(".define(")) {
				logSuccess(`Modelo ${modelo.name} define la estructura`);
			} else {
				logWarning(`Modelo ${modelo.name} no define estructura`);
			}
			
			// Verificar export
			if (content.includes("export default")) {
				logSuccess(`Modelo ${modelo.name} exporta correctamente`);
			} else {
				logWarning(`Modelo ${modelo.name} no tiene export default`);
			}
			
			modelosValidos.push(modelo);
		} catch (error) {
			logError(`Error al verificar modelo ${modelo.name}`);
			modelosInvalidos.push(modelo);
		}
	}
	
	return { modelosValidos, modelosInvalidos };
}

/**
 * Verificar sistema de migración
 */
async function verificarSistemaMigracion() {
	logSection("5. VERIFICACIÓN DE SISTEMA DE MIGRACIÓN");
	
	try {
		// Verificar migrate.js
		await access(path.join(__dirname, "migrate.js"));
		logSuccess("Script de migración (migrate.js) encontrado");
		
		const migrateContent = await readFile(
			path.join(__dirname, "migrate.js"),
			"utf-8"
		);
		
		if (migrateContent.includes("syncDatabase")) {
			logSuccess("Función syncDatabase presente");
		}
		
		if (migrateContent.includes("testConnection")) {
			logSuccess("Función testConnection presente");
		}
		
		if (migrateContent.includes("pricing.json")) {
			logSuccess("Migración desde pricing.json implementada");
		}
		
		// Verificar si existe el archivo de datos
		try {
			await access(path.join(__dirname, "data", "pricing.json"));
			logInfo("Archivo pricing.json encontrado (para migración)");
		} catch {
			logWarning("Archivo pricing.json no encontrado");
			logInfo("Si es primera instalación, esto es normal");
		}
		
		return true;
	} catch {
		logError("Script de migración no encontrado");
		return false;
	}
}

/**
 * Verificar documentación
 */
async function verificarDocumentacion() {
	logSection("6. VERIFICACIÓN DE DOCUMENTACIÓN");
	
	const documentos = [
		{ file: "MIGRATION_README.md", desc: "Guía de migración" },
		{ file: "VERIFICACION_BD.md", desc: "Guía de verificación de BD" },
		{ file: "README.md", desc: "README principal" },
	];
	
	for (const doc of documentos) {
		try {
			await access(path.join(__dirname, doc.file));
			logSuccess(`${doc.desc}: ${doc.file}`);
		} catch {
			// Verificar en directorio padre
			try {
				await access(path.join(__dirname, "..", doc.file));
				logSuccess(`${doc.desc}: ../${doc.file}`);
			} catch {
				logWarning(`${doc.desc} no encontrado`);
			}
		}
	}
}

/**
 * Generar reporte final
 */
function generarReporte(resultados) {
	logSection("REPORTE FINAL");
	
	const {
		archivos,
		variables,
		packageJson,
		modelos,
		migracion,
	} = resultados;
	
	console.log("\n📊 RESUMEN:");
	console.log(`   • Archivos del sistema: ${archivos.archivosExistentes.length}/10`);
	console.log(`   • Variables de entorno: ${variables.variablesEncontradas.length}/4`);
	console.log(`   • Package.json: ${packageJson ? "✅ OK" : "❌ ERROR"}`);
	console.log(`   • Modelos: ${modelos.modelosValidos.length}/5`);
	console.log(`   • Sistema de migración: ${migracion ? "✅ OK" : "❌ ERROR"}`);
	
	console.log("\n📋 SIGUIENTE PASO:");
	
	if (archivos.archivosFaltantes.length > 0) {
		logError("Faltan archivos críticos del sistema");
		logInfo("Verifica que clonaste correctamente el repositorio");
	} else if (variables.variablesFaltantes.length > 0) {
		logWarning("Configura las variables de entorno faltantes");
		logInfo("1. Copia env.example a .env");
		logInfo("2. Completa las credenciales de Hostinger");
		logInfo("3. Ejecuta: npm run verificar");
	} else {
		logSuccess("\n🎉 ¡Sistema correctamente configurado!");
		logInfo("\nPara verificar la conexión a la base de datos, ejecuta:");
		logInfo("  npm run verificar");
		logInfo("\nPara migrar datos desde JSON:");
		logInfo("  npm run migrate");
		logInfo("\nPara iniciar el servidor:");
		logInfo("  npm start");
	}
}

/**
 * Función principal
 */
async function main() {
	console.clear();
	log("╔═══════════════════════════════════════════════════════════════════╗", colors.bright + colors.cyan);
	log("║        VERIFICACIÓN DE SISTEMA - TRANSPORTES ARAUCARIA           ║", colors.bright + colors.cyan);
	log("║              (Sin conexión a base de datos)                      ║", colors.bright + colors.cyan);
	log("╚═══════════════════════════════════════════════════════════════════╝", colors.bright + colors.cyan);
	log(`\nFecha: ${new Date().toLocaleString("es-CL")}`, colors.cyan);
	
	const resultados = {
		archivos: { archivosExistentes: [], archivosFaltantes: [] },
		variables: { variablesEncontradas: [], variablesFaltantes: [] },
		packageJson: false,
		modelos: { modelosValidos: [], modelosInvalidos: [] },
		migracion: false,
	};
	
	try {
		// Verificaciones
		resultados.archivos = await verificarArchivos();
		resultados.variables = await verificarVariablesEntorno();
		resultados.packageJson = await verificarPackageJson();
		resultados.modelos = await verificarModelos();
		resultados.migracion = await verificarSistemaMigracion();
		await verificarDocumentacion();
		
		// Reporte
		generarReporte(resultados);
		
		process.exit(0);
	} catch (error) {
		logError("\n❌ Error fatal durante la verificación:");
		console.error(error);
		process.exit(1);
	}
}

// Ejecutar
if (import.meta.url === `file://${process.argv[1]}`) {
	main().catch((error) => {
		console.error("Error fatal:", error);
		process.exit(1);
	});
}

export default main;
