import PendingEmail from "../models/PendingEmail.js";
import { Op } from "sequelize";
import sequelize from "../config/database.js";

/**
 * Limpia correos antiguos de la tabla pending_emails
 * Elimina registros con estados finales (sent, cancelled, failed) 
 * que tengan más de 7 días de antigüedad
 */
export const cleanOldEmails = async () => {
    try {
        // Verificar conexión a la base de datos
        try {
            await sequelize.authenticate();
        } catch (connectionError) {
            console.warn("⚠️ Limpiador de correos: sin conexión a BD. Saltando limpieza...");
            return;
        }

        // Calcular fecha límite (7 días atrás)
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        
        // Eliminar correos antiguos con estados finales
        const deleted = await PendingEmail.destroy({
            where: {
                status: { [Op.in]: ["sent", "cancelled", "failed"] },
                updatedAt: { [Op.lt]: sevenDaysAgo }
            }
        });
        
        if (deleted > 0) {
            console.log(`🧹 Limpiados ${deleted} correos antiguos de pending_emails (más de 7 días)`);
        }
        
        return deleted;
    } catch (error) {
        console.error("❌ Error en limpieza de correos antiguos:", error.message);
        return 0;
    }
};

/**
 * Obtiene estadísticas de la tabla pending_emails
 * Útil para monitoreo y debugging
 */
export const getEmailStats = async () => {
    try {
        await sequelize.authenticate();
        
        const stats = await PendingEmail.findAll({
            attributes: [
                'status',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            group: ['status']
        });
        
        const statsObject = {};
        stats.forEach(stat => {
            statsObject[stat.status] = parseInt(stat.get('count'));
        });
        
        console.log("📊 Estadísticas de correos pendientes:", statsObject);
        return statsObject;
    } catch (error) {
        console.error("❌ Error obteniendo estadísticas de correos:", error.message);
        return null;
    }
};
