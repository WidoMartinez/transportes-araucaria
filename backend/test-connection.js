import { testConnection } from "./config/database.js";

console.log("🔌 Probando conexión a la base de datos...");

testConnection()
	.then((connected) => {
		if (connected) {
			console.log("✅ ¡Conexión exitosa!");
			process.exit(0);
		} else {
			console.log("❌ Error en la conexión");
			process.exit(1);
		}
	})
	.catch((error) => {
		console.error("❌ Error:", error.message);
		process.exit(1);
	});
