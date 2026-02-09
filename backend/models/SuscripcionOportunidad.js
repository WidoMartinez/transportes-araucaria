import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

// Modelo para suscripciones a alertas de oportunidades
const SuscripcionOportunidad = sequelize.define(
"SuscripcionOportunidad",
{
id: {
type: DataTypes.INTEGER,
primaryKey: true,
autoIncrement: true,
},
email: {
type: DataTypes.STRING(255),
allowNull: false,
comment: "Email del suscriptor",
},
nombre: {
type: DataTypes.STRING(255),
allowNull: true,
comment: "Nombre del suscriptor",
},
rutas: {
type: DataTypes.JSON,
allowNull: false,
comment: "Array de rutas de interés [{origen, destino}]",
},
descuentoMinimo: {
type: DataTypes.INTEGER,
defaultValue: 40,
field: "descuento_minimo",
comment: "Descuento mínimo para recibir notificación",
},
activa: {
type: DataTypes.BOOLEAN,
defaultValue: true,
comment: "Si la suscripción está activa",
},
},
{
tableName: "suscripciones_oportunidades",
timestamps: true,
createdAt: "created_at",
updatedAt: "updated_at",
indexes: [
{ fields: ["email"] },
{ fields: ["activa"] },
],
}
);

export default SuscripcionOportunidad;
