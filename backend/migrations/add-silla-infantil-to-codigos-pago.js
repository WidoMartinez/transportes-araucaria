
import { DataTypes } from "sequelize";

export default async function up(queryInterface, sequelize) {
    try {
        const tableDescription = await queryInterface.describeTable("codigos_pago");
        if (!tableDescription.silla_infantil) {
            await queryInterface.addColumn("codigos_pago", "silla_infantil", {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
                comment: "Si incluye silla de niño",
            });
            console.log("✅ Columna 'silla_infantil' agregada a 'codigos_pago'");
        } else {
            console.log("ℹ️ La columna 'silla_infantil' ya existe en 'codigos_pago'");
        }
    } catch (error) {
        console.error("❌ Error agregando columna 'silla_infantil':", error);
    }
}
