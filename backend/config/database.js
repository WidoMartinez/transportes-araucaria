import mongoose from "mongoose";
import logger from "../utils/logger.js";

mongoose.set("strictQuery", true);

const DEFAULT_URI =
        process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/transportes-araucaria";
const DEFAULT_DB_NAME = process.env.MONGODB_DB_NAME || "transportes";

let connectionPromise;

export const connectToDatabase = async () => {
        if (!connectionPromise) {
                connectionPromise = mongoose.connect(DEFAULT_URI, {
                        dbName: DEFAULT_DB_NAME,
                        autoIndex: true,
                });

                mongoose.connection.on("connected", () => {
                        logger.info("Conexión establecida con MongoDB");
                });

                mongoose.connection.on("error", (error) => {
                        logger.error({ error }, "Error en la conexión a MongoDB");
                });

                mongoose.connection.on("disconnected", () => {
                        logger.warn("Conexión con MongoDB cerrada");
                });

                process.on("SIGINT", async () => {
                        await mongoose.connection.close();
                        logger.info("Conexión con MongoDB finalizada por SIGINT");
                        process.exit(0);
                });
        }

        return connectionPromise;
};

export default connectToDatabase;
