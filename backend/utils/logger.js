import pino from "pino";

const logger = pino({
        level: process.env.LOG_LEVEL || "info",
        base: {
                env: process.env.NODE_ENV || "development",
        },
        timestamp: pino.stdTimeFunctions.isoTime,
        redact: {
                paths: ["password", "pass", "token", "secret", "apiKey"],
                censor: "[redacted]",
        },
});

export const createLogger = (bindings = {}) => logger.child(bindings);

export default logger;
