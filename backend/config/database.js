import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

// Configuración de la base de datos MySQL en Hostinger
const sequelize = new Sequelize({
	database: process.env.DB_NAME || "u419311572_transportes_araucaria",
	username: process.env.DB_USER || "u419311572_admin",
	password: process.env.DB_PASSWORD,
	host: process.env.DB_HOST || "srv1551.hstgr.io",
	port: process.env.DB_PORT || 3306,
	dialect: "mysql",
	logging: false, // Cambiar a console.log para ver las consultas SQL
	pool: {
		max: 5,
		min: 0,
		acquire: 60000, // Aumentado a 60 segundos
		idle: 10000,
	},
	dialectOptions: {
		connectTimeout: 60000, // Timeout de conexión: 60 segundos
	},
	retry: {
		max: 3, // Número máximo de reintentos
	},
	define: {
		timestamps: true,
		underscored: true,
		freezeTableName: true,
	},
});

// Función para probar la conexión
export const testConnection = async () => {
	try {
		await sequelize.authenticate();
		console.log("✅ Conexión a la base de datos establecida correctamente.");
		return true;
	} catch (error) {
		console.error("❌ Error al conectar con la base de datos:", error);
		return false;
	}
};

// Función para sincronizar los modelos con la base de datos
export const syncDatabase = async (force = false, models = []) => {
	try {
		// Si se proporcionan modelos específicos, sincronizarlos en orden
		if (models && models.length > 0) {
			console.log(`🔄 Sincronizando ${models.length} modelos...`);
			for (const model of models) {
				try {
					// alter: true creará la tabla si no existe, o la modificará si ya existe
					// force: true eliminará y recreará la tabla (solo usar en desarrollo)
					await model.sync({ force, alter: !force });
					console.log(`✅ Modelo ${model.name} sincronizado`);
				} catch (modelError) {
					console.error(`❌ Error sincronizando modelo ${model.name}:`, modelError.message);
					// Intentar sin alter si falla (para tablas nuevas)
					try {
						await model.sync({ force: false, alter: false });
						console.log(`✅ Modelo ${model.name} creado sin alter`);
					} catch (retryError) {
						console.error(`❌ Error crítico en ${model.name}:`, retryError.message);
					}
				}
			}
		} else {
			// Sincronización general de todos los modelos registrados
			await sequelize.sync({ force, alter: !force });
		}
		console.log("✅ Base de datos sincronizada correctamente.");
		return true;
	} catch (error) {
		console.error("❌ Error al sincronizar la base de datos:", error);
		return false;
	}
};

export default sequelize;
