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
		acquire: 30000,
		idle: 10000,
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
export const syncDatabase = async (force = false) => {
	try {
		await sequelize.sync({ force });
		console.log("✅ Base de datos sincronizada correctamente.");
		return true;
	} catch (error) {
		console.error("❌ Error al sincronizar la base de datos:", error);
		return false;
	}
};

export default sequelize;
