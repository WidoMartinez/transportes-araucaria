
import dotenv from "dotenv";
import { syncDatabase } from "./config/database.js";
import Reserva from "./models/Reserva.js";

dotenv.config({ path: "backend/.env" });

console.log("🔄 Iniciando sincronización forzada de modelo Reserva...");

syncDatabase(false, [Reserva])
  .then(() => {
    console.log("✅ Sincronización finalizada.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Error:", err);
    process.exit(1);
  });
